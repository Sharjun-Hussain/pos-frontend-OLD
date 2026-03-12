"use client";

import { ArrowUpDown, MoreHorizontal, User, Mail, Phone, Shield, Pencil, Trash2, Power } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Reusable component for sortable column headers
export const DataTableColumnHeader = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="-ml-3 h-8 hover:bg-transparent font-black text-[10px] uppercase tracking-widest text-foreground/70"
    >
      {title}
      <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
    </Button>
  );
};

export const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px] border-white/20 data-[state=checked]:bg-[#10b981] data-[state=checked]:border-[#10b981]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px] border-white/20 data-[state=checked]:bg-[#10b981] data-[state=checked]:border-[#10b981]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Staff Member" />,
    cell: ({ row }) => {
      const staff = row.original;
      return (
        <div className="flex items-center gap-4 py-1">
          <div className="relative group">
            <Avatar className="h-10 w-10 border border-white/10 shadow-sm transition-transform duration-300 group-hover:scale-105">
              <AvatarImage src={staff.profile_image} />
              <AvatarFallback className="bg-[#10b981]/10 text-[#10b981] font-bold text-xs">
                {staff.name?.split(" ").map(n => n[0]).join("").toUpperCase() || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            {staff.is_active && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#10b981] border-2 border-background shadow-sm" />
            )}
          </div>
          <div>
            <div className="font-bold text-[13px] text-foreground flex items-center gap-2">
              {staff.name}
              {staff.roles?.some(r => r.name === 'Super Admin') && (
                <Shield className="h-3 w-3 text-[#10b981] fill-[#10b981]/10" />
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground/60">
              <Mail className="h-2.5 w-2.5" />
              {staff.email}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "roles",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => {
      const roles = row.original.roles || [];
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role) => (
            <Badge 
              key={role.id} 
              variant="outline" 
              className="bg-muted/30 border-white/5 text-[10px] font-bold uppercase tracking-tight px-2 py-0"
            >
              {role.name}
            </Badge>
          ))}
          {roles.length === 0 && <span className="text-[10px] text-muted-foreground italic font-medium">No Role</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contact" />,
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
          <Phone className="h-2.5 w-2.5 text-muted-foreground/40" />
          {row.getValue("phone") || "N/A"}
        </div>
        {row.original.nic && (
            <div className="text-[9px] font-medium text-muted-foreground/50 ml-4 uppercase tracking-tighter">
                NIC: {row.original.nic}
            </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <Badge
          variant="outline"
          className={cn(
            "rounded-lg px-2 py-0.5 border text-[10px] font-black uppercase tracking-widest",
            isActive
              ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
              : "bg-muted/50 text-muted-foreground border-border/50"
          )}
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const staff = row.original;
      // Note: We need to access actions from table meta or context in a real implementation
      // For now, these are placeholders that would be connected to the parent's handlers
      return (
        <div className="flex justify-end pr-2">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-muted/50 transition-colors">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl border-border/40 shadow-xl p-1">
                <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70 px-3 py-2">
                Staff Actions
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/40" />
                <DropdownMenuItem className="text-xs font-bold py-2.5 cursor-pointer rounded-lg focus:bg-[#10b981]/10 focus:text-[#10b981] flex gap-2">
                    <Pencil className="h-3.5 w-3.5" /> Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs font-bold py-2.5 cursor-pointer rounded-lg flex gap-2">
                    <Power className="h-3.5 w-3.5" /> Toggle Status
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/40" />
                <DropdownMenuItem className="text-xs font-bold py-2.5 cursor-pointer rounded-lg text-red-600 focus:text-red-700 focus:bg-red-500/10 flex gap-2">
                    <Trash2 className="h-3.5 w-3.5" /> Remove Staff
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
  },
];
