'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import SuccessModal from '@/components/ui/SuccessModal';
import { apiFetch } from '@/lib/api-client';

interface PassType {
    id: number;
    name_en: string;
    name_ar: string;
    is_active: boolean;
    created_at: string;
}

export default function PassTypes() {
    const t = useTranslations('Admin.settings.passTypes');
    const [passTypes, setPassTypes] = useState<PassType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPassType, setEditingPassType] = useState<PassType | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        name_en: '',
        name_ar: '',
        is_active: true,
    });

    useEffect(() => {
        fetchPassTypes();
    }, []);

    const fetchPassTypes = async () => {
        setLoading(true);
        try {
            const result = await apiFetch<PassType[]>(`/api/admin/pass-types`);
            setPassTypes(result);
        } catch (error) {
            console.error('Error fetching pass types:', error);
            // apiFetch handles 401 (token expiration) automatically with redirect
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingPassType(null);
        setFormData({ name_en: '', name_ar: '', is_active: true });
        setShowModal(true);
    };

    const handleEdit = (passType: PassType) => {
        setEditingPassType(passType);
        setFormData({
            name_en: passType.name_en,
            name_ar: passType.name_ar,
            is_active: passType.is_active,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const url = editingPassType
                ? `/api/admin/pass-types/${editingPassType.id}`
                : '/api/admin/pass-types';
            const method = editingPassType ? 'PUT' : 'POST';

            await apiFetch(url, {
                method,
                body: JSON.stringify(formData),
            });

            setShowModal(false);
            setSuccessMessage(editingPassType ? t('updatedSuccessfully') : t('createdSuccessfully'));
            setShowSuccessModal(true);
            fetchPassTypes();
        } catch (error: any) {
            alert(error.message || 'Failed to save pass type');
            // apiFetch handles 401 (token expiration) automatically with redirect
        }
    };

    const handleToggleActive = async (id: number, currentStatus: boolean) => {
        try {
            await apiFetch(`/api/admin/pass-types/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...passTypes.find(pt => pt.id === id),
                    is_active: !currentStatus,
                }),
            });

            fetchPassTypes();
        } catch (error: any) {
            console.error('Error toggling active status:', error);
            alert(error.message || 'Failed to update pass type');
            // apiFetch handles 401 (token expiration) automatically with redirect
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">{t('title')}</h3>
                    <button
                        onClick={handleAddNew}
                        className="px-6 py-2 bg-[#00B09C] text-white rounded-lg font-medium hover:bg-[#008f7e] transition-colors"
                    >
                        {t('addNewType')}
                    </button>
                </div>

                <div className="bg-gray-50 rounded-3xl p-6 overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">{t('id')}</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">{t('passTypeEn')}</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">{t('passTypeAr')}</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">{t('added')}</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">{t('active')}</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">{t('access')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {passTypes.map((passType) => (
                                <tr key={passType.id} className="border-b border-gray-200 last:border-b-0">
                                    <td className="px-6 py-4 text-sm text-gray-900">{passType.id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{passType.name_en}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{passType.name_ar}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(passType.created_at)}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleActive(passType.id, passType.is_active)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                passType.is_active ? 'bg-[#00B09C]' : 'bg-gray-300'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    passType.is_active ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleEdit(passType)}
                                            className="text-[#00B09C] hover:text-[#008f7e] transition-colors"
                                        >
                                            <Image
                                                src="/images/svg/Edit 2.svg"
                                                alt="Edit"
                                                width={20}
                                                height={20}
                                            />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-2xl font-bold text-gray-900 mb-6">
                            {editingPassType ? t('editPassType') : t('addNewType')}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('passTypeEn')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.name_en}
                                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20"
                                    placeholder={t('enterPassTypeEn')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('passTypeAr')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.name_ar}
                                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#00B09C] focus:ring-2 focus:ring-[#00B09C]/20"
                                    placeholder={t('enterPassTypeAr')}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="mt-6 w-full px-6 py-3 bg-[#00B09C] text-white rounded-xl font-bold text-lg hover:bg-[#008f7e] transition-colors"
                        >
                            {t('saveAndApprove')}
                        </button>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <SuccessModal
                    message={successMessage}
                    onClose={() => setShowSuccessModal(false)}
                />
            )}
        </>
    );
}

