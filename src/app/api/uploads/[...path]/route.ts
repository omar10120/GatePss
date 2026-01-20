import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Serve uploaded files
 * Handles both file system paths (local) and base64 data (Vercel)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: pathSegments } = await params;
        const filePath = pathSegments.join('/');

        // Check if it's a base64 data URL (stored in database for Vercel)
        if (filePath.startsWith('data:')) {
            // Extract base64 data from data URL: data:mimeType;base64,actualBase64Data
            const mimeMatch = filePath.match(/^data:([^;]+);base64,/);
            const base64Match = filePath.match(/base64,(.+)$/);
            
            if (base64Match && base64Match[1]) {
                const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
                const buffer = Buffer.from(base64Match[1], 'base64');
                
                return new NextResponse(buffer, {
                    headers: {
                        'Content-Type': mimeType,
                        'Content-Length': buffer.length.toString(),
                        'Cache-Control': 'public, max-age=31536000, immutable',
                    },
                });
            }
            return new NextResponse('Invalid data URL', { status: 400 });
        }

        // Regular file path - read from file system (local development)
        const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
        
        // Security: Prevent directory traversal
        const normalizedPath = path.normalize(fullPath);
        const publicPath = path.join(process.cwd(), 'public', 'uploads');
        if (!normalizedPath.startsWith(publicPath)) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const fileBuffer = await readFile(normalizedPath);
        const ext = path.extname(normalizedPath).toLowerCase();
        
        // Determine MIME type
        const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.pdf': 'application/pdf',
        };
        
        const mimeType = mimeTypes[ext] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': mimeType,
                'Content-Length': fileBuffer.length.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error: any) {
        console.error('Error serving file:', error);
        return new NextResponse('File not found', { status: 404 });
    }
}

