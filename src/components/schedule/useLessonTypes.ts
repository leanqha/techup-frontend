import { useEffect, useState } from 'react';
import { fetchLessonTypes } from '../../api/schedule.ts';
import type { LessonTypeMeta } from '../../api/types/schedule.ts';

// The lesson types catalog is small and changes rarely, so cache it at module
// scope and dedupe concurrent fetches — every lesson card asks for it, but the
// network is hit only once per page load.
let cache: LessonTypeMeta[] | null = null;
let inflight: Promise<LessonTypeMeta[]> | null = null;

async function loadLessonTypes(): Promise<LessonTypeMeta[]> {
    if (cache) return cache;
    inflight =
        inflight ??
        fetchLessonTypes()
            .then(types => {
                cache = types;
                return types;
            })
            .finally(() => {
                inflight = null;
            });
    return inflight;
}

export function useLessonTypes(): LessonTypeMeta[] {
    const [types, setTypes] = useState<LessonTypeMeta[]>(cache ?? []);

    useEffect(() => {
        let cancelled = false;
        void loadLessonTypes()
            .then(loaded => {
                if (!cancelled) setTypes(loaded);
            })
            .catch(() => {
                /* leave the (possibly empty) current value; cards fall back to a neutral accent */
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return types;
}
