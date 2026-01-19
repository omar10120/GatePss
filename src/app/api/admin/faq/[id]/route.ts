import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        return await requirePermission(request, 'MANAGE_SETTINGS', async (req) => {
            const id = parseInt(params.id);
            const body = await req.json();
            const { question_en, question_ar, answer_en, answer_ar } = body;

            if (!question_en || !question_ar || !answer_en || !answer_ar) {
                return NextResponse.json(
                    { success: false, message: 'All fields (question and answer in both languages) are required' },
                    { status: 400 }
                );
            }

            const faq = await prisma.fqa.update({
                where: { id },
                data: {
                    question_en,
                    question_ar,
                    answer_en,
                    answer_ar,
                    updated_at: new Date(),
                },
            });

            return NextResponse.json({
                success: true,
                data: faq,
                message: 'FAQ updated successfully',
            });
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json(
                { success: false, message: 'FAQ not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to update FAQ' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        return await requirePermission(request, 'MANAGE_SETTINGS', async () => {
            const id = parseInt(params.id);

            await prisma.fqa.delete({
                where: { id },
            });

            return NextResponse.json({
                success: true,
                message: 'FAQ deleted successfully',
            });
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json(
                { success: false, message: 'FAQ not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to delete FAQ' },
            { status: 500 }
        );
    }
}

