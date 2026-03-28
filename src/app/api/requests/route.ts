import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateRequestNumber, validateEmail, validatePassportId } from '@/utils/helpers';
import { sendRequestConfirmationEmail, sendAdminNotificationEmail } from '@/lib/email';
import { ActionType, RequestType } from '@/lib/enums';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { Storage } from '@/lib/storage';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Extract form fields
        const applicantNameEn = (formData.get('applicantName') as string) || '';
        const applicantNameAr = (formData.get('fullNameAr') as string) || '';
        const applicantEmail = formData.get('applicantEmail') as string;
        const gender = formData.get('gender') as string;
        const profession = formData.get('profession') as string;
        const otherProfessions = formData.get('otherProfessions') as string | null;
        const passportIdNumber = formData.get('passportIdNumber') as string;
        const nationality = formData.get('nationality') as string;
        const identification = formData.get('identification') as string;
        const organization = formData.get('organization') as string;
        const visitduration = formData.get('visitduration') as string;
        const purposeOfVisit = formData.get('purposeOfVisit') as string;
        const dateOfVisit = formData.get('dateOfVisit') as string;
        const requestType = formData.get('requestType') as string;
        const passportIdImage = formData.get('passportIdImage') as File | null;
        const photo = formData.get('photo') as File | null;
        const passEndDate = formData.get('passEndDate') as string | null;
        const passFor = formData.get('passFor') as string | null;
        const passTypeId = formData.get('passTypeId') as string | null;
        const entityType = (formData.get('entityType') as string) || 'port';
        const applicantPhone = (formData.get('telephone') as string) || (formData.get('applicantPhone') as string) || '';

        // Validate required fields using BRD requirements
        const errors: string[] = [];



        // English name is required for Freezone (all types) OR Sohar Port (Permanent only)
        // Permanent is detected by having a passEndDate
        const isPermanent = !!passEndDate;
        const englishNameRequired = entityType === 'freezone' || (entityType === 'port' && isPermanent);

        if (englishNameRequired && (!applicantNameEn || applicantNameEn.trim().length < 2)) {
            errors.push('Applicant name (English) is required (minimum 2 characters)');
        }

        if (!applicantNameAr || applicantNameAr.trim().length < 2) {
            errors.push('Applicant name (Arabic) is required (minimum 2 characters)');
        }

        if (!applicantEmail || !validateEmail(applicantEmail)) {
            errors.push('Valid email address is required');
        }



        if (!gender || !['MALE', 'FEMALE'].includes(gender)) {
            errors.push('Gender is required (MALE or FEMALE)');
        }

        if (!profession || profession.trim().length < 2) {
            errors.push('Profession is required (minimum 2 characters)');
        }

        if (!passportIdNumber || !validatePassportId(passportIdNumber)) {
            errors.push('Valid passport/ID number is required (6-20 alphanumeric characters)');
        }

        if (!nationality || nationality.trim().length < 2) {
            errors.push('Nationality is required');
        }

        if (!identification || !['ID', 'PASSPORT'].includes(identification)) {
            errors.push('Identification type is required (ID or PASSPORT)');
        }

        if (!organization || organization.trim().length < 2) {
            errors.push('Organization is required (minimum 2 characters)');
        }

        if (!passEndDate && (!visitduration || !['1_DAY', '2_DAY', '3_DAY', '4_DAY', '5_DAY', '10_DAY', '1_MONTH', '2_MONTH', '3_MONTH'].includes(visitduration))) {
            errors.push('Visit Duration or Pass End Date is required');
        }

        if (!purposeOfVisit || purposeOfVisit.trim().length < 10) {
            errors.push('Purpose of visit is required (minimum 10 characters)');
        }

        if (!dateOfVisit) {
            errors.push('Date of visit is required');
        } else {
            const visitDate = new Date(dateOfVisit);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            visitDate.setHours(0, 0, 0, 0);

            if (visitDate < today) {
                errors.push('Date of visit cannot be in the past');
            }

            // Validate passEndDate: must be at least 4 months after dateOfVisit
            if (passEndDate) {
                const endDate = new Date(passEndDate);

                // Check if passEndDate is a valid date
                if (isNaN(endDate.getTime())) {
                    errors.push('Pass End Date must be a valid date');
                } else {
                    endDate.setHours(0, 0, 0, 0);
                    const minEndDate = new Date(visitDate);
                    minEndDate.setMonth(minEndDate.getMonth() + 4);
                    minEndDate.setHours(0, 0, 0, 0);

                    if (endDate < minEndDate) {
                        errors.push('Pass End Date must be at least 4 months after Pass Starting Date');
                    }
                }
            }
        }

        if (!requestType || !['Resident', 'Not Resident'].includes(requestType)) {
            errors.push('Valid Identification Card is required (Resident, Not Resident)');
        }

        if (!entityType || !['port', 'freezone'].includes(entityType)) {
            errors.push('Entity Type is required (port or freezone)');
        }

        if (!passportIdImage) {
            errors.push('Passport/ID image is required');
        }

        if (errors.length > 0) {
            return NextResponse.json(
                { error: 'Validation Error', message: 'Please fix the following errors', errors },
                { status: 400 }
            );
        }

        // Unified file upload helper using Storage utility
        const uploadFile = async (file: File | null, prefix: string, customMaxSize?: number, allowedExts: string[] = ['jpg', 'jpeg', 'png', 'pdf']) => {
            if (!file || file.size === 0 || file.name === undefined || file.name === '') return null;

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const maxSize = customMaxSize || parseInt(process.env.MAX_FILE_SIZE || '1048576');
            if (buffer.length > maxSize) {
                const sizeLabel = maxSize >= 1024 * 1024 ? `${(maxSize / (1024 * 1024)).toFixed(0)}MB` : `${(maxSize / 1024).toFixed(0)}KB`;
                throw new Error(`File ${file.name} size exceeds ${sizeLabel} limit`);
            }

            const fileExt = file.name.split('.').pop()?.toLowerCase().trim();
            if (!fileExt || !allowedExts.includes(fileExt)) {
                throw new Error(`Invalid file type for ${file.name}. Allowed types: ${allowedExts.join(', ')}`);
            }

            // Fallback to base64 ONLY if VERCEL is explicitly enabled
            // Robust check for string "false" which is common in environment settings on Hostinger
            const isVercel = process.env.VERCEL && process.env.VERCEL !== 'false';
            
            if (isVercel) {
                const mimeType = file.type || (fileExt === 'pdf' ? 'application/pdf' : `image/${fileExt}`);
                return `data:${mimeType};base64,${buffer.toString('base64')}`;
            }

            try {
                // Save to local storage (honors STORAGE_UPLOAD_PATH environment variable)
                return await Storage.saveFile(file, prefix, 'passports');
            } catch (fsError: any) {
                console.error(`❌ File system write failed for ${file.name}:`, fsError.message);
                const mimeType = file.type || (fileExt === 'pdf' ? 'application/pdf' : `image/${fileExt}`);
                return `data:${mimeType};base64,${buffer.toString('base64')}`;
            }
        };

        let imagePath: string | null = null;
        let photoPath: string | null = null;
        let otherDoc1Path: string | null = null;
        let otherDoc2Path: string | null = null;

        // Log photo extraction
        console.log(' Photo extraction - photo from formData:', photo ? `File name: ${photo.name}, size: ${photo.size}, type: ${photo.type}` : 'null or undefined');
        console.log(' Photo extraction - photo instanceof File:', photo instanceof File);

        try {
            imagePath = await uploadFile(passportIdImage, 'passport', 2 * 1024 * 1024, ['jpg', 'jpeg', 'png', 'pdf']);
            photoPath = await uploadFile(photo, 'photo', 250 * 1024, ['jpg', 'jpeg', 'png']);
            console.log('📸 After uploadFile - photoPath:', photoPath);
            otherDoc1Path = await uploadFile(formData.get('otherDocuments1') as File | null, 'other1', 2 * 1024 * 1024, ['pdf']);
            otherDoc2Path = await uploadFile(formData.get('otherDocuments2') as File | null, 'other2', 2 * 1024 * 1024, ['pdf']);
        } catch (err: any) {
            console.error('❌ File upload error:', err);
            return NextResponse.json(
                { error: 'Validation Error', message: err.message },
                { status: 400 }
            );
        }

        if (!imagePath) {
            return NextResponse.json(
                { error: 'Validation Error', message: 'Passport/ID image is required' },
                { status: 400 }
            );
        }



        // ... (existing validations)

        // Date of Visit validation
        const visitDate = new Date(dateOfVisit);
        visitDate.setHours(0, 0, 0, 0);

        const validFrom = new Date(visitDate);
        let validTo = new Date(visitDate);

        if (passEndDate) {
            validTo = new Date(passEndDate);
        } else {
            switch (visitduration) {
                case '1_DAY':
                    validTo.setDate(validTo.getDate() + 1);
                    break;
                case '1_MONTH':
                    validTo.setMonth(validTo.getMonth() + 1);
                    break;
                case '2_DAY':
                    validTo.setDate(validTo.getDate() + 2);
                    break;
                case '3_DAY':
                    validTo.setDate(validTo.getDate() + 3);
                    break;
                case '4_DAY':
                    validTo.setDate(validTo.getDate() + 4);
                    break;
                case '5_DAY':
                    validTo.setDate(validTo.getDate() + 5);
                    break;
                case '10_DAY':
                    validTo.setDate(validTo.getDate() + 10);
                    break;
                case '2_MONTH':
                    validTo.setMonth(validTo.getMonth() + 2);
                    break;
                case '3_MONTH':
                    validTo.setMonth(validTo.getMonth() + 3);
                    break;
                default:
                    validTo.setDate(validTo.getDate() + 1); // Default to 1 day
            }
        }
        validTo.setHours(23, 59, 59, 999);


        const requestNumber = generateRequestNumber();


        try {

            if (!prisma || !prisma.request) {
                console.error('Prisma client is out of sync. Please stop the server and run: npx prisma generate');
                return NextResponse.json(
                    { error: 'Server Error', message: 'Database client needs to be regenerated. Please contact administrator.' },
                    { status: 500 }
                );
            }

            // Build data object using camelCase to match current Prisma client
            const requestData: any = {
                requestNumber,
                applicantNameEn: applicantNameEn?.trim() || null,
                applicantNameAr: applicantNameAr.trim(),
                applicantEmail: applicantEmail.toLowerCase().trim(),
                applicantPhone: applicantPhone || "+96892104795",
                gender: gender,
                profession: profession.trim(),
                passportIdNumber: passportIdNumber.toUpperCase().trim(),
                passportIdImagePath: imagePath,
                nationality: nationality.trim(),
                identification: identification,
                organization: organization.trim(),
                validFrom: validFrom,
                validTo: validTo,
                purposeOfVisit: purposeOfVisit.trim(),
                dateOfVisit: new Date(dateOfVisit),
                requestType: requestType as RequestType,
                passFor: passFor?.trim() || null,
                entityType: entityType.trim(),
            };

            // Add passTypeId if provided
            console.log('passTypeId from formData:', passTypeId, 'type:', typeof passTypeId);
            if (passTypeId !== null && passTypeId !== undefined && String(passTypeId).trim() !== '') {
                const parsedId = parseInt(String(passTypeId));
                console.log('parsedId:', parsedId, 'isNaN:', isNaN(parsedId));
                if (!isNaN(parsedId) && parsedId > 0) {
                    requestData.passTypeId = parsedId;
                    console.log('✅ Added passTypeId to requestData:', requestData.passTypeId);
                } else {
                    console.warn('⚠️ passTypeId could not be parsed as positive integer:', passTypeId, 'parsed:', parsedId);
                }
            } else {
                console.warn('⚠️ passTypeId is empty or null:', passTypeId);
            }

            // Add visitduration if provided
            if (visitduration && visitduration.trim() !== '') {
                requestData.visitduration = visitduration.trim();
            }

            if (otherProfessions !== null && otherProfessions !== undefined) {
                requestData.otherProfessions = otherProfessions.trim();
            }
            // Add photoPath if photo was uploaded
            console.log('Photo file from formData:', photo ? `File: ${photo.name}, size: ${photo.size}` : 'No photo file');
            console.log('photoPath after uploadFile:', photoPath);
            if (photoPath) {
                requestData.photoPath = photoPath;
                console.log('✅ Added photoPath to requestData:', photoPath);
            } else {
                console.warn('⚠️ photoPath is null or empty, photo file was:', photo ? `File: ${photo.name}, size: ${photo.size}` : 'not provided');
            }

            // Try to create the request
            // If passTypeId/visitduration columns don't exist, Prisma will throw an error
            // We'll catch it and retry without those fields
            let newRequest;
            try {
                newRequest = await prisma.request.create({
                    data: requestData,
                });
                console.log('✅ Request created successfully with photoPath:', requestData.photoPath);
            } catch (createError: any) {
                // If error is about unknown column or unknown argument (passTypeId or visitduration don't exist in schema/client), remove them and retry
                const errorMessage = createError?.message || '';
                const errorCode = createError?.code || '';

                console.error('Prisma create error:', {
                    message: errorMessage,
                    code: errorCode,
                    hasPassTypeId: 'passTypeId' in requestData,
                    passTypeIdValue: requestData.passTypeId,
                    hasPhotoPath: 'photoPath' in requestData,
                    photoPathValue: requestData.photoPath,
                });

                // Only catch specific Prisma validation errors about unknown fields
                const isUnknownFieldError =
                    (errorMessage.includes('Unknown argument') &&
                        (errorMessage.includes('passTypeId') || errorMessage.includes('visitduration'))) ||
                    (errorMessage.includes('Unknown column') &&
                        (errorMessage.includes('pass_type_id') || errorMessage.includes('validity_period'))) ||
                    errorCode === 'P2010' ||
                    errorCode === 'P2001';

                if (isUnknownFieldError) {
                    console.warn('Columns passTypeId/visitduration may not exist in database or Prisma client not regenerated, retrying without them...');
                    console.warn('Original requestData had passTypeId:', requestData.passTypeId, 'visitduration:', requestData.visitduration, 'photoPath:', requestData.photoPath);
                    const retryData = { ...requestData };
                    delete retryData.passTypeId;
                    delete retryData.visitduration;
                    // Keep photoPath in retry data
                    newRequest = await prisma.request.create({
                        data: retryData,
                    });
                    console.warn('Request created without passTypeId/visitduration. Please regenerate Prisma client: npx prisma generate');
                    console.log('✅ Request created with photoPath:', retryData.photoPath);
                } else {
                    // Re-throw if it's a different error
                    console.error('Different error occurred, re-throwing:', createError);
                    throw createError;
                }
            }

            // Store photo as upload if it exists (matching edit route pattern)
            if (photoPath) {
                await prisma.upload.create({
                    data: {
                        requestId: newRequest.id,
                        fileType: 'PHOTO',
                        filePath: photoPath,
                    },
                });
                console.log('✅ Created Upload record for photo');
            }

            // Store other documents as uploads if they exist
            if (otherDoc1Path) {
                await prisma.upload.create({
                    data: {
                        requestId: newRequest.id,
                        fileType: 'OTHER_DOCUMENT_1',
                        filePath: otherDoc1Path,
                    },
                });
            }

            if (otherDoc2Path) {
                await prisma.upload.create({
                    data: {
                        requestId: newRequest.id,
                        fileType: 'OTHER_DOCUMENT_2',
                        filePath: otherDoc2Path,
                    },
                });
            }

            await prisma.activityLog.create({
                data: {
                    actionType: ActionType.REQUEST_MANAGEMENT,
                    actionPerformed: `New gate pass request submitted: ${requestNumber}`,
                    affectedEntityType: 'REQUEST',
                    affectedEntityId: newRequest.id,
                    details: JSON.stringify({
                        requestNumber,
                        applicantNameEn: applicantNameEn?.trim() || null,
                        applicantNameAr,
                        applicantEmail,
                        requestType,
                    }),
                },
            });

            const { createRequestNotifications } = await import('@/utils/notification-helper');
            createRequestNotifications(
                ActionType.REQUEST_MANAGEMENT,
                `New visitors requests has been applied`,
                'REQUEST',
                newRequest.id,
                undefined,
                'تم تقديم طلب زوار جديد'
            ).catch(err => console.error('Failed to create notifications:', err));

            sendRequestConfirmationEmail(
                applicantEmail,
                applicantNameEn?.trim() || '',
                requestNumber
            ).catch(err => console.error('Failed to send confirmation email:', err));

            sendAdminNotificationEmail(
                requestNumber,
                applicantNameEn?.trim() || '',
                requestType,
                new Date(dateOfVisit).toLocaleDateString()
            ).catch(err => console.error('Failed to send admin notification:', err));

            return NextResponse.json({
                success: true,
                message: 'Gate pass request submitted successfully',
                data: {
                    requestNumber,
                    id: newRequest.id,
                    status: newRequest.status,
                },
            }, { status: 201 });
        } catch (dbError: any) {
            console.error('Database error:', dbError);
            if (dbError) {
                console.error('Database error message:', dbError.message);
                console.error('Database error code:', dbError.code);
            }
            return NextResponse.json(
                {
                    error: 'Database Error',
                    message: dbError?.message || 'Failed to save request to database. Please try again.',
                },
                { status: 500 }
            );
        }


    } catch (error: unknown) {
        console.error('Request submission error:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error instanceof Error ? error.message : 'Failed to submit request. Please try again.',
                details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
            },
            { status: 500 }
        );
    }
}
