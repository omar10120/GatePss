import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ key: string }> }
) {
    try {
        const { key } = await params;

        const setting = await prisma.setting.findUnique({
            where: { key },
        });

        if (!setting) {
            return NextResponse.json(
                { error: 'Not Found', message: 'Setting not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            key: setting.key,
            value: setting.value,
        });
    } catch (error: any) {
        console.error('Error fetching setting:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: 'Failed to fetch setting' },
            { status: 500 }
        );
    }
}
