// app/containers/container-columns.tsx
"use client";

import { ArrowUpDown, MoreHorizontal, Package, Box, Scale } from "lucide-react";
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

export const getContainerColumns = ({ onDelete, onToggleStatus, onEdit }) => [
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
      <DataTableColumnHeader column={column} title="CONTAINER NAME" />
    ),
    cell: ({ row }) => {
      const container = row.original;

      return (
        <div className="flex items-center gap-3 py-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f7f0] dark:bg-emerald-500/10 text-[#00b076] dark:text-emerald-500 border border-transparent group-hover:bg-[#00b076]/20 transition-colors">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-[13px] text-slate-900 dark:text-foreground leading-tight">{container.name}</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
              SLUG: {container.slug || "NO IDENTIFIER"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "base_unit.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="BASE UNIT" />
    ),
    cell: ({ row }) => {
      const baseUnit = row.original.base_unit;

      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Box className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <div className="font-semibold text-[13px] text-slate-900 dark:text-foreground leading-tight">{baseUnit?.name || "N/A"}</div>
            <div className="text-[10px] tracking-widest uppercase font-bold text-slate-400 dark:text-muted-foreground mt-0.5">
              {baseUnit?.short_name || "NO CODE"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "measurement_unit.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="MEASUREMENT UNIT" />
    ),
    cell: ({ row }) => {
      const measurementUnit = row.original.measurement_unit;

      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Scale className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <div className="font-semibold text-[13px] text-slate-900 dark:text-foreground leading-tight">
              {measurementUnit?.name || "N/A"}
            </div>
            <div className="text-[10px] tracking-widest uppercase font-bold text-slate-400 dark:text-muted-foreground mt-0.5">
              {measurementUnit?.short_name || "NO CODE"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "capacity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="CAPACITY" />
    ),
    cell: ({ row }) => {
      const container = row.original;
      const measurementUnit = container.measurement_unit;

      return (
        <div className="text-center bg-slate-50 dark:bg-muted/30 border border-slate-200 dark:border-border/50 py-1.5 px-3 rounded-lg w-max mx-auto shadow-sm">
          <div className="font-semibold text-slate-900 dark:text-foreground text-[13px]">{container.capacity}</div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-muted-foreground mt-0.5">
            {measurementUnit?.short_name || "UNITS"}
          </div>
        </div>
      );
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
        <div className="max-w-[200px] xl:max-w-[300px] truncate text-[13px] italic text-slate-400 font-medium py-2">
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
      const container = row.original;

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

            <DropdownMenuItem 
              onClick={() => onEdit(container)}
              className="font-bold text-foreground cursor-pointer focus:bg-muted"
            >
              Edit Container
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border/50" />
            
            <DropdownMenuItem
              className="text-red-500 font-bold cursor-pointer focus:text-red-500 focus:bg-red-500/10"
              onClick={() => onDelete(container.id)}
            >
              Delete Container
            </DropdownMenuItem>
            
            <DropdownMenuItem
              className="text-amber-500 font-bold cursor-pointer focus:text-amber-500 focus:bg-amber-500/10"
              onClick={() => onToggleStatus(container)}
            >
              {container.is_active ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
