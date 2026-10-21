// Schedule composer container: loads a group's curriculum + slots, hosts the
// drag engine, enforces same-group overlap (hard) and surfaces teacher clashes
// across groups (soft), and generates dated lessons from the two-week template.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    listGroups,
    listGroupSubjects,
    listLessonTypes,
    type GroupRecord,
    type GroupSubjectRecord,
    type LessonTypeRecord,
} from '../../../api/adminSchedule';
import {
    createSlot,
    deleteSlot as apiDeleteSlot,
    generateSchedule,
    listSlots,
    updateSlot,
    type SlotPayload,
    type SlotRecord,
    type WeekParity,
} from '../../../api/schedulePlanner';
import { PlannerCalendar } from './PlannerCalendar';
import { PlannerSidebar } from './PlannerSidebar';
import { usePlannerDrag, type NewSlotSeed } from './usePlannerDrag';
import {
    detectSemester,
    isoDate,
    minToTime,
    mondayOfThisWeek,
    rangesOverlap,
    timeToMin,
} from './plannerTime';
import './SchedulePlanner.css';

const DEFAULT_COLOR = '#64748b';

function slotToPayload(s: SlotRecord): SlotPayload {
    return {
        group_id: s.group_id,
        semester: s.semester,
        week_parity: s.week_parity,
        weekday: s.weekday,
        start_time: s.start_time,
        end_time: s.end_time,
        subject: s.subject,
        type: s.type,
        teacher_id: s.teacher_id,
        classroom: s.classroom,
    };
}

