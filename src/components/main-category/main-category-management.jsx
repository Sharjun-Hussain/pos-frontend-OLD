"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import OrganizationPageSkeleton from "@/app/skeletons/Organization-skeleton";
import { ResourceManagementLayout } from "../general/resource-management-layout";
import { getMainCategoryColumns } from "./main-category-column";
import { MainCategoryDialog } from "./main-category-dialog";
import { usePermission } from "@/hooks/use-permission";
import { CheckCircle2, XCircle, Trash2, ChevronDown } from "lucide-react"; // Added icons for better UI

// --- Component Definition ---
const MainCategoryBulkActions = ({
  table,
  onDelete,
  onDeactivate,
  onActivate,
}) => {
  if (!table) return null;

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);
  const numSelected = selectedIds.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          Actions ({numSelected}) <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* -- Green Activate Button -- */}
        <DropdownMenuItem
          className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer"
          onClick={() => {
            onActivate(selectedIds);
            table.resetRowSelection();
          }}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Activate Selected
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-amber-600 focus:text-amber-700 focus:bg-amber-50 cursor-pointer"
          onClick={() => {
            onDeactivate(selectedIds);
            table.resetRowSelection();
          }}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Deactivate Selected
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
          onClick={() => {
            onDelete(selectedIds);
            table.resetRowSelection();
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function MainCategoryPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [MainCategories, setMainCategories] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasPermission } = usePermission();

  const canCreate = hasPermission("Main Category Create");
  const canEdit = hasPermission("Main Category Edit");
  const canDelete = hasPermission("Main Category Delete");
  const canToggleStatus = hasPermission("Main Category Status");

  // 1. Safe Auth Check
  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  // 2. Data Fetching
  const fetchMainCategories = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();

      if (data.status === "success") {
        setMainCategories(data.data.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchMainCategories();
    }
  }, [status, fetchMainCategories]);

  // 3. Dialog Handlers
  const handleAddClick = useCallback(() => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  }, []);

  const handleDialogSuccess = useCallback(() => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    fetchMainCategories();
  }, [fetchMainCategories]);

  const handleDialogClose = useCallback((open) => {
    setIsDialogOpen(open);
    if (!open) setEditingCategory(null);
  }, []);

  // 4. Action Handlers
  const handleDelete = useCallback(
    async (ids) => {
      const idsToDelete = Array.isArray(ids) ? ids : [ids];
      toast.promise(
        Promise.all(
          idsToDelete.map((id) =>
            fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/${id}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session?.accessToken}` },
              }
            )
          )
        ),
        {
          loading: "Deleting...",
          success: () => {
            fetchMainCategories();
            return "Main Category(s) deleted successfully!";
          },
          error: "Failed to delete.",
        }
      );
    },
    [session?.accessToken, fetchMainCategories]
  );

  const handleToggleStatus = useCallback(
    async (main_category) => {
      const action = main_category.is_active ? "deactivate" : "activate";
      toast.promise(
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/${main_category.id}/${action}`,
          {
            method: "PATCH",
            headers: { Authorization: `Bearer ${session?.accessToken}` },
          }
        ),
        {
          loading: `${action === "activate" ? "Activating" : "Suspending"}...`,
          success: () => {
            fetchMainCategories();
            return `Main Category ${main_category.name} ${action}d successfully!`;
          },
          error: "Action failed.",
        }
      );
    },
    [session?.accessToken, fetchMainCategories]
  );

  const handleBulkDeactivate = useCallback(
    async (ids) => {
      toast.promise(
        Promise.all(
          ids.map((id) =>
            fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/${id}/deactivate`,
              {
                method: "PATCH",
                headers: { Authorization: `Bearer ${session?.accessToken}` },
              }
            )
          )
        ),
        {
          loading: "Deactivating...",
          success: () => {
            fetchMainCategories();
            return "Main Category(s) deactivated successfully!";
          },
          error: "Action failed.",
        }
      );
    },
    [session?.accessToken, fetchMainCategories]
  );

  // --- NEW: Bulk Activate Handler ---
  const handleBulkActivate = useCallback(
    async (ids) => {
      toast.promise(
        Promise.all(
          ids.map((id) =>
            fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/${id}/activate`,
              {
                method: "PATCH",
                headers: { Authorization: `Bearer ${session?.accessToken}` },
              }
            )
          )
        ),
        {
          loading: "Activating...",
          success: () => {
            fetchMainCategories();
            return "Main Category(s) activated successfully!";
          },
          error: "Action failed.",
        }
      );
    },
    [session?.accessToken, fetchMainCategories]
  );

  // 5. Memoized Configurations
  const columns = useMemo(
    () =>
      getMainCategoryColumns({
        onDelete: handleDelete,
        onToggleStatus: handleToggleStatus,
        onEdit: handleEditClick,
        canEdit,
        canDelete,
        canToggleStatus,
      }),
    [
      handleDelete,
      handleToggleStatus,
      handleEditClick,
      canEdit,
      canDelete,
      canToggleStatus,
    ]
  );

  const bulkActionsComponent = useMemo(
    () => (
      <MainCategoryBulkActions
        onDelete={handleDelete}
        onDeactivate={handleBulkDeactivate}
        onActivate={handleBulkActivate} // Pass the new handler
      />
    ),
    [handleDelete, handleBulkDeactivate, handleBulkActivate]
  );

  return (
    <div className="relative min-h-screen w-full bg-gray-50">
      {/* --- Ambient Background --- */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-white">
        <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute bottom-0 left-0 z-[-2] h-[500px] w-[500px] rounded-full bg-purple-100/50 blur-[100px]"></div>
        <div className="absolute bottom-0 right-0 z-[-2] h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-[100px]"></div>
      </div>

      <ResourceManagementLayout
        data={MainCategories}
        columns={columns}
        isLoading={loading || status === "loading"}
        isError={!!error}
        errorMessage={error}
        onRetry={fetchMainCategories}
        headerTitle={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Main Category Management
              </h1>
              <p className="text-gray-600 text-sm font-medium">
                Manage your Main categories
              </p>
            </div>
          </div>
        }
        addButtonLabel="Add Main Category"
        onAddClick={canCreate ? handleAddClick : null}
        isAdding={isNavigating}
        bulkActionsComponent={bulkActionsComponent}
        searchColumn="name"
        searchPlaceholder="Filter main category by name..."
        loadingSkeleton={<OrganizationPageSkeleton />}
      />
      <MainCategoryDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onSuccess={handleDialogSuccess}
        session={session}
        initialData={editingCategory}
      />
    </div>
  );
}
