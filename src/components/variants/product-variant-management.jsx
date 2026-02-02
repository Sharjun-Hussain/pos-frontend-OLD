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
} from "lucide-react";

// Custom Components & Hooks
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { usePermission } from "@/hooks/use-permission";
import { getProductVariantColumns } from "./product-variant-column";
import ProductSkeleton from "@/app/skeletons/product-listing-page-skeleton";

// ----------------------------------------------------------------------
// 1. Helper: Page Header
// ----------------------------------------------------------------------
const HeaderContent = () => (
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg bg-primary-100">
      <Layers className="w-6 h-6 text-primary-600" />
    </div>
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Product Variants</h1>
      <p className="text-gray-600 text-sm font-medium">
        Manage variant attributes, SKUs, pricing, and specific stock levels.
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
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Products" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center text-muted-foreground">
              <Package className="mr-2 h-4 w-4" /> All Products
            </div>
          </SelectItem>
          {uniqueProducts.map((productName) => (
            <SelectItem key={productName} value={productName}>
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
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="true">
            <div className="flex items-center text-emerald-600">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Active
            </div>
          </SelectItem>
          <SelectItem value="false">
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

  const canCreate = hasPermission("Product Variant Create");
  const canEdit = hasPermission("Product Variant Edit");
  const canDelete = hasPermission("Product Variant Delete");
  const canToggleStatus = hasPermission("Product Variant Status");

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
    <div className="relative min-h-screen w-full bg-gray-50">
      <div className="fixed inset-0 -z-10 h-full w-full bg-white">
        <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
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
