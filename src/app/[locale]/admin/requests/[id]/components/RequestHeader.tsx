import React from 'react';

interface RequestHeaderProps {
    requestNumber: string;
    status: string;
    statusLabel: string;
}

export const RequestHeader: React.FC<RequestHeaderProps> = ({ requestNumber, status, statusLabel }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-[#DCFCE7] text-[#166534]'; // Green
            case 'REJECTED':
                return 'bg-[#FEE2E2] text-[#991B1B]'; // Red
            case 'PENDING':
                return 'bg-[#FEF3C7] text-[#92400E]'; // Yellow
            default:
                return 'bg-[#F3F4F6] text-[#374151]'; // Gray
        }
    };

    return (
        <div className="flex items-center justify-between mb-8 font-['Rubik']">
            <h1 className="text-[24px] md:text-[28px] font-bold text-[#3E4259]">
                Request <span className="text-[#005068]">{requestNumber}</span>
            </h1>

            <span className={`px-4 py-2 rounded-[8px] text-sm font-medium z-index:10      ${getStatusColor(status)}`}>
                {statusLabel}
            </span>
        </div>
    );
};
