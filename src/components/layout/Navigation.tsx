import React from 'react';
import Link from 'next/link';

export interface NavItem {
    label: string;
    href: string;
    icon?: React.ReactNode;
    badge?: string | number;
    active?: boolean;
    permission?: string;
}

interface NavigationProps {
    items: NavItem[];
    direction?: 'horizontal' | 'vertical';
    className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
    items,
    direction = 'horizontal',
    className = '',
}) => {
    const isHorizontal = direction === 'horizontal';

    return (
        <nav className={`bg-white ${isHorizontal ? 'border-b border-gray-200' : ''} ${className}`.trim()}>
            <div className={`${isHorizontal ? 'flex' : 'flex flex-col space-y-1'}`}>
                {items.map((item) => (
                    <NavLink key={item.href} item={item} direction={direction} />
                ))}
            </div>
        </nav>
    );
};

interface NavLinkProps {
    item: NavItem;
    direction: 'horizontal' | 'vertical';
}

const NavLink: React.FC<NavLinkProps> = ({ item, direction }) => {
    const isHorizontal = direction === 'horizontal';
    const baseStyles = `
        ${isHorizontal ? 'px-4 py-3 border-b-2' : 'px-3 py-2 rounded-lg'}
        flex items-center gap-2 transition-colors
    `;

    const activeStyles = item.active
        ? isHorizontal
            ? 'border-primary-600 text-primary-600 font-medium'
            : 'bg-primary-50 text-primary-600 font-medium'
        : isHorizontal
            ? 'border-transparent text-gray-600 hover:text-gray-900'
            : 'text-gray-700 hover:bg-gray-100';

    return (
        <Link href={item.href} className={`${baseStyles} ${activeStyles}`.trim()}>
            {item.icon && <span className="text-lg">{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-100 bg-primary-600 rounded-full">
                    {item.badge}
                </span>
            )}
        </Link>
    );
};
