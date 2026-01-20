import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        return await requirePermission(request, 'MANAGE_SETTINGS', async (req) => {
            const id = parseInt(idParam);
            const body = await req.json();
            const { name_en, name_ar, is_active } = body;

            if (!name_en || !name_ar) {
                return NextResponse.json(
                    { success: false, message: 'Name (English and Arabic) is required' },
                    { status: 400 }
                );
            }

            const passType = await prisma.pass_types.update({
                where: { id },
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
                message: 'Pass type updated successfully',
            });
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json(
                { success: false, message: 'Pass type not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to update pass type' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        return await requirePermission(request, 'MANAGE_SETTINGS', async () => {
            const id = parseInt(idParam);

            await prisma.pass_types.delete({
                where: { id },
            });

            return NextResponse.json({
                success: true,
                message: 'Pass type deleted successfully',
            });
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json(
                { success: false, message: 'Pass type not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to delete pass type' },
            { status: 500 }
        );
    }
}

