'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePathname, useRouter, Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AdminShell } from '@/components/layout';
import { getSidebarItems } from '@/config/navigation';
import Header from '../../components/Header';
import { apiFetch } from '@/lib/api-client';
import { formatDate } from '@/utils/helpers';

interface PermitDetails {
    id: number;
    requestNumber: string;
    externalReference?: string | null;
    applicantNameEn: string;
    applicantNameAr: string;
    applicantEmail: string;
    dateOfVisit: string;
    profession: string;
    requestType: string;
    passFor?: string | null;
    identification: string;
    validFrom: string;
    validTo: string;
    status: string;
    passportIdNumber  : string;
    qrCodePdfUrl?: string | null;
    createdAt: string;
    approvedBy: {
        id: number;
        name: string;
        email: string;
    };
    gender: string;
    applicantPhone:string,
    otherProfessions:string,
    photoPath:string,
    nationality:string,
    organization:string,
    purposeOfVisit:string,
    rejectionReason:string,
    

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

    const formatDateOfVisit = (dateOfVisit: string) => {
        const date = new Date(dateOfVisit);
        const days = date.getUTCDate();
        return `${days} ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }`;
    }
    const numberofdaystovisist = ()=>{
        const numbersofdaays = new Date(permit?.validFrom || '').getTime() - new Date(permit?.validTo || '').getTime();
        return numbersofdaays / (1000 * 60 * 60 * 24);
    }

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
        <AdminShell items={sidebarItems} locale={locale as 'en' | 'ar'}>
                <Header />

                <main className="px-6 py-8">
                    <div className="mb-6">
                        <Link href="/admin/permits" className="text-info-500 hover:text-primary-700 text-sm font-medium">
                           &lt; {t('back')}
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
                                <strong>{t('holderNameAr')}:</strong> {permit.applicantNameEn }
                            </p>
                            
                            <p className="text-gray-600">
                                <strong>{t('holderNameEn')}:</strong> {permit.applicantNameAr }
                            </p>

                            <p className="text-gray-600">
                                <strong>{t('email')}:</strong> {permit.applicantEmail}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('role')}:</strong> {permit.profession}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('number_of_days_to_visit')}:</strong> {numberofdaystovisist().toFixed(0)}
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
                                <strong>{t('date')}:</strong> {formatDate(permit.validFrom)}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('dateOfVisit')}:</strong> {formatDateOfVisit(permit.dateOfVisit)}
                            </p>
                            <p className="text-gray-600">
                                <strong>Status:</strong> {permit.status}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('passportIdNumber')}:</strong> {permit.passportIdNumber}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('approvedby')}:</strong> {permit.approvedBy?.name || '-'}
                            </p>
                            {permit.qrCodePdfUrl && ( 
                                <p className="text-gray-600">
                                    <strong><b>{t('qrCodePdfUrl')}</b>:</strong> {permit.qrCodePdfUrl}
                                </p>
                            )}
                            <p className="text-gray-600">
                                <strong>{t('gender')}:</strong> {permit.gender}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('applicantPhone')}:</strong> {permit.applicantPhone}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('otherProfessions')}:</strong> {permit.otherProfessions}
                            </p>
                            {/* <p className="text-gray-600">
                                {
                                    (() => {
                                        const url = permit.photoPath;
                                        const isDataUrl = url.startsWith('data:image/');
                                        const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
                                        const isImage = isDataUrl || extensions.some(ext => url.toLowerCase().split('?')[0].endsWith(ext));
                                      
                                        if (isImage) {
                                            return <img src={url} alt="Photo" className="w-20 h-20 object-cover rounded-full" />;
                                        }
                                        return <p>{url}</p>;
                                    })()
                                }
                            </p> */}
                            <p className="text-gray-600">
                                <strong>{t('nationality')}:</strong> {permit.nationality}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('organization')}:</strong> {permit.organization}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('purposeOfVisit')}:</strong> {permit.purposeOfVisit}
                            </p>
                            <p className="text-gray-600">
                                <strong>{t('rejectionReason')}:</strong> {permit.rejectionReason}
                            </p>
                            <p className="text-gray-600"></p>
                        </div>
                    ) : (
                        <p className="text-gray-500">Permit not found.</p>
                    )}
                </main>
        </AdminShell>
    );
}
