import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing database connection...');
        const count = await prisma.request.count();
        console.log('Successfully connected! Request count:', count);
    } catch (error) {
        console.error('Connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
