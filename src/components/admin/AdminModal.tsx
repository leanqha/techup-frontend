import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '../icons/CloseIcon';
import './AdminModal.css';

type AdminModalProps = {
    open: boolean;
    title: string;
    size?: 'default' | 'wide';
    onClose: () => void;
    children: ReactNode;
};

export function AdminModal({ open, title, size = 'default', onClose, children }: AdminModalProps) {
    if (!open) return null;

    const modalClassName = size === 'wide' ? 'admin-modal admin-modal--wide' : 'admin-modal';

    return createPortal(
        <div className="admin-modal-overlay" onClick={onClose}>
            <div
                className={modalClassName}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={event => event.stopPropagation()}
            >
                <div className="admin-modal-header">
                    <h2>{title}</h2>
                    <button
                        type="button"
                        className="admin-modal-close"
                        onClick={onClose}
                        aria-label="Закрыть окно"
                    >
                        <CloseIcon />
                    </button>
                </div>
                <div className="admin-modal-body">{children}</div>
            </div>
        </div>,
        document.body
    );
}
