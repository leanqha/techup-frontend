import { useEffect, useMemo, useState } from 'react';
import { fetchWithRefresh } from '../../api/fetchWithRefresh';
import { AdminModal } from './AdminModal';
import './AdminAccountsManager.css';

type AdminAccount = {
    id: number;
    uid: string;
    email: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    role: string;
    is_verified: boolean;
    group_id: number | null;
    group_name: string | null;
};

type AccountFilters = {
    role: string;
    groupId: string;
    email: string;
    uid: string;
    name: string;
    isVerified: '' | 'true' | 'false';
};

type EditFormState = {
    uid: string;
    email: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    role: string;
    group_id: string;
    is_verified: 'true' | 'false';
};

const emptyFilters: AccountFilters = {
    role: '',
    groupId: '',
    email: '',
    uid: '',
    name: '',
    isVerified: '',
};

export function AdminAccountsManager() {
    const [filters, setFilters] = useState<AccountFilters>(emptyFilters);
    const [accounts, setAccounts] = useState<AdminAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<AdminAccount | null>(null);
    const [editForm, setEditForm] = useState<EditFormState | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const editTitle = useMemo(() => {
        if (!editing) return '';
        return `Редактирование: ${editing.email}`;
    }, [editing]);

    const buildQuery = (input: AccountFilters) => {
        const query = new URLSearchParams();
        if (input.role.trim()) query.append('role', input.role.trim());
        if (input.groupId.trim()) query.append('group_id', input.groupId.trim());
        if (input.email.trim()) query.append('email', input.email.trim());
        if (input.uid.trim()) query.append('uid', input.uid.trim());
        if (input.name.trim()) query.append('name', input.name.trim());
        if (input.isVerified) query.append('is_verified', input.isVerified);
        return query.toString();
    };

    const loadAccounts = async (nextFilters?: AccountFilters) => {
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const query = buildQuery(nextFilters ?? filters);
            const url = query ? `/api/v1/admin/accounts?${query}` : '/api/v1/admin/accounts';
            const res = await fetchWithRefresh(url);

            if (!res.ok) {
                if (res.status === 400) {
                    setError('Некорректное значение фильтра');
                } else if (res.status === 500) {
                    setError('Ошибка сервера');
                } else {
                    setError('Не удалось загрузить аккаунты');
                }
                return;
            }

            const data = (await res.json()) as AdminAccount[];
            setAccounts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError('Сетевая ошибка');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadAccounts();
    }, []);

    const handleSearch = () => {
        void loadAccounts();
    };

    const handleReset = () => {
        setFilters(emptyFilters);
        void loadAccounts(emptyFilters);
    };

    const handleEditOpen = (account: AdminAccount) => {
        setEditing(account);
        setEditForm({
            uid: account.uid ?? '',
            email: account.email ?? '',
            first_name: account.first_name ?? '',
            middle_name: account.middle_name ?? '',
            last_name: account.last_name ?? '',
            role: account.role ?? '',
            group_id: account.group_id ? String(account.group_id) : '',
            is_verified: account.is_verified ? 'true' : 'false',
        });
    };

    const handleEditClose = () => {
        setEditing(null);
        setEditForm(null);
        setSaving(false);
    };

    const handleSave = async () => {
        if (!editing || !editForm) return;

        const updates: Record<string, unknown> = {};
        if (editForm.uid !== editing.uid) updates.uid = editForm.uid;
        if (editForm.email !== editing.email) updates.email = editForm.email;
        if (editForm.first_name !== editing.first_name) updates.first_name = editForm.first_name;
        if (editForm.middle_name !== (editing.middle_name ?? '')) {
            updates.middle_name = editForm.middle_name;
        }
        if (editForm.last_name !== editing.last_name) updates.last_name = editForm.last_name;
        if (editForm.role !== editing.role) updates.role = editForm.role;

        const originalGroupId = editing.group_id ? String(editing.group_id) : '';
        if (editForm.group_id && editForm.group_id !== originalGroupId) {
            updates.group_id = Number(editForm.group_id);
        }

        const nextVerified = editForm.is_verified === 'true';
        if (nextVerified !== editing.is_verified) updates.is_verified = nextVerified;

        if (!Object.keys(updates).length) {
            setMessage('Нет изменений для сохранения');
            return;
        }

        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            const res = await fetchWithRefresh(`/api/v1/admin/account/${editing.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (!res.ok) {
                if (res.status === 400) {
                    setError('Некорректные данные для обновления');
                } else if (res.status === 404) {
                    setError('Аккаунт не найден');
                } else {
                    setError('Не удалось обновить аккаунт');
                }
                return;
            }

            const updated = (await res.json()) as AdminAccount;
            setAccounts(prev => prev.map(item => (item.id === updated.id ? updated : item)));
            setMessage('Аккаунт обновлен');
            handleEditClose();
        } catch (err) {
            console.error(err);
            setError('Сетевая ошибка');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (account: AdminAccount) => {
        const confirmed = window.confirm(`Удалить аккаунт ${account.email}?`);
        if (!confirmed) return;

        setDeletingId(account.id);
        setError(null);
        setMessage(null);

        try {
            const res = await fetchWithRefresh(`/api/v1/admin/account/${account.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                if (res.status === 400) {
                    setError('Некорректный идентификатор');
                } else if (res.status === 404) {
                    setError('Аккаунт не найден');
                } else if (res.status === 500) {
                    setError('Ошибка сервера');
                } else {
                    setError('Не удалось удалить аккаунт');
                }
                return;
            }

            setAccounts(prev => prev.filter(item => item.id !== account.id));
            setMessage('Аккаунт удален');
            if (editing?.id === account.id) handleEditClose();
        } catch (err) {
            console.error(err);
            setError('Сетевая ошибка');
        } finally {
            setDeletingId(null);
        }
    };

    const renderName = (account: AdminAccount) => {
        return [account.first_name, account.middle_name, account.last_name]
            .filter(Boolean)
            .join(' ');
    };

    return (
        <section className="admin-section admin-accounts">
            <div className="admin-section-header">
                <div>
                    <h2>Аккаунты</h2>
                    <p className="admin-section-subtitle">Поиск, обновление и удаление учетных записей</p>
                </div>
                <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={handleSearch}
                    disabled={loading}
                >
                    Обновить список
                </button>
            </div>

            <div className="admin-accounts-filters">
                <label className="admin-field">
                    Роль
                    <input
                        type="text"
                        value={filters.role}
                        onChange={event => setFilters({ ...filters, role: event.target.value })}
                        placeholder="admin/user"
                    />
                </label>
                <label className="admin-field">
                    Группа ID
                    <input
                        type="text"
                        value={filters.groupId}
                        onChange={event => setFilters({ ...filters, groupId: event.target.value })}
                        placeholder="101"
                    />
                </label>
                <label className="admin-field">
                    Email
                    <input
                        type="text"
                        value={filters.email}
                        onChange={event => setFilters({ ...filters, email: event.target.value })}
                        placeholder="user@mail.com"
                    />
                </label>
                <label className="admin-field">
                    UID
                    <input
                        type="text"
                        value={filters.uid}
                        onChange={event => setFilters({ ...filters, uid: event.target.value })}
                    />
                </label>
                <label className="admin-field">
                    Имя
                    <input
                        type="text"
                        value={filters.name}
                        onChange={event => setFilters({ ...filters, name: event.target.value })}
                    />
                </label>
                <label className="admin-field">
                    Верификация
                    <select
                        value={filters.isVerified}
                        onChange={event =>
                            setFilters({
                                ...filters,
                                isVerified: event.target.value as AccountFilters['isVerified'],
                            })
                        }
                    >
                        <option value="">Все</option>
                        <option value="true">Да</option>
                        <option value="false">Нет</option>
                    </select>
                </label>
                <div className="admin-filters-actions">
                    <button type="button" className="admin-primary-button" onClick={handleSearch}>
                        Найти
                    </button>
                    <button type="button" className="admin-secondary-button" onClick={handleReset}>
                        Сбросить
                    </button>
                </div>
            </div>

            {loading && <p className="admin-section-status">Загрузка...</p>}
            {error && <p className="admin-section-error">{error}</p>}
            {message && <p className="admin-section-message">{message}</p>}

            <div className="admin-accounts-table">
                <div className="admin-accounts-header">
                    <span>Имя</span>
                    <span>Email</span>
                    <span>UID</span>
                    <span>Роль</span>
                    <span>Группа</span>
                    <span>Вериф.</span>
                    <span>Действия</span>
                </div>
                {accounts.map(account => (
                    <div className="admin-accounts-row" key={account.id}>
                        <span>{renderName(account) || '—'}</span>
                        <span>{account.email}</span>
                        <span className="admin-accounts-uid">{account.uid}</span>
                        <span>{account.role}</span>
                        <span>{account.group_name ?? (account.group_id ? `#${account.group_id}` : '—')}</span>
                        <span>{account.is_verified ? 'Да' : 'Нет'}</span>
                        <span className="admin-accounts-actions">
                            <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() => handleEditOpen(account)}
                            >
                                Изменить
                            </button>
                            <button
                                type="button"
                                className="admin-danger-button"
                                onClick={() => handleDelete(account)}
                                disabled={deletingId === account.id}
                            >
                                Удалить
                            </button>
                        </span>
                    </div>
                ))}
                {!accounts.length && !loading && (
                    <p className="admin-section-status">Аккаунтов не найдено</p>
                )}
            </div>

            <AdminModal open={Boolean(editing)} title={editTitle} onClose={handleEditClose}>
                {editForm && (
                    <div className="admin-edit-form">
                        <label className="admin-field">
                            Табельный номер
                            <input
                                type="text"
                                value={editForm.uid}
                                onChange={event => setEditForm({ ...editForm, uid: event.target.value })}
                            />
                        </label>
                        <label className="admin-field">
                            Email
                            <input
                                type="text"
                                value={editForm.email}
                                onChange={event => setEditForm({ ...editForm, email: event.target.value })}
                            />
                        </label>
                        <label className="admin-field">
                            Имя
                            <input
                                type="text"
                                value={editForm.first_name}
                                onChange={event =>
                                    setEditForm({ ...editForm, first_name: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Отчество
                            <input
                                type="text"
                                value={editForm.middle_name}
                                onChange={event =>
                                    setEditForm({ ...editForm, middle_name: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Фамилия
                            <input
                                type="text"
                                value={editForm.last_name}
                                onChange={event =>
                                    setEditForm({ ...editForm, last_name: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Роль
                            <input
                                type="text"
                                value={editForm.role}
                                onChange={event => setEditForm({ ...editForm, role: event.target.value })}
                            />
                        </label>
                        <label className="admin-field">
                            Группа ID
                            <input
                                type="text"
                                value={editForm.group_id}
                                onChange={event =>
                                    setEditForm({ ...editForm, group_id: event.target.value })
                                }
                            />
                        </label>
                        <label className="admin-field">
                            Верификация
                            <select
                                value={editForm.is_verified}
                                onChange={event =>
                                    setEditForm({
                                        ...editForm,
                                        is_verified: event.target.value as EditFormState['is_verified'],
                                    })
                                }
                            >
                                <option value="true">Да</option>
                                <option value="false">Нет</option>
                            </select>
                        </label>
                        <div className="admin-edit-actions">
                            <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={handleEditClose}
                                disabled={saving}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className="admin-primary-button"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                )}
            </AdminModal>
        </section>
    );
}

