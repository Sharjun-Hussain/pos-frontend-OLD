"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function SalesReturnDialog({ open, onOpenChange, sale, onSuccess }) {
  const { data: session } = useSession();
  const [returnItems, setReturnItems] = useState([]);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sale && sale.items) {
      setReturnItems(
        sale.items.map((item) => ({
          ...item,
          return_qty: 0,
          selected: false,
          reason: "",
        }))
      );
      setRefundAmount(0);
      setNotes("");
    }
  }, [sale]);

  const handleCheckboxChange = (id) => {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newSelected = !item.selected;
          return {
            ...item,
            selected: newSelected,
            return_qty: newSelected ? item.quantity : 0,
          };
        }
        return item;
      })
    );
  };

  const handleQtyChange = (id, val) => {
    const qty = parseFloat(val) || 0;
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          // Cap at original quantity
          const finalQty = Math.min(qty, parseFloat(item.quantity));
          return { ...item, return_qty: finalQty, selected: finalQty > 0 };
        }
        return item;
      })
    );
  };

  // Calculate suggested refund (total of selected items)
  const totalReturnVal = returnItems
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.return_qty * (parseFloat(item.unit_price) || parseFloat(item.price)), 0);

  useEffect(() => {
    setRefundAmount(totalReturnVal);
  }, [totalReturnVal]);

  const handleSubmit = async () => {
    const itemsToReturn = returnItems.filter((item) => item.selected && item.return_qty > 0);
    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/returns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
        },
        body: JSON.stringify({
          sale_id: sale.id,
          items: itemsToReturn.map((item) => ({
            product_id: item.product_id,
            product_variant_id: item.product_variant_id,
            quantity: item.return_qty,
            reason: item.reason,
          })),
          refund_amount: refundAmount,
          refund_method: refundMethod,
          notes,
        }),
      });

      const result = await response.json();
      if (result.status === "success") {
        toast.success("Sales return processed successfully");
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error(result.message || "Failed to process return");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-7xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-600" />
            Process Sales Return
          </DialogTitle>
          <DialogDescription>
            Original Invoice: <span className="font-mono font-bold text-slate-900">{sale.invoice_number}</span> | Customer: {sale.customer?.name || "Walk-in"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Purchased</TableHead>
                <TableHead className="text-center w-32">Return Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnItems.map((item) => (
                <TableRow key={item.id} className={item.selected ? "bg-orange-50/30" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => handleCheckboxChange(item.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.product?.name}</div>
                    {item.variant?.name && <div className="text-xs text-slate-500">{item.variant.name}</div>}
                  </TableCell>
                  <TableCell className="text-center">{parseFloat(item.quantity).toFixed(0)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      size="sm"
                      className="h-8 text-center"
                      value={item.return_qty}
                      onChange={(e) => handleQtyChange(item.id, e.target.value)}
                      disabled={!item.selected}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {(parseFloat(item.unit_price) || parseFloat(item.price)).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {(item.return_qty * (parseFloat(item.unit_price) || parseFloat(item.price))).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Notes / Reason for Return</Label>
                <textarea
                  className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 text-sm"
                  placeholder="Defective, wrong item, change of mind..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Total Return Value</span>
                <span className="text-lg font-bold">LKR {totalReturnVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="space-y-2">
                <Label>Refund Amount (Actual Handed Back)</Label>
                <Input
                  type="number"
                  className="text-lg font-bold"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                />
                <p className="text-[10px] text-slate-500">
                  {refundAmount < totalReturnVal ? 
                    "Partial refund: Remaining will adjust credit/AR." : 
                    "Full refund of returned value."}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Refund Method</Label>
                <Select value={refundMethod} onValueChange={setRefundMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="store_credit">Store Credit / Customer Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t items-center shadow-inner">
           <div className="flex-1 text-sm text-slate-500 flex items-center gap-2">
             <AlertTriangle className="h-4 w-4 text-orange-500" />
             Restoring {returnItems.filter(i=>i.selected).length} items to stock.
           </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            className="bg-orange-600 hover:bg-orange-700 font-bold px-8"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
            Confirm Return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
