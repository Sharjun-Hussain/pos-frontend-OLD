"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { useSession } from "next-auth/react";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { toast } from "sonner";
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
  Briefcase,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  BarChart3,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { format, subDays, startOfMonth } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SalesBySupplierPrintTemplate } from "@/components/Template/sales/SalesBySupplierTemplate";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

export default function SalesBySupplierPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();

  // --- STATE ---
  const [date, setDate] = useState({ from: startOfMonth(new Date()), to: new Date() });
  const [store, setStore] = useState("all");
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalProfit: 0, activeSuppliers: 0, topSupplier: null });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  // --- FETCH DATA ---
  const fetchData = async (targetPage = pagination.page) => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
        branch_id: store,
        page: targetPage,
        limit: 10
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/supplier-profit?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data.data || []);
        setSummary(result.data.summary || { totalSales: 0, totalProfit: 0, activeSuppliers: 0, topSupplier: null });
        setPagination(result.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      } else {
        toast.error(result.message || "Failed to fetch report data");
      }
    } catch (error) {
      toast.error("An error occurred while loading the report");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === "success") {
        setBranches(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch branches", error);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [session?.accessToken]);

  useEffect(() => {
    fetchData(1);
  }, [session?.accessToken, date, store]);

  // --- PRINT ENGINE ---
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Sales_By_Supplier_Report",
  });

  // --- EXPORT LOGIC ---
  const handleExportCSV = () => {
    const exportData = data.map(item => ({
      "Supplier Name": item.supplier_name,
      "Items Sold": item.sold,
      "Total Sales": item.totalSales,
      "Discount": item.discount,
      "Net Sales": item.netSales,
      "Total Profit": item.profit,
      "Avg Sale/Product": (item.netSales / (item.sold || 1)).toFixed(2)
    }));
    exportToCSV(exportData, "Sales_By_Supplier_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      "Supplier Name": item.supplier_name,
      "Items Sold": item.sold,
      "Total Sales": item.totalSales,
      "Discount": item.discount,
      "Net Sales": item.netSales,
      "Total Profit": item.profit,
      "Avg Sale/Product": (item.netSales / (item.sold || 1)).toFixed(2)
    }));
    exportToExcel(exportData, "Sales_By_Supplier_Report");
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 bg-background max-w-[1600px] mx-auto w-full font-sans text-foreground">
      
      {/* HIDDEN PRINT TEMPLATE */}
      <SalesBySupplierPrintTemplate 
        ref={printRef} 
        data={data} 
        stats={summary} 
        filters={{ store, category: "All" }}
      />

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20">
            <BarChart3 className="w-6 h-6 text-[#10b981]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Supplier Sales Performance</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>Reports</span>
              <span className="text-muted-foreground/40">/</span>
              <span>Sales</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-foreground font-medium">Supplier Analysis</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handlePrint} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-9 rounded-xl">
            <FileText className="h-4 w-4" /> Export PDF
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-9 rounded-xl">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-9 rounded-xl">
            <FileText className="h-4 w-4" /> Excel
          </Button>
          <Button onClick={handlePrint} className="bg-[#10b981] text-white shadow-lg shadow-[#10b981]/10 gap-2 hover:bg-[#0da371] h-9 rounded-xl">
            <Printer className="h-4 w-4" /> Print Report
          </Button>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <Card className="border-none shadow-sm bg-card overflow-visible">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            
            {/* Date Range Selector */}
            <div className="space-y-2 flex-1 min-w-[300px] w-full">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] ml-1">Reporting Period</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-semibold h-11 border-border/50 bg-background/50 hover:bg-muted/20 rounded-xl px-4 gap-3",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 text-[#10b981]" />
                    <span className="text-sm">
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-border/40" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    className="rounded-2xl"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Branch Selector (Searchable Combobox) */}
            <div className="space-y-2 w-full lg:w-[250px]">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] ml-1">Branch Facility</label>
              <Popover open={isBranchOpen} onOpenChange={setIsBranchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-11 justify-between bg-background/50 border-border/50 rounded-xl hover:bg-muted/20 font-semibold px-4"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Filter className="h-3.5 w-3.5 text-[#10b981] shrink-0" />
                      <span className="truncate">
                        {store === "all" ? "All Branches" : branches.find((b) => b.id === store)?.name}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0 rounded-2xl border-border/40 shadow-xl" align="start">
                  <Command className="rounded-2xl">
                    <CommandInput placeholder="Search branch..." className="h-11" />
                    <CommandList>
                      <CommandEmpty>No branch found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setStore("all");
                            setIsBranchOpen(false);
                          }}
                          className="rounded-lg m-1"
                        >
                          <Check className={cn("mr-2 h-4 w-4", store === "all" ? "opacity-100" : "opacity-0")} />
                          All Branches
                        </CommandItem>
                        {branches.map((b) => (
                          <CommandItem
                            key={b.id}
                            value={b.name}
                            onSelect={() => {
                              setStore(b.id);
                              setIsBranchOpen(false);
                            }}
                            className="rounded-lg m-1"
                          >
                            <Check className={cn("mr-2 h-4 w-4", store === b.id ? "opacity-100" : "opacity-0")} />
                            {b.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="lg:mb-1.5 ml-2">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => fetchData(1)} 
                disabled={isLoading} 
                className="h-11 w-11 rounded-xl bg-card border border-border/50 text-[#10b981] shadow-sm hover:bg-[#10b981]/10 active:scale-95 transition-all"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* --- KPI METRICS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-[#10b981]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Gross Sales</p>
                <h3 className="text-xl font-black text-foreground mt-0.5">{formatCurrency(summary.totalSales)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform text-blue-600">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Top Supplier</p>
                <h3 className="text-xl font-black text-foreground mt-0.5 truncate max-w-[140px]" title={summary.topSupplier?.supplier_name}>
                  {summary.topSupplier?.supplier_name || "-"}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 group-hover:scale-110 transition-transform text-purple-600">
                <Filter className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Active Vendors</p>
                <h3 className="text-2xl font-black text-foreground mt-0.5">{summary.activeSuppliers}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 group-hover:scale-110 transition-transform text-amber-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Gross Profit</p>
                <h3 className="text-xl font-black text-foreground mt-0.5">{formatCurrency(summary.totalProfit)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- CHART SECTION --- */}
        <Card className="border-none shadow-sm bg-card lg:col-span-1 flex flex-col">
          <CardHeader className="pb-2 border-b border-border/30 bg-sidebar-accent/5 backdrop-blur-md">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#10b981]" /> Revenue Distribution
            </CardTitle>
            <CardDescription className="text-xs uppercase font-bold tracking-widest">Top 5 Performing Vendors</CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-center min-h-[350px]">
            {isLoading ? (
              <div className="flex-1 flex flex-col justify-center space-y-4 px-4">
                 {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-6 w-full rounded-md" />)}
              </div>
            ) : data.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground italic text-sm">
                No data available for chart
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart 
                  data={[...data].sort((a,b) => b.totalSales - a.totalSales).slice(0, 5).map(item => ({ 
                    name: item.supplier_name.split(' ')[0], 
                    sales: item.totalSales,
                    fullName: item.supplier_name
                  }))} 
                  layout="vertical" 
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(value) => [formatCurrency(value), "Sales"]}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="sales" fill="#10b981" radius={[0, 6, 6, 0]} barSize={28}>
                    {data.slice(0, 5).map((entry, index) => (
                      <Cell key={index} fillOpacity={1 - (index * 0.15)} fill="#10b981" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* --- DATA TABLE --- */}
        <Card className="border-none shadow-sm bg-card overflow-hidden lg:col-span-2">
          <CardHeader className="pb-2 border-b border-border/30 bg-sidebar-accent/5 backdrop-blur-md flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Supplier Performance Table</CardTitle>
              <CardDescription className="text-xs uppercase font-bold tracking-widest mt-1">Detailed Vendor Analytics</CardDescription>
            </div>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
              <Input 
                placeholder="Find supplier..." 
                className="pl-8 h-8 text-xs bg-sidebar-accent/20 border-border/40 rounded-lg focus:bg-background transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <div className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b border-border/30 hover:bg-transparent">
                  <TableHead className="pl-6 py-4 font-bold text-muted-foreground text-[10px] uppercase tracking-wider">Vendor Entity</TableHead>
                  <TableHead className="text-center font-bold text-muted-foreground text-[10px] uppercase tracking-wider">Qty Sold</TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground text-[10px] uppercase tracking-wider">Net Revenue</TableHead>
                  <TableHead className="text-right font-bold text-muted-foreground text-[10px] uppercase tracking-wider">Gross Profit</TableHead>
                  <TableHead className="text-right pr-6 font-bold text-muted-foreground text-[10px] uppercase tracking-wider">Margin (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border/20 last:border-0">
                      <TableCell className="pl-6"><Skeleton className="h-4 w-32 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 mx-auto rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto rounded-md" /></TableCell>
                      <TableCell className="pr-6"><Skeleton className="h-4 w-16 ml-auto rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : data.length > 0 ? (
                  data.filter(item => item.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())).map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-sidebar-accent/10 transition-colors border-b border-border/20 last:border-0 group">
                      <TableCell className="pl-6 py-4">
                        <p className="font-bold text-foreground text-sm leading-none">{item.supplier_name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-tighter">Vendor Partner</p>
                      </TableCell>
                      <TableCell className="text-center text-foreground font-semibold font-mono text-xs">{item.sold}</TableCell>
                      <TableCell className="text-right text-foreground font-black tracking-tight">{formatCurrency(item.netSales)}</TableCell>
                      <TableCell className="text-right font-black text-[#10b981]">{formatCurrency(item.profit)}</TableCell>
                      <TableCell className="text-right pr-6">
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                            item.margin >= 0 
                              ? "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20" 
                              : "bg-red-500/10 text-red-500 border border-red-500/20"
                          )}>
                            {item.margin.toFixed(1)}%
                          </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic text-sm">
                      No vendor performance data found for the selected criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="px-6 py-4 flex items-center justify-between bg-muted/10 border-t border-border/30">
                <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                    Displaying <span className="text-foreground font-black">{data.length}</span> of <span className="text-foreground font-black">{pagination.total}</span> Vendors
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-xl border-border/40 bg-background/50" 
                        disabled={pagination.page <= 1 || isLoading}
                        onClick={() => fetchData(pagination.page - 1)}
                    >
                        <ChevronLeft className="h-4 w-4"/>
                    </Button>
                    <div className="text-[10px] font-black px-3 py-1 bg-muted/20 rounded-lg border border-border/30">
                        {pagination.page} / {pagination.totalPages}
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-xl border-border/40 bg-background/50" 
                        disabled={pagination.page >= pagination.totalPages || isLoading}
                        onClick={() => fetchData(pagination.page + 1)}
                    >
                        <ChevronRight className="h-4 w-4"/>
                    </Button>
                </div>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}