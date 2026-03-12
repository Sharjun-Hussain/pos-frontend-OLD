"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Printer,
  FileText,
  Download,
  Calendar as CalendarIcon,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Receipt,
  Store,
  RefreshCw,
  Check,
  ChevronsUpDown,
  TrendingUp,
  Scale,
  Info
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { format, startOfMonth, endOfMonth } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export default function CardReconciliationPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();

  // --- STATES ---
  const [date, setDate] = useState({ 
    from: startOfMonth(new Date()), 
    to: endOfMonth(new Date()) 
  });
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [branchId, setBranchId] = useState("all");
  const [branches, setBranches] = useState([]);
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!session?.accessToken) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        const result = await response.json();
        if (result.status === 'success') {
          setBranches(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch branches", err);
      }
    };
    fetchBranches();
  }, [session?.accessToken]);

  const fetchData = async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        branch_id: branchId
      });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/card-reconciliation?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch report");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data.details);
        setSummary(result.data.summary);
      }
    } catch (err) {
      console.error(err);
      // Fallback to empty if error
      setData([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken, date, branchId]);

  const handleExportCSV = () => {
    const exportData = data.map(item => ({
      "Invoice No": item.invoice_number,
      "Date": format(new Date(item.created_at), 'yyyy-MM-dd HH:mm'),
      "Store": item.branch?.name || 'N/A',
      "Payment Method": item.payment_method,
      "Amount": item.payable_amount
    }));
    exportToCSV(exportData, "Card_Reconciliation_Report");
  };

  const handleExportExcel = () => {
    const exportData = data.map(item => ({
      "Invoice No": item.invoice_number,
      "Date": format(new Date(item.created_at), 'yyyy-MM-dd HH:mm'),
      "Store": item.branch?.name || 'N/A',
      "Payment Method": item.payment_method,
      "Amount": item.payable_amount
    }));
    exportToExcel(exportData, "Card_Reconciliation_Report");
  };

  const chartData = [
    { name: 'Card Settlement', value: summary?.totalSales || 0 },
  ];
  const COLORS = ['#10b981'];

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-background max-w-[1400px] mx-auto w-full font-sans text-foreground pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner">
            <CreditCard className="w-6 h-6 text-[#10b981]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Card Reconciliation</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Financial Hub</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Reports</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Card Settlement</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest">
            <FileText className="h-4 w-4" /> Excel Ledger
          </Button>
          <Button onClick={() => window.print()} className="bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20 gap-2 hover:bg-[#0da371] h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-none">
            <Printer className="h-4 w-4" /> Print Ledger
          </Button>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <Card className="border-none shadow-sm bg-card overflow-visible">
        <CardContent className="p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            
            {/* Date Range Selector */}
            <div className="space-y-2.5 w-full">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Select Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-semibold h-11 border-border/50 bg-background/50 hover:bg-muted/20 rounded-xl px-4 gap-3 shadow-sm transition-all",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 text-[#10b981] shrink-0" />
                    <span className="text-sm truncate font-semibold">
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd")} — {format(date.to, "LLL dd, yyyy")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, yyyy")
                        )
                      ) : (
                        <span>Pick period</span>
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-border/40 overflow-hidden" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    className="p-4"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Branch Selector */}
            <div className="space-y-2.5 w-full">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Store Name</label>
              <Popover open={isBranchOpen} onOpenChange={setIsBranchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-11 justify-between bg-background/50 border-border/50 rounded-xl hover:bg-muted/20 font-semibold text-sm px-4 shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <Store className="h-4 w-4 text-[#10b981] shrink-0" />
                      <span className="truncate">
                        {branchId === "all" ? "All Stores" : branches.find((b) => b.id === branchId)?.name}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 rounded-2xl border-border/40 shadow-2xl overflow-hidden" align="start">
                  <Command className="p-2">
                    <CommandInput placeholder="Search store..." className="h-11 text-xs border-none focus:ring-0 px-3 font-medium" />
                    <CommandList className="max-h-[300px] mt-1">
                      <CommandEmpty className="py-6 text-sm font-medium text-muted-foreground text-center">No store found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setBranchId("all");
                            setIsBranchOpen(false);
                          }}
                          className="rounded-xl m-1 text-sm font-semibold px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
                        >
                          <Check className={cn("mr-3 h-4 w-4 text-[#10b981]", branchId === "all" ? "opacity-100" : "opacity-0")} />
                          All Stores
                        </CommandItem>
                        {branches.map((b) => (
                          <CommandItem
                            key={b.id}
                            value={b.name}
                            onSelect={() => {
                              setBranchId(b.id);
                              setIsBranchOpen(false);
                            }}
                            className="rounded-xl m-1 text-sm font-semibold px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
                          >
                            <Check className={cn("mr-3 h-4 w-4 text-[#10b981]", branchId === b.id ? "opacity-100" : "opacity-0")} />
                            {b.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="lg:col-span-2 flex justify-end">
              <Button 
                onClick={fetchData} 
                className="h-11 w-11 rounded-xl bg-[#10b981] hover:bg-[#0da371] text-white shadow-lg shadow-[#10b981]/20 transition-all active:scale-95 border-none"
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- KPIS & CHART --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-blue-500/10" />
             <CardContent className="p-7">
                <div className="flex items-center gap-5">
                   <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500 text-blue-600">
                      <Scale className="w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-sm font-semibold text-muted-foreground/80 mb-1">Total Card Sales</p>
                      <h3 className="text-2xl font-bold text-foreground tabular-nums">{isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(summary?.totalSales)}</h3>
                   </div>
                </div>
             </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-[#10b981] overflow-hidden group hover:shadow-md transition-all duration-500 relative text-white">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-white/20" />
             <CardContent className="p-7">
                <div className="flex items-center gap-5">
                   <div className="p-4 rounded-2xl bg-white/20 border border-white/30 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                      <TrendingUp className="w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-sm font-semibold text-white/80 mb-1">Transactions</p>
                      <h3 className="text-2xl font-bold tabular-nums">{isLoading ? <Skeleton className="h-8 w-32 bg-white/20" /> : summary?.count || 0}</h3>
                   </div>
                </div>
             </CardContent>
          </Card>

          <Card className={cn("border-none shadow-sm overflow-hidden group transition-all duration-500 relative", (summary?.discrepancyCount > 0) ? "bg-red-500 text-white" : "bg-card border-emerald-500/20 border")}>
             <CardContent className="p-7">
                <div className="flex items-center gap-5">
                   <div className={cn("p-4 rounded-2xl border transition-transform duration-500", (summary?.discrepancyCount > 0) ? "bg-white/20 border-white/30 text-white" : "bg-red-500/10 border-red-500/20 text-red-600")}>
                      <AlertTriangle className="w-6 h-6" />
                   </div>
                   <div>
                      <p className={cn("text-sm font-semibold mb-1", (summary?.discrepancyCount > 0) ? "text-white/80" : "text-muted-foreground/80")}>Settlement Status</p>
                      <h3 className="text-lg font-bold">{(summary?.discrepancyCount > 0) ? "Action Required" : "Fully Balanced"}</h3>
                   </div>
                </div>
             </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-3 border-none shadow-sm bg-card overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 backdrop-blur-md">
            <CardTitle className="text-base font-bold text-foreground">Settlement Vector</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* --- TABLE --- */}
      <Card className="border-none shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 backdrop-blur-md">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold text-foreground">Transaction Breakdown</CardTitle>
                    <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-1">Itemized list of card payments within the period</CardDescription>
                </div>
                <div className="p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                  <Printer className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" onClick={() => window.print()} />
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="pl-6 font-bold text-foreground py-4">Invoice No</TableHead>
                <TableHead className="font-bold text-foreground">Date</TableHead>
                <TableHead className="font-bold text-foreground">Store</TableHead>
                <TableHead className="font-bold text-foreground text-center">Reference</TableHead>
                <TableHead className="text-right pr-6 font-bold text-foreground">Paid Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    <TableCell className="pl-6"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 opacity-20">
                      <Receipt className="h-12 w-12" />
                      <p className="text-sm font-bold">No card transactions found for the selected period.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={index} className="hover:bg-muted/30 transition-colors border-border/40 group">
                    <TableCell className="pl-6 font-medium text-foreground py-4 underline underline-offset-4 decoration-muted-foreground/20">{item.invoice_number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                    <TableCell className="text-sm font-semibold text-muted-foreground">{item.branch?.name || 'N/A'}</TableCell>
                    <TableCell className="text-center">
                       <Badge variant="outline" className="bg-[#10b981]/10 text-[#10b981] border-none font-bold text-[10px] py-1 rounded-lg">CARD_SALE</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 font-bold text-foreground">{formatCurrency(item.payable_amount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-[#10b981]/5 border-l-4 border-l-[#10b981] overflow-hidden">
        <CardContent className="p-6">
           <div className="flex gap-5">
              <div className="p-3 rounded-2xl bg-[#10b981]/10 text-[#10b981] shrink-0">
                 <Info className="h-6 w-6" />
              </div>
              <div className="flex-1">
                 <h4 className="font-bold text-[#10b981] text-sm mb-2 leading-none uppercase tracking-widest">Reconciliation Disclaimer</h4>
                 <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    This report verifies card transactions recorded within the POS system. Final settlement amounts may vary based on bank processing fees, chargebacks, and regional banking delays.
                 </p>
              </div>
              <CheckCircle2 className="h-12 w-12 text-[#10b981] opacity-20 shrink-0 self-center" />
           </div>
        </CardContent>
      </Card>

    </div>
  );
}