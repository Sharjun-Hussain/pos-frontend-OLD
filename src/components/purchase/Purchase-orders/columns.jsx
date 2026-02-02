"use client";

import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
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
import { format } from "date-fns"; // Make sure to install date-fns: npm install date-fns

// Helper for Currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LKR", // Change this to your currency
  }).format(parseFloat(amount || 0));
};

// Helper for Status Colors
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "received":
      return "default"; // Black/Primary
    case "approved":
      return "secondary"; // Gray
    case "pending":
      return "outline"; // White/Border
    case "cancelled":
      return "destructive"; // Red
    default:
      return "outline";
  }
};

const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

export const getColumns = ({ onDelete }) => [
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
    accessorKey: "po_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PO Number" />
    ),
    cell: ({ row }) => {
      return (
        <span className="font-medium text-blue-600">
          {row.getValue("po_number")}
        </span>
      );
    },
  },
  {
    accessorKey: "supplier.name", // Accessing nested object
    header: "Supplier",
    cell: ({ row }) => {
      const name = row.original.supplier?.name || "Unknown";
      return <span className="font-medium">{name}</span>;
    },
  },
  {
    accessorKey: "order_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("order_date");
      if (!date) return "-";
      return <span>{format(new Date(date), "MMM dd, yyyy")}</span>;
    },
  },
  {
    accessorKey: "expected_delivery_date",
    header: "Expected Delivery",
    cell: ({ row }) => {
      const date = row.getValue("expected_delivery_date");
      if (!date) return "-";
      return (
        <span className="text-muted-foreground">
          {format(new Date(date), "MMM dd, yyyy")}
        </span>
      );
    },
  },
  {
    accessorKey: "total_amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("total_amount");
      return <div className="font-bold">{formatCurrency(amount)}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      return <StatusBadge value={status} />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const po = row.original;
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
            <Link href={`/purchase/purchase-orders/${po.id}`} passHref>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
            </Link>
            <Link href={`/purchase/purchase-orders/${po.id}/edit`} passHref>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" /> Edit Order
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={() => onDelete(po.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];