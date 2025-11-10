// src/pages/HomePage.tsx
import React from "react";

type HomePageProps = {
    onLogout?: () => void;
};

const HomePage: React.FC<HomePageProps> = ({ onLogout }) => {
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "linear-gradient(to bottom right, #f0f4f8, #ffffff)",
            fontFamily: "sans-serif"
        }}>
            <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Главная страница</h1>
            <p style={{ fontSize: "1rem", color: "#555" }}>
                Добро пожаловать! Вы успешно вошли в систему.
            </p>
            {onLogout && (
                <button
                    onClick={onLogout}
                    style={{
                        marginTop: "2rem",
                        padding: "0.5rem 1rem",
                        backgroundColor: "#0ea5e9",
                        color: "white",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: "pointer"
                    }}
                >
                    Выйти
                </button>
            )}
        </div>
    );
};

export default HomePage;