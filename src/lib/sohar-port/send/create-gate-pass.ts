

import { SoharPortHttpClient } from '../client';
import { CreateGatePassRequest, CreateGatePassResponse } from '../types';
import { getEndpointUrl } from '../config';
import { logSuccess, logError } from '../utils/logger';
import { readFile } from 'fs/promises';
import path from 'path';
import { logger } from '../../logger';


async function fileToBase64(filePath: string): Promise<string | null> {
    try {
        if (!filePath) return null;

        if (filePath.startsWith('data:')) {

            const base64Match = filePath.match(/base64,(.+)$/);
            if (base64Match && base64Match[1]) {
                return base64Match[1];
            }
            return null;
        }

        // Regular file path - read from file system (local development)
        const fullPath = path.join(process.cwd(), 'public', filePath);
        const fileBuffer = await readFile(fullPath);
        return fileBuffer.toString('base64');
    } catch (error) {
        console.error(`Failed to read file ${filePath}:`, error);
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
 * Map Beneficiary of the permit value
 */
function mapPassFor(passFor: string | null | undefined): string {
    if (!passFor) return '2';
    return passFor === 'SELF' ? '1' : '2';
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
 * Map visitor type (default to 8 for visitor)
 */
function mapVisitorType(requestType: string): string {
    const visitorTypeMap: Record<string, string> = {
        'VISITOR': '8',
        'CONTRACTOR': '7',
        'SUB_CONTRACTOR': '7',
        'SERVICE_PROVIDER': '5',
        'EMPLOYEE': '6',
        'VEHICLE': '9',
    };
    return visitorTypeMap[requestType.toUpperCase()] || '8';
}

/**
 * Calculate months validity from validFrom and validTo dates
 */
function calculateMonthsValidity(validFrom: Date, validTo: Date): string {
    const diffTime = validTo.getTime() - validFrom.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.ceil(diffDays / 30);
    return months.toString();
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
        // Map fields to Sohar Port API format
        const soharPortPayload: any = {
            pass_type: mapRequestType(request.requestType),
            months_validity: gateRequest?.validFrom && gateRequest?.validTo
                ? calculateMonthsValidity(new Date(gateRequest.validFrom), new Date(gateRequest.validTo))
                : '30',
            pass_for: mapPassFor(gateRequest?.passFor || extraFields.passFor),
            company: gateRequest?.organization || 'Majis Industrial Services',
            name: request.applicantName || gateRequest?.applicantNameAr,
            phone: gateRequest?.applicantPhone || '',
            name_in_arabic: gateRequest?.applicantNameAr,
            email: request.applicantEmail,
            identification_type: mapIdentificationType(gateRequest?.identification || 'PASSPORT'),
            identification_number: request.passportIdNumber,
            visitor_type: mapVisitorType('VISITOR'),
            blood_type: gateRequest?.bloodType || 'O+',
            start_date: formatDate(request.dateOfVisit),
            end_date: gateRequest?.validTo
                ? formatDate(gateRequest.validTo)
                : formatDate(new Date(new Date(request.dateOfVisit).getTime() + 30 * 24 * 60 * 60 * 1000)),
            reason_for_visit: request.purposeOfVisit,
            gender: mapGender(gateRequest?.gender || 'MALE'),
            citizenship: gateRequest?.nationality || 'Omani',
            professions: gateRequest?.profession || 'Technical',
            other_professions: gateRequest?.otherProfessions || extraFields.otherProfessions || '',
            api_used_by: process.env.SOHAR_PORT_API_USED_BY || 'GatePass System',
        };

        // Handle file attachments (convert to base64)
        if (gateRequest?.passportIdImagePath) {
            const passportBase64 = await fileToBase64(gateRequest.passportIdImagePath);
            if (passportBase64) {
                soharPortPayload.identification_attachment = passportBase64;
                soharPortPayload.identification_document = path.basename(gateRequest.passportIdImagePath);
            }
        }

        // Handle other documents
        if (gateRequest?.uploads && Array.isArray(gateRequest.uploads)) {
            const otherDocs = gateRequest.uploads.filter((u: any) => u.fileType.startsWith('OTHER'));
            if (otherDocs.length > 0) {
                const doc1 = await fileToBase64(otherDocs[0].filePath);
                if (doc1) {
                    soharPortPayload.other_attachment = doc1;
                    soharPortPayload.other_documents = path.basename(otherDocs[0].filePath);
                }
                if (otherDocs.length > 1) {
                    const doc2 = await fileToBase64(otherDocs[1].filePath);
                    if (doc2) {
                        soharPortPayload.other_attachment2 = doc2;
                        soharPortPayload.other_documents2 = path.basename(otherDocs[1].filePath);
                    }
                }
            }
        }

        // Handle photo from uploads
        const photoUpload = gateRequest?.uploads?.find((u: any) => u.fileType === 'PHOTO');
        if (photoUpload) {
            const photoBase64 = await fileToBase64(photoUpload.filePath);
            if (photoBase64) {
                soharPortPayload.photo_attachment = photoBase64;
                soharPortPayload.photo = path.basename(photoUpload.filePath);
            }
        } else if (gateRequest?.passportIdImagePath && soharPortPayload.identification_attachment) {
            // Fallback to passport image if no separate photo
            soharPortPayload.photo = path.basename(gateRequest.passportIdImagePath);
            soharPortPayload.photo_attachment = soharPortPayload.identification_attachment;
        }

        // Log attachment sizes for debugging
        const attachmentsSize = {
            identification: soharPortPayload.identification_attachment?.length ? Math.round(soharPortPayload.identification_attachment.length / 1024) + 'KB' : 'N/A',
            photo: soharPortPayload.photo_attachment?.length ? Math.round(soharPortPayload.photo_attachment.length / 1024) + 'KB' : 'N/A',
            other1: soharPortPayload.other_attachment?.length ? Math.round(soharPortPayload.other_attachment.length / 1024) + 'KB' : 'N/A',
            other2: soharPortPayload.other_attachment2?.length ? Math.round(soharPortPayload.other_attachment2.length / 1024) + 'KB' : 'N/A',
        };
        logger.info(`Attachment sizes for ${request.requestNumber}:`, attachmentsSize);

        // Log the final payload being sent (excluding attachments for cleaner logs if needed)
        const debugPayload = { ...soharPortPayload };
        // Don't remove them from the real payload, just from the debug log if they are too big
        // but for now let's keep the existing logger call below as is.

        logger.info(`Sohar Port Integration Payload: ${request.requestNumber}`, {
            type: 'SOHAR_PORT_DEBUG_REQUEST',
            requestNumber: request.requestNumber,
            entityType,
            payload: soharPortPayload,
        });

        const response = await client.requestWithRetry<any>({
            method: 'POST',
            endpoint: getEndpointUrl('v1', 'CREATE_GATE_PASS'),
            params: {
                entity: entityType,
            },
            data: soharPortPayload,
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
        const errorMessage = error.details?.Message || error.details?.message || error.message || 'Failed to create gate pass';
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
