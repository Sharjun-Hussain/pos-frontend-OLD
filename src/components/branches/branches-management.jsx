"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building, MapPin, Search, RefreshCcw, Download, Plus,
  MoreHorizontal, Pencil, Trash2, Loader2, CheckCircle2,
  XCircle, User, Activity, AlertTriangle
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import BranchesPageSkeleton from "@/app/skeletons/Branches-skeleton";
import { getBranchColumns } from "./branches-column";
import { flexRender, getCoreRowModel, useReactTable, getFilteredRowModel } from "@tanstack/react-table";

// Bulk Actions Component
const BranchBulkActions = ({ table, onDelete, onDeactivate, onActivate }) => {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);
  const numSelected = selectedIds.length;

  if (numSelected === 0) return null;

  return (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
      <Badge variant="outline" className="bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 font-black tracking-widest uppercase text-[10px] px-3 py-1">
        {numSelected} Selected
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-[38px] border-border/50 shadow-sm gap-2 hover:bg-muted/30 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all">
            Bulk Actions <MoreHorizontal className="w-3.5 h-3.5 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/40 shadow-xl overflow-hidden p-1">
          <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/20 px-3 py-2 -mx-1 -mt-1 mb-1">
            Apply to Selection
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => { onActivate(selectedIds); table.resetRowSelection(); }} className="text-xs font-bold cursor-pointer text-[#10b981] focus:text-[#10b981] py-2">
            Activate Branches
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { onDeactivate(selectedIds); table.resetRowSelection(); }} className="text-xs font-bold cursor-pointer text-orange-600 focus:text-orange-700 py-2">
            Deactivate Branches
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/30 m-0" />
          <DropdownMenuItem onClick={() => { onDelete(selectedIds); table.resetRowSelection(); }} className="text-xs font-bold cursor-pointer text-red-600 focus:text-red-700 py-2">
            Delete Branches
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
import { Badge } from "@/components/ui/badge";

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermission();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?return_url=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [router, status]);

  const fetchBranches = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch branches");
      const data = await response.json();
      if (data.status === "success") {
        setBranches(data?.data?.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch branches");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchBranches();
  }, [status, session]);

  const handleAddClick = () => router.push("/branches/new");
  const handleEditClick = (branch) => router.push(`/branches/${branch.id}/edit`);

  const handleDelete = async (ids) => {
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    if (!confirm(`Are you sure you want to delete ${idsToDelete.length} branch(es)?`)) return;

    toast.promise(
      Promise.all(idsToDelete.map((id) =>
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        })
      )),
      { loading: "Deleting...", success: () => { fetchBranches(); return "Branch(es) deleted successfully!"; }, error: "Failed to delete branch(es)." }
    );
  };

  const handleToggleStatus = async (branchOrIds, actionOverride = null) => {
    let ids = [];
    let action = actionOverride;

    if (Array.isArray(branchOrIds)) {
      ids = branchOrIds;
    } else {
      ids = [branchOrIds.id];
      action = branchOrIds.is_active ? "deactivate" : "activate";
    }

    if (!action) return;

    toast.promise(
      Promise.all(ids.map((id) =>
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/${id}/${action}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        })
      )),
      { 
        loading: `${action === "activate" ? "Activating" : "Deactivating"}...`, 
        success: () => { fetchBranches(); return `Branch(es) ${action}d successfully!`; }, 
        error: "Action failed." 
      }
    );
  };

  const isSuperAdmin = session?.user?.roles?.includes("Super Admin");

  const columns = useMemo(() => getBranchColumns({
    onDelete: canDelete(MODULES.BRANCH) ? handleDelete : null,
    onToggleStatus: canUpdate(MODULES.BRANCH) ? handleToggleStatus : null,
    onEdit: canUpdate(MODULES.BRANCH) ? handleEditClick : null,
    isSuperAdmin,
  }), [canDelete, canUpdate, isSuperAdmin, session]);

  const table = useReactTable({
    data: branches,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: { rowSelection, globalFilter },
  });

  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.is_active).length;
  const inactiveBranches = totalBranches - activeBranches;
  const mainBranchCount = branches.filter(b => b.is_main).length;

  if (loading && branches.length === 0) {
    return (
      <div className="flex-1 min-h-screen bg-background p-6 md:p-10 space-y-8 pb-32 max-w-[1600px] mx-auto w-full">
        <BranchesPageSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-background p-6 md:p-10 space-y-8 pb-32 max-w-[1600px] mx-auto w-full">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Branch Management</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Settings</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Organization</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Branches</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canDelete(MODULES.BRANCH) && (
            <BranchBulkActions 
                table={table} 
                onDelete={handleDelete} 
                onDeactivate={(ids) => handleToggleStatus(ids, 'deactivate')} 
                onActivate={(ids) => handleToggleStatus(ids, 'activate')} 
            />
          )}
          <Button onClick={() => console.log('Export')} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95">
            <Download className="h-4 w-4" /> Export
          </Button>
          {canCreate(MODULES.BRANCH) && (
            <Button onClick={handleAddClick} className="bg-[#10b981] hover:bg-[#059669] text-white h-10 px-6 font-bold gap-2 rounded-xl transition-all shadow-lg shadow-[#10b981]/20 active:scale-95 border-none text-[10px] uppercase tracking-widest">
              <Plus className="h-4 w-4" /> Add Branch
            </Button>
          )}
        </div>
      </div>

      {/* ─── STAT CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Branches", value: totalBranches, icon: Building, color: "text-[#10b981]", bg: "bg-[#10b981]/10", border: "border-[#10b981]/20" },
          { label: "Active Locations", value: activeBranches, icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "Inactive Branches", value: inactiveBranches, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
          { label: "Main HQ", value: mainBranchCount, icon: MapPin, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative rounded-3xl border-border/10">
            <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 blur-3xl transition-all group-hover:opacity-100 opacity-50", stat.bg)} />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl border shadow-inner group-hover:scale-110 transition-transform duration-500 shrink-0", stat.bg, stat.border, stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70 mb-1 truncate">{stat.label}</p>
                  <h3 className="text-xl font-black text-foreground tabular-nums tracking-tight truncate">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── FILTER BAR ─── */}
      <Card className="border-none shadow-sm bg-card/80 backdrop-blur-md sticky top-4 z-20 border-border/10 rounded-2xl">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Location Search</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#10b981] transition-colors" />
                <Input
                  placeholder="Search by branch name, code, or city..."
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(String(e.target.value))}
                  className="pl-11 h-12 bg-background/50 border-border/50 rounded-xl focus:border-[#10b981] transition-all font-medium text-sm w-full md:max-w-md"
                />
              </div>
            </div>
            <Button onClick={fetchBranches} variant="outline" className="h-12 w-12 rounded-xl bg-background border-border/50 hover:bg-muted/30 text-muted-foreground hover:text-[#10b981] transition-all p-0 shadow-sm shrink-0">
              <RefreshCcw className={cn("h-5 w-5", loading && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── TABLE ─── */}
      <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 backdrop-blur-md">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-border/40">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className={cn("py-4 text-[10px] font-black text-foreground uppercase tracking-widest", header.id === 'select' && "pl-6 w-[50px]")}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="hover:bg-muted/30 group border-border/20 transition-all duration-300">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cn("py-3", cell.column.id === 'select' && "pl-6")}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-border/20">
                  <TableCell colSpan={columns.length} className="h-72 text-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-muted/30 text-muted-foreground/20">
                        <Building className="h-12 w-12" />
                      </div>
                      <div>
                        <h4 className="font-bold text-muted-foreground text-sm uppercase tracking-widest">No branches found</h4>
                        <p className="text-xs text-muted-foreground/60 font-medium mt-1">Adjust your search or add a new branch location.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

    </div>
  );
}
