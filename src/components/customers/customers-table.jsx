"use client";

import { Edit, Trash2, Mail, Phone, MapPin, ReceiptText, User, ChevronRight, Hash, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EditCustomerDialog } from "./edit-customer-dialog";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export function CustomersTable({ customers, onUpdate, onDelete, onViewLedger }) {
  const { canUpdate, canDelete } = usePermission();
  const { formatCurrency } = useAppSettings();
  const CUSTOMER = "customer";

  return (
    <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30 backdrop-blur-md">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="pl-8 py-5 text-[10px] font-black text-foreground uppercase tracking-widest">Client Identity</TableHead>
              <TableHead className="py-5 text-[10px] font-black text-foreground uppercase tracking-widest">Contact Portfolio</TableHead>
              <TableHead className="text-right py-5 text-[10px] font-black text-foreground uppercase tracking-widest">Asset Value</TableHead>
              <TableHead className="text-center py-5 text-[10px] font-black text-foreground uppercase tracking-widest">Loyalty Tier</TableHead>
              <TableHead className="text-center py-5 text-[10px] font-black text-foreground uppercase tracking-widest">Status</TableHead>
              <TableHead className="text-right pr-8 py-5 text-[10px] font-black text-foreground uppercase tracking-widest">Audit Protocols</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow className="border-border/20">
                <TableCell
                  colSpan={6}
                  className="h-72 text-center py-20"
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 rounded-full bg-muted/30 text-muted-foreground/20">
                      <User className="h-12 w-12" />
                    </div>
                    <div>
                      <h4 className="font-bold text-muted-foreground text-sm uppercase tracking-widest leading-6">No matching member profiles</h4>
                      <p className="text-xs text-muted-foreground/60 font-medium">Verify your filter parameters or register a new client.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-muted/30 group border-border/20 transition-all duration-300">
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-11 w-11 border border-border/40 shadow-sm group-hover:border-[#10b981]/50 transition-all duration-500">
                        <AvatarFallback className="bg-muted text-muted-foreground font-black uppercase text-xs group-hover:bg-[#10b981]/10 group-hover:text-[#10b981] transition-all">
                          {customer.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => onViewLedger(customer)}
                          className="text-[14px] font-black text-foreground tracking-tight hover:text-[#10b981] transition-colors text-left uppercase"
                        >
                          {customer.name}
                        </button>
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
                          <MapPin className="h-3 w-3" />
                          {customer.address?.split(",")[0] || "No Geographical Anchor"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/70">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground/30" />
                        {customer.email || "N/A"}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-black text-[#10b981] tabular-nums">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground/30" />
                        {customer.phone || "--- --- ----"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-5">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[14px] font-black text-[#10b981] tabular-nums tracking-tight">
                        {formatCurrency(parseFloat(customer.totalSpent || 0))}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                        {customer.visits || 0} Transactions
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-5">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-sm border-border/50",
                        customer.loyaltyPoints >= 1000 
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                          : "bg-muted/20 text-muted-foreground/60 border-border/40"
                      )}
                    >
                      {customer.loyaltyPoints || 0} pts
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-5">
                    <StatusBadge value={customer.is_active} className="h-6 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest border-none shadow-sm" />
                  </TableCell>
                  <TableCell className="text-right pr-8 py-5">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground/60 hover:text-[#10b981] hover:bg-[#10b981]/5 rounded-xl transition-all"
                        onClick={() => onViewLedger(customer)}
                        title="Audit Ledger"
                      >
                        <ReceiptText className="h-4.5 w-4.5" />
                      </Button>
                      {canUpdate(CUSTOMER) && (
                        <EditCustomerDialog
                          customer={customer}
                          onSave={(updates) => onUpdate(customer.id, updates)}
                        >
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-muted-foreground/60 hover:text-blue-500 hover:bg-blue-500/5 rounded-xl transition-all"
                          >
                            <Edit className="h-4.5 w-4.5" />
                          </Button>
                        </EditCustomerDialog>
                      )}
                      {canDelete(CUSTOMER) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                          onClick={() => onDelete(customer.id)}
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
