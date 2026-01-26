import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface DocumentCardProps {
    title: string;
    imageUrl: string | null;
    onView?: () => void;
    isEditable?: boolean;
    fieldName?: string;
    onChange?: (fieldName: string, file: File | null) => void;
    error?: string;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ 
    title, 
    imageUrl, 
    onView, 
    isEditable = false,
    fieldName,
    onChange,
    error
}) => {
    const gt = useTranslations('GatePassPage');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    const src = previewUrl || imageUrl;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
            
            if (onChange && fieldName) {
                onChange(fieldName, file);
            }
        }
    };

    if (isEditable && fieldName) {
        return (
            <div className="bg-white rounded-[8px] p-4 border border-gray-100 mb-6 font-['Rubik']">
                <div className="w-full">
                    <label htmlFor={fieldName} className="block text-[16px] font-normal text-[#222222] mb-2 font-['Rubik']">
                        {title}
                    </label>
                    <div className="relative group">
                        <input
                            type="file"
                            name={fieldName}
                            id={fieldName}
                            accept=".png,.jpg,.jpeg,.pdf"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setSelectedFile(file);
                                    // Create preview URL
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setPreviewUrl(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                    
                                    if (onChange && fieldName) {
                                        onChange(fieldName, file);
                                    }
                                } else {
                                    setSelectedFile(null);
                                    setPreviewUrl(null);
                                    if (onChange && fieldName) {
                                        onChange(fieldName, null);
                                    }
                                }
                            }}
                        />
                        <label
                            htmlFor={fieldName}
                            className="cursor-pointer"
                        >
                            <div
                                className={`
                                    flex items-center justify-between w-full h-[58px] bg-white border-[0.5px] border-[#D0D0D0] rounded-[12px] px-4 py-2 transition-all
                                    ${error ? "border-danger-500" : "hover:border-gray-300"}
                                `.trim()}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-[#F7F1EB] text-[#747474] px-3 py-1.5 rounded-[4px] text-[14px] font-['Rubik'] whitespace-nowrap">
                                        {gt('placeholders.chooseFile') || "Choose File (PNG, JPG, PDF) max 1MB"}
                                    </div>
                                    <span className="text-[14px] text-[#747474] truncate font-['Rubik']">
                                        {selectedFile?.name || ''}
                                    </span>
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                    <svg className="w-6 h-6 text-[#747474]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </div>
                            </div>
                        </label>
                    </div>
                    {selectedFile && !error && (
                        <p className="mt-1.5 text-[12px] text-[#00B09C] font-medium font-['Rubik'] flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {selectedFile.name}
                        </p>
                    )}
                    {error && (
                        <p className="mt-1.5 text-[12px] text-danger-600 font-medium font-['Rubik']">{error}</p>
                    )}
                </div>
                {src && (
                    <div className="mt-4 bg-[#FAF9FB] rounded-[8px] p-6 flex justify-center items-center relative min-h-[160px]">
                        <div className="relative w-full max-w-[280px] h-[160px] cursor-pointer group" onClick={onView}>
                            <img
                                src={src}
                                alt={title}
                                className="w-full h-full object-contain rounded-md"
                            />
                            <div className="absolute bottom-2 right-2 p-1 bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[8px] p-4 border border-gray-100 mb-6 font-['Rubik']">
            <h3 className="text-[#3E4259] text-[16px] font-normal mb-4">{title}</h3>

            <div className="bg-[#FAF9FB] rounded-[8px] p-6 flex justify-center items-center relative min-h-[160px]">
                {src ? (
                    <div className="relative w-full max-w-[280px] h-[160px] cursor-pointer group" onClick={onView}>
                        <img
                            src={src}
                            alt={title}
                            className="w-full h-full object-contain rounded-md"
                        />

                        {/* Expand Icon */}
                        <div className="absolute bottom-2 right-2 p-1 bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-400 text-sm">No document available</div>
                )}
            </div>
        </div>
    );
};
