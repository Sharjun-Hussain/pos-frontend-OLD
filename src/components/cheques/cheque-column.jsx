"use client";

import { Badge } from "@/components/ui/badge";
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
    cell: ({ row }) => <span className="font-medium">{row.getValue("cheque_number")}</span>,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type");
      return (
        <Badge variant={type === "receivable" ? "success" : "warning"} className="capitalize">
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "bank_name",
    header: "Bank",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      return <span className="font-bold">LKR {amount.toLocaleString()}</span>;
    },
  },
  {
    accessorKey: "cheque_date",
    header: "Cheque Date",
    cell: ({ row }) => format(new Date(row.getValue("cheque_date")), "dd MMM yyyy"),
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
