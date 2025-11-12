import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

interface HomePageProps {
    onLogout?: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onLogout }) => {
    const navigate = useNavigate();

    return (
        <div className="home-page">
            <div className="home-container">
                <div className="home-header">
                    <h1>Главная страница</h1>
                    <p>Выберите раздел, чтобы продолжить</p>
                </div>

                <div className="home-actions">
                    <button onClick={() => navigate("/profile")} className="home-btn">
                        Профиль
                    </button>
                    <button onClick={() => navigate("/schedule")} className="home-btn">
                        Расписание
                    </button>
                    <button onClick={() => navigate("/map")} className="home-btn">
                        Карта
                    </button>
                    <button onClick={() => navigate("/login")} className="home-btn">
                        Авторизация
                    </button>
                    {onLogout && (
                        <button onClick={onLogout} className="home-btn logout-btn">
                            Выйти
                        </button>
                    )}
                </div>

                <div className="home-footer">
                    <p>© 2025 TechUp. Все права защищены.</p>
                </div>
            </div>
        </div>
    );
};

export default HomePage;