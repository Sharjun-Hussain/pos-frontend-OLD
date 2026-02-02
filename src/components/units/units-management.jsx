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
import { UnitDialog } from "./units-dialog";
import { getUnitColumns } from "./units-column";
import { CheckCircle2, XCircle, Trash2, ChevronDown } from "lucide-react";

// --- FIX 1: Component defined outside with safety check ---
const UnitBulkActions = ({ table, onDelete, onDeactivate, onActivate }) => {
  // Guard clause: prevents crashes if table isn't ready
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

export default function UnitsPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [units, setUnits] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  // 1. Auth Check
  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  // 2. Data Fetching (Wrapped in useCallback)
  const fetchUnits = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/units`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      if (data.status === "success") {
        setUnits(data.data.data || []);
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
      fetchUnits();
    }
  }, [status, fetchUnits]);

  // 3. Handlers (Wrapped in useCallback)
  const handleAddClick = useCallback(() => {
    setEditingUnit(null);
    setIsDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((unit) => {
    setEditingUnit(unit);
    setIsDialogOpen(true);
  }, []);

  const handleDialogSuccess = useCallback(() => {
    setIsDialogOpen(false);
    setEditingUnit(null);
    fetchUnits();
  }, [fetchUnits]);

  // --- FIX 2: Correct Dialog Closing Logic ---
  const handleDialogClose = useCallback((open) => {
    setIsDialogOpen(open);
    if (!open) setEditingUnit(null);
  }, []);

  const handleDelete = useCallback(async (ids) => {
    const isBulk = Array.isArray(ids);
    const idsToDelete = isBulk ? ids : [ids];

    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/units/${id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${session.accessToken}` },
            }
          )
        )
      ),
      {
        loading: "Deleting...",
        success: () => {
          fetchUnits();
          return "Unit(s) deleted successfully!";
        },
        error: "Failed to delete.",
      }
    );
  }, [session, fetchUnits]);

  const handleToggleStatus = useCallback(async (unit) => {
    const action = unit.is_active ? "deactivate" : "activate";
    toast.promise(
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/units/${unit.id}/${action}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      ),
      {
        loading: `${action === "activate" ? "Activating" : "Suspending"}...`,
        success: () => {
          fetchUnits();
          return `Unit ${unit.name} ${action}d successfully!`;
        },
        error: "Action failed.",
      }
    );
  }, [session, fetchUnits]);

  const handleBulkDeactivate = useCallback(async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/units/${id}/deactivate`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${session.accessToken}` },
            }
          )
        )
      ),
      {
        loading: "Deactivating...",
        success: () => {
          fetchUnits();
          return "Unit(s) deactivated successfully!";
        },
        error: "Action failed.",
      }
    );
  }, [session, fetchUnits]);

  const handleBulkActivate = useCallback(async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/units/${id}/activate`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${session.accessToken}` },
            }
          )
        )
      ),
      {
        loading: "Activating...",
        success: () => {
          fetchUnits();
          return "Unit(s) activated successfully!";
        },
        error: "Action failed.",
      }
    );
  }, [session, fetchUnits]);

  // --- FIX 3: Memoize Columns ---
  const columns = useMemo(() => getUnitColumns({
    onDelete: handleDelete,
    onToggleStatus: handleToggleStatus,
    onEdit: handleEditClick,
  }), [handleDelete, handleToggleStatus, handleEditClick]);

  // --- FIX 4: Memoize Bulk Actions Component ---
  // This prevents the infinite loop/freeze
  const bulkActionsComponent = useMemo(() => (
    <UnitBulkActions
      onDelete={handleDelete}
      onDeactivate={handleBulkDeactivate}
      onActivate={handleBulkActivate}
    />
  ), [handleDelete, handleBulkDeactivate, handleBulkActivate]);

  return (
    <>
      <ResourceManagementLayout
        data={units}
        columns={columns}
        isLoading={loading || status === "loading"}
        isError={!!error}
        errorMessage={error}
        onRetry={fetchUnits}
        headerTitle="Unit Management"
        headerDescription="Manage your units, branches, and settings."
        addButtonLabel="Add Unit"
        onAddClick={handleAddClick}
        isAdding={isNavigating}
        onExportClick={() => console.log("Export clicked")}
        bulkActionsComponent={bulkActionsComponent} // Use the memoized variable
        searchColumn="name"
        searchPlaceholder="Filter unit by name..."
        loadingSkeleton={<OrganizationPageSkeleton />}
      />
      <UnitDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose} // Use fixed handler
        onSuccess={handleDialogSuccess}
        session={session}
        initialData={editingUnit}
      />
    </>
  );
}