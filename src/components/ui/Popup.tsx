import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './Popup.css';

type PopupProps = {
    open: boolean;
    onClose?: () => void;
    children: ReactNode;
    overlayClassName?: string;
    contentClassName?: string;
    ariaLabel?: string;
};

export function Popup({
    open,
    onClose,
    children,
    overlayClassName,
    contentClassName,
    ariaLabel,
}: PopupProps) {
    if (!open) return null;

    const overlayClass = overlayClassName ? `popup-overlay ${overlayClassName}` : 'popup-overlay';
    const contentClass = contentClassName ? `popup-content ${contentClassName}` : 'popup-content';

    return createPortal(
        <div className={overlayClass} onClick={() => onClose?.()}>
            <div
                className={contentClass}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                onClick={(event) => event.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body
    );
}

