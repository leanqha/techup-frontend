import { useAuth } from '../context/useAuth';
import { SchedulePlanner } from '../components/schedule/planner/SchedulePlanner';
import './SchedulePlannerPage.css';

export function SchedulePlannerPage() {
    const { profile } = useAuth();

    if (profile?.role !== 'admin') {
        return <p>У вас нет доступа к конструктору расписания</p>;
    }

    return (
        <div className="planner-page">
            <header className="planner-page__head">
                <h1>Конструктор расписания</h1>
                <p>
                    Перетаскивайте предметы из учебного плана в сетку чётной и нечётной недели, задавайте время и
                    генерируйте пары на семестр.
                </p>
            </header>
            <SchedulePlanner />
        </div>
    );
}
