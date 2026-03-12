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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Download, ArrowUpRight, ArrowDownLeft, Wallet, Loader2,
  Package, ShoppingBag, User, Mail, Phone, MapPin,
  ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, Star,
  TrendingUp, Activity,
} from "lucide-react";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

export function CustomerLedgerSheet({ customer, open, onOpenChange, accessToken }) {
  const [ledgerData, setLedgerData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [itemsData, setItemsData] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [orderItemsMap, setOrderItemsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [itemLoadingMap, setItemLoadingMap] = useState({});
  const [currentBalance, setCurrentBalance] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
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

  const fetchOrders = async () => {
    if (!customer || !accessToken) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/sales?customer_id=${customer.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const result = await response.json();
      if (result.status === "success") {
        setOrdersData(Array.isArray(result.data?.data) ? result.data.data : (Array.isArray(result.data) ? result.data : []));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchasedItems = async () => {
    if (!customer || !accessToken) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${customer.id}/purchased-items`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const result = await response.json();
      if (result.status === "success") {
        setItemsData(Array.isArray(result.data) ? result.data : (Array.isArray(result.data?.data) ? result.data.data : []));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderItems = async (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
      if (!orderItemsMap[orderId]) {
        try {
          setItemLoadingMap(prev => ({ ...prev, [orderId]: true }));
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/${orderId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const result = await res.json();
          if (result.status === "success") {
            setOrderItemsMap(prev => ({ ...prev, [orderId]: result.data.items }));
          }
        } catch (err) {
          console.error("Failed to fetch order items:", err);
          toast.error("Could not load items");
        } finally {
          setItemLoadingMap(prev => ({ ...prev, [orderId]: false }));
        }
      }
    }
    setExpandedOrders(newExpanded);
  };

  useEffect(() => {
    if (open && customer) {
      if (activeTab === "ledger") fetchLedger();
      if (activeTab === "orders") fetchOrders();
      if (activeTab === "items") fetchPurchasedItems();
      if (activeTab === "overview") fetchLedger();
    }
  }, [open, customer, activeTab]);

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

  const isReceivable = currentBalance > 0;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl p-0 overflow-hidden flex flex-col h-full border-l border-border/20 bg-background">

          {/* ─── PREMIUM HEADER ─── */}
          <SheetHeader className="relative p-8 bg-[#10b981] text-white shrink-0 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0zMHY2aC02VjRoNnptMjQgMjR2NmgtNnYtNmg2em0tMjQgMHY2aC02di02aDZ6bTAtMjR2NmgtNlY0aDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full blur-3xl -ml-16 -mb-16" />

            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-white/20 shadow-lg">
                  <AvatarFallback className="bg-white/10 text-white font-black text-lg uppercase">
                    {customer?.name?.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1 bg-white/10 rounded-md">
                      <Wallet className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-[10px] font-black tracking-[0.2em] text-emerald-100 uppercase">Customer Ledger</span>
                  </div>
                  <SheetTitle className="text-2xl font-black text-white tracking-tight">{customer?.name}</SheetTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={cn("text-[9px] font-black uppercase border-none px-2 py-0.5",
                      customer?.is_active ? "bg-white/20 text-white" : "bg-black/20 text-emerald-200"
                    )}>
                      {customer?.is_active ? "ACTIVE MEMBER" : "INACTIVE"}
                    </Badge>
                    {(customer?.loyaltyPoints || 0) >= 1000 && (
                      <Badge className="text-[9px] font-black uppercase border-none px-2 py-0.5 bg-amber-500/30 text-amber-200 flex items-center gap-1">
                        <Star className="h-2.5 w-2.5" /> VIP Tier
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Running Balance</p>
                <p className={cn("text-2xl font-black tabular-nums", isReceivable ? "text-red-200" : "text-white")}>
                  {formatCurrency(Math.abs(currentBalance))}
                </p>
                <span className={cn(
                  "text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest mt-1 inline-block",
                  isReceivable ? "bg-red-500/20 text-red-100" : "bg-white/20 text-white"
                )}>
                  {isReceivable ? "RECEIVABLE" : "IN CREDIT"}
                </span>
              </div>
            </div>
          </SheetHeader>

          {/* ─── TABS ─── */}
          <div className="flex-1 overflow-hidden flex flex-col bg-background">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 overflow-hidden">
              <div className="bg-card/80 backdrop-blur-md border-b border-border/30 px-6 shrink-0">
                <TabsList className="flex gap-2 bg-transparent p-0 h-14 border-none">
                  {[
                    { id: "overview", label: "Overview", icon: User },
                    { id: "orders", label: "Orders", icon: ShoppingBag },
                    { id: "ledger", label: "Ledger", icon: ReceiptText },
                    { id: "items", label: "Items", icon: Package },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-[#10b981] data-[state=active]:bg-transparent data-[state=active]:text-[#10b981] shadow-none text-[11px] font-black uppercase tracking-widest transition-all text-muted-foreground"
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-6 md:p-8">

                  {/* ─── OVERVIEW TAB ─── */}
                  <TabsContent value="overview" className="mt-0 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Profile Info */}
                      <div className="space-y-4 bg-card rounded-2xl border border-border/20 p-6 shadow-sm">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-[#10b981]" />
                          Profile Identity
                        </h4>
                        <div className="space-y-4">
                          {[
                            { icon: Mail, label: "Email Address", value: customer?.email || "No email registered" },
                            { icon: Phone, label: "Phone Number", value: customer?.phone || "No phone registered" },
                            { icon: MapPin, label: "Primary Address", value: customer?.address || "No address provided" },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="p-2 bg-[#10b981]/10 rounded-xl border border-[#10b981]/20 text-[#10b981]">
                                <item.icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">{item.label}</p>
                                <p className="text-sm font-bold text-foreground mt-0.5">{item.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div className="bg-card rounded-2xl border border-border/20 p-6 shadow-sm space-y-4">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 text-[#10b981]" />
                          Financial Summary
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-2 border-b border-border/20">
                            <span className="text-sm font-bold text-muted-foreground">Lifetime Value</span>
                            <span className="text-base font-black text-[#10b981] tabular-nums">{formatCurrency(customer?.totalSpent || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-border/20">
                            <span className="text-sm font-bold text-muted-foreground">Loyalty Points</span>
                            <Badge className={cn(
                              "font-black border-none text-[10px]",
                              (customer?.loyaltyPoints || 0) >= 1000
                                ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"
                            )}>
                              {customer?.loyaltyPoints || 0} PTS
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-border/20">
                            <span className="text-sm font-bold text-muted-foreground">Total Visits</span>
                            <span className="text-sm font-black text-foreground tabular-nums">{customer?.visits || 0}</span>
                          </div>
                          <div className="pt-2 flex justify-between items-center">
                            <div>
                              <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Account Status</p>
                              <Badge className={cn("font-black border-none text-[9px] uppercase", customer?.is_active ? "bg-[#10b981]/10 text-[#10b981]" : "bg-muted text-muted-foreground")}>
                                {customer?.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <Button onClick={() => setSettleOpen(true)} className="bg-[#10b981] hover:bg-[#059669] text-white h-10 gap-2 rounded-xl font-bold text-xs uppercase tracking-widest border-none shadow-lg shadow-[#10b981]/20 transition-all active:scale-95">
                              <Wallet className="h-4 w-4" /> Settle Balance
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* ─── ORDERS TAB ─── */}
                  <TabsContent value="orders" className="mt-0">
                    {loading && ordersData.length === 0 ? (
                      <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#10b981]" /></div>
                    ) : (
                      <div className="bg-card rounded-2xl border border-border/20 overflow-hidden shadow-sm">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow className="border-border/30 hover:bg-transparent">
                              <TableHead className="w-10 pl-4"></TableHead>
                              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Invoice #</TableHead>
                              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date</TableHead>
                              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Status</TableHead>
                              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right px-4">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(!Array.isArray(ordersData) || ordersData.length === 0) ? (
                              <TableRow className="border-border/20">
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground/40 font-bold text-sm uppercase tracking-widest">No orders found</TableCell>
                              </TableRow>
                            ) : (
                              ordersData.map((order) => (
                                <>
                                  <TableRow key={order.id} className="hover:bg-muted/20 transition-colors cursor-pointer group border-border/20" onClick={() => toggleOrderItems(order.id)}>
                                    <TableCell className="pl-4">
                                      {expandedOrders.has(order.id)
                                        ? <ChevronUp className="h-4 w-4 text-[#10b981]" />
                                        : <ChevronDown className="h-4 w-4 text-muted-foreground/40" />}
                                    </TableCell>
                                    <TableCell className="px-4 py-4 font-black text-[#10b981] text-[13px] tabular-nums">{order.invoice_number}</TableCell>
                                    <TableCell className="py-4 text-muted-foreground text-[12px] font-medium">{formatDate(order.sale_date)}</TableCell>
                                    <TableCell className="py-4 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                        <Badge className={cn(
                                          "text-[9px] uppercase font-black border-none px-2 py-0.5",
                                          order.payment_status === "paid" ? "bg-[#10b981]/10 text-[#10b981]" : "bg-red-500/10 text-red-500"
                                        )}>
                                          {order.payment_status}
                                        </Badge>
                                        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                                          {order.status || 'COMPLETED'}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 text-right font-black text-foreground tabular-nums">{formatCurrency(order.total_amount)}</TableCell>
                                  </TableRow>
                                  {expandedOrders.has(order.id) && (
                                    <TableRow className="bg-muted/10 border-border/10">
                                      <TableCell colSpan={5} className="p-0">
                                        <div className="px-12 py-4 animate-in slide-in-from-top-2 duration-200">
                                          <div className="flex items-center gap-2 mb-3">
                                            <Package className="h-3 w-3 text-[#10b981]" />
                                            <h5 className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Order Line Items</h5>
                                          </div>
                                          {itemLoadingMap[order.id] ? (
                                            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-[#10b981]" /></div>
                                          ) : (
                                            <div className="space-y-2">
                                              {orderItemsMap[order.id]?.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between text-[12px] py-2 border-b border-border/10 last:border-0">
                                                  <div className="flex items-center gap-3">
                                                    <span className="font-bold text-foreground">{item.product_name}</span>
                                                    <Badge variant="outline" className="text-[9px] font-black border-border/30 text-muted-foreground">x{item.quantity}</Badge>
                                                  </div>
                                                  <span className="font-black text-[#10b981] tabular-nums">{formatCurrency(item.total_price)}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>

                  {/* ─── LEDGER TAB ─── */}
                  <TabsContent value="ledger" className="mt-0 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black text-foreground border-l-4 border-[#10b981] pl-3 uppercase tracking-widest">Transaction History</h3>
                      <Button variant="outline" size="sm" className="h-9 gap-2 border-border/40 text-muted-foreground hover:text-[#10b981] rounded-xl font-bold text-xs uppercase tracking-widest">
                        <Download className="h-3.5 w-3.5" /> Export
                      </Button>
                    </div>
                    {loading && ledgerData.length === 0 ? (
                      <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#10b981]" /></div>
                    ) : (
                      <div className="bg-card rounded-2xl border border-border/20 overflow-hidden shadow-sm">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow className="border-border/30 hover:bg-transparent">
                              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">Date</TableHead>
                              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description</TableHead>
                              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Debit</TableHead>
                              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Credit</TableHead>
                              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right px-4">Balance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ledgerData.length === 0 ? (
                              <TableRow className="border-border/20">
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground/40 font-bold text-sm uppercase tracking-widest">No transactions found</TableCell>
                              </TableRow>
                            ) : (
                              ledgerData.map((t) => (
                                <TableRow key={t.id} className="hover:bg-muted/20 transition-colors border-border/10">
                                  <TableCell className="px-4 py-4 text-[11px] font-medium text-muted-foreground">{formatDate(t.transaction_date)}</TableCell>
                                  <TableCell className="py-4">
                                    <p className="text-[12px] font-bold text-foreground leading-none">{t.description}</p>
                                    <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-wider">{t.reference_type}</p>
                                  </TableCell>
                                  <TableCell className="py-4 text-right text-red-500 text-[12px] font-black tabular-nums">
                                    {t.type === "debit" ? formatCurrency(t.amount) : "—"}
                                  </TableCell>
                                  <TableCell className="py-4 text-right text-[#10b981] text-[12px] font-black tabular-nums">
                                    {t.type === "credit" ? formatCurrency(t.amount) : "—"}
                                  </TableCell>
                                  <TableCell className="px-4 py-4 text-right font-black text-foreground text-[12px] tabular-nums">
                                    {formatCurrency(t.balance)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>

                  {/* ─── ITEMS TAB ─── */}
                  <TabsContent value="items" className="mt-0">
                    {loading && itemsData.length === 0 ? (
                      <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#10b981]" /></div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(!Array.isArray(itemsData) || itemsData.length === 0) ? (
                          <div className="col-span-2 text-center py-16 text-muted-foreground/40 font-bold text-sm uppercase tracking-widest">No item history found</div>
                        ) : (
                          itemsData.map((item, idx) => (
                            <div key={idx} className="bg-card p-4 rounded-xl border border-border/20 flex items-center justify-between group hover:border-[#10b981]/30 hover:bg-[#10b981]/5 transition-all shadow-sm">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground/30 group-hover:bg-[#10b981]/10 group-hover:text-[#10b981] transition-all">
                                  <Package className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-[13px] font-black text-foreground">{item.product_name}</p>
                                  <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider">Purchased {item.purchase_count}×</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Last Bought</p>
                                <p className="text-[11px] font-black text-foreground mt-0.5">{formatDate(item.last_purchase_date)}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </TabsContent>

                </div>
              </div>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── SETTLEMENT DIALOG ─── */}
      <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/20">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#10b981]/10 rounded-xl border border-[#10b981]/20 text-[#10b981]">
                <Wallet className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-black text-foreground">Record Customer Payment</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground/70 font-medium">
              Record a payment received from <span className="font-black text-foreground">{customer?.name}</span>. This will decrease their outstanding balance.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSettleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Amount</Label>
              <Input
                id="amount" name="amount" type="number" step="0.01"
                defaultValue={Math.abs(currentBalance)}
                className="h-11 bg-background/50 border-border/40 rounded-xl focus:border-[#10b981] font-bold tabular-nums"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Payment Method</Label>
              <Select name="payment_method" value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-11 bg-background/50 border-border/40 rounded-xl font-bold">
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
              <div className="grid gap-3 p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Cheque Details</p>
                {[
                  { label: "Bank Name", key: "bank_name", placeholder: "e.g. Commercial Bank" },
                  { label: "Cheque Number", key: "cheque_number", placeholder: "e.g. 123456" },
                ].map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest">{f.label}</Label>
                    <Input
                      value={chequeDetails[f.key]}
                      onChange={(e) => setChequeDetails({ ...chequeDetails, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="h-9 text-xs bg-background border-amber-500/20 rounded-lg focus:border-amber-500"
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest">Cheque Date</Label>
                  <Input
                    type="date"
                    value={chequeDetails.cheque_date}
                    onChange={(e) => setChequeDetails({ ...chequeDetails, cheque_date: e.target.value })}
                    className="h-9 text-xs bg-background border-amber-500/20 rounded-lg focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Note</Label>
              <Input id="description" name="description" placeholder="Payment for INV-..." className="h-11 bg-background/50 border-border/40 rounded-xl font-medium" />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSettleOpen(false)} className="rounded-xl border-border/40 font-bold text-xs uppercase tracking-widest">
                Cancel
              </Button>
              <Button type="submit" disabled={settleLoading} size="sm" className="bg-[#10b981] hover:bg-[#059669] text-white rounded-xl font-bold text-xs uppercase tracking-widest border-none shadow-lg shadow-[#10b981]/20 transition-all active:scale-95">
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
