
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import Image from 'next/image';
export default function LanguageSelector() {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const toggleLocale = () => {
        const newLocale = locale === 'en' ? 'ar' : 'en';
        router.push(pathname, { locale: newLocale });
    };
    return (
        <button
            onClick={toggleLocale}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-info-500 transition-colors"
        >
            {locale === 'en' ?
                <Image
                    src="/images/svg/om.svg`"
                    alt="Logo"
                    width={18}
                    height={18}
                    className="object-contain"
                    priority
                />
                :
                <Image
                    src="/images/svg/us.svg"
                    alt="Logo"
                    width={18}
                    height={18}
                    className="object-contain"
                    priority
                />

            }
            <span className="text-sm font-medium">{locale === 'en' ? 'عربي' : 'English'}</span>

        </button>
    )

}



