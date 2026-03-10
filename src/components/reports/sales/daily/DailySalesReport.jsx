"use client";
import { useAppSettings } from "@/app/hooks/useAppSettings";

import { useState, useRef, useEffect, useMemo } from "react";
import { useReactToPrint } from "react-to-print"; // FIX: Updated usage below
import { format, subDays } from "date-fns";
import {
  Printer,
  FileText,
  Download,
  Search,
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
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


import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";


export default function DailySalesSummaryPage() {
  const { data: session } = useSession();
  const { formatCurrency, formatDate, formatDateTime, localization, finance, pos } = useAppSettings();
  
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
  
  // Filter States
  const [branch, setBranch] = useState("all");
  const [user, setUser] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [amountRange, setAmountRange] = useState([0, 5000]);
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Metadata States
  const [branches, setBranches] = useState([]);
  const [sellers, setSellers] = useState([]);

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

        if (branchData.status === 'success') setBranches(branchData.data);
        if (sellerData.status === 'success') setSellers(sellerData.data);

      } catch (err) {
        console.error("Failed to fetch metadata", err);
      }
    };
    fetchMetadata();
  }, [session?.accessToken]);

  const fetchData = async () => {
      if (!session?.accessToken) return;
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
              setData(result.data.transactions);
              setApiStats(result.data.stats);
          } else {
              toast.error(result.message || "Failed to fetch sales data");
          }
      } catch (error) {
          if (error.status === 401) {
              signOut({ callbackUrl: '/login' });
          }
          console.error("Error fetching report:", error);
          toast.error("Failed to load report");
      }
  };

  useEffect(() => {
      fetchData();
  }, [session?.accessToken, date, branch, user]);

  // Auto-adjust amount range when data changes
  useEffect(() => {
    if (data.length > 0) {
      const amounts = data.map(item => Math.abs(item.total || 0));
      const maxAmount = Math.max(...amounts);
      const minAmount = Math.min(...amounts);
      
      // Only update if current range doesn't include all data
      if (maxAmount > amountRange[1] || minAmount < amountRange[0]) {
        setAmountRange([0, Math.ceil(maxAmount / 1000) * 1000 + 1000]); // Round up to nearest 1000
      }
    }
  }, [data]);

  // --- STATS CALCULATION ---
  const stats = apiStats || {
    totalSales: filteredData.reduce((acc, curr) => acc + (curr.total || 0), 0),
    totalTransactions: filteredData.length,
    avgValue: (filteredData.reduce((acc, curr) => acc + (curr.total || 0), 0) / (filteredData.length || 1)).toFixed(2),
    totalDiscounts: filteredData.reduce((acc, curr) => acc + (curr.discount || 0), 0),
    paymentBreakdown: {
      cash: 0, card: 0, credit: 0 
    }
  };

  // --- PRINTING LOGIC (FIXED) ---
  const printRef = useRef(null);
  
  // Use contentRef directly in the options object
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Sales_Report",
  });

  // --- EXPORT LOGIC ---
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

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = data;

    if (searchQuery) {
      result = result.filter(item => 
        item.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (paymentFilter === 'credit') {
      result = result.filter(item => item.payment_status === 'unpaid' || item.payment_status === 'partially_paid');
    } else if (paymentFilter === 'return') {
      result = result.filter(item => item.status === 'Return');
    } else if (paymentFilter !== 'all') {
      result = result.filter(item => item.type.toLowerCase() === paymentFilter);
    }

    // Amount Range Logic (Absolute value to handle returns)
    result = result.filter(item => Math.abs(item.total) >= amountRange[0] && Math.abs(item.total) <= amountRange[1]);

    setFilteredData(result);
  }, [searchQuery, paymentFilter, amountRange, data]);


  // --- RENDER HELPERS ---
  const PaymentBar = () => {
    const breakdown = stats.paymentBreakdown || {};
    
    // Normalize keys to capitalize for display and match colors
    const getPercentage = (key) => {
      const entry = Object.entries(breakdown).find(([k]) => k.toLowerCase() === key.toLowerCase());
      return entry ? entry[1] : 0;
    };

    const cashPct = getPercentage('cash');
    const cardPct = getPercentage('card');
    const creditPct = getPercentage('credit');

    return (
      <div className="w-full">
        <div className="h-4 w-full flex rounded-full overflow-hidden mb-2">
          {cashPct > 0 && <div style={{ width: `${cashPct}%` }} className="bg-emerald-50 dark:bg-emerald-500/100 h-full" title={`Cash: ${cashPct}%`} />}
          {cardPct > 0 && <div style={{ width: `${cardPct}%` }} className="bg-emerald-50 dark:bg-emerald-500/100 h-full" title={`Card: ${cardPct}%`} />}
          {creditPct > 0 && <div style={{ width: `${creditPct}%` }} className="bg-amber-50 dark:bg-amber-500/100 h-full" title={`Credit: ${creditPct}%`} />}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
          {cashPct > 0 && <div className="flex items-center gap-1 min-w-0 truncate"><div className="w-1.5 h-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/100 shrink-0"></div>Cash {cashPct}%</div>}
          {cardPct > 0 && <div className="flex items-center gap-1 min-w-0 truncate"><div className="w-1.5 h-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/100 shrink-0"></div>Card {cardPct}%</div>}
          {creditPct > 0 && <div className="flex items-center gap-1 min-w-0 truncate"><div className="w-1.5 h-1.5 rounded-full bg-amber-50 dark:bg-amber-500/100 shrink-0"></div>Credit {creditPct}%</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-8 bg-muted/30 min-h-screen space-y-8 font-sans text-foreground">
      
      {/* HIDDEN PRINT TEMPLATE 
        The 'display: none' ensures it doesn't clutter the UI, 
        but the DOM element exists for react-to-print to grab.
      */}
      <div style={{ display: "none" }}>
        <SalesSummaryPrintTemplate 
          ref={printRef} 
          data={filteredData} 
          dateRange={date} 
          stats={{
            ...stats,
            branchName: branch === 'all' ? 'All Branches' : branches.find(b => b.id === branch)?.name || 'Branch'
          }} 
          formatDateTime={formatDateTime}
        />
      </div>

      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Daily Sales Summary</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Reports</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground font-medium">Sales Performance</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => handlePrint()} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30">
            <FileText className="h-4 w-4" /> Export PDF
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30">
            <FileText className="h-4 w-4" /> Excel
          </Button>
          <Button onClick={() => handlePrint()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* --- FILTERS & CONTROLS --- */}
      <Card className="border-none shadow-sm bg-card">
        <CardContent className="p-6 space-y-6">
          
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            
            {/* DATE RANGE PICKER */}
            <div className="flex-1 space-y-2 w-full lg:w-auto">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 border-border/50",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* FILTERS */}
            <div className="w-full lg:w-[200px] space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch</label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="h-10 w-full bg-card border-border/50"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full lg:w-[200px] space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">User</label>
              <Select value={user} onValueChange={setUser}>
                <SelectTrigger className="h-10 w-full bg-card border-border/50"><SelectValue placeholder="All Users" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {sellers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ADVANCED FILTER POPOVER */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 border-dashed border-border text-muted-foreground gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Advanced
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <h4 className="font-semibold leading-none text-foreground">Advanced Filters</h4>
                  <div className="space-y-2">
                    <Label className="text-xs">Amount Range ({currencySymbol})</Label>
                    <Slider defaultValue={[0, 1000]} max={5000} step={10} value={amountRange} onValueChange={setAmountRange} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{currencySymbol} {amountRange[0]}</span>
                      <span>{currencySymbol} {amountRange[1]}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Payment Method</Label>
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                      <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {paymentMethods.map(method => (
                          <SelectItem key={method.toLowerCase()} value={method.toLowerCase()}>{method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" className="w-full mt-2" onClick={() => {setPaymentFilter("all"); setAmountRange([0,5000])}}>Reset Filters</Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-6 shadow-sm">
                Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- SUMMARY DASHBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-card p-4 flex flex-col justify-center">
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">Total Sales</p>
            <h3 className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalSales || 0)}</h3>
         </Card>
         <Card className="border-none shadow-sm bg-card p-4 flex flex-col justify-center">
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">Transactions</p>
            <h3 className="text-2xl font-bold text-foreground">{stats.totalTransactions || 0}</h3>
         </Card>
         <Card className="border-none shadow-sm bg-card p-4 flex flex-col justify-center">
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">Total Discounts</p>
            <h3 className="text-2xl font-bold text-orange-600">{formatCurrency(Math.abs(stats.totalDiscounts || 0))}</h3>
         </Card>
         <Card className="border-none shadow-sm bg-card p-4 flex flex-col justify-center">
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider mb-3">Payment Breakdown</p>
            <PaymentBar />
         </Card>
      </div>

      {/* --- DATA TABLE --- */}
      <Card className="border-none shadow-sm bg-card">
        <div className="p-4 border-b border-border/30 flex justify-between items-center">
            <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/60" />
                <Input 
                    placeholder="Search invoice or customer..." 
                    className="pl-9 bg-muted/30 border-border/50 h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="text-sm text-muted-foreground">
                Showing <span className="font-bold text-foreground">{filteredData.length}</span> transactions
            </div>
        </div>
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-muted/30 border-b border-border/30">
                    <TableRow>
                        <TableHead className="w-[180px] pl-6 font-semibold text-muted-foreground">Date</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Invoice No</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Customer</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Total</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Discount</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Net Amount</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Payment</TableHead>
                        <TableHead className="text-right pr-6 font-semibold text-muted-foreground">Cashier</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.length > 0 ? filteredData.map((item) => {
                        const isReturn = item.status === 'Return';
                        const isCredit = item.payment_status === 'unpaid' || item.payment_status === 'partially_paid';
                        const unpaidAmount = item.total - (item.paid_amount || 0);
                        
                        return (
                            <TableRow key={item.id} className={`hover:bg-muted/30 transition-colors border-b border-border/20 ${isCredit ? 'bg-amber-50/30 dark:bg-amber-500/10' : ''}`}>
                                <TableCell className="pl-6 py-3 text-muted-foreground">{formatDateTime(item.date)}</TableCell>
                                <TableCell className="font-medium text-foreground">{item.id}</TableCell>
                                <TableCell className="text-muted-foreground">{item.customer}</TableCell>
                                <TableCell className={isReturn ? "text-red-600" : "text-muted-foreground"}>{formatCurrency(item.subtotal || 0)}</TableCell>
                                <TableCell className="text-muted-foreground">{formatCurrency(item.discount || 0)}</TableCell>
                                <TableCell className={`font-bold ${isReturn ? "text-red-600" : "text-foreground"}`}>
                                  <div className="flex flex-col gap-1">
                                    <span>{formatCurrency(item.total || 0)}</span>
                                    {isCredit && (
                                      <span className="text-xs text-amber-600 dark:text-amber-500 font-normal">
                                        Paid: {formatCurrency(item.paid_amount || 0)} | Due: {formatCurrency(unpaidAmount)}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                      <Badge variant="outline" className={
                                          isCredit ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20" :
                                          item.type?.toLowerCase() === 'card' ? "bg-emerald-50 dark:bg-emerald-500/100/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20" :
                                          item.type?.toLowerCase() === 'cash' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20" :
                                          item.type?.toLowerCase() === 'cheque' ? "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-500/20" :
                                          "bg-muted/30 text-foreground border-border/30"
                                      }>
                                          {isCredit ? "Credit" : item.type}
                                      </Badge>
                                      {isCredit && (
                                        <div className="text-[10px] text-muted-foreground/60 font-medium px-1">
                                          via {item.type}
                                        </div>
                                      )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-6 text-muted-foreground">{item.cashier}</TableCell>
                            </TableRow>
                        );
                    }) : (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground italic">
                                No transactions match your filters.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            <div className="px-6 py-4 flex items-center justify-end gap-2 border-t border-border/30">
                <Button variant="outline" size="sm" disabled><ChevronLeft className="h-4 w-4 mr-1"/> Previous</Button>
                <Button variant="outline" size="sm">Next <ChevronRight className="h-4 w-4 ml-1"/></Button>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}