import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";

type UserProfile = {
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    id: number;
    uid: string;
};

const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetch("http://46.37.123.72:8080/api/v1/account/secure/profile", {
            method: "GET",
            credentials: "include", // ✅ кука access_token отправляется автоматически
        })
            .then((res) => {
                if (res.status === 401) {
                    navigate("/login"); // если не авторизован — редирект на логин
                    return;
                }
                if (!res.ok) throw new Error("Не удалось загрузить профиль");
                return res.json();
            })
            .then((data: UserProfile) => {
                if (data) setProfile(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [navigate]);

    return (
        <div className="profile-page">
            <div className="profile-container">
                <h1>Профиль пользователя</h1>

                {loading && <p className="profile-status">Загрузка...</p>}
                {error && <p className="profile-error">{error}</p>}

                {profile && (
                    <div className="profile-details">
                        <div className="profile-row">
                            <span className="profile-label">Имя:</span>
                            <span className="profile-value">{profile.first_name}</span>
                        </div>
                        <div className="profile-row">
                            <span className="profile-label">Фамилия:</span>
                            <span className="profile-value">{profile.last_name}</span>
                        </div>
                        <div className="profile-row">
                            <span className="profile-label">Email:</span>
                            <span className="profile-value">{profile.email}</span>
                        </div>
                        <div className="profile-row">
                            <span className="profile-label">Роль:</span>
                            <span className="profile-value">{profile.role}</span>
                        </div>
                        <div className="profile-row">
                            <span className="profile-label">UID:</span>
                            <span className="profile-value">{profile.uid}</span>
                        </div>
                        <div className="profile-row">
                            <span className="profile-label">ID:</span>
                            <span className="profile-value">{profile.id}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;