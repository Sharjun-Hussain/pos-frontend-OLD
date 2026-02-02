"use client";

import { ArrowUpDown, MoreHorizontal, Package } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

export const getProductColumns = ({
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
      <DataTableColumnHeader column={column} title="Product Name" />
    ),
    cell: ({ row }) => {
      const product = row.original;
      // Fallback if name is missing
      const initial = product.name?.charAt(0)?.toUpperCase() ?? "P";

      return (
        <div className="flex items-center gap-3">
          {/* Avatar without Image Source since API doesn't return one yet */}
          <Avatar className="h-9 w-9 bg-primary/10 border border-primary/20">
            <AvatarFallback className="text-primary font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div>
            <div
              className="font-medium truncate max-w-[180px]"
              title={product.name}
            >
              {product.name}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="opacity-70">Code:</span>
              <span className="font-mono">{product.code || "N/A"}</span>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    // Access nested object: main_category.name
    accessorKey: "main_category.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            {row.original.main_category?.name ?? "Uncategorized"}
          </span>
          {/* Display Sub Category underneath if available */}
          <span className="text-xs text-muted-foreground">
            {row.original.sub_category?.name ?? ""}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "brand.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Brand" />
    ),
    cell: ({ row }) => {
      return (
        <span className="text-sm text-gray-700">
          {row.original.brand?.name ?? "No Brand"}
        </span>
      );
    },
  },
  {
    // Display Unit (e.g., Dozen, Kg)
    accessorKey: "unit.name",
    header: "Unit",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs font-normal">
        {row.original.unit?.name ?? "N/A"}
      </Badge>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return <StatusBadge value={isActive} />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;

      if (!canEdit && !canDelete && !canToggleStatus) return null;

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

            {canEdit && (
              <DropdownMenuItem onClick={() => onEdit(product)}>
                Edit Product
              </DropdownMenuItem>
            )}

            {(canDelete || canToggleStatus) && <DropdownMenuSeparator />}

            {canDelete && (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
                onClick={() => onDelete(product.id)}
              >
                Delete
              </DropdownMenuItem>
            )}

            {canToggleStatus && (
              <DropdownMenuItem
                className={`text-${
                  product.is_active ? "amber-600" : "emerald-600"
                } focus:bg-gray-50`}
                onClick={() => onToggleStatus(product)}
              >
                {product.is_active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
