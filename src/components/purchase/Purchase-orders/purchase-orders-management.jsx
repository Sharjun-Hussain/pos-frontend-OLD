"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  PlusCircle,
  Search,
  Download,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/general/data-table";
import { getColumns } from "./columns";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";

// --- Components for Toolbar ---

const POBulkActions = ({ table, onBulkDelete }) => {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);
  const numSelected = selectedIds.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          Actions ({numSelected})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => console.log("Exporting", selectedIds)}>
            Export Selected
        </DropdownMenuItem>
        <DropdownMenuItem 
            className="text-red-600 focus:text-red-600 cursor-pointer"
            onClick={() => onBulkDelete(selectedIds)}
        >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const POTableToolbar = ({ table, onBulkDelete }) => {
  const isFiltered = table.getState().columnFilters.length > 0;
  const numSelected = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex items-center justify-between space-x-2 mb-4">
      <div className="flex flex-1 items-center space-x-2">
        {/* Search by PO Number */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by PO Number..."
            value={table.getColumn("po_number")?.getFilterValue() ?? ""}
            onChange={(event) =>
              table.getColumn("po_number")?.setFilterValue(event.target.value)
            }
            className="pl-8 h-9"
          />
        </div>

        {/* Filter by Status */}
        <Select
          value={table.getColumn("status")?.getFilterValue() ?? "all"}
          onValueChange={(value) => {
            table
              .getColumn("status")
              ?.setFilterValue(value === "all" ? undefined : value);
          }}
        >
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <AlertCircle className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {numSelected > 0 && canDelete(MODULES.PURCHASE) && <POBulkActions table={table} onBulkDelete={onBulkDelete} />}
    </div>
  );
};

// --- Main Page Component ---

export default function PurchaseOrderPage() {
  const { data: session } = useSession();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { PURCHASE } = MODULES;

  // Table State
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

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

      if (!response.ok) {
        throw new Error("Failed to fetch purchase orders");
      }

      const result = await response.json();

      if (result.status === "success") {
        const orders = Array.isArray(result.data)
          ? result.data
          : result.data?.data || [];
        setData(orders);
      } else {
        throw new Error(result.message || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (session) {
      fetchPurchaseOrders();
    }
  }, [session, fetchPurchaseOrders]);

  // --- Actions ---

  const handleDelete = useCallback(async (id) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    toast.promise(
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session?.accessToken}` },
        }).then(async (res) => {
            if (!res.ok) throw new Error("Failed to delete");
            return res.json();
        }),
        {
            loading: "Deleting order...",
            success: () => {
                fetchPurchaseOrders();
                return "Order deleted successfully";
            },
            error: "Failed to delete order",
        }
    );
  }, [session, fetchPurchaseOrders]);

  const handleBulkDelete = useCallback(async (ids) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} orders?`)) return;

    toast.promise(
        Promise.all(
            ids.map(id => 
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${session?.accessToken}` },
                })
            )
        ),
        {
            loading: "Deleting orders...",
            success: () => {
                setRowSelection({});
                fetchPurchaseOrders();
                return "Orders deleted successfully";
            },
            error: "Failed to delete some orders",
        }
    );
  }, [session, fetchPurchaseOrders]);

  const columns = useMemo(() => getColumns({ 
    onDelete: canDelete(PURCHASE) ? handleDelete : null,
    canEdit: canUpdate(PURCHASE)
  }), [handleDelete, canDelete, canUpdate, PURCHASE]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <div className="h-full flex-1 flex-col space-y-6 px-6 pb-6 pt-3 flex">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage your procurement and supplier orders.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          {canCreate(PURCHASE) && (
            <Link href="/purchase/purchase-orders/create">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Create Purchase Order
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Orders List</CardTitle>
          <CardDescription>
            View and manage all purchase orders in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex h-64 flex-col items-center justify-center text-red-500 space-y-2">
              <AlertCircle className="h-8 w-8" />
              <p>{error}</p>
              <Button variant="outline" onClick={fetchPurchaseOrders}>
                Retry
              </Button>
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground space-y-2 border-2 border-dashed rounded-lg">
              <FileSpreadsheet className="h-10 w-10 opacity-50" />
              <p>No purchase orders found.</p>
              {canCreate(PURCHASE) && (
                <Link href="/purchase/purchase-orders/create">
                  <Button variant="link">Create your first order</Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <POTableToolbar table={table} onBulkDelete={handleBulkDelete} />
              <DataTable table={table} columns={columns} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}