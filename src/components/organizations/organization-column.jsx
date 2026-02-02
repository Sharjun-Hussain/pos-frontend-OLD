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
import Link from "next/link";

// Reusable Header Component (from your file)
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
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={logoUrl} alt={organization.name} />
            <AvatarFallback>
              <Building className="h-5 w-5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{organization.name}</div>
            <div className="text-sm text-muted-foreground">
              {organization.email || "No email"}
            </div>
          </div>
        </div>
      );
    },
  },
  // ... all your other columns (city, is_multi_branch, etc.)
  {
    accessorKey: "city",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="City" />
    ),
    cell: ({ row }) => {
      const city = row.getValue("city");
      return city || "Not specified";
    },
  },
  {
    accessorKey: "is_multi_branch",
    header: "Multi-Branch",
    cell: ({ row }) => {
      return row.getValue("is_multi_branch") ? (
        <Badge variant="default">Yes</Badge>
      ) : (
        <Badge variant="destructive">No</Badge>
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
      const organization = row.original;

      // The API logic is GONE. We just call the props.
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
              <DropdownMenuItem>Edit Organization</DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-800"
              onClick={() => onDelete(organization.id)}
            >
              Delete
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500"
              onClick={() => onToggleStatus(organization)}
            >
              {organization.is_active ? "Suspend" : "Activate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
