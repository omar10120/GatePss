import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateRequestNumber, validateEmail, validatePassportId } from '@/utils/helpers';
import { sendRequestConfirmationEmail, sendAdminNotificationEmail } from '@/lib/email';
import { ActionType, RequestType } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Extract form fields
        const applicantName = formData.get('applicantName') as string;
        const applicantEmail = formData.get('applicantEmail') as string;
        const passportIdNumber = formData.get('passportIdNumber') as string;
        const purposeOfVisit = formData.get('purposeOfVisit') as string;
        const dateOfVisit = formData.get('dateOfVisit') as string;
        const requestType = formData.get('requestType') as string;
        const passportIdImage = formData.get('passportIdImage') as File | null;
        const extraFieldsStr = formData.get('extraFields') as string;

        // Validate required fields
        const errors: string[] = [];

        if (!applicantName || applicantName.trim().length < 2) {
            errors.push('Applicant name is required (minimum 2 characters)');
        }

        if (!applicantEmail || !validateEmail(applicantEmail)) {
            errors.push('Valid email address is required');
        }

        if (!passportIdNumber || !validatePassportId(passportIdNumber)) {
            errors.push('Valid passport/ID number is required (6-20 alphanumeric characters)');
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

            if (visitDate < today) {
                errors.push('Date of visit cannot be in the past');
            }
        }

        if (!requestType || !['VISITOR', 'CONTRACTOR', 'EMPLOYEE', 'VEHICLE'].includes(requestType)) {
            errors.push('Valid request type is required');
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

        // Handle file upload
        let imagePath: string | null = null;

        if (passportIdImage) {
            const bytes = await passportIdImage.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Validate file size (5MB max)
            const maxSize = parseInt(process.env.MAX_FILE_SIZE || '5242880');
            if (buffer.length > maxSize) {
                return NextResponse.json(
                    { error: 'Validation Error', message: 'File size exceeds 5MB limit' },
                    { status: 400 }
                );
            }

            // Validate file type
            const allowedTypes = ['jpg', 'jpeg', 'png', 'pdf'];
            const fileExt = passportIdImage.name.split('.').pop()?.toLowerCase();
            if (!fileExt || !allowedTypes.includes(fileExt)) {
                return NextResponse.json(
                    { error: 'Validation Error', message: 'Only JPG, PNG, and PDF files are allowed' },
                    { status: 400 }
                );
            }

            // Create upload directory if it doesn't exist
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'passports');
            await mkdir(uploadDir, { recursive: true });

            // Generate unique filename
            const timestamp = Date.now();
            const filename = `passport_${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filepath = path.join(uploadDir, filename);

            // Save file
            await writeFile(filepath, buffer);
            imagePath = `/uploads/passports/${filename}`;
        }

        // Parse extra fields
        let extraFields = null;
        if (extraFieldsStr) {
            try {
                extraFields = JSON.parse(extraFieldsStr);
            } catch (e) {
                console.warn('Failed to parse extra fields:', e);
            }
        }

        // Generate request number
        const requestNumber = generateRequestNumber();

        // Create request in database
        const newRequest = await prisma.request.create({
            data: {
                requestNumber,
                applicantName: applicantName.trim(),
                applicantEmail: applicantEmail.toLowerCase().trim(),
                passportIdNumber: passportIdNumber.toUpperCase().trim(),
                passportIdImagePath: imagePath,
                purposeOfVisit: purposeOfVisit.trim(),
                dateOfVisit: new Date(dateOfVisit),
                requestType: requestType as RequestType,
                extraFields: extraFields ? JSON.stringify(extraFields) : undefined,
            },
        });

        // Log the request creation
        await prisma.activityLog.create({
            data: {
                actionType: ActionType.REQUEST_MANAGEMENT,
                actionPerformed: `New gate pass request submitted: ${requestNumber}`,
                affectedEntityType: 'REQUEST',
                affectedEntityId: newRequest.id,
                details: JSON.stringify({
                    requestNumber,
                    applicantName,
                    applicantEmail,
                    requestType,
                }),
            },
        });

        // Send confirmation email to applicant (async, don't wait)
        sendRequestConfirmationEmail(
            applicantEmail,
            applicantName,
            requestNumber
        ).catch(err => console.error('Failed to send confirmation email:', err));

        // Send notification to admins (async, don't wait)
        sendAdminNotificationEmail(
            requestNumber,
            applicantName,
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

    } catch (error: unknown) {
        console.error('Request submission error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: 'Failed to submit request. Please try again.' },
            { status: 500 }
        );
    }
}
