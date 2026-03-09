"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Loader2,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  CreditCard,
  Building2,
  Activity,
  ShieldCheck,
  Zap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SupplierLedgerSheet({ supplier, open, onOpenChange, accessToken }) {
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleLoading, setSettleLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [chequeDetails, setChequeDetails] = useState({
    bank_name: "",
    cheque_number: "",
    cheque_date: "",
    payee_payor_name: "",
  });

  const fetchLedger = async () => {
    if (!supplier || !accessToken) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${supplier.id}/ledger`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
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
    if (open && supplier) fetchLedger();
  }, [open, supplier]);

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      amount: parseFloat(formData.get("amount")),
      payment_method: paymentMethod,
      description: formData.get("description"),
      transaction_date: new Date().toISOString(),
      cheque_details: paymentMethod === "cheque" ? chequeDetails : null,
    };

    try {
      setSettleLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${supplier.id}/payments`,
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

  const isPayable = currentBalance > 0;

  return (
    <>
      {/* ━━━━━━━━ LEDGER SHEET ━━━━━━━━ */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col h-full border-l border-emerald-500/20 backdrop-blur-3xl bg-white/95 dark:bg-slate-950/95 shadow-2xl overflow-hidden">
          
          {/* PREMIUM HEADER WITH PATTERN */}
          <div className="relative shrink-0 overflow-hidden bg-card/30">
            <div className="absolute inset-0 bg-emerald-600 opacity-[0.03] dark:opacity-[0.05]" 
                 style={{backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`, backgroundSize: '20px 20px'}} />
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className="relative p-8 border-b border-emerald-500/10">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-emerald-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                    <Avatar className="h-16 w-16 rounded-2xl border-2 border-emerald-500/10 shadow-xl relative z-10">
                      <AvatarFallback className="bg-emerald-600 text-white text-xl font-black rounded-2xl shadow-inner">
                        {supplier?.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <h2 className="text-2xl font-black text-foreground tracking-tight leading-none mb-1">
                      {supplier?.name}
                    </h2>
                    <div className="flex items-center gap-2">
                       <span className="p-1 rounded-md bg-emerald-500/10">
                          <Activity className="h-3 w-3 text-emerald-600" />
                       </span>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                         Financial Execution Trail
                       </p>
                    </div>
                    
                    {/* Balance pill */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all",
                        isPayable 
                          ? "bg-red-500/5 border-red-500/10 text-red-600 shadow-sm shadow-red-500/5" 
                          : "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 shadow-sm shadow-emerald-500/5"
                      )}>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Balance:</span>
                        <span className="text-sm font-black tracking-tight">LKR {Math.abs(currentBalance).toLocaleString()}</span>
                        <Badge className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-0 border-none",
                          isPayable ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"
                        )}>
                          {isPayable ? "Payable" : "Prepaid"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settle Button */}
                <Button
                  onClick={() => setSettleOpen(true)}
                  className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white gap-3 rounded-2xl h-14 px-6 font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <Wallet className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  Settle Dues
                </Button>
              </div>
            </div>
          </div>

          {/* ── Transaction Table ── */}
          <div className="flex-1 min-h-0 relative">
            <ScrollArea className="h-full">
              <div className="p-8">
                {/* Section title */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <FileText className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">
                      Strategic Execution Log
                    </h3>
                  </div>
                  {!loading && (
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/5 text-emerald-700 border-emerald-500/10 px-3 py-1 rounded-full">
                      {ledgerData.length} Records Detected
                    </Badge>
                  )}
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                      <Loader2 className="h-10 w-10 animate-spin text-emerald-600 relative z-10" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest animate-pulse">Syncing Financial Core...</p>
                  </div>
                ) : ledgerData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50 grayscale">
                    <div className="p-6 rounded-3xl bg-emerald-500/5 border border-dashed border-emerald-500/20">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">No transaction trail established</p>
                  </div>
                ) : (
                  <div className="border border-emerald-500/10 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md overflow-hidden shadow-xl shadow-emerald-500/5">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent border-emerald-500/10 bg-emerald-500/5">
                            <TableHead className="text-[10px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest py-4 px-6">Timestamp</TableHead>
                            <TableHead className="text-[10px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest py-4 px-6">Operation Details</TableHead>
                            <TableHead className="text-right text-[10px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest py-4 px-6">Magnitude</TableHead>
                            <TableHead className="text-right text-[10px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest py-4 px-6">Net Exposure</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ledgerData.map((t) => (
                            <TableRow key={t.id} className="group hover:bg-emerald-500/5 transition-colors border-emerald-500/5">
                              <TableCell className="py-4 px-6">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-foreground">{format(new Date(t.transaction_date), "MMM dd, yyyy")}</span>
                                  <span className="text-[10px] text-muted-foreground/60 font-medium">{format(new Date(t.transaction_date), "HH:mm")}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-4 px-6">
                                <div className="flex items-center gap-4">
                                  <div
                                    className={cn(
                                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                      t.type === "debit"
                                        ? "bg-emerald-500/10 text-emerald-600 shadow-sm shadow-emerald-500/5"
                                        : "bg-red-500/10 text-red-600 shadow-sm shadow-red-500/5"
                                    )}
                                  >
                                    {t.type === "debit" ? (
                                      <ArrowDownLeft className="h-4 w-4" />
                                    ) : (
                                      <ArrowUpRight className="h-4 w-4" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-black text-foreground leading-none mb-1.5 truncate group-hover:text-emerald-700 transition-colors">
                                      {t.description}
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70 bg-muted/20 border-border/40 px-2 py-0 h-4"
                                    >
                                      {t.reference_type}
                                    </Badge>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-4 px-6">
                                <span
                                  className={cn(
                                    "font-black text-xs px-2.5 py-1 rounded-lg shadow-sm block w-fit ml-auto",
                                    t.type === "debit"
                                      ? "text-emerald-600 bg-emerald-500/10"
                                      : "text-red-600 bg-red-500/10"
                                  )}
                                >
                                  {t.type === "debit" ? "+" : "-"}{t.amount.toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="text-right py-4 px-6 font-black text-sm text-foreground tracking-tight">
                                {t.balance.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

        </SheetContent>
      </Sheet>

      {/* ━━━━━━━━ SETTLE PAYMENT DIALOG ━━━━━━━━ */}
      <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
        <DialogContent className="sm:max-w-xl border-emerald-500/20 backdrop-blur-3xl bg-white/95 dark:bg-slate-950/95 shadow-2xl p-0 overflow-hidden rounded-3xl">

          {/* Dialog Header with Pattern */}
          <div className="relative shrink-0 overflow-hidden bg-emerald-600 p-8">
            <div className="absolute inset-0 bg-white/10 opacity-20" 
                 style={{backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '15px 15px'}} />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
            
            <div className="relative z-10 flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 shadow-inner">
                <Wallet className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-2xl font-black text-white tracking-tight leading-none mb-1.5">
                  Strategic Settlement
                </DialogTitle>
                <DialogDescription className="text-white/70 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  Recipient: <span className="text-white bg-white/10 px-2 py-0.5 rounded-md">{supplier?.name}</span>
                </DialogDescription>
              </div>
            </div>

            {/* Balance Highlights */}
            <div className="relative z-10 mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Current Exposure</p>
                <p className="text-xl font-black text-white">LKR {Math.abs(currentBalance).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-black/10 backdrop-blur-md border border-white/5 flex flex-col justify-center">
                 <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Status</p>
                 <Badge className={cn(
                   "w-fit border-none font-black text-[9px] uppercase tracking-widest px-3 py-1",
                   isPayable ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                 )}>
                   {isPayable ? "Liability Active" : "Strategic Surplus"}
                 </Badge>
              </div>
            </div>
          </div>

          <form onSubmit={handleSettleSubmit}>
            <div className="p-8 space-y-8">
              
              {/* Amount Entry & Shortcuts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Execution Magnitude (LKR)</Label>
                  {isPayable && (
                    <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-700 px-2.5 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">
                      Total Coverage Available
                    </span>
                  )}
                </div>
                
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-600/40">LKR</div>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    defaultValue={Math.abs(currentBalance)}
                    className="h-20 pl-24 pr-8 text-3xl font-black rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/10 focus:border-emerald-500/40 focus:ring-emerald-500/5 transition-all shadow-inner"
                    required
                  />
                </div>

                {/* Magnitude Shortcuts */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Full Scope", val: Math.abs(currentBalance), style: "border-emerald-500/20 text-emerald-700 hover:bg-emerald-500 hover:text-white" },
                    { label: "50% Impact", val: Math.abs(currentBalance) * 0.5, style: "border-border/60 text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-700 hover:bg-emerald-500/5" },
                    { label: "Reset Buffer", val: 0, style: "border-border/60 text-muted-foreground hover:border-red-500/40 hover:text-red-700 hover:bg-red-500/5" },
                  ].map((s, i) => (
                    <Button 
                      key={i} 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.closest('form').querySelector('#amount');
                        if(input) input.value = s.val.toString();
                      }}
                      className={cn("h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all", s.style)}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Sourcing Channel</Label>
                 <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'cash', label: 'Cash Buffer', icon: Wallet },
                      { id: 'bank', label: 'Bank Pipeline', icon: Building2 },
                      { id: 'cheque', label: 'Deferred Slip', icon: CreditCard },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 group",
                          paymentMethod === m.id 
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-600/20" 
                            : "bg-background border-border/40 text-muted-foreground hover:border-emerald-500/30 hover:bg-emerald-500/5"
                        )}
                      >
                        <m.icon className={cn("h-6 w-6 transition-colors", paymentMethod === m.id ? "text-white" : "text-muted-foreground/60 group-hover:text-emerald-500")} />
                        <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{m.label}</span>
                      </button>
                    ))}
                 </div>
              </div>

              {/* Cheque Intelligence Details */}
              {paymentMethod === "cheque" && (
                <div className="space-y-4 p-6 bg-emerald-500/5 rounded-3xl border-2 border-dashed border-emerald-500/20 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Cheque Identification</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Origin Bank</Label>
                      <Input
                        value={chequeDetails.bank_name}
                        onChange={(e) => setChequeDetails({ ...chequeDetails, bank_name: e.target.value })}
                        placeholder="e.g. Strategic Bank"
                        className="h-11 text-xs font-bold bg-background border-2 border-border/40 rounded-xl focus:border-emerald-500/40 transition-all px-4"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Serial Number</Label>
                      <Input
                        value={chequeDetails.cheque_number}
                        onChange={(e) => setChequeDetails({ ...chequeDetails, cheque_number: e.target.value })}
                        placeholder="000000"
                        className="h-11 text-xs font-bold bg-background border-2 border-border/40 rounded-xl focus:border-emerald-500/40 transition-all px-4"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Maturity Date</Label>
                      <Input
                        type="date"
                        value={chequeDetails.cheque_date}
                        onChange={(e) => setChequeDetails({ ...chequeDetails, cheque_date: e.target.value })}
                        className="h-11 text-xs font-bold bg-background border-2 border-border/40 rounded-xl focus:border-emerald-500/40 transition-all px-4"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Operational Commentary */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Operational Commentary</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="e.g. Strategic reconciliation for PO-2024"
                  className="h-14 text-sm font-bold border-2 border-border/40 bg-background rounded-2xl px-5 focus:border-emerald-500/40 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Execution Footer */}
            <div className="p-8 pt-0 bg-transparent flex flex-col gap-3">
               <Button
                type="submit"
                disabled={settleLoading}
                className="w-full h-20 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {settleLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Zap className="h-6 w-6 group-hover:animate-bounce" />
                  )}
                  {settleLoading ? "Executing Core..." : "Finalize Execution"}
                </div>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSettleOpen(false)}
                className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/5 transition-all"
              >
                Abort Protocol
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
