// Pointer-driven drag engine for the composer. Handles mouse, touch and pen
// uniformly via Pointer Events + pointer capture, and drives two interactions:
//   - create: dragging a subject chip from the rail onto a day column. A live
//     "ghost" tracks the pointer and a snapped preview shows the landing slot.
//   - remove: dragging a placed (locked) slot back onto the rail to delete it.
// Placed slots are otherwise locked — they can't be moved, resized or edited.
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
    resolveDayColTarget,
    snapTime,
} from './plannerTime';

export type NewSlotSeed = {
    subject: string;
    type: string;
    teacher_id: number | null;
    teacher_name: string;
    classroom: string;
    color: string;
};

// Snapped landing preview, drawn inside a day column while creating a slot.
export type DragPreview = {
    kind: 'create';
    parity: WeekParity;
    weekday: number;
    startMin: number;
    endMin: number;
    label: string;
    color: string;
    valid: boolean;
};

// Floating chip that tracks the pointer during any drag.
export type DragGhost = {
    kind: 'create' | 'remove';
    slotId: number | null;
    x: number;
    y: number;
    label: string;
    teacher: string;
    color: string;
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
    onRemove: (slot: SlotRecord) => void;
};

type InternalState = {
    kind: 'create' | 'remove';
    pointerId: number;
    element: HTMLElement;
    moved: boolean;
    downX: number;
    downY: number;
    durationMin: number;
    label: string;
    teacher: string;
    color: string;
    seed?: NewSlotSeed; // create
    slot?: SlotRecord; // remove
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
            color: st.seed!.color,
            valid,
        };
    };

    const handleMove = useCallback((ev: PointerEvent) => {
        const st = stateRef.current;
        if (!st || ev.pointerId !== st.pointerId) return;
        if (Math.abs(ev.clientX - st.downX) > CLICK_SLOP_PX || Math.abs(ev.clientY - st.downY) > CLICK_SLOP_PX) {
            st.moved = true;
        }
        setGhost({
            kind: st.kind,
            slotId: st.slot?.id ?? null,
            x: ev.clientX,
            y: ev.clientY,
            label: st.label,
            teacher: st.teacher,
            color: st.color,
        });
        if (st.kind === 'create') {
            setPreview(computeCreate(st, ev.clientX, ev.clientY));
        } else {
            setRailActive(isOverRail(ev.clientX, ev.clientY));
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
            } else if (st.kind === 'remove' && st.slot && st.moved && isOverRail(ev.clientX, ev.clientY)) {
                // Dropping a locked slot back on the учебный план removes it.
                cbRef.current.onRemove(st.slot);
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
            label: st.label,
            teacher: st.teacher,
            color: st.color,
        });
        if (st.kind === 'create') setPreview(computeCreate(st, e.clientX, e.clientY));
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
            durationMin: DEFAULT_DURATION_MIN,
            label: seed.subject,
            teacher: seed.teacher_name,
            color: seed.color,
            seed,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleMove, handleEnd]);

    const startRemove = useCallback((e: ReactPointerEvent, slot: SlotRecord, color: string) => {
        e.preventDefault();
        begin(e, {
            kind: 'remove',
            pointerId: e.pointerId,
            element: e.currentTarget as HTMLElement,
            moved: false,
            downX: e.clientX,
            downY: e.clientY,
            durationMin: DEFAULT_DURATION_MIN,
            label: slot.subject,
            teacher: slot.teacher_name,
            color,
            slot,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleMove, handleEnd]);

    return { preview, ghost, railActive, startCreate, startRemove };
}
