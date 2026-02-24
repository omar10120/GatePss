import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';
import { createRequestNotifications } from '@/utils/notification-helper';
import { ActionType } from '@/lib/enums';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

            // Update allowed fields
            const updateData: any = {};

            if (body.applicantNameEn) updateData.applicantNameEn = typeof body.applicantNameEn === 'string' ? body.applicantNameEn.trim() : body.applicantNameEn;
            if (body.applicantNameAr) updateData.applicantNameAr = typeof body.applicantNameAr === 'string' ? body.applicantNameAr.trim() : body.applicantNameAr;
            if (body.applicantEmail) updateData.applicantEmail = typeof body.applicantEmail === 'string' ? body.applicantEmail.toLowerCase().trim() : body.applicantEmail;
            if (body.applicantPhone) updateData.applicantPhone = typeof body.applicantPhone === 'string' ? body.applicantPhone.trim() : body.applicantPhone;
            if (body.passportIdNumber) updateData.passportIdNumber = typeof body.passportIdNumber === 'string' ? body.passportIdNumber.toUpperCase().trim() : body.passportIdNumber;
            if (body.purposeOfVisit) updateData.purposeOfVisit = typeof body.purposeOfVisit === 'string' ? body.purposeOfVisit.trim() : body.purposeOfVisit;
            if (body.dateOfVisit) updateData.dateOfVisit = new Date(body.dateOfVisit);
            if (body.validFrom) updateData.validFrom = new Date(body.validFrom);
            if (body.validTo) updateData.validTo = new Date(body.validTo);
            if (body.requestType) updateData.requestType = body.requestType;
            if (body.passFor !== undefined) updateData.passFor = typeof body.passFor === 'string' ? body.passFor.trim() || null : body.passFor;
            if (body.nationality) updateData.nationality = typeof body.nationality === 'string' ? body.nationality.trim() : body.nationality;
            if (body.identification) updateData.identification = typeof body.identification === 'string' ? body.identification.trim() : body.identification;
            if (body.gender) updateData.gender = typeof body.gender === 'string' ? body.gender.trim() : body.gender;
            if (body.profession) updateData.profession = typeof body.profession === 'string' ? body.profession.trim() : body.profession;
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
            if (body.visitduration) updateData.visitduration = typeof body.visitduration === 'string' ? body.visitduration.trim() : body.visitduration;
            if (body.entityType) updateData.entityType = typeof body.entityType === 'string' ? body.entityType.trim() : body.entityType;
            if (body.otherProfessions !== undefined) updateData.otherProfessions = typeof body.otherProfessions === 'string' ? body.otherProfessions.trim() || null : body.otherProfessions;


            // Handle file uploads
            try {
                if (body.passportIdImage instanceof File) {
                    const imagePath = await uploadFile(body.passportIdImage, 'passport');
                    if (imagePath) {
                        updateData.passportIdImagePath = imagePath;
                    }
                }
                if (body.photo instanceof File) {
                    const photoPath = await uploadFile(body.photo, 'photo');
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
                }
                if (body.otherDocuments1 instanceof File) {
                    const otherDoc1Path = await uploadFile(body.otherDocuments1, 'other1');
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
                }
                if (body.otherDocuments2 instanceof File) {
                    const otherDoc2Path = await uploadFile(body.otherDocuments2, 'other2');
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
