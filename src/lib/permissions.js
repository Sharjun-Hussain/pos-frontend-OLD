/**
 * Permission Constants
 * 
 * Centralized permission definitions matching backend permission names.
 * Use these constants throughout the app for permission checks.
 */

// Access Management Permissions
export const PERMISSIONS = {
    // Permission Management
    PERMISSION_VIEW: "Permission View",
    PERMISSION_CREATE: "Permission Create",
    PERMISSION_EDIT: "Permission Edit",
    PERMISSION_DELETE: "Permission Delete",

    // Role Management
    ROLE_VIEW: "Role View",
    ROLE_CREATE: "Role Create",
    ROLE_EDIT: "Role Edit",
    ROLE_DELETE: "Role Delete",

    // User Management
    USER_VIEW: "User View",
    USER_CREATE: "User Create",
    USER_EDIT: "User Edit",
    USER_DELETE: "User Delete",

    // Branch Management
    BRANCH_VIEW: "Branch View",
    BRANCH_CREATE: "Branch Create",
    BRANCH_EDIT: "Branch Edit",
    BRANCH_DELETE: "Branch Delete",

    // Brand Management
    BRAND_VIEW: "Brand View",
    BRAND_CREATE: "Brand Create",
    BRAND_EDIT: "Brand Edit",
    BRAND_DELETE: "Brand Delete",

    // Product Management
    PRODUCT_VIEW: "Product View",
    PRODUCT_CREATE: "Product Create",
    PRODUCT_EDIT: "Product Edit",
    PRODUCT_DELETE: "Product Delete",

    // Supplier Management
    SUPPLIER_VIEW: "Supplier View",
    SUPPLIER_CREATE: "Supplier Create",
    SUPPLIER_EDIT: "Supplier Edit",
    SUPPLIER_DELETE: "Supplier Delete",

    // Purchase Order Management
    PURCHASE_ORDER_VIEW: "Purchase Order View",
    PURCHASE_ORDER_CREATE: "Purchase Order Create",
    PURCHASE_ORDER_EDIT: "Purchase Order Edit",
    PURCHASE_ORDER_DELETE: "Purchase Order Delete",

    // Add more modules as they get permissions...
};

// Permission groups for easier management
export const PERMISSION_GROUPS = {
    ACCESS_MANAGEMENT: [
        PERMISSIONS.PERMISSION_VIEW,
        PERMISSIONS.PERMISSION_CREATE,
        PERMISSIONS.PERMISSION_EDIT,
        PERMISSIONS.PERMISSION_DELETE,
        PERMISSIONS.ROLE_VIEW,
        PERMISSIONS.ROLE_CREATE,
        PERMISSIONS.ROLE_EDIT,
        PERMISSIONS.ROLE_DELETE,
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_EDIT,
        PERMISSIONS.USER_DELETE,
    ],
    BRANCH_MANAGEMENT: [
        PERMISSIONS.BRANCH_VIEW,
        PERMISSIONS.BRANCH_CREATE,
        PERMISSIONS.BRANCH_EDIT,
        PERMISSIONS.BRANCH_DELETE,
    ],
    BRAND_MANAGEMENT: [
        PERMISSIONS.BRAND_VIEW,
        PERMISSIONS.BRAND_CREATE,
        PERMISSIONS.BRAND_EDIT,
        PERMISSIONS.BRAND_DELETE,
    ],
    PRODUCT_MANAGEMENT: [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.PRODUCT_CREATE,
        PERMISSIONS.PRODUCT_EDIT,
        PERMISSIONS.PRODUCT_DELETE,
    ],
    PURCHASE_MANAGEMENT: [
        PERMISSIONS.SUPPLIER_VIEW,
        PERMISSIONS.SUPPLIER_CREATE,
        PERMISSIONS.SUPPLIER_EDIT,
        PERMISSIONS.SUPPLIER_DELETE,
        PERMISSIONS.PURCHASE_ORDER_VIEW,
        PERMISSIONS.PURCHASE_ORDER_CREATE,
        PERMISSIONS.PURCHASE_ORDER_EDIT,
        PERMISSIONS.PURCHASE_ORDER_DELETE,
    ],
};

/**
 * Helper function to generate CRUD permission names for a module
 * @param {string} moduleName - Name of the module (e.g., "Branch", "Product")
 * @returns {Object} Object with View, Create, Edit, Delete permission names
 */
export function generateModulePermissions(moduleName) {
    return {
        VIEW: `${moduleName} View`,
        CREATE: `${moduleName} Create`,
        EDIT: `${moduleName} Edit`,
        DELETE: `${moduleName} Delete`,
    };
}

/**
 * Module name constants for use with permission hook shortcuts
 */
export const MODULES = {
    PERMISSION: "Permission",
    ROLE: "Role",
    USER: "User",
    BRANCH: "Branch",
    BRAND: "Brand",
    PRODUCT: "Product",
    SUPPLIER: "Supplier",
    PURCHASE_ORDER: "Purchase Order",
    // Add more as needed
};
