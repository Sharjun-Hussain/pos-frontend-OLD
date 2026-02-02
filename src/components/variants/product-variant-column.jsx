"use client";

import { ArrowUpDown, MoreHorizontal, Copy, ImageIcon } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

// Helper to copy text
const copyToClipboard = (text, label) => {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
};

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

export const getProductVariantColumns = ({
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
  // --- 1. HIDDEN SEARCH COLUMN (Required for search) ---
  {
    accessorKey: "search_text",
    header: null,
    cell: null,
    enableHiding: true, // Hide from view
    filterFn: "includesString",
  },
  // --- 2. PARENT PRODUCT COLUMN (Required for filter) ---
  {
    accessorKey: "parent_product_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product" />
    ),
    cell: ({ row }) => (
      <div className="font-medium text-gray-900">
        {row.getValue("parent_product_name")}
      </div>
    ),
  },
  {
    accessorKey: "sku",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Variant Info" />
    ),
    cell: ({ row }) => {
      const variant = row.original;
      const imageUrl = variant.image
        ? `${process.env.NEXT_PUBLIC_STORAGE_URL}/${variant.image}`
        : null;

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-gray-200 rounded-lg bg-gray-50">
            <AvatarImage
              src={imageUrl}
              alt={variant.sku}
              className="object-cover"
            />
            <AvatarFallback className="rounded-lg">
              <ImageIcon className="h-4 w-4 text-gray-400" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="font-medium flex items-center gap-2">
              {variant.sku}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {variant.attribute_values?.map((av, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px] py-0 h-4 font-normal">
                  {av.value}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "identifiers",
    header: "Identifiers",
    cell: ({ row }) => {
      const { code, barcode } = row.original;
      return (
        <div className="flex flex-col gap-1">
          {code && (
            <span className="text-xs font-mono bg-gray-100 px-1 rounded w-fit">
              {code}
            </span>
          )}
          {barcode && (
            <span className="text-xs font-mono bg-gray-100 px-1 rounded w-fit">
              {barcode}
            </span>
          )}
        </div>
      );
    },
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
      const variant = row.original;
      if (!canEdit && !canDelete && !canToggleStatus) return null;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => copyToClipboard(variant.sku, "SKU")}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy SKU
            </DropdownMenuItem>

            {canEdit && (
              <DropdownMenuItem onClick={() => onEdit(variant)}>
                Edit Variant
              </DropdownMenuItem>
            )}

            {(canDelete || canToggleStatus) && <DropdownMenuSeparator />}

            {canToggleStatus && (
              <DropdownMenuItem onClick={() => onToggleStatus(variant)}>
                {variant.is_active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            )}

            {canDelete && (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700"
                onClick={() => onDelete(variant.id)}
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
