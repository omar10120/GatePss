import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Set runtime to edge or nodejs based on your needs
export const runtime = 'nodejs';
export const maxDuration = 10; // 10 seconds max duration for Vercel

export async function GET() {
    try {
        // Check if Prisma client is available
        if (!prisma || !prisma.pass_types) {
            console.error('Prisma client is not available');
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Database connection error. Please try again later.',
                    data: [] 
                },
                { status: 500 }
            );
        }

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
            data: passTypes || [],
        });
    } catch (error: any) {
        console.error('Error fetching pass types:', error);
        console.error('Error details:', {
            message: error?.message,
            code: error?.code,
            name: error?.name,
        });

        // Handle specific Prisma errors
        if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database server')) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Database connection failed. Please try again later.',
                    data: [] 
                },
                { status: 503 } // Service Unavailable
            );
        }

        // Return empty array instead of failing completely
        return NextResponse.json(
            { 
                success: false, 
                message: error?.message || 'Failed to fetch pass types. Please try again later.',
                data: [] 
            },
            { status: 500 }
        );
    }
}

