import React from 'react';

interface InfoRowProps {
    label: string;
    value: React.ReactNode;
    isEditable?: boolean;
    fieldName?: string;
    onChange?: (fieldName: string, value: string) => void;
    fieldType?: 'text' | 'select' | 'date' | 'textarea';
    options?: Array<{ value: string; label: string }>;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, isEditable, fieldName, onChange, fieldType = 'text', options = [] }) => {
    if (isEditable && fieldName && onChange) {
        const inputValue = typeof value === 'string' ? value : (value ? String(value) : '');
        
        // Select dropdown
        if (fieldType === 'select' && options.length > 0) {
            return (
                <div className="flex justify-between items-start py-1">
                    <span className="text-[#3E4259] font-medium text-[14px] md:text-[16px] w-1/2">{label} :</span>
                    <select
                        value={inputValue}
                        onChange={(e) => onChange(fieldName, e.target.value)}
                        className="text-[#3E4259] font-normal text-[14px] md:text-[16px] w-1/2 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        style={{ color: '#111827' }}
                    >
                        {options.map((option) => (
                            <option key={option.value} value={option.value} style={{ color: '#111827' }}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }
        
        // Date input
        if (fieldType === 'date') {
            // Convert date string to YYYY-MM-DD format for date input
            let dateValue = '';
            if (inputValue) {
                try {
                    const date = new Date(inputValue);
                    if (!isNaN(date.getTime())) {
                        dateValue = date.toISOString().split('T')[0];
                    }
                } catch {
                    // If parsing fails, try to extract date from formatted string
                    const dateMatch = inputValue.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
                    if (dateMatch) {
                        const [month, day, year] = dateMatch[0].split('/');
                        dateValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    }
                }
            }
            return (
                <div className="flex justify-between items-start py-1">
                    <span className="text-[#3E4259] font-medium text-[14px] md:text-[16px] w-1/2">{label} :</span>
                    <input
                        type="date"
                        value={dateValue}
                        onChange={(e) => onChange(fieldName, e.target.value)}
                        className="text-[#3E4259] font-normal text-[14px] md:text-[16px] w-1/2 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ color: '#111827' }}
                    />
                </div>
            );
        }
        
        // Textarea
        if (fieldType === 'textarea') {
            return (
                <div className="flex justify-between items-start py-1">
                    <span className="text-[#3E4259] font-medium text-[14px] md:text-[16px] w-1/2">{label} :</span>
                    <textarea
                        value={inputValue}
                        onChange={(e) => onChange(fieldName, e.target.value)}
                        rows={4}
                        className="text-[#3E4259] font-normal text-[14px] md:text-[16px] w-1/2 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        style={{ color: '#111827' }}
                    />
                </div>
            );
        }
        
        // Default text input
        return (
            <div className="flex justify-between items-start py-1">
                <span className="text-[#3E4259] font-medium text-[14px] md:text-[16px] w-1/2">{label} :</span>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => onChange(fieldName, e.target.value)}
                    className="text-[#3E4259] font-normal text-[14px] md:text-[16px] w-1/2 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ color: '#111827' }}
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
    data: { label: string; value: React.ReactNode; fieldName?: string; fieldType?: 'text' | 'select' | 'date' | 'textarea'; options?: Array<{ value: string; label: string }> }[];
    isEditable?: boolean;
    onChange?: (fieldName: string, value: string) => void;
}

export const InfoSection: React.FC<InfoSectionProps> = ({ title, data, isEditable, onChange }) => {
    return (
        <div className="mb-6">
            <h3 className="text-[#00B09C] font-normal text-[14px] mb-4 ">
                {title}
            </h3>
            <div className="space-y-3 ">
                {data.map((row, index) => (
                    <InfoRow 
                        key={index} 
                        label={row.label} 
                        value={row.value || '-'} 
                        isEditable={isEditable}
                        fieldName={row.fieldName}
                        onChange={onChange}
                        fieldType={row.fieldType}
                        options={row.options}
                    />
                ))}
            </div>
        </div>
    );
};
