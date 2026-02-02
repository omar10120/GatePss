import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateRequestNumber, validateEmail, validatePassportId } from '@/utils/helpers';
import { sendRequestConfirmationEmail, sendAdminNotificationEmail } from '@/lib/email';
import { ActionType, RequestType } from '@/lib/enums';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Extract form fields
        const applicantNameEn = formData.get('applicantName') as string;
        const applicantNameAr = formData.get('fullNameAr') as string;
        const applicantEmail = formData.get('applicantEmail') as string;
        const applicantPhone = formData.get('telephone') as string;
        const gender = formData.get('gender') as string;
        const profession = formData.get('profession') as string;
        const otherProfessions = formData.get('otherProfessions') as string | null;
        const bloodType = formData.get('bloodType') as string | null;
        const passportIdNumber = formData.get('passportIdNumber') as string;
        const nationality = formData.get('nationality') as string;
        const identification = formData.get('identification') as string;
        const organization = formData.get('organization') as string;
        const validityPeriod = formData.get('validityPeriod') as string;
        const purposeOfVisit = formData.get('purposeOfVisit') as string;
        const dateOfVisit = formData.get('dateOfVisit') as string;
        const requestType = formData.get('requestType') as string;
        const passportIdImage = formData.get('passportIdImage') as File | null;
        const photo = formData.get('photo') as File | null;
        const passEndDate = formData.get('passEndDate') as string | null;
        const passFor = formData.get('passFor') as string | null;
        const passTypeId = formData.get('passTypeId') as string | null;

        // Validate required fields using BRD requirements
        const errors: string[] = [];

        if (!applicantNameEn || applicantNameEn.trim().length < 2) {
            errors.push('Applicant name (English) is required (minimum 2 characters)');
        }

        if (!applicantNameAr || applicantNameAr.trim().length < 2) {
            errors.push('Applicant name (Arabic) is required (minimum 2 characters)');
        }

        if (!applicantEmail || !validateEmail(applicantEmail)) {
            errors.push('Valid email address is required');
        }

        if (!applicantPhone || applicantPhone.trim().length < 8) {
            errors.push('Valid phone number is required (minimum 8 characters)');
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

        if (!passEndDate && (!validityPeriod || !['1_DAY', '1_WEEK', '1_MONTH'].includes(validityPeriod))) {
            errors.push('Validity period or Pass End Date is required');
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

        if (!requestType || !['VISITOR', 'CONTRACTOR', 'EMPLOYEE', 'VEHICLE'].includes(requestType)) {
            errors.push('Valid request type is required (VISITOR, CONTRACTOR, EMPLOYEE, or VEHICLE)');
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

        // Handle file uploads
        const uploadFile = async (file: File | null, prefix: string) => {
            if (!file || file.size === 0 || file.name === undefined || file.name === '') return null;

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);


            const maxSize = parseInt(process.env.MAX_FILE_SIZE || '5242880');
            if (buffer.length > maxSize) {
                throw new Error(`File ${file.name} size exceeds 5MB limit`);
            }


            const allowedTypes = ['jpg', 'jpeg', 'png', 'pdf'];
            const fileExt = file.name.split('.').pop()?.toLowerCase().trim();

            if (!fileExt || !allowedTypes.includes(fileExt)) {
                throw new Error(`Only JPG, PNG, and PDF files are allowed for ${file.name}`);
            }


            const isVercel = !!process.env.VERCEL;

            if (isVercel) {

                const mimeType = file.type || (fileExt === 'pdf' ? 'application/pdf' : `image/${fileExt}`);
                const base64 = buffer.toString('base64');
                const dataUrl = `data:${mimeType};base64,${base64}`;


                return dataUrl;
            } else {

                try {

                    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'passports');
                    await mkdir(uploadDir, { recursive: true });


                    const timestamp = Date.now();
                    const filename = `${prefix}_${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                    const filepath = path.join(uploadDir, filename);


                    await writeFile(filepath, buffer);
                    return `/uploads/passports/${filename}`;
                } catch (fsError: any) {

                    console.warn('File system write failed, falling back to base64:', fsError.message);
                    const mimeType = file.type || (fileExt === 'pdf' ? 'application/pdf' : `image/${fileExt}`);
                    const base64 = buffer.toString('base64');
                    const dataUrl = `data:${mimeType};base64,${base64}`;
                    return dataUrl;
                }
            }
        };

        let imagePath: string | null = null;
        let photoPath: string | null = null;
        let otherDoc1Path: string | null = null;
        let otherDoc2Path: string | null = null;

        try {
            imagePath = await uploadFile(passportIdImage, 'passport');
            photoPath = await uploadFile(photo, 'photo');
            otherDoc1Path = await uploadFile(formData.get('otherDocuments1') as File | null, 'other1');
            otherDoc2Path = await uploadFile(formData.get('otherDocuments2') as File | null, 'other2');
        } catch (err: any) {
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
            switch (validityPeriod) {
                case '1_DAY':
                    validTo.setDate(validTo.getDate() + 1);
                    break;
                case '1_WEEK':
                    validTo.setDate(validTo.getDate() + 7);
                    break;
                case '1_MONTH':
                    validTo.setMonth(validTo.getMonth() + 1);
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
                applicantNameEn: applicantNameEn.trim(),
                applicantNameAr: applicantNameAr.trim(),
                applicantEmail: applicantEmail.toLowerCase().trim(),
                applicantPhone: applicantPhone?.trim() || null,
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

            // Add validityPeriod if provided
            if (validityPeriod && validityPeriod.trim() !== '') {
                requestData.validityPeriod = validityPeriod.trim();
            }

            if (otherProfessions !== null && otherProfessions !== undefined) {
                requestData.otherProfessions = otherProfessions.trim();
            }
            if (bloodType) {
                requestData.bloodType = bloodType;
            }
            if (photoPath) {
                requestData.photoPath = photoPath;
            }

            // Try to create the request
            // If passTypeId/validityPeriod columns don't exist, Prisma will throw an error
            // We'll catch it and retry without those fields
            let newRequest;
            try {
                newRequest = await prisma.request.create({
                    data: requestData,
                });
            } catch (createError: any) {
                // If error is about unknown column or unknown argument (passTypeId or validityPeriod don't exist in schema/client), remove them and retry
                const errorMessage = createError?.message || '';
                const errorCode = createError?.code || '';
                
                console.error('Prisma create error:', {
                    message: errorMessage,
                    code: errorCode,
                    hasPassTypeId: 'passTypeId' in requestData,
                    passTypeIdValue: requestData.passTypeId,
                });
                
                // Only catch specific Prisma validation errors about unknown fields
                const isUnknownFieldError = 
                    (errorMessage.includes('Unknown argument') && 
                     (errorMessage.includes('passTypeId') || errorMessage.includes('validityPeriod'))) ||
                    (errorMessage.includes('Unknown column') && 
                     (errorMessage.includes('pass_type_id') || errorMessage.includes('validity_period'))) ||
                    errorCode === 'P2010' || 
                    errorCode === 'P2001';
                
                if (isUnknownFieldError) {
                    console.warn('Columns passTypeId/validityPeriod may not exist in database or Prisma client not regenerated, retrying without them...');
                    console.warn('Original requestData had passTypeId:', requestData.passTypeId, 'validityPeriod:', requestData.validityPeriod);
                    const retryData = { ...requestData };
                    delete retryData.passTypeId;
                    delete retryData.validityPeriod;
                    newRequest = await prisma.request.create({
                        data: retryData,
                    });
                    console.warn('Request created without passTypeId/validityPeriod. Please regenerate Prisma client: npx prisma generate');
                } else {
                    // Re-throw if it's a different error
                    console.error('Different error occurred, re-throwing:', createError);
                    throw createError;
                }
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
                        applicantNameEn,
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
                applicantNameEn,
                requestNumber
            ).catch(err => console.error('Failed to send confirmation email:', err));

            sendAdminNotificationEmail(
                requestNumber,
                applicantNameEn,
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
