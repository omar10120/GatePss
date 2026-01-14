import React from 'react';

interface InfoRowProps {
    label: string;
    value: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
    <div className="flex justify-between items-start py-1">
        <span className="text-[#3E4259] font-medium text-[14px] md:text-[16px] w-1/2">{label} :</span>
        <span className="text-[#3E4259] font-normal text-[14px] md:text-[16px] w-1/2 text-left">{value}</span>
    </div>
);

interface InfoSectionProps {
    title: string;
    data: { label: string; value: React.ReactNode }[];
}

export const InfoSection: React.FC<InfoSectionProps> = ({ title, data }) => {
    return (
        <div className="mb-6">
            <h3 className="text-[#00B09C] font-normal text-[14px] mb-4 font-['Rubik']">
                {title}
            </h3>
            <div className="space-y-3 font-['Rubik']">
                {data.map((row, index) => (
                    <InfoRow key={index} label={row.label} value={row.value || '-'} />
                ))}
            </div>
        </div>
    );
};
