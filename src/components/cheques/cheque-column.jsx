"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash, Eye, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export const getChequeColumns = ({ onUpdateStatus, onDelete, onView }) => [
  {
    accessorKey: "cheque_number",
    header: "Cheque #",
    cell: ({ row }) => <span className="font-bold text-[12px] tracking-tight text-slate-900 dark:text-emerald-400">{row.getValue("cheque_number")}</span>,
  },
  {
    accessorKey: "bank_name",
    header: "Bank Name",
    cell: ({ row }) => <span className="font-bold text-xs text-slate-600 dark:text-slate-300 tracking-tight">{row.getValue("bank_name")}</span>,
  },
  {
    accessorKey: "amount",
    header: "Amount (LKR)",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      return (
        <div className="font-bold text-slate-900 dark:text-foreground">
          {amount.toLocaleString()}
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type");
      return (
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] font-bold tracking-tight px-2 py-0.5 border",
            type === "receivable" 
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
          )}
        >
          {type === "receivable" ? "Customer" : "Supplier"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "cheque_date",
    header: "Cheque Date",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-bold text-[11px] text-slate-900 dark:text-white tracking-tight">
            {format(new Date(row.getValue("cheque_date")), "PPP")}
        </span>
        <span className="text-[10px] font-medium text-slate-500 tracking-tight truncate">Scheduled</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      return <StatusBadge value={status} className="shadow-none rounded-md" />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const cheque = row.original;

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
            <DropdownMenuItem onClick={() => onView(cheque)}>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
            
            {cheque.status === "pending" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onUpdateStatus(cheque, "cleared")}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Mark Cleared
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(cheque, "bounced")}>
                  <XCircle className="mr-2 h-4 w-4 text-red-600" /> Mark Bounced
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(cheque.id)}
              className="text-red-600 focus:text-red-700 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-500/10"
              disabled={cheque.status === "cleared"}
            >
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
