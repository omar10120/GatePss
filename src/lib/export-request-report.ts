import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportLabelValueRow {
    Field: string;
    Value: string;
}

export interface ExportActivityLogRow {
    Timestamp: string;
    Action: string;
    User: string;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_');
}

export function exportRequestCsv(
    filename: string,
    details: ExportLabelValueRow[],
    logs: ExportActivityLogRow[]
): void {
    const wb = XLSX.utils.book_new();
    const detailsSheet = XLSX.utils.json_to_sheet(details);
    XLSX.utils.book_append_sheet(wb, detailsSheet, 'Request Details');

    let csvContent = XLSX.utils.sheet_to_csv(detailsSheet);

    if (logs.length > 0) {
        const logsSheet = XLSX.utils.json_to_sheet(logs);
        XLSX.utils.book_append_sheet(wb, logsSheet, 'Activity Log');
        csvContent += `\n\nActivity Log\n${XLSX.utils.sheet_to_csv(logsSheet)}`;
    }

    const blob = new Blob(['\ufeff', csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${sanitizeFilename(filename)}.csv`);
}

export function exportRequestExcel(
    filename: string,
    details: ExportLabelValueRow[],
    logs: ExportActivityLogRow[]
): void {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(details), 'Request Details');

    if (logs.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logs), 'Activity Log');
    }

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `${sanitizeFilename(filename)}.xlsx`
    );
}

export function exportRequestPdf(
    title: string,
    details: ExportLabelValueRow[],
    logs: ExportActivityLogRow[],
    locale: string
): void {
    const isRtl = locale === 'ar';
    const dir = isRtl ? 'rtl' : 'ltr';
    const generatedAt = new Date().toLocaleString(locale);

    const detailsRows = details
        .map(
            (row) => `
                <tr>
                    <td>${escapeHtml(row.Field)}</td>
                    <td>${escapeHtml(row.Value)}</td>
                </tr>`
        )
        .join('');

    const logsSection =
        logs.length > 0
            ? `
                <h2>Activity Log</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>User</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs
                            .map(
                                (log) => `
                            <tr>
                                <td>${escapeHtml(log.Timestamp)}</td>
                                <td>${escapeHtml(log.Action)}</td>
                                <td>${escapeHtml(log.User)}</td>
                            </tr>`
                            )
                            .join('')}
                    </tbody>
                </table>`
            : '';

    const html = `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
        h1 { color: #005068; font-size: 22px; margin-bottom: 4px; }
        .meta { color: #747474; font-size: 12px; margin-bottom: 24px; }
        h2 { color: #00B09C; font-size: 16px; margin: 24px 0 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: ${isRtl ? 'right' : 'left'}; font-size: 12px; }
        th { background: #f9fafb; color: #374151; }
        tr:nth-child(even) td { background: #fcfcfc; }
        @media print {
            body { margin: 12px; }
            button { display: none; }
        }
    </style>
</head>
<body>
    <h1>${escapeHtml(title)}</h1>
    <p class="meta">Generated: ${escapeHtml(generatedAt)}</p>
    <h2>Request Details</h2>
    <table>
        <thead>
            <tr>
                <th>Field</th>
                <th>Value</th>
            </tr>
        </thead>
        <tbody>${detailsRows}</tbody>
    </table>
    ${logsSection}
    <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
