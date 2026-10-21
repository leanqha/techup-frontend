// Pointer-driven drag engine for the composer. Handles mouse, touch and pen
// uniformly via Pointer Events + pointer capture, and drives a single live
// "preview" (snapped to the time grid) for three interactions:
//   - create: dragging a subject chip from the rail onto a day column
//   - move:   dragging a placed slot to another time / day / parity
//   - resize: dragging a slot's top or bottom edge
// Geometry is resolved from the DOM (data-* on day columns), so the rail and the
// calendar can share one engine without passing refs around.
import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { SlotRecord, WeekParity } from '../../../api/schedulePlanner';
import {
    clampMin,
    columnRect,
    DAY_END_MIN,
    DAY_START_MIN,
    DEFAULT_DURATION_MIN,
    MIN_DURATION_MIN,
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

export type DragPreview = {
    kind: 'create' | 'move' | 'resize';
    slotId: number | null;
    parity: WeekParity;
    weekday: number;
    startMin: number;
    endMin: number;
    label: string;
    color: string;
    valid: boolean;
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
    onResize: (slot: SlotRecord, startMin: number, endMin: number) => void;
    onClick?: (slot: SlotRecord) => void;
};

type InternalState = {
    kind: 'create' | 'move' | 'resize';
    pointerId: number;
    element: HTMLElement;
    moved: boolean;
    downX: number;
    downY: number;
    // create
    seed?: NewSlotSeed;
    // move / resize
    slot?: SlotRecord;
    durationMin: number;
    grabOffsetMin: number; // move: pointer minute - slot start at grab time
    edge?: 'start' | 'end'; // resize
};

const CLICK_SLOP_PX = 4;

function clampStart(start: number, duration: number): number {
    return Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - duration, start));
}

