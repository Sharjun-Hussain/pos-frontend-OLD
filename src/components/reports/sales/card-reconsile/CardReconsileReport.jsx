"use client";

import { useState, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Printer,
  FileText,
  Download,
  Search,
  Calendar as CalendarIcon,
  ChevronDown,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  Wallet
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CardReconcilePrintTemplate } from "@/components/Template/sales/CardReconsileReportTemplate";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

// Import Template



// --- MOCK DATA ---
const TRANSACTIONS = [
  { id: 1, date: "2023-10-26 14:35:12", invoice: "INV-00123", cardType: "Visa", last4: "1234", authCode: "A1B2C3", amount: 45000.00, status: "Pending", batch: "S20231026-01" },
  { id: 2, date: "2023-10-26 14:30:05", invoice: "INV-00122", cardType: "MasterCard", last4: "5678", authCode: "D4E5F6", amount: 22500.50, status: "Matched", batch: "S20231026-01" },
  { id: 3, date: "2023-10-26 14:25:40", invoice: "INV-00121", cardType: "Amex", last4: "9012", authCode: "G7H8I9", amount: 65000.00, status: "Matched", batch: "S20231026-01" },
  { id: 4, date: "2023-10-26 14:20:15", invoice: "INV-00120", cardType: "Visa", last4: "3456", authCode: "N/A", amount: 12000.00, status: "Failed", batch: "N/A" },
  { id: 5, date: "2023-10-26 14:15:55", invoice: "INV-00119", cardType: "MasterCard", last4: "7890", authCode: "J0K1L2", amount: 32000.00, status: "Matched", batch: "S20231026-01" },
  { id: 6, date: "2023-10-26 13:10:22", invoice: "INV-00118", cardType: "Visa", last4: "1122", authCode: "REFUND", amount: -5000.00, status: "Refunded", batch: "S20231026-01" },
  { id: 7, date: "2023-10-26 12:05:10", invoice: "INV-00117", cardType: "Visa", last4: "3344", authCode: "L9M8N7", amount: 8500.00, status: "Matched", batch: "S20231026-01" },
  { id: 8, date: "2023-10-26 11:00:00", invoice: "INV-00116", cardType: "MasterCard", last4: "5566", authCode: "P6O5I4", amount: 1500.00, status: "Matched", batch: "S20231026-01" },
];

const COLORS = { Visa: '#2563eb', MasterCard: '#f59e0b', Amex: '#10b981', Other: '#94a3b8' };

const formatLKR = (val) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(val);

