import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getInternalUrl } from '@/utils/helpers';

interface DocumentCardProps {
    title: string;
    imageUrl: string | null;
    onView?: () => void;
    isEditable?: boolean;
    fieldName?: string;
    onChange?: (fieldName: string, file: File | null) => void;
    error?: string;
    accept?: string;
    placeholder?: string;
    onRemove?: (fieldName: string) => void;
    forceRemoved?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ 
    title, 
    imageUrl, 
    onView, 
    isEditable = false,
    fieldName,
    onChange,
    error,
    accept = ".png,.jpg,.jpeg,.pdf",
    placeholder,
    onRemove,
    forceRemoved = false
}) => {
    const gt = useTranslations('GatePassPage');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [internalIsRemoved, setInternalIsRemoved] = useState(false);
    
    const isRemoved = forceRemoved || internalIsRemoved;
    
    const src = isRemoved ? null : (previewUrl || getInternalUrl(imageUrl));

    const isImage = (url: string | null) => {
        if (!url) return false;
        // Check for data URLs
        if (url.startsWith('data:image/')) return true;
        // Check for common image extensions
        const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
        return extensions.some(ext => url.toLowerCase().split('?')[0].endsWith(ext));
    };

    const isImg = isImage(src);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setInternalIsRemoved(false);
            if (onChange && fieldName) {
                onChange(fieldName, file);
            }
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setInternalIsRemoved(true);
        setPreviewUrl(null);
        setSelectedFile(null);
        // Reset the file input if it exists
        if (fieldName) {
            const input = document.getElementById(fieldName) as HTMLInputElement;
            if (input) input.value = '';
        }
        if (onRemove && fieldName) {
            onRemove(fieldName);
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
                            accept={accept}
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setInternalIsRemoved(false);
                                    setSelectedFile(file);
                                    setPreviewUrl(URL.createObjectURL(file));
                                    
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
                                        {placeholder || gt('placeholders.chooseFile') || "Choose File"}
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
                            {isImg ? (
                                <img
                                    src={src}
                                    alt={title}
                                    className="w-full h-full object-contain rounded-md"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-md border border-gray-200 gap-3">
                                    <svg className="w-12 h-12 text-[#00B09C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-600 px-4 text-center truncate w-full">
                                        {src.split('/').pop()?.split('-').pop() || title}
                                    </span>
                                </div>
                            )}
                            
                            <div className="absolute bottom-2 right-2 flex gap-2">
                                {/* Remove Button */}
                                {onRemove && fieldName && (
                                    <button
                                        onClick={handleRemove}
                                        className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors shadow-sm"
                                        title="Remove document"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}

                                {/* Expand Button */}
                                <div 
                                    className="p-2 bg-white rounded-md shadow-md opacity-100 hover:bg-gray-50 transition-colors cursor-pointer text-gray-600"
                                    title="View"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onView) onView();
                                    }}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                </div>
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
                        {isImg ? (
                            <img
                                src={src}
                                alt={title}
                                className="w-full h-full object-contain rounded-md"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-md border border-gray-200 gap-3">
                                <svg className="w-12 h-12 text-[#00B09C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-600 px-4 text-center truncate w-full">
                                    {src.split('/').pop()?.split('-').pop() || title}
                                </span>
                            </div>
                        )}

                        {/* Expand Icon */}
                        <div 
                            className="absolute bottom-2 right-2 p-2 bg-white rounded-md shadow-md opacity-100 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onView) onView();
                            }}
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                        <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-['Rubik']">{gt('noDocumentAvailable') || "No document available"}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
