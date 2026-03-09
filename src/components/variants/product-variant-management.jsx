"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// UI Components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Icons
import {
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronDown,
  Layers,
  Package,
  Boxes
} from "lucide-react";

// Custom Components & Hooks
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { usePermission } from "@/hooks/use-permission";
import { getProductVariantColumns } from "./product-variant-column";
import ProductSkeleton from "@/app/skeletons/products/product-listing-skeleton";
import { PERMISSIONS } from "@/lib/permissions";

// ----------------------------------------------------------------------
// 1. Helper: Page Header
// ----------------------------------------------------------------------
const HeaderContent = () => (
  <div className="flex items-center gap-4">
    <div className="p-2 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20">
      <Boxes className="w-4.5 h-4.5 text-[#10b981]" />
    </div>
    <div className="flex flex-col">
      <h1 className="text-xl font-semibold text-foreground tracking-tight">
        Product Variants
      </h1>
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] opacity-80">
        Attribute & Stock Management
      </p>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// 2. Component: Variant Filters
// ----------------------------------------------------------------------
const VariantFilters = ({ table }) => {
  const uniqueProducts = useMemo(() => {
    const products = new Set();
    table.getPreFilteredRowModel().rows.forEach((row) => {
      const name = row.getValue("parent_product_name");
      if (name) products.add(name);
    });
    return Array.from(products).sort();
  }, [table.getPreFilteredRowModel().rows]);

  return (
    <>
      <Select
        value={
          table.getColumn("parent_product_name")?.getFilterValue() ?? "all"
        }
        onValueChange={(value) => {
          table
            .getColumn("parent_product_name")
            ?.setFilterValue(value === "all" ? undefined : value);
        }}
      >
        <SelectTrigger className="w-[220px] h-10 bg-background/50 border-border/60 rounded-xl focus:ring-emerald-500/20 text-xs font-semibold">
          <SelectValue placeholder="All Products" />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-border shadow-2xl">
          <SelectItem value="all" className="rounded-lg text-xs">
            <div className="flex items-center text-muted-foreground">
              <Package className="mr-2 h-4 w-4" /> All Products
            </div>
          </SelectItem>
          {uniqueProducts.map((productName) => (
            <SelectItem key={productName} value={productName} className="rounded-lg text-xs">
              {productName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={table.getColumn("is_active")?.getFilterValue() ?? "all"}
        onValueChange={(value) => {
          if (value === "all") {
            table.getColumn("is_active")?.setFilterValue(undefined);
          } else {
            table.getColumn("is_active")?.setFilterValue(value === "true");
          }
        }}
      >
        <SelectTrigger className="w-[180px] h-10 bg-background/50 border-border/60 rounded-xl focus:ring-emerald-500/20 text-xs font-semibold">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-border shadow-2xl">
          <SelectItem value="all" className="rounded-lg text-xs">All Status</SelectItem>
          <SelectItem value="true" className="rounded-lg text-xs">
            <div className="flex items-center text-emerald-600">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Active
            </div>
          </SelectItem>
          <SelectItem value="false" className="rounded-lg text-xs">
            <div className="flex items-center text-red-500">
              <XCircle className="mr-2 h-4 w-4" /> Inactive
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </>
  );
};

// ----------------------------------------------------------------------
// 3. Component: Bulk Actions
// ----------------------------------------------------------------------
const VariantBulkActions = ({ table, onDelete, onDeactivate, onActivate }) => {
  if (!table) return null;

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  // We extract IDs here to pass to handlers
  const selectedIds = selectedRows.map((row) => row.original.id);
  const numSelected = selectedIds.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto h-10 px-4 rounded-xl border-border/60 bg-background/50 hover:bg-muted font-bold uppercase text-[10px] tracking-widest transition-all">
          Actions ({numSelected}) <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl border-border shadow-2xl">
        <DropdownMenuItem
          className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-500/10 cursor-pointer rounded-lg m-1"
          onClick={() => {
            onActivate(selectedIds);
            table.resetRowSelection();
          }}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Activate Selected
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-amber-600 focus:text-amber-700 focus:bg-amber-500/10 cursor-pointer rounded-lg m-1"
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
          className="text-red-600 focus:text-red-700 focus:bg-red-500/10 cursor-pointer rounded-lg m-1"
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

// ----------------------------------------------------------------------
// 4. Main Page Component
// ----------------------------------------------------------------------
export default function ProductVariantsPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasPermission } = usePermission();

  const canCreate = hasPermission(PERMISSIONS.PRODUCT_CREATE);
  const canEdit = hasPermission(PERMISSIONS.PRODUCT_EDIT);
  const canDelete = hasPermission(PERMISSIONS.PRODUCT_DELETE);
  const canToggleStatus = hasPermission(PERMISSIONS.PRODUCT_EDIT);

  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  const fetchVariants = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/active/list`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch variants");
      const data = await response.json();

      if (data.status === "success") {
        const flattenedVariants = data.data.flatMap((product) =>
          product.variants.map((variant) => {
            const searchText = [
              variant.sku,
              variant.code,
              variant.barcode,
              product.name,
              ...(variant.attribute_values?.map(av => av.value) || [])
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return {
              ...variant,
              parent_product_name: product.name,
              // API likely returns product_id inside variant,
              // but we ensure it's available here from the parent scope just in case
              product_id: variant.product_id || product.id,
              search_text: searchText,
            };
          })
        );
        setVariants(flattenedVariants);
      } else {
        throw new Error(data.message || "Failed to fetch variants");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchVariants();
    }
  }, [status, fetchVariants]);

  // --- ACTIONS HANDLER ---
  // This helper now resolves IDs to full variant objects to get the product_id
  const performApiAction = async (
    input,
    urlFn,
    method,
    loadingMsg,
    successMsg
  ) => {
    const inputs = Array.isArray(input) ? input : [input];

    // Map inputs (which might be IDs or Objects) to actual Variant Objects
    const targets = inputs
      .map((item) => {
        // If it's already an object with an ID, use it
        if (typeof item === "object" && item !== null && "id" in item)
          return item;
        // If it's an ID (string/number), find it in the state
        return variants.find((v) => v.id === item);
      })
      .filter(Boolean); // Remove any undefined results

    if (targets.length === 0) {
      toast.error("No valid variants selected.");
      return;
    }

    toast.promise(
      Promise.all(
        targets.map((variant) =>
          fetch(urlFn(variant), {
            // Pass the whole variant object to the URL generator
            method,
            headers: { Authorization: `Bearer ${session?.accessToken}` },
          })
        )
      ),
      {
        loading: loadingMsg,
        success: () => {
          fetchVariants();
          return successMsg;
        },
        error: "Action failed.",
      }
    );
  };

  // --- URL GENERATORS (Updated to your required format) ---

  // Format: api/v1/products/{productid}/variants/{variantid}
  const handleDelete = (input) =>
    performApiAction(
      input,
      (variant) =>
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${variant.product_id}/variants/${variant.id}`,
      "DELETE",
      "Deleting variants...",
      "Variants deleted successfully!"
    );

  const handleBulkDeactivate = (input) =>
    performApiAction(
      input,
      (variant) =>
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${variant.product_id}/variants/${variant.id}/deactivate`,
      "PATCH",
      "Deactivating variants...",
      "Variants deactivated successfully!"
    );

  const handleBulkActivate = (input) =>
    performApiAction(
      input,
      (variant) =>
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${variant.product_id}/variants/${variant.id}/activate`,
      "PATCH",
      "Activating variants...",
      "Variants activated successfully!"
    );

  const handleToggleStatus = (variant) => {
    const action = variant.is_active ? "deactivate" : "activate";
    performApiAction(
      variant,
      (v) =>
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${v.product_id}/variants/${v.id}/${action}`,
      "PATCH",
      `${action === "activate" ? "Activating" : "Suspending"}...`,
      `Variant ${action}d successfully!`
    );
  };

  const handleAddClick = () => {
    setIsNavigating(true);
    router.push("/variants/new");
  };

  const handleEditClick = (variant) => {
    setIsNavigating(true);
    router.push(`/variants/${variant.id}/edit`);
  };

  const columns = useMemo(
    () =>
      getProductVariantColumns({
        onDelete: handleDelete,
        onToggleStatus: handleToggleStatus,
        onEdit: handleEditClick,
        canEdit,
        canDelete,
        canToggleStatus,
      }),
    [canEdit, canDelete, canToggleStatus, variants] // Added variants to dep array to ensure closure freshness
  );

  const bulkActionsComponent = useMemo(
    () => (
      <VariantBulkActions
        onDelete={handleDelete}
        onDeactivate={handleBulkDeactivate}
        onActivate={handleBulkActivate}
        table={null}
      />
    ),
    [handleDelete, handleBulkDeactivate, handleBulkActivate]
  );

  return (
    <div className="relative min-h-screen w-full bg-background">
      <div className="fixed inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.05),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.1),rgba(0,0,0,0))]"></div>
      </div>

      <ResourceManagementLayout
        data={variants}
        isLoading={loading || status === "loading"}
        loadingSkeleton={<ProductSkeleton />}
        isError={!!error}
        errorMessage={error}
        onRetry={fetchVariants}
        headerTitle={<HeaderContent />}
        addButtonLabel="Add Variant"
        onAddClick={canCreate ? handleAddClick : null}
        isAdding={isNavigating}
        bulkActionsComponent={bulkActionsComponent}
        columns={columns}
        searchColumn="search_text"
        searchPlaceholder="Search by SKU, Name, Code..."
        filterComponents={(table) => <VariantFilters table={table} />}
      />
    </div>
  );
}
