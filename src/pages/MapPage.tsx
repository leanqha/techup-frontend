import React, { useEffect, useState } from "react";
import "./MapPage.css";

type Room = {
    id: string;
    name: string;
};

type MapResponse = {
    path: string[];
    dist: number;
};

const MapPage: React.FC = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [from, setFrom] = useState<string>("");
    const [to, setTo] = useState<string>("");
    const [data, setData] = useState<MapResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Загружаем все комнаты
    useEffect(() => {
        fetch("http://46.37.123.72:8080/api/v1/map/search")
            .then((res) => {
                if (!res.ok) throw new Error("Ошибка при загрузке списка комнат");
                return res.json();
            })
            .then((data: Room[]) => {
                setRooms(data);
            })
            .catch((err) => setError(err.message));
    }, []);

    const handleSearch = () => {
        if (!from || !to) {
            setError("Выберите обе комнаты");
            return;
        }

        setLoading(true);
        setError(null);
        setData(null);

        // передаём названия, а не ID
        fetch(`http://46.37.123.72:8080/api/v1/map/path/${encodeURIComponent(from)}/${encodeURIComponent(to)}`)
            .then((res) => {
                if (!res.ok) throw new Error("Ошибка при получении пути");
                return res.json();
            })
            .then((data: MapResponse) => {
                setData(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    };

    return (
        <div className="map-container">
            <h1 className="map-title">Навигация по ВУЗу</h1>

            <div className="map-form">
                <div className="form-group">
                    <label htmlFor="from">Откуда:</label>
                    <select
                        id="from"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                    >
                        <option value="">Выберите комнату</option>
                        {rooms.map((room) => (
                            <option key={room.id} value={room.name}>
                                {room.name || `Комната ${room.id}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="to">Куда:</label>
                    <select id="to" value={to} onChange={(e) => setTo(e.target.value)}>
                        <option value="">Выберите комнату</option>
                        {rooms.map((room) => (
                            <option key={room.id} value={room.name}>
                                {room.name || `Комната ${room.id}`}
                            </option>
                        ))}
                    </select>
                </div>

                <button onClick={handleSearch} disabled={loading}>
                    {loading ? "Поиск..." : "Построить маршрут"}
                </button>
            </div>

            {error && <p className="map-error">{error}</p>}

            {data && (
                <div className="map-card">
                    <h2>Путь</h2>
                    <div className="path-list">
                        {data.path.map((node, index) => (
                            <div key={node} className="path-node">
                                <span className="node">{node}</span>
                                {index < data.path.length - 1 && <span className="arrow">→</span>}
                            </div>
                        ))}
                    </div>
                    <p className="distance">
                        Расстояние: <strong>{data.dist}</strong>
                    </p>
                </div>
            )}
        </div>
    );
};

export default MapPage;