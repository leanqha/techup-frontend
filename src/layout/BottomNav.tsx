// src/layout/BottomNav.tsx
// Floating "liquid glass" tab bar — a fixed-size frosted capsule. The active
// tab is marked by a glossy accent pill that glides between icons
// (framer-motion shared layout). Icon-only, so the bar never changes size.
// Shown on mobile viewports and whenever the app runs as an installed PWA.
import { useEffect, useState, type ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
    HomeIcon,
    CalendarIcon,
    UserIcon,
    type IconProps,
} from '../components/icons';

type NavItem = {
    to: string;
    label: string;
    Icon: ComponentType<IconProps>;
    end?: boolean;
};

const NAV_ITEMS: NavItem[] = [
    { to: '/', label: 'Главная', Icon: HomeIcon, end: true },
    { to: '/schedule', label: 'Расписание', Icon: CalendarIcon },
    { to: '/profile', label: 'Профиль', Icon: UserIcon },
];

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

const MOBILE_QUERY = '(max-width: 768px)';

/** Show the bar on mobile widths or when launched as an installed PWA. */
function useShowBottomNav(): boolean {
    const [show, setShow] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as NavigatorWithStandalone).standalone === true;
        return standalone || window.matchMedia(MOBILE_QUERY).matches;
    });

    useEffect(() => {
        const mobile = window.matchMedia(MOBILE_QUERY);
        const standalone = window.matchMedia('(display-mode: standalone)');
        const update = () =>
            setShow(
                standalone.matches ||
                    (window.navigator as NavigatorWithStandalone).standalone === true ||
                    mobile.matches
            );
        mobile.addEventListener('change', update);
        standalone.addEventListener('change', update);
        return () => {
            mobile.removeEventListener('change', update);
            standalone.removeEventListener('change', update);
        };
    }, []);

    return show;
}

export function BottomNav() {
    const show = useShowBottomNav();
    const reduceMotion = useReducedMotion();

    if (!show) return null;

    const pillTransition = reduceMotion
        ? { duration: 0 }
        : { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.8 };

    return (
        <nav className="liquidNav" aria-label="Нижняя навигация">
            <div className="liquidNavInner">
                {NAV_ITEMS.map(({ to, label, Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className="liquidNavItem"
                        aria-label={label}
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.span
                                        layoutId="liquidNavPill"
                                        className="liquidNavPill"
                                        transition={pillTransition}
                                    />
                                )}
                                <Icon className="liquidNavIcon" size={24} />
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
