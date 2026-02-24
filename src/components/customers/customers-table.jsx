"use client";

import { Edit, Trash2, Mail, Phone, MapPin, ReceiptText, User, ChevronRight, Hash } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditCustomerDialog } from "./edit-customer-dialog";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";

export function CustomersTable({ customers, onUpdate, onDelete, onViewLedger }) {
  const { canUpdate, canDelete } = usePermission();
  const CUSTOMER = "customer";
  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/50 border-b border-slate-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Client Profile</TableHead>
              <TableHead className="py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Identity</TableHead>
              <TableHead className="text-right py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Revenue</TableHead>
              <TableHead className="text-center py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Loyalty</TableHead>
              <TableHead className="text-center py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</TableHead>
              <TableHead className="text-right pr-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Audit Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-64 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                    <User className="h-12 w-12 text-slate-300" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No matching customer profiles</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-slate-50 group border-b border-slate-50 transition-colors">
                  <TableCell className="pl-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-[13px] font-black text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <button 
                          onClick={() => onViewLedger(customer)}
                          className="text-[14px] font-black text-slate-900 leading-tight hover:text-blue-600 transition-colors text-left"
                        >
                          {customer.name}
                        </button>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <MapPin className="h-3 w-3" />
                          {customer.address?.split(",")[0] || "No primary address"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {customer.email || "No email registered"}
                      </div>
                      <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {customer.phone || "No contact digits"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[14px] font-black text-slate-900 tracking-tight">
                        LKR {parseFloat(customer.totalSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {customer.visits || 0} Transactions
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-sm",
                        customer.loyaltyPoints >= 500 
                          ? "bg-amber-50 text-amber-600 border-amber-100" 
                          : "bg-slate-50 text-slate-500 border-slate-100"
                      )}
                    >
                      {customer.loyaltyPoints || 0} pts
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <StatusBadge value={customer.is_active} />
                  </TableCell>
                  <TableCell className="text-right pr-8 py-4">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl"
                        onClick={() => onViewLedger(customer)}
                        title="Audit Ledger"
                      >
                        <ReceiptText className="h-4 w-4" />
                      </Button>
                      {canUpdate(CUSTOMER) && (
                        <EditCustomerDialog
                          customer={customer}
                          onSave={(updates) => onUpdate(customer.id, updates)}
                        >
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </EditCustomerDialog>
                      )}
                      {canDelete(CUSTOMER) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                          onClick={() => onDelete(customer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
