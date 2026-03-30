'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import SuccessModal from '@/components/ui/SuccessModal';
import { apiFetch } from '@/lib/api-client';

export default function GeneralSettings() {
    const t = useTranslations('Admin.settings.general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [applicantPhone, setApplicantPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const settings = await apiFetch<any[]>(`/api/admin/settings`);
            const phoneSetting = settings.find(s => s.key === 'applicant_phone');
            if (phoneSetting) setApplicantPhone(phoneSetting.value);

            const emailSetting = settings.find(s => s.key === 'contact_email');
            if (emailSetting) setContactEmail(emailSetting.value);

            const contactPhoneSetting = settings.find(s => s.key === 'contact_phone');
            if (contactPhoneSetting) setContactPhone(contactPhoneSetting.value);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                apiFetch('/api/admin/settings', {
                    method: 'POST',
                    body: JSON.stringify({ key: 'applicant_phone', value: applicantPhone }),
                }),
                apiFetch('/api/admin/settings', {
                    method: 'POST',
                    body: JSON.stringify({ key: 'contact_email', value: contactEmail }),
                }),
                apiFetch('/api/admin/settings', {
                    method: 'POST',
                    body: JSON.stringify({ key: 'contact_phone', value: contactPhone }),
                }),
            ]);
            setShowSuccessModal(true);
        } catch (error: any) {
            alert(error.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">{t('title')}</h3>

            <div className="max-w-md space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('applicantPhoneLabel')}
                    </label>
                    <input
                        type="text"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20 outline-none transition-all"
                        placeholder="+968XXXXXXXX"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                        {t('applicantPhoneHelp')}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('contactEmailLabel')}
                    </label>
                    <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20 outline-none transition-all"
                        placeholder="support@example.com"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                        {t('contactEmailHelp')}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('contactPhoneLabel')}
                    </label>
                    <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20 outline-none transition-all"
                        placeholder="+968XXXXXXXX"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                        {t('contactPhoneHelp')}
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full px-6 py-4 bg-[#00B09C] text-white rounded-xl font-bold text-lg hover:bg-[#008f7e] transition-colors disabled:opacity-50"
                >
                    {saving ? t('saving') : t('save')}
                </button>
            </div>

            {showSuccessModal && (
                <SuccessModal
                    message={t('savedSuccessfully')}
                    onClose={() => setShowSuccessModal(false)}
                />
            )}
        </div>
    );
}
