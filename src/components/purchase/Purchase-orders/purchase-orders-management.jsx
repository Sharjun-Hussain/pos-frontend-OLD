"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileSpreadsheet, ChevronDown, Trash2 } from "lucide-react";
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
import { getColumns } from "./columns";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import PurchaseOrdersSkeleton from "@/app/skeletons/purchases/purchase-orders-skeleton";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";

// ── Header ──────────────────────────────────────────────────────────────────
const POHeaderContent = () => (
  <div className="flex items-center gap-4">
    <div className="p-2 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20">
      <FileSpreadsheet className="w-4.5 h-4.5 text-[#10b981]" />
    </div>
    <div className="flex flex-col">
      <h1 className="text-xl font-semibold text-foreground tracking-tight">
        Purchase Orders
      </h1>
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] opacity-80">
        Procurement &amp; Supplier Orders
      </p>
    </div>
  </div>
);

// ── Status Filter ────────────────────────────────────────────────────────────
const POFilters = ({ table }) => (
  <Select
    value={String(table.getColumn("status")?.getFilterValue() ?? "all")}
    onValueChange={(value) => {
      table
        .getColumn("status")
        ?.setFilterValue(value === "all" ? undefined : value);
    }}
  >
    <SelectTrigger className="w-[160px]">
      <SelectValue placeholder="All Statuses" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Statuses</SelectItem>
      <SelectItem value="pending">Pending</SelectItem>
      <SelectItem value="approved">Approved</SelectItem>
      <SelectItem value="received">Received</SelectItem>
      <SelectItem value="cancelled">Cancelled</SelectItem>
    </SelectContent>
  </Select>
);

// ── Bulk Actions ─────────────────────────────────────────────────────────────
const POBulkActions = ({ table, onDelete }) => {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);
  const numSelected = selectedIds.length;

  const handleDelete = () => {
    onDelete(selectedIds);
    table.resetRowSelection();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          Actions ({numSelected}) <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function PurchaseOrderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { PURCHASE } = MODULES;

  const fetchPurchaseOrders = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch purchase orders");
      const result = await response.json();
      if (result.status === "success") {
        const data = Array.isArray(result.data)
          ? result.data
          : result.data?.data || [];
        setOrders(data);
      } else {
        throw new Error(result.message || "Something went wrong");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?return_url=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchPurchaseOrders();
  }, [status, fetchPurchaseOrders]);

  const handleDelete = useCallback(async (ids) => {
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session?.accessToken}` },
          })
        )
      ),
      {
        loading: "Deleting...",
        success: () => {
          fetchPurchaseOrders();
          return "Order(s) deleted successfully!";
        },
        error: "Failed to delete.",
      }
    );
  }, [session, fetchPurchaseOrders]);

  const columns = useMemo(
    () =>
      getColumns({
        onDelete: canDelete(PURCHASE) ? handleDelete : null,
        canEdit: canUpdate(PURCHASE),
      }),
    [handleDelete, canDelete, canUpdate, PURCHASE]
  );

  return (
    <ResourceManagementLayout
      data={orders}
      columns={columns}
      isLoading={loading || status === "loading"}
      isError={!!error}
      errorMessage={error}
      onRetry={fetchPurchaseOrders}
      headerTitle={<POHeaderContent />}
      addButtonLabel="Create Purchase Order"
      onAddClick={canCreate(PURCHASE) ? () => {
        setIsNavigating(true);
        router.push("/purchase/purchase-orders/create");
      } : null}
      isAdding={isNavigating}
      onExportClick={() => console.log("Export clicked")}
      bulkActionsComponent={
        canDelete(PURCHASE) ? (
          <POBulkActions onDelete={handleDelete} />
        ) : null
      }
      searchColumn="po_number"
      searchPlaceholder="Filter by PO number..."
      loadingSkeleton={<PurchaseOrdersSkeleton />}
      filterComponents={(table) => <POFilters table={table} />}
    />
  );
}