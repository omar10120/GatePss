

import { SoharPortHttpClient } from '../client';
import { CreateGatePassRequest, CreateGatePassResponse } from '../types';
import { getEndpointUrl } from '../config';
import { logSuccess, logError } from '../utils/logger';
import { logger } from '../../logger';
import { Storage } from '../../storage';

type ByteBuffer = {
    length: number;
    [index: number]: number;
    toString: (encoding?: string) => string;
};

const RuntimeBuffer = (globalThis as {
    Buffer?: {
        from: (input: string, encoding?: string) => ByteBuffer;
        isBuffer: (value: unknown) => boolean;
    };
}).Buffer;
const env = ((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env) || {};


function normalizeBase64(input: string): string {
    const withoutWhitespace = input.replace(/\s/g, '');
    const urlSafeNormalized = withoutWhitespace.replace(/-/g, '+').replace(/_/g, '/');
    const remainder = urlSafeNormalized.length % 4;
    if (remainder === 0) return urlSafeNormalized;
    return urlSafeNormalized + '='.repeat(4 - remainder);
}

function decodeBase64Strict(input: string): ByteBuffer | null {
    const normalized = normalizeBase64(input);
    if (!normalized || !/^[A-Za-z0-9+/=]+$/.test(normalized)) {
        return null;
    }
    if (!RuntimeBuffer) return null;

    try {
        const buffer = RuntimeBuffer.from(normalized, 'base64');
        if (!buffer.length) return null;

        // Ensure input was truly valid base64 and not silently coerced.
        const normalizedNoPad = normalized.replace(/=+$/, '');
        const reEncodedNoPad = buffer.toString('base64').replace(/=+$/, '');
        return normalizedNoPad === reEncodedNoPad ? buffer : null;
    } catch {
        return null;
    }
}

function detectAttachmentType(buffer: ByteBuffer): 'jpeg' | 'png' | 'pdf' | 'unknown' {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return 'jpeg';
    }
    if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        return 'png';
    }
    if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
        return 'pdf';
    }
    return 'unknown';
}

function getBase64Preview(base64: string): string {
    const normalized = normalizeBase64(base64);
    const start = normalized.substring(0, 24);
    const end = normalized.slice(-24);
    return `${start}...${end}`;
}

function getFileName(filePath: string): string {
    const normalized = String(filePath || '').replace(/\\/g, '/');
    const parts = normalized.split('/');
    return parts[parts.length - 1] || '';
}

