import React from 'react';

interface InfoRowProps {
    label: string;
    value: React.ReactNode;
    isEditable?: boolean;
    fieldName?: string;
    onChange?: (fieldName: string, value: string) => void;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, isEditable, fieldName, onChange }) => {
    if (isEditable && fieldName && onChange) {
        const inputValue = typeof value === 'string' ? value : (value ? String(value) : '');
        return (
            <div className="flex justify-between items-start py-1">
                <span className="text-[#3E4259] font-medium text-[14px] md:text-[16px] w-1/2">{label} :</span>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => onChange(fieldName, e.target.value)}
                    className="text-[#3E4259] font-normal text-[14px] md:text-[16px] w-1/2 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
        );
    }

    return (
        <div className="flex justify-between items-start py-1">
            <span className="text-[#3E4259] font-medium text-[14px] md:text-[16px] w-1/2">{label} :</span>
            <span className="text-[#3E4259] font-normal text-[14px] md:text-[16px] w-1/2 text-left">{value}</span>
        </div>
    );
};

interface InfoSectionProps {
    title: string;
    data: { label: string; value: React.ReactNode; fieldName?: string }[];
    isEditable?: boolean;
    onChange?: (fieldName: string, value: string) => void;
}

export const InfoSection: React.FC<InfoSectionProps> = ({ title, data, isEditable, onChange }) => {
    return (
        <div className="mb-6">
            <h3 className="text-[#00B09C] font-normal text-[14px] mb-4 font-['Rubik']">
                {title}
            </h3>
            <div className="space-y-3 font-['Rubik']">
                {data.map((row, index) => (
                    <InfoRow 
                        key={index} 
                        label={row.label} 
                        value={row.value || '-'} 
                        isEditable={isEditable}
                        fieldName={row.fieldName}
                        onChange={onChange}
                    />
                ))}
            </div>
        </div>
    );
};
