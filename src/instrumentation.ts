/**
 * Loads `.env` before the app handles requests (PM2 + `npm start` on cPanel/VPS).
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { config } = await import('dotenv');
        config();
    }
}
