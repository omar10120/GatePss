import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { Storage } from '@/lib/storage';


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
                
                return new NextResponse(new Uint8Array(buffer), {
                    headers: {
                        'Content-Type': mimeType,
                        'Content-Length': buffer.length.toString(),
                        'Cache-Control': 'public, max-age=31536000, immutable',
                    },
                });
            }
            return new NextResponse('Invalid data URL', { status: 400 });
        }

        // Regular file path - read from storage
        // Handle both old paths (/uploads/...) and new paths (...)
        let storagePath = filePath;
        if (storagePath.startsWith('uploads/')) {
            storagePath = storagePath.substring(8);
        } else if (storagePath.startsWith('/uploads/')) {
            storagePath = storagePath.substring(9);
        }

        const fileBuffer = await Storage.readFile(storagePath);
        const ext = path.extname(storagePath).toLowerCase();
        
        // Determine MIME type
        const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.pdf': 'application/pdf',
        };
        
        const mimeType = mimeTypes[ext] || 'application/octet-stream';

        return new NextResponse(new Uint8Array(fileBuffer), {
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

