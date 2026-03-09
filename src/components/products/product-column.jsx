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
      className="hover:bg-sidebar-accent/50 text-foreground font-semibold text-xs h-9 px-3 -ml-3 tracking-tight"
    >
      {title}
      <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground transition-colors group-hover:text-foreground" />
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
        className="border-border rounded-md data-[state=checked]:bg-[#10b981] data-[state=checked]:border-[#10b981]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="border-border rounded-md data-[state=checked]:bg-[#10b981] data-[state=checked]:border-[#10b981]"
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
        <div className="flex items-center gap-4 py-1">
          {/* Avatar without Image Source since API doesn't return one yet */}
          <Avatar className="h-10 w-10 bg-sidebar-accent/50 border border-border shadow-sm transition-transform group-hover:scale-105">
            <AvatarFallback className="text-foreground/70 font-semibold text-xs">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <div
              className="font-semibold text-foreground truncate max-w-[200px]"
              title={product.name}
            >
              {product.name}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium opacity-70">
              <span className="text-foreground/40">Code:</span>
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
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-foreground/90">
            {row.original.main_category?.name ?? "Uncategorized"}
          </span>
          {/* Display Sub Category underneath if available */}
          <span className="text-[11px] text-muted-foreground font-medium opacity-70">
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
        <span className="text-[13px] font-medium text-foreground/80 hover:text-[#10b981] transition-colors cursor-default">
          {row.original.brand?.name ?? "No Brand"}
        </span>
      );
    },
  },
  {
    // Display Unit (e.g., Dozen, Kg)
    accessorKey: "unit.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Unit" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="text-[11px] font-semibold border-border bg-sidebar-accent/20 text-foreground/70 px-2 py-0.5 rounded-lg">
        {row.original.unit?.name ?? "N/A"}
      </Badge>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return <StatusBadge value={isActive} className="text-[11px] font-semibold h-6" />;
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
            <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-sidebar-accent/50 rounded-xl transition-all group">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-card border-border shadow-2xl rounded-2xl p-1.5 transition-all duration-500">
            <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground/70 px-3 py-2">Quick actions</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />

            {canEdit && (
              <DropdownMenuItem onClick={() => onEdit(product)} className="rounded-xl px-3 py-2 focus:bg-sidebar-accent cursor-pointer group">
                <span className="font-semibold text-sm text-foreground/80 group-focus:text-foreground">Edit product</span>
              </DropdownMenuItem>
            )}

            {(canDelete || canToggleStatus) && <DropdownMenuSeparator className="bg-border/50" />}

            {canToggleStatus && (
              <DropdownMenuItem
                className={`rounded-xl px-3 py-2 cursor-pointer focus:bg-sidebar-accent group ${
                  product.is_active ? "text-amber-600 focus:text-amber-700" : "text-emerald-600 focus:text-emerald-700"
                }`}
                onClick={() => onToggleStatus(product)}
              >
                <span className="font-semibold text-sm whitespace-nowrap">{product.is_active ? "Deactivate" : "Activate"}</span>
              </DropdownMenuItem>
            )}

            {canDelete && (
              <DropdownMenuItem
                className="text-red-500 focus:text-red-600 focus:bg-red-500/10 rounded-xl px-3 py-2 cursor-pointer group"
                onClick={() => onDelete(product.id)}
              >
                <span className="font-semibold text-sm">Delete</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
