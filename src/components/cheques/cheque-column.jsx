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
    header: "Instrument #",
    cell: ({ row }) => <span className="font-black text-[11px] tracking-[0.1em] text-slate-900 dark:text-emerald-400">{row.getValue("cheque_number")}</span>,
  },
  {
    accessorKey: "type",
    header: "Designation",
    cell: ({ row }) => {
      const type = row.getValue("type");
      return (
        <Badge 
          variant="outline" 
          className={cn(
            "text-[9px] font-black tracking-widest px-2.5 py-0.5 border-none",
            type === "receivable" 
              ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" 
              : "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400"
          )}
        >
          {type === "receivable" ? "Inflow Asset" : "Outflow Debt"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "bank_name",
    header: "Institution",
    cell: ({ row }) => <span className="font-bold text-xs text-slate-600 dark:text-slate-300 tracking-tight">{row.getValue("bank_name")}</span>,
  },
  {
    accessorKey: "amount",
    header: "Magnitude (LKR)",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      return <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">LKR {amount.toLocaleString()}</span>;
    },
  },
  {
    accessorKey: "cheque_date",
    header: "Maturity",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-black text-[10px] text-slate-900 dark:text-white tracking-widest">
            {format(new Date(row.getValue("cheque_date")), "dd MMM yyyy")}
        </span>
        <span className="text-[9px] font-bold text-muted-foreground tracking-widest opacity-70">Scheduled Settlement</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Protocol Status",
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
              className="text-red-600 focus:text-red-700 focus:bg-red-50"
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
