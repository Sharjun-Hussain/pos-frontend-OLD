import { ArrowUpDown, MoreHorizontal, Building, MapPin, Clock, User, CheckCircle2, XCircle, Users } from "lucide-react";
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
import { cn } from "@/lib/utils";

const DataTableColumnHeader = ({ column, title }) => (
  <div
    className="flex items-center cursor-pointer select-none group space-x-2"
    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  >
    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
      {title}
    </span>
    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-[#10b981] transition-colors" />
  </div>
);

export const getBranchColumns = ({ onDelete, onToggleStatus, onEdit, isSuperAdmin }) => {
  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="border-border/50 data-[state=checked]:bg-[#10b981] data-[state=checked]:border-[#10b981]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-border/50 data-[state=checked]:bg-[#10b981] data-[state=checked]:border-[#10b981]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Branch details" />,
      cell: ({ row }) => {
        const branch = row.original;
        const isMainBranch = branch.is_main;
        return (
          <div className="flex items-center gap-4 py-1">
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
              isMainBranch ? "bg-[#10b981]/10 text-[#10b981]" : "bg-muted/40 text-muted-foreground group-hover:bg-[#10b981]/5 group-hover:text-[#10b981]"
            )}>
              <Building className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-[13px] text-foreground flex items-center gap-2">
                {branch.name}
                {isMainBranch && (
                  <Badge variant="outline" className="border-[#10b981]/30 text-[#10b981] bg-[#10b981]/5 text-[9px] px-1.5 py-0 rounded uppercase tracking-widest font-black">Main HQ</Badge>
                )}
              </div>
              <div className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">{branch.code}</div>
            </div>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const branchName = row.getValue(id)?.toLowerCase() || "";
        const branchCode = row.original.code?.toLowerCase() || "";
        const searchTerms = value.toLowerCase().split(" ");
        return searchTerms.every(term => branchName.includes(term) || branchCode.includes(term));
      },
    },
    ...(isSuperAdmin
      ? [
          {
            accessorKey: "organization.name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Organization" />,
            cell: ({ row }) => {
              const organization = row.original.organization;
              return (
                <div className="flex flex-col justify-center">
                  <div className="text-[12px] font-bold text-foreground">
                    {organization?.name || "N/A"}
                  </div>
                  <div className="text-[10px] font-medium text-muted-foreground/60">
                    {organization?.code || "-"}
                  </div>
                </div>
              );
            },
          },
        ]
      : []),
    {
      accessorKey: "city",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
      cell: ({ row }) => {
        const branch = row.original;
        return (
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-foreground">
              <MapPin className="h-3 w-3 text-muted-foreground/50" />
              {branch.city || "Unspecified"}
            </div>
            <div className="text-[10px] font-medium text-muted-foreground/60 truncate max-w-[200px] ml-4.5">
              {branch.address || "-"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "manager_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Management" />,
      cell: ({ row }) => {
        const branch = row.original;
        return (
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-foreground">
              <User className="h-3 w-3 text-muted-foreground/50" />
              {branch.manager_name || "Unassigned"}
            </div>
            <div className="text-[10px] font-medium text-muted-foreground/60 ml-4.5">
              {branch.manager_phone || "-"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const isActive = row.getValue("is_active");
        return (
          <Badge
            variant="outline"
            className={cn(
              "font-black uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-full border",
              isActive 
                ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20" 
                : "bg-muted/40 text-muted-foreground/60 border-border/40"
            )}
          >
            <span className="flex items-center gap-1.5">
              {isActive ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
              {isActive ? "Active" : "Inactive"}
            </span>
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const branch = row.original;
        const hasActions = onEdit || onDelete || onToggleStatus;
        if (!hasActions) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-[#10b981]/10 hover:text-[#10b981] transition-colors">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/40 shadow-xl overflow-hidden">
              <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/20 px-3 py-2">
                Branch Actions
              </DropdownMenuLabel>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(branch)} className="text-xs font-bold cursor-pointer hover:bg-muted/50 focus:bg-muted/50 py-2">
                  Edit Branch Details
                </DropdownMenuItem>
              )}
              {(onDelete || onToggleStatus) && <DropdownMenuSeparator className="bg-border/30 m-0" />}
              {onToggleStatus && (
                <DropdownMenuItem
                  className={cn("text-xs font-bold cursor-pointer py-2", branch.is_active ? "text-orange-600 focus:text-orange-700" : "text-[#10b981] focus:text-[#10b981]")}
                  onClick={() => onToggleStatus(branch)}
                >
                  {branch.is_active ? "Deactivate Branch" : "Activate Branch"}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-xs font-bold cursor-pointer text-red-600 focus:text-red-700 py-2"
                  onClick={() => onDelete(branch.id)}
                >
                  Delete Branch
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
