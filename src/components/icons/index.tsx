// src/components/icons/index.tsx
// Single, consistent icon set for the whole app.
// All icons share a 24×24 viewBox, use `currentColor`, round caps/joins and a
// 2px stroke, so they read as one family wherever they appear.
import type { SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement> & {
    /** Rendered width/height in px. Defaults to 24. */
    size?: number;
};

function Icon({ size = 24, children, ...props }: IconProps & { children: React.ReactNode }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            {...props}
        >
            {children}
        </svg>
    );
}

export function HomeIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5.5 9.5V20a1 1 0 0 0 1 1h4.5v-6h2v6H17.5a1 1 0 0 0 1-1V9.5" />
        </Icon>
    );
}

export function CalendarIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M8 3v4M16 3v4M3 10h18" />
        </Icon>
    );
}

export function UserIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
            <path d="M4 20a8 8 0 0 1 16 0" />
        </Icon>
    );
}

export function UsersIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z" />
            <path d="M2 20a6 6 0 0 1 12 0M10 20a6 6 0 0 1 12 0" />
        </Icon>
    );
}

export function ShieldIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z" />
        </Icon>
    );
}

export function MapIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M9 5 3 7v12l6-2 6 2 6-2V5l-6 2-6-2Z" />
            <path d="M9 5v12M15 7v12" />
        </Icon>
    );
}

export function MenuIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M4 6h16M4 12h16M4 18h16" />
        </Icon>
    );
}

export function CloseIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M6 6 18 18M18 6 6 18" />
        </Icon>
    );
}

export function SearchIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
        </Icon>
    );
}

export function ChevronLeftIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="m15 6-6 6 6 6" />
        </Icon>
    );
}

export function ChevronRightIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="m9 6 6 6-6 6" />
        </Icon>
    );
}
