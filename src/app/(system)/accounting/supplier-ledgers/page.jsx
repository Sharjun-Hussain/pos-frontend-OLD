'use client';

import { useState, useEffect ,useMemo} from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
    Loader2, ArrowUpRight, ArrowDownLeft, Search, 
    RotateCcw, Truck, FileText, Plus, User, 
    Check, ChevronsUpDown, History, TrendingUp, TrendingDown,
    Wallet, Building2, FileCheck, CreditCard, ShieldCheck, Zap,
    Activity
} from "lucide-react";
import { format } from 'date-fns';
import { 
    Popover, PopoverContent, PopoverTrigger 
} from '@/components/ui/popover';
import { 
    Command, CommandEmpty, CommandGroup, 
    CommandInput, CommandItem, CommandList 
} from '@/components/ui/command';
import { toast } from 'sonner';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';

export default function SupplierLedgersPage() {
    const { data: session } = useSession();
    const [suppliers, setSuppliers] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState(0);
    const [totalSettled, setTotalSettled] = useState(0);
    const [totalPurchased, setTotalPurchased] = useState(0);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [chequeDetails, setChequeDetails] = useState({
        bank_name: "",
        cheque_number: "",
        cheque_date: format(new Date(), "yyyy-MM-dd"),
        payee_payor_name: "",
    });

    useEffect(() => {
        if (session) {
            fetchSuppliers();
        }
    }, [session]);

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/active/list`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setSuppliers(response.data.data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const fetchLedger = async (supplierId) => {
        if (!supplierId) return;
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${supplierId}/ledger`, {
                params: { start_date: startDate, end_date: endDate },
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setLedger(response.data.data.ledger);
            setBalance(response.data.data.current_balance);

            // Calculate totals
            let settled = 0;
            let purchased = 0;
            response.data.data.ledger.forEach(item => {
                if (item.type === 'debit') settled += parseFloat(item.amount);
                else if (item.type === 'credit') purchased += parseFloat(item.amount);
            });
            setTotalSettled(settled);
            setTotalPurchased(purchased);
        } catch (error) {
            console.error('Error fetching ledger:', error);
            toast.error('Failed to fetch ledger');
        } finally {
            setLoading(false);
        }
    };

    const chartData = useMemo(() => {
        if (!ledger || ledger.length === 0) return [];
        
        const sorted = [...ledger].sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
        let runningBalance = 0;
        
        return sorted.map(item => {
            const amount = parseFloat(item.amount);
            if (item.type === 'credit') runningBalance += amount; // Purchasing increases payable
            else runningBalance -= amount; // Payment decreases payable
            
            return {
                date: format(new Date(item.transaction_date), 'MMM dd'),
                balance: runningBalance,
                amount: amount,
                type: item.type
            };
        });
    }, [ledger]);

    const stats = useMemo(() => {
        const settlementRatio = totalPurchased > 0 ? (totalSettled / totalPurchased) * 100 : 0;
        return {
            settlementRatio: settlementRatio.toFixed(1),
            health: settlementRatio > 80 ? "Healthy" : settlementRatio > 50 ? "Stable" : "Critical"
        };
    }, [totalPurchased, totalSettled]);

    // Clear payment state on close
    useEffect(() => {
        if (!paymentOpen) {
            setPaymentAmount(0);
        } else {
            setPaymentAmount(Math.abs(balance));
        }
    }, [paymentOpen, balance]);

    const handlePaymentSubmit = async (e) => {
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
            setPaymentLoading(true);
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${selectedSupplier}/payments`,
                payload,
                { headers: { Authorization: `Bearer ${session.accessToken}` } }
            );
            if (response.data.status === "success" || response.status === 201) {
                toast.success("Payment recorded successfully");
                setPaymentOpen(false);
                fetchLedger(selectedSupplier);
            }
        } catch (error) {
            console.error('Error recording payment:', error);
            toast.error(error.response?.data?.message || "Failed to record payment");
        } finally {
            setPaymentLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 min-h-screen bg-transparent">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <Truck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">Supplier Ledger</h1>
                        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] opacity-80">
                            Track accounts payable, settlement history and liability turnover
                        </p>
                    </div>
                </div>
            </div>

            {/* Supplier Selection & Filter Workspace */}
            <Card className="border-border/60 shadow-xl shadow-foreground/5 rounded-4xl overflow-hidden bg-card/50 backdrop-blur-sm border-dashed">
                <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col lg:flex-row gap-6 items-end">
                        {/* Supplier Selector */}
                        <div className="flex-[2] space-y-2.5 w-full">
                            <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Search className="h-3 w-3 text-emerald-500" />
                                Select Supplier Focus
                            </label>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-full h-14 justify-between bg-white dark:bg-muted/20 border-border rounded-2xl px-5 text-sm font-semibold shadow-sm transition-all focus:ring-4 focus:ring-emerald-500/10 active:scale-[0.99] border-2 hover:border-emerald-500/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                                <User className="h-4 w-4" />
                                            </div>
                                            {selectedSupplier
                                                ? suppliers.find((s) => String(s.id) === selectedSupplier)?.name
                                                : "CHOOSE A SUPPLIER..."}
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0 rounded-2xl overflow-hidden" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search supplier by name or phone..." className="h-12" />
                                        <CommandList className="max-h-[300px]">
                                            <CommandEmpty>No supplier found.</CommandEmpty>
                                            <CommandGroup>
                                                {suppliers.map((s) => (
                                                    <CommandItem
                                                        key={s.id}
                                                        value={s.name}
                                                        onSelect={() => {
                                                            setSelectedSupplier(String(s.id));
                                                            fetchLedger(String(s.id));
                                                            setOpen(false);
                                                        }}
                                                        className="py-3 px-4 flex items-center justify-between"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm uppercase">{s.name}</span>
                                                            <span className="text-[10px] text-muted-foreground">{s.phone || 'No phone recorded'}</span>
                                                        </div>
                                                        <Check
                                                            className={cn(
                                                                "h-4 w-4 text-emerald-500",
                                                                selectedSupplier === String(s.id) ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Date Filters */}
                        <div className="flex-1 space-y-2.5 w-full">
                            <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-[0.2em]">Purchase From</label>
                            <Input 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-14 bg-white dark:bg-muted/20 border-border rounded-2xl px-5 text-sm font-semibold shadow-sm transition-all focus:ring-4 focus:ring-emerald-500/10 border-2 hover:border-emerald-500/30" 
                            />
                        </div>
                        <div className="flex-1 space-y-2.5 w-full">
                            <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-[0.2em]">Purchase To</label>
                            <Input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-14 bg-white dark:bg-muted/20 border-border rounded-2xl px-5 text-sm font-semibold shadow-sm transition-all focus:ring-4 focus:ring-emerald-500/10 border-2 hover:border-emerald-500/30" 
                            />
                        </div>

                        {/* Actions */}
                        <Button 
                            variant="secondary" 
                            size="lg"
                            className="h-14 rounded-2xl px-10 border-2 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 font-bold text-xs uppercase tracking-widest gap-3 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                            onClick={() => fetchLedger(selectedSupplier)}
                            disabled={!selectedSupplier || loading}
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" />}
                            Sync Results
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {selectedSupplier && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Analytics Dashboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* High-Impact Trend Chart */}
                        <Card className="lg:col-span-3 border-border/60 shadow-2xl shadow-foreground/5 rounded-4xl overflow-hidden bg-white/70 dark:bg-card/40 backdrop-blur-xl relative">
                            <CardHeader className="p-8 md:p-10 border-b border-border/50">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1.5 text-left">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">Payable Dynamics</p>
                                        </div>
                                        <CardTitle className="text-3xl font-bold tracking-tight">Payable Trend</CardTitle>
                                        <CardDescription className="text-sm font-medium">Daily running balance for {suppliers.find(s => String(s.id) === selectedSupplier)?.name}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-right">
                                            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest leading-tight">Projected Liability</p>
                                            <p className="text-xl font-bold text-foreground">LKR {balance.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 md:p-10">
                                <div className="h-[400px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorPayable" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.05} />
                                            <XAxis 
                                                dataKey="date" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 10, fontWeight: 600 }}
                                                dy={10}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 10, fontWeight: 600 }}
                                                tickFormatter={(v) => `LKR ${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
                                            />
                                            <Tooltip 
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-border p-4 rounded-2xl shadow-2xl">
                                                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{payload[0].payload.date}</p>
                                                                <p className="text-sm font-bold text-emerald-600 uppercase tracking-tighter">Total Payable: </p>
                                                                <p className="text-lg font-black text-foreground">LKR {payload[0].value.toLocaleString()}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="balance" 
                                                stroke="#10b981" 
                                                strokeWidth={4} 
                                                fillOpacity={1} 
                                                fill="url(#colorPayable)" 
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Secondary KPI Grid */}
                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10">
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Settlement Ratio</p>
                                        <p className="text-xl font-bold">{stats.settlementRatio}%</p>
                                    </div>
                                    <div className="p-5 rounded-3xl bg-amber-50 border border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/10">
                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Total Settled</p>
                                        <p className="text-xl font-bold">LKR {totalSettled.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Side Action Column */}
                        <div className="flex flex-col gap-6">
                            {/* Settlement Status Card */}
                            <Card className="border-border/60 shadow-2xl shadow-emerald-500/5 rounded-4xl overflow-hidden bg-white/70 dark:bg-card/40 backdrop-blur-xl relative">
                                <CardContent className="p-8 space-y-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Payable Health</p>
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "h-2 w-2 rounded-full",
                                                stats.health === "Healthy" ? "bg-emerald-500" : stats.health === "Stable" ? "bg-amber-500" : "bg-red-500"
                                            )} />
                                            <p className="text-2xl font-bold uppercase tracking-tight">{stats.health}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Realized Debt</p>
                                            <p className="text-lg font-bold">LKR {totalPurchased.toLocaleString()}</p>
                                        </div>
                                        <Button 
                                            onClick={() => setPaymentOpen(true)}
                                            className="w-full  rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            Record Payment
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Compliance Sidebar */}
                            <Card className="border-border/60 shadow-xl shadow-foreground/5 rounded-4xl overflow-hidden bg-white/70 dark:bg-card/40 backdrop-blur-xl p-8 space-y-4 border-dashed dark:border-border/40">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                        <History className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Payable Audit</p>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">REF ID: SUP-{selectedSupplier}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-4 border-t border-border/50">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">Credit Velocity</span>
                                        <span className="font-bold text-emerald-500 flex items-center gap-1.5">
                                            <TrendingUp className="h-3 w-3" />
                                            Active
                                        </span>
                                    </div>
                                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[100%]" />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Ledger History Table */}
                    <Card className="border-border/60 shadow-xl shadow-foreground/5 rounded-4xl overflow-hidden bg-white/70 dark:bg-card/40 backdrop-blur-xl relative">
                        <CardHeader className="p-8 md:p-10 border-b border-border/50 bg-muted/20">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-bold tracking-tight">Financial Timeline</CardTitle>
                                    <CardDescription className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Transaction Audit & Verification</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" className="h-10 rounded-xl px-4 text-[10px] font-bold uppercase tracking-widest border-2 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                                    <FileText className="h-3.5 w-3.5 mr-2" />
                                    Export Ledger
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="border-border/50">
                                        <TableHead className="py-5 px-8 font-bold uppercase tracking-widest text-[10px]">Segment Date</TableHead>
                                        <TableHead className="py-5 px-8 font-bold uppercase tracking-widest text-[10px]">Transaction Reference</TableHead>
                                        <TableHead className="py-5 px-8 font-bold uppercase tracking-widest text-[10px] text-right">Debit (Paid)</TableHead>
                                        <TableHead className="py-5 px-8 font-bold uppercase tracking-widest text-[10px] text-right">Credit (Liability)</TableHead>
                                        <TableHead className="py-5 px-8 font-bold uppercase tracking-widest text-[10px] text-right">Terminal Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-24 text-center">
                                                <Loader2 className="h-12 w-12 animate-spin mx-auto text-emerald-200" />
                                                <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Synchronizing Ledger Data...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        ledger.map((item, idx) => (
                                            <TableRow key={idx} className="group hover:bg-muted/20 transition-all border-border/40">
                                                <TableCell className="py-5 px-8 font-bold text-sm text-foreground/70">
                                                    {format(new Date(item.transaction_date), 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell className="py-5 px-8">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs uppercase tracking-tight">{item.reference_type}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">{item.description}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5 px-8 text-right font-bold text-sm text-emerald-600">
                                                    {item.type === 'debit' ? `LKR ${parseFloat(item.amount).toLocaleString()}` : '—'}
                                                </TableCell>
                                                <TableCell className="py-5 px-8 text-right font-bold text-sm text-red-600">
                                                    {item.type === 'credit' ? `LKR ${parseFloat(item.amount).toLocaleString()}` : '—'}
                                                </TableCell>
                                                <TableCell className="py-5 px-8 text-right font-bold text-sm text-emerald-600">
                                                    LKR {parseFloat(item.balance).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Payment Sheet */}
            <Sheet open={paymentOpen} onOpenChange={setPaymentOpen}>
                <SheetContent className="sm:max-w-md rounded-l-4xl border-l border-emerald-500/20 backdrop-blur-3xl bg-white/95 dark:bg-slate-950/95 shadow-2xl p-0 overflow-hidden flex flex-col">
                    {/* Visual Header with Pattern */}
                    <div className="relative shrink-0 h-48 bg-emerald-600 flex items-end p-8 overflow-hidden">
                        <div className="absolute inset-0 opacity-20 pointer-events-none" 
                             style={{backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)`, backgroundSize: '24px 24px'}} />
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        
                        <div className="relative z-10 space-y-2">
                            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center mb-4 shadow-lg border border-white/20">
                                <Wallet className="h-8 w-8" />
                            </div>
                            <SheetTitle className="text-3xl font-black tracking-tight text-white uppercase leading-none">Record Settlement</SheetTitle>
                            <SheetDescription className="text-emerald-100 font-bold uppercase tracking-widest text-[10px] opacity-90 flex items-center gap-2">
                                <Activity className="h-3 w-3" />
                                Ledger adjustment for {suppliers.find(s => String(s.id) === selectedSupplier)?.name}
                            </SheetDescription>
                        </div>
                    </div>
                    
                    <div className="flex-1 min-h-0 relative">
                        <ScrollArea className="h-full">
                            <div className="p-8">
                                <form onSubmit={handlePaymentSubmit} id="payment-form" className="space-y-8">
                                    <div className="space-y-6">
                                        {/* Amount Input & Shortcuts */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Settlement Scope (LKR)</Label>
                                                <Badge variant="outline" className="text-[9px] font-black bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full uppercase tracking-widest border-emerald-500/20">
                                                    Liability: LKR {Math.abs(balance).toLocaleString()}
                                                </Badge>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-500/40">LKR</div>
                                                <Input 
                                                    id="amount" 
                                                    name="amount" 
                                                    type="number" 
                                                    step="0.01" 
                                                    value={paymentAmount}
                                                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                                                    className="h-24 pl-24 pr-8 text-4xl font-black rounded-3xl bg-emerald-500/5 border-2 border-emerald-500/10 focus:border-emerald-500/40 focus:ring-emerald-500/5 transition-all shadow-inner" 
                                                    required 
                                                />
                                            </div>
                                            
                                            {/* Shortcuts */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    onClick={() => setPaymentAmount(Math.abs(balance))}
                                                    className="h-11 rounded-xl border-2 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    Full Scope
                                                </Button>
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    onClick={() => setPaymentAmount(Math.abs(balance) / 2)}
                                                    className="h-11 rounded-xl border-2 border-emerald-500/10 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    50% Impact
                                                </Button>
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    onClick={() => setPaymentAmount(0)}
                                                    className="h-11 rounded-xl border-2 border-red-500/10 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    Reset
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Projection Banner */}
                                        <div className="p-6 rounded-3xl bg-slate-900 dark:bg-slate-800 text-white shadow-2xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all duration-700" />
                                            <div className="relative z-10 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Projected Balance</p>
                                                    <p className="text-2xl font-black tracking-tight">LKR {(Math.abs(balance) - paymentAmount).toLocaleString()}</p>
                                                </div>
                                                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                                                    <TrendingDown className="h-6 w-6 text-emerald-500" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Custom Method Selector */}
                                        <div className="space-y-4">
                                            <Label htmlFor="payment_method" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Sourcing Channel</Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    {id: 'cash', icon: Wallet, label: 'Cash Buffer'},
                                                    {id: 'bank', icon: Building2, label: 'Bank Pipeline'},
                                                    {id: 'cheque', icon: CreditCard, label: 'Deferred Slip'}
                                                ].map((m) => (
                                                    <button
                                                        key={m.id}
                                                        type="button"
                                                        onClick={() => setPaymentMethod(m.id)}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all group",
                                                            paymentMethod === m.id 
                                                                ? "bg-emerald-600 border-emerald-700 text-white shadow-xl shadow-emerald-600/20 scale-[1.02]" 
                                                                : "bg-background border-border/40 hover:border-emerald-500/30 text-muted-foreground hover:bg-emerald-500/5"
                                                        )}
                                                    >
                                                        <m.icon className={cn("h-6 w-6 transition-transform group-hover:scale-110", paymentMethod === m.id ? "text-white" : "text-emerald-500/40")} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{m.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {paymentMethod === "cheque" && (
                                            <div className="grid gap-4 p-6 bg-emerald-500/5 rounded-3xl border-2 border-dashed border-emerald-500/20 animate-in slide-in-from-top-2 duration-300">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400">Cheque Verification</p>
                                                </div>
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest ml-1">Issuing Institution</Label>
                                                        <Input 
                                                            value={chequeDetails.bank_name} 
                                                            onChange={(e) => setChequeDetails({...chequeDetails, bank_name: e.target.value})}
                                                            placeholder="Bank Name (e.g. BOC)" 
                                                            className="h-12 bg-white dark:bg-slate-900 rounded-xl font-bold border-2 border-border/40 focus:border-emerald-500/40" 
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest ml-1">Instrument #</Label>
                                                            <Input 
                                                                value={chequeDetails.cheque_number} 
                                                                onChange={(e) => setChequeDetails({...chequeDetails, cheque_number: e.target.value})}
                                                                placeholder="CX-0000" 
                                                                className="h-12 bg-white dark:bg-slate-900 rounded-xl font-bold border-2 border-border/40" 
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest ml-1">Due Date</Label>
                                                        <Input 
                                                            type="date"
                                                            value={chequeDetails.cheque_date} 
                                                            onChange={(e) => setChequeDetails({...chequeDetails, cheque_date: e.target.value})}
                                                            className="h-12 bg-white dark:bg-slate-900 rounded-xl font-bold border-2 border-border/40" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 pb-4">
                                        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Operational Memo</Label>
                                        <Input id="description" name="description" placeholder="Internal tracking notes..." className="h-14 rounded-2xl border-2 border-border/60 px-5 bg-background font-bold focus:border-emerald-500/40 transition-all" />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </ScrollArea>
                </div>

                    <SheetFooter className="p-8 shrink-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md border-t border-border/50">
                        <Button 
                            type="submit" 
                            form="payment-form"
                            disabled={paymentLoading} 
                            className="w-full py-6  bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black text-sm  shadow-2xl shadow-emerald-600/30 hover:shadow-emerald-600/40  relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            {paymentLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <div className="relative z-10 flex items-center justify-center gap-4">
                                    <Zap className="h-6 w-6 group-hover:animate-bounce" />
                                    Finalize Execution
                                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                                        <ArrowUpRight className="h-4 w-4" />
                                    </div>
                                </div>
                            )}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
