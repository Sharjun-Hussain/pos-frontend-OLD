"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Landmark, 
  Calendar, 
  User, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  X,
  CreditCard,
  Building2,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export function ChequeDetailsSheet({ open, onOpenChange, cheque }) {
  if (!cheque) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case "cleared":
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
            <CheckCircle2 className="size-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Cleared</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 shadow-sm shadow-amber-500/5">
            <Clock className="size-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Pending</span>
          </div>
        );
      case "bounced":
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20 shadow-sm shadow-red-500/5">
            <AlertCircle className="size-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Bounced</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20 shadow-sm shadow-slate-500/5">
            <Activity className="size-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">{status}</span>
          </div>
        );
    }
  };

  const DetailItem = ({ icon: Icon, label, value, subValue, highlight }) => (
    <div className="flex items-start gap-4 group">
      <div className={cn(
        "size-10 rounded-xl flex items-center justify-center border transition-all duration-300",
        highlight 
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-500 shadow-sm shadow-emerald-500/10" 
          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 group-hover:border-slate-300 dark:group-hover:border-slate-700"
      )}>
        <Icon className="size-4.5" />
      </div>
      <div className="flex flex-col space-y-0.5 pt-0.5">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
        <div className="flex flex-col">
            <span className={cn(
                "font-bold tracking-tight text-slate-900 dark:text-foreground",
                highlight ? "text-lg" : "text-sm"
            )}>
                {value}
            </span>
            {subValue && (
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5 italic">
                    {subValue}
                </span>
            )}
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background/95 backdrop-blur-xl border-l border-border [&>button]:hidden overflow-hidden">
        {/* Elite Header */}
        <div className="px-8 py-7 border-b border-border/40 relative overflow-hidden shrink-0 bg-background/50 backdrop-blur-md">
          <div className="absolute top-0 right-0 p-16 -mr-20 -mt-20 bg-emerald-500/5 rounded-full blur-3xl opacity-60" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="group relative">
                    <div className="absolute -inset-1 bg-emerald-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                    <div className="relative size-11 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                      <Landmark className="size-5.5 text-emerald-600" />
                    </div>
                </div>
                <div className="flex flex-col text-left">
                  <SheetTitle className="text-xl font-bold tracking-tight text-foreground leading-tight">Cheque Details</SheetTitle>
                </div>
            </div>

            <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-10 w-10 rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-200 group"
            >
                <X className="size-5 transition-transform group-hover:rotate-90 duration-300" />
            </Button>
          </div>
        </div>

        {/* Magnitude Hero Section */}
        <div className="px-8 py-6 bg-emerald-500/2 border-b border-emerald-500/5 shrink-0 flex flex-col items-center">
             <span className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mb-1.5">Cheque Amount</span>
             <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-400 dark:text-slate-600">LKR</span>
                {parseFloat(cheque.amount).toLocaleString()}
             </h2>
             <div className="mt-4 flex flex-wrap justify-center gap-2">
                {getStatusBadge(cheque.status)}
                <Badge variant="outline" className={cn(
                    "rounded-full px-3 py-1 border text-[10px] font-bold uppercase tracking-widest",
                    cheque.type === "receivable" 
                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20" 
                        : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20"
                )}>
                    {cheque.type === "receivable" ? "Customer Cheque" : "Supplier Cheque"}
                </Badge>
             </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 thin-scrollbar">
            
            <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Information</h4>
                <div className="grid grid-cols-1 gap-6">
                    <DetailItem 
                        icon={Building2} 
                        label="Bank" 
                        value={cheque.bank_name} 
                    />
                    <DetailItem 
                        icon={CreditCard} 
                        label="Cheque Number" 
                        value={cheque.cheque_number} 
                        highlight
                    />
                    <DetailItem 
                        icon={User} 
                        label={cheque.type === "receivable" ? "From Customer" : "To Supplier"} 
                        value={cheque.payee_payor_name || "N/A"} 
                    />
                    <DetailItem 
                        icon={Calendar} 
                        label="Cheque Date" 
                        value={format(new Date(cheque.cheque_date), "PPP")} 
                    />
                </div>
            </div>

            {cheque.remarks && (
                <div className="space-y-4 pt-4">
                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] pl-1">Remarks</h4>
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative group overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/30 group-hover:bg-emerald-500 transition-colors duration-300" />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 italic">
                            "{cheque.remarks}"
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-4 pt-4">
                 <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] pl-1">System Records</h4>
                 <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/40">
                        <div className="flex items-center gap-3">
                            <Receipt className="size-4 text-muted-foreground" />
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">Record ID</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-border/60">CHR-{cheque.id.toString().padStart(6, '0')}</span>
                    </div>
                 </div>
            </div>
        </div>


      </SheetContent>
    </Sheet>
  );
}
