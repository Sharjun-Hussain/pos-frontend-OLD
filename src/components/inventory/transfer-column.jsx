"use client";

import { Calendar, ChevronRight, User, FileText, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const getTransferColumns = ({ onOpenDetails }) => [
  {
    accessorKey: "transfer_number",
    header: "Transfer Info",
    cell: ({ row }) => {
      const transfer = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-black text-foreground text-sm tracking-tight">
            {transfer.transfer_number}
          </span>
          <span className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1 mt-0.5">
            <Calendar className="h-2.5 w-2.5" />
            {format(new Date(transfer.transfer_date), "MMM dd, yyyy")}
          </span>
        </div>
      );
    },
    // We filter by transfer_number usually
  },
  {
    accessorKey: "route",
    header: "Routes",
    cell: ({ row }) => {
      const transfer = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
              From
            </span>
            <span className="text-xs font-bold text-foreground">
              {transfer.from_branch?.name}
            </span>
          </div>
          <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
              To
            </span>
            <span className="text-xs font-bold text-emerald-600">
              {transfer.to_branch?.name}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const transfer = row.original;
      return (
        <div className="flex justify-center">
          <Badge
            className={cn(
              "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5",
              transfer.status === "completed"
                ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
                : transfer.status === "pending"
                ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20"
                : "bg-muted text-muted-foreground hover:bg-muted border-border"
            )}
            variant="outline"
          >
            {transfer.status}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "user",
    header: "By",
    cell: ({ row }) => {
      const transfer = row.original;
      return (
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-muted flex items-center justify-center">
            <User className="h-3 w-3 text-muted-foreground" />
          </div>
          <span className="text-xs font-medium text-foreground">
            {transfer.user?.name}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Action</div>,
    cell: ({ row }) => {
      const transfer = row.original;
      return (
        <div className="flex justify-end pr-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-muted-foreground hover:text-emerald-600"
            onClick={() => onOpenDetails(transfer.id)}
          >
            <FileText className="h-4 w-4" />
            Details
          </Button>
        </div>
      );
    },
  },
];
