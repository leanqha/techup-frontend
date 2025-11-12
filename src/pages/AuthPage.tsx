import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import './AuthPage.css';

type Mode = "login" | "register";

export default function AuthPage() {
    const [mode, setMode] = useState<Mode>("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const validateEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);
    const validatePassword = (v: string) => v.length >= 8;
    const validateName = (v: string) => v.trim().length >= 2;

    const resetErrors = () => setError(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        resetErrors();

        if (!validateEmail(email)) { setError("Введите корректный email"); return; }
        if (!validatePassword(password)) { setError("Пароль должен быть минимум 8 символов"); return; }
        if (mode === "register" && !validateName(name)) { setError("Некорректное имя"); return; }

        setLoading(true);

        try {
            const url = `http://46.37.123.72:8080/api/v1/account/${mode}`;
            const payload = mode === "login" ? { email, password } : { name, email, password };

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include" // ✅ кука будет автоматически сохранена
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Ошибка при запросе");
                return;
            }

            // ✅ Не сохраняем токен в localStorage
            // Сервер уже поставил httpOnly куку

            if (mode === "login") {
                navigate("/home");
            }
        } catch (err) {
            setError("Сетевая ошибка");
        } finally {
            setLoading(false);
        }
    }

    function toggleMode() {
        setMode((m) => (m === "login" ? "register" : "login"));
        resetErrors();
    }

    function passwordStrengthLabel(pw: string) {
        if (pw.length === 0) return "";
        if (pw.length < 6) return "Слабый";
        if (pw.length < 10) return "Средний";
        return "Сильный";
    }

    return (
        <div className="auth-page">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="auth-container"
                aria-live="polite"
            >
                <header className="auth-header">
                    <h1>{mode === "login" ? "Вход" : "Регистрация"}</h1>
                    <p>{mode === "login" ? "Войдите в свой аккаунт" : "Создайте новый аккаунт"}</p>
                </header>

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    {mode === "register" && (
                        <label className="auth-label">
                            <span className="auth-label-text"><User size={16} /> Имя</span>
                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Иван" required minLength={2} />
                        </label>
                    )}

                    <label className="auth-label">
                        <span className="auth-label-text"><Mail size={16} /> Email</span>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                    </label>

                    <label className="auth-label">
                        <span className="auth-label-text"><Lock size={16} /> Пароль</span>
                        <div className="password-wrapper">
                            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 6 символов" required minLength={6} />
                            <button type="button" onClick={() => setShowPassword((s) => !s)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                        </div>
                        <p className="password-strength">{passwordStrengthLabel(password)}</p>
                    </label>

                    {mode === "login" && (
                        <label className="auth-remember">
                            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Запомнить меня
                        </label>
                    )}

                    {error && <div className="auth-error">{error}</div>}

                    <div className="auth-actions">
                        <button type="submit" disabled={loading}>{loading ? "Подождите..." : mode === "login" ? "Войти" : "Зарегистрироваться"}</button>
                        <motion.button type="button" onClick={toggleMode}>{mode === "login" ? "Создать аккаунт" : "Уже есть аккаунт"}</motion.button>
                    </div>
                </form>

                <div className="auth-footer">
                    <a href="#" onClick={(e) => e.preventDefault()}>Забыли пароль?</a>
                </div>

                <footer className="auth-copyright">
                    <span>© {new Date().getFullYear()} TechUp</span>
                </footer>
            </motion.div>
        </div>
    );
}