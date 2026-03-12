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
  Users, UserCheck, UserX, Briefcase, Search, RefreshCcw, 
  Download, Plus, MoreHorizontal, Pencil, Trash2, 
  Loader2, CheckCircle2, XCircle, Activity, AlertTriangle
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import EmployeesPageSkeleton from "@/app/skeletons/Employees-skeleton";
import { columns as employeeColumns } from "./columns";
import { flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, getPaginationRowModel } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

// Bulk Actions Component
const EmployeeBulkActions = ({ table, onDelete, onToggleStatus }) => {
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
          <DropdownMenuItem onClick={() => { onToggleStatus(selectedIds, 'activate'); table.resetRowSelection(); }} className="text-xs font-bold cursor-pointer text-[#10b981] focus:text-[#10b981] py-2">
            Activate Staff
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { onToggleStatus(selectedIds, 'deactivate'); table.resetRowSelection(); }} className="text-xs font-bold cursor-pointer text-orange-600 focus:text-orange-700 py-2">
            Deactivate Staff
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/30 m-0" />
          <DropdownMenuItem onClick={() => { onDelete(selectedIds); table.resetRowSelection(); }} className="text-xs font-bold cursor-pointer text-red-600 focus:text-red-700 py-2">
            Remove Staff
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
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

  const fetchEmployees = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      if (data.status === "success") {
        setEmployees(data?.data?.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch employees");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchEmployees();
  }, [status, session]);

  const handleAddClick = () => router.push("/employees/new");
  
  const handleDelete = async (ids) => {
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    if (!confirm(`Are you sure you want to remove ${idsToDelete.length} staff member(s)?`)) return;

    toast.promise(
      Promise.all(idsToDelete.map((id) =>
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        })
      )),
      { 
        loading: "Removing...", 
        success: () => { fetchEmployees(); return "Staff removed successfully!"; }, 
        error: "Failed to remove staff." 
      }
    );
  };

  const handleToggleStatus = async (employeeOrIds) => {
    let ids = [];
    if (Array.isArray(employeeOrIds)) {
      ids = employeeOrIds;
    } else {
      ids = [employeeOrIds.id];
    }

    if (ids.length === 0) return;

    toast.promise(
      Promise.all(ids.map((id) =>
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${id}/toggle-status`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        })
      )),
      { 
        loading: "Updating status...", 
        success: () => { fetchEmployees(); return "Status updated successfully!"; }, 
        error: "Action failed." 
      }
    );
  };

  // We need to pass the handlers to useMemo if they change.
  // Standard list pattern: handlers are passed down to columns.
  // But columns are defined as a static array in many places here.
  // I will check columns.jsx soon to see how to inject handlers.

  const table = useReactTable({
    data: employees,
    columns: employeeColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: { rowSelection, globalFilter },
  });

  const totalEmployees = employees.length;
  const activeStaff = employees.filter(e => e.is_active).length;
  const inactiveStaff = totalEmployees - activeStaff;
  const uniqueRoles = new Set(employees.flatMap(e => e.roles?.map(r => r.name) || [])).size;

  if (loading && employees.length === 0) {
    return (
      <div className="flex-1 min-h-screen bg-background p-6 md:p-10 space-y-8 pb-32 max-w-[1600px] mx-auto w-full">
        <EmployeesPageSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-background p-6 md:p-10 space-y-8 pb-32 max-w-[1600px] mx-auto w-full">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-glow-emerald">Employee Management</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Organization</span>
              <span className="text-muted-foreground/30">/</span>
              <span>HR</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Employees</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <EmployeeBulkActions 
            table={table} 
            onDelete={handleDelete} 
            onToggleStatus={handleToggleStatus} 
          />
          <Button onClick={() => console.log('Export')} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button onClick={handleAddClick} className="bg-[#10b981] hover:bg-[#059669] text-white h-10 px-6 font-bold gap-2 rounded-xl transition-all shadow-lg shadow-[#10b981]/20 active:scale-95 border-none text-[10px] uppercase tracking-widest">
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        </div>
      </div>

      {/* ─── STAT CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Staff", value: totalEmployees, icon: Users, color: "text-[#10b981]", bg: "bg-[#10b981]/10", border: "border-[#10b981]/20" },
          { label: "Active Staff", value: activeStaff, icon: UserCheck, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "On Leave / Inactive", value: inactiveStaff, icon: UserX, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
          { label: "Staff Roles", value: uniqueRoles, icon: Briefcase, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
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
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Staff Search</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#10b981] transition-colors" />
                <Input
                  placeholder="Search by name, email, or role..."
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(String(e.target.value))}
                  className="pl-11 h-12 bg-background/50 border-border/50 rounded-xl focus:border-[#10b981] transition-all font-medium text-sm w-full md:max-w-md"
                />
              </div>
            </div>
            <Button onClick={fetchEmployees} variant="outline" className="h-12 w-12 rounded-xl bg-background border-border/50 hover:bg-muted/30 text-muted-foreground hover:text-[#10b981] transition-all p-0 shadow-sm shrink-0">
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
                  <TableCell colSpan={employeeColumns.length} className="h-72 text-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-muted/30 text-muted-foreground/20">
                        <Users className="h-12 w-12" />
                      </div>
                      <div>
                        <h4 className="font-bold text-muted-foreground text-sm uppercase tracking-widest">No staff members found</h4>
                        <p className="text-xs text-muted-foreground/60 font-medium mt-1">Adjust your search or add a new employee.</p>
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
