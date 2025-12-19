import { Navigate } from 'react-router-dom';
import type {Profile} from '../api/types/types.ts';
import type {JSX} from "react";

type Props = {
    profile: Profile | null;
    children: JSX.Element;
};

export function ProtectedRoute({ profile, children }: Props) {
    if (!profile) {
        return <Navigate to="/auth" replace />;
    }

    return children;
}