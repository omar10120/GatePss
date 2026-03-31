import path from 'path';
import { mkdir, writeFile, readFile } from 'fs/promises';

/**
 * Centrally managed storage paths and utilities
 */
export const Storage = {
    /**
     * Get the absolute path to the root storage directory
     */
    getStorageRoot(): string {
        // Preference: Environment variable (useful for Hostinger persistent storage)
        if (process.env.STORAGE_UPLOAD_PATH) {
            // Path provided usually points to 'uploads' - get its parent
            return path.dirname(process.env.STORAGE_UPLOAD_PATH);
        }
        return path.join(process.cwd(), 'public'); // Fallback if no storage path is set
    },

    /**
     * Get the absolute path to the root uploads directory
     */
    getUploadRoot(): string {
        if (process.env.STORAGE_UPLOAD_PATH) {
            return process.env.STORAGE_UPLOAD_PATH;
        }

        // Default: public/uploads in current working directory
        return path.join(process.cwd(), 'public', 'uploads');
    },

    /**
     * Get the absolute path to the logs directory
     */
    getLogsRoot(): string {
        const storageRoot = this.getStorageRoot();
        // If storage root is 'public', then stay in the app root for logs
        if (storageRoot === path.join(process.cwd(), 'public')) {
            return path.join(process.cwd(), 'public');
        }
        return path.join(storageRoot, 'public');
    },

    /**
     * Get the absolute path for a specific relative upload path
     */
    getUploadPath(relativePath: string = ''): string {
        // Ensure relativePath doesn't start with /
        const cleanRelative = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        return path.join(this.getUploadRoot(), cleanRelative);
    },

    /**
     * Ensure a directory exists
     */
    async ensureDir(dirPath: string): Promise<void> {
        await mkdir(dirPath, { recursive: true });
    },

    /**
     * Save a file and return its public URL path
     */
    async saveFile(file: File, prefix: string, subfolder: string = 'passports'): Promise<string> {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileExt = file.name.split('.').pop()?.toLowerCase().trim() || 'bin';
        const timestamp = Date.now();
        const filename = `${prefix}_${timestamp}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

        const uploadDir = this.getUploadPath(subfolder);
        // Ensure folder exists (logs if failure happens on Hostinger)
        try {
            await this.ensureDir(uploadDir);
        } catch (err: any) {
            console.error(`[Storage] FAILED to create directory ${uploadDir}:`, err.message);
            throw err;
        }

        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        // Always return the path relative to the uploads root for consistency in DB
        return `${subfolder}/${filename}`;
    },

    /**
     * Read a file from storage
     */
    async readFile(relativePath: string): Promise<Buffer> {
        const fullPath = this.getUploadPath(relativePath);
        // Security: Prevent directory traversal (basic check)
        const normalizedPath = path.normalize(fullPath);
        const rootPath = path.normalize(this.getUploadRoot());

        if (!normalizedPath.startsWith(rootPath)) {
            throw new Error('Access denied: Directory traversal attempted');
        }

        return await readFile(normalizedPath);
    }
};
