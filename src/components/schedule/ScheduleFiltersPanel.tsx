import { useState } from 'react';
import { ScheduleFilters } from './ScheduleFilters.tsx';
import './ScheduleFilters.css';

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
        <div className="schedule-filters-panel">
            <button className="schedule-filters-panel__toggle" onClick={() => setIsOpen(value => !value)}>
                {isOpen ? 'Скрыть фильтры' : 'Фильтры'}
            </button>

            {isOpen && (
                <div className="schedule-filters-panel__panel">
                    <ScheduleFilters
                        date={filters.date}
                        teacherId={filters.teacherId}
                        classroom={filters.classroom}
                        subject={filters.subject}
                        onChange={setFilters}
                        onSearch={handleSearch}
                    />
                    <div className="schedule-filters-panel__actions">
                        <button className="schedule-filters-panel__reset" onClick={handleReset}>Сбросить фильтры</button>
                    </div>
                </div>
            )}
        </div>
    );
}
