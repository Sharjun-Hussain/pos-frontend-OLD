"use client";

// Added 'Box' for the unit icon
import { ArrowUpDown, MoreHorizontal, Box } from "lucide-react";
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

// Renamed function
export const getUnitColumns = ({ onDelete, onToggleStatus, onEdit }) => [
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
      <DataTableColumnHeader column={column} title="Unit" />
    ),
    cell: ({ row }) => {
      // Renamed variable
      const unit = row.original;

      return (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
            {/* Updated icon */}
            <Box className="h-5 w-5 text-primary" />
          </div>
          <div>
            {/* Updated variables */}
            <div className="font-medium">{unit.name}</div>
            <div className="text-sm text-muted-foreground">{unit.slug}</div>
          </div>
        </div>
      );
    },
  },
  // --- NEW COLUMN ---
  {
    accessorKey: "short_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Short Code" />
    ),
    cell: ({ row }) => {
      return row.getValue("short_name");
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
  // --- NEW COLUMN ---
  {
    accessorKey: "is_base_unit",
    header: "Type",
    cell: ({ row }) => {
      const isBase = row.getValue("is_base_unit");
      return isBase ? <Badge variant="outline">Base Unit</Badge> : null;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      // Renamed variable
      const unit = row.original;

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

            {/* Updated text and variable */}
            <DropdownMenuItem onClick={() => onEdit(unit)}>
              Edit Unit
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            {/* Updated variable */}
            <DropdownMenuItem
              className="text-red-800"
              onClick={() => onDelete(unit.id)}
            >
              Delete
            </DropdownMenuItem>
            {/* Updated variable */}
            <DropdownMenuItem
              className="text-red-500"
              onClick={() => onToggleStatus(unit)}
            >
              {unit.is_active ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
