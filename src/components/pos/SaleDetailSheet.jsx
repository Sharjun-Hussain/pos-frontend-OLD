"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer, Calendar, User, Hash, CreditCard, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SaleDetailSheet = ({ isOpen, onOpenChange, sale, onReprint }) => {
  if (!sale) return null;

  const subtotal = parseFloat(sale.total_amount || 0);
  const tax = parseFloat(sale.tax_amount || 0);
  const discount = parseFloat(sale.discount_amount || 0);
  const adjustment = parseFloat(sale.adjustment || 0);
  const payable = parseFloat(sale.payable_amount || 0);
  const paid = parseFloat(sale.paid_amount || 0);
  const balance = paid > 0 ? paid - payable : 0;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] flex flex-col h-full p-0 overflow-hidden border-l border-slate-200">
        {/* --- Premium Header --- */}
        <SheetHeader className="relative p-8 bg-slate-900 text-white shrink-0 overflow-hidden">
          {/* Subtle background pattern/shape */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-blue-600 rounded-md">
                  <Hash className="h-4 w-4 text-white" />
                </div>
                <span className="text-[10px] font-black tracking-[0.2em] text-blue-400 uppercase">Transaction ID</span>
              </div>
              <SheetTitle className="text-3xl font-black text-white tracking-tight">
                {sale.invoice_number}
              </SheetTitle>
              <SheetDescription className="text-slate-400 font-medium tracking-wide">
                Processed on {new Date(sale.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </SheetDescription>
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <Badge className={cn(
                "px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow-lg",
                sale.payment_status === 'paid' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"
              )}>
                {sale.payment_status || 'COMPLETED'}
              </Badge>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Amount</p>
                <p className="text-2xl font-black text-blue-400 tracking-tighter">
                  LKR {payable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 bg-white min-h-0">
          <div className="p-8 space-y-10">
            {/* --- Info Grid --- */}
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Profile</h4>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-800">{sale.customer?.name || "Walk-in Customer"}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    {sale.customer?.phone || "No contact provided"}
                  </p>
                  {sale.customer?.email && <p className="text-sm text-slate-500">{sale.customer.email}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px]">
                        {sale.payment_method || 'CASH'}
                    </Badge>
                    <span className="text-xs text-slate-400 font-medium">via {sale.cashier?.name || 'Main POS'}</span>
                  </div>
                  <p className="text-xs text-slate-500 italic">
                    Reference: {sale.payment_reference ||'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* --- Items Table --- */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Items</h4>
                  <Badge variant="outline" className="text-[9px] font-bold py-0">{sale.items?.length || 0} ITEMS</Badge>
              </div>
              
              <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="h-10 text-[10px] font-bold text-slate-500 uppercase px-4">Description</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold text-slate-500 uppercase text-center w-20">Qty</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold text-slate-500 uppercase text-right w-24">Unit</TableHead>
                      <TableHead className="h-10 text-[10px] font-bold text-slate-500 uppercase text-right w-28 px-4">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items?.map((item, idx) => (
                      <TableRow key={idx} className="border-slate-50 group hover:bg-slate-50/50 transition-colors">
                        <TableCell className="py-4 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] font-bold text-slate-800 leading-tight">
                              {item.product?.name}
                            </span>
                            {item.variant?.name && (
                              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                {item.variant.name}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                            {parseFloat(item.quantity).toFixed(0)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-right text-[12px] text-slate-500 font-medium">
                          {parseFloat(item.unit_price).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-4 text-right px-4">
                          <span className="text-[13px] font-bold text-slate-900">
                            {(parseFloat(item.unit_price) * parseFloat(item.quantity)).toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* --- Financial Summary --- */}
            <div className="bg-slate-50/80 rounded-2xl p-6 space-y-4 border border-slate-100">
              <div className="space-y-3 pb-4 border-b border-white">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Gross Subtotal</span>
                  <span className="font-bold text-slate-800">LKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Instant Discount</span>
                  <span className="font-bold text-red-500">- LKR {discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Applied Tax</span>
                  <span className="font-bold text-slate-800">LKR {tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-2">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Final Payable</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">LKR {payable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Amount Paid</h3>
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-sm font-black px-4 py-1">
                    LKR {paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Badge>
                </div>
              </div>
              
              {balance > 0 && (
                <div className="pt-3 border-t border-white flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Change Return</span>
                  <span className="text-sm font-black text-blue-600">LKR {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* --- Sticky Footer --- */}
        <div className="p-6 bg-white border-t border-slate-100 flex gap-4 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
          <Button
            className="flex-1 bg-slate-900 hover:bg-black text-white h-12 rounded-xl font-bold gap-2 shadow-lg transition-all active:scale-[0.98]"
            onClick={() => onReprint(sale)}
          >
            <Printer className="h-4 w-4" />
            REPRINT TAX INVOICE
          </Button>
          <Button
            variant="outline"
            className="h-12 w-12 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-red-500 transition-all active:scale-[0.98]"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SaleDetailSheet;
