"use client";

import {
  ArrowUpDown,
  MoreHorizontal,
  Building,
  User,
  Phone,
  MapPin,
  Map,
} from "lucide-react";
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

export const getSupplierColumns = ({ onDelete, onToggleStatus, onEdit, onViewLedger, onSettle, onViewDetails }) => [
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
      <DataTableColumnHeader column={column} title="Supplier" />
    ),
    cell: ({ row }) => {
      const supplier = row.original;

      return (
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onViewDetails(supplier)}>
          <Avatar>
            <AvatarFallback className="bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Building className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold group-hover:text-blue-600 group-hover:underline transition-all decoration-blue-300 underline-offset-4">{supplier.name}</div>
            <div className="text-sm text-muted-foreground group-hover:text-blue-400">
              {supplier.company_name}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "contact_person_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact Person" />
    ),
    cell: ({ row }) => {
      const supplier = row.original;

      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm">
              {supplier.contact_person_name || "Not assigned"}
            </div>
            <div className="text-xs text-muted-foreground">
              {supplier.contact_person_phone || "No phone"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact Info" />
    ),
    cell: ({ row }) => {
      const supplier = row.original;

      return (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm">{supplier.phone || "No phone"}</div>
            <div className="text-xs text-muted-foreground">
              {supplier.email || "No email"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) => {
      const supplier = row.original;

      return (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm">{supplier.city || "Not specified"}</div>
            <div className="text-xs text-muted-foreground truncate max-w-[120px]">
              {supplier.address || "No address"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "bank_accounts",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bank Accounts" />
    ),
    cell: ({ row }) => {
      const bankAccounts = row.original.bank_accounts || [];
      const defaultAccount = bankAccounts.find((acc) => acc.is_default);
      const totalAccounts = bankAccounts.length;

      return (
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm">
              {defaultAccount ? defaultAccount.bank_name : "No accounts"}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalAccounts > 0
                ? `${totalAccounts} account(s)`
                : "No accounts"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supplier Code" />
    ),
    cell: ({ row }) => {
      const code = row.getValue("code");
      return code || "No code";
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
      const supplier = row.original;

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

            <DropdownMenuItem onClick={() => onEdit(supplier)}>
              Edit Supplier
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onViewLedger(supplier)}>
              View Ledger
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onSettle(supplier)}>
              Settle Amount
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-800"
              onClick={() => onDelete(supplier.id)}
            >
              Delete Supplier
            </DropdownMenuItem>
            <DropdownMenuItem
              className={supplier.is_active ? "text-red-500" : "text-green-800"}
              onClick={() => onToggleStatus(supplier)}
            >
              {supplier.is_active ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
