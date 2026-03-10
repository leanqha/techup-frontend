import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Authorization } from '../components/auth/Authorization';
import './WelcomePage.css';

type Props = {
    onAuthSuccess: () => void;
};

export function WelcomePage({ onAuthSuccess }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <main className="welcome-page">
            <section className="welcome-hero">
                <div className="welcome-badge">TechUp</div>
                <h1>Добро пожаловать в студенческий портал</h1>
                <p>
                    Здесь можно быстро посмотреть расписание, сохранить заметки к парам
                    и управлять учебным днем в одном месте.
                </p>
                <div className="welcome-actions">
                    <button
                        className="welcome-primary-btn"
                        onClick={() => setOpen(true)}
                    >
                        Войти или зарегистрироваться
                    </button>
                    <Link className="welcome-secondary-btn" to="/auth">
                        Открыть отдельную страницу авторизации
                    </Link>
                </div>
            </section>

            <section className="welcome-grid">
                <article className="welcome-card">
                    <h3>Расписание на день</h3>
                    <p>Сразу видно пары, преподавателей, аудитории и время начала.</p>
                </article>
                <article className="welcome-card">
                    <h3>Личный профиль</h3>
                    <p>Актуальная группа, контакты и персональные данные под рукой.</p>
                </article>
                <article className="welcome-card">
                    <h3>Удобно с телефона</h3>
                    <p>Интерфейс адаптирован под мобильный формат и PWA-режим.</p>
                </article>
            </section>

            {open && (
                <Authorization
                    onClose={() => setOpen(false)}
                    onAuthSuccess={onAuthSuccess}
                />
            )}
        </main>
    );
}
