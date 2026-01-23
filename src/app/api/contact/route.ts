import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendContactFormEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fullName, email, passType, phoneNumber, message } = body;

        // Validate required fields
        if (!fullName || !email || !passType || !phoneNumber || !message) {
            return NextResponse.json(
                { success: false, message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, message: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Get pass type name
        let passTypeName = passType;
        try {
            const passTypeRecord = await prisma.pass_types.findUnique({
                where: { id: parseInt(passType) },
                select: { name_en: true, name_ar: true },
            });
            if (passTypeRecord) {
                passTypeName = passTypeRecord.name_en || passTypeRecord.name_ar || passType;
            }
        } catch (error) {
            console.error('Error fetching pass type:', error);
        }

        // Get super admin emails from database
        const superAdmins = await prisma.user.findMany({
            where: {
                role: 'SUPER_ADMIN',
                isActive: true,
            },
            select: {
                email: true,
            },
        });

        const superAdminEmails = superAdmins.map(admin => admin.email);

        // Fallback to ADMIN_EMAIL_GROUP if no super admins found
        const adminEmails = superAdminEmails.length > 0 
            ? superAdminEmails 
            : (process.env.ADMIN_EMAIL_GROUP?.split(',').map(e => e.trim()).filter(Boolean) || []);

        if (adminEmails.length === 0) {
            console.warn('⚠️ No super admin emails found. Contact form submission will not be sent via email.');
        } else {
            // Send email to super admins
            try {
                await sendContactFormEmail(
                    fullName,
                    email,
                    passTypeName,
                    phoneNumber,
                    message,
                    adminEmails
                );
                console.log(`✅ Contact form email sent to super admins: ${adminEmails.join(', ')}`);
            } catch (emailError) {
                console.error('❌ Error sending contact form email:', emailError);
                // Don't fail the request if email fails
            }
        }

        // Log the submission
        console.log('Contact form submission:', {
            fullName,
            email,
            passType: passTypeName,
            phoneNumber,
            message,
            submittedAt: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: 'Your message has been received. We will get back to you soon.',
        });
    } catch (error: any) {
        console.error('Error processing contact form:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to process contact form' },
            { status: 500 }
        );
    }
}

