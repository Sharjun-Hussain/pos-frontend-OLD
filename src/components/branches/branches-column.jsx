// app/branches/branch-columns.tsx
"use client";

import {
  ArrowUpDown,
  MoreHorizontal,
  Building,
  MapPin,
  Clock,
  User,
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

export const getBranchColumns = ({ onDelete, onToggleStatus, onEdit, isSuperAdmin }) => {
  const columns = [
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
        <DataTableColumnHeader column={column} title="Branch Name" />
      ),
      cell: ({ row }) => {
        const branch = row.original;

        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100">
              <Building className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium">{branch.name}</div>
              <div className="text-sm text-muted-foreground">{branch.code}</div>
            </div>
          </div>
        );
      },
    },
    ...(isSuperAdmin
      ? [
          {
            accessorKey: "organization.name",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Organization" />
            ),
            cell: ({ row }) => {
              const organization = row.original.organization;

              return (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100">
                    <Building className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {organization?.name || "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {organization?.code || "No code"}
                    </div>
                  </div>
                </div>
              );
            },
          },
        ]
      : []),
    {
      accessorKey: "city",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) => {
        const branch = row.original;

        return (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm">{branch.city}</div>
              <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                {branch.address}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "manager_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Manager" />
      ),
      cell: ({ row }) => {
        const branch = row.original;

        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm">
                {branch.manager_name || "Not assigned"}
              </div>
              <div className="text-xs text-muted-foreground">
                {branch.manager_phone || "No phone"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "opening_time",
      header: "Business Hours",
      cell: ({ row }) => {
        const branch = row.original;

        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              {branch.opening_time} - {branch.closing_time}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "is_main",
      header: "Branch Type",
      cell: ({ row }) => {
        const isMainBranch = row.getValue("is_main");
        return (
          <Badge variant={isMainBranch ? "default" : "secondary"}>
            {isMainBranch ? "Main Branch" : "Sub Branch"}
          </Badge>
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
        const branch = row.original;

        // Don't show actions menu if no actions are available
        const hasActions = onEdit || onDelete || onToggleStatus;
        
        if (!hasActions) {
          return null;
        }

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

              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(branch)}>
                  Edit Branch
                </DropdownMenuItem>
              )}

              {(onDelete || onToggleStatus) && <DropdownMenuSeparator />}
              
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-800"
                  onClick={() => onDelete(branch.id)}
                >
                  Delete Branch
                </DropdownMenuItem>
              )}
              
              {onToggleStatus && (
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() => onToggleStatus(branch)}
                >
                  {branch.is_active ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return columns;
};
