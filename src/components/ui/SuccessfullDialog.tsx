import React from 'react';
import { useTranslations } from 'next-intl';

interface SuccessfullDialogProps {
    requestNumber: string | null;
    onDone: () => void;
}

export const SuccessfullDialog: React.FC<SuccessfullDialogProps> = ({ requestNumber, onDone }) => {
    const t = useTranslations('GatePassPage');

    return (
        <div className="flex flex-col items-center justify-center py-12 animate-fade-in text-center">
            {/* Success Image */}
            <div className="mb-8 relative w-[280px] h-[280px] md:w-[320px] md:h-[320px]">
                <img
                    src="/images/Asset1.png"
                    alt="Success"
                    className="object-contain w-full h-full"
                />
            </div>

            {/* Success Title */}
            <h2 className="text-[24px] md:text-[32px] font-bold text-[#005068] mb-4  capitalize">
                {t('successTitle') || 'Your Application Submitted Successfully'}
            </h2>

            {/* Request Number Subtitle */}
            {requestNumber && (
                <p className="text-[#747474] text-lg  mb-8">
                    {t('columns.requestNumber')}: <span className="font-semibold text-[#00B09C]">{requestNumber}</span>
                </p>
            )}

            {/* Done Button */}
            <button
                onClick={onDone}
                className={`
                    flex items-center justify-center px-16 py-4 bg-[#00B09C] text-white rounded-full 
                    text-[22px] md:text-[28px] font-medium  transition-all shadow-md 
                    hover:shadow-xl hover:bg-[#009686] active:scale-[0.98] 
                    min-w-[200px] md:min-w-[280px] h-[60px] md:h-[72px]
                `.trim()}
            >
                {t('done') || 'Done'}
            </button>
        </div>
    );
};
