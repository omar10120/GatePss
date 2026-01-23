import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const passTypes = await prisma.pass_types.findMany({
            where: {
                is_active: true,
            },
            orderBy: {
                created_at: 'desc',
            },
            select: {
                id: true,
                name_en: true,
                name_ar: true,
                is_active: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: passTypes,
        });
    } catch (error: any) {
        console.error('Error fetching pass types:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch pass types' },
            { status: 500 }
        );
    }
}

