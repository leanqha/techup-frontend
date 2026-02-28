import { useState } from 'react';
import { ScheduleFilters } from './ScheduleFilters.tsx';

export type ScheduleFilterValues = {
    date: string;
    teacherId: number | null;
    classroom: string;
    subject: string;
};

type Props = {
    onSearch: (filters: ScheduleFilterValues) => void;
};

export function ScheduleFiltersPanel({ onSearch }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState<ScheduleFilterValues>({
        date: '',
        teacherId: null,
        classroom: '',
        subject: '',
    });

    const handleSearch = () => onSearch(filters);

    const handleReset = () => {
        const cleared = {
            date: '',
            teacherId: null,
            classroom: '',
            subject: '',
        };
        setFilters(cleared);
        onSearch(cleared);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => setIsOpen(value => !value)}>
                {isOpen ? 'Скрыть фильтры' : 'Фильтры'}
            </button>

            {isOpen && (
                <div style={{ padding: 12, border: '1px solid #E5E7EB', borderRadius: 8 }}>
                    <ScheduleFilters
                        date={filters.date}
                        teacherId={filters.teacherId}
                        classroom={filters.classroom}
                        subject={filters.subject}
                        onChange={setFilters}
                        onSearch={handleSearch}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={handleReset}>Сбросить фильтры</button>
                    </div>
                </div>
            )}
        </div>
    );
}
