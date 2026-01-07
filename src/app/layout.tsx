import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Majis Gate Pass System',
    description: 'Electronic Gate Pass System for Majis Industrial Services',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html>
            <body>
                {children}
            </body>
        </html>
    );
}
