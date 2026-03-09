"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  CreditCard,
  FileText,
  TrendingUp,
  TrendingDown,
  Globe,
  Wallet,
  User,
  ShieldCheck,
  Zap,
  Building2,
  CheckCircle2,
  X,
  Briefcase,
  Activity
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SupplierLedgerSheet } from "./SupplierLedgerSheet"; // Reuse existing ledger logic inside the tab (will refactor slightly to be a tab content)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

// Mock Data for Orders (Replace with real API later)
const MOCK_ORDERS = [
  { id: "PO-2024-001", date: "2024-02-15", status: "Completed", amount: 150000, items: 5 },
  { id: "PO-2024-002", date: "2024-02-10", status: "Pending", amount: 45000, items: 2 },
  { id: "PO-2024-003", date: "2024-01-28", status: "Completed", amount: 320000, items: 12 },
];

export function SupplierDetailSheet({ supplier, open, onOpenChange, accessToken }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!supplier) return null;

  // We'll treat the SupplierLedgerSheet as a controlled component content here
  // Note: The original SupplierLedgerSheet is a Sheet itself. We need to extract its content or use it creatively.
  // Ideally, we should refactor SupplierLedgerSheet to export its content separately.
  // For now, let's create a wrapper or just use the logic if we can't easily refactor.
  // Actually, I'll recommend we refactor SupplierLedgerSheet later. 
  // For this step, I will reconstruct the Ledger view inside this sheet to ensure seamless integration without nested sheets.
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col h-full border-l border-emerald-500/20 backdrop-blur-3xl bg-white/95 dark:bg-slate-950/95 shadow-2xl overflow-hidden">
        {/* PREMIUM HEADER WITH PATTERN */}
        <div className="relative shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-emerald-600 opacity-[0.03] dark:opacity-[0.05]" 
               style={{backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`, backgroundSize: '20px 20px'}} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative p-8 border-b border-emerald-500/10">
            <div className="flex items-start gap-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-emerald-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <Avatar className="h-20 w-20 rounded-2xl border-2 border-emerald-500/10 shadow-xl relative z-10">
                  <AvatarFallback className="bg-emerald-600 text-white text-2xl font-black rounded-2xl shadow-inner">
                    {supplier.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <h2 className="text-3xl font-black text-foreground tracking-tight leading-none">{supplier.name}</h2>
                     <div className="flex items-center gap-2">
                       <span className="p-1 rounded-md bg-emerald-500/10">
                          <Briefcase className="h-3 w-3 text-emerald-600" />
                       </span>
                       <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                         {supplier.company_name || "Enterprise Partner"}
                       </p>
                     </div>
                  </div>
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-600/20 px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest">
                      {supplier.is_active ? "Operational" : "Suspended"}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10 group hover:border-emerald-500/30 transition-all">
                      <Clock className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Partner since {format(new Date(supplier.created_at || new Date()), "MMM yyyy")}</span>
                  </div>
                   <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10 group hover:border-emerald-500/30 transition-all">
                      <Globe className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider text-emerald-600">{supplier.city || "Strategic Location"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-8 bg-transparent border-b border-emerald-500/10 shrink-0">
             <TabsList className="bg-transparent h-14 w-full justify-start gap-8 p-0">
                <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none h-full px-0 font-bold text-[11px] uppercase tracking-widest text-muted-foreground data-[state=active]:text-emerald-700 transition-all">
                    Core Intelligence
                </TabsTrigger>
                <TabsTrigger value="orders" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none h-full px-0 font-bold text-[11px] uppercase tracking-widest text-muted-foreground data-[state=active]:text-emerald-700 transition-all">
                    Procurement Trail
                </TabsTrigger>
                <TabsTrigger value="ledger" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none h-full px-0 font-bold text-[11px] uppercase tracking-widest text-muted-foreground data-[state=active]:text-emerald-700 transition-all">
                    Financial Ledger
                </TabsTrigger>
             </TabsList>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden relative bg-background">
            <ScrollArea className="h-full w-full" scrollHideDelay={0}>
               <div className="p-6 w-full max-w-full box-border">
                
                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="mt-0 space-y-6">
                    {/* Contact Info Card */}
                    <Card className="shadow-2xl shadow-emerald-500/5 border-emerald-500/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl overflow-hidden">
                        <CardHeader className="pb-4 border-b border-emerald-500/10 bg-emerald-500/5">
                            <CardTitle className="text-xs font-black text-emerald-800 dark:text-emerald-500 flex items-center gap-2 uppercase tracking-widest">
                                <User className="h-4 w-4" /> Global Contact Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-2 gap-6">
                             <div className="space-y-1.5 p-4 rounded-xl bg-background/40 border border-emerald-500/5">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Procurement Officer</span>
                                <p className="text-sm font-bold text-foreground leading-none">{supplier.contact_person_name || "Enterprise Standard"}</p>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-emerald-600 font-semibold">
                                    <Phone className="h-3 w-3" /> {supplier.contact_person_phone || "No direct line"}
                                </div>
                             </div>
                             <div className="space-y-1.5 p-4 rounded-xl bg-background/40 border border-emerald-500/5">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Primary Switchboard</span>
                                <p className="text-sm font-bold text-foreground leading-none">{supplier.phone || "Corporate Only"}</p>
                                <div className="h-3.5" /> {/* Spacer */}
                             </div>
                             <div className="space-y-1.5 col-span-2 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 group hover:border-emerald-500/30 transition-all">
                                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Electronic Mail Delivery</span>
                                <p className="text-sm font-bold text-foreground flex items-center gap-2 mt-1 blur-[0.2px] group-hover:blur-0 transition-all">
                                    <Mail className="h-4 w-4 text-emerald-500" /> {supplier.email || "No digital records"}
                                </p>
                             </div>
                              <div className="space-y-1.5 col-span-2 p-4 rounded-xl bg-background/40 border border-emerald-500/5">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Operational Headquarters</span>
                                <div className="flex items-start gap-3 mt-1">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
                                      <MapPin className="h-4 w-4 text-emerald-600" /> 
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-foreground leading-snug">
                                          {supplier.address ? `${supplier.address}, ${supplier.city}` : "Strategic Location Pending"}
                                      </p>
                                      <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mt-1">Verified Logistics Hub</p>
                                    </div>
                                </div>
                             </div>
                        </CardContent>
                    </Card>

                    {/* Bank Accounts Card */}
                    <Card className="shadow-2xl shadow-emerald-500/5 border-emerald-500/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl overflow-hidden">
                        <CardHeader className="pb-4 border-b border-emerald-500/10 bg-emerald-500/[0.02]">
                            <CardTitle className="text-xs font-black text-emerald-800 dark:text-emerald-500 flex items-center gap-2 uppercase tracking-widest">
                                <Building2 className="h-4 w-4" /> Settlement Channels
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {supplier.bank_accounts && supplier.bank_accounts.length > 0 ? (
                                supplier.bank_accounts.map((acc, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-background/40 rounded-xl border border-emerald-500/5 group hover:border-emerald-500/20 transition-all shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                              <CreditCard className="h-5 w-5" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-black text-foreground">{acc.bank_name}</p>
                                              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{acc.account_number}</p>
                                            </div>
                                        </div>
                                        {acc.is_default && (
                                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Primary</span>
                                          </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center bg-background/20 rounded-xl border border-dashed border-emerald-500/10">
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest italic opacity-40">No strategic accounts linked</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ORDERS TAB */}
                <TabsContent value="orders" className="mt-0 space-y-4">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-emerald-500" />
                          <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Procurement Pipeline</h3>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-none font-bold text-[9px] uppercase tracking-widest">{MOCK_ORDERS.length} Transactions</Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {MOCK_ORDERS.map((order) => (
                          <div key={order.id} className="group relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm p-5 rounded-2xl border border-emerald-500/5 hover:border-emerald-500/20 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 overflow-hidden">
                               <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                               <div className="relative z-10 flex items-center justify-between gap-4">
                                   <div className="flex items-center gap-5">
                                      <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                                          <FileText className="h-6 w-6" />
                                      </div>
                                      <div>
                                          <p className="text-base font-black text-foreground tracking-tight group-hover:text-emerald-700 transition-colors uppercase">{order.id}</p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{order.date}</p>
                                            <span className="w-1 h-1 rounded-full bg-border" />
                                            <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest">{order.items} Line Items</p>
                                          </div>
                                      </div>
                                   </div>
                                   <div className="text-right space-y-1.5">
                                      <p className="text-lg font-black text-foreground tracking-tight">LKR {order.amount.toLocaleString()}</p>
                                      <Badge className={`text-[9px] font-black uppercase tracking-[0.15em] border-none px-3 py-1 rounded-full shadow-sm ${order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-amber-500/10 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'} transition-all`}>
                                          {order.status}
                                      </Badge>
                                   </div>
                               </div>
                          </div>
                      ))}
                    </div>
                </TabsContent>

                {/* LEDGER TAB */}
                <TabsContent value="ledger" className="mt-0 space-y-4">
                   {/* We Reuse the logic from SupplierLedgerSheet Content here, 
                       but since we can't easily import the *content* of a Sheet, 
                       we will render the component but control its visibility via the tab.
                       However, SupplierLedgerSheet is a Dialog/Sheet itself. 
                       
                       Strategy: We will duplicate the Ledger Logic component here for now to ensure perfect embedding 
                       without double-modals, OR we modify SupplierLedgerSheet to export its inner content.
                       
                       For this implementation, I will simply render a placeholder that says "Ledger integration coming" 
                       or use the existing one but wrapped nicely? 
                       
                       Actually, the best way is to Import the SupplierLedgerSheet and use it? No, that opens another sheet.
                       
                       Let's extract the ledger logic. Since I cannot edit two files at once to refactor,
                       I will use the *Logic* I read from SupplierLedgerSheet.jsx and re-implement the UI here 
                       to be embedded in the tab. This provides the best UX.
                   */}
                   <EmbeddedLedger supplier={supplier} accessToken={accessToken} />
                </TabsContent>

             </div>
          </ScrollArea>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// --- EMBEDDED LEDGER COMPONENT (Re-implemented for Tab View) ---
