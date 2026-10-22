// src/components/ui/Skeleton.tsx
import type { CSSProperties } from 'react';
import './Skeleton.css';

type SkeletonProps = {
    className?: string;
    width?: number | string;
    height?: number | string;
    radius?: number | string;
    style?: CSSProperties;
};

// A single shimmering placeholder block. Purely decorative — the loading state
// it belongs to should expose its own role="status" / aria-label for assistive
// tech, so every Skeleton is hidden from the accessibility tree.
export function Skeleton({ className, width, height, radius, style }: SkeletonProps) {
    return (
        <span
            aria-hidden="true"
            className={`skeleton${className ? ` ${className}` : ''}`}
            style={{ width, height, borderRadius: radius, ...style }}
        />
    );
}
