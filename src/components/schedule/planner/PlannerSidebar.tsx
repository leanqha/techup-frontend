// Left rail of the composer: the group's curriculum (учебный план) subjects for
// the chosen semester, as chips you drag onto the calendar. Each chip carries
// its assigned teacher so a dropped slot is pre-filled.
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { GroupSubjectRecord } from '../../../api/adminSchedule';
import type { NewSlotSeed } from './usePlannerDrag';

type Props = {
    subjects: GroupSubjectRecord[];
    defaultType: string;
    typeColor: (type: string) => string;
    onStartCreate: (e: ReactPointerEvent, seed: NewSlotSeed) => void;
    loading: boolean;
};

export function PlannerSidebar({ subjects, defaultType, typeColor, onStartCreate, loading }: Props) {
    return (
        <aside className="planner-rail" aria-label="Учебный план">
            <h3 className="planner-rail__title">Учебный план</h3>
            <p className="planner-rail__hint">Перетащите предмет в сетку →</p>

            <div className="planner-rail__list">
                {subjects.map(item => {
                    const color = typeColor(defaultType);
                    const seed: NewSlotSeed = {
                        subject: item.subject_name,
                        type: defaultType,
                        teacher_id: item.teacher_id,
                        teacher_name: item.teacher_name,
                        classroom: '',
                        color,
                    };
                    return (
                        <div
                            key={item.id}
                            className="planner-chip"
                            style={{ ['--chip-accent' as string]: color }}
                            role="button"
                            tabIndex={0}
                            aria-label={`Предмет ${item.subject_name}`}
                            onPointerDown={e => onStartCreate(e, seed)}
                        >
                            <span className="planner-chip__subject">{item.subject_name}</span>
                            <span className="planner-chip__teacher">
                                {item.teacher_name || 'Преподаватель не назначен'}
                            </span>
                        </div>
                    );
                })}

                {!subjects.length && !loading && (
                    <p className="planner-rail__empty">
                        В учебном плане этой группы на выбранный семестр пока нет предметов. Добавьте их на
                        вкладке «Учебный план» в редакторе расписания.
                    </p>
                )}
            </div>
        </aside>
    );
}
