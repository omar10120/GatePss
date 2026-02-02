import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create permissions
    const permissions = [
        { key: 'VIEW_DASHBOARD', description: 'View dashboard and statistics' },
        { key: 'MANAGE_REQUESTS', description: 'Create, edit, approve, and reject gate pass requests' },
        { key: 'MANAGE_USERS', description: 'Create and manage admin users' },
        { key: 'VIEW_LOGS', description: 'View activity logs and audit trail' },
    ];

    console.log('Creating permissions...');
    for (const permission of permissions) {
        await prisma.permission.upsert({
            where: { key: permission.key },
            update: {},
            create: permission,
        });
    }

    // Create Pass Types
    console.log('Creating pass types...');
    const passTypes = [
        { name_en: 'Permanent', name_ar: 'دائم', is_active: true },
        { name_en: 'Temporary', name_ar: 'مؤقت', is_active: true },
    ];

    for (const passType of passTypes) {
        const existing = await prisma.pass_types.findFirst({
            where: { name_en: passType.name_en },
        });

        if (existing) {
            await prisma.pass_types.update({
                where: { id: existing.id },
                data: {
                    name_en: passType.name_en,
                    name_ar: passType.name_ar,
                    is_active: passType.is_active,
                    updated_at: new Date(),
                },
            });
        } else {
            await prisma.pass_types.create({
                data: {
                    name_en: passType.name_en,
                    name_ar: passType.name_ar,
                    is_active: passType.is_active,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
        }
    }

    // Create Super Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);

    console.log('Creating Super Admin user...');
    const superAdmin = await prisma.user.upsert({
        where: { email: 'amrooody7@gmail.com' },
        update: {},
        create: {
            name: 'Super Administrator',
            email: 'amrooody7@gmail.com',
            passwordHash: hashedPassword,
            role: 'SUPER_ADMIN',
            isActive: true,
        },
    });

    // Assign all permissions to Super Admin
    const allPermissions = await prisma.permission.findMany();
    for (const permission of allPermissions) {
        await prisma.userPermission.upsert({
            where: {
                userId_permissionId: {
                    userId: superAdmin.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                userId: superAdmin.id,
                permissionId: permission.id,
            },
        });
    }
    console.log(allPermissions);


    // Create a sample Sub Admin
    console.log('Creating sample Sub Admin user...');
    const subAdmin = await prisma.user.upsert({
        where: { email: 'subamrooody7@gmail.com' },
        update: {},
        create: {
            name: 'Sub Administrator',
            email: 'subamrooody7@gmail.com',
            passwordHash: hashedPassword,
            role: 'SUB_ADMIN',
            isActive: true,
        },
    });

    // Assign limited permissions to Sub Admin (VIEW_DASHBOARD and MANAGE_REQUESTS)
    const subAdminPermissions = await prisma.permission.findMany({
        where: {
            key: {
                in: ['VIEW_DASHBOARD', 'MANAGE_REQUESTS'],
            },
        },
    });

    for (const permission of subAdminPermissions) {
        await prisma.userPermission.upsert({
            where: {
                userId_permissionId: {
                    userId: subAdmin.id,
                    permissionId: permission.id,
                }
            },
            update: {},
            create: {
                userId: subAdmin.id,
                permissionId: permission.id,
            },
        });
    }

    // Create another Sub Admin
    console.log('Creating another Sub Admin user...');
    const subAdmin2 = await prisma.user.upsert({
        where: { email: 'wsem.dawoodi2001@gmail.com' },
        update: {},
        create: {
            name: 'Sub Administrator 2',
            email: 'wsem.dawoodi2001@gmail.com',
            passwordHash: hashedPassword,
            role: 'SUB_ADMIN',
            isActive: true,
        },
    });

    // Assign limited permissions to Sub Admin 2 (VIEW_DASHBOARD and MANAGE_REQUESTS)
    for (const permission of subAdminPermissions) {
        await prisma.userPermission.upsert({
            where: {
                userId_permissionId: {
                    userId: subAdmin2.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                userId: subAdmin2.id,
                permissionId: permission.id,
            },
        });
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📝 Default credentials:');
    console.log('Super Admin:');
    console.log('  Email: amrooody7@gmail.com');
    console.log('  Password: admin123');
    console.log('\nSub Admin:');
    console.log('  Email: subamrooody7@gmail.com');
    console.log('  Password: admin123');
    console.log('\nSub Admin 2:');
    console.log('  Email: subwsem.dawoodi2001@gmail.com');
    console.log('  Password: admin123');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

