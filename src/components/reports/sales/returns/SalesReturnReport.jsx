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
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  TrendingUp,
  Users,
  ArrowUpRight,
  SlidersHorizontal,
  RefreshCcw
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
import { Label } from "@/components/ui/label";
import { SalesReturnReportTemplate } from "@/components/Template/sales/SalesReturnReportTemplate";

import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

export default function SalesReturnReport() {
  const { data: session } = useSession();
  const { formatCurrency, formatDateTime } = useAppSettings();
  
  const [date, setDate] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [apiStats, setApiStats] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Filter States
  const [branch, setBranch] = useState("all");
  const [user, setUser] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refundMethod, setRefundMethod] = useState("all");

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
      setLoading(true);
      try {
          const queryParams = new URLSearchParams({
              start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
              end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
              branch_id: branch,
              user_id: user
          });

           const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/returns?${queryParams}`, {
              headers: { Authorization: `Bearer ${session.accessToken}` }
          });
          const result = await res.json();

          if (res.status === 401) {
              signOut({ callbackUrl: '/login' });
              return;
          }

          if (result.status === 'success') {
              // The backend now returns { data: [...], stats: {...} }
              setData(result.data.data || []);
              setApiStats(result.data.stats || null);
          } else {
              toast.error(result.message || "Failed to fetch data");
          }
      } catch (error) {
          console.error("Error fetching report:", error);
          toast.error("Failed to load report");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, [session?.accessToken, date, branch, user]);

  // --- PRINTING LOGIC ---
  const printRef = useRef(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Sales_Return_Report",
  });

  // --- EXPORT LOGIC ---
  const handleExportCSV = () => {
    const exportData = filteredData.map(item => ({
      "Return No": item.return_number,
      "Date": formatDateTime(item.return_date),
      "Original Invoice": item.sale?.invoice_number || "N/A",
      "Customer": item.customer?.name || "Walk-in",
      "Total Amount": item.total_amount,
      "Refund Amount": item.refund_amount,
      "Refund Method": item.refund_method,
      "Cashier": item.cashier?.name || "Unknown"
    }));
    exportToCSV(exportData, "Sales_Return_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      "Return No": item.return_number,
      "Date": formatDateTime(item.return_date),
      "Original Invoice": item.sale?.invoice_number || "N/A",
      "Customer": item.customer?.name || "Walk-in",
      "Total Amount": item.total_amount,
      "Refund Amount": item.refund_amount,
      "Refund Method": item.refund_method,
      "Cashier": item.cashier?.name || "Unknown"
    }));
    exportToExcel(exportData, "Sales_Return_Report");
  };

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = data;

    if (searchQuery) {
      result = result.filter(item => 
        item.return_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sale?.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (refundMethod !== 'all') {
      result = result.filter(item => item.refund_method?.toLowerCase() === refundMethod.toLowerCase());
    }

    setFilteredData(result);
  }, [searchQuery, refundMethod, data]);


  return (
    <div className="flex-1 p-8 bg-muted/30 min-h-screen space-y-8 font-sans text-foreground">
      
      {/* HIDDEN PRINT TEMPLATE */}
      <div style={{ display: "none" }}>
        <SalesReturnReportTemplate 
          ref={printRef} 
          data={filteredData} 
          dateRange={date} 
          stats={apiStats || {}} 
          formatDateTime={formatDateTime}
        />
      </div>

      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales Return Analysis</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Reports</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground font-medium">Returns Performance</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30">
            <FileText className="h-4 w-4" /> Excel
          </Button>
          <Button onClick={() => handlePrint()} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Printer className="h-4 w-4" /> Print Report
          </Button>
        </div>
      </div>

      {/* --- FILTERS & CONTROLS --- */}
      <Card className="border-none shadow-sm bg-card">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            
            {/* DATE RANGE PICKER */}
            <div className="flex-1 space-y-2 w-full lg:w-auto">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Return Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 border-border/50",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground/60" />
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
                      <span>Pick a date range</span>
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

            {/* BRANCH FILTER */}
            <div className="w-full lg:w-[200px] space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch</label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="h-10 w-full bg-card border-border/50"><SelectValue placeholder="All Branches" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* USER FILTER */}
            <div className="w-full lg:w-[200px] space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cashier</label>
              <Select value={user} onValueChange={setUser}>
                <SelectTrigger className="h-10 w-full bg-card border-border/50"><SelectValue placeholder="All Cashiers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cashiers</SelectItem>
                  {sellers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ADVANCED FILTER */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 border-dashed border-border text-muted-foreground gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Advanced
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <h4 className="font-semibold leading-none text-foreground">Additional Filters</h4>
                  <div className="space-y-2">
                    <Label className="text-xs">Refund Method</Label>
                    <Select value={refundMethod} onValueChange={setRefundMethod}>
                      <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="credit">Credit / Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" variant="ghost" className="w-full mt-2 text-xs" onClick={() => {setRefundMethod("all")}}>Reset Advanced Filters</Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button onClick={fetchData} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-6 shadow-sm disabled:opacity-50">
                {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : "Apply Filters"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- ANALYTICAL DASHBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: "Total Returns", 
            value: apiStats?.totalReturns || 0, 
            icon: RotateCcw, 
            color: "text-orange-600",
            bg: "bg-orange-50"
          },
          { 
            label: "Return Value", 
            value: formatCurrency(apiStats?.totalReturnAmount || 0), 
            icon: TrendingUp, 
            color: "text-emerald-500",
            bg: "bg-emerald-50 dark:bg-emerald-500/100/10"
          },
          { 
            label: "Refunded Amount", 
            value: formatCurrency(apiStats?.totalRefundAmount || 0), 
            icon: ArrowUpRight, 
            color: "text-emerald-600 dark:text-emerald-500",
            bg: "bg-emerald-50 dark:bg-emerald-500/10"
          },
          { 
            label: "Unique Customers", 
            value: apiStats?.uniqueCustomers || 0, 
            icon: Users, 
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-500/10"
          },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-2xl font-black text-foreground mt-0.5">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- DATA TABLE --- */}
      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <div className="p-4 border-b border-border/30 flex justify-between items-center bg-card">
            <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input 
                    placeholder="Filter by ref, customer, invoice..." 
                    className="pl-10 bg-muted/30 border-border/30 h-10 rounded-lg text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                Aggregated Records: <span className="text-foreground font-black">{filteredData.length}</span>
            </div>
        </div>
        <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-muted/20">
                    <TableRow>
                        <TableHead className="pl-6 font-bold text-muted-foreground text-xs uppercase tracking-wider">Return #</TableHead>
                        <TableHead className="font-bold text-muted-foreground text-xs uppercase tracking-wider">Date</TableHead>
                        <TableHead className="font-bold text-muted-foreground text-xs uppercase tracking-wider">Inv Reference</TableHead>
                        <TableHead className="font-bold text-muted-foreground text-xs uppercase tracking-wider">Customer</TableHead>
                        <TableHead className="font-bold text-muted-foreground text-xs uppercase tracking-wider text-right">Value</TableHead>
                        <TableHead className="font-bold text-muted-foreground text-xs uppercase tracking-wider text-right">Refund</TableHead>
                        <TableHead className="font-bold text-muted-foreground text-xs uppercase tracking-wider">Method</TableHead>
                        <TableHead className="pr-6 font-bold text-muted-foreground text-xs uppercase tracking-wider text-right">Cashier</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.length > 0 ? filteredData.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-b border-border/20/50">
                            <TableCell className="pl-6 py-4">
                              <span className="font-black text-foreground uppercase tracking-tighter text-sm">{item.return_number}</span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{format(new Date(item.return_date), "MMM dd, yyyy")}</TableCell>
                            <TableCell className="font-bold text-muted-foreground/60 text-sm tracking-tight">{item.sale?.invoice_number || "N/A"}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground text-sm">{item.customer?.name || "Walk-in"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-muted-foreground text-sm">{formatCurrency(item.total_amount)}</TableCell>
                            <TableCell className="text-right font-black text-emerald-600 dark:text-emerald-500 text-sm">{formatCurrency(item.refund_amount)}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-border/50 text-[10px] font-black uppercase">
                                    {item.refund_method}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6 font-medium text-muted-foreground text-sm">{item.cashier?.name || "Unknown"}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={8} className="h-32 text-center text-muted-foreground/60 italic font-medium">
                                No records found for the selected criteria.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <div className="px-6 py-4 flex items-center justify-end gap-2 bg-muted/10 border-t border-border/30">
                <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" disabled><ChevronLeft className="h-3 w-3 mr-1"/> Prev</Button>
                <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">Next <ChevronRight className="h-3 w-3 ml-1"/></Button>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
