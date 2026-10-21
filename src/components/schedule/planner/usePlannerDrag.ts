// Pointer-driven drag engine for the composer. Handles mouse, touch and pen
// uniformly via Pointer Events + pointer capture, and drives two interactions:
//   - create: dragging a subject chip from the rail onto a day column. A live
//     "ghost" tracks the pointer and a snapped preview shows the landing slot.
//   - move: dragging a placed slot. The whole block is carried under the grab
//     point (held at the same offset it was grabbed), a snapped preview shows
//     where it will land, and dropping it on the rail removes it instead.
// Geometry is resolved from the DOM (data-* on day columns / the rail), so the
// rail and the calendar can share one engine without passing refs around.
import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { SlotRecord, WeekParity } from '../../../api/schedulePlanner';
import {
    DAY_END_MIN,
    DAY_START_MIN,
    DEFAULT_DURATION_MIN,
    isOverRail,
    minToTime,
    resolveDayCol,
    resolveDayColTarget,
    snapTime,
    yToMin,
} from './plannerTime';

export type NewSlotSeed = {
    subject: string;
    type: string;
    teacher_id: number | null;
    teacher_name: string;
    classroom: string;
    color: string;
};

// Snapped landing preview, drawn inside a day column while dragging.
export type DragPreview = {
    kind: 'create' | 'move';
    parity: WeekParity;
    weekday: number;
    startMin: number;
    endMin: number;
    label: string;
    color: string;
    valid: boolean;
};

// Element that tracks the pointer during a drag. For "create" it's a compact
// pill; for "move" it's a full-size block carried at the grab offset.
export type DragGhost = {
    kind: 'create' | 'move';
    slotId: number | null;
    x: number; // pointer client x/y
    y: number;
    offsetX: number; // pointer offset within the grabbed block (0 for create)
    offsetY: number;
    width: number; // carried block size (0 → auto-sized pill for create)
    height: number;
    label: string;
    teacher: string;
    color: string;
    time: string; // HH:MM–HH:MM shown on the carried block (move only)
    meta: string; // type · classroom (move only)
};

type OverlapCheck = (
    parity: WeekParity,
    weekday: number,
    startMin: number,
    endMin: number,
    exceptId: number | null,
) => boolean;

type Callbacks = {
    hasGroupOverlap: OverlapCheck;
    onCreate: (parity: WeekParity, weekday: number, startMin: number, endMin: number, seed: NewSlotSeed) => void;
    onMove: (slot: SlotRecord, parity: WeekParity, weekday: number, startMin: number, endMin: number) => void;
    onRemove: (slot: SlotRecord) => void;
};

type InternalState = {
    kind: 'create' | 'move';
    pointerId: number;
    element: HTMLElement;
    moved: boolean;
    downX: number;
    downY: number;
    grabOffsetX: number; // where inside the block the pointer grabbed it
    grabOffsetY: number;
    width: number; // grabbed block size (move)
    height: number;
    durationMin: number;
    label: string;
    teacher: string;
    color: string;
    meta: string;
    time: string; // original HH:MM–HH:MM (move)
    seed?: NewSlotSeed; // create
    slot?: SlotRecord; // move
};

const CLICK_SLOP_PX = 4;

function clampStart(start: number, duration: number): number {
    return Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - duration, start));
}

