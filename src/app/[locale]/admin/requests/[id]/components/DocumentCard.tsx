import React from 'react';
import Image from 'next/image';

interface DocumentCardProps {
    title: string;
    imageUrl: string | null;
    onView?: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ title, imageUrl, onView }) => {
    
    const src = imageUrl;

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
