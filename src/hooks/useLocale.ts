import { useState } from 'react';

export type Locale = 'en' | 'ar';

export const useLocale = (initialLocale: Locale = 'en') => {
    const [locale, setLocale] = useState<Locale>(initialLocale);

    const toggleLocale = () => {
        setLocale((prev) => (prev === 'en' ? 'ar' : 'en'));
    };

    const isRTL = locale === 'ar';

    return {
        locale,
        setLocale,
        toggleLocale,
        isRTL,
    };
};
