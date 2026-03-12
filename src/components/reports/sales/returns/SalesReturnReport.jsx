"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { format, subDays } from "date-fns";
import {
  Printer,
  FileText,
  Download,
  Search,
  Calendar as CalendarIcon,
  RotateCcw,
  TrendingUp,
  Users,
  ArrowUpRight,
  RefreshCcw,
  Check,
  ChevronsUpDown,
  Filter,
  Package,
  RefreshCw,
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
import { Label } from "@/components/ui/label";
import { SalesReturnReportTemplate } from "@/components/Template/sales/SalesReturnReportTemplate";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter States
  const [branch, setBranch] = useState("all");
  const [user, setUser] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refundMethod, setRefundMethod] = useState("all");
  const [branchOpen, setBranchOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

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

           const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/returns?${queryParams}`, {
              headers: { Authorization: `Bearer ${session.accessToken}` }
          });
          const result = await res.json();

          if (res.status === 401) {
              signOut({ callbackUrl: '/login' });
              return;
          }

          if (result.status === 'success') {
              setData(result.data.data || []);
              setApiStats(result.data.stats || null);
          } else {
              toast.error(result.message || "Failed to fetch data");
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

  const printRef = useRef(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Sales_Return_Report",
  });

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

  useEffect(() => {
    let result = data;

    if (searchQuery) {
      result = result.filter(item => 
        item.return_number?.toLowerCase().includes(searchQuery.toLowerCase()) || 
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
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-background max-w-[1600px] mx-auto w-full font-sans text-foreground pb-20">
      
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Return Analysis</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Sales Management</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Reports</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Reverse Logistics</span>
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
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Advanced Filters</CardTitle>
            <CardDescription className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-tight">Segment returns by location, personnel, and method</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Branch</label>
                <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={branchOpen}
                      className="w-full justify-between h-11 rounded-xl border-border/50 bg-background font-bold text-xs group"
                    >
                      <span className="truncate">{branch === "all" ? "Global Organizations" : branches.find((b) => String(b.id) === String(branch))?.name || "All Branches"}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:text-[#10b981] transition-colors" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search branches..." className="font-bold border-none h-11 uppercase" />
                      <CommandList>
                        <CommandEmpty className="py-4 text-xs font-bold text-muted-foreground uppercase text-center">No branch found.</CommandEmpty>
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
                            All Branches
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
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Cashier / Handler</label>
                <Popover open={userOpen} onOpenChange={setUserOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={userOpen}
                      className="w-full justify-between h-11 rounded-xl border-border/50 bg-background font-bold text-xs group"
                    >
                      <span className="truncate">{user === "all" ? "All Staff Members" : sellers.find((s) => String(s.id) === String(user))?.name || "All Cashiers"}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:text-[#10b981] transition-colors" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search personnel..." className="font-bold border-none h-11 uppercase" />
                      <CommandList>
                        <CommandEmpty className="py-4 text-xs font-bold text-muted-foreground uppercase text-center">No staff member found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="All Cashiers"
                            onSelect={() => {
                              setUser("all");
                              setUserOpen(false);
                            }}
                            className="font-bold text-xs py-3"
                          >
                            <Check className={cn("mr-2 h-4 w-4", user === "all" ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                            All Staff Members
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

            <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Global Search</label>
                <div className="relative group/search">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/search:text-[#10b981] transition-colors" />
                    <Input 
                        placeholder="Ref #, Customer, Invoice..." 
                        className="pl-11 h-11 rounded-xl border-border/50 bg-background font-bold text-xs focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                        value={searchQuery}
                        onChange={(e)=>setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Refund Method</label>
                <Select value={refundMethod} onValueChange={setRefundMethod}>
                   <SelectTrigger className="h-10 w-48 rounded-xl border-border/50 bg-background font-bold text-xs"><SelectValue /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="cash">Financial: Cash</SelectItem>
                      <SelectItem value="card">Electronic: Card</SelectItem>
                      <SelectItem value="credit">Store Credit</SelectItem>
                   </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={fetchData} disabled={isLoading} className="bg-[#10b981] hover:bg-[#0da371] text-white h-11 px-8 rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#10b981]/20 disabled:opacity-50 transition-all active:scale-95">
              {isLoading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : "Refresh Analytics"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- DASHBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Returns", value: apiStats?.totalReturns || 0, icon: RotateCcw, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/20" },
          { label: "Return Value", value: formatCurrency(apiStats?.totalReturnAmount || 0), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
          { label: "Refunded Capital", value: formatCurrency(apiStats?.totalRefundAmount || 0), icon: ArrowUpRight, color: "text-[#10b981]", bg: "bg-[#10b981]/5", border: "border-[#10b981]/20" },
          { label: "Return Rate", value: `${apiStats?.totalReturns > 0 ? "Analyzed" : "N/A"}`, icon: Users, color: "text-purple-500", bg: "bg-purple-500/5", border: "border-purple-500/20" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
            <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:opacity-100 opacity-50", stat.bg)} />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3.5 rounded-2xl border shadow-inner group-hover:scale-110 transition-transform duration-500", stat.bg, stat.border, stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70 mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-black text-foreground tabular-nums tracking-tight">
                    {isLoading ? <Skeleton className="h-8 w-24" /> : stat.value}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- DATA TABLE --- */}
      <Card className="border-none shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-row items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-[#10b981]" />
              <div>
                <CardTitle className="text-base font-bold text-foreground">Return Registry</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-0.5">Comprehensive audit trail of reverse transactions</CardDescription>
              </div>
            </div>
            {isLoading && <Badge className="bg-[#10b981]/10 text-[#10b981] animate-pulse rounded-lg font-bold border-none uppercase text-[9px] tracking-widest px-2 shadow-none">Syncing Data</Badge>}
        </CardHeader>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="pl-6 font-bold text-foreground py-4 text-[10px] uppercase tracking-widest">Return Reference</TableHead>
              <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Customer Entity</TableHead>
              <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Financial Impact</TableHead>
              <TableHead className="text-center font-bold text-foreground text-[10px] uppercase tracking-widest">Refund Protocol</TableHead>
              <TableHead className="text-right pr-6 font-bold text-foreground text-[10px] uppercase tracking-widest">Authorization</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  <TableCell className="pl-6 py-4"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32 mt-1.5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-24 mx-auto rounded-lg" /></TableCell>
                  <TableCell className="text-right pr-6"><Skeleton className="h-4 w-32 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-border/40 group relative">
                  <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-muted/40 text-muted-foreground/60 border-border/40 group-hover:bg-[#10b981]/10 group-hover:text-[#10b981] group-hover:border-[#10b981]/20 transition-all duration-300">
                              <RotateCcw className="h-4 w-4" />
                          </div>
                          <div>
                              <p className="font-bold text-sm text-foreground mb-0.5 group-hover:text-[#10b981] transition-colors uppercase tracking-tight">{item.return_number}</p>
                              <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest flex items-center gap-1.5">
                                {format(new Date(item.return_date), "MMM dd, yyyy")} • Inv: {item.sale?.invoice_number || "N/A"}
                              </p>
                          </div>
                      </div>
                  </TableCell>
                  <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground/80">{item.customer?.name || "Walk-in"}</span>
                        <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-tighter">Verified Client</span>
                      </div>
                  </TableCell>
                  <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-muted-foreground line-through opacity-40">{formatCurrency(item.total_amount)}</span>
                        <span className="text-sm font-black text-[#10b981] tracking-tight">{formatCurrency(item.refund_amount)}</span>
                      </div>
                  </TableCell>
                  <TableCell className="text-center">
                      <Badge variant="outline" className="bg-muted/20 text-muted-foreground/80 border-border/50 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-none group-hover:bg-[#10b981]/10 group-hover:text-[#10b981] group-hover:border-[#10b981]/30 transition-all">
                          {item.refund_method}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                      <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{item.cashier?.name || "System"}</p>
                      <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-0.5">Authorization Level 1</p>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-48 text-center py-20">
                   <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-full bg-muted/30 text-muted-foreground/20">
                      <Search className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="font-bold text-muted-foreground text-sm uppercase tracking-widest">No return records found</h4>
                      <p className="text-xs text-muted-foreground/60 font-medium">Try adjusting your filters to see more results.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="px-6 py-4 flex justify-between items-center border-t border-border/30 bg-muted/5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
             Analyzing {filteredData.length} return events
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
