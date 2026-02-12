import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing summary queries...');
        
        console.log('1. Counting requests...');
        const [total, approved, rejected, pending] = await Promise.all([
            prisma.request.count(),
            prisma.request.count({ where: { status: 'APPROVED' } }),
            prisma.request.count({ where: { status: 'REJECTED' } }),
            prisma.request.count({ where: { status: 'PENDING' } }),
        ]);
        console.log('Counts:', { total, approved, rejected, pending });

        console.log('2. Grouping by requestType...');
        const byType = await prisma.request.groupBy({
            by: ['requestType'],
            _count: true,
        });
        console.log('By Type:', byType);

        console.log('3. Fetching recent requests...');
        const recentRequests = await prisma.request.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                requestNumber: true,
                applicantNameEn: true,
                applicantNameAr: true,
                applicantEmail: true,
                status: true,
                requestType: true,
                createdAt: true,
            },
        });
        console.log('Recent Requests count:', recentRequests.length);

        console.log('Summary queries completed successfully!');

    } catch (error) {
        console.error('Error during queries:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
