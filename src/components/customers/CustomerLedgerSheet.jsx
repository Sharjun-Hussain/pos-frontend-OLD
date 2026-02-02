"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  ReceiptText, Calendar, Plus, ChevronRight, Filter, 
  Download, ArrowUpRight, ArrowDownLeft, Wallet, Loader2 
} from "lucide-react";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export function CustomerLedgerSheet({ customer, open, onOpenChange, accessToken }) {
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleLoading, setSettleLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [chequeDetails, setChequeDetails] = useState({
    bank_name: "",
    cheque_number: "",
    cheque_date: format(new Date(), "yyyy-MM-dd"),
    payee_payor_name: "",
  });

  const { formatCurrency, formatDate } = useAppSettings();

  const fetchLedger = async () => {
    if (!customer || !accessToken) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${customer.id}/ledger`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        setLedgerData(result.data.ledger);
        setCurrentBalance(result.data.current_balance);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && customer) {
      fetchLedger();
    }
  }, [open, customer]);

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount"));
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const payload = {
      amount,
      payment_method: paymentMethod,
      description: formData.get("description"),
      transaction_date: new Date().toISOString(),
      cheque_details: paymentMethod === "cheque" ? chequeDetails : null,
    };

    try {
      setSettleLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${customer.id}/payments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (result.status === "success") {
        toast.success("Payment recorded successfully");
        setSettleOpen(false);
        fetchLedger();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to record payment");
    } finally {
      setSettleLoading(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-2xl font-bold">{customer?.name}</SheetTitle>
                <SheetDescription>Transaction history and ledger</SheetDescription>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Running Balance</p>
                <p className={`text-2xl font-bold ${currentBalance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatCurrency(Math.abs(currentBalance))}
                  <span className="text-xs ml-1">{currentBalance > 0 ? "(Receivable)" : "(Credit)"}</span>
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Transactions</h3>
              <Button size="sm" onClick={() => setSettleOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Wallet className="h-4 w-4" /> Settle Account
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-[100px]">Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit (+)</TableHead>
                      <TableHead className="text-right">Credit (-)</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      ledgerData.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="text-[10px]">{formatDate(t.transaction_date)}</TableCell>
                          <TableCell>
                            <div className="text-[11px] font-medium leading-none">{t.description}</div>
                            <div className="text-[10px] text-muted-foreground mt-1 capitalize">{t.reference_type}</div>
                          </TableCell>
                          <TableCell className="text-right text-red-600 text-xs font-medium">
                            {t.type === "debit" ? formatCurrency(t.amount).replace(/^[^\d\s]+\s/, '') : "-"}
                          </TableCell>
                          <TableCell className="text-right text-emerald-600 text-xs font-medium">
                            {t.type === "credit" ? formatCurrency(t.amount).replace(/^[^\d\s]+\s/, '') : "-"}
                          </TableCell>
                          <TableCell className="text-right font-bold text-xs">
                            {formatCurrency(t.balance).replace(/^[^\d\s]+\s/, '')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Customer Payment</DialogTitle>
            <DialogDescription>
              Record a payment received from {customer?.name}. This will decrease their outstanding balance.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSettleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right text-sm">Amount</Label>
              <Input 
                id="amount" 
                name="amount" 
                type="number" 
                step="0.01" 
                defaultValue={Math.abs(currentBalance)} 
                className="col-span-3 h-9" 
                required 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment_method" className="text-right text-sm">Method</Label>
              <Select name="payment_method" value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="col-span-3 h-9">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "cheque" && (
              <div className="grid gap-3 p-3 bg-amber-50/50 rounded-lg border border-amber-100 mt-1">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-[10px] uppercase font-bold text-amber-700">Bank</Label>
                  <Input 
                    value={chequeDetails.bank_name} 
                    onChange={(e) => setChequeDetails({...chequeDetails, bank_name: e.target.value})}
                    placeholder="Bank Name" 
                    className="col-span-3 h-8 text-xs bg-white border-amber-200" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-[10px] uppercase font-bold text-amber-700">Cheque #</Label>
                  <Input 
                    value={chequeDetails.cheque_number} 
                    onChange={(e) => setChequeDetails({...chequeDetails, cheque_number: e.target.value})}
                    placeholder="Cheque Number" 
                    className="col-span-3 h-8 text-xs bg-white border-amber-200" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-[10px] uppercase font-bold text-amber-700">Date</Label>
                  <Input 
                    type="date"
                    value={chequeDetails.cheque_date} 
                    onChange={(e) => setChequeDetails({...chequeDetails, cheque_date: e.target.value})}
                    className="col-span-3 h-8 text-xs bg-white border-amber-200" 
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right text-sm">Note</Label>
              <Input id="description" name="description" placeholder="Payment for INV..." className="col-span-3 h-9" />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setSettleOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={settleLoading} size="sm" className="bg-blue-600 hover:bg-blue-700">
                {settleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
