"use client";

import { useSession } from "next-auth/react";
import { useCallback, useMemo } from "react";

export function usePermission() {
    const { data: session } = useSession();

    const userPermissions = useMemo(() => {
        if (!session?.user?.permissions) return new Set();
        return new Set(session.user.permissions);
    }, [session]);

    const userRoles = useMemo(() => {
        if (!session?.user?.roles) return new Set();
        return new Set(session.user.roles);
    }, [session]);

    const hasPermission = useCallback(
        (permissionName) => {
            // Super Admin bypass
            if (userRoles.has("Super Admin")) return true;
            return userPermissions.has(permissionName);
        },
        [userPermissions, userRoles]
    );

    const hasRole = useCallback(
        (roleName) => {
            return userRoles.has(roleName);
        },
        [userRoles]
    );

    // Check if user has ANY of the provided permissions
    const hasAnyPermission = useCallback(
        (permissionNames) => {
            if (!Array.isArray(permissionNames)) return false;
            // Super Admin bypass
            if (userRoles.has("Super Admin")) return true;
            return permissionNames.some((name) => userPermissions.has(name));
        },
        [userPermissions, userRoles]
    );

    // Check if user has ALL of the provided permissions
    const hasAllPermissions = useCallback(
        (permissionNames) => {
            if (!Array.isArray(permissionNames)) return false;
            // Super Admin bypass
            if (userRoles.has("Super Admin")) return true;
            return permissionNames.every((name) => userPermissions.has(name));
        },
        [userPermissions, userRoles]
    );

    // CRUD operation shortcuts
    const canView = useCallback(
        (moduleName) => {
            return hasPermission(`${moduleName} View`);
        },
        [hasPermission]
    );

    const canCreate = useCallback(
        (moduleName) => {
            return hasPermission(`${moduleName} Create`);
        },
        [hasPermission]
    );

    const canUpdate = useCallback(
        (moduleName) => {
            return hasPermission(`${moduleName} Edit`);
        },
        [hasPermission]
    );

    const canDelete = useCallback(
        (moduleName) => {
            return hasPermission(`${moduleName} Delete`);
        },
        [hasPermission]
    );

    return {
        hasPermission,
        hasRole,
        hasAnyPermission,
        hasAllPermissions,
        canView,
        canCreate,
        canUpdate,
        canDelete,
        isLoaded: !!session,
        userPermissions: Array.from(userPermissions),
        userRoles: Array.from(userRoles),
    };
}
