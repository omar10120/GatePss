import { createNavigation } from 'next-intl/navigation';

export const locales = ['en', 'ar'] as const;
export const defaultLocale = 'en' as const;

export const { Link, redirect, usePathname, useRouter } = createNavigation({
    locales,
    // Note: If you have specialized pathnames, you can add them here
});
