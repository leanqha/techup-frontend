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

// `loading` is true only until the catalog is first resolved. Once cached (at
// module scope), later consumers start ready — so the type badge renders right
// away and never pops in on subsequent navigations.
export function useLessonTypes(): { types: LessonTypeMeta[]; loading: boolean } {
    const [types, setTypes] = useState<LessonTypeMeta[]>(cache ?? []);
    const [loading, setLoading] = useState<boolean>(cache === null);

    useEffect(() => {
        // When the catalog is already cached, loadLessonTypes resolves on the
        // next microtask, so state is reconciled without a synchronous setState.
        let cancelled = false;
        void loadLessonTypes()
            .then(loaded => {
                if (!cancelled) setTypes(loaded);
            })
            .catch(() => {
                /* leave the (possibly empty) current value; cards fall back to a neutral accent */
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { types, loading };
}
