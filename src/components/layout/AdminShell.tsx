'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { SidebarProvider, useSidebar } from './SidebarContext';
import type { SidebarItem } from '@/config/navigation';

interface AdminShellProps {
    items: SidebarItem[];
    locale?: 'en' | 'ar';
    className?: string;
    children: React.ReactNode;
}

export function AdminContent({
    children,
    className = 'flex-1 min-w-0',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const { contentStyle } = useSidebar();
    return (
        <div className={className} style={contentStyle}>
            {children}
        </div>
    );
}

export function AdminShell({
    items,
    locale = 'en',
    className = 'min-h-screen bg-gray-50 flex',
    children,
}: AdminShellProps) {
    return (
        <SidebarProvider locale={locale}>
            <div className={className} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                <Sidebar items={items} locale={locale} />
                <AdminContent>{children}</AdminContent>
            </div>
        </SidebarProvider>
    );
}