export function usePlannerDrag(cb: Callbacks) {
    const cbRef = useRef(cb);
    cbRef.current = cb;

    const [preview, setPreview] = useState<DragPreview | null>(null);
    const previewRef = useRef<DragPreview | null>(null);
    const stateRef = useRef<InternalState | null>(null);

    const setLivePreview = (p: DragPreview | null) => {
        previewRef.current = p;
        setPreview(p);
    };

    const computeMove = (st: InternalState, clientX: number, clientY: number): DragPreview | null => {
        const slot = st.slot!;
        const target = resolveDayColTarget(clientX, clientY);
        if (!target) {
            // keep last known position but mark invalid (can't drop outside a column)
            const prev = previewRef.current;
            return prev ? { ...prev, valid: false } : null;
        }
        const start = clampStart(snapTime(target.minute - st.grabOffsetMin), st.durationMin);
        const end = start + st.durationMin;
        const valid = !cbRef.current.hasGroupOverlap(target.parity, target.weekday, start, end, slot.id);
        return {
            kind: 'move',
            slotId: slot.id,
            parity: target.parity,
            weekday: target.weekday,
            startMin: start,
            endMin: end,
            label: slot.subject,
            color: previewRef.current?.color ?? 'var(--accent)',
            valid,
        };
    };

    const computeCreate = (st: InternalState, clientX: number, clientY: number): DragPreview | null => {
        const target = resolveDayColTarget(clientX, clientY);
        if (!target) {
            const prev = previewRef.current;
            return prev ? { ...prev, valid: false } : null;
        }
        const start = clampStart(snapTime(target.minute), st.durationMin);
        const end = start + st.durationMin;
        const valid = !cbRef.current.hasGroupOverlap(target.parity, target.weekday, start, end, null);
        return {
            kind: 'create',
            slotId: null,
            parity: target.parity,
            weekday: target.weekday,
            startMin: start,
            endMin: end,
            label: st.seed!.subject,
            color: st.seed!.color,
            valid,
        };
    };

    const computeResize = (st: InternalState, clientY: number): DragPreview | null => {
        const slot = st.slot!;
        const prev = previewRef.current;
        if (!prev) return null;
        const rect = columnRect(prev.parity, prev.weekday);
        if (!rect) return { ...prev, valid: false };
        const minute = clampMin(snapTime(yToMin(clientY - rect.top)));
        let start = prev.startMin;
        let end = prev.endMin;
        if (st.edge === 'start') start = Math.min(minute, end - MIN_DURATION_MIN);
        else end = Math.max(minute, start + MIN_DURATION_MIN);
        start = Math.max(DAY_START_MIN, start);
        end = Math.min(DAY_END_MIN, end);
        const valid = !cbRef.current.hasGroupOverlap(prev.parity, prev.weekday, start, end, slot.id);
        return { ...prev, startMin: start, endMin: end, valid };
    };

    const handleMove = useCallback((ev: PointerEvent) => {
        const st = stateRef.current;
        if (!st || ev.pointerId !== st.pointerId) return;
        if (Math.abs(ev.clientX - st.downX) > CLICK_SLOP_PX || Math.abs(ev.clientY - st.downY) > CLICK_SLOP_PX) {
            st.moved = true;
        }
        let next: DragPreview | null = null;
        if (st.kind === 'move') next = computeMove(st, ev.clientX, ev.clientY);
        else if (st.kind === 'create') next = computeCreate(st, ev.clientX, ev.clientY);
        else next = computeResize(st, ev.clientY);
        if (next) setLivePreview(next);
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

        const pv = previewRef.current;
        const cancelled = ev.type === 'pointercancel';

        if (!st.moved && st.kind !== 'create') {
            // A tap/click on a placed slot opens its editor instead of moving it.
            if (st.slot) cbRef.current.onClick?.(st.slot);
        } else if (!cancelled && pv && pv.valid) {
            if (st.kind === 'create' && st.seed) {
                cbRef.current.onCreate(pv.parity, pv.weekday, pv.startMin, pv.endMin, st.seed);
            } else if (st.kind === 'move' && st.slot) {
                cbRef.current.onMove(st.slot, pv.parity, pv.weekday, pv.startMin, pv.endMin);
            } else if (st.kind === 'resize' && st.slot) {
                cbRef.current.onResize(st.slot, pv.startMin, pv.endMin);
            }
        }

        stateRef.current = null;
        setLivePreview(null);
    }, [handleMove]);

    const begin = (e: ReactPointerEvent, st: InternalState, initial: DragPreview | null) => {
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
        if (initial) setLivePreview(initial);
        el.addEventListener('pointermove', handleMove);
        el.addEventListener('pointerup', handleEnd);
        el.addEventListener('pointercancel', handleEnd);
    };

    const startCreate = useCallback((e: ReactPointerEvent, seed: NewSlotSeed) => {
        e.preventDefault();
        const st: InternalState = {
            kind: 'create',
            pointerId: e.pointerId,
            element: e.currentTarget as HTMLElement,
            moved: false,
            downX: e.clientX,
            downY: e.clientY,
            seed,
            durationMin: DEFAULT_DURATION_MIN,
            grabOffsetMin: 0,
        };
        begin(e, st, computeCreate(st, e.clientX, e.clientY));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleMove, handleEnd]);

    const startMove = useCallback((e: ReactPointerEvent, slot: SlotRecord, color: string) => {
        e.preventDefault();
        const duration = Math.max(MIN_DURATION_MIN, minutesOf(slot));
        const target = resolveDayColTarget(e.clientX, e.clientY);
        const slotStart = startMinOf(slot);
        const grabOffsetMin = target ? target.minute - slotStart : 0;
        const st: InternalState = {
            kind: 'move',
            pointerId: e.pointerId,
            element: e.currentTarget as HTMLElement,
            moved: false,
            downX: e.clientX,
            downY: e.clientY,
            slot,
            durationMin: duration,
            grabOffsetMin,
        };
        const initial: DragPreview = {
            kind: 'move',
            slotId: slot.id,
            parity: slot.week_parity,
            weekday: slot.weekday,
            startMin: slotStart,
            endMin: slotStart + duration,
            label: slot.subject,
            color,
            valid: true,
        };
        begin(e, st, initial);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleMove, handleEnd]);

    const startResize = useCallback((e: ReactPointerEvent, slot: SlotRecord, edge: 'start' | 'end', color: string) => {
        e.preventDefault();
        e.stopPropagation();
        const slotStart = startMinOf(slot);
        const st: InternalState = {
            kind: 'resize',
            pointerId: e.pointerId,
            element: e.currentTarget as HTMLElement,
            moved: true, // a resize is always a drag, never a click
            downX: e.clientX,
            downY: e.clientY,
            slot,
            durationMin: minutesOf(slot),
            grabOffsetMin: 0,
            edge,
        };
        const initial: DragPreview = {
            kind: 'resize',
            slotId: slot.id,
            parity: slot.week_parity,
            weekday: slot.weekday,
            startMin: slotStart,
            endMin: slotStart + minutesOf(slot),
            label: slot.subject,
            color,
            valid: true,
        };
        begin(e, st, initial);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleMove, handleEnd]);

    return { preview, startCreate, startMove, startResize };
}

function startMinOf(slot: SlotRecord): number {
    const [h, m] = slot.start_time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

function minutesOf(slot: SlotRecord): number {
    const [sh, sm] = slot.start_time.split(':').map(Number);
    const [eh, em] = slot.end_time.split(':').map(Number);
    return (eh || 0) * 60 + (em || 0) - ((sh || 0) * 60 + (sm || 0));
}
