// app/organizations/organization-columns.tsx
"use client";

import { ArrowUpDown, MoreHorizontal, Building } from "lucide-react";
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
import { cn } from "@/lib/utils";
import Link from "next/link";

// Reusable Header Component (from your file)
const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="hover:bg-transparent px-0 font-bold text-[11px] uppercase tracking-widest text-slate-400"
    >
      {title}
      <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
    </Button>
  );
};

// Notice this is now a function
export const getOrganizationColumns = ({ onDelete, onToggleStatus }) => [
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
      <DataTableColumnHeader column={column} title="Organization" />
    ),
    cell: ({ row }) => {
      const organization = row.original;
      const logoUrl = organization.logo
        ? `https://apipos.inzeedo.com/${organization.logo}`
        : null;

      return (
        <div className="flex items-center gap-3 py-1">
          <Avatar className="h-10 w-10 rounded-xl border border-slate-100 shadow-sm">
            <AvatarImage src={logoUrl} alt={organization.name} />
            <AvatarFallback className="bg-emerald-50 text-[#10b981] rounded-xl font-bold">
              {organization.name.substring(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold text-[13px] text-slate-900 tracking-tight">
              {organization.name}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {organization.email || "No email"}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.getValue("phone");
      return (
        <div className="text-sm text-muted-foreground">
          {phone || <span className="opacity-50">-</span>}
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
      const city = row.getValue("city");
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {city || <span className="opacity-50 text-xs">N/A</span>}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "branches",
    header: "Branches",
    cell: ({ row }) => {
      const branchCount = row.original.branches?.length || 0;
      return (
        <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg">
          {branchCount} {branchCount === 1 ? "Branch" : "Branches"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "subscription_tier",
    header: "Subscription",
    cell: ({ row }) => {
      const tier = row.original.subscription_tier;
      const cycle = row.original.billing_cycle;
      
      if (!tier) {
        return <span className="text-xs text-muted-foreground opacity-50">Not Set</span>;
      }
      
      const tierColors = {
        Basic: "bg-gray-100 text-gray-700 border-gray-300",
        Pro: "bg-blue-100 text-blue-700 border-blue-300",
        Enterprise: "bg-purple-100 text-purple-700 border-purple-300"
      };
      
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className={cn("font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg border-none", tierColors[tier] || 'bg-slate-100 text-slate-500')}>
            {tier}
          </Badge>
          {cycle && (
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{cycle}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "subscription_status",
    header: "Sub. Status",
    cell: ({ row }) => {
      const status = row.original.subscription_status;
      
      const statusConfig = {
        Active: { variant: "default", className: "bg-green-100 text-green-700 border-green-300" },
        Trial: { variant: "outline", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
        Expired: { variant: "destructive", className: "bg-red-100 text-red-700 border-red-300" },
        Suspended: { variant: "secondary", className: "bg-gray-100 text-gray-700 border-gray-300" }
      };
      
      const config = statusConfig[status] || statusConfig.Trial;
      
      return (
        <Badge variant={config.variant} className={cn("font-bold text-[10px] uppercase tracking-wider px-2 py-1 rounded-lg border-none shadow-none", config.className)}>
          {status || "Trial"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "subscription_expiry_date",
    header: "Expiry Date",
    cell: ({ row }) => {
      const expiryDate = row.original.subscription_expiry_date;
      
      if (!expiryDate) {
        return <span className="text-xs text-muted-foreground opacity-50">-</span>;
      }
      
      const date = new Date(expiryDate);
      const now = new Date();
      const isExpired = date < now;
      const daysUntilExpiry = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
      
      return (
        <div className="flex flex-col">
          <span className={`text-sm ${isExpired ? 'text-red-600 font-medium' : ''}`}>
            {date.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
          {!isExpired && daysUntilExpiry <= 30 && (
            <span className="text-xs text-orange-600">
              {daysUntilExpiry} days left
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
      const isActive = row.getValue("is_active");
      return <StatusBadge value={isActive} />;
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Registered" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const organization = row.original;

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
            <Link href={`/organizations/${organization.id}/edit`} passHref>
              <DropdownMenuItem>Edit Details</DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-800"
              onClick={() => onDelete(organization.id)}
            >
              Delete Organization
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500"
              onClick={() => onToggleStatus(organization)}
            >
              {organization.is_active ? "Suspend Access" : "Activate Access"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
