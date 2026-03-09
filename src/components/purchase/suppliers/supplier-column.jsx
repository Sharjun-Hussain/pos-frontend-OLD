"use client";

import {
  ArrowUpDown,
  MoreHorizontal,
  Building,
  Briefcase,
  User,
  Phone,
  Mail,
  MapPin,
  Map,
  ExternalLink,
  Edit,
  Trash2,
  Activity,
  CreditCard,
  CheckCircle2,
  XCircle
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
import { cn } from "@/lib/utils";

// Reusable Header Component
const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4 text-foreground opacity-60" />
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
      <DataTableColumnHeader column={column} title="Supplier Identity" />
    ),
    cell: ({ row }) => {
      const supplier = row.original;

      return (
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onViewDetails(supplier)}>
          <div className="relative">
            <div className="absolute -inset-1 bg-emerald-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <Avatar className="h-10 w-10 rounded-xl border-2 border-emerald-500/10 transition-all group-hover:border-emerald-500/40 group-hover:scale-105 relative z-10">
              <AvatarFallback className="bg-emerald-500/5 text-emerald-600 font-bold rounded-xl flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                <Briefcase className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="font-bold text-foreground leading-none mb-1 group-hover:text-emerald-600 transition-colors truncate">
              {supplier.name}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-90 transition-opacity flex items-center gap-1.5">
              <Building className="h-3 w-3" />
              {supplier.company_name || "Enterprise"}
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 group/contact">
            <User className="h-3.5 w-3.5 text-emerald-500/60 transition-colors group-hover/contact:text-emerald-500" />
            <div className="text-sm font-semibold text-foreground leading-none">
              {supplier.contact_person_name || "Unassigned"}
            </div>
          </div>
          <div className="flex items-center gap-2 pl-5">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 opacity-60">
              <Phone className="h-3 w-3" />
              {supplier.contact_person_phone || "No direct line"}
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-emerald-500/60" />
            <div className="text-sm font-semibold text-foreground leading-none">
              {supplier.phone || "No contact"}
            </div>
          </div>
          <div className="flex items-center gap-2 pl-5">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 opacity-60">
              <Mail className="h-3 w-3" />
              {supplier.email || "No digital contact"}
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-emerald-500/60" />
            <div className="text-sm font-semibold text-foreground leading-none truncate max-w-[150px]">
              {supplier.city || "Strategic Hub"}
            </div>
          </div>
          <div className="flex items-center gap-2 pl-5">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40 truncate max-w-[120px]">
              {supplier.address || "Main Facility"}
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
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-500/10 transition-colors group">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-2xl border-border/40">
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-3 py-2">
              Management Actions
            </DropdownMenuLabel>
            
            <DropdownMenuItem 
              onClick={() => onEdit(supplier)}
              className="rounded-lg py-2.5 font-semibold text-foreground focus:bg-emerald-500/10 focus:text-emerald-700 cursor-pointer"
            >
              <Edit className="mr-3 h-4 w-4 opacity-70" />
              Modify Profile
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => onViewLedger(supplier)}
              className="rounded-lg py-2.5 font-semibold text-foreground focus:bg-emerald-500/10 focus:text-emerald-700 cursor-pointer"
            >
              <Activity className="mr-3 h-4 w-4 opacity-70" />
              Financial Analysis
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => onSettle(supplier)}
              className="rounded-lg py-2.5 font-semibold text-foreground focus:bg-emerald-500/10 focus:text-emerald-700 cursor-pointer"
            >
              <CreditCard className="mr-3 h-4 w-4 opacity-70" />
              Initiate Settlement
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />
            
            <DropdownMenuItem
              className={cn(
                "rounded-lg py-2.5 font-semibold cursor-pointer transition-colors",
                supplier.is_active 
                  ? "text-amber-600 focus:bg-amber-500/10 focus:text-amber-700" 
                  : "text-emerald-600 focus:bg-emerald-500/10 focus:text-emerald-700"
              )}
              onClick={() => onToggleStatus(supplier)}
            >
              {supplier.is_active ? <XCircle className="mr-3 h-4 w-4" /> : <CheckCircle2 className="mr-3 h-4 w-4" />}
              {supplier.is_active ? "Suspend Operations" : "Resume Operations"}
            </DropdownMenuItem>

            <DropdownMenuItem
              className="rounded-lg py-2.5 font-bold text-red-600 focus:bg-red-500/10 focus:text-red-700 cursor-pointer mt-1"
              onClick={() => onDelete(supplier.id)}
            >
              <Trash2 className="mr-3 h-4 w-4" />
              Purge Registry
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
