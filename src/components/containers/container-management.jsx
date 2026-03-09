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
import ContainerSkeleton from "@/app/skeletons/catalog/container-skeleton";
import { ResourceManagementLayout } from "../general/resource-management-layout";
import { getContainerColumns } from "./container-column";
import { ContainerDialog } from "./container-dialog";
import { CheckCircle2, XCircle, Trash2, ChevronDown, Package } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";

// --- FIX 1: Component defined outside with safety check ---
const ContainerBulkActions = ({ table, onDelete, onDeactivate, onActivate }) => {
  // Guard clause: prevents crashes if table isn't ready
  if (!table) return null;

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);
  const numSelected = selectedIds.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto font-bold border-border bg-background hover:bg-muted text-foreground">
          Actions ({numSelected}) <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card border-border/60">
        <DropdownMenuItem
          className="text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10 cursor-pointer font-bold"
          onClick={() => {
            onActivate(selectedIds);
            table.resetRowSelection();
          }}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Activate Selected
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-amber-500 focus:text-amber-500 focus:bg-amber-500/10 cursor-pointer font-bold"
          onClick={() => {
            onDeactivate(selectedIds);
            table.resetRowSelection();
          }}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Deactivate Selected
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border/50" />

        <DropdownMenuItem
          className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer font-bold"
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

export default function ContainerPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [containers, setContainers] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { UNIT } = MODULES;

  // 1. Auth Check
  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  // 2. Data Fetching (Wrapped in useCallback)
  const fetchContainers = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/containers`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      if (data.status === "success") {
        setContainers(data.data.data || []);
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
      fetchContainers();
    }
  }, [status, fetchContainers]);

  // 3. Handlers (Wrapped in useCallback)
  const handleAddClick = useCallback(() => {
    setEditingContainer(null);
    setIsDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((container) => {
    setEditingContainer(container);
    setIsDialogOpen(true);
  }, []);

  const handleDialogSuccess = useCallback(() => {
    setIsDialogOpen(false);
    setEditingContainer(null);
    fetchContainers();
  }, [fetchContainers]);

  // --- FIX 2: Correct Dialog Closing Logic ---
  const handleDialogClose = useCallback((open) => {
    setIsDialogOpen(open);
    if (!open) setEditingContainer(null);
  }, []);

  const handleDelete = useCallback(async (ids) => {
    const isBulk = Array.isArray(ids);
    const idsToDelete = isBulk ? ids : [ids];

    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/containers/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
        )
      ),
      {
        loading: "Deleting...",
        success: () => {
          fetchContainers();
          return "Container(s) deleted successfully!";
        },
        error: "Failed to delete.",
      }
    );
  }, [session, fetchContainers]);

  const handleToggleStatus = useCallback(async (container) => {
    const action = container.is_active ? "deactivate" : "activate";
    toast.promise(
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/containers/${container.id}/${action}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      ),
      {
        loading: `${action === "activate" ? "Activating" : "Deactivating"}...`,
        success: () => {
          fetchContainers();
          return `Container ${container.name} ${action}d successfully!`;
        },
        error: "Action failed.",
      }
    );
  }, [session, fetchContainers]);

  const handleBulkDeactivate = useCallback(async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/containers/${id}/deactivate`,
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
          fetchContainers();
          return "Container(s) deactivated successfully!";
        },
        error: "Action failed.",
      }
    );
  }, [session, fetchContainers]);

  const handleBulkActivate = useCallback(async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/containers/${id}/activate`,
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
          fetchContainers();
          return "Container(s) activated successfully!";
        },
        error: "Action failed.",
      }
    );
  }, [session, fetchContainers]);

  // --- FIX 3: Memoize Columns ---
  const columns = useMemo(() => getContainerColumns({
    onDelete: canDelete(UNIT) ? handleDelete : null,
    onToggleStatus: canUpdate(UNIT) ? handleToggleStatus : null,
    onEdit: canUpdate(UNIT) ? handleEditClick : null,
  }), [handleDelete, handleToggleStatus, handleEditClick, canDelete, canUpdate, UNIT]);

  // --- FIX 4: Memoize Bulk Actions Component ---
  // This prevents the infinite loop/freeze
  const bulkActionsComponent = useMemo(() => (
    canDelete(UNIT) ? (
      <ContainerBulkActions
        onDelete={handleDelete}
        onDeactivate={handleBulkDeactivate}
        onActivate={handleBulkActivate}
      />
    ) : null
  ), [handleDelete, handleBulkDeactivate, handleBulkActivate, canDelete, UNIT]);

  return (
    <>
      <ResourceManagementLayout
        data={containers}
        columns={columns}
        isLoading={loading || status === "loading"}
        isError={!!error}
        errorMessage={error}
        onRetry={fetchContainers}
        headerTitle={
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e6f7f0] dark:bg-emerald-500/10 text-[#00b076] dark:text-emerald-500">
                    <Package className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-foreground tracking-tight">
                        Container Management
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wider mt-0.5">
                        MANAGE CONTAINERS & CAPACITY
                    </p>
                </div>
            </div>
        }
        addButtonLabel="Add Container"
        onAddClick={canCreate(UNIT) ? handleAddClick : null}
        isAdding={isNavigating}
        onExportClick={() => console.log("Export clicked")}
        bulkActionsComponent={bulkActionsComponent} // Use the memoized variable
        searchColumn="name"
        searchPlaceholder="Filter containers by name..."
        loadingSkeleton={<ContainerSkeleton />}
      />
      <ContainerDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose} // Use fixed handler
        onSuccess={handleDialogSuccess}
        session={session}
        initialData={editingContainer}
      />
    </>
  );
}