

import { SoharPortHttpClient } from '../client';
import { CreateGatePassRequest, CreateGatePassResponse } from '../types';
import { getEndpointUrl } from '../config';
import { logSuccess, logError } from '../utils/logger';
import { readFile } from 'fs/promises';
import path from 'path';


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

        // Map fields to Sohar Port API format
        const soharPortPayload: any = {
            pass_type: mapRequestType(request.requestType),
            months_validity: gateRequest?.validFrom && gateRequest?.validTo
                ? calculateMonthsValidity(new Date(gateRequest.validFrom), new Date(gateRequest.validTo))
                : '30',
            pass_for: mapPassFor(gateRequest?.passFor || extraFields.passFor),
            company: gateRequest?.organization || 'Majis Industrial Services',
            name: request.applicantName,
            phone: gateRequest?.applicantPhone || '',
            name_in_arabic: gateRequest?.applicantNameAr || request.applicantName,
            email: request.applicantEmail,
            identification_type: mapIdentificationType(gateRequest?.identification || 'PASSPORT'),
            identification_number: request.passportIdNumber,
            visitor_type: mapVisitorType(request.requestType),

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

        // Add photo if available (use separate photo field, fallback to passport image)
        if (gateRequest?.photoPath) {
            const photoBase64 = await fileToBase64(gateRequest.photoPath);
            if (photoBase64) {
                soharPortPayload.photo_attachment = photoBase64;
                soharPortPayload.photo = path.basename(gateRequest.photoPath);
            }
        } else if (gateRequest?.passportIdImagePath && soharPortPayload.identification_attachment) {
            // Fallback to passport image if no separate photo
            soharPortPayload.photo = path.basename(gateRequest.passportIdImagePath);
            soharPortPayload.photo_attachment = soharPortPayload.identification_attachment;
        }

        const response = await client.requestWithRetry<any>({
            method: 'POST',
            endpoint: getEndpointUrl('v1', 'CREATE_GATE_PASS'),
            params: {
                entity: 'port',
            },
            data: soharPortPayload,
        });

        const result: CreateGatePassResponse = {
            success: true,
            statusCode: 200,
            message: response.message || 'Gate pass created successfully',
            externalReference: response.passNumber || response.referenceId || response.id || response.externalReference,
            qrCodePdfUrl: response.qrCodePdfUrl || response.qrCode,
        };

        logSuccess('createGatePass', `Gate pass created: ${result.externalReference}`);

        return result;

    } catch (error: any) {
        logError('createGatePass', error);

        return {
            success: false,
            statusCode: error.statusCode || 500,
            message: error.message || 'Failed to create gate pass',
            error: error.message,
        };
    }
}
