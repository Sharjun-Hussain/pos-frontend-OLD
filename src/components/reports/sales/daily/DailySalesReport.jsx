"use client";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useRef, useEffect, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import { format, subDays } from "date-fns";
import {
  Printer,
  FileText,
  Download,
  Search,
  Calendar as CalendarIcon,
  Filter,
  ArrowRight,
  SlidersHorizontal,
  RefreshCw,
  Check,
  ChevronsUpDown,
  DollarSign,
  Receipt,
  Tag,
  CreditCard,
  CreditCard as PaymentIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { SalesSummaryPrintTemplate } from "@/components/Template/sales/SalesSummaryPrintTemplate";
import { Skeleton } from "@/components/ui/skeleton";

import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

export default function DailySalesSummaryPage() {
  const { data: session } = useSession();
  const { formatCurrency, formatDateTime, localization, pos } = useAppSettings();
  
  const currencySymbol = useMemo(() => {
    const currencies = [
      { code: "LKR", symbol: "Rs" },
      { code: "USD", symbol: "$" },
      { code: "EUR", symbol: "€" },
      { code: "GBP", symbol: "£" },
      { code: "INR", symbol: "₹" },
    ];
    return currencies.find(c => c.code === localization?.currency)?.symbol || "Rs";
  }, [localization]);

  const paymentMethods = useMemo(() => {
    const baseMethods = pos?.paymentMethods || ['Cash', 'Card', 'Cheque', 'Voucher'];
    return [...baseMethods, 'Credit', 'Return'];
  }, [pos]);

  const [date, setDate] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [apiStats, setApiStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter States
  const [branch, setBranch] = useState("all");
  const [user, setUser] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [amountRange, setAmountRange] = useState([0, 5000]);
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Metadata States
  const [branches, setBranches] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [branchOpen, setBranchOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!session?.accessToken) return;
      try {
        const [branchRes, sellerRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/active-sellers`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
          })
        ]);

        const branchData = await branchRes.json();
        const sellerData = await sellerRes.json();

        if (branchData.status === 'success') setBranches(branchData.data || []);
        if (sellerData.status === 'success') setSellers(sellerData.data || []);

      } catch (err) {
        console.error("Failed to fetch metadata", err);
      }
    };
    fetchMetadata();
  }, [session?.accessToken]);

  const fetchData = async () => {
      if (!session?.accessToken) return;
      setIsLoading(true);
      try {
          const queryParams = new URLSearchParams({
              start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
              end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
              branch_id: branch,
              user_id: user
          });

           const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/daily?${queryParams}`, {
              headers: { Authorization: `Bearer ${session.accessToken}` }
          });
          const result = await res.json();

          if (res.status === 401) {
              signOut({ callbackUrl: '/login' });
              return;
          }

          if (result.status === 'success') {
              setData(result.data.transactions || []);
              setApiStats(result.data.stats || null);
          } else {
              toast.error(result.message || "Failed to fetch sales data");
          }
      } catch (error) {
          console.error("Error fetching report:", error);
          toast.error("Failed to load report");
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, [session?.accessToken, date, branch, user]);

  useEffect(() => {
    if (data.length > 0) {
      const amounts = data.map(item => Math.abs(item.total || 0));
      const maxAmount = Math.max(...amounts);
      const minAmount = Math.min(...amounts);
      if (maxAmount > amountRange[1] || minAmount < amountRange[0]) {
        setAmountRange([0, Math.ceil(maxAmount / 1000) * 1000 + 1000]);
      }
    }
  }, [data]);

  const stats = apiStats || {
    totalSales: filteredData.reduce((acc, curr) => acc + (curr.total || 0), 0),
    totalTransactions: filteredData.length,
    avgValue: (filteredData.reduce((acc, curr) => acc + (curr.total || 0), 0) / (filteredData.length || 1)).toFixed(2),
    totalDiscounts: filteredData.reduce((acc, curr) => acc + (curr.discount || 0), 0),
    paymentBreakdown: { cash: 0, card: 0, credit: 0 }
  };

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Sales_Report",
  });

  const handleExportCSV = () => {
    const exportData = filteredData.map(item => ({
      "Invoice No": item.id,
      "Date": formatDateTime(item.date),
      "Customer": item.customer,
      "Total": item.subtotal,
      "Discount": item.discount,
      "Net Total": item.total,
      "Payment Type": item.type,
      "Cashier": item.cashier
    }));
    exportToCSV(exportData, "Daily_Sales_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      "Invoice No": item.id,
      "Date": formatDateTime(item.date),
      "Customer": item.customer,
      "Total": item.subtotal,
      "Discount": item.discount,
      "Net Total": item.total,
      "Payment Type": item.type,
      "Cashier": item.cashier
    }));
    exportToExcel(exportData, "Daily_Sales_Report");
  };

  useEffect(() => {
    let result = data;
    if (searchQuery) {
      result = result.filter(item => 
        item.customer?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (paymentFilter === 'credit') {
      result = result.filter(item => item.payment_status === 'unpaid' || item.payment_status === 'partially_paid');
    } else if (paymentFilter === 'return') {
      result = result.filter(item => item.status === 'Return');
    } else if (paymentFilter !== 'all') {
      result = result.filter(item => item.type?.toLowerCase() === paymentFilter);
    }
    result = result.filter(item => Math.abs(item.total) >= amountRange[0] && Math.abs(item.total) <= amountRange[1]);
    setFilteredData(result);
  }, [searchQuery, paymentFilter, amountRange, data]);

  const PaymentBar = () => {
    const breakdown = stats.paymentBreakdown || {};
    const getPercentage = (key) => {
      const entry = Object.entries(breakdown).find(([k]) => k.toLowerCase() === key.toLowerCase());
      return entry ? entry[1] : 0;
    };
    const cashPct = getPercentage('cash');
    const cardPct = getPercentage('card');
    const creditPct = getPercentage('credit');
    return (
      <div className="w-full">
        <div className="h-2 w-full flex rounded-full overflow-hidden mb-3 bg-muted/40 shadow-inner">
          {cashPct > 0 && <div style={{ width: `${cashPct}%` }} className="bg-[#10b981] h-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
          {cardPct > 0 && <div style={{ width: `${cardPct}%` }} className="bg-emerald-400 h-full opacity-80" />}
          {creditPct > 0 && <div style={{ width: `${creditPct}%` }} className="bg-amber-500 h-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
        </div>
        <div className="grid grid-cols-3 gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></div>Cash {cashPct}%</div>
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>Card {cardPct}%</div>
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>Credit {creditPct}%</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-background max-w-[1600px] mx-auto w-full font-sans text-foreground pb-20">
      
      <div style={{ display: "none" }}>
        <SalesSummaryPrintTemplate 
          ref={printRef} 
          data={filteredData} 
          dateRange={date} 
          stats={{
            ...stats,
            branchName: branch === 'all' ? 'All Branches' : branches.find(b => String(b.id) === String(branch))?.name || 'Branch'
          }} 
          formatDateTime={formatDateTime}
        />
      </div>

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Daily Sales Summary</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Sales Performance</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Reports</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Aggregate Analysis</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
            <FileText className="h-4 w-4" /> Excel
          </Button>
          <Button onClick={handlePrint} className="bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20 gap-2 hover:bg-[#0da371] h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-none transition-all active:scale-95">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button onClick={fetchData} className="h-10 w-10 rounded-xl bg-card border border-border/50 text-foreground hover:bg-muted/30 shadow-sm transition-all active:scale-95" variant="outline" disabled={isLoading}>
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-row items-center gap-3">
          <Filter className="w-4 h-4 text-[#10b981]" />
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Performance Filters</CardTitle>
            <CardDescription className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-tight">Trace revenue streams across dimensions</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left h-11 rounded-xl border-border/50 bg-background font-bold text-xs">
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#10b981]" />
                      {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd, y")}</> : format(date.from, "LLL dd, y")) : <span>Select range</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
            </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Branch / Outlet</label>
                <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={branchOpen}
                      className="w-full justify-between h-11 rounded-xl border-border/50 bg-background font-bold text-xs group"
                    >
                      <span className="truncate">{branch === "all" ? "All Global Locations" : branches.find((b) => String(b.id) === String(branch))?.name || "All Branches"}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:text-[#10b981] transition-colors" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search branches..." className="font-bold border-none h-11 uppercase" />
                      <CommandList>
                        <CommandEmpty className="py-4 text-xs font-bold text-muted-foreground uppercase text-center">No location found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="All Branches"
                            onSelect={() => {
                              setBranch("all");
                              setBranchOpen(false);
                            }}
                            className="font-bold text-xs py-3"
                          >
                            <Check className={cn("mr-2 h-4 w-4", branch === "all" ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                            All Global Locations
                          </CommandItem>
                          {branches.map((b) => (
                            <CommandItem
                              key={b.id}
                              value={b.name}
                              onSelect={() => {
                                setBranch(b.id);
                                setBranchOpen(false);
                              }}
                              className="font-bold text-xs py-3"
                            >
                              <Check className={cn("mr-2 h-4 w-4", String(branch) === String(b.id) ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                              {b.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
            </div>
            
            <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Cashier / POS User</label>
                <Popover open={userOpen} onOpenChange={setUserOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={userOpen}
                      className="w-full justify-between h-11 rounded-xl border-border/50 bg-background font-bold text-xs group"
                    >
                      <span className="truncate">{user === "all" ? "All System Users" : sellers.find((s) => String(s.id) === String(user))?.name || "All Users"}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:text-[#10b981] transition-colors" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search users..." className="font-bold border-none h-11 uppercase" />
                      <CommandList>
                        <CommandEmpty className="py-4 text-xs font-bold text-muted-foreground uppercase text-center">No user found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="All Users"
                            onSelect={() => {
                              setUser("all");
                              setUserOpen(false);
                            }}
                            className="font-bold text-xs py-3"
                          >
                            <Check className={cn("mr-2 h-4 w-4", user === "all" ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                            All System Users
                          </CommandItem>
                          {sellers.map((s) => (
                            <CommandItem
                              key={s.id}
                              value={s.name}
                              onSelect={() => {
                                setUser(s.id);
                                setUserOpen(false);
                              }}
                              className="font-bold text-xs py-3"
                            >
                              <Check className={cn("mr-2 h-4 w-4", String(user) === String(s.id) ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                              {s.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
            </div>

            <div className="flex gap-2">
               <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 h-11 rounded-xl border-dashed border-border text-muted-foreground/60 gap-2 font-bold text-[10px] uppercase tracking-widest hover:text-[#10b981] hover:border-[#10b981]/50">
                      <SlidersHorizontal className="h-4 w-4" /> Advanced
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-6" align="end">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#10b981]">Monetary Value ({currencySymbol})</Label>
                        <Slider defaultValue={[0, 1000]} max={5000} step={10} value={amountRange} onValueChange={setAmountRange} className="py-4" />
                        <div className="flex justify-between text-[11px] font-black tabular-nums text-muted-foreground">
                          <span className="bg-muted px-2 py-0.5 rounded-md">{currencySymbol} {amountRange[0]}</span>
                          <span className="bg-muted px-2 py-0.5 rounded-md">{currencySymbol} {amountRange[1]}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#10b981]">Settlement Protocol</Label>
                        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                          <SelectTrigger className="h-10 rounded-xl border-border/50 bg-background font-bold text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Channels</SelectItem>
                            {paymentMethods.map(method => (
                              <SelectItem key={method.toLowerCase()} value={method.toLowerCase()}>{method}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="ghost" size="sm" className="w-full h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10" onClick={() => {setPaymentFilter("all"); setAmountRange([0,5000])}}>Reset System Tags</Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button onClick={fetchData} className="flex-1 bg-[#10b981] hover:bg-[#0da371] text-white h-11 rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#10b981]/20">
                    Apply
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- DASHBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm bg-[#10b981] overflow-hidden group hover:shadow-md transition-all duration-500 relative text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-white/20" />
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="p-3.5 w-fit rounded-2xl bg-white/20 border border-white/30 shadow-lg group-hover:scale-110 transition-transform duration-500">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.15em] text-white/80 uppercase mb-1">Total Net Revenue</p>
                  <h3 className="text-2xl font-black tabular-nums tracking-tight">
                    {isLoading ? <Skeleton className="h-8 w-32 bg-white/20" /> : formatCurrency(stats.totalSales || 0)}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-emerald-500/10" />
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="p-3.5 w-fit rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70 mb-1">Total Transactions</p>
                  <h3 className="text-2xl font-black text-foreground tabular-nums tracking-tight">
                    {isLoading ? <Skeleton className="h-8 w-16" /> : stats.totalTransactions || 0}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-orange-500/10" />
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <div className="p-3.5 w-fit rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70 mb-1">Marketing Discounts</p>
                  <h3 className="text-2xl font-black text-orange-600 tabular-nums tracking-tight">
                    {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(Math.abs(stats.totalDiscounts || 0))}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-blue-500/10" />
            <CardContent className="p-6">
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70">Payment Velocity</p>
                   <PaymentIcon className="w-3.5 h-3.5 text-blue-500/60" />
                </div>
                <PaymentBar />
              </div>
            </CardContent>
          </Card>
      </div>

      {/* --- DATA TABLE --- */}
      <Card className="border-none shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-row items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-[#10b981]" />
              <div>
                <CardTitle className="text-base font-bold text-foreground">Transaction Ledger</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-0.5">Audited chronological list of business events</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/search:text-[#10b981] transition-colors" />
                  <Input 
                      placeholder="Search customers or invoices..." 
                      className="pl-11 h-10 rounded-xl border-border/50 bg-background font-bold text-[11px] focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                      value={searchQuery}
                      onChange={(e)=>setSearchQuery(e.target.value)}
                  />
              </div>
              {isLoading && <Badge className="bg-[#10b981]/10 text-[#10b981] animate-pulse rounded-lg font-bold border-none uppercase text-[9px] tracking-widest px-2 shadow-none">Syncing Transactions</Badge>}
            </div>
        </CardHeader>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="pl-6 font-bold text-foreground py-4 text-[10px] uppercase tracking-widest">Execution Date</TableHead>
              <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Reference #</TableHead>
              <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Customer Profile</TableHead>
              <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Net Revenue</TableHead>
              <TableHead className="text-center font-bold text-foreground text-[10px] uppercase tracking-widest">Settlement</TableHead>
              <TableHead className="text-right pr-6 font-bold text-foreground text-[10px] uppercase tracking-widest">Auth Personnel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  <TableCell className="pl-6 py-4"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 font-mono" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto rounded-lg" /></TableCell>
                  <TableCell className="text-right pr-6"><Skeleton className="h-4 w-28 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => {
                const isReturn = item.status === 'Return';
                const isCredit = item.payment_status === 'unpaid' || item.payment_status === 'partially_paid';
                const unpaidAmount = item.total - (item.paid_amount || 0);
                
                return (
                  <TableRow key={item.id} className={cn(
                    "hover:bg-muted/30 transition-colors border-border/40 group relative overflow-hidden",
                    isCredit && "bg-amber-500/[0.02]"
                  )}>
                    {isCredit && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]" />}
                    <TableCell className="pl-6 py-4 text-[11px] text-muted-foreground font-bold uppercase tracking-tight">
                        {formatDateTime(item.date)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-black text-foreground group-hover:text-[#10b981] transition-colors">
                        {item.id}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2.5">
                           <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground/60 uppercase">
                              {item.customer?.substring(0, 2)}
                           </div>
                           <span className="text-xs font-bold text-foreground/80">{item.customer || "Walk-in Market"}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className={cn(
                                "text-sm font-black tracking-tight",
                                isReturn ? "text-red-600" : "text-foreground"
                            )}>{formatCurrency(item.total || 0)}</span>
                            {isCredit && (
                                <span className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-0.5">
                                   Due: {formatCurrency(unpaidAmount)}
                                </span>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                        <div className="flex justify-center flex-col items-center gap-1">
                          <Badge variant="outline" className={cn(
                              "uppercase text-[9px] font-black tracking-widest h-6 px-3 flex items-center shadow-none border-none rounded-lg transition-all",
                              isCredit ? "bg-amber-500/10 text-amber-600" :
                              item.type?.toLowerCase() === 'card' ? "bg-blue-500/10 text-blue-600" :
                              item.type?.toLowerCase() === 'cash' ? "bg-emerald-500/10 text-[#10b981]" :
                              item.type?.toLowerCase() === 'cheque' ? "bg-purple-500/10 text-purple-600" :
                              "bg-muted/40 text-muted-foreground"
                          )}>
                              {isCredit ? "Deferred Credit" : item.type}
                          </Badge>
                          {isCredit && <span className="text-[8px] text-muted-foreground/40 font-black uppercase tracking-widest">via {item.type}</span>}
                        </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{item.cashier}</p>
                        <p className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest mt-0.5">Terminal active</p>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-48 text-center py-20">
                   <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-full bg-muted/30 text-muted-foreground/20">
                      <Receipt className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="font-bold text-muted-foreground text-sm uppercase tracking-widest">No transaction records found</h4>
                      <p className="text-xs text-muted-foreground/60 font-medium">Clear search or adjust filters to expand view.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="px-6 py-4 flex justify-between items-center border-t border-border/30 bg-muted/5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
             Analyzing {filteredData.length} fiscal data points
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-30" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-30" disabled>Next</Button>
          </div>
        </div>
      </Card>

    </div>
  );
}