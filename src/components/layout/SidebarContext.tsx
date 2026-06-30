'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const SIDEBAR_WIDTH_PX = 256;
const MOBILE_BREAKPOINT = 1024;
const LOCK_STORAGE_KEY = 'admin-sidebar-locked';

interface SidebarContextValue {
    isMobile: boolean;
    isOpen: boolean;
    isLocked: boolean;
    isSidebarVisible: boolean;
    contentStyle: React.CSSProperties;
    toggleOpen: () => void;
    toggleLock: () => void;
    closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
    children,
    locale = 'en',
}: {
    children: React.ReactNode;
    locale?: 'en' | 'ar';
}) {
    const [isMobile, setIsMobile] = useState(false);
    const [isOpen, setIsOpen] = useState(true);
    const [isLocked, setIsLocked] = useState(true);
    const [hydrated, setHydrated] = useState(false);

    const isRtl = locale === 'ar';

    useEffect(() => {
        const storedLock = localStorage.getItem(LOCK_STORAGE_KEY);
        const locked = storedLock !== 'false';
        setIsLocked(locked);
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;

        const applyLayout = () => {
            const mobile = window.innerWidth < MOBILE_BREAKPOINT;
            setIsMobile(mobile);

            if (mobile) {
                setIsOpen(false);
                return;
            }

            const locked = localStorage.getItem(LOCK_STORAGE_KEY) !== 'false';
            setIsLocked(locked);
            setIsOpen(locked);
        };

        applyLayout();
        window.addEventListener('resize', applyLayout);
        return () => window.removeEventListener('resize', applyLayout);
    }, [hydrated]);

    const toggleOpen = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    const toggleLock = useCallback(() => {
        setIsLocked((prev) => {
            const next = !prev;
            localStorage.setItem(LOCK_STORAGE_KEY, String(next));
            setIsOpen(next);
            return next;
        });
    }, []);

    const closeSidebar = useCallback(() => {
        if (isMobile) {
            setIsOpen(false);
            return;
        }
        if (!isLocked) {
            setIsOpen(false);
        }
    }, [isMobile, isLocked]);

    const isSidebarVisible = isOpen;

    const contentStyle = useMemo<React.CSSProperties>(() => {
        const offset = !isMobile && isSidebarVisible ? SIDEBAR_WIDTH_PX : 0;
        return isRtl
            ? { marginRight: offset, marginLeft: 0, transition: 'margin 0.3s ease' }
            : { marginLeft: offset, marginRight: 0, transition: 'margin 0.3s ease' };
    }, [isMobile, isSidebarVisible, isRtl]);

    const value = useMemo(
        () => ({
            isMobile,
            isOpen,
            isLocked,
            isSidebarVisible,
            contentStyle,
            toggleOpen,
            toggleLock,
            closeSidebar,
        }),
        [isMobile, isOpen, isLocked, isSidebarVisible, contentStyle, toggleOpen, toggleLock, closeSidebar]
    );

    return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within SidebarProvider');
    }
    return context;
}
