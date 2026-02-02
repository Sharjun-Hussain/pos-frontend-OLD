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
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4 text-gray-700 opacity-60" />
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
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-100">
            <Package className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <div className="font-medium">{container.name}</div>
            <div className="text-sm text-muted-foreground">
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
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100">
            <Box className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-sm">{baseUnit?.name || "N/A"}</div>
            <div className="text-xs text-muted-foreground">
              {baseUnit?.short_code || "No code"}
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
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100">
            <Scale className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <div className="font-medium text-sm">
              {measurementUnit?.name || "N/A"}
            </div>
            <div className="text-xs text-muted-foreground">
              {measurementUnit?.type || "No type"} •{" "}
              {measurementUnit?.short_code || "No code"}
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
        <div className="text-center">
          <div className="font-medium">{container.capacity}</div>
          <div className="text-xs text-muted-foreground">
            {measurementUnit?.short_code || "units"}
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
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return date.toLocaleDateString();
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
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            <DropdownMenuItem onClick={() => onEdit(container)}>
              Edit Container
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-800"
              onClick={() => onDelete(container.id)}
            >
              Delete Container
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500"
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
