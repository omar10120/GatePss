'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePathname, useRouter, Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Sidebar } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import Header from '../../components/Header';
import { apiFetch } from '@/lib/api-client';

interface PermitDetails {
    id: number;
    requestNumber: string;
    externalReference?: string | null;
    applicantNameEn: string;
    applicantNameAr: string;
    applicantEmail: string;
    profession: string;
    requestType: string;
    passFor?: string | null;
    identification: string;
    validFrom: string;
    validTo: string;
    status: string;
    qrCodePdfUrl?: string | null;
    createdAt: string;
}

export default function PermitDetailsPage() {
    const locale = useLocale();
    const t = useTranslations('Admin.permits');
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [permit, setPermit] = useState<PermitDetails | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/admin/login');
            return;
        }

        if (userData) {
            setUser(JSON.parse(userData));
        }

        const fetchPermit = async () => {
            setLoading(true);
            setPermissionDenied(false);
            try {
                const result = await apiFetch<{ request: PermitDetails }>(`/api/admin/permits/${id}`);
                setPermit(result.request || null);
            } catch (error: any) {
                if (error.message?.includes('Forbidden') || error.message?.includes('permission')) {
                    setPermissionDenied(true);
                }
                console.error('Error fetching permit details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPermit().catch((error) => console.error('Error loading permit details:', error));
        }
    }, [id, router]);

    const sidebarItems = getSidebarItems(
        locale as 'en' | 'ar',
        user?.permissions || [],
        user?.role,
        pathname
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('loading')}</p>
                </div>
            </div>
        );
    }

    if (permissionDenied) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-gray-800">{t('permissionDenied')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <Sidebar items={sidebarItems} locale={locale as 'en' | 'ar'} />

            <div className="flex-1" style={{ marginLeft: locale === 'ar' ? '0' : '16rem', marginRight: locale === 'ar' ? '16rem' : '0' }}>
                <Header />

                <main className="px-6 py-8">
                    <div className="mb-6">
                        <Link href="/admin/permits" className="text-info-500 hover:text-primary-700 text-sm font-medium">
                            {t('viewMore')}
                        </Link>
                    </div>

                    {permit ? (
                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
                            <p className="text-gray-600">
                                <strong>ID:</strong> {permit.id}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('permitNumber')}:</strong> {permit.externalReference || permit.requestNumber}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('holderName')}:</strong> {permit.applicantNameEn || permit.applicantNameAr}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('email')}:</strong> {permit.applicantEmail}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('role')}:</strong> {permit.profession}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('requestType')}:</strong> {permit.requestType}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('passType')}:</strong> {permit.passFor || 'N/A'}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('identification')}:</strong> {permit.identification}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('date')}:</strong> {new Date(permit.validFrom).toLocaleDateString()}
                            </p>
                            <p className="text-gray-600">
                                <strong>Status:</strong> {permit.status}
                            </p>
                        </div>
                    ) : (
                        <p className="text-gray-500">Permit not found.</p>
                    )}
                </main>
            </div>
        </div>
    );
}
