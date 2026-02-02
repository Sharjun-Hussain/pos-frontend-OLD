"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import OrganizationPageSkeleton from "@/app/skeletons/Organization-skeleton";
import { ResourceManagementLayout } from "../general/resource-management-layout";
import { getBranchColumns } from "./branches-column";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";

// --- 1. IMPORT YOUR NEW BRANCH COMPONENTS ---
// Renamed from SubCategoryBulkActions
const BranchBulkActions = ({ table, onDelete, onDeactivate }) => {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);
  const numSelected = selectedIds.length;

  const handleDeactivate = () => {
    onDeactivate(selectedIds);
    table.resetRowSelection();
  };

  const handleDelete = () => {
    onDelete(selectedIds);
    table.resetRowSelection();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          Actions ({numSelected})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDeactivate}>
          Deactivate Selected
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-500" onClick={handleDelete}>
          Delete Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermission();

  // Auth logic (remains the same)
  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  // --- 4. UPDATED FETCH LOGIC ---
  const fetchBranches = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        // Updated API endpoint
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/branches`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      if (data.status === "success") {
        setBranches(data?.data?.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchBranches();
    }
  }, [status, session]);

  const handleAddClick = () => {
    setIsNavigating(true);
    router.push("/branches/new");
  };

  const handleEditClick = (branch) => {
    setIsNavigating(true);
    router.push(`/branches/${branch.id}/edit`);
  };

  const handleDelete = async (ids) => {
    const isBulk = Array.isArray(ids);
    const idsToDelete = isBulk ? ids : [ids];

    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
        )
      ),
      {
        loading: "Deleting...",
        success: () => {
          fetchBranches();
          return "Branch(es) deleted successfully!";
        },
        error: "Failed to delete.",
      }
    );
  };

  const handleToggleStatus = async (branch) => {
    const action = branch?.is_active ? "deactivate" : "activate";
    toast.promise(
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/${branch?.id}/${action}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      ),
      {
        loading: `${action === "activate" ? "Activating" : "Suspending"}...`,
        success: () => {
          fetchBranches(); // Updated fetch call
          return `Branch ${branch?.name} ${action}d successfully!`; // Updated text
        },
        error: "Action failed.",
      }
    );
  };

  const handleBulkDeactivate = async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            // Updated API endpoint
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/${id}/deactivate`,
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
          fetchBranches(); // Updated fetch call
          return "Branch(es) deactivated successfully!"; // Updated text
        },
        error: "Action failed.",
      }
    );
  };

  // 7. Get the columns by passing the handlers (with permission checks)
  const columns = getBranchColumns({
    onDelete: canDelete(MODULES.BRANCH) ? handleDelete : null,
    onToggleStatus: canUpdate(MODULES.BRANCH) ? handleToggleStatus : null,
    onEdit: canUpdate(MODULES.BRANCH) ? handleEditClick : null,
  });

  return (
    <>
      <ResourceManagementLayout
        data={branches}
        columns={columns}
        isLoading={loading || status === "loading"}
        isError={!!error}
        errorMessage={error}
        onRetry={fetchBranches}
        headerTitle="Branch Management"
        headerDescription="Manage all organization branches and their settings."
        addButtonLabel="Add Branch"
        // Only show Add button if user has create permission
        onAddClick={canCreate(MODULES.BRANCH) ? handleAddClick : null}
        isAdding={isNavigating}
        onExportClick={() => console.log("Export clicked")}
        bulkActionsComponent={
          canDelete(MODULES.BRANCH) ? (
            <BranchBulkActions
              onDelete={handleDelete}
              onDeactivate={handleBulkDeactivate}
            />
          ) : null
        }
        searchColumn="name"
        searchPlaceholder="Filter branches by name..."
        loadingSkeleton={<OrganizationPageSkeleton />}
      />
    </>
  );
}
