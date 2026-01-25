import React from 'react';

interface RequestHeaderProps {
    requestNumber: string;
}

export const RequestHeader: React.FC<RequestHeaderProps> = ({ requestNumber }) => {
    return (
        <h1 className="text-[24px] md:text-[28px] font-bold text-[#3E4259] font-['Rubik']">
            Request <span className="text-[#00B09C]">{requestNumber}</span>
        </h1>
    );
};
