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
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  RotateCcw,
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
import { DataTable } from "@/components/general/data-table";
import { getColumns } from "./columns";

const ReturnTableToolbar = ({ table }) => {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between space-x-2 mb-4">
      <div className="flex flex-1 items-center space-x-2">
        {/* Search by Return Number */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by Return #..."
            value={table.getColumn("return_number")?.getFilterValue() ?? ""}
            onChange={(event) =>
              table.getColumn("return_number")?.setFilterValue(event.target.value)
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
            <SelectItem value="completed">Completed</SelectItem>
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
    </div>
  );
};

export default function ReturnList() {
  const { data: session } = useSession();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Table State
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  const fetchReturns = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-returns`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch purchase returns");
      }

      const result = await response.json();

      if (result.status === "success") {
        const returns = Array.isArray(result.data)
          ? result.data
          : result.data?.data || [];
        setData(returns);
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
      fetchReturns();
    }
  }, [session, fetchReturns]);

  const columns = useMemo(() => getColumns(), []);

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
      {/* ── Premium Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <RotateCcw className="w-4.5 h-4.5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Purchase Returns</h1>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] opacity-80">
              Supplier Returns · Refunds · Adjustments
            </p>
          </div>
        </div>
        <Link href="/purchase/returns/create">
          <Button size="sm" className="gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20">
            <PlusCircle className="h-4 w-4" />
            Create Return
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <Card className="border border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Returns List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : error ? (
            <div className="flex h-64 flex-col items-center justify-center text-destructive space-y-2">
              <AlertCircle className="h-8 w-8" />
              <p>{error}</p>
              <Button variant="outline" onClick={fetchReturns}>Retry</Button>
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground space-y-2 border-2 border-dashed border-border/40 rounded-xl">
              <RotateCcw className="h-10 w-10 text-emerald-500/40" />
              <p className="font-medium">No returns found.</p>
              <Link href="/purchase/returns/create">
                <Button variant="link" className="text-emerald-500">Create your first return</Button>
              </Link>
            </div>
          ) : (
            <>
              <ReturnTableToolbar table={table} />
              <DataTable table={table} columns={columns} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
