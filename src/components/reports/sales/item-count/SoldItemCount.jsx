"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Printer,
  Download,
  Calendar as CalendarIcon,
  Package,
  FileText,
  Store,
  RefreshCw,
  Check,
  ChevronsUpDown,
  TrendingUp,
  Scale,
  Activity,
  Receipt,
  Info,
  ChevronLeft,
  ChevronRight,
  Search,
  Box
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
import { Input } from "@/components/ui/input";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { toast } from "sonner";

export default function SoldItemCountPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();

  // --- STATES ---
  const [date, setDate] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ totalItems: 0, totalQuantity: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  const [branchId, setBranchId] = useState("all");
  const [branches, setBranches] = useState([]);
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  const [productId, setProductId] = useState("all");
  const [products, setProducts] = useState([]);
  const [isProductOpen, setIsProductOpen] = useState(false);

  // Fetch branches and products for filters
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!session?.accessToken) return;
      try {
        const [branchRes, productRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
          })
        ]);
        
        const branchResult = await branchRes.json();
        const productResult = await productRes.json();
        
        if (branchResult.status === 'success') setBranches(branchResult.data);
        if (productResult.status === 'success') setProducts(productResult.data);
        
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
        product_id: productId === "all" ? "" : productId,
        page: currentPage,
        size: pageSize
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/item-count?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data.rows);
        setSummary({
          totalItems: result.data.pagination.total,
          totalQuantity: result.data.pagination.totalQuantity
        });
      } else {
        toast.error(result.message || "Failed to fetch item data");
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
  }, [session?.accessToken, date, branchId, productId, currentPage]);

  const totalPages = Math.ceil(summary.totalItems / pageSize);

  const handleExportCSV = () => {
    const exportData = data.map((item) => ({
      Product: item.product?.name,
      Code: item.product?.code || item.variant?.sku || "N/A",
      Variant: item.variant?.name || "Standard",
      "Quantity Sold": parseFloat(item.count).toFixed(0),
    }));
    exportToCSV(exportData, "Item_Performance_Ledger");
  };

  const handleExportExcel = () => {
    const exportData = data.map((item) => ({
        Product: item.product?.name,
        Code: item.product?.code || item.variant?.sku || "N/A",
        Variant: item.variant?.name || "Standard",
        "Quantity Sold": parseFloat(item.count).toFixed(0),
    }));
    exportToExcel(exportData, "Item_Performance_Ledger");
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-background max-w-[1400px] mx-auto w-full font-sans text-foreground pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Item Performance Ledger</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Financial Hub</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Reports</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Sold Items Tracking</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
            <FileText className="h-4 w-4" /> Excel Ledger
          </Button>
          <Button onClick={() => window.print()} className="bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20 gap-2 hover:bg-[#0da371] h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-none transition-all active:scale-95">
            <Printer className="h-4 w-4" /> Print ledger
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

            {/* Product Selector */}
            <div className="space-y-2.5 w-full">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Specific Product</label>
              <Popover open={isProductOpen} onOpenChange={setIsProductOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-11 justify-between bg-background/50 border-border/50 rounded-xl hover:bg-muted/20 font-semibold text-sm px-4 shadow-sm transition-all text-foreground"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <Package className="h-4 w-4 text-[#10b981] shrink-0" />
                      <span className="truncate">
                        {productId === "all" ? "All Products" : products.find((p) => p.id === productId)?.name}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 rounded-2xl border-border/40 shadow-2xl overflow-hidden" align="start">
                  <Command className="p-2">
                    <CommandInput placeholder="Search product..." className="h-11 text-xs border-none focus:ring-0 px-3 font-medium" />
                    <CommandList className="max-h-[300px] mt-1">
                      <CommandEmpty className="py-6 text-sm font-medium text-muted-foreground text-center">No product found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setProductId("all");
                            setCurrentPage(1);
                            setIsProductOpen(false);
                          }}
                          className="rounded-xl m-1 text-sm font-semibold px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
                        >
                          <Check className={cn("mr-3 h-4 w-4 text-[#10b981]", productId === "all" ? "opacity-100" : "opacity-0")} />
                          All Products
                        </CommandItem>
                        {products.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={p.name}
                            onSelect={() => {
                              setProductId(p.id);
                              setCurrentPage(1);
                              setIsProductOpen(false);
                            }}
                            className="rounded-xl m-1 text-sm font-semibold px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
                          >
                            <Check className={cn("mr-3 h-4 w-4 text-[#10b981]", productId === p.id ? "opacity-100" : "opacity-0")} />
                            {p.name}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-blue-500/10" />
           <CardContent className="p-7">
              <div className="flex items-center gap-5">
                 <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500 text-blue-600 shadow-inner font-bold">
                    <Activity className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-sm font-semibold text-muted-foreground/80 mb-1">Unique Products Sold</p>
                    <h3 className="text-2xl font-bold text-foreground tabular-nums">{isLoading ? <Skeleton className="h-8 w-20" /> : summary.totalItems}</h3>
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
                    <p className="text-sm font-semibold text-white/80 mb-1">Total Items Sold (Qty)</p>
                    <h3 className="text-2xl font-bold tabular-nums">{isLoading ? <Skeleton className="h-8 w-32 bg-white/20" /> : parseFloat(summary.totalQuantity).toLocaleString()}</h3>
                 </div>
              </div>
           </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative hidden lg:block">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-emerald-500/10" />
           <CardContent className="p-7">
              <div className="flex items-center gap-5">
                 <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500 text-emerald-600 shadow-inner font-bold">
                    <Scale className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-sm font-semibold text-muted-foreground/80 mb-1">Average Qty per Product</p>
                    <h3 className="text-2xl font-bold text-foreground tabular-nums">{isLoading ? <Skeleton className="h-8 w-32" /> : (summary.totalQuantity / (summary.totalItems || 1)).toFixed(1)}</h3>
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
                    <CardTitle className="text-lg font-bold text-foreground">Item Tracking Insight</CardTitle>
                    <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-1">Numerical analysis of item movement across the supply chain</CardDescription>
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
                <TableHead className="pl-6 font-bold text-foreground py-4">Product Details</TableHead>
                <TableHead className="font-bold text-foreground">Code / SKU</TableHead>
                <TableHead className="font-bold text-foreground">Variant</TableHead>
                <TableHead className="text-right pr-6 font-bold text-foreground">Sold Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    <TableCell className="pl-6"><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="h-48 text-center text-muted-foreground italic font-medium">
                    <div className="flex flex-col items-center justify-center gap-3 opacity-20">
                      <Receipt className="h-12 w-12" />
                      <p className="text-sm font-bold">No sales data found for the selected criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={index} className="hover:bg-muted/30 transition-colors border-border/40 group">
                    <TableCell className="pl-6 font-semibold py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-background border border-border/50 group-hover:bg-[#10b981]/10 group-hover:border-[#10b981]/20 transition-all">
                          <Package className="h-4 w-4 text-muted-foreground group-hover:text-[#10b981]" />
                        </div>
                        <span className="text-foreground">{item.product?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground font-bold tracking-tight">
                      {item.product?.code || item.variant?.sku || "N/A"}
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className="bg-background/50 border-border/50 font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80 rounded-md py-0.5">
                          {item.variant?.name || "Standard"}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                       <span className="text-xl font-black text-foreground tabular-nums">
                          {parseFloat(item.count).toLocaleString()}
                       </span>
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
            {summary.totalItems} entries found
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
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                   let pageNum = i + 1;
                   if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 3 + i + 1;
                      if (pageNum > totalPages) pageNum = totalPages - (4 - i);
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
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0 || isLoading}
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
                 <h4 className="font-bold text-[#10b981] text-sm mb-2 leading-none uppercase tracking-widest italic">Inventory Velocity Insight</h4>
                 <p className="text-xs text-muted-foreground leading-relaxed font-medium capitalize">
                    Tracking quantity movement helps identify fast-moving items and optimize warehouse replenishment schedules for improved liquidity.
                 </p>
              </div>
           </div>
        </CardContent>
      </Card>

    </div>
  );
}
