import type { ReactNode } from 'react';
import './AdminModal.css';

type AdminModalProps = {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
};

export function AdminModal({ open, title, onClose, children }: AdminModalProps) {
    if (!open) return null;

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div
                className="admin-modal"
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
                        X
                    </button>
                </div>
                <div className="admin-modal-body">{children}</div>
            </div>
        </div>
    );
}

