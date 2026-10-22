// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.ts';
import type {JSX} from "react";
import {Loader} from "../Loader.tsx";

export function ProtectedRoute({
    children,
    renderChildrenWhileLoading = false,
}: {
    children: JSX.Element;
    // Routes whose page renders its own skeleton pass this so the auth-boot
    // phase shows that skeleton instead of a full-screen spinner.
    renderChildrenWhileLoading?: boolean;
}) {
    const { profile, loading } = useAuth();

    if (loading) {
        return renderChildrenWhileLoading ? children : <Loader />;
    }

    if (!profile) {
        return <Navigate to="/welcome" replace />;
    }

    return children;
}