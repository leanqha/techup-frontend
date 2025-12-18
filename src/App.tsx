import React, { useEffect, useState } from "react";

const App: React.FC = () => {
    const [status, setStatus] = useState<string>("Загрузка...");

    useEffect(() => {
        fetch("/api/v1/health")
            .then((res) => {
                if (!res.ok) throw new Error("Ошибка сети");
                return res.json();
            })
            .then((data) => {
                setStatus(data.status || "OK");
            })
            .catch((err) => {
                console.error(err);
                setStatus("Ошибка подключения к API");
            });
    }, []);

    return (
        <div style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: "50px" }}>
            <h1>Тестовое приложение TechUp</h1>
            <p>Статус API: <strong>{status}</strong></p>
        </div>
    );
};

export default App;