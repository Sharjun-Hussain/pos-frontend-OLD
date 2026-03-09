"use client";

import { Package, Warehouse, AlertCircle, SlidersHorizontal, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const getStockColumns = ({ onAdjust, hasEditPermission }) => [
  {
    accessorKey: "product",
    header: "Product",
    cell: ({ row }) => {
      const stock = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground overflow-hidden">
            {stock.product?.image ? (
              <img
                src={stock.product.image}
                className="w-full h-full object-cover"
                alt={stock.product?.name}
              />
            ) : (
              <Package className="h-5 w-5" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm leading-tight">
              {stock.product?.name}
            </h4>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {stock.product?.code}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "branch",
    header: "Branch",
    cell: ({ row }) => {
      const stock = row.original;
      return (
        <div className="flex items-center gap-2">
          <Warehouse className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">
            {stock.branch?.name}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "variant",
    header: "Variant",
    cell: ({ row }) => {
      const stock = row.original;
      return stock.variant ? (
        <Badge
          variant="outline"
          className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20"
        >
          {stock.variant.name}
        </Badge>
      ) : (
        <span className="text-[10px] text-muted-foreground italic">
          No variant
        </span>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: () => <div className="text-right">Quantity</div>,
    cell: ({ row }) => {
      const stock = row.original;
      const qty = parseFloat(stock.quantity);
      return (
        <div className="flex flex-col items-end">
          <span
            className={cn(
              "text-sm font-black",
              qty <= 0
                ? "text-red-500"
                : qty <= 10
                ? "text-amber-500"
                : "text-foreground"
            )}
          >
            {qty.toFixed(2)}
          </span>
          {qty <= 0 && (
            <span className="text-[9px] text-red-500 font-bold uppercase flex items-center gap-0.5">
              <AlertCircle className="h-2 w-2" /> Out of Stock
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const stock = row.original;

      if (!hasEditPermission) return null;

      return (
        <div className="flex justify-end pr-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => onAdjust(stock)}
                className="gap-2 cursor-pointer"
              >
                <SlidersHorizontal className="h-4 w-4" /> Adjust Stock
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