import { Loader2, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect as useLedgerEffect } from "react";

function EmbeddedLedger({ supplier, accessToken }) {
    const [ledgerData, setLedgerData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentBalance, setCurrentBalance] = useState(0);

    const fetchLedger = async () => {
        if (!supplier || !accessToken) return;
        try {
          setLoading(true);
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${supplier.id}/ledger`,
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
        } finally {
          setLoading(false);
        }
    };

    useLedgerEffect(() => {
        fetchLedger();
    }, [supplier]);

    return (
        <div className="space-y-6 w-full relative">
             {/* Balance Card - NEW DESIGN */}
              <div className={`rounded-2xl p-8 text-white shadow-2xl overflow-hidden relative group/balance transition-all hover:scale-[1.01] ${currentBalance > 0 ? "bg-linear-to-br from-orange-500 to-red-600 shadow-orange-500/20" : "bg-linear-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20"}`}>
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-[60px] group-hover:scale-150 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-black/10 rounded-full blur-[40px]" />
                
                <div className="relative z-10 flex justify-between items-center gap-6">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           <ShieldCheck className="h-3.5 w-3.5 text-white/60" />
                           <p className="text-white/70 text-[10px] uppercase font-black tracking-[0.2em]">
                               Strategic Settlement Scope
                           </p>
                        </div>
                        <h3 className="text-4xl font-black tracking-tighter truncate drop-shadow-md">
                            LKR {Math.abs(currentBalance).toLocaleString()}
                        </h3>
                    </div>
                     <div className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-inner group-hover:rotate-3 transition-transform">
                        <Wallet className="h-8 w-8 text-white" />
                    </div>
                </div>
                 <div className="mt-6 flex items-center justify-between relative z-10">
                    <Badge className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all">
                        {currentBalance > 0 ? "Outstanding Liability" : "Financial Surplus"}
                    </Badge>
                    <div className="flex items-center gap-2 text-white/60 text-[10px] font-bold uppercase tracking-widest">
                       <Zap className="h-3 w-3" /> Real-time Analytics
                    </div>
                 </div>
              </div>

             {/* Transactions List */}
            <div className="flex w-100">
               <div className="border border-border/50 rounded-xl bg-card shadow-sm overflow-">
                <div className="p-4 border-b border-border/30 bg-muted/20 flex items-center justify-between">
                    <h4 className="font-bold text-foreground text-sm uppercase tracking-wide flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground/60" /> Transaction History
                    </h4>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/30">
                          <TableHead className="w-[120px] text-[11px] font-extrabold text-muted-foreground/60 uppercase tracking-wider">Date</TableHead>
                          <TableHead className="text-[11px] font-extrabold text-muted-foreground/60 uppercase tracking-wider">Description</TableHead>
                          <TableHead className="text-right text-[11px] font-extrabold text-muted-foreground/60 uppercase tracking-wider">Debit <span className="text-[9px] font-medium lowercase opacity-70">(In)</span></TableHead>
                          <TableHead className="text-right text-[11px] font-extrabold text-muted-foreground/60 uppercase tracking-wider">Credit <span className="text-[9px] font-medium lowercase opacity-70">(Out)</span></TableHead>
                          <TableHead className="text-right text-[11px] font-extrabold text-muted-foreground/60 uppercase tracking-wider">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                           <TableRow>
                             <TableCell colSpan={5} className="h-40 text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                                    <p className="text-xs text-muted-foreground/60 font-medium">Loading ledger...</p>
                                </div>
                             </TableCell>
                           </TableRow>
                        ) : ledgerData.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={5} className="h-40 text-center text-muted-foreground/60 text-sm">
                                 <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                    <FileText className="h-8 w-8" />
                                    <p>No transaction history found</p>
                                 </div>
                              </TableCell>
                           </TableRow>
                        ) : ( 
                            ledgerData.map((t) => (
                            <TableRow key={t.id} className="group hover:bg-muted/30 transition-colors border-border/30">
                              <TableCell className="font-medium text-foreground text-xs">
                                  {format(new Date(t.transaction_date), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell>
                                 <div className="flex items-start gap-3">
                                     <div className={`mt-0.5 p-1.5 rounded-md ${t.type === 'debit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {t.type === 'debit' ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-foreground leading-snug mb-1">{t.description}</div>
                                        <Badge variant="outline" className="text-[10px] text-muted-foreground font-bold bg-muted/30 border-border/50 px-1.5 py-0 h-5">
                                            {t.reference_type}
                                        </Badge>
                                    </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                 {t.type === 'debit' && (
                                      <span className="text-emerald-500 font-bold text-sm bg-emerald-500/10 px-2 py-1 rounded-md">
                                          + {t.amount.toLocaleString()}
                                      </span>
                                 )}
                              </TableCell>
                               <TableCell className="text-right">
                                 {t.type === 'credit' && (
                                      <span className="text-red-500 font-bold text-sm bg-red-500/10 px-2 py-1 rounded-md">
                                          - {t.amount.toLocaleString()}
                                      </span>
                                 )}
                              </TableCell>
                              <TableCell className="text-right">
                                 <span className="font-black text-foreground text-sm">
                                    {t.balance.toLocaleString()}
                                 </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                </div>
             </div>    </div>     
        </div>
    );
}