export function usePlannerDrag(cb: Callbacks) {
    const cbRef = useRef(cb);
    cbRef.current = cb;

    const [preview, setPreview] = useState<DragPreview | null>(null);
    const [ghost, setGhost] = useState<DragGhost | null>(null);
    const [railActive, setRailActive] = useState(false);
    const stateRef = useRef<InternalState | null>(null);

    const computeCreate = (st: InternalState, clientX: number, clientY: number): DragPreview | null => {
        const target = resolveDayColTarget(clientX, clientY);
        if (!target) return null; // off the grid → no landing preview (ghost still follows)
        const start = clampStart(snapTime(target.minute), st.durationMin);
        const end = start + st.durationMin;
        const valid = !cbRef.current.hasGroupOverlap(target.parity, target.weekday, start, end, null);
        return {
            kind: 'create',
            parity: target.parity,
            weekday: target.weekday,
            startMin: start,
            endMin: end,
            label: st.seed!.subject,
            color: st.color,
            valid,
        };
    };

    // The landing slot for a move is snapped from the carried block's TOP edge
    // (pointer minus grab offset), so the block lands where it visually sits —
    // not where the cursor happens to be inside it.
    const computeMove = (st: InternalState, clientX: number, clientY: number): DragPreview | null => {
        const hit = resolveDayCol(clientX, clientY);
        if (!hit) return null;
        const topMin = yToMin(clientY - st.grabOffsetY - hit.rect.top);
        const start = clampStart(snapTime(topMin), st.durationMin);
        const end = start + st.durationMin;
        const valid = !cbRef.current.hasGroupOverlap(hit.parity, hit.weekday, start, end, st.slot!.id);
        return {
            kind: 'move',
            parity: hit.parity,
            weekday: hit.weekday,
            startMin: start,
            endMin: end,
            label: st.label,
            color: st.color,
            valid,
        };
    };

    const handleMove = useCallback((ev: PointerEvent) => {
        const st = stateRef.current;
        if (!st || ev.pointerId !== st.pointerId) return;
        if (Math.abs(ev.clientX - st.downX) > CLICK_SLOP_PX || Math.abs(ev.clientY - st.downY) > CLICK_SLOP_PX) {
            st.moved = true;
        }

        if (st.kind === 'create') {
            setGhost({
                kind: 'create',
                slotId: null,
                x: ev.clientX,
                y: ev.clientY,
                offsetX: 0,
                offsetY: 0,
                width: 0,
                height: 0,
                label: st.label,
                teacher: st.teacher,
                color: st.color,
                time: '',
                meta: '',
            });
            setPreview(computeCreate(st, ev.clientX, ev.clientY));
        } else {
            const pv = computeMove(st, ev.clientX, ev.clientY);
            const overRail = isOverRail(ev.clientX, ev.clientY);
            setGhost({
                kind: 'move',
                slotId: st.slot!.id,
                x: ev.clientX,
                y: ev.clientY,
                offsetX: st.grabOffsetX,
                offsetY: st.grabOffsetY,
                width: st.width,
                height: st.height,
                label: st.label,
                teacher: st.teacher,
                color: st.color,
                time: pv ? `${minToTime(pv.startMin)}–${minToTime(pv.endMin)}` : st.time,
                meta: st.meta,
            });
            // While over the rail (the remove zone) hide the landing preview.
            setPreview(overRail ? null : pv);
            setRailActive(overRail);
        }
    }, []);

    const handleEnd = useCallback((ev: PointerEvent) => {
        const st = stateRef.current;
        if (!st || ev.pointerId !== st.pointerId) return;

        st.element.removeEventListener('pointermove', handleMove);
        st.element.removeEventListener('pointerup', handleEnd);
        st.element.removeEventListener('pointercancel', handleEnd);
        try {
            st.element.releasePointerCapture(st.pointerId);
        } catch {
            /* capture may already be gone */
        }

        const cancelled = ev.type === 'pointercancel';
        if (!cancelled) {
            if (st.kind === 'create' && st.seed) {
                const pv = computeCreate(st, ev.clientX, ev.clientY);
                if (pv && pv.valid) {
                    cbRef.current.onCreate(pv.parity, pv.weekday, pv.startMin, pv.endMin, st.seed);
                }
            } else if (st.kind === 'move' && st.slot && st.moved) {
                if (isOverRail(ev.clientX, ev.clientY)) {
                    // Dropped back on the учебный план → remove it.
                    cbRef.current.onRemove(st.slot);
                } else {
                    // Dropped on the grid → reposition it (if the landing is valid).
                    const pv = computeMove(st, ev.clientX, ev.clientY);
                    if (pv && pv.valid) {
                        cbRef.current.onMove(st.slot, pv.parity, pv.weekday, pv.startMin, pv.endMin);
                    }
                }
            }
        }

        stateRef.current = null;
        setPreview(null);
        setGhost(null);
        setRailActive(false);
    }, [handleMove]);

    const begin = (e: ReactPointerEvent, st: InternalState) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const el = e.currentTarget as HTMLElement;
        try {
            el.setPointerCapture(e.pointerId);
        } catch {
            /* ignore */
        }
        st.element = el;
        st.pointerId = e.pointerId;
        stateRef.current = st;
        setGhost({
            kind: st.kind,
            slotId: st.slot?.id ?? null,
            x: e.clientX,
            y: e.clientY,
            offsetX: st.grabOffsetX,
            offsetY: st.grabOffsetY,
            width: st.width,
            height: st.height,
            label: st.label,
            teacher: st.teacher,
            color: st.color,
            time: st.time,
            meta: st.meta,
        });
        if (st.kind === 'create') setPreview(computeCreate(st, e.clientX, e.clientY));
        else setPreview(computeMove(st, e.clientX, e.clientY));
        el.addEventListener('pointermove', handleMove);
        el.addEventListener('pointerup', handleEnd);
        el.addEventListener('pointercancel', handleEnd);
    };

    const startCreate = useCallback((e: ReactPointerEvent, seed: NewSlotSeed) => {
        e.preventDefault();
        begin(e, {
            kind: 'create',
            pointerId: e.pointerId,
            element: e.currentTarget as HTMLElement,
            moved: false,
            downX: e.clientX,
            downY: e.clientY,
            grabOffsetX: 0,
            grabOffsetY: 0,
            width: 0,
            height: 0,
            durationMin: DEFAULT_DURATION_MIN,
            label: seed.subject,
            teacher: seed.teacher_name,
            color: seed.color,
            meta: '',
            time: '',
            seed,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleMove, handleEnd]);

    const startMove = useCallback((e: ReactPointerEvent, slot: SlotRecord, color: string, durationMin: number) => {
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const meta = `${slot.type}${slot.classroom ? ` · ${slot.classroom}` : ''}`;
        begin(e, {
            kind: 'move',
            pointerId: e.pointerId,
            element: e.currentTarget as HTMLElement,
            moved: false,
            downX: e.clientX,
            downY: e.clientY,
            grabOffsetX: e.clientX - rect.left,
            grabOffsetY: e.clientY - rect.top,
            width: rect.width,
            height: rect.height,
            durationMin,
            label: slot.subject,
            teacher: slot.teacher_name,
            color,
            meta,
            time: `${slot.start_time}–${slot.end_time}`,
            slot,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleMove, handleEnd]);

    return { preview, ghost, railActive, startCreate, startMove };
}
