import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Majis Gate Pass System - Sohar Port Access Control',
    description: 'Electronic Gate Pass System for Majis Industrial Services at Sohar Port. Submit and manage visitor, contractor, employee, and vehicle access requests.',
    keywords: 'gate pass, sohar port, majis industrial services, access control, visitor management',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}
