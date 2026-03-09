'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
    Loader2, ArrowUpRight, ArrowDownLeft, User, RotateCcw, 
    FileText, CalendarIcon, Plus, Search, Check, 
    ChevronsUpDown, AlertCircle, TrendingUp, TrendingDown,
    Wallet, History, CreditCard, Banknote
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { 
    Popover, PopoverContent, PopoverTrigger 
} from '@/components/ui/popover';
import { 
    Command, CommandEmpty, CommandGroup, 
    CommandInput, CommandItem, CommandList 
} from '@/components/ui/command';
import {
    Sheet, SheetContent, SheetDescription,
    SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';

export default function CustomerLedgersPage() {
    const { data: session } = useSession();
    const [customers, setCustomers] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState(0);
    const [totalOwed, setTotalOwed] = useState(0);
    const [totalPaid, setTotalPaid] = useState(0);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [chequeDetails, setChequeDetails] = useState({
        bank_name: "",
        cheque_number: "",
        cheque_date: format(new Date(), "yyyy-MM-dd"),
        payee_payor_name: "",
    });

    useEffect(() => {
        if (session) {
            fetchCustomers();
        }
    }, [session]);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/active/list`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setCustomers(response.data.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const fetchLedger = async (customerId) => {
        if (!customerId) return;
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${customerId}/ledger`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setLedger(response.data.data.ledger);
            setBalance(response.data.data.current_balance);
            
            // Calculate totals
            let owed = 0;
            let paid = 0;
            response.data.data.ledger.forEach(item => {
                if (item.type === 'debit') owed += parseFloat(item.amount);
                else if (item.type === 'credit') paid += parseFloat(item.amount);
            });
            setTotalOwed(owed);
            setTotalPaid(paid);
        } catch (error) {
            console.error('Error fetching ledger:', error);
            toast.error('Failed to fetch ledger');
        } finally {
            setLoading(false);
        }
    };

    const chartData = useMemo(() => {
        if (!ledger || ledger.length === 0) return [];
        
        // Sort by date and accumulate balance
        const sorted = [...ledger].sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
        let runningBalance = 0;
        
        return sorted.map(item => {
            const amount = parseFloat(item.amount);
            if (item.type === 'debit') runningBalance += amount;
            else runningBalance -= amount;
            
            return {
                date: format(new Date(item.transaction_date), 'MMM dd'),
                balance: runningBalance,
                amount: amount,
                type: item.type
            };
        });
    }, [ledger]);

    const stats = useMemo(() => {
        const collectionRatio = totalOwed > 0 ? (totalPaid / totalOwed) * 100 : 0;
        return {
            collectionRatio: collectionRatio.toFixed(1),
            health: collectionRatio > 80 ? "Healthy" : collectionRatio > 50 ? "Stable" : "Critical"
        };
    }, [totalOwed, totalPaid]);
    
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${selectedCustomer}/payments`,
                payload,
                { headers: { Authorization: `Bearer ${session.accessToken}` } }
            );
            if (response.data.status === "success" || response.status === 201) {
                toast.success("Payment recorded successfully");
                setPaymentOpen(false);
                fetchLedger(selectedCustomer);
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
                        <Wallet className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">Customer Ledger</h1>
                        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] opacity-80">
                            Analyze individual customer transaction history and liquidity positions
                        </p>
                    </div>
                </div>
            </div>

            {/* Customer Selection & Filter Workspace */}
            <Card className="border-border/60 shadow-xl shadow-foreground/5 rounded-4xl overflow-hidden bg-card/50 backdrop-blur-sm border-dashed">
                <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col lg:flex-row gap-6 items-end">
                        {/* Customer Selector */}
                        <div className="flex-[2] space-y-2.5 w-full">
                            <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Search className="h-3 w-3 text-emerald-500" />
                                Select Customer Focus
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
                                            {selectedCustomer
                                                ? customers.find((c) => String(c.id) === selectedCustomer)?.name
                                                : "Search by name or phone..."}
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl overflow-hidden border-border mt-2 shadow-2xl" align="start">
                                    <Command>
                                        <CommandInput placeholder="Type customer name or phone..." className="h-12" />
                                        <CommandList className="max-h-[300px]">
                                            <CommandEmpty>No customer found.</CommandEmpty>
                                            <CommandGroup>
                                                {customers.map((c) => (
                                                    <CommandItem
                                                        key={c.id}
                                                        value={`${c.name} ${c.phone}`}
                                                        onSelect={() => {
                                                            setSelectedCustomer(String(c.id));
                                                            fetchLedger(String(c.id));
                                                            setOpen(false);
                                                        }}
                                                        className="py-3.5 px-4 flex items-center justify-between cursor-pointer"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm tracking-tight">{c.name}</span>
                                                            <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider font-mono">{c.phone}</span>
                                                        </div>
                                                        <Check
                                                            className={cn(
                                                                "ml-auto h-4 w-4 text-emerald-500",
                                                                selectedCustomer === String(c.id) ? "opacity-100" : "opacity-0"
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
                            <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-[0.2em] flex items-center gap-2">
                                <CalendarIcon className="h-3 w-3 text-emerald-500" />
                                Date From
                            </label>
                            <Input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-14 rounded-2xl font-bold text-sm bg-white dark:bg-muted/30 border-border border-2 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all" 
                            />
                        </div>

                        <div className="flex-1 space-y-2.5 w-full">
                            <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-[0.2em] flex items-center gap-2">
                                <CalendarIcon className="h-3 w-3 text-emerald-500" />
                                Date To
                            </label>
                            <Input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-14 rounded-2xl font-bold text-sm bg-white dark:bg-muted/30 border-border border-2 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all" 
                            />
                        </div>

                        {/* Actions */}
                        <Button 
                            variant="secondary" 
                            size="lg"
                            className="h-14 rounded-2xl px-10 border-2 border-border/60 bg-white hover:bg-emerald-50 hover:border-emerald-500/20 text-emerald-700 dark:bg-muted/50 font-bold text-sm gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] w-full lg:w-auto"
                            onClick={() => fetchLedger(selectedCustomer)}
                            disabled={!selectedCustomer || loading}
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" />}
                            Sync Results
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {selectedCustomer && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Ledger Table */}
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <Card className="border-border/60 shadow-xl shadow-foreground/5 rounded-[2.5rem] overflow-hidden bg-white/70 dark:bg-card/40 backdrop-blur-xl relative">
                            {/* Decorative Background Element */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
                            
                            <div className="p-8 md:p-10 border-b border-border/50 relative z-10">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80">Statement Verified</span>
                                        </div>
                                        <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Statement of Account</CardTitle>
                                        <CardDescription className="text-muted-foreground font-medium text-base">
                                            Transaction analysis for <span className="text-foreground font-bold underline decoration-emerald-500/30 decoration-2 underline-offset-4">{customers.find(c => String(c.id) === selectedCustomer)?.name}</span>
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" size="lg" className="h-12 rounded-2xl border-border bg-white hover:bg-muted font-semibold text-sm gap-2 shadow-sm transition-all whitespace-nowrap">
                                        <FileText className="h-4 w-4" />
                                        Export History
                                    </Button>
                                </div>
                            </div>
                            
                            <CardContent className="p-0 relative z-10">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="hover:bg-transparent border-border/50">
                                                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-6 px-8 text-muted-foreground">Date Segment</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-6 px-8 text-muted-foreground">Reference & Type</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-6 px-8 text-right text-muted-foreground">Debit (Owed)</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-6 px-8 text-right text-muted-foreground">Credit (Paid)</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-6 px-8 text-right text-muted-foreground">Net Balance</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-24">
                                                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-emerald-500/20 mb-4" />
                                                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Syncing ledger records...</p>
                                                    </TableCell>
                                                </TableRow>
                                            ) : ledger.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-24">
                                                        <div className="bg-muted/30 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-border/60">
                                                            <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
                                                        </div>
                                                        <p className="text-sm font-semibold text-muted-foreground">No transactions found for this customer</p>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                ledger.map((row, idx) => (
                                                    <TableRow key={idx} className="group hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5 transition-colors border-border/40">
                                                        <TableCell className="py-5 px-8">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-emerald-500 transition-colors" />
                                                                <span className="font-semibold text-xs text-muted-foreground">
                                                                    {format(new Date(row.transaction_date), 'dd MMM, yyyy')}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-5 px-8">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[11px] font-bold uppercase text-foreground tracking-tight">{row.reference_type}</span>
                                                                <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[200px]">{row.description}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-5 px-8 text-right">
                                                            <span className={cn("font-mono text-sm font-bold", row.type === 'debit' ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground/30")}>
                                                                {row.type === 'debit' ? `LKR ${parseFloat(row.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-5 px-8 text-right">
                                                            <span className={cn("font-mono text-sm font-bold", row.type === 'credit' ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/30")}>
                                                                {row.type === 'credit' ? `LKR ${parseFloat(row.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-5 px-8 text-right">
                                                            <div className="inline-flex flex-col items-end">
                                                                <span className="font-mono text-sm font-black text-foreground">
                                                                    LKR {parseFloat(row.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Actions & Summary */}
                    <div className="space-y-8">
                        {/* Summary Card */}
                        <Card className="border-none shadow-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-[2.5rem] overflow-hidden relative">
                            {/* Glow Effects */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -ml-16 -mb-16" />
                            
                            <CardContent className="p-8 md:p-10 space-y-10 relative z-10">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400/80">Liquidity Position</p>
                                    </div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Current Outstanding</p>
                                    <div className="flex flex-col">
                                        <span className="text-4xl font-bold tracking-tighter text-white">
                                            LKR {parseFloat(balance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                        </span>
                                        <div className="h-1 w-20 bg-emerald-500 rounded-full mt-4" />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-6 pt-2">
                                    <div className="space-y-1.5 bg-white/5 p-4 rounded-2xl border border-white/5 transition-colors hover:bg-white/10">
                                        <div className="flex items-center gap-2 text-emerald-400">
                                            <TrendingDown className="h-4 w-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Total Net Paid</span>
                                        </div>
                                        <p className="text-xl font-bold tracking-tight">LKR {parseFloat(totalPaid).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                                    </div>
                                    <div className="space-y-1.5 bg-white/5 p-4 rounded-2xl border border-white/5 transition-colors hover:bg-white/10">
                                        <div className="flex items-center gap-2 text-indigo-400">
                                            <TrendingUp className="h-4 w-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Gross Owed</span>
                                        </div>
                                        <p className="text-xl font-bold tracking-tight">LKR {parseFloat(totalOwed).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                                    </div>
                                </div>

                                <Button 
                                    onClick={() => setPaymentOpen(true)}
                                    className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm uppercase tracking-widest rounded-2xl shadow-[0_12px_30px_-10px_rgba(16,185,129,0.5)] border-none transition-all hover:scale-[1.02] active:scale-[0.98] mt-4 group"
                                >
                                    <Banknote className="h-5 w-5 mr-3 transition-transform group-hover:rotate-12" />
                                    Record New Payment
                                </Button>
                            </CardContent>
                        </Card>
                        
                        <Sheet open={paymentOpen} onOpenChange={setPaymentOpen}>
                            <SheetContent className="sm:max-w-xl w-full p-0 border-l border-border/50 bg-white/80 backdrop-blur-xl">
                                <div className="h-full flex flex-col relative overflow-hidden">
                                    {/* Glassmorphism Header */}
                                    <div className="absolute top-0 left-0 w-full h-32 bg-emerald-500/5 -z-10 blur-3xl rounded-full translate-y-[-50%]" />
                                    
                                    <SheetHeader className="p-8 md:p-10 pb-6 border-b border-border/40 relative z-10">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="h-14 w-14 bg-emerald-500 text-white flex items-center justify-center rounded-2xl shadow-xl shadow-emerald-500/20">
                                                <CreditCard className="h-7 w-7" />
                                            </div>
                                            <div className="space-y-1">
                                                <SheetTitle className="text-2xl font-bold tracking-tight">Record Credit Payment</SheetTitle>
                                                <SheetDescription className="font-medium text-muted-foreground">
                                                    Post a new transaction for {customers.find(c => String(c.id) === selectedCustomer)?.name}
                                                </SheetDescription>
                                            </div>
                                        </div>
                                    </SheetHeader>

                                    <form onSubmit={handlePaymentSubmit} className="flex-1 flex flex-col min-h-0 overflow-y-auto relative z-10">
                                        <div className="p-8 md:p-10 space-y-10 mt-2">
                                            {/* Amount Field */}
                                            <div className="space-y-4">
                                                <Label htmlFor="amount" className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <Banknote className="h-3.5 w-3.5" />
                                                    Transaction Amount
                                                </Label>
                                                <div className="relative">
                                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground/50">LKR</span>
                                                    <Input 
                                                        id="amount" 
                                                        name="amount" 
                                                        type="number" 
                                                        step="0.01" 
                                                        defaultValue={Math.abs(balance)} 
                                                        className="h-20 pl-20 pr-6 text-3xl font-bold rounded-3xl bg-emerald-500/3 border-emerald-500/10 focus:border-emerald-500/40 focus:ring-emerald-500/5 transition-all" 
                                                        required 
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>

                                            {/* Payment Method */}
                                            <div className="space-y-4">
                                                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <Wallet className="h-3.5 w-3.5" />
                                                    Payment Method
                                                </Label>
                                                <Select name="payment_method" value={paymentMethod} onValueChange={setPaymentMethod}>
                                                    <SelectTrigger className="h-14 rounded-2xl bg-white dark:bg-muted/20 border-border px-6 text-sm font-semibold shadow-sm focus:ring-emerald-500/10">
                                                        <SelectValue placeholder="Select method" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-border p-1">
                                                        <SelectItem value="cash" className="rounded-xl py-3 cursor-pointer">Cash Payment</SelectItem>
                                                        <SelectItem value="bank" className="rounded-xl py-3 cursor-pointer">Bank Transfer</SelectItem>
                                                        <SelectItem value="cheque" className="rounded-xl py-3 cursor-pointer">Cheque Payment</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {paymentMethod === "cheque" && (
                                                <div className="space-y-6 p-6 md:p-8 bg-muted/30 rounded-[2rem] border border-border/60 border-dashed animate-in fade-in slide-in-from-top-4 duration-500">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2.5">
                                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Bank Name</Label>
                                                            <Input 
                                                                value={chequeDetails.bank_name} 
                                                                onChange={(e) => setChequeDetails({...chequeDetails, bank_name: e.target.value})}
                                                                placeholder="e.g. BOC, HNB" 
                                                                className="h-12 bg-white rounded-xl border-border px-4 font-semibold text-sm" 
                                                            />
                                                        </div>
                                                        <div className="space-y-2.5">
                                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Cheque Number</Label>
                                                            <Input 
                                                                value={chequeDetails.cheque_number} 
                                                                onChange={(e) => setChequeDetails({...chequeDetails, cheque_number: e.target.value})}
                                                                placeholder="123456" 
                                                                className="h-12 bg-white rounded-xl border-border px-4 font-semibold text-sm" 
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Issue Date</Label>
                                                        <Input 
                                                            type="date"
                                                            value={chequeDetails.cheque_date} 
                                                            onChange={(e) => setChequeDetails({...chequeDetails, cheque_date: e.target.value})}
                                                            className="h-12 bg-white rounded-xl border-border px-4 font-semibold text-sm" 
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <Label htmlFor="description" className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    Internal Memo / Description
                                                </Label>
                                                <Input 
                                                    id="description" 
                                                    name="description" 
                                                    placeholder="Add any context for this payment..." 
                                                    className="h-14 rounded-2xl bg-white dark:bg-muted/20 border-border px-6 text-sm font-semibold shadow-sm" 
                                                />
                                            </div>
                                        </div>

                                        <SheetFooter className="mt-auto p-8 md:p-10 border-t border-border/40 bg-muted/20 backdrop-blur-md">
                                            <div className="flex flex-col-reverse sm:flex-row gap-4 w-full">
                                                <Button 
                                                    type="button" 
                                                    variant="secondary" 
                                                    size="lg"
                                                    onClick={() => setPaymentOpen(false)} 
                                                    className="rounded-2xl h-14 font-bold text-sm px-8 flex-1 sm:flex-none border border-border/60"
                                                >
                                                    Discard Changes
                                                </Button>
                                                <Button 
                                                    type="submit" 
                                                    size="lg"
                                                    disabled={paymentLoading} 
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-14 font-bold text-sm px-10 flex-1 shadow-lg shadow-emerald-500/20 border-none transition-all group"
                                                >
                                                    {paymentLoading ? (
                                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
                                                    )}
                                                    Post Transaction
                                                </Button>
                                            </div>
                                        </SheetFooter>
                                    </form>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <div className="space-y-6">
                            {/* Primary Chart Card */}
                            <Card className="border-border/60 shadow-2xl shadow-emerald-500/5 rounded-[2.5rem] overflow-hidden bg-white/70 dark:bg-card/40 backdrop-blur-xl relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                                
                                <CardHeader className="p-8 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                                <TrendingUp className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-bold tracking-tight">Balance Trend</CardTitle>
                                                <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Running Ledger Performance</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="h-6 px-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-[10px] uppercase">{stats.health}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    <div className="h-[280px] w-full mt-6">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                                <XAxis 
                                                    dataKey="date" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 10, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} 
                                                    dy={10}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 10, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} 
                                                    hide
                                                />
                                                <Tooltip 
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-border p-4 rounded-2xl shadow-2xl">
                                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{payload[0].payload.date}</p>
                                                                    <p className="text-sm font-bold text-emerald-600">LKR {payload[0].value.toLocaleString()}</p>
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
                                                    fill="url(#colorBalance)" 
                                                    animationDuration={1500}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Secondary KPI Grid */}
                                    <div className="grid grid-cols-2 gap-4 mt-8">
                                        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Collection</p>
                                            <p className="text-xl font-bold">{stats.collectionRatio}%</p>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-500/10">
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Total Paid</p>
                                            <p className="text-xl font-bold">LKR {totalPaid.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-6 rounded-3xl bg-slate-900 text-white flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Current Balance due</p>
                                            <p className="text-2xl font-bold">LKR {balance.toLocaleString()}</p>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center animate-pulse">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Compliance Sidebar */}
                            <Card className="border-border/60 shadow-xl shadow-foreground/5 rounded-[2.5rem] overflow-hidden bg-white/70 dark:bg-card/40 backdrop-blur-xl p-8 space-y-4 border-dashed dark:border-border/40">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                                        <History className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Compliance Match</p>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Sync ID: #CUST-{selectedCustomer}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-4">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Ledger Sync</span>
                                        <span className="font-bold text-emerald-500 flex items-center gap-1.5">
                                            <Check className="h-3 w-3" />
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
                </div>
            )}
        </div>
    );
}
