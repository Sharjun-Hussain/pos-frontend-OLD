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
      className="hover:bg-sidebar-accent/50 -ml-4 h-8 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 transition-colors"
    >
      {title}
      <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-40" />
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
      <div className="font-semibold text-foreground text-[13px] tracking-tight">
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
          <Avatar className="h-10 w-10 border border-border/60 rounded-xl bg-muted/30 shadow-sm overflow-hidden">
            <AvatarImage
              src={imageUrl}
              alt={variant.sku}
              className="object-cover"
            />
            <AvatarFallback className="rounded-xl bg-muted">
              <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <div className="font-semibold text-foreground text-[13px] tracking-tight truncate">
              {variant.sku}
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {variant.attribute_values?.map((av, idx) => (
                <Badge key={idx} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-bold uppercase tracking-wider bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
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
        <div className="flex flex-col gap-1.5">
          {code && (
            <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/40 bg-muted/50 px-2 py-0.5 rounded-md border border-border/40 w-fit">
              {code}
            </span>
          )}
          {barcode && (
            <span className="text-[10px] font-black tracking-widest uppercase text-emerald-600/70 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10 w-fit flex items-center gap-1.5">
              <div className="size-1 rounded-full bg-emerald-500/40" />
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
            <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-600 transition-all group">
              <MoreHorizontal className="h-4.5 w-4.5 opacity-40 group-hover:opacity-100" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl">
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
