import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/middleware/api';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        return await requirePermission(request, 'MANAGE_SETTINGS', async (req) => {
            const faqs = await prisma.fqa.findMany({
                orderBy: { created_at: 'desc' },
            });

            return NextResponse.json({
                success: true,
                data: faqs,
            });
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch FAQs' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        return await requirePermission(request, 'MANAGE_SETTINGS', async (req) => {
            const body = await req.json();
            const { question_en, question_ar, answer_en, answer_ar } = body;

            if (!question_en || !question_ar || !answer_en || !answer_ar) {
                return NextResponse.json(
                    { success: false, message: 'All fields (question and answer in both languages) are required' },
                    { status: 400 }
                );
            }

            const faq = await prisma.fqa.create({
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
                message: 'FAQ created successfully',
            });
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create FAQ' },
            { status: 500 }
        );
    }
}

