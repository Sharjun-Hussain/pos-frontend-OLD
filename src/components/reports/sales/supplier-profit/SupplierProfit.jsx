"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Printer,
  Download,
  Calendar as CalendarIcon,
  Building2,
  FileText,
  Store,
  RefreshCw,
  Check,
  ChevronsUpDown,
  TrendingUp,
  Activity,
  Receipt,
  Info,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpRight,
  TrendingDown,
  Percent
} from "lucide-react";
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
import { toast } from "sonner";

export default function SupplierProfitPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();

  // --- STATES ---
  const [date, setDate] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ 
    totalRevenue: 0, 
    totalProfit: 0, 
    activeSuppliers: 0,
    topSupplier: null 
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  
  const [branchId, setBranchId] = useState("all");
  const [branches, setBranches] = useState([]);
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  const [supplierId, setSupplierId] = useState("all");
  const [suppliers, setSuppliers] = useState([]);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);

  // Fetch branches and suppliers for filters
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!session?.accessToken) return;
      try {
        const [branchRes, supplierRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
          })
        ]);
        
        const branchResult = await branchRes.json();
        const supplierResult = await supplierRes.json();
        
        if (branchResult.status === 'success') setBranches(branchResult.data);
        if (supplierResult.status === 'success') setSuppliers(supplierResult.data);
        
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
        start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
        branch_id: branchId,
        supplier_id: supplierId,
        page: currentPage,
        size: pageSize
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/supplier-profit?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data.data);
        setSummary(result.data.summary);
        setPagination({
            total: result.data.pagination.total,
            totalPages: result.data.pagination.totalPages
        });
      } else {
        toast.error(result.message || "Failed to fetch profit data");
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
  }, [session?.accessToken, date, branchId, supplierId, currentPage]);

  const handleExportCSV = () => {
    const exportData = data.map((item) => ({
      Supplier: item.supplier_name,
      Revenue: item.totalRevenue,
      Cost: item.cost,
      Profit: item.profit,
      "Margin (%)": item.margin.toFixed(2),
    }));
    exportToCSV(exportData, "Supplier_Profit_Analysis");
  };

  const handleExportExcel = () => {
    const exportData = data.map((item) => ({
      Supplier: item.supplier_name,
      Revenue: item.totalRevenue,
      Cost: item.cost,
      Profit: item.profit,
      "Margin (%)": item.margin.toFixed(2),
    }));
    exportToExcel(exportData, "Supplier_Profit_Analysis");
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-background max-w-[1400px] mx-auto w-full font-sans text-foreground pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Supplier Profit Analysis</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Financial Hub</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Reports</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Supplier Insight</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
            <FileText className="h-4 w-4" /> Export Audit
          </Button>
          <Button onClick={() => window.print()} className="bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20 gap-2 hover:bg-[#0da371] h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-none transition-all active:scale-95">
            <Printer className="h-4 w-4" /> Print analysis
          </Button>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <Card className="border-none shadow-sm bg-card overflow-visible">
        <CardContent className="p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-end">
            
            {/* Date Range Selector */}
            <div className="space-y-2.5 w-full">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Analysis Period</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-semibold h-11 border-border/50 bg-background/50 hover:bg-muted/20 rounded-xl px-4 gap-3 shadow-sm transition-all text-foreground",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 text-[#10b981] shrink-0" />
                    <span className="text-sm truncate">
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
                    onSelect={(d) => { setDate(d); setCurrentPage(1); }}
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
                    className="w-full h-11 justify-between bg-background/50 border-border/50 rounded-xl hover:bg-muted/20 font-semibold text-sm px-4 shadow-sm transition-all text-foreground"
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
                            setCurrentPage(1);
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
                              setCurrentPage(1);
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

            {/* Supplier Selector */}
            <div className="space-y-2.5 w-full">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Supplier Entity</label>
              <Popover open={isSupplierOpen} onOpenChange={setIsSupplierOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-11 justify-between bg-background/50 border-border/50 rounded-xl hover:bg-muted/20 font-semibold text-sm px-4 shadow-sm transition-all text-foreground"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <Building2 className="h-4 w-4 text-[#10b981] shrink-0" />
                      <span className="truncate">
                        {supplierId === "all" ? "All Suppliers" : suppliers.find((s) => s.id === supplierId)?.name}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 rounded-2xl border-border/40 shadow-2xl overflow-hidden" align="start">
                  <Command className="p-2">
                    <CommandInput placeholder="Search supplier..." className="h-11 text-xs border-none focus:ring-0 px-3 font-medium" />
                    <CommandList className="max-h-[300px] mt-1">
                      <CommandEmpty className="py-6 text-sm font-medium text-muted-foreground text-center">No supplier found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSupplierId("all");
                            setCurrentPage(1);
                            setIsSupplierOpen(false);
                          }}
                          className="rounded-xl m-1 text-sm font-semibold px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
                        >
                          <Check className={cn("mr-3 h-4 w-4 text-[#10b981]", supplierId === "all" ? "opacity-100" : "opacity-0")} />
                          All Suppliers
                        </CommandItem>
                        {suppliers.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={s.name}
                            onSelect={() => {
                              setSupplierId(s.id);
                              setCurrentPage(1);
                              setIsSupplierOpen(false);
                            }}
                            className="rounded-xl m-1 text-sm font-semibold px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
                          >
                            <Check className={cn("mr-3 h-4 w-4 text-[#10b981]", supplierId === s.id ? "opacity-100" : "opacity-0")} />
                            {s.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end gap-3">
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

      {/* --- SUMMARY STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-blue-500/10" />
           <CardContent className="p-7">
              <div className="flex items-center gap-5">
                 <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500 text-blue-600 shadow-inner font-bold">
                    <Receipt className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-xs font-semibold text-muted-foreground/80 mb-1 uppercase tracking-wider">Total Sales</p>
                    <h3 className="text-2xl font-bold text-foreground tabular-nums">{isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(summary.totalRevenue)}</h3>
                 </div>
              </div>
           </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-[#10b981] overflow-hidden group hover:shadow-md transition-all duration-500 relative text-white">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-white/20" />
           <CardContent className="p-7">
              <div className="flex items-center gap-5">
                 <div className="p-4 rounded-2xl bg-white/20 border border-white/30 group-hover:scale-110 transition-transform duration-500 shadow-lg font-bold">
                    <TrendingUp className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-xs font-semibold text-white/80 mb-1 uppercase tracking-wider">Net Profit</p>
                    <h3 className="text-2xl font-bold tabular-nums">{isLoading ? <Skeleton className="h-8 w-32 bg-white/20" /> : formatCurrency(summary.totalProfit)}</h3>
                 </div>
              </div>
           </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-emerald-500/10" />
           <CardContent className="p-7">
              <div className="flex items-center gap-5">
                 <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500 text-emerald-600 shadow-inner font-bold">
                    <Activity className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-xs font-semibold text-muted-foreground/80 mb-1 uppercase tracking-wider">Active Entities</p>
                    <h3 className="text-2xl font-bold text-foreground tabular-nums">{isLoading ? <Skeleton className="h-8 w-20" /> : summary.activeSuppliers}</h3>
                 </div>
              </div>
           </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-orange-500/10" />
           <CardContent className="p-7">
              <div className="flex items-center gap-5">
                 <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 group-hover:scale-110 transition-transform duration-500 text-orange-600 shadow-inner font-bold">
                    <Percent className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-xs font-semibold text-muted-foreground/80 mb-1 uppercase tracking-wider">Avg. Margin</p>
                    <h3 className="text-2xl font-bold text-foreground tabular-nums">
                        {isLoading ? <Skeleton className="h-8 w-20" /> : 
                        `${summary.totalRevenue > 0 ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1) : 0}%`}
                    </h3>
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* --- TABLE --- */}
      <Card className="border-none shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 backdrop-blur-md">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold text-foreground">Supplier Performance Audit</CardTitle>
                    <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-1">Granular breakdown of profitability metrics per primary supplier source</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                   <div className="p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => window.print()}>
                     <Printer className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                   </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="pl-6 font-bold text-foreground py-4">Supplier Identity</TableHead>
                <TableHead className="text-right font-bold text-foreground">Revenue</TableHead>
                <TableHead className="text-right font-bold text-foreground">Cost Base</TableHead>
                <TableHead className="text-right font-bold text-foreground">Gross Profit</TableHead>
                <TableHead className="text-right pr-6 font-bold text-foreground">Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    <TableCell className="pl-6"><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-6 w-12 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic font-medium">
                    <div className="flex flex-col items-center justify-center gap-3 opacity-20">
                      <Receipt className="h-12 w-12" />
                      <p className="text-sm font-bold">No acquisition data found for the selected criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={index} className="hover:bg-muted/30 transition-colors border-border/40 group">
                    <TableCell className="pl-6 font-bold py-5 text-foreground border-l-4 border-l-transparent hover:border-l-[#10b981] transition-all">
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-background border border-border/50 group-hover:bg-[#10b981]/10 group-hover:border-[#10b981]/20 transition-all">
                          <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-[#10b981]" />
                        </div>
                        <span className="text-foreground text-sm uppercase tracking-tight">{item.supplier_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground tabular-nums">
                      {formatCurrency(item.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-muted-foreground tabular-nums">
                      {formatCurrency(item.cost)}
                    </TableCell>
                    <TableCell className="text-right py-4">
                       <span className={cn(
                           "text-lg font-black tabular-nums",
                           item.profit >= 0 ? "text-[#10b981]" : "text-red-500"
                        )}>
                          {formatCurrency(item.profit)}
                       </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                        <div className={cn(
                            "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm",
                            item.margin >= 20 ? "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20" : 
                            item.margin >= 0 ? "bg-orange-500/10 text-orange-600 border border-orange-500/20" : 
                            "bg-red-500/10 text-red-600 border border-red-500/20"
                        )}>
                           {item.margin.toFixed(1)}% <ArrowUpRight className="ml-1 h-2.5 w-2.5" />
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {/* Pagination Controls */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-border/30 bg-muted/5 font-sans">
          <p className="text-xs font-bold text-muted-foreground tabular-nums lowercase tracking-widest">
            {pagination.total} entities found
          </p>
          <div className="flex items-center gap-3">
             <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                className="h-9 px-4 rounded-xl border-border/50 shadow-sm gap-2 font-bold text-xs uppercase tracking-widest active:scale-95 transition-all text-foreground hover:bg-muted/30"
             >
                <ChevronLeft className="h-4 w-4" /> Previous
             </Button>
             
             <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                   let pageNum = i + 1;
                   if (pagination.totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 3 + i + 1;
                      if (pageNum > pagination.totalPages) pageNum = pagination.totalPages - (4 - i);
                   }
                   if (pageNum <= 0) return null;
                   
                   return (
                      <Button
                         key={pageNum}
                         variant={currentPage === pageNum ? "default" : "outline"}
                         size="sm"
                         onClick={() => setCurrentPage(pageNum)}
                         className={cn(
                            "h-9 w-9 rounded-xl font-bold text-xs transition-all active:scale-95",
                            currentPage === pageNum ? "bg-[#10b981] border-none text-white shadow-lg shadow-[#10b981]/20" : "border-border/50 text-foreground hover:bg-muted/30"
                         )}
                      >
                         {pageNum}
                      </Button>
                   );
                })}
             </div>

             <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={currentPage === pagination.totalPages || pagination.totalPages === 0 || isLoading}
                className="h-9 px-4 rounded-xl border-border/50 shadow-sm gap-2 font-bold text-xs uppercase tracking-widest active:scale-95 transition-all text-foreground hover:bg-muted/30"
             >
                Next <ChevronRight className="h-4 w-4" />
             </Button>
          </div>
        </div>
      </Card>

      <Card className="border-none shadow-sm bg-[#10b981]/5 border-l-4 border-l-[#10b981] overflow-hidden">
        <CardContent className="p-6">
           <div className="flex gap-5">
              <div className="p-3 rounded-2xl bg-[#10b981]/10 text-[#10b981] shrink-0 font-bold">
                 <Info className="h-6 w-6" />
              </div>
              <div className="flex-1">
                 <h4 className="font-bold text-[#10b981] text-sm mb-2 leading-none uppercase tracking-widest italic">Profitability Intelligence</h4>
                 <p className="text-xs text-muted-foreground leading-relaxed font-medium capitalize">
                    Analyzing profit per supplier allows you to identify high-margin partners and negotiate better terms with lower-margin sources to improve overall business health.
                 </p>
              </div>
           </div>
        </CardContent>
      </Card>

    </div>
  );
}
