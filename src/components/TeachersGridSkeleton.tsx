import { Skeleton } from './ui/Skeleton';

// Placeholder grid shown while the teacher list loads. Reuses the real grid /
// card classes (from TeachersPage.css) so the layout matches the loaded state.
export function TeachersGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="teachers-page__grid" role="status" aria-busy="true">
            <span className="skeleton-sr-only">Загрузка преподавателей</span>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="teachers-page__card teachers-page__card--skeleton"
                    aria-hidden="true"
                >
                    <Skeleton width="75%" height={16} />
                </div>
            ))}
        </div>
    );
}
