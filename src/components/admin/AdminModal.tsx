import type { ReactNode } from 'react';
import { CloseIcon } from '../icons/CloseIcon';
import { Popup } from '../ui/Popup';
import './AdminModal.css';

type AdminModalProps = {
    open: boolean;
    title: string;
    size?: 'default' | 'wide';
    onClose: () => void;
    children: ReactNode;
};

export function AdminModal({ open, title, size = 'default', onClose, children }: AdminModalProps) {
    const modalClassName = size === 'wide' ? 'admin-modal admin-modal--wide' : 'admin-modal';

    return (
        <Popup
            open={open}
            onClose={onClose}
            overlayClassName="admin-modal-overlay"
            ariaLabel={title}
        >
            <div className={modalClassName}>
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
        </Popup>
    );
}
