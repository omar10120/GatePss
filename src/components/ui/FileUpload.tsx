import React from 'react';

interface FileUploadProps {
    label: string;
    name: string;
    id: string;
    required?: boolean;
    accept?: string;
    placeholder?: string;
    error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    label,
    name,
    id,
    required = false,
    accept = ".png,.jpg,.jpeg,.pdf",
    placeholder = "Choose File (PNG, JPG, PDF) max 1MB",
    error,
}) => {
    const [fileName, setFileName] = React.useState<string | null>(null);

    return (
        <div className="w-full">
            <label htmlFor={id} className="block text-[16px] font-normal text-[#222222] mb-2 font-['Rubik']">
                {label}
            </label>
            <div className="relative group">
                <input
                    type="file"
                    name={name}
                    id={id}
                    accept={accept}
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            setFileName(file.name);
                        } else {
                            setFileName(null);
                        }
                    }}
                />
                <label
                    htmlFor={id}
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
                                {placeholder || 'Choose File'}
                            </div>
                            <span id={`${id}-label`} className="text-[14px] text-[#747474] truncate font-['Rubik']">
                                {fileName || ''}
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
            {error && (
                <p className="mt-1.5 text-[12px] text-danger-600 font-medium font-['Rubik']">{error}</p>
            )}
        </div>
    );
};

