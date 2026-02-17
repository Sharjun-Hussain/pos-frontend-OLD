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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle
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

  const fetchOrders = async () => {
    if (!customer || !accessToken) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/sales?customer_id=${customer.id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
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
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
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
      if (activeTab === "overview") fetchLedger(); // Need balance for overview too
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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl p-0 overflow-hidden flex flex-col h-full border-l border-slate-200">
          {/* --- Premium Header --- */}
          <SheetHeader className="relative p-8 bg-blue-600 text-white shrink-0 overflow-hidden">
             {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />

            <div className="flex justify-between items-start relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <div className="p-1.5 bg-blue-500 rounded-md">
                      <Wallet className="h-4 w-4 text-white" />
                   </div>
                   <span className="text-[10px] font-black tracking-[0.2em] text-blue-100 uppercase">Customer Ledger</span>
                </div>
                <SheetTitle className="text-2xl font-black text-white">{customer?.name}</SheetTitle>
                <SheetDescription className="text-blue-100 font-medium">Transaction history and balance portfolio</SheetDescription>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Running Balance</p>
                <p className={`text-2xl font-black ${currentBalance > 0 ? "text-red-300" : "text-emerald-300"}`}>
                  {formatCurrency(Math.abs(currentBalance))}
                </p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentBalance > 0 ? "bg-red-500/20 text-red-100" : "bg-emerald-500/20 text-emerald-100"}`}>
                    {currentBalance > 0 ? "RECEIVABLE" : "CREDIT"}
                </span>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto bg-slate-50/50">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="bg-white border-b px-8">
                <TabsList className="flex gap-8 bg-transparent p-0 h-14 border-none">
                  {[
                    { id: "overview", label: "Overview", icon: User },
                    { id: "orders", label: "Orders", icon: ShoppingBag },
                    { id: "ledger", label: "Ledger", icon: ReceiptText },
                    { id: "items", label: "Items", icon: Package },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 shadow-none text-[12px] font-bold uppercase tracking-widest transition-all"
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="p-8">
                <TabsContent value="overview" className="mt-0 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Profile Information</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg"><Mail className="h-4 w-4 text-slate-500" /></div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Email Address</p>
                            <p className="text-sm font-semibold text-slate-900">{customer?.email || "No email registered"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg"><Phone className="h-4 w-4 text-slate-500" /></div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                            <p className="text-sm font-semibold text-slate-900">{customer?.phone || "No phone registered"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg"><MapPin className="h-4 w-4 text-slate-500" /></div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Primary Address</p>
                            <p className="text-sm font-semibold text-slate-900">{customer?.address || "No address provided"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Financial Summary</h4>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-500">Total Spent</span>
                          <span className="text-base font-black text-slate-900">{formatCurrency(customer?.totalSpent || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-500">Loyalty Points</span>
                          <Badge className="bg-amber-100 text-amber-700 font-bold border-amber-200">{customer?.loyaltyPoints || 0} PTS</Badge>
                        </div>
                        <Separator />
                        <div className="pt-2 flex justify-between items-end">
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                              <Badge className={customer?.is_active ? "bg-emerald-500" : "bg-slate-400"}>{customer?.is_active ? "ACTIVE" : "INACTIVE"}</Badge>
                           </div>
                           <Button onClick={() => setSettleOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-10 gap-2">
                              <Wallet className="h-4 w-4" /> Settle Balance
                           </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="orders" className="mt-0">
                  {loading && ordersData.length === 0 ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-6">Invoice #</TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Date</TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-500 uppercase text-center">Status</TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-500 uppercase text-right px-6">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(!Array.isArray(ordersData) || ordersData.length === 0) ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400 font-medium">No orders found</TableCell></TableRow>
                          ) : (
                            ordersData.map((order) => (
                              <>
                                <TableRow key={order.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => toggleOrderItems(order.id)}>
                                  <TableCell className="pl-4">
                                      {expandedOrders.has(order.id) ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                  </TableCell>
                                  <TableCell className="px-6 py-4 font-black text-blue-600 text-[13px]">{order.invoice_number}</TableCell>
                                  <TableCell className="py-4 text-slate-600 text-[12px]">{formatDate(order.sale_date)}</TableCell>
                                  <TableCell className="py-4 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                          <Badge className={cn(
                                              "text-[9px] uppercase font-bold text-white border-none",
                                              order.payment_status === "paid" ? "bg-emerald-500" : "bg-red-500"
                                          )}>
                                              {order.payment_status}
                                          </Badge>
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                              {order.status || 'COMPLETED'}
                                          </span>
                                      </div>
                                  </TableCell>
                                  <TableCell className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(order.total_amount)}</TableCell>
                                </TableRow>
                                {expandedOrders.has(order.id) && (
                                    <TableRow className="bg-slate-50/30">
                                        <TableCell colSpan={5} className="p-0">
                                            <div className="px-10 py-4 bg-white/50 animate-in slide-in-from-top-2 duration-200">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Package className="h-3 w-3 text-blue-500" />
                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</h5>
                                                </div>
                                                {itemLoadingMap[order.id] ? (
                                                    <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-blue-600" /></div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {orderItemsMap[order.id]?.map((item, i) => (
                                                            <div key={i} className="flex items-center justify-between text-[12px] py-1 border-b border-slate-100 last:border-0">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-bold text-slate-700">{item.product_name}</span>
                                                                    <span className="text-slate-400">x{item.quantity}</span>
                                                                </div>
                                                                <span className="font-semibold text-slate-600">{formatCurrency(item.total_price)}</span>
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

                <TabsContent value="ledger" className="mt-0 space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-900 border-l-4 border-blue-600 pl-3">Transaction History</h3>
                    <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200">
                      <Download className="h-3.5 w-3.5" /> Export Ledger
                    </Button>
                  </div>
                  {loading && ledgerData.length === 0 ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow>
                            <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-6">Date</TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-500 uppercase">Description</TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-500 uppercase text-right">Debit</TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-500 uppercase text-right">Credit</TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-500 uppercase text-right px-6">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ledgerData.map((t) => (
                            <TableRow key={t.id} className="hover:bg-slate-50 transition-colors">
                              <TableCell className="px-6 py-4 text-[11px] font-medium text-slate-500">{formatDate(t.transaction_date)}</TableCell>
                              <TableCell className="py-4">
                                <p className="text-[12px] font-bold text-slate-800 leading-none">{t.description}</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{t.reference_type}</p>
                              </TableCell>
                              <TableCell className="py-4 text-right text-red-600 text-[12px] font-bold">
                                {t.type === "debit" ? formatCurrency(t.amount).replace(/^[^\d\s]+\s/, '') : "-"}
                              </TableCell>
                              <TableCell className="py-4 text-right text-emerald-600 text-[12px] font-bold">
                                {t.type === "credit" ? formatCurrency(t.amount).replace(/^[^\d\s]+\s/, '') : "-"}
                              </TableCell>
                              <TableCell className="px-6 py-4 text-right font-black text-slate-900 text-[12px]">
                                {formatCurrency(t.balance).replace(/^[^\d\s]+\s/, '')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="items" className="mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    {(!Array.isArray(itemsData) || itemsData.length === 0) ? (
                      <div className="col-span-2 text-center py-12 text-slate-400 font-medium">No item history found</div>
                    ) : (
                      itemsData.map((item, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                              <Package className="h-5 w-5" />
                            </div>
                            <div>
                               <p className="text-[13px] font-bold text-slate-900">{item.product_name}</p>
                               <p className="text-[11px] text-slate-500 font-medium">Purchased {item.purchase_count} times</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Bought</p>
                            <p className="text-[12px] font-bold text-slate-700">{formatDate(item.last_purchase_date)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
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
