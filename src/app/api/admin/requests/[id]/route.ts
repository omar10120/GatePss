import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { createRequestNotifications } from '@/utils/notification-helper';
import { ActionType } from '@/lib/enums';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { Storage } from '@/lib/storage';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    return requirePermission(request, 'MANAGE_REQUESTS', async (req, user) => {
        try {
            const requestId = parseInt(id);

            if (isNaN(requestId)) {
                return NextResponse.json(
                    { error: 'Invalid Request', message: 'Invalid request ID' },
                    { status: 400 }
                );
            }

            const gateRequest = await prisma.request.findUnique({
                where: { id: requestId },
                include: {
                    approvedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    uploads: true,
                },
            });

            if (!gateRequest) {
                return NextResponse.json(
                    { error: 'Not Found', message: 'Request not found' },
                    { status: 404 }
                );
            }

            // Fetch logs separately since we decoupled the relation
            const logs = await prisma.activityLog.findMany({
                where: {
                    affectedEntityType: 'REQUEST',
                    affectedEntityId: requestId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    timestamp: 'desc',
                },
                take: 10,
            });

            return NextResponse.json({
                success: true,
                data: {
                    ...gateRequest,
                    logs,
                },
            });

        } catch (error: any) {
            console.error('Error fetching request:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to fetch request details' },
                { status: 500 }
            );
        }
    });
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    return requirePermission(request, 'MANAGE_REQUESTS', async (req, user) => {
        try {
            const requestId = parseInt(id);

            if (isNaN(requestId)) {
                return NextResponse.json(
                    { error: 'Invalid Request', message: 'Invalid request ID' },
                    { status: 400 }
                );
            }

            // Check if request is FormData (file upload) or JSON
            const contentType = req.headers.get('content-type') || '';
            let body: any;

            if (contentType.includes('multipart/form-data')) {
                const formData = await req.formData();
                body = {};

                // Extract text fields
                for (const [key, value] of formData.entries()) {
                    if (value instanceof File) {
                        body[key] = value;
                    } else {
                        body[key] = value;
                    }
                }
            } else {
                body = await req.json();
            }

            // Check if request exists and is pending
            const existingRequest = await prisma.request.findUnique({
                where: { id: requestId },
            });

            if (!existingRequest) {
                return NextResponse.json(
                    { error: 'Not Found', message: 'Request not found' },
                    { status: 404 }
                );
            }

            // Allow editing for all statuses (removed restriction)

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

            // Update allowed fields
            const updateData: any = {};

            if (body.applicantNameEn !== undefined) updateData.applicantNameEn = typeof body.applicantNameEn === 'string' ? body.applicantNameEn.trim() : body.applicantNameEn;
            if (body.applicantNameAr !== undefined) updateData.applicantNameAr = typeof body.applicantNameAr === 'string' ? body.applicantNameAr.trim() : body.applicantNameAr;
            if (body.applicantEmail !== undefined) updateData.applicantEmail = typeof body.applicantEmail === 'string' ? body.applicantEmail.toLowerCase().trim() : body.applicantEmail;
            if (body.applicantPhone !== undefined) updateData.applicantPhone = typeof body.applicantPhone === 'string' ? body.applicantPhone.trim() : body.applicantPhone;
            if (body.passportIdNumber !== undefined) updateData.passportIdNumber = typeof body.passportIdNumber === 'string' ? body.passportIdNumber.toUpperCase().trim() : body.passportIdNumber;
            if (body.purposeOfVisit !== undefined) updateData.purposeOfVisit = typeof body.purposeOfVisit === 'string' ? body.purposeOfVisit.trim() : body.purposeOfVisit;
            if (body.dateOfVisit !== undefined) updateData.dateOfVisit = new Date(body.dateOfVisit);
            if (body.validFrom !== undefined) updateData.validFrom = new Date(body.validFrom);
            if (body.validTo !== undefined) updateData.validTo = new Date(body.validTo);
            if (body.organization !== undefined) updateData.organization = typeof body.organization === 'string' ? body.organization.trim() : body.organization;
            if (body.requestType !== undefined) updateData.requestType = body.requestType;
            if (body.passFor !== undefined) updateData.passFor = typeof body.passFor === 'string' ? body.passFor.trim() || null : body.passFor;
            if (body.nationality !== undefined) updateData.nationality = typeof body.nationality === 'string' ? body.nationality.trim() : body.nationality;
            if (body.identification !== undefined) updateData.identification = typeof body.identification === 'string' ? body.identification.trim() : body.identification;
            if (body.gender !== undefined) updateData.gender = typeof body.gender === 'string' ? body.gender.trim() : body.gender;
            if (body.profession !== undefined) updateData.profession = typeof body.profession === 'string' ? body.profession.trim() : body.profession;
            if (body.passTypeId !== undefined) {
                if (body.passTypeId === null || body.passTypeId === '') {
                    updateData.passTypeId = null;
                } else {
                    const parsedId = parseInt(String(body.passTypeId));
                    if (!isNaN(parsedId)) {
                        updateData.passTypeId = parsedId;
                    }
                }
            }
            if (body.visitduration !== undefined) updateData.visitduration = typeof body.visitduration === 'string' ? body.visitduration.trim() : body.visitduration;
            if (body.entityType !== undefined) updateData.entityType = typeof body.entityType === 'string' ? body.entityType.trim() : body.entityType;
            if (body.otherProfessions !== undefined) updateData.otherProfessions = typeof body.otherProfessions === 'string' ? body.otherProfessions.trim() || null : body.otherProfessions;


            // Handle file uploads
            try {
                console.log('[API-Requests] PUT Body Keys:', Object.keys(body));
                
                if (body.passportIdImage instanceof File) {
                    console.log('[API-Requests] Uploading passport image...');
                    const imagePath = await uploadFile(body.passportIdImage, 'passport', 2 * 1024 * 1024, ['jpg', 'jpeg', 'png', 'pdf']);
                    if (imagePath) {
                        updateData.passportIdImagePath = imagePath;
                    }
                }
                
                // Handle Photo - Check for both upload and removal
                if (body.photo instanceof File) {
                    console.log('[API-Requests] Uploading new photo...');
                    const photoPath = await uploadFile(body.photo, 'photo', 250 * 1024, ['jpg', 'jpeg', 'png']);
                    if (photoPath) {
                        // Update or create photo upload
                        const existingPhoto = await prisma.upload.findFirst({
                            where: { requestId, fileType: 'PHOTO' }
                        });
                        if (existingPhoto) {
                            await prisma.upload.update({
                                where: { id: existingPhoto.id },
                                data: { filePath: photoPath }
                            });
                        } else {
                            await prisma.upload.create({
                                data: {
                                    requestId,
                                    fileType: 'PHOTO',
                                    filePath: photoPath
                                }
                            });
                        }
                    }
                } else if (body.remove_photo === 'true' || body.remove_photo === true) {
                    console.log(`[API-Requests] Removing photo for request ${requestId}`);
                    await prisma.upload.deleteMany({
                        where: { requestId, fileType: 'PHOTO' }
                    });
                }
                
                // Handle Other Documents 1
                if (body.otherDocuments1 instanceof File) {
                    console.log('[API-Requests] Uploading other document 1...');
                    const otherDoc1Path = await uploadFile(body.otherDocuments1, 'other1', 2 * 1024 * 1024, ['pdf']);
                    if (otherDoc1Path) {
                        const existingOther1 = await prisma.upload.findFirst({
                            where: { requestId, fileType: 'OTHER_DOCUMENT_1' }
                        });
                        if (existingOther1) {
                            await prisma.upload.update({
                                where: { id: existingOther1.id },
                                data: { filePath: otherDoc1Path }
                            });
                        } else {
                            await prisma.upload.create({
                                data: {
                                    requestId,
                                    fileType: 'OTHER_DOCUMENT_1',
                                    filePath: otherDoc1Path
                                }
                            });
                        }
                    }
                } else if (body.remove_otherDocuments1 === 'true' || body.remove_otherDocuments1 === true) {
                    console.log(`[API-Requests] Removing other document 1 for request ${requestId}`);
                    await prisma.upload.deleteMany({
                        where: { requestId, fileType: 'OTHER_DOCUMENT_1' }
                    });
                }
                if (body.otherDocuments2 instanceof File) {
                    const otherDoc2Path = await uploadFile(body.otherDocuments2, 'other2', 2 * 1024 * 1024, ['pdf']);
                    if (otherDoc2Path) {
                        const existingOther2 = await prisma.upload.findFirst({
                            where: { requestId, fileType: 'OTHER_DOCUMENT_2' }
                        });
                        if (existingOther2) {
                            await prisma.upload.update({
                                where: { id: existingOther2.id },
                                data: { filePath: otherDoc2Path }
                            });
                        } else {
                            await prisma.upload.create({
                                data: {
                                    requestId,
                                    fileType: 'OTHER_DOCUMENT_2',
                                    filePath: otherDoc2Path
                                }
                            });
                        }
                    }
                } else if (body.remove_otherDocuments2 === 'true' || body.remove_otherDocuments2 === true) {
                    await prisma.upload.deleteMany({
                        where: { requestId, fileType: 'OTHER_DOCUMENT_2' }
                    });
                }
            } catch (fileError: any) {
                return NextResponse.json(
                    { error: 'File Upload Error', message: fileError.message },
                    { status: 400 }
                );
            }

            // Try to update the request
            // If passTypeId/visitduration columns don't exist in Prisma client, remove them and retry
            let updatedRequest;
            try {
                updatedRequest = await prisma.request.update({
                    where: { id: requestId },
                    data: updateData,
                });
            } catch (updateError: any) {
                // If error is about unknown column or unknown argument (passTypeId or visitduration don't exist in schema/client), remove them and retry
                const errorMessage = updateError?.message || '';
                const errorCode = updateError?.code || '';

                if (errorMessage.includes('Unknown column') ||
                    errorMessage.includes('Unknown argument') ||
                    errorMessage.includes('pass_type_id') ||
                    errorMessage.includes('passTypeId') ||
                    errorMessage.includes('validity_period') ||
                    errorMessage.includes('visitduration') ||
                    errorMessage.includes('entityType') ||
                    errorCode === 'P2010' ||
                    errorCode === 'P2001') {
                    console.warn('Columns passTypeId/visitduration/entityType may not exist in database or Prisma client not regenerated, retrying without them...');
                    const retryData = { ...updateData };
                    delete retryData.passTypeId;
                    delete retryData.visitduration;
                    delete retryData.entityType;
                    updatedRequest = await prisma.request.update({
                        where: { id: requestId },
                        data: retryData,
                    });
                } else {
                    // Re-throw if it's a different error
                    throw updateError;
                }
            }

            // Log the update
            await prisma.activityLog.create({
                data: {
                    userId: user.userId,
                    actionType: 'REQUEST_MANAGEMENT',
                    actionPerformed: `Updated request ${existingRequest.requestNumber}`,
                    affectedEntityType: 'REQUEST',
                    affectedEntityId: requestId,
                    details: JSON.stringify({
                        updatedFields: Object.keys(updateData),
                        updatedBy: user.email,
                    }),
                },
            });

            // Create notifications for all admins (async, don't wait)
            createRequestNotifications(
                ActionType.REQUEST_MANAGEMENT,
                `Updated request ${existingRequest.requestNumber}`,
                'REQUEST',
                requestId,
                user.userId,
                `تم تحديث الطلب ${existingRequest.requestNumber}`
            ).catch(err => console.error('Failed to create notifications:', err));

            return NextResponse.json({
                success: true,
                message: 'Request updated successfully',
                data: updatedRequest,
            });

        } catch (error: any) {
            console.error('Error updating request:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to update request' },
                { status: 500 }
            );
        }
    });
}
