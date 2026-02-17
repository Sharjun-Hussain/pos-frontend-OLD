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
      <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col h-full bg-slate-50">
        {/* HEADER */}
        <div className="bg-white p-6 border-b border-slate-200 shrink-0">
          <div className="flex items-start gap-5">
            <Avatar className="h-16 w-16 rounded-xl border-2 border-slate-100 shadow-sm">
              <AvatarFallback className="bg-blue-600 text-white text-xl font-bold rounded-xl">
                {supplier.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div>
                   <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{supplier.name}</h2>
                   <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                     <Building className="h-3.5 w-3.5" /> {supplier.company_name || "Company Not Listed"}
                   </p>
                </div>
                <Badge variant={supplier.is_active ? "default" : "secondary"} className={supplier.is_active ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                    {supplier.is_active ? "Active Supplier" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md">
                    <Clock className="h-3.5 w-3.5" /> From {format(new Date(supplier.created_at || new Date()), "MMM yyyy")}
                </span>
                 <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md">
                    <Globe className="h-3.5 w-3.5" /> {supplier.city || "Unknown City"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6 bg-white border-b border-slate-200 shrink-0">
             <TabsList className="bg-transparent h-12 w-full justify-start gap-6 p-0">
                <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-0 font-medium text-slate-500 data-[state=active]:text-blue-600">
                    Overview
                </TabsTrigger>
                <TabsTrigger value="orders" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-0 font-medium text-slate-500 data-[state=active]:text-blue-600">
                    Purchase Orders
                </TabsTrigger>
                <TabsTrigger value="ledger" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-0 font-medium text-slate-500 data-[state=active]:text-blue-600">
                    Ledger & Payments
                </TabsTrigger>
             </TabsList>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden relative">
            <ScrollArea className="h-full w-full" scrollHideDelay={0}>
               <div className="p-6 pr-12 w-full max-w-full overflow-x-hidden border-box">
                
                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="mt-0 space-y-6">
                    {/* Contact Info Card */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-500" /> Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Person</span>
                                <p className="text-sm font-medium text-slate-900">{supplier.contact_person_name || "N/A"}</p>
                                <p className="text-xs text-slate-500">{supplier.contact_person_phone}</p>
                             </div>
                             <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Direct Phone</span>
                                <p className="text-sm font-medium text-slate-900">{supplier.phone || "N/A"}</p>
                             </div>
                             <div className="space-y-1 col-span-2">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</span>
                                <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-slate-400" /> {supplier.email || "No email provided"}
                                </p>
                             </div>
                              <div className="space-y-1 col-span-2">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Office Address</span>
                                <p className="text-sm font-medium text-slate-900 flex items-start gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5" /> 
                                    {supplier.address ? (
                                        <span>{supplier.address}, {supplier.city}</span>
                                    ) : "No address provided"}
                                </p>
                             </div>
                        </CardContent>
                    </Card>

                    {/* Bank Accounts Card */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-emerald-500" /> Bank Accounts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {supplier.bank_accounts && supplier.bank_accounts.length > 0 ? (
                                supplier.bank_accounts.map((acc, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{acc.bank_name}</p>
                                            <p className="text-xs text-slate-500">{acc.account_number}</p>
                                        </div>
                                        {acc.is_default && <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-600 bg-emerald-50">Default</Badge>}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 italic">No bank accounts linked.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ORDERS TAB */}
                <TabsContent value="orders" className="mt-0 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Purchase Orders</h3>
                        <Badge variant="outline" className="bg-white">{MOCK_ORDERS.length} records</Badge>
                    </div>
                    
                    {MOCK_ORDERS.map((order) => (
                        <div key={order.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-300 transition-colors cursor-pointer group">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{order.id}</p>
                                    <p className="text-xs text-slate-500">{order.date} • {order.items} Items</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-sm font-bold text-slate-900">LKR {order.amount.toLocaleString()}</p>
                                <Badge variant="secondary" className={`text-[10px] ${order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {order.status}
                                </Badge>
                             </div>
                        </div>
                    ))}
                </TabsContent>

                {/* LEDGER TAB */}
                <TabsContent value="ledger" className="mt-0">
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
        <div className="space-y-6 w-full max-w-full">
             {/* Balance Card - NEW DESIGN */}
             <div className={`rounded-xl p-6 text-white shadow-lg shadow-slate-200 overflow-hidden relative ${currentBalance > 0 ? "bg-linear-to-br from-orange-500 to-red-600" : "bg-linear-to-br from-emerald-500 to-teal-600"}`}>
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <p className="text-white/80 text-xs uppercase font-bold tracking-widest mb-1">
                            {currentBalance > 0 ? "Total Payable" : "Credit Balance"}
                        </p>
                        <h3 className="text-3xl font-black tracking-tight">
                            LKR {Math.abs(currentBalance).toLocaleString()}
                        </h3>
                    </div>
                     <div className="p-3 bg-white/20 backdrop-blur-md rounded-lg border border-white/10">
                        <Wallet className="h-6 w-6 text-white" />
                    </div>
                </div>
                 <div className="mt-4 relative z-10">
                    <Badge className="bg-white/20 backdrop-blur-md border-none text-white hover:bg-white/30 px-3 py-1">
                        {currentBalance > 0 ? "Outstanding Payment" : "Account in Good Standing"}
                    </Badge>
                 </div>
             </div>

             {/* Transactions List */}
             <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" /> Transaction History
                    </h4>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-slate-100">
                          <TableHead className="w-[120px] text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Date</TableHead>
                          <TableHead className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider min-w-[150px]">Description</TableHead>
                          <TableHead className="text-right text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Debit <span className="text-[9px] font-medium lowercase opacity-70">(In)</span></TableHead>
                          <TableHead className="text-right text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Credit <span className="text-[9px] font-medium lowercase opacity-70">(Out)</span></TableHead>
                          <TableHead className="text-right text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                           <TableRow>
                             <TableCell colSpan={5} className="h-40 text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                    <p className="text-xs text-slate-400 font-medium">Loading ledger...</p>
                                </div>
                             </TableCell>
                           </TableRow>
                        ) : ledgerData.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={5} className="h-40 text-center text-slate-400 text-sm">
                                 <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                    <FileText className="h-8 w-8" />
                                    <p>No transaction history found</p>
                                 </div>
                              </TableCell>
                           </TableRow>
                        ) : ( 
                            ledgerData.map((t) => (
                            <TableRow key={t.id} className="group hover:bg-slate-50 transition-colors border-slate-100">
                              <TableCell className="font-medium text-slate-700 text-xs whitespace-nowrap">
                                  {format(new Date(t.transaction_date), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-start gap-3 min-w-[180px]">
                                    <div className={`mt-0.5 p-1.5 rounded-md ${t.type === 'debit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                        {t.type === 'debit' ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-700 leading-snug mb-1">{t.description}</div>
                                        <Badge variant="outline" className="text-[10px] text-slate-500 font-bold bg-slate-50 border-slate-200 px-1.5 py-0 h-5">
                                            {t.reference_type}
                                        </Badge>
                                    </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                 {t.type === 'debit' && (
                                     <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-md">
                                         + {t.amount.toLocaleString()}
                                     </span>
                                 )}
                              </TableCell>
                               <TableCell className="text-right whitespace-nowrap">
                                 {t.type === 'credit' && (
                                     <span className="text-red-600 font-bold text-sm bg-red-50 px-2 py-1 rounded-md">
                                         - {t.amount.toLocaleString()}
                                     </span>
                                 )}
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                 <span className="font-black text-slate-700 text-sm">
                                    {t.balance.toLocaleString()}
                                 </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                </div>
             </div>
        </div>
    );
}
