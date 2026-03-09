// app/unit-measurement/columns.tsx
"use client";

import { ArrowUpDown, CheckCircle2, MoreHorizontal, Scale, Trash2, XCircle } from "lucide-react"; // Changed icons
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="hover:bg-slate-100 text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest px-0"
    >
      {title}
      <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-40" />
    </Button>
  );
};

// Renamed function to be more specific
export const getMeasurementUnitColumns = ({
  onDelete,
  onToggleStatus,
  onEdit,
  canEdit = false,
  canDelete = false,
  canToggleStatus = false,
}) => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="CATEGORY NAME" />
    ),
    cell: ({ row }) => {
      const unit = row.original;

      return (
        <div className="flex items-center gap-3 py-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f7f0] dark:bg-emerald-500/10 text-[#00b076] dark:text-emerald-500 border border-transparent">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-[13px] text-slate-900 dark:text-foreground leading-tight">{unit.name}</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">CODE: {unit.short_name || "NO IDENTIFIER"}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "short_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    cell: ({ row }) => {
      // Displaying the short_name
      return (
        <div className="font-mono text-sm text-foreground font-bold">{row.getValue("short_name")}</div>
      );
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="TYPE" />
    ),
    cell: ({ row }) => {
      // Displaying the type as a badge
      const type = row.getValue("type");
      return <Badge variant="outline" className="bg-muted text-muted-foreground border-border">{type}</Badge>;
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="DESCRIPTION" />
    ),
    cell: ({ row }) => {
      const description = row.getValue("description");
      return (
        <div className="max-w-[300px] truncate text-[13px] italic text-slate-400 font-medium py-2">
          {description || "No description provided..."}
        </div>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active");
      return (
        <Badge variant="outline" className={`border-transparent font-bold tracking-wider text-[11px] uppercase transition-colors px-2.5 py-0.5 rounded-full ${isActive ? "bg-[#e6f7f0] text-[#00b076] dark:bg-emerald-500/10 dark:text-emerald-500" : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500"}`}>
          <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isActive ? "bg-[#00b076] dark:bg-emerald-500" : "bg-red-600 dark:bg-red-500"}`}></div>
          {isActive ? "ACTIVE" : "INACTIVE"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const unit = row.original; // Renamed from subCategory to unit

      if (!canEdit && !canDelete && !canToggleStatus) return null;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border/60">
            <DropdownMenuLabel className="font-bold text-foreground">Actions</DropdownMenuLabel>

            {/* Updated labels and handlers */}
            {canEdit && (
              <DropdownMenuItem 
                onClick={() => onEdit(unit)}
                className="font-bold text-foreground cursor-pointer focus:bg-muted"
              >
                Edit Unit
              </DropdownMenuItem>
            )}

            {(canDelete || canToggleStatus) && <DropdownMenuSeparator className="bg-border/50" />}

            {canDelete && (
              <DropdownMenuItem
                className="text-red-500 font-bold cursor-pointer focus:text-red-500 focus:bg-red-500/10"
                onClick={() => onDelete(unit.id)}
              >
                Delete
              </DropdownMenuItem>
            )}

            {canToggleStatus && (
              <DropdownMenuItem
                className="text-amber-500 font-bold cursor-pointer focus:text-amber-500 focus:bg-amber-500/10"
                onClick={() => onToggleStatus(unit)}
              >
                {unit.is_active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
