import { useTranslations } from 'next-intl';
import React from 'react';

interface RequestHeaderProps {
    requestNumber: string;
}

export const RequestHeader: React.FC<RequestHeaderProps> = ({ requestNumber }) => {
    const t = useTranslations('Admin.requests');
    return (
        <h1 className="text-[24px] md:text-[28px] font-bold text-[#3E4259] font-['Rubik']">
            {t('title')} <span className="text-[#00B09C]">{requestNumber}</span>
        </h1>
    );
};