export function SchedulePlanner() {
    const [groups, setGroups] = useState<GroupRecord[]>([]);
    const [lessonTypes, setLessonTypes] = useState<LessonTypeRecord[]>([]);

    const [groupId, setGroupId] = useState<number | null>(null);
    const [semester, setSemester] = useState<number | null>(null);
    const [planSubjects, setPlanSubjects] = useState<GroupSubjectRecord[]>([]);
    const [allSlots, setAllSlots] = useState<SlotRecord[]>([]);
    const [conflicts, setConflicts] = useState<Map<number, string[]>>(new Map());

    const [mobileParity, setMobileParity] = useState<WeekParity>('odd');

    const [startDate, setStartDate] = useState(() => isoDate(mondayOfThisWeek()));
    const [endDate, setEndDate] = useState(() => {
        const d = mondayOfThisWeek();
        d.setDate(d.getDate() + 18 * 7 - 1); // ~a semester
        return isoDate(d);
    });
    const [firstWeekParity, setFirstWeekParity] = useState<WeekParity>('odd');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);

    const group = useMemo(() => groups.find(g => g.id === groupId) ?? null, [groups, groupId]);

    const typeColorMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const t of lessonTypes) map.set(t.name, t.color);
        return map;
    }, [lessonTypes]);

    const typeColor = useCallback((type: string) => typeColorMap.get(type) ?? DEFAULT_COLOR, [typeColorMap]);

    const defaultType = useMemo(() => {
        if (lessonTypes.some(t => t.name === 'Лекция')) return 'Лекция';
        return lessonTypes[0]?.name ?? 'Лекция';
    }, [lessonTypes]);

    const detected = useMemo(() => detectSemester(group?.course ?? 1), [group?.course]);

    const availableSemesters = useMemo(() => {
        const set = new Set<number>();
        planSubjects.forEach(s => set.add(s.semester));
        allSlots.forEach(s => set.add(s.semester));
        set.add(detected.number);
        return Array.from(set).sort((a, b) => a - b);
    }, [planSubjects, allSlots, detected.number]);

    const subjects = useMemo(
        () => planSubjects.filter(s => s.semester === semester),
        [planSubjects, semester],
    );

    const slots = useMemo(() => allSlots.filter(s => s.semester === semester), [allSlots, semester]);

    // A subject chip leaves the rail once it has a slot on the board (matched by
    // subject + teacher + lesson type); deleting that slot returns the chip.
    // Greedy per key so the same subject listed under several lesson types (e.g.
    // Лекция and Практика) stays as distinct chips and can each be placed.
    const availableSubjects = useMemo(() => {
        const used = new Map<string, number>();
        for (const s of slots) {
            const key = `${s.subject}__${s.teacher_id ?? ''}__${s.type}`;
            used.set(key, (used.get(key) ?? 0) + 1);
        }
        return subjects.filter(sub => {
            const type = sub.lesson_type_name || defaultType;
            const key = `${sub.subject_name}__${sub.teacher_id ?? ''}__${type}`;
            const n = used.get(key) ?? 0;
            if (n > 0) {
                used.set(key, n - 1);
                return false;
            }
            return true;
        });
    }, [subjects, slots, defaultType]);

    // ---- initial reference data ----
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const [groupsData, typesData] = await Promise.all([listGroups(), listLessonTypes()]);
                if (cancelled) return;
                setGroups(groupsData);
                setLessonTypes(typesData);
                const initial = groupsData.find(g => g.isActive) ?? groupsData[0] ?? null;
                setGroupId(initial ? initial.id : null);
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // ---- per-group curriculum + slots ----
    useEffect(() => {
        if (!groupId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        (async () => {
            try {
                const [subjectsData, slotsData] = await Promise.all([
                    listGroupSubjects({ groupId }),
                    listSlots({ groupId }),
                ]);
                if (cancelled) return;
                setPlanSubjects(subjectsData);
                setAllSlots(slotsData);

                const current = groups.find(g => g.id === groupId);
                const det = detectSemester(current?.course ?? 1).number;
                const present = new Set<number>();
                subjectsData.forEach(s => present.add(s.semester));
                slotsData.forEach(s => present.add(s.semester));
                const nextSemester = present.has(det)
                    ? det
                    : Array.from(present).sort((a, b) => a - b)[0] ?? det;
                setSemester(nextSemester);
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Ошибка загрузки расписания');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [groupId, groups]);

    // ---- teacher clash detection (across groups) ----
    const slotsSignature = slots
        .map(s => `${s.id}:${s.teacher_id ?? 0}:${s.week_parity}:${s.weekday}:${s.start_time}:${s.end_time}`)
        .join('|');

    useEffect(() => {
        const teacherIds = Array.from(new Set(slots.map(s => s.teacher_id).filter((id): id is number => id != null)));
        if (!teacherIds.length) {
            setConflicts(new Map());
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const perTeacher = await Promise.all(
                    teacherIds.map(async id => [id, await listSlots({ teacherId: id })] as const),
                );
                if (cancelled) return;
                const byTeacher = new Map<number, SlotRecord[]>(perTeacher);
                const next = new Map<number, string[]>();
                for (const mine of slots) {
                    if (mine.teacher_id == null) continue;
                    const others = byTeacher.get(mine.teacher_id) ?? [];
                    const msgs: string[] = [];
                    for (const other of others) {
                        if (other.id === mine.id || other.group_id === mine.group_id) continue;
                        if (other.week_parity !== mine.week_parity || other.weekday !== mine.weekday) continue;
                        if (
                            rangesOverlap(
                                timeToMin(mine.start_time),
                                timeToMin(mine.end_time),
                                timeToMin(other.start_time),
                                timeToMin(other.end_time),
                            )
                        ) {
                            msgs.push(
                                `${other.group_name || '#' + other.group_id} · ${other.subject} (${other.start_time}–${other.end_time})`,
                            );
                        }
                    }
                    if (msgs.length) next.set(mine.id, msgs);
                }
                setConflicts(next);
            } catch {
                /* conflict detection is best-effort; ignore load errors */
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slotsSignature, groupId]);

    // ---- overlap guard (same group, same parity + weekday) ----
    const hasGroupOverlap = useCallback(
        (parity: WeekParity, weekday: number, startMin: number, endMin: number, exceptId: number | null) =>
            slots.some(
                s =>
                    s.id !== exceptId &&
                    s.week_parity === parity &&
                    s.weekday === weekday &&
                    rangesOverlap(startMin, endMin, timeToMin(s.start_time), timeToMin(s.end_time)),
            ),
        [slots],
    );

    const reloadSlots = useCallback(async () => {
        if (!groupId) return;
        try {
            setAllSlots(await listSlots({ groupId }));
        } catch {
            /* ignore */
        }
    }, [groupId]);

    const tempIdRef = useRef(-1);

    const handleCreate = useCallback(
        async (parity: WeekParity, weekday: number, startMin: number, endMin: number, seed: NewSlotSeed) => {
            if (!groupId || semester == null) return;
            const tempId = tempIdRef.current--;
            const optimistic: SlotRecord = {
                id: tempId,
                group_id: groupId,
                group_name: group?.name ?? '',
                semester,
                week_parity: parity,
                weekday,
                start_time: minToTime(startMin),
                end_time: minToTime(endMin),
                subject: seed.subject,
                type: seed.type,
                teacher_id: seed.teacher_id,
                teacher_name: seed.teacher_name,
                classroom: seed.classroom,
            };
            setAllSlots(prev => [...prev, optimistic]);
            try {
                const created = await createSlot(slotToPayload(optimistic));
                setAllSlots(prev =>
                    prev.map(s =>
                        s.id === tempId
                            ? {
                                  ...created,
                                  group_name: created.group_name || optimistic.group_name,
                                  teacher_name: created.teacher_name || optimistic.teacher_name,
                              }
                            : s,
                    ),
                );
            } catch (err) {
                setAllSlots(prev => prev.filter(s => s.id !== tempId));
                setError(err instanceof Error ? err.message : 'Не удалось создать занятие');
            }
        },
        [group?.name, groupId, semester],
    );

    const handleDelete = useCallback(
        async (slot: SlotRecord) => {
            setAllSlots(prev => prev.filter(s => s.id !== slot.id));
            if (slot.id < 0) return;
            try {
                await apiDeleteSlot(slot.id);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Не удалось удалить занятие');
                void reloadSlots();
            }
        },
        [reloadSlots],
    );

    // Reposition a placed slot (new parity / weekday / time). Optimistic, with a
    // revert to the original on failure.
    const handleMove = useCallback(
        async (slot: SlotRecord, parity: WeekParity, weekday: number, startMin: number, endMin: number) => {
            const moved: SlotRecord = {
                ...slot,
                week_parity: parity,
                weekday,
                start_time: minToTime(startMin),
                end_time: minToTime(endMin),
            };
            if (
                moved.week_parity === slot.week_parity &&
                moved.weekday === slot.weekday &&
                moved.start_time === slot.start_time &&
                moved.end_time === slot.end_time
            ) {
                return; // dropped back where it started
            }
            setAllSlots(prev => prev.map(s => (s.id === slot.id ? moved : s)));
            if (slot.id < 0) return; // still being created; local move is enough
            try {
                const saved = await updateSlot(slot.id, slotToPayload(moved));
                setAllSlots(prev =>
                    prev.map(s =>
                        s.id === slot.id
                            ? {
                                  ...saved,
                                  group_name: saved.group_name || moved.group_name,
                                  teacher_name: saved.teacher_name || moved.teacher_name,
                              }
                            : s,
                    ),
                );
            } catch (err) {
                setAllSlots(prev => prev.map(s => (s.id === slot.id ? slot : s)));
                setError(err instanceof Error ? err.message : 'Не удалось переместить занятие');
            }
        },
        [],
    );

    const { preview, ghost, railActive, startCreate, startMove } = usePlannerDrag({
        hasGroupOverlap,
        onCreate: handleCreate,
        onMove: (slot, parity, weekday, startMin, endMin) =>
            void handleMove(slot, parity, weekday, startMin, endMin),
        onRemove: slot => void handleDelete(slot),
    });

    const handleGenerate = async () => {
        if (!groupId || semester == null) return;
        if (endDate < startDate) {
            setError('Дата окончания раньше даты начала');
            return;
        }
        const ok = window.confirm(
            `Сгенерировать пары для группы ${group?.name ?? ''} на период ${startDate} — ${endDate}?\n` +
                'Существующие занятия группы в этом диапазоне будут заменены.',
        );
        if (!ok) return;

        setGenerating(true);
        setError(null);
        setMessage(null);
        try {
            const res = await generateSchedule({
                group_id: groupId,
                semester,
                start_date: startDate,
                end_date: endDate,
                first_week_parity: firstWeekParity,
            });
            const skipped = res.skipped ? `, пропущено без преподавателя: ${res.skipped}` : '';
            setMessage(`Создано занятий: ${res.generated}${skipped}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось сгенерировать расписание');
        } finally {
            setGenerating(false);
        }
    };

    const conflictCount = conflicts.size;

    return (
        <div className="planner">
            <div className="planner-toolbar glass">
                <label className="planner-field">
                    Группа
                    <select
                        value={groupId ?? ''}
                        onChange={e => setGroupId(e.target.value ? Number(e.target.value) : null)}
                    >
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>
                                {g.name} ({g.course} курс)
                            </option>
                        ))}
                    </select>
                </label>

                <label className="planner-field">
                    Семестр <span className="planner-field__hint">({detected.season})</span>
                    <select
                        value={semester ?? ''}
                        onChange={e => setSemester(e.target.value ? Number(e.target.value) : null)}
                    >
                        {availableSemesters.map(s => (
                            <option key={s} value={s}>
                                {s} семестр
                            </option>
                        ))}
                    </select>
                </label>

                <div className="planner-toolbar__generate">
                    <label className="planner-field">
                        Начало
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </label>
                    <label className="planner-field">
                        Конец
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </label>
                    <label className="planner-field">
                        1-я неделя
                        <select
                            value={firstWeekParity}
                            onChange={e => setFirstWeekParity(e.target.value as WeekParity)}
                        >
                            <option value="odd">Нечётная</option>
                            <option value="even">Чётная</option>
                        </select>
                    </label>
                    <button
                        type="button"
                        className="admin-primary-button planner-generate-btn"
                        onClick={() => void handleGenerate()}
                        disabled={generating || !groupId || semester == null}
                    >
                        {generating ? 'Генерация…' : 'Сгенерировать расписание'}
                    </button>
                </div>
            </div>

            {loading && <p className="admin-section-status">Загрузка…</p>}
            {error && <p className="admin-section-error">{error}</p>}
            {message && <p className="admin-section-message">{message}</p>}
            {conflictCount > 0 && (
                <p className="planner-conflict-banner">
                    ⚠ Накладки у преподавателей: {conflictCount}. Это предупреждение — сохранять можно (например,
                    при совмещённых потоках).
                </p>
            )}

            <div className="planner-body">
                <PlannerSidebar
                    subjects={availableSubjects}
                    planHasSubjects={subjects.length > 0}
                    dropActive={railActive}
                    defaultType={defaultType}
                    typeColor={typeColor}
                    onStartCreate={startCreate}
                    loading={loading}
                />
                <PlannerCalendar
                    slots={slots}
                    preview={preview}
                    conflicts={conflicts}
                    typeColor={typeColor}
                    mobileParity={mobileParity}
                    draggingSlotId={ghost?.kind === 'move' ? ghost.slotId : null}
                    onMobileParityChange={setMobileParity}
                    onStartMove={startMove}
                />
            </div>

            {ghost && ghost.kind === 'move' && (
                <div
                    className="planner-drag-ghost"
                    data-kind="move"
                    style={{
                        left: ghost.x - ghost.offsetX,
                        top: ghost.y - ghost.offsetY,
                        width: ghost.width,
                        height: ghost.height,
                        ['--slot-accent' as string]: ghost.color,
                    }}
                >
                    <div className="planner-slot__body">
                        <span className="planner-slot__time">{ghost.time}</span>
                        <span className="planner-slot__subject">{ghost.label}</span>
                        {ghost.meta && <span className="planner-slot__meta">{ghost.meta}</span>}
                        <span className="planner-slot__teacher">{ghost.teacher || 'Без преподавателя'}</span>
                    </div>
                </div>
            )}

            {ghost && ghost.kind === 'create' && (
                <div
                    className="planner-drag-ghost"
                    data-kind="create"
                    style={{ left: ghost.x, top: ghost.y, ['--slot-accent' as string]: ghost.color }}
                >
                    <span className="planner-drag-ghost__subject">{ghost.label}</span>
                    {ghost.teacher && <span className="planner-drag-ghost__teacher">{ghost.teacher}</span>}
                </div>
            )}
        </div>
    );
}
