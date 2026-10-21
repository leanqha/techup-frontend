// The two-week time-grid calendar. One self-contained grid per parity
// (нечётная / чётная), a shared-per-week time axis, absolutely positioned slot
// blocks with top/bottom resize handles, and a single live drag preview.
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useMemo } from 'react';
import type { SlotRecord, WeekParity } from '../../../api/schedulePlanner';
import { CloseIcon } from '../../icons';
import type { DragPreview } from './usePlannerDrag';
import {
    GRID_HEIGHT,
    HOUR_MARKS,
    minToTime,
    minToY,
    PARITIES,
    PARITY_LABEL,
    timeToMin,
    WEEKDAY_LABELS,
    WEEKDAYS,
} from './plannerTime';

type Props = {
    slots: SlotRecord[];
    preview: DragPreview | null;
    conflicts: Map<number, string[]>;
    typeColor: (type: string) => string;
    mobileParity: WeekParity;
    onMobileParityChange: (p: WeekParity) => void;
    onStartMove: (e: ReactPointerEvent, slot: SlotRecord, color: string) => void;
    onStartResize: (e: ReactPointerEvent, slot: SlotRecord, edge: 'start' | 'end', color: string) => void;
    onDelete: (slot: SlotRecord) => void;
};

export function PlannerCalendar({
    slots,
    preview,
    conflicts,
    typeColor,
    mobileParity,
    onMobileParityChange,
    onStartMove,
    onStartResize,
    onDelete,
}: Props) {
    const slotsByCell = useMemo(() => {
        const map = new Map<string, SlotRecord[]>();
        for (const slot of slots) {
            const key = `${slot.week_parity}:${slot.weekday}`;
            const list = map.get(key);
            if (list) list.push(slot);
            else map.set(key, [slot]);
        }
        return map;
    }, [slots]);

    const renderCell = (parity: WeekParity, weekday: number) => {
        const cellSlots = slotsByCell.get(`${parity}:${weekday}`) ?? [];

        const blocks = cellSlots.map(slot => {
            const isMoving = preview?.slotId === slot.id && preview.kind === 'move';
            if (isMoving) return null; // represented by the ghost preview instead
            const resizing = preview?.slotId === slot.id && preview.kind === 'resize';
            const startMin = resizing ? preview!.startMin : timeToMin(slot.start_time);
            const endMin = resizing ? preview!.endMin : timeToMin(slot.end_time);
            return (
                <SlotBlock
                    key={slot.id}
                    slot={slot}
                    startMin={startMin}
                    endMin={endMin}
                    color={typeColor(slot.type)}
                    conflicts={conflicts.get(slot.id)}
                    onStartMove={onStartMove}
                    onStartResize={onStartResize}
                    onDelete={onDelete}
                />
            );
        });

        const showGhost =
            preview &&
            (preview.kind === 'create' || preview.kind === 'move') &&
            preview.parity === parity &&
            preview.weekday === weekday;

        return (
            <>
                {blocks}
                {showGhost && <PreviewBlock preview={preview!} />}
            </>
        );
    };

    return (
        <div className="planner-calendar">
            <div className="planner-calendar__toggle" role="tablist" aria-label="Неделя">
                {PARITIES.map(parity => (
                    <button
                        key={parity}
                        type="button"
                        role="tab"
                        aria-selected={parity === mobileParity}
                        data-active={parity === mobileParity}
                        className="planner-calendar__toggle-btn"
                        onClick={() => onMobileParityChange(parity)}
                    >
                        {PARITY_LABEL[parity]}
                    </button>
                ))}
            </div>

            <div className="planner-board">
                <div className="planner-axis" aria-hidden="true">
                    <div className="planner-axis__spacer" />
                    <div className="planner-axis__marks" style={{ height: GRID_HEIGHT }}>
                        {HOUR_MARKS.map(mark => (
                            <span key={mark} className="planner-axis__mark" style={{ top: minToY(mark) }}>
                                {minToTime(mark)}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="planner-weeks">
                    {PARITIES.map(parity => (
                        <section
                            key={parity}
                            className="planner-week"
                            data-parity={parity}
                            data-active={parity === mobileParity}
                        >
                            <header className="planner-week__title">{PARITY_LABEL[parity]}</header>
                            <div className="planner-days">
                                {WEEKDAYS.map(weekday => (
                                    <div key={weekday} className="planner-daycol-wrap">
                                        <div className="planner-daycol__head">{WEEKDAY_LABELS[weekday]}</div>
                                        <div
                                            className="planner-daycol"
                                            data-daycol
                                            data-parity={parity}
                                            data-weekday={weekday}
                                            style={{ height: GRID_HEIGHT }}
                                        >
                                            {renderCell(parity, weekday)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}

type SlotBlockProps = {
    slot: SlotRecord;
    startMin: number;
    endMin: number;
    color: string;
    conflicts: string[] | undefined;
    onStartMove: (e: ReactPointerEvent, slot: SlotRecord, color: string) => void;
    onStartResize: (e: ReactPointerEvent, slot: SlotRecord, edge: 'start' | 'end', color: string) => void;
    onDelete: (slot: SlotRecord) => void;
};

function SlotBlock({ slot, startMin, endMin, color, conflicts, onStartMove, onStartResize, onDelete }: SlotBlockProps) {
    const top = minToY(startMin);
    const height = minToY(endMin) - top;
    const hasConflict = Boolean(conflicts && conflicts.length);

    return (
        <div
            className="planner-slot"
            data-conflict={hasConflict}
            style={{ top, height, ['--slot-accent' as string]: color }}
            onPointerDown={e => onStartMove(e, slot, color)}
            title={hasConflict ? `Преподаватель занят:\n${conflicts!.join('\n')}` : undefined}
        >
            <span
                className="planner-slot__resize planner-slot__resize--top"
                onPointerDown={e => onStartResize(e, slot, 'start', color)}
            />
            <button
                type="button"
                className="planner-slot__del"
                aria-label="Удалить занятие"
                onPointerDown={e => e.stopPropagation()}
                onClick={() => onDelete(slot)}
            >
                <CloseIcon size={12} />
            </button>
            <div className="planner-slot__body">
                <span className="planner-slot__time">
                    {minToTime(startMin)}–{minToTime(endMin)}
                </span>
                <span className="planner-slot__subject">{slot.subject}</span>
                <span className="planner-slot__meta">
                    {slot.type}
                    {slot.classroom ? ` · ${slot.classroom}` : ''}
                </span>
                <span className="planner-slot__teacher">{slot.teacher_name || 'Без преподавателя'}</span>
            </div>
            {hasConflict && <span className="planner-slot__warn">⚠ Накладка</span>}
            <span
                className="planner-slot__resize planner-slot__resize--bottom"
                onPointerDown={e => onStartResize(e, slot, 'end', color)}
            />
        </div>
    );
}

function PreviewBlock({ preview }: { preview: DragPreview }) {
    const top = minToY(preview.startMin);
    const height = minToY(preview.endMin) - top;
    return (
        <div
            className="planner-preview"
            data-valid={preview.valid}
            style={{ top, height, ['--slot-accent' as string]: preview.color }}
        >
            <span className="planner-preview__time">
                {minToTime(preview.startMin)}–{minToTime(preview.endMin)}
            </span>
            <span className="planner-preview__label">{preview.label}</span>
        </div>
    );
}
