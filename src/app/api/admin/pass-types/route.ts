import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        return await requirePermission(request, 'MANAGE_SETTINGS', async (req) => {
            const passTypes = await prisma.pass_types.findMany({
                orderBy: { created_at: 'desc' },
            });

            return NextResponse.json({
                success: true,
                data: passTypes,
            });
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch pass types' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        return await requirePermission(request, 'MANAGE_SETTINGS', async (req) => {
            const body = await req.json();
            const { name_en, name_ar, is_active = true } = body;

            if (!name_en || !name_ar) {
                return NextResponse.json(
                    { success: false, message: 'Name (English and Arabic) is required' },
                    { status: 400 }
                );
            }

            const passType = await prisma.pass_types.create({
                data: {
                    name_en,
                    name_ar,
                    is_active,
                    updated_at: new Date(),
                },
            });

            return NextResponse.json({
                success: true,
                data: passType,
                message: 'Pass type created successfully',
            });
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create pass type' },
            { status: 500 }
        );
    }
}

