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
import ProductSkeleton from "@/app/skeletons/products/product-listing-skeleton";
import { ResourceManagementLayout } from "../general/resource-management-layout";
import { getBrandColumns } from "./brand-column";
import { BrandDialog } from "./brand-dialog";
import { usePermission } from "@/hooks/use-permission";
import { CheckCircle2, XCircle, Trash2, ChevronDown, LayoutGrid, Tag } from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

// --- 2. HELPER COMPONENTS ---
const HeaderContent = () => (
  <div className="flex items-center gap-4">
    <div className="p-2 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20">
      <Tag className="w-4.5 h-4.5 text-[#10b981]" />
    </div>
    <div className="flex flex-col">
      <h1 className="text-xl font-semibold text-foreground tracking-tight">
        Brand Directory
      </h1>
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] opacity-80">
        Manufacturer & Label Governance
      </p>
    </div>
  </div>
);

// --- 2. RENAMED COMPONENT ---
const BrandBulkActions = ({ table, onDelete, onDeactivate, onActivate }) => {
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

// --- 3. RENAMED MAIN PAGE COMPONENT ---
export default function BrandPage() {
  // --- 4. RENAMED STATE VARIABLES ---
  const [brands, setBrands] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasPermission } = usePermission();

  // Permissions
  const canCreate = hasPermission(PERMISSIONS.BRAND_CREATE);
  const canEdit = hasPermission(PERMISSIONS.BRAND_EDIT);
  const canDelete = hasPermission(PERMISSIONS.BRAND_DELETE);
  const canToggleStatus = hasPermission(PERMISSIONS.BRAND_EDIT);

  // Auth logic (remains the same)
  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  // --- 5. UPDATED FETCH LOGIC ---
  const fetchBrands = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands`, // Updated endpoint
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      if (data.status === "success") {
        setBrands(data.data.data || []); // Updated state
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
      fetchBrands(); // Updated function call
    }
  }, [status, fetchBrands]);

  // --- 6. UPDATED DIALOG HANDLERS ---
  const handleAddClick = useCallback(() => {
    setEditingBrand(null); // Updated state
    setIsDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((brand) => {
    setEditingBrand(brand); // Updated state
    setIsDialogOpen(true);
  }, []);

  const handleDialogSuccess = useCallback(() => {
    setIsDialogOpen(false);
    setEditingBrand(null); // Updated state
    fetchBrands(); // Updated function call
  }, [fetchBrands]);

  const handleDialogClose = useCallback((open) => {
    setIsDialogOpen(open);
    if (!open) setEditingBrand(null);
  }, []);

  // --- 7. UPDATED API HANDLERS ---
  const handleDelete = useCallback(async (ids) => {
    const isBulk = Array.isArray(ids);
    const idsToDelete = isBulk ? ids : [ids];

    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/${id}`, // Updated endpoint
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
          fetchBrands(); // Updated function call
          return "Brand(s) deleted successfully!"; // Updated text
        },
        error: "Failed to delete.",
      }
    );
  }, [session?.accessToken, fetchBrands]);

  const handleToggleStatus = useCallback(async (brand) => {
    const action = brand.is_active ? "deactivate" : "activate";
    toast.promise(
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/${brand.id}/${action}`, // Updated endpoint
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session?.accessToken}` },
        }
      ),
      {
        loading: `${action === "activate" ? "Activating" : "Suspending"}...`,
        success: () => {
          fetchBrands(); // Updated function call
          return `Brand ${brand.name} ${action}d successfully!`; // Updated text
        },
        error: "Action failed.",
      }
    );
  }, [session?.accessToken, fetchBrands]);

  const handleBulkDeactivate = useCallback(async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/${id}/deactivate`, // Updated endpoint
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
          fetchBrands(); // Updated function call
          return "Brand(s) deactivated successfully!"; // Updated text
        },
        error: "Action failed.",
      }
    );
  }, [session?.accessToken, fetchBrands]);

  const handleBulkActivate = useCallback(async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/${id}/activate`,
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
          fetchBrands();
          return "Brand(s) activated successfully!";
        },
        error: "Action failed.",
      }
    );
  }, [session?.accessToken, fetchBrands]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = brands.length;
    const active = brands.filter(b => b.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [brands]);

  const handleExport = useCallback(() => {
    if (brands.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["ID", "Name", "Slug", "Description", "Status", "Created At"];
    const csvContent = [
      headers.join(","),
      ...brands.map(b => [
        b.id,
        `"${b.name}"`,
        `"${b.slug}"`,
        `"${b.description || ""}"`,
        b.is_active ? "Active" : "Inactive",
        new Date(b.created_at).toLocaleDateString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `brands_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Brands exported successfully!");
  }, [brands]);

  // 7. Get the columns by passing the handlers
  const columns = useMemo(() => getBrandColumns({
    // Updated function call
    onDelete: handleDelete,
    onToggleStatus: handleToggleStatus,
    onEdit: handleEditClick,
    canEdit,
    canDelete,
    canToggleStatus,
  }), [handleDelete, handleToggleStatus, handleEditClick, canEdit, canDelete, canToggleStatus]);

  const bulkActionsComponent = useMemo(() => (
    <BrandBulkActions // Updated component
      onDelete={handleDelete}
      onDeactivate={handleBulkDeactivate}
      onActivate={handleBulkActivate}
    />
  ), [handleDelete, handleBulkDeactivate, handleBulkActivate]);

  return (
    <div className="flex flex-col gap-4">
      
      <ResourceManagementLayout
        data={brands}
        columns={columns}
        isLoading={loading || status === "loading"}
        isError={!!error}
        errorMessage={error}
        onRetry={fetchBrands}
        headerTitle={<HeaderContent />}
        addButtonLabel="New Brand"
        onAddClick={canCreate ? handleAddClick : null}
        isAdding={isDialogOpen}
        onExportClick={handleExport}
        bulkActionsComponent={bulkActionsComponent}
        searchColumn="name"
        searchPlaceholder="Filter brands by name..."
        loadingSkeleton={<ProductSkeleton />}
      />
      {/* --- 9. UPDATED DIALOG COMPONENT --- */}
      <BrandDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onSuccess={handleDialogSuccess}
        session={session}
        initialData={editingBrand} // Updated state
      />
    </div>
  );
}
