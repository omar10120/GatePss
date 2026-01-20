import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const faqs = await prisma.fqa.findMany({
            orderBy: { created_at: 'desc' },
        });

        return NextResponse.json({
            success: true,
            data: faqs,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch FAQs' },
            { status: 500 }
        );
    }
}

