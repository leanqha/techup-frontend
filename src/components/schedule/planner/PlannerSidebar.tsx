// Left rail of the composer: the group's curriculum (учебный план) subjects for
// the chosen semester, as chips you drag onto the calendar. A placed subject
// leaves the rail; dragging its slot back here returns the chip. Each chip
// carries its assigned teacher so a dropped slot is pre-filled.
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { GroupSubjectRecord } from '../../../api/adminSchedule';
import type { NewSlotSeed } from './usePlannerDrag';

type Props = {
    subjects: GroupSubjectRecord[];
    planHasSubjects: boolean;
    dropActive: boolean;
    defaultType: string;
    typeColor: (type: string) => string;
    onStartCreate: (e: ReactPointerEvent, seed: NewSlotSeed) => void;
    loading: boolean;
};

export function PlannerSidebar({
    subjects,
    planHasSubjects,
    dropActive,
    defaultType,
    typeColor,
    onStartCreate,
    loading,
}: Props) {
    return (
        <aside className="planner-rail" aria-label="Учебный план" data-planner-rail data-drop-active={dropActive}>
            <h3 className="planner-rail__title">Учебный план</h3>
            <p className="planner-rail__hint">Перетащите предмет в сетку → · обратно, чтобы убрать</p>

            <div className="planner-rail__list">
                {subjects.map(item => {
                    const type = item.lesson_type_name || defaultType;
                    const color = item.lesson_type_color || typeColor(type);
                    const seed: NewSlotSeed = {
                        subject: item.subject_name,
                        type,
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
                            aria-label={`Предмет ${item.subject_name}${type ? `, ${type}` : ''}`}
                            onPointerDown={e => onStartCreate(e, seed)}
                        >
                            <span className="planner-chip__subject">{item.subject_name}</span>
                            {type && <span className="planner-chip__type">{type}</span>}
                            <span className="planner-chip__teacher">
                                {item.teacher_name || 'Преподаватель не назначен'}
                            </span>
                        </div>
                    );
                })}

                {!subjects.length && !loading && planHasSubjects && (
                    <p className="planner-rail__empty">
                        Все предметы распределены. Чтобы убрать занятие, перетащите его обратно сюда.
                    </p>
                )}

                {!subjects.length && !loading && !planHasSubjects && (
                    <p className="planner-rail__empty">
                        В учебном плане этой группы на выбранный семестр пока нет предметов. Добавьте их на
                        вкладке «Учебный план» в редакторе расписания.
                    </p>
                )}
            </div>
        </aside>
    );
}
