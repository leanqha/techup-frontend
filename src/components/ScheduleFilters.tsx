type Props = {
    date: string;
    teacherId: string;
    classroom: string;
    onChange: (v: {
        date: string;
        teacherId: string;
        classroom: string;
    }) => void;
    onSearch: () => void;
};

export function ScheduleFilters({
                                    date,
                                    teacherId,
                                    classroom,
                                    onChange,
                                    onSearch,
                                }: Props) {
    return (
        <div
            style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 16,
            }}
        >
            <input
                type="date"
                value={date}
                onChange={e => onChange({ date: e.target.value, teacherId, classroom })}
            />

            <input
                placeholder="ID преподавателя"
                value={teacherId}
                onChange={e => onChange({ date, teacherId: e.target.value, classroom })}
            />

            <input
                placeholder="Аудитория"
                value={classroom}
                onChange={e => onChange({ date, teacherId, classroom: e.target.value })}
            />

            <button onClick={onSearch}>
                Найти
            </button>
        </div>
    );
}