'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Landmark, TrendingUp, BarChart3, PieChart, Wallet, CreditCard, ArrowUpRight, ArrowDownRight, Printer, RotateCcw, Activity, ShieldCheck, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function FinancialReportsPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState('trial-balance');
    const [loading, setLoading] = useState(true);
    
    // Data states
    const [trialBalance, setTrialBalance] = useState({ accounts: [], summary: { totalDebit: 0, totalCredit: 0 } });
    const [pandL, setPandL] = useState({ revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0, margin: 0 });
    const [capital, setCapital] = useState({ summary: { totalAssets: 0, totalLiabilities: 0, netWorth: 0 } });

    useEffect(() => {
        if (session) {
            fetchAllData();
        }
    }, [session]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [tbRes, plRes, capRes] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/trial-balance`, { headers: { Authorization: `Bearer ${session.accessToken}` } }),
                axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/profit-loss`, { headers: { Authorization: `Bearer ${session.accessToken}` } }),
                axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/capital-balance`, { headers: { Authorization: `Bearer ${session.accessToken}` } })
            ]);
            
            setTrialBalance(tbRes.data.data);
            setPandL(plRes.data.data);
            setCapital(capRes.data.data);
        } catch (error) {
            console.error('Error fetching financial reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const [printSection, setPrintSection] = useState(null);

    const handlePrintAll = () => {
        setPrintSection('all');
        setTimeout(() => {
            window.print();
            setPrintSection(null);
        }, 100);
    };

    const handlePrintSingle = (section) => {
        setPrintSection(section);
        setTimeout(() => {
            window.print();
            setPrintSection(null);
        }, 100);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-background relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_50%)]" />
                <div className="relative z-10 text-center space-y-6">
                    <div className="relative inline-block">
                        <div className="absolute -inset-4 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" />
                        <div className="relative h-16 w-16 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex items-center justify-center border border-emerald-500/10">
                            <RotateCcw className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Processing Figures</p>
                        <p className="text-sm font-semibold text-slate-400">Compiling Financial Statements...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 md:px-8 md:pt-6 md:pb-20 relative overflow-hidden">
            {/* Dynamic Background Pattern */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-background">
                <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.05),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.1),rgba(0,0,0,0))]"></div>
            </div>

            <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30">
                            <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-semibold text-foreground tracking-tight">
                                Financial Reports
                            </h1>
                            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] opacity-80">
                                Analytics Hub & Consolidated Performance
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            className="h-10 px-6 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold uppercase text-[11px] tracking-widest transition-all gap-2 text-slate-700 dark:text-slate-200 shadow-sm" 
                            onClick={fetchAllData}
                        >
                            <RotateCcw className="h-4 w-4 opacity-60" />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>
                        <Button 
                            className="h-10 px-5 rounded-full bg-[#00b076] hover:bg-[#00b076]/90 text-white font-bold uppercase text-[11px] tracking-wider shadow-md shadow-[#00b076]/20 transition-all active:scale-95 border-none gap-2" 
                            onClick={handlePrintAll}
                        >
                            <Printer className="h-4 w-4" />
                            Print Statement
                        </Button>
                    </div>
                </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden relative">
                <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-2xl overflow-hidden group transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">Net Revenue</p>
                                <p className="text-[8px] font-medium text-slate-400/60 dark:text-slate-500/60 mt-0.5 uppercase">YTD Earnings</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                <span className="text-xs font-medium text-slate-400 mr-1.5 uppercase">LKR</span>
                                {parseFloat(pandL.revenue).toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-2xl overflow-hidden group transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-xl flex items-center justify-center">
                                <ArrowUpRight className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-500 transition-colors">Total Expenses</p>
                                <p className="text-xs font-bold text-slate-900/40 dark:text-foreground/40 mt-0.5">Burn Rate</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight text-red-600/80">
                                <span className="text-xs font-semibold text-slate-400 mr-1.5 uppercase tracking-normal">LKR</span>
                                {parseFloat(pandL.expenses).toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-2xl overflow-hidden group transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center",
                                pandL.netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" : "bg-red-50 dark:bg-red-500/10 text-red-600"
                            )}>
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">Net Profit</p>
                                <p className="text-xs font-bold text-slate-900/40 dark:text-foreground/40 mt-0.5">Bottom Line</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className={cn(
                                "text-2xl font-bold tracking-tight",
                                pandL.netProfit >= 0 ? "text-emerald-500" : "text-red-500"
                            )}>
                                <span className="text-xs font-semibold text-slate-400 mr-1.5 uppercase tracking-normal">LKR</span>
                                {parseFloat(pandL.netProfit).toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-600 shadow-sm rounded-2xl overflow-hidden group transition-all duration-500">
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 bg-white/10 text-white rounded-xl flex items-center justify-center border border-white/20">
                                <Landmark className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">Business Worth</p>
                                <p className="text-[8px] font-medium text-white/30 mt-0.5 uppercase">Total Equity</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-white tracking-tight">
                                <span className="text-xs font-medium text-white/40 mr-1.5 uppercase">LKR</span>
                                {parseFloat(capital.summary.netWorth).toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="trial-balance" className="w-full print:hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 p-1 h-12 rounded-xl w-full md:w-fit shadow-sm mb-6">
                    <TabsTrigger value="trial-balance" className="rounded-lg h-full font-bold text-[10px] uppercase tracking-widest px-8 data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all duration-300">
                        Trial Balance
                    </TabsTrigger>
                    <TabsTrigger value="profit-loss" className="rounded-lg h-full font-bold text-[10px] uppercase tracking-widest px-8 data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all duration-300">
                        Profit & Loss
                    </TabsTrigger>
                    <TabsTrigger value="balance-sheet" className="rounded-lg h-full font-bold text-[10px] uppercase tracking-widest px-8 data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all duration-300">
                        Financial Position
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="trial-balance" className="mt-0 focus-visible:ring-0">
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                        <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                            <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                                        </div>
                                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Statement of Trial Balance</CardTitle>
                                    </div>
                                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">COMPREHENSIVE LEDGER BALANCES • AS OF {format(new Date(), 'dd MMM yyyy')}</p>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="flex flex-col items-end">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-1">Total Ledger Turnover</p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mr-2">LKR</span>
                                            {(trialBalance.summary.totalDebit).toLocaleString()}
                                        </p>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-12 w-12 rounded-2xl bg-white/50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 transition-all duration-300 shadow-sm" 
                                        onClick={() => handlePrintSingle('trial-balance')}
                                    >
                                        <Printer className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50 border-b border-slate-100">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-8">Account Details</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-8">Classification</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-8 text-right w-[200px]">Debit</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 px-8 text-right w-[200px]">Credit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {trialBalance.accounts.map((acc) => (
                                        <TableRow key={acc.id} className="hover:bg-emerald-500/2 border-emerald-500/5 dark:border-emerald-500/10 group transition-colors duration-300">
                                            <TableCell className="py-6 px-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-800 group-hover:border-emerald-500/20 dark:group-hover:border-emerald-500/40 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-all duration-500">
                                                        {acc.code.substring(0, 2)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">{acc.name}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{acc.code}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6 px-10">
                                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 group-hover:border-emerald-500/30 dark:group-hover:border-emerald-500/50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all duration-500">
                                                    {acc.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-5 px-8 text-right font-bold text-xs text-slate-700 dark:text-slate-200">
                                                {acc.debit > 0 ? (
                                                    <span className="flex items-center justify-end gap-1.5">
                                                        <Zap className="h-3 w-3 text-emerald-500/40" />
                                                        {acc.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell className="py-5 px-8 text-right font-bold text-xs text-emerald-600 dark:text-emerald-500">
                                                {acc.credit > 0 ? (
                                                     <span className="flex items-center justify-end gap-1.5">
                                                        <Activity className="h-3 w-3 text-emerald-400" />
                                                        {acc.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                ) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-white font-bold border-t border-slate-200 dark:border-slate-800">
                                        <TableCell colSpan={2} className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
                                            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                                            Statement Totals
                                        </TableCell>
                                        <TableCell colSpan={2} className="py-6 px-8 text-right font-bold text-xs space-x-12">
                                            <span className="text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest mr-2 font-semibold">Consolidated</span>
                                            <span className="mr-8">DR: {trialBalance.summary.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            <span>CR: {trialBalance.summary.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="profit-loss" className="mt-0 focus-visible:ring-0">
                    <div className="flex justify-end mb-6">
                        <Button 
                            variant="outline" 
                            className="font-bold text-[10px] uppercase tracking-[0.2em] gap-2 rounded-2xl h-12 px-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-slate-200/60 dark:border-slate-800/60 hover:border-emerald-500/40 dark:hover:border-emerald-500/60 transition-all duration-300 shadow-sm text-slate-700 dark:text-slate-200" 
                            onClick={() => handlePrintSingle('profit-loss')}
                        >
                            <Printer className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                            PRINT INCOME STATEMENT
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                            <CardHeader className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                                            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                                        </div>
                                        <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">Revenue & Growth</CardTitle>
                                    </div>
                                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">EARNINGS AND EFFICIENCY METRICS</p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Gross Sales Revenue</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mr-2 uppercase">LKR</span>
                                            {pandL.revenue.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-emerald-500 border border-slate-100 dark:border-slate-700">
                                        <TrendingUp className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-5 rounded-2xl hover:bg-emerald-500/2 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/10 dark:hover:border-emerald-500/30 transition-all duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                                                <Zap className="h-3 w-3 text-emerald-600 dark:text-emerald-500" />
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Gross Margin</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{((pandL.grossProfit / pandL.revenue) * 100 || 0).toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center p-5 rounded-2xl hover:bg-emerald-500/2 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/10 dark:hover:border-emerald-500/30 transition-all duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                                                <Activity className="h-3 w-3 text-emerald-600 dark:text-emerald-500" />
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Net Profit Margin</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{pandL.margin.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center p-5 rounded-2xl hover:bg-emerald-500/2 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/10 dark:hover:border-emerald-500/30 transition-all duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                                                <BarChart3 className="h-3 w-3 text-emerald-600 dark:text-emerald-500" />
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Efficiency Ratio</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{((pandL.expenses / pandL.revenue) * 100 || 0).toFixed(1)}%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                            <CardHeader className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                                            <PieChart className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                                        </div>
                                        <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">Income Summary</CardTitle>
                                    </div>
                                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">BOTTOM-LINE PERFORMANCE OVERVIEW</p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10 space-y-2">
                                <div className="flex justify-between items-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Sales Revenue</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{pandL.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center p-5 rounded-2xl text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 italic font-semibold">
                                    <span className="text-[11px] uppercase tracking-widest ml-2">(Less) Cost of Goods Sold</span>
                                    <span className="text-sm font-bold">({pandL.cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                                </div>
                                <div className="flex justify-between items-center p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl my-4 border border-emerald-500/10 dark:border-emerald-500/20">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Gross Trading Profit</span>
                                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">{pandL.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center p-5 rounded-2xl text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 italic font-semibold">
                                    <span className="text-[11px] uppercase tracking-widest ml-2">(Less) Operating Expenses</span>
                                    <span className="text-sm font-bold">({pandL.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                                </div>
                                <div className="flex justify-between items-center p-8 bg-emerald-600 text-white rounded-2xl mt-6 shadow-md relative overflow-hidden group">
                                    <div className="relative z-10 space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Net Profit / Loss</span>
                                        <p className="text-2xl font-bold tracking-tight">
                                            <span className="text-xs font-medium opacity-60 mr-2 uppercase">LKR</span>
                                            {pandL.netProfit >= 0 ? '' : '-'}{Math.abs(pandL.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 relative z-10">
                                        <Activity className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="balance-sheet" className="mt-0 focus-visible:ring-0">
                    <div className="flex justify-end mb-6">
                        <Button 
                            variant="outline" 
                            className="font-bold text-[10px] uppercase tracking-widest gap-2 rounded-xl h-10 px-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 shadow-sm text-slate-700 dark:text-slate-200" 
                            onClick={() => handlePrintSingle('balance-sheet')}
                        >
                            <Printer className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                            Print Position Statement
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                            <CardHeader className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
                                <div className="space-y-1 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
                                            <Landmark className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">Asset & Liability Profile</CardTitle>
                                    </div>
                                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">CURRENT FINANCIAL POSITION ASSESSMENT</p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between group p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm border border-slate-100 dark:border-slate-700">A</div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Total Enterprise Assets</p>
                                                <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                                    <span className="text-xs font-semibold text-slate-400 mr-2">LKR</span>
                                                    {capital.summary.totalAssets.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between group p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm border border-slate-100 dark:border-slate-700">L</div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Consolidated Liabilities</p>
                                                <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                                    <span className="text-xs font-semibold text-slate-400 mr-2">LKR</span>
                                                    {capital.summary.totalLiabilities.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-8 bg-emerald-600 text-white rounded-2xl shadow-md relative overflow-hidden group">
                                        <div className="relative z-10 space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/80 mb-1">Company Net Worth</p>
                                            <p className="text-2xl font-bold text-white tracking-tight">
                                                <span className="text-sm font-medium opacity-60 mr-2">LKR</span>
                                                {capital.summary.netWorth.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm relative z-10">
                                            <PieChart className="h-6 w-6 text-white group-hover:rotate-45 transition-transform duration-500" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-8 flex flex-col justify-center text-center p-12 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl shadow-sm relative overflow-hidden group border border-slate-800">
                            <div className="relative z-10 space-y-6">
                                <div className="h-16 w-16 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/20 dark:border-emerald-500/40 mx-auto">
                                    <Landmark className="h-8 w-8 text-emerald-400" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold uppercase tracking-tight leading-none text-emerald-50">Financial Health<br/>Benchmark</h2>
                                    <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest">Automated Audit Analysis</p>
                                </div>
                                <p className="text-slate-400 font-medium px-8 italic text-sm leading-relaxed opacity-80">
                                    "Precision in accounting is the bedrock upon which business empires are built."
                                </p>
                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Debt to Asset</p>
                                        <p className="text-2xl font-bold text-white tracking-tight">{(capital.summary.totalLiabilities / capital.summary.totalAssets * 100 || 0).toFixed(1)}<span className="text-xs font-semibold text-slate-600 ml-1">%</span></p>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Liquidity Score</p>
                                        <p className="text-xl font-bold text-emerald-400 tracking-tight text-center">PRIME</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
            </div>

            {/* PRINT ALL SECTION - HIDDEN ON SCREEN */}
            <div className="hidden print:block space-y-16 p-8">
                {(printSection === 'all' || printSection === null) && (
                    <div className="text-center space-y-2 mb-10">
                        <h1 className="text-4xl font-black uppercase tracking-tighter">Financial Statements</h1>
                        <p className="text-lg font-bold text-slate-500">As of {format(new Date(), 'dd MMMM yyyy')}</p>
                        <div className="h-1 w-20 bg-slate-900 mx-auto mt-4" />
                    </div>
                )}

                {/* 1. Trial Balance */}
                {(printSection === 'all' || printSection === 'trial-balance') && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-black uppercase tracking-widest border-b-2 border-slate-900 pb-2">1. Statement of Trial Balance</h2>
                        <Table className="border border-slate-200">
                            <TableHeader className="bg-slate-50">
                                <TableRow className="border-b border-slate-200">
                                    <TableHead className="font-bold text-slate-900 text-xs">Account Details</TableHead>
                                    <TableHead className="font-bold text-slate-900 text-xs">Type</TableHead>
                                    <TableHead className="text-right font-bold text-slate-900 text-xs">Debit (LKR)</TableHead>
                                    <TableHead className="text-right font-bold text-slate-900 text-xs">Credit (LKR)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trialBalance.accounts.map((acc) => (
                                    <TableRow key={acc.id} className="border-b border-slate-100">
                                        <TableCell className="font-bold text-xs">{acc.code} - {acc.name}</TableCell>
                                        <TableCell className="uppercase text-[9px] font-bold">{acc.type}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{acc.debit > 0 ? acc.debit.toFixed(2) : '-'}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{acc.credit > 0 ? acc.credit.toFixed(2) : '-'}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-slate-100 font-black">
                                    <TableCell colSpan={2} className="text-xs">Grand Total</TableCell>
                                    <TableCell className="text-right font-mono text-xs">LKR {trialBalance.summary.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-right font-mono text-xs">LKR {trialBalance.summary.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                )}

                {(printSection === 'all' && <div className="page-break" />)}

                {/* 2. Profit & Loss */}
                {(printSection === 'all' || printSection === 'profit-loss') && (
                    <div className="space-y-6 pt-10">
                        <h2 className="text-xl font-black uppercase tracking-widest border-b-2 border-slate-900 pb-2">2. Income Statement (Profit & Loss)</h2>
                        <div className="border rounded-xl p-8 space-y-4">
                            <div className="flex justify-between items-center py-4 border-b">
                                <span className="font-black uppercase tracking-widest text-xs">Total Sales Revenue</span>
                                <span className="font-mono font-bold text-lg">{pandL.revenue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b italic font-medium text-xs">
                                <span>(Less) Cost of Goods Sold</span>
                                <span>({pandL.cogs.toFixed(2)})</span>
                            </div>
                            <div className="flex justify-between items-center py-6 bg-slate-50 px-4 rounded-lg font-black italic">
                                <span>GROSS PROFIT</span>
                                <span className="text-xl font-mono">{pandL.grossProfit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b italic font-medium text-xs">
                                <span>(Less) Total Operating Expenses</span>
                                <span>({pandL.expenses.toFixed(2)})</span>
                            </div>
                            <div className="flex justify-between items-center py-8 bg-slate-900 text-white px-6 rounded-xl font-black shadow-lg">
                                <span className="text-lg">NET PROFIT / LOSS</span>
                                <span className="text-3xl font-mono">
                                    LKR {pandL.netProfit >= 0 ? '' : '-'}{Math.abs(pandL.netProfit).toFixed(2)}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-8 pt-6">
                                <div className="text-center p-4 border rounded-xl">
                                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Gross Margin</p>
                                    <p className="text-lg font-black">{((pandL.grossProfit / pandL.revenue) * 100 || 0).toFixed(1)}%</p>
                                </div>
                                <div className="text-center p-4 border rounded-xl">
                                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Net Margin</p>
                                    <p className="text-lg font-black">{pandL.margin.toFixed(1)}%</p>
                                </div>
                                <div className="text-center p-4 border rounded-xl">
                                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Expenses Ratio</p>
                                    <p className="text-lg font-black">{((pandL.expenses / pandL.revenue) * 100 || 0).toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(printSection === 'all' && <div className="page-break" />)}

                {/* 3. Balance Sheet */}
                {(printSection === 'all' || printSection === 'balance-sheet') && (
                    <div className="space-y-6 pt-10">
                        <h2 className="text-xl font-black uppercase tracking-widest border-b-2 border-slate-900 pb-2">3. Statement of Financial Position (Balance Sheet)</h2>
                        <div className="grid grid-cols-2 gap-12 text-xs">
                            <div className="space-y-4">
                                <h3 className="font-black uppercase bg-slate-900 text-white p-3 rounded-t-xl text-center">ASSETS</h3>
                                <div className="space-y-2 border p-6 rounded-b-xl min-h-[160px]">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="font-bold">Total Current & Fixed Assets</span>
                                        <span className="font-mono font-bold">{capital.summary.totalAssets.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 italic mt-4">Includes Bank, Cash, Inventory, and Fixed Assets</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-black uppercase bg-slate-900 text-white p-3 rounded-t-xl text-center">LIABILITIES & EQUITY</h3>
                                <div className="space-y-2 border p-6 rounded-b-xl min-h-[160px]">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="font-bold">Total Liabilities</span>
                                        <span className="font-mono font-bold">{capital.summary.totalLiabilities.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-4 mt-4 bg-emerald-50 px-4 rounded-lg font-black border-2 border-emerald-200">
                                        <span>NET WORTH / EQUITY</span>
                                        <span className="font-mono">LKR {capital.summary.netWorth.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Accountant's Confirmation</p>
                            <div className="flex justify-around items-end pt-12 pb-4">
                                <div className="w-48 border-t-2 border-slate-900 pt-2 text-[10px] font-black uppercase">Prepared By</div>
                                <div className="w-48 border-t-2 border-slate-900 pt-2 text-[10px] font-black uppercase">Approved By</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 2cm;
                        size: A4;
                    }
                    body {
                        background: white !important;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                }
            `}</style>
        </div>
    );
}
