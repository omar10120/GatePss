import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing database connection...');
        const count = await prisma.request.count();
        console.log('Successfully connected! Request count:', count);
    } catch (error) {
        console.error('Connection failed:', error);
        console.error(JSON.stringify(error, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

main();
