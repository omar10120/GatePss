import createMiddleware from 'next-intl/middleware';

/** Next.js 16+: use `proxy.ts` instead of deprecated `middleware.ts`. next-intl still uses `createMiddleware`. */
export default createMiddleware({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
});

export const config = {
  matcher: ['/', '/(ar|en)/:path*'],
};
