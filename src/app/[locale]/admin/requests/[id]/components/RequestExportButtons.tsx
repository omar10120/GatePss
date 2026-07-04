'use client';

import React from 'react';

interface RequestExportButtonsProps {
    onExportCsv: () => void;
    onExportPdf: () => void;
    exporting?: boolean;
    exportCsvLabel: string;
    exportPdfLabel: string;
}

export const RequestExportButtons: React.FC<RequestExportButtonsProps> = ({
    onExportCsv,
    onExportPdf,
    exporting = false,
    exportCsvLabel,
    exportPdfLabel,
}) => (
    <div className="flex flex-wrap items-center gap-2">
        <button
            type="button"
            onClick={onExportCsv}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
        >
            <svg className="w-4 h-4 text-[#00B09C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exportCsvLabel}
        </button>
        <button
            type="button"
            onClick={onExportPdf}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-[8px] text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
        >
            <svg className="w-4 h-4 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {exportPdfLabel}
        </button>
    </div>
);
