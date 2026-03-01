// src/pages/ProfilePage.tsx
import { useAuth } from '../context/useAuth.ts';
import './ProfilePage.css';

export function ProfilePage() {
    const { profile, logout } = useAuth();

    if (!profile) return null;

    const displayName = [profile.last_name, profile.first_name, profile.middle_name]
        .filter((value) => value && value.trim().length > 0)
        .join(' ');
    const avatarLetter = (profile.first_name || profile.email || '?')
        .trim()
        .charAt(0)
        .toUpperCase();

    const roleLabels: Record<string, string> = {
        student: 'Студент',
        teacher: 'Преподаватель',
        admin: 'Администратор',
    };
    const roleLabel = roleLabels[profile.role] ?? profile.role;

    const detailRows = [
        { label: 'Фамилия', value: profile.last_name },
        { label: 'Имя', value: profile.first_name },
        { label: 'Отчество', value: profile.middle_name },
        { label: 'Табельный номер', value: profile.uid },
        { label: 'Группа', value: profile.group_name },
    ];

    return (
        <div className="profile-page">
            <header className="profile-header">
                <div className="profile-avatar" aria-hidden="true">
                    {avatarLetter}
                </div>
                <div className="profile-header-text">
                    <h1>Профиль</h1>
                    <p className="profile-name">
                        {displayName || profile.email}
                        <span className="profile-role">{roleLabel}</span>
                    </p>
                    <p className="profile-meta">{profile.email}</p>
                </div>
            </header>

            <section className="profile-card">
                <h2 className="profile-card-title">Данные профиля</h2>
                <div className="profile-details">
                    {detailRows.map((row) => (
                        <div key={row.label} className="profile-detail-row">
                            <span className="profile-detail-label">{row.label}</span>
                            <span className="profile-detail-value">{row.value || '—'}</span>
                        </div>
                    ))}
                </div>
            </section>

            <div className="profile-actions">
                <button className="profile-button profile-button--primary" onClick={() => void logout()}>
                    Выйти
                </button>

                <button
                    className="profile-button profile-button--secondary"
                    onClick={() =>
                        window.open(
                            'https://docs.google.com/forms/d/e/1FAIpQLSd76B06oxBRQtjt_L-8EJ-8VZJRUNbXFxXctRZRInKcaqe5zQ/viewform?usp=dialog',
                            '_blank'
                        )
                    }
                >
                    Обратная связь
                </button>
            </div>
        </div>
    );
}