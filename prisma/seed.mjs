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
                },
            },
            update: {},
            create: {
                userId: subAdmin.id,
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
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

