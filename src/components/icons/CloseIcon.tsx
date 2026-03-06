type CloseIconProps = {
    size?: number;
};

export function CloseIcon({ size = 18 }: CloseIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M6 6 18 18M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}
