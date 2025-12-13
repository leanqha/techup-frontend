import { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

type GetPathResponse = {
    path: string[];
    dist: number;
};

export default function IndoorMap() {
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [apiResponse, setApiResponse] = useState<GetPathResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const rooms = [
        {
            id: "101",
            name: "Комната 101",
            path: "M1493.91 414.705L1561.01 491.513L1281.05 657.427L1204.01 703.082L1246.09 751.256L1280.15 731.073L1434.32 907.562L1453.07 896.453L1453.07 896.454H1453.07L1453.07 896.452L1461.14 891.671L1439.48 866.873L1572.37 788.117L1587.18 805.073L1567.04 782.018L1652.58 731.322L1679.57 762.22L1679.57 762.221L1706.2 792.707L1696.36 798.541L1751.95 862.185L1752.44 862.738L1535.78 991.138L1469.66 915.442L1450.91 926.552L1493.8 975.651L1187.43 1157.22L1127.95 1089.13L1364.38 949.012L1335.06 915.442L1276.68 848.615H1276.68L1276.68 848.616L1213.33 886.161L1078.21 966.237L1078.21 966.236V966.237L1011.74 890.144L1210.21 772.521L1214.94 769.716L1172.86 721.543L995 826.951L945.003 769.717L1139.11 654.681L1044.58 546.466L1025.73 524.887L1026.58 524.384L925.604 408.793H576.383V430.721H590.375V456.207H576.383V465.18H555.756V524.671H555.755V564.58H472.174V524.671H467.799V385.166H316.176V400.331H250.969V385.166H106.694V418.408H138.556V535.68H383.404V513.662H436.006V636.307H119.361V748.953H162.156V789.13H119.361V1312.79H89.5215V1358.14L213.605 1413.5L362.145 1187.65L246.395 1136.01H246.374V1136H246.373L246.374 1136V889.044H365.735V1069.24L422.917 1094.75L501.973 974.546L468.307 959.524L510.07 896.023L543.737 911.044L591.022 839.149L565.888 827.935H229.32V711.878H546.348V711.879H546.349V712.033L546.451 711.878L846.303 845.669L846.163 845.88L846.303 845.797L996.624 1017.88L1024.08 1049.32L912.889 1115.21L912.888 1115.21V1115.21L735.105 911.697V911.696L723.282 898.162L696.385 886.161L528.28 1141.76L680.152 1209.53L619.128 1302.32L472.465 1236.88L323.926 1462.73L440.999 1514.97L522.333 1466.76L580.59 1533.45L397.241 1642.11L396.845 1641.66L396.548 1642.11L0 1465.18V535.681H7.9209V93.2236H190.253V73.2969H250.969V59.3936H398.979V93.2236H467.798V80.376H538.429L541.76 79.457L541.5 70.8164L1147.7 58.4297L1176.65 57.8379L1156.88 27.9922L1219.15 0L1493.91 414.705Z",
        },
    ];

    async function handleFindPath() {
        if (!from || !to) return;

        setLoading(true);
        setError(null);
        setApiResponse(null);

        try {
            const res = await fetch(`http://46.37.123.72:8080/api/v1/map/path/${from}/${to}`);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const data: GetPathResponse = await res.json();
            setApiResponse(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <div style={{ marginBottom: 16 }}>
                <input
                    placeholder="Откуда"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    style={{ marginRight: 8 }}
                />
                <input
                    placeholder="Куда"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    style={{ marginRight: 8 }}
                />
                <button onClick={handleFindPath} disabled={loading}>
                    {loading ? "Загрузка..." : "Найти путь"}
                </button>
            </div>

            <div style={{ width: "100%", height: "600px" }}>
                <TransformWrapper
                    minScale={0.1}
                    maxScale={4}
                    initialScale={1}
                    wheel={{ step: 0.1 }}
                    doubleClick={{ disabled: true }}
                >
                    <TransformComponent>
                        <svg
                            viewBox="0 0 1900 1900"
                            style={{
                                width: "100%",
                                height: "600px",
                                background: "#f2f2f2",
                                border: "1px solid #ccc",
                            }}
                        >
                            {rooms.map((room) => {
                                const isSelected = selectedRoom === room.id;
                                const isHovered = hoveredRoom === room.id;

                                return (
                                    <path
                                        key={room.id}
                                        d={room.path}
                                        fill={
                                            isSelected
                                                ? "#4CAF50"
                                                : isHovered
                                                    ? "#64B5F6"
                                                    : "#90CAF9"
                                        }
                                        stroke="#333"
                                        strokeWidth={2}
                                        style={{
                                            cursor: "pointer",
                                            transition: "fill 0.15s ease",
                                        }}
                                        onMouseEnter={() => setHoveredRoom(room.id)}
                                        onMouseLeave={() => setHoveredRoom(null)}
                                        onClick={() => {
                                            setSelectedRoom(room.id);
                                        }}
                                    />
                                );
                            })}
                        </svg>
                    </TransformComponent>
                </TransformWrapper>
            </div>

            <div style={{ marginTop: 16 }}>
                <h3>Ответ API:</h3>
                {error && <div style={{ color: "red" }}>{error}</div>}
                {apiResponse && (
                    <pre style={{ whiteSpace: "pre-wrap", background: "#111", color: "#0f0", padding: 12 }}>
                        {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                )}
            </div>
        </div>
    );
}