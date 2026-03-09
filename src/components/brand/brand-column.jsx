// app/brands/brand-columns.tsx
"use client";

import { ArrowUpDown, MoreHorizontal, Tag, Trash2 } from "lucide-react";
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
import Link from "next/link";
import { cn } from "@/lib/utils";

// Reusable Header Component
const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-8 hover:bg-emerald-500/5 group"
    >
      <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 transition-colors group-hover:text-emerald-600">{title}</span>
      <ArrowUpDown className="ml-2 size-3 text-muted-foreground/30 transition-colors group-hover:text-emerald-500/50" />
    </Button>
  );
};

export const getBrandColumns = ({
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
      <DataTableColumnHeader column={column} title="Brand" />
    ),
    cell: ({ row }) => {
      const brand = row.original;
      const initials = brand.name.substring(0, 2).toUpperCase();
      
      return (
        <div className="flex items-center gap-4 py-1">
          <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm shadow-emerald-500/5 transition-transform hover:scale-105">
            <span className="text-[13px] font-black text-emerald-600 tracking-tighter">{initials}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-foreground tracking-tight truncate leading-tight">{brand.name}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-0.5 truncate">{brand.slug || "No identifier"}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const description = row.getValue("description");
      return (
        <div className="max-w-[300px] truncate text-[12px] font-medium text-muted-foreground/60 italic leading-relaxed">
          {description || "Awaiting catalog details..."}
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
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm transition-all animate-in fade-in zoom-in duration-300",
          isActive 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-emerald-500/5" 
            : "bg-red-500/10 border-red-500/20 text-red-600 shadow-red-500/5"
        )}>
          <div className={cn("size-1.5 rounded-full", isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
          <span className="text-[10px] font-black uppercase tracking-widest">{isActive ? "Active" : "Suspended"}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const brand = row.original;

      if (!canEdit && !canDelete && !canToggleStatus) return null;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="size-8 p-0 hover:bg-emerald-500/5 rounded-full group transition-all">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="size-4 text-muted-foreground/40 group-hover:text-emerald-500 transition-colors" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-2xl border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl p-2 animate-in fade-in zoom-in duration-200">
            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Authority Actions</DropdownMenuLabel>

            {canEdit && (
              <DropdownMenuItem onClick={() => onEdit(brand)} className="cursor-pointer rounded-xl px-3 py-2 focus:bg-emerald-500/10 focus:text-emerald-600 group transition-all">
                <div className="flex items-center gap-3">
                  <Tag className="size-4 opacity-40 group-hover:scale-110 transition-transform" />
                  <span className="text-[12px] font-bold tracking-tight">Modify Details</span>
                </div>
              </DropdownMenuItem>
            )}

            {canToggleStatus && (
              <DropdownMenuItem
                className="cursor-pointer rounded-xl px-3 py-2 focus:bg-emerald-500/10 focus:text-emerald-600 group transition-all"
                onClick={() => onToggleStatus(brand)}
              >
                <div className="flex items-center gap-3">
                  <ArrowUpDown className="size-4 opacity-40 group-hover:scale-110 transition-transform" />
                  <span className="text-[12px] font-bold tracking-tight">
                    {brand.is_active ? "Suspend Entry" : "Restore Entry"}
                  </span>
                </div>
              </DropdownMenuItem>
            )}

            {canDelete && (
              <>
                <DropdownMenuSeparator className="bg-border/40 my-1" />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700 focus:bg-red-500/10 cursor-pointer rounded-xl px-3 py-2 group transition-all"
                  onClick={() => onDelete(brand.id)}
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="size-4 opacity-40 group-hover:scale-110 transition-transform" />
                    <span className="text-[12px] font-bold tracking-tight">Permanent Removal</span>
                  </div>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