export default function CardReconciliationPage() {
  const [date, setDate] = useState({ from: new Date(), to: new Date() });
  const [store, setStore] = useState("All Branches");
  const [cardType, setCardType] = useState("All");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");

  // Filters
  const filteredData = useMemo(() => {
    return TRANSACTIONS.filter(item => {
      const matchCard = cardType === "All" || item.cardType === cardType;
      const matchStatus = status === "All" || item.status === status;
      const matchSearch = item.invoice.toLowerCase().includes(search.toLowerCase()) || item.last4.includes(search);
      return matchCard && matchStatus && matchSearch;
    });
  }, [cardType, status, search]);

  // Stats
  const stats = useMemo(() => {
    const totalSales = filteredData.reduce((acc, curr) => curr.amount > 0 ? acc + curr.amount : acc, 0);
    const totalRefunds = filteredData.reduce((acc, curr) => curr.amount < 0 ? acc + curr.amount : acc, 0);
    const netAmount = totalSales + totalRefunds;
    // Identify issues: Failed or Pending
    const discrepancyCount = filteredData.filter(i => i.status === 'Failed' || i.status === 'Pending').length;
    return { totalSales, totalRefunds, totalCount: filteredData.length, netAmount, discrepancyCount };
  }, [filteredData]);

  // Chart Data
  const chartData = useMemo(() => {
    const counts = {};
    filteredData.forEach(item => {
      if(item.amount > 0) counts[item.cardType] = (counts[item.cardType] || 0) + item.amount;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [filteredData]);

  // Print
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: "Card_Reconciliation_Report" });

  // --- EXPORT LOGIC ---
  const handleExportCSV = () => {
    const exportData = filteredData.map(i => ({
      "Date": i.date,
      "Invoice": i.invoice,
      "Card": i.cardType,
      "Last 4": i.last4,
      "Auth Code": i.authCode,
      "Amount": i.amount,
      "Status": i.status
    }));
    exportToCSV(exportData, "Card_Reconciliation_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(i => ({
      "Date": i.date,
      "Invoice": i.invoice,
      "Card": i.cardType,
      "Last 4": i.last4,
      "Auth Code": i.authCode,
      "Amount": i.amount,
      "Status": i.status
    }));
    exportToExcel(exportData, "Card_Reconciliation_Report");
  };

  return (
    <div className="flex-1 p-8 bg-muted/20 min-h-screen space-y-8 font-sans text-foreground">
      
      {/* Print Template */}
      <CardReconcilePrintTemplate ref={printRef} data={filteredData} stats={stats} filters={{ store, cardType }} />

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Card Reconciliation</h1>
          <p className="text-muted-foreground mt-1">Settlement verification and discrepancy tracking.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" className="bg-card border-border/50 shadow-sm gap-2 text-foreground hover:bg-muted/30">
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="bg-card border-border/50 shadow-sm gap-2 text-foreground hover:bg-muted/30">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-card border-border/50 shadow-sm gap-2 text-foreground hover:bg-muted/30">
            <FileText className="h-4 w-4" /> Excel
          </Button>
          <Button onClick={handlePrint} className="bg-emerald-600 text-white shadow-sm gap-2 hover:bg-emerald-700">
            <Printer className="h-4 w-4" /> Print Report
          </Button>
        </div>
      </div>

      {/* --- KPIS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-card border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">Total Card Sales</p>
            <h3 className="text-2xl font-bold text-foreground">{formatLKR(stats.totalSales)}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card border-l-4 border-l-slate-300">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">Transactions</p>
            <h3 className="text-2xl font-bold text-foreground">{stats.totalCount}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card border-l-4 border-l-red-500">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">Refunds / Voids</p>
            <h3 className="text-2xl font-bold text-red-600">{formatLKR(stats.totalRefunds)}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">Net Settlement</p>
            <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatLKR(stats.netAmount)}</h3>
          </CardContent>
        </Card>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: FILTERS & TABLE */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Filter Bar */}
            <Card className="border-none shadow-sm bg-card">
                <CardContent className="p-4 flex flex-wrap gap-3 items-center">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                            <Input placeholder="Search Invoice / Last 4" className="pl-9 h-10 border-border/50 bg-muted/20" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>
                    <Select value={cardType} onValueChange={setCardType}>
                        <SelectTrigger className="w-[140px] h-10 border-border/50 bg-muted/20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Cards</SelectItem>
                            <SelectItem value="Visa">Visa</SelectItem>
                            <SelectItem value="MasterCard">MasterCard</SelectItem>
                            <SelectItem value="Amex">Amex</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[140px] h-10 border-border/50 bg-muted/20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Status</SelectItem>
                            <SelectItem value="Matched">Matched</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Failed">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    {/* Date Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal h-10 border-border/50 bg-muted/20", !date && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}</> : format(date.from, "LLL dd")) : "Date Range"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                        </PopoverContent>
                    </Popover>
                </CardContent>
            </Card>

            {/* Transaction Table */}
            <Card className="border-none shadow-sm bg-card overflow-hidden">
                <div className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30 border-b border-border/50">
                            <TableRow>
                                <TableHead className="pl-6 font-semibold text-muted-foreground">Time</TableHead>
                                <TableHead className="font-semibold text-muted-foreground">Invoice</TableHead>
                                <TableHead className="font-semibold text-muted-foreground">Details</TableHead>
                                <TableHead className="font-semibold text-muted-foreground text-right">Amount</TableHead>
                                <TableHead className="font-semibold text-muted-foreground text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length > 0 ? (
                                filteredData.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/20 transition-colors border-b border-border/20">
                                        <TableCell className="pl-6 py-4">
                                            <div className="font-medium text-foreground">{format(new Date(item.date), "MMM dd")}</div>
                                            <div className="text-xs text-muted-foreground">{format(new Date(item.date), "HH:mm")}</div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{item.invoice}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-foreground">
                                                <CreditCard className="h-3 w-3 text-muted-foreground/60"/> {item.cardType}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                                ****{item.last4} • Auth: {item.authCode}
                                            </div>
                                        </TableCell>
                                        <TableCell className={`text-right font-mono font-medium ${item.amount < 0 ? 'text-red-600' : 'text-foreground'}`}>
                                            {formatLKR(item.amount)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={cn(
                                                "border-0 capitalize",
                                                item.status === 'Matched' ? "bg-emerald-100 text-emerald-700 dark:text-emerald-400" : 
                                                item.status === 'Pending' ? "bg-amber-100 text-amber-700 dark:text-amber-400" : 
                                                item.status === 'Failed' ? "bg-red-100 text-red-700 dark:text-red-400" : "bg-background text-foreground"
                                            )}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">No transactions found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>

        {/* RIGHT: ANALYSIS & STATUS */}
        <div className="space-y-6">
            
            {/* Reconciliation Status Card */}
            <Card className={cn("border-none shadow-sm", stats.discrepancyCount > 0 ? "bg-amber-50 dark:bg-amber-500/10" : "bg-emerald-50 dark:bg-emerald-500/10")}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                        <Wallet className="h-5 w-5 opacity-70"/> Settlement Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {stats.discrepancyCount > 0 ? (
                        <div>
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                                <AlertTriangle className="h-6 w-6"/>
                                <span className="text-lg font-bold">Attention Needed</span>
                            </div>
                            <p className="text-sm text-amber-800/80">
                                There are <span className="font-bold">{stats.discrepancyCount} transactions</span> marked as Pending or Failed. Please investigate with the bank.
                            </p>
                            <Button size="sm" className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white border-none">View Discrepancies</Button>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                                <CheckCircle2 className="h-6 w-6"/>
                                <span className="text-lg font-bold">Fully Balanced</span>
                            </div>
                            <p className="text-sm text-emerald-800/80">
                                All card transactions have been successfully matched with bank records.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Card Distribution Chart */}
            <Card className="border-none shadow-sm bg-card">
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Revenue by Card</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.Other} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value) => formatLKR(value)} 
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

        </div>

      </div>
    </div>
  );
}