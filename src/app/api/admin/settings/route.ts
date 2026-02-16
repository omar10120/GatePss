import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/middleware/api';
import { ActionType } from '@/lib/enums';

export async function GET(request: NextRequest) {
    return requirePermission(request, 'MANAGE_SETTINGS', async () => {
        try {
            const settings = await prisma.setting.findMany();
            return NextResponse.json(settings);
        } catch (error: any) {
            console.error('Error fetching settings:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to fetch settings' },
                { status: 500 }
            );
        }
    });
}

export async function POST(request: NextRequest) {
    return requirePermission(request, 'MANAGE_SETTINGS', async (req, user) => {
        try {
            const body = await request.json();
            const { key, value } = body;

            if (!key) {
                return NextResponse.json(
                    { error: 'Validation Error', message: 'Key is required' },
                    { status: 400 }
                );
            }

            const setting = await prisma.setting.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            });

            // Log the action
            await prisma.activityLog.create({
                data: {
                    actionType: ActionType.SYSTEM_INTEGRATION,
                    actionPerformed: `Updated setting: ${key}`,
                    affectedEntityType: 'SETTING',
                    affectedEntityId: setting.id,
                    userId: user.userId,
                    details: JSON.stringify({ key, value }),
                },
            });

            return NextResponse.json(setting);
        } catch (error: any) {
            console.error('Error updating setting:', error);
            return NextResponse.json(
                { error: 'Internal Server Error', message: 'Failed to update setting' },
                { status: 500 }
            );
        }
    });
}
