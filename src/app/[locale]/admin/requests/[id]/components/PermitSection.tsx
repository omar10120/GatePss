import React from 'react';
import { useTranslations } from 'next-intl';

interface PermitSectionProps {
    status: string;
    requestType: string;
    // You might pass a real QR code URL or generated image here
    title: string;
    subtitle?: string;
    qrCodePdfUrl?: string;
}

export const PermitSection: React.FC<PermitSectionProps> = ({ status, requestType, title, subtitle, qrCodePdfUrl }) => {
    const t = useTranslations('Admin.requestDetails');
    const pt = useTranslations('Admin.permits');

    // Example logic handling
    if (status === 'REJECTED') {
        return (
            <div className="bg-[#FAF9FB] rounded-[12px] p-6 mt-8 font-['Rubik'] border border-gray-100">
                <h3 className="text-[#3E4259] text-[18px] font-medium mb-2">{title}</h3>
                <p className="text-[#747474] text-[14px]">{subtitle || t('rejectionNotification') || "The user was informed of the reason for the rejection via his Email."}</p>
            </div>
        );
    }

    return (
  <>
        {status === 'APPROVED' && (
        <div className="bg-[#FAF9FB] rounded-[12px] p-6 mt-8 border border-gray-100 font-['Rubik']">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-[#3E4259] text-[18px] font-medium">{title}</h3>
                    <p className="text-[#747474] text-[14px] mt-1">{subtitle}</p>
                </div>

                <div className="flex gap-2">
                    {/* View/Print Button */}
                    <button className="flex items-center justify-center w-10 h-10 bg-white border border-[#00B09C] rounded-[8px] text-[#00B09C] hover:bg-gray-50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </button>

                    {/* Download Button */}
                    <button className="flex items-center gap-2 px-4 h-10 bg-white border border-[#00B09C] rounded-[8px] text-[#00B09C] text-sm font-medium hover:bg-gray-50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {pt('downloadInfo') || 'Download'}
                    </button>
                </div>
            </div>

            {/* QR/Permit Preview Area - Placeholder for now as per image */}
         
            <div className="bg-white rounded-[8px] h-[300px] w-full flex items-center justify-center border border-dashed border-gray-200">
                <div className="text-center">
                    {/* You would render the actual permit HTML/Image here */}
                        <p className="text-gray-400">{t('permitsQrCode') || 'Permit Preview / QR Code'}</p>
                    </div>
                </div>
            
        </div>
        )}
  </>
        
    );
};
