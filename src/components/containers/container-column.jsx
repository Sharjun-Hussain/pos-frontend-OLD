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

// Reusable Header Component
const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="hover:bg-muted text-muted-foreground hover:text-foreground font-black text-[10px] uppercase tracking-wider"
    >
      {title}
      <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-60" />
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
      <DataTableColumnHeader column={column} title="Container Name" />
    ),
    cell: ({ row }) => {
      const container = row.original;

      return (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 transition-colors group-hover:bg-background">
            <Package className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground leading-tight">{container.name}</div>
            <div className="text-[10px] text-muted-foreground font-mono italic mt-0.5">
              {container.slug}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "base_unit.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Base Unit" />
    ),
    cell: ({ row }) => {
      const baseUnit = row.original.base_unit;

      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 shadow-sm">
            <Box className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground leading-tight">{baseUnit?.name || "N/A"}</div>
            <div className="text-[10px] tracking-widest uppercase font-black text-muted-foreground mt-0.5">
              {baseUnit?.short_name || "No code"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "measurement_unit.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Measurement Unit" />
    ),
    cell: ({ row }) => {
      const measurementUnit = row.original.measurement_unit;

      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
            <Scale className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground leading-tight">
              {measurementUnit?.name || "N/A"}
            </div>
            <div className="text-[10px] tracking-widest uppercase font-black text-muted-foreground mt-0.5">
              {measurementUnit?.short_name || "No code"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "capacity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Capacity" />
    ),
    cell: ({ row }) => {
      const container = row.original;
      const measurementUnit = container.measurement_unit;

      return (
        <div className="text-center bg-muted/30 border border-border/50 py-1.5 px-3 rounded-lg w-max mx-auto shadow-sm">
          <div className="font-black text-foreground text-sm">{container.capacity}</div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-0.5">
            {measurementUnit?.short_name || "units"}
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
      return description || "No description";
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active");
      return <StatusBadge value={isActive} />;
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
