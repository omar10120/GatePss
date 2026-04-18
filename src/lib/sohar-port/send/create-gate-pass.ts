
import { SoharPortHttpClient } from '../client';
import { CreateGatePassRequest, CreateGatePassResponse } from '../types';
import { getEndpointUrl } from '../config';
import { logSuccess, logError } from '../utils/logger';
import { logger } from '../../logger';

const env = ((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env) || {};

/** Debug: omit attachment filenames + `_gatepassProxy`. */
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
 * Public URL under `/uploads/...` for the PHP proxy to GET (allowlist host on proxy).
 */
function storagePathToPublicUploadUrl(localPath: string): string | null {
    const base = getGatepassFilesPublicBaseUrl();
    if (!base || !localPath) return null;
    let p = String(localPath).replace(/\\/g, '/').trim();
    if (/^https?:\/\//i.test(p)) return p;
    if (p.startsWith('/uploads/')) {
        p = p.replace(/^\//, '');
    } else if (p.includes('/uploads/')) {
        const i = p.indexOf('/uploads/');
        p = p.slice(i + 1);
    } else if (!p.startsWith('uploads/')) {
        return null;
    }
    return `${base.replace(/\/$/, '')}/${p}`;
}

export interface GatepassProxyPayload {
    identificationUrl?: string;
    photoUrl?: string;
    other1Url?: string;
    other2Url?: string;
}

/** Same shape as `extraFields.gateRequest` rows we read from the DB. */
interface GateRequestSource {
    entityType?: string;
    passportIdImagePath?: string;
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

/** Redact PII for structured logs (proxy still receives real values). */
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
    if (out._gatepassProxy && typeof out._gatepassProxy === 'object') {
        out._gatepassProxy = {
            ...(out._gatepassProxy as Record<string, unknown>),
            identificationUrl: (out._gatepassProxy as GatepassProxyPayload).identificationUrl ? '[url]' : undefined,
            photoUrl: (out._gatepassProxy as GatepassProxyPayload).photoUrl ? '[url]' : undefined,
            other1Url: (out._gatepassProxy as GatepassProxyPayload).other1Url ? '[url]' : undefined,
            other2Url: (out._gatepassProxy as GatepassProxyPayload).other2Url ? '[url]' : undefined,
        };
    }
    return out;
}

/**
 * Attach `_gatepassProxy` URLs + Sohar filename fields from storage paths (no file I/O).
 */
function attachProxyRefsAndFilenames(
    payload: Record<string, unknown>,
    gateRequest: GateRequestSource | undefined,
    skipAttachments: boolean,
    requestNumber: string,
): void {
    if (skipAttachments || !gateRequest) {
        return;
    }

    const baseOk = !!getGatepassFilesPublicBaseUrl();
    if (!baseOk) {
        logger.warn(
            `Sohar Port: GATEPASS_FILES_BASE_URL / NEXT_PUBLIC_APP_URL missing — _gatepassProxy URLs cannot be built for ${requestNumber}`,
        );
    }

    const proxy: GatepassProxyPayload = {};

    if (gateRequest.passportIdImagePath) {
        payload.identification_document = getFileName(gateRequest.passportIdImagePath);
        const u = storagePathToPublicUploadUrl(gateRequest.passportIdImagePath);
        if (u) {
            proxy.identificationUrl = u;
        }
    }

    const uploads = gateRequest.uploads;
    if (Array.isArray(uploads)) {
        const otherDocs = uploads.filter((u) => u.fileType.startsWith('OTHER'));
        if (otherDocs[0]?.filePath) {
            payload.other_documents = getFileName(otherDocs[0].filePath);
            const u = storagePathToPublicUploadUrl(otherDocs[0].filePath);
            if (u) proxy.other1Url = u;
        }
        if (otherDocs[1]?.filePath) {
            payload.other_documents2 = getFileName(otherDocs[1].filePath);
            const u = storagePathToPublicUploadUrl(otherDocs[1].filePath);
            if (u) proxy.other2Url = u;
        }

        const photoUpload = uploads.find((u) => u.fileType === 'PHOTO');
        if (photoUpload?.filePath) {
            payload.photo = getFileName(photoUpload.filePath);
            const u = storagePathToPublicUploadUrl(photoUpload.filePath);
            if (u) proxy.photoUrl = u;
        }
    }

    if (!payload.photo && proxy.identificationUrl) {
        payload.photo =
            (payload.identification_document as string) || getFileName(gateRequest.passportIdImagePath || '');
        proxy.photoUrl = proxy.identificationUrl;
    }

    if (Object.keys(proxy).length > 0) {
        payload._gatepassProxy = proxy;
    }
}

/**
 * Create a new gate pass in Sohar Port system (JSON body + `_gatepassProxy` URLs; PHP proxy fetches files).
 */
export async function createGatePass(
    client: SoharPortHttpClient,
    request: CreateGatePassRequest,
): Promise<CreateGatePassResponse> {
    try {
        logSuccess('createGatePass', `Creating gate Beneficiary of the permit ${request.requestNumber}`);

        const extraFields = request.extraFields || {};
        const gateRequest = extraFields.gateRequest as GateRequestSource | undefined;
        const entityType = extraFields.entityType || gateRequest?.entityType || 'port';
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
            company: 'Majis Industrial Services',
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
                `Sohar Port: SOHAR_PORT_SKIP_ATTACHMENTS — JSON without attachment refs for ${request.requestNumber}`,
            );
        }

        delete soharPortPayload.identification_attachment;
        delete soharPortPayload.photo_attachment;
        delete soharPortPayload.other_attachment;
        delete soharPortPayload.other_attachment2;

        attachProxyRefsAndFilenames(soharPortPayload, gateRequest, skipAttachments, request.requestNumber);

        const endpoint = getEndpointUrl('v1', 'CREATE_GATE_PASS_MULTIPART');

        logger.info(`Sohar Port attachment refs for ${request.requestNumber}:`, {
            hasProxy: !!soharPortPayload._gatepassProxy,
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
