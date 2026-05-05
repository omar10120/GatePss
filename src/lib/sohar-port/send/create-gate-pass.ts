
import { SoharPortHttpClient } from '../client';
import { CreateGatePassRequest, CreateGatePassResponse } from '../types';
import { getEndpointUrl } from '../config';
import { logSuccess, logError } from '../utils/logger';
import { logger } from '../../logger';
import { Storage } from '../../storage';

const env = ((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env) || {};

/** Debug: omit attachment binaries (JSON without attachment fields). */
function shouldSkipAttachmentsForDebug(): boolean {
    const v = env.SOHAR_PORT_SKIP_ATTACHMENTS?.trim()?.toLowerCase();
    return v === 'true' || v === '1' || v === 'yes';
}

function getGatepassFilesPublicBaseUrl(): string {
    return (
        env.GATEPASS_FILES_BASE_URL?.trim() ||
        env.NEXT_PUBLIC_APP_URL?.trim() ||
        ''
    );
}

function getFileName(filePath: string): string {
    const normalized = String(filePath || '').replace(/\\/g, '/');
    const parts = normalized.split('/');
    return parts[parts.length - 1] || '';
}

/**
 * Strip wrappers so DB paths like `passports/foo.jpg` or `uploads/passports/foo.jpg` resolve under Storage.
 */
function normalizeRelativeUploadPath(localPath: string): string | null {
    let p = String(localPath).replace(/\\/g, '/').trim();
    if (!p || /^https?:\/\//i.test(p) || /^data:/i.test(p)) return null;

    const apiUploads = '/api/uploads/';
    if (p.includes(apiUploads)) {
        p = p.slice(p.indexOf(apiUploads) + apiUploads.length);
    } else if (p.startsWith('api/uploads/')) {
        p = p.slice('api/uploads/'.length);
    }

    if (p.startsWith('/uploads/')) {
        p = p.slice('/uploads/'.length);
    } else if (p.startsWith('uploads/')) {
        p = p.slice('uploads/'.length);
    }

    p = p.replace(/^\/+/, '');
    return p === '' ? null : p;
}

/**
 * Resolve a stored file reference to base64 (same shape Sohar expects as via the old proxy).
 */
async function fileRefToBase64(ref: string, requestNumber: string): Promise<string | null> {
    const trimmed = String(ref || '').trim();
    if (!trimmed) return null;

    if (/^data:/i.test(trimmed)) {
        const m = trimmed.match(/^data:[^;]+;base64,(.+)$/i);
        return m?.[1] ? m[1] : null;
    }

    if (/^https?:\/\//i.test(trimmed)) {
        const base = getGatepassFilesPublicBaseUrl().replace(/\/$/, '');
        if (base && trimmed.startsWith(base)) {
            const relUrl = trimmed.slice(base.length).replace(/^\//, '');
            const inner = relUrl.replace(/^(api\/)?uploads\//, '');
            const rel = normalizeRelativeUploadPath(inner) || inner;
            try {
                return (await Storage.readFile(rel)).toString('base64');
            } catch (e) {
                logger.warn(`Sohar Port: could not read attachment for ${requestNumber} at ${rel}`, {
                    error: (e as Error).message,
                });
                return null;
            }
        }
        try {
            const res = await fetch(trimmed, { signal: AbortSignal.timeout(20000) });
            if (!res.ok) return null;
            return Buffer.from(await res.arrayBuffer()).toString('base64');
        } catch (e) {
            logger.warn(`Sohar Port: fetch attachment failed for ${requestNumber}`, {
                url: trimmed.slice(0, 120),
                error: (e as Error).message,
            });
            return null;
        }
    }

    const rel = normalizeRelativeUploadPath(trimmed);
    if (!rel) return null;
    try {
        return (await Storage.readFile(rel)).toString('base64');
    } catch (e) {
        logger.warn(`Sohar Port: could not read attachment for ${requestNumber} at ${rel}`, {
            error: (e as Error).message,
        });
        return null;
    }
}

/** Same shape as `extraFields.gateRequest` rows we read from the DB. */
interface GateRequestSource {
    entityType?: string;
    /** Company / organization name for Sohar `company` when set. */
    organization?: string;
    passportIdImagePath?: string;
    /** Optional; may duplicate PHOTO upload row — see `uploads`. */
    photoPath?: string | null;
    uploads?: Array<{ fileType: string; filePath: string }>;
    applicantNameEn?: string;
    applicantNameAr?: string;
    applicantPhone?: string;
    identification?: string;
    bloodType?: string;
    validTo?: string | Date;
    gender?: string;
    nationality?: string;
    otherProfessions?: string;
    profession?: string;
    visitduration?: string;
    passFor?: string;
}

function mapIdentificationType(identification: string): string {
    const idMap: Record<string, string> = {
        PASSPORT: '1',
        ID_CARD: '2',
        ID: '2',
        RESIDENCE: '3',
    };
    return idMap[identification.toUpperCase()] || '1';
}

function mapGender(gender: string): string {
    const genderMap: Record<string, string> = {
        MALE: 'Male',
        FEMALE: 'Female',
    };
    return genderMap[gender.toUpperCase()] || 'Male';
}

function isPermanentSoharPass(
    gateRequest: GateRequestSource | undefined,
    extraFields: Record<string, unknown>,
): boolean {
    if (typeof extraFields.isPermanentForSohar === 'boolean') {
        return extraFields.isPermanentForSohar;
    }
    const passType = extraFields.passType as { name_en?: string; name_ar?: string } | undefined;
    if (passType?.name_en) {
        const nameEn = passType.name_en.toLowerCase();
        const nameAr = passType.name_ar || '';
        return nameEn.includes('permanent') || nameAr.includes('دائم');
    }
    return !gateRequest?.visitduration;
}

function calculateMonthsValidity(gateRequest: GateRequestSource | undefined): string {
    const duration = gateRequest?.visitduration;
    const validityMap: Record<string, string> = {
        '1_DAY': '1',
        '2_DAY': '2',
        '3_DAY': '3',
        '4_DAY': '4',
        '5_DAY': '5',
        '10_DAY': '10',
        '1_MONTH': '30',
        '2_MONTH': '60',
        '3_MONTH': '90',
    };
    return validityMap[duration || ''] || '1';
}

function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
}

/** Redact PII and attachment payloads for structured logs. */
function maskPayloadForLog(payload: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = { ...payload };
    if (typeof out.identification_number === 'string') {
        out.identification_number = '[redacted]';
    }
    if (typeof out.email === 'string') {
        out.email = '[redacted]';
    }
    if (typeof out.phone === 'string') {
        out.phone = '[redacted]';
    }
    for (const k of [
        'identification_attachment',
        'photo_attachment',
        'other_attachment',
        'other_attachment2',
    ] as const) {
        if (typeof out[k] === 'string' && out[k]) {
            out[k] = '[base64 redacted]';
        }
    }
    return out;
}

/**
 * Read files from disk (or data URLs) and set Sohar base64 attachment fields + filename fields.
 */
async function attachDirectBase64Fields(
    payload: Record<string, unknown>,
    gateRequest: GateRequestSource | undefined,
    skipAttachments: boolean,
    requestNumber: string,
): Promise<void> {
    if (skipAttachments || !gateRequest) {
        return;
    }

    if (gateRequest.passportIdImagePath) {
        payload.identification_document = getFileName(gateRequest.passportIdImagePath);
        const b64 = await fileRefToBase64(gateRequest.passportIdImagePath, requestNumber);
        if (b64) {
            payload.identification_attachment = b64;
        }
    }

    const uploads = gateRequest.uploads;
    if (Array.isArray(uploads)) {
        const otherDocs = uploads.filter((u) => u.fileType.startsWith('OTHER'));
        if (otherDocs[0]?.filePath) {
            payload.other_documents = getFileName(otherDocs[0].filePath);
            const b64 = await fileRefToBase64(otherDocs[0].filePath, requestNumber);
            if (b64) payload.other_attachment = b64;
        }
        if (otherDocs[1]?.filePath) {
            payload.other_documents2 = getFileName(otherDocs[1].filePath);
            const b64 = await fileRefToBase64(otherDocs[1].filePath, requestNumber);
            if (b64) payload.other_attachment2 = b64;
        }

        const photoUpload = uploads.find((u) => u.fileType === 'PHOTO');
        if (photoUpload?.filePath) {
            payload.photo = getFileName(photoUpload.filePath);
            const b64 = await fileRefToBase64(photoUpload.filePath, requestNumber);
            if (b64) payload.photo_attachment = b64;
        }
    }

    if (!payload.photo_attachment && gateRequest.photoPath) {
        payload.photo = getFileName(gateRequest.photoPath);
        const b64 = await fileRefToBase64(gateRequest.photoPath, requestNumber);
        if (b64) payload.photo_attachment = b64;
    }

    if (!payload.photo_attachment && payload.identification_attachment) {
        payload.photo =
            (payload.identification_document as string) || getFileName(gateRequest.passportIdImagePath || '');
        payload.photo_attachment = payload.identification_attachment;
    }
}

/**
 * Create a new gate pass in Sohar Port: POST `/api/gatepass/post` with JSON + base64 attachments.
 * Auth: `SOHAR_PORT_USERNAME` / `SOHAR_PORT_PASSWORD` via {@link SoharPortHttpClient}.
 */
export async function createGatePass(
    client: SoharPortHttpClient,
    request: CreateGatePassRequest,
): Promise<CreateGatePassResponse> {
    try {
        logSuccess('createGatePass', `Creating gate Beneficiary of the permit ${request.requestNumber}`);

        const extraFields = request.extraFields || {};
        const gateRequest = extraFields.gateRequest as GateRequestSource | undefined;
        const entityType =
            (extraFields.entityType as string | undefined) ||
            gateRequest?.entityType ||
            env.SOHAR_PORT_ENTITY?.trim() ||
            'port';
        const isPermanentPass = isPermanentSoharPass(gateRequest, extraFields);
        const passType = isPermanentPass ? '1' : '2';

        const rawPassFor = gateRequest?.passFor || extraFields.passFor;
        let passForMapped = '2';

        if (isPermanentPass) {
            const permMap: Record<string, string> = {
                SERVICE_PROVIDER: '2',
                SUB_CONTRACTOR: '3',
                EMPLOYEE: '4',
            };
            passForMapped = permMap[String(rawPassFor)] || '2';
        } else {
            const tempMap: Record<string, string> = {
                VISITOR: '1',
                SERVICE_PROVIDER: '2',
                SUB_CONTRACTOR: '3',
            };
            passForMapped = tempMap[String(rawPassFor)] || '1';
        }

        const displayName =
            gateRequest?.applicantNameEn?.trim() ||
            request.applicantName?.trim() ||
            gateRequest?.applicantNameAr ||
            '';

        const soharPortPayload: Record<string, unknown> = {
            pass_type: passType,
            pass_for: passForMapped,
            company: gateRequest?.organization || 'Majis Industrial Services',
            name: displayName,
            phone: gateRequest?.applicantPhone || '',
            name_in_arabic: gateRequest?.applicantNameAr,
            email: request.applicantEmail,
            identification_type: mapIdentificationType(gateRequest?.identification || 'PASSPORT'),
            identification_number: request.passportIdNumber,
            blood_type: gateRequest?.bloodType || 'O+',
            start_date: formatDate(request.dateOfVisit),
            end_date: gateRequest?.validTo
                ? formatDate(gateRequest.validTo)
                : formatDate(new Date(new Date(request.dateOfVisit).getTime() + 24 * 60 * 60 * 1000)),
            reason_for_visit: request.purposeOfVisit,
            gender: mapGender(gateRequest?.gender || 'MALE'),
            citizenship: gateRequest?.nationality || 'Omani',
            professions: 'Other',
            other_professions: gateRequest?.otherProfessions || gateRequest?.profession || '',
            api_used_by: env.SOHAR_PORT_API_USED_BY?.trim() || 'GatePass System',
        };

        soharPortPayload.months_validity = isPermanentPass ? '' : calculateMonthsValidity(gateRequest);

        if (!env.SOHAR_PORT_API_USED_BY?.trim()) {
            logger.warn('Sohar Port: SOHAR_PORT_API_USED_BY is not set; api_used_by should be the VMS login or display name');
        }

        const skipAttachments = shouldSkipAttachmentsForDebug();
        if (skipAttachments) {
            logger.warn(
                `Sohar Port: SOHAR_PORT_SKIP_ATTACHMENTS — JSON without attachment fields for ${request.requestNumber}`,
            );
        }

        delete soharPortPayload.identification_attachment;
        delete soharPortPayload.photo_attachment;
        delete soharPortPayload.other_attachment;
        delete soharPortPayload.other_attachment2;

        await attachDirectBase64Fields(soharPortPayload, gateRequest, skipAttachments, request.requestNumber);

        const endpoint = getEndpointUrl('v1', 'CREATE_GATE_PASS');

        logger.info(`Sohar Port attachment fields for ${request.requestNumber}:`, {
            hasIdentification: !!soharPortPayload.identification_attachment,
            hasPhoto: !!soharPortPayload.photo_attachment,
            hasOther1: !!soharPortPayload.other_attachment,
            hasOther2: !!soharPortPayload.other_attachment2,
            identification_document: soharPortPayload.identification_document ?? null,
            photo: soharPortPayload.photo ?? null,
            other_documents: soharPortPayload.other_documents ?? null,
            other_documents2: soharPortPayload.other_documents2 ?? null,
        });

        logger.info(`Sohar Port Integration Payload: ${request.requestNumber}`, {
            type: 'SOHAR_PORT_DEBUG_REQUEST',
            requestNumber: request.requestNumber,
            entityType,
            payload: maskPayloadForLog(soharPortPayload),
        });

        const response = await client.requestWithRetry<Record<string, unknown>>({
            method: 'POST',
            endpoint,
            params: {
                entity: entityType,
            },
            data: soharPortPayload,
        });

        logger.info(`Sohar Port Integration Response: ${request.requestNumber}`, {
            type: 'SOHAR_PORT_DEBUG_RESPONSE',
            requestNumber: request.requestNumber,
            response,
        });

        const isSuccess = response.Result === 'SUCCESS' || response.result === 'SUCCESS';

        const result: CreateGatePassResponse = {
            success: isSuccess,
            statusCode: isSuccess ? 200 : 400,
            message: isSuccess
                ? 'Gate pass created successfully'
                : ((response.ErrorDetails || response.message || 'Request received with issues') as string),
            externalReference: response.PassNumber as string | undefined,
            so_status: response.PassStatus as string | undefined,
            qrCodePdfUrl: (response.qrCodePdfUrl || response.qrCode) as string | undefined,
        };

        if (isSuccess) {
            logSuccess('createGatePass', `Gate pass created: ${result.externalReference}`);
        } else {
            logError('createGatePass', new Error(result.message));
        }

        return result;
    } catch (error: unknown) {
        logError('createGatePass', error);

        const err = error as {
            details?: Record<string, unknown>;
            statusCode?: number;
            message?: string;
        };
        const errorMessage =
            (err.details?.ErrorDetails as string) ||
            (err.details?.Message as string) ||
            (err.details?.message as string) ||
            err.message ||
            'Failed to create gate pass';
        const modelState = (err.details?.ModelState || err.details?.modelState) as Record<string, string[]> | undefined;

        let detailedError = errorMessage;
        if (modelState) {
            const issues = Object.entries(modelState)
                .map(([key, value]) => {
                    const cleanKey = key.replace(/^gatePass\./, '');
                    return `${cleanKey}: ${value.join(', ')}`;
                })
                .join('; ');
            detailedError = `${errorMessage} Details: ${issues}`;
        }

        return {
            success: false,
            statusCode: err.statusCode || 500,
            message: detailedError,
            error: err.message,
        };
    }
}