async function readValidatedAttachment(
    filePath: string,
    options: { requireImage?: boolean } = {}
): Promise<ByteBuffer | null> {
    try {
        if (!filePath) return null;
        const { requireImage = false } = options;

        if (filePath.startsWith('data:')) {
            const base64Match = filePath.match(/base64,(.+)$/);
            if (base64Match && base64Match[1]) {
                const decoded = decodeBase64Strict(base64Match[1]);
                if (!decoded) {
                    logger.error(`Invalid data URL base64 for ${filePath}`);
                    return null;
                }

                if (requireImage) {
                    const mime = detectAttachmentType(decoded);
                    if (!['jpeg', 'png'].includes(mime)) {
                        logger.error(`Invalid image attachment MIME from data URL for ${filePath}. Detected: ${mime}`);
                        return null;
                    }
                }

                return decoded;
            }
            return null;
        }

        let storagePath = filePath;
        if (storagePath.startsWith('/uploads/')) {
            storagePath = storagePath.substring(9);
        } else if (storagePath.startsWith('uploads/')) {
            storagePath = storagePath.substring(8);
        } else if (storagePath.startsWith('/')) {
            storagePath = storagePath.substring(1);
        }

        const fileData: unknown = await Storage.readFile(storagePath);

        if (RuntimeBuffer?.isBuffer(fileData)) {
            const binaryFileData = fileData as ByteBuffer;
            if (requireImage) {
                const mime = detectAttachmentType(binaryFileData);
                if (!['jpeg', 'png'].includes(mime)) {
                    logger.error(`Invalid image attachment MIME from file ${filePath}. Detected: ${mime}`);
                    return null;
                }
            }
            const encoded = binaryFileData.toString('base64');
            if (!decodeBase64Strict(encoded)) {
                logger.error(`Invalid encoded base64 generated from file bytes ${filePath}`);
                return null;
            }
            return binaryFileData;
        }

        if (typeof fileData === 'string') {
            const decoded = decodeBase64Strict(fileData.trim());
            if (!decoded) {
                logger.error(`Invalid string base64 content for ${filePath}`);
                return null;
            }

            if (requireImage) {
                const mime = detectAttachmentType(decoded);
                if (!['jpeg', 'png'].includes(mime)) {
                    logger.error(`Invalid image attachment MIME from base64 string ${filePath}. Detected: ${mime}`);
                    return null;
                }
            }

            return decoded;
        }

        logger.error(`Unsupported file data type for ${filePath}`);
        return null;
    } catch (error: any) {
        console.error(`❌ Failed to read file ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Map Identification Card to Sohar Port format
 */
function mapRequestType(requestType: string): string {
    const typeMap: Record<string, string> = {
        'Resident': '2',
        'Not Resident': '1',
    };
    return typeMap[requestType.toUpperCase()] || '2';
}

/**
 * Map identification type
 */
function mapIdentificationType(identification: string): string {
    // Map identification types (1 = Passport, 2 = ID Card, etc.)
    const idMap: Record<string, string> = {
        'PASSPORT': '1',
        'ID_CARD': '2',
        'ID': '2', // Also map "ID" to ID Card
        'RESIDENCE': '3',
    };
    return idMap[identification.toUpperCase()] || '1';
}

/**
 * Map gender to Sohar Port format (Male/Female)
 */
function mapGender(gender: string): string {
    const genderMap: Record<string, string> = {
        'MALE': 'Male',
        'FEMALE': 'Female',
    };
    return genderMap[gender.toUpperCase()] || 'Male';
}

/**
 * Sohar pass_type 1 = permanent, 2 = temporary (discrete validity days in months_validity).
 * Prefer DB pass type name when present; otherwise infer from validity_period.
 */
function isPermanentSoharPass(gateRequest: any, extraFields: Record<string, any>): boolean {
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

/**
 * Calculate months validity from validFrom and validTo dates
 */
function calculateMonthsValidity(gateRequest: any): string {
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
    return validityMap[duration] || '1';
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
}

/**
 * Create a new gate pass in Sohar Port system
 */
export async function createGatePass(
    client: SoharPortHttpClient,
    request: CreateGatePassRequest
): Promise<CreateGatePassResponse> {
    try {
        logSuccess('createGatePass', `Creating gate Beneficiary of the permit ${request.requestNumber}`);

        // Extract extra fields
        const extraFields = request.extraFields || {};
        const gateRequest = extraFields.gateRequest as any; // Full request object from database
        const entityType = extraFields.entityType || gateRequest?.entityType || 'port';
        // Sohar: pass_type 1 = permanent, 2 = temporary
        const isPermanentPass = isPermanentSoharPass(gateRequest, extraFields);
        const passType = isPermanentPass ? '1' : '2';

        // Map pass_for based on pass type
        // Permanent: 2=Service Provider, 3=Sub Contractor, 4=Employee
        // Temporary: 1=Visitor, 2=Service Provider, 3=Sub Contractor
        const rawPassFor = gateRequest?.passFor || extraFields.passFor;
        let passForMapped = '2'; // Default to Service Provider
        
        if (isPermanentPass) {
            const permMap: Record<string, string> = {
                'SERVICE_PROVIDER': '2',
                'SUB_CONTRACTOR': '3',
                'EMPLOYEE': '4'
            };
            passForMapped = permMap[rawPassFor] || '2';
        } else {
            const tempMap: Record<string, string> = {
                'VISITOR': '1',
                'SERVICE_PROVIDER': '2',
                'SUB_CONTRACTOR': '3'
            };
            passForMapped = tempMap[rawPassFor] || '1';
        }

        // Map fields to Sohar Port API format
        const displayName =
            gateRequest?.applicantNameEn?.trim() ||
            request.applicantName?.trim() ||
            gateRequest?.applicantNameAr ||
            '';

        const soharPortPayload: any = {
            pass_type: passType,
            pass_for: passForMapped,
            company: gateRequest?.organization || 'Majis Industrial Services',
            name: displayName,
            phone: gateRequest?.applicantPhone || '',
            name_in_arabic: gateRequest?.applicantNameAr,
            email: request.applicantEmail,
            identification_type: mapIdentificationType(gateRequest?.identification || 'PASSPORT'),
            identification_number: request.passportIdNumber,
            // visitor_type / emp_no: omitted per Sohar guide for pass_type 1 and 2
            blood_type: gateRequest?.bloodType || 'O+',
            start_date: formatDate(request.dateOfVisit),
            end_date: gateRequest?.validTo
                ? formatDate(gateRequest.validTo)
                : formatDate(new Date(new Date(request.dateOfVisit).getTime() + 24 * 60 * 60 * 1000)), // Default 1 day
            reason_for_visit: request.purposeOfVisit,
            gender: mapGender(gateRequest?.gender || 'MALE'),
            citizenship: gateRequest?.nationality || 'Omani',
            professions: 'Other',
            other_professions: gateRequest?.otherProfessions || gateRequest?.profession || '',
            api_used_by: env.SOHAR_PORT_API_USED_BY?.trim() || 'GatePass System',
        };

        // Permanent: Sohar requires months_validity present as "". Temporary: day codes [1,2,3,4,5,10,30,60,90]
        soharPortPayload.months_validity = isPermanentPass
            ? ''
            : calculateMonthsValidity(gateRequest);

        if (!env.SOHAR_PORT_API_USED_BY?.trim()) {
            logger.warn('Sohar Port: SOHAR_PORT_API_USED_BY is not set; api_used_by should be the VMS login or display name');
        }

        type LoadedPart = { buf: ByteBuffer; name: string };
        const loaded: {
            identification?: LoadedPart;
            other1?: LoadedPart;
            other2?: LoadedPart;
            photo?: LoadedPart;
        } = {};
        const useMultipart = client.usesGatepassMultipart();

        if (gateRequest?.passportIdImagePath) {
            const buf = await readValidatedAttachment(gateRequest.passportIdImagePath, { requireImage: true });
            if (buf) {
                loaded.identification = { buf, name: getFileName(gateRequest.passportIdImagePath) };
                if (!useMultipart) {
                    const passportBase64 = buf.toString('base64');
                    soharPortPayload.identification_attachment = passportBase64;
                    soharPortPayload.identification_document = loaded.identification.name;
                    logger.info(`Passport base64 preview for ${request.requestNumber}: ${getBase64Preview(passportBase64)}`);
                } else {
                    soharPortPayload.identification_document = loaded.identification.name;
                }
            }
        }

        if (gateRequest?.uploads && Array.isArray(gateRequest.uploads)) {
            const otherDocs = gateRequest.uploads.filter((u: any) => u.fileType.startsWith('OTHER'));
            if (otherDocs.length > 0) {
                const buf1 = await readValidatedAttachment(otherDocs[0].filePath);
                if (buf1) {
                    loaded.other1 = { buf: buf1, name: getFileName(otherDocs[0].filePath) };
                    if (!useMultipart) {
                        const doc1 = buf1.toString('base64');
                        soharPortPayload.other_attachment = doc1;
                        soharPortPayload.other_documents = loaded.other1.name;
                        logger.info(`Other doc1 base64 preview for ${request.requestNumber}: ${getBase64Preview(doc1)}`);
                    } else {
                        soharPortPayload.other_documents = loaded.other1.name;
                    }
                }
                if (otherDocs.length > 1) {
                    const buf2 = await readValidatedAttachment(otherDocs[1].filePath);
                    if (buf2) {
                        loaded.other2 = { buf: buf2, name: getFileName(otherDocs[1].filePath) };
                        if (!useMultipart) {
                            const doc2 = buf2.toString('base64');
                            soharPortPayload.other_attachment2 = doc2;
                            soharPortPayload.other_documents2 = loaded.other2.name;
                            logger.info(`Other doc2 base64 preview for ${request.requestNumber}: ${getBase64Preview(doc2)}`);
                        } else {
                            soharPortPayload.other_documents2 = loaded.other2.name;
                        }
                    }
                }
            }
        }

        const photoUpload = gateRequest?.uploads?.find((u: any) => u.fileType === 'PHOTO');
        let explicitPhotoUpload = false;
        if (photoUpload) {
            const buf = await readValidatedAttachment(photoUpload.filePath, { requireImage: true });
            if (buf) {
                explicitPhotoUpload = true;
                loaded.photo = { buf, name: getFileName(photoUpload.filePath) };
                if (!useMultipart) {
                    const photoBase64 = buf.toString('base64');
                    soharPortPayload.photo_attachment = photoBase64;
                    soharPortPayload.photo = loaded.photo.name;
                    logger.info(`Photo base64 preview for ${request.requestNumber}: ${getBase64Preview(photoBase64)}`);
                } else {
                    soharPortPayload.photo = loaded.photo.name;
                }
            }
        } else if (gateRequest?.passportIdImagePath && loaded.identification) {
            loaded.photo = { buf: loaded.identification.buf, name: loaded.identification.name };
            if (!useMultipart) {
                soharPortPayload.photo = loaded.photo.name;
                soharPortPayload.photo_attachment = loaded.identification.buf.toString('base64');
            } else {
                soharPortPayload.photo = loaded.photo.name;
            }
        }

        const bufferToBlob = (buf: ByteBuffer) => new Blob([buf as unknown as Buffer]);

        let requestBody: FormData | typeof soharPortPayload = soharPortPayload;
        let endpoint = getEndpointUrl('v1', 'CREATE_GATE_PASS');
        let multipart = false;
        let multipartMetadataForLog: Record<string, unknown> | null = null;

        if (useMultipart) {
            const metadataPayload = { ...soharPortPayload };
            delete metadataPayload.identification_attachment;
            delete metadataPayload.photo_attachment;
            delete metadataPayload.other_attachment;
            delete metadataPayload.other_attachment2;
            multipartMetadataForLog = metadataPayload;

            const fd = new FormData();
            fd.append('metadata', JSON.stringify(metadataPayload));

            if (loaded.identification) {
                fd.append('identification_file', bufferToBlob(loaded.identification.buf), loaded.identification.name);
            }
            if (explicitPhotoUpload && loaded.photo) {
                fd.append('photo_file', bufferToBlob(loaded.photo.buf), loaded.photo.name);
            }
            if (loaded.other1) {
                fd.append('other_file_1', bufferToBlob(loaded.other1.buf), loaded.other1.name);
            }
            if (loaded.other2) {
                fd.append('other_file_2', bufferToBlob(loaded.other2.buf), loaded.other2.name);
            }

            requestBody = fd;
            endpoint = getEndpointUrl('v1', 'CREATE_GATE_PASS_MULTIPART');
            multipart = true;
        }

        const attachmentsSize = {
            identification: loaded.identification
                ? Math.round(loaded.identification.buf.length / 1024) + 'KB'
                : 'N/A',
            photo: loaded.photo ? Math.round(loaded.photo.buf.length / 1024) + 'KB' : 'N/A',
            other1: loaded.other1 ? Math.round(loaded.other1.buf.length / 1024) + 'KB' : 'N/A',
            other2: loaded.other2 ? Math.round(loaded.other2.buf.length / 1024) + 'KB' : 'N/A',
        };
        logger.info(`Attachment sizes for ${request.requestNumber}:`, attachmentsSize);

        const debugLogPayload = multipartMetadataForLog
            ? { ...multipartMetadataForLog, _multipart: true }
            : soharPortPayload;

        logger.info(`Sohar Port Integration Payload: ${request.requestNumber}`, {
            type: 'SOHAR_PORT_DEBUG_REQUEST',
            requestNumber: request.requestNumber,
            entityType,
            payload: debugLogPayload,
        });

        const response = await client.requestWithRetry<any>({
            method: 'POST',
            endpoint,
            params: {
                entity: entityType,
            },
            data: requestBody,
            multipart,
        });

        // Log the raw response from Sohar Port
        logger.info(`Sohar Port Integration Response: ${request.requestNumber}`, {
            type: 'SOHAR_PORT_DEBUG_RESPONSE',
            requestNumber: request.requestNumber,
            response,
        });

        // Map fields to normalized response, handling both PascalCase (API) and camelCase (Mock/Legacy)
        const isSuccess = response.Result === 'SUCCESS' || response.result === 'SUCCESS';
        const isError = response.Result === 'ERROR' || response.result === 'ERROR' || response.Result === 'FAILED' || response.result === 'FAILED';

        const result: CreateGatePassResponse = {
            success: isSuccess,
            statusCode: isSuccess ? 200 : 400,
            message: isSuccess
                ? 'Gate pass created successfully'
                : (response.ErrorDetails || response.message || 'Request received with issues'),
            externalReference: response.PassNumber,
            so_status: response.PassStatus,
            qrCodePdfUrl: response.qrCodePdfUrl || response.qrCode,
        };

        if (isSuccess) {
            logSuccess('createGatePass', `Gate pass created: ${result.externalReference}`);
        } else {
            logError('createGatePass', new Error(result.message));
        }

        return result;

    } catch (error: any) {
        logError('createGatePass', error);

        // Include detailed error message if available (e.g., ModelState validation errors)
        const errorMessage = error.details?.ErrorDetails || error.details?.Message || error.details?.message || error.message || 'Failed to create gate pass';
        const modelState = error.details?.ModelState || error.details?.modelState;

        let detailedError = errorMessage;
        if (modelState) {
            const issues = Object.entries(modelState)
                .map(([key, value]) => {
                    // Strip "gatePass." prefix for cleaner display
                    const cleanKey = key.replace(/^gatePass\./, '');
                    return `${cleanKey}: ${(value as string[]).join(', ')}`;
                })
                .join('; ');
            detailedError = `${errorMessage} Details: ${issues}`;
        }

        return {
            success: false,
            statusCode: error.statusCode || 500,
            message: detailedError,
            error: error.message,
        };
    }
}
