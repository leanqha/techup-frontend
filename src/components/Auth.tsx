import { useState } from "react";

const API_BASE = "http://46.37.123.72/api/v1";

type Mode = "login" | "register";

export default function AuthOverlay() {
    const [mode, setMode] = useState<Mode>("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const url = mode === "login" ? "/account/login" : "/account/register";

            const body =
                mode === "login"
                    ? {
                        email: form.email,
                        password: form.password,
                    }
                    : {
                        email: form.email,
                        password: form.password,
                        first_name: form.firstName,
                        last_name: form.lastName,
                    };

            const res = await fetch(`${API_BASE}${url}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // важно для cookie SameSite
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Ошибка авторизации");
            }

            // токены придут через httpOnly cookies
            // здесь можно обновить состояние приложения или перезагрузить страницу
            window.location.reload();
        } catch (err: any) {
            setError(err.message ?? "Неизвестная ошибка");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* фон */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* карточка */}
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-center text-2xl font-semibold">
                    {mode === "login" ? "Вход" : "Регистрация"}
                </h2>

                <form onSubmit={submit} className="space-y-4">
                    {mode === "register" && (
                        <>
                            <input
                                name="lastName"
                                placeholder="Фамилия"
                                value={form.lastName}
                                onChange={onChange}
                                required
                                className="w-full rounded-lg border px-3 py-2"
                            />
                            <input
                                name="firstName"
                                placeholder="Имя"
                                value={form.firstName}
                                onChange={onChange}
                                required
                                className="w-full rounded-lg border px-3 py-2"
                            />
                        </>
                    )}

                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={onChange}
                        required
                        className="w-full rounded-lg border px-3 py-2"
                    />

                    <input
                        name="password"
                        type="password"
                        placeholder="Пароль"
                        value={form.password}
                        onChange={onChange}
                        required
                        className="w-full rounded-lg border px-3 py-2"
                    />

                    {error && (
                        <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full rounded-lg bg-black py-2 text-white transition hover:bg-black/80 disabled:opacity-50"
                    >
                        {loading
                            ? "Загрузка..."
                            : mode === "login"
                                ? "Войти"
                                : "Зарегистрироваться"}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm">
                    {mode === "login" ? (
                        <button
                            onClick={() => setMode("register")}
                            className="text-blue-600 hover:underline"
                        >
                            Нет аккаунта? Зарегистрироваться
                        </button>
                    ) : (
                        <button
                            onClick={() => setMode("login")}
                            className="text-blue-600 hover:underline"
                        >
                            Уже есть аккаунт? Войти
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
