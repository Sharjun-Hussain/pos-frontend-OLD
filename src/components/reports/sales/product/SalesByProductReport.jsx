"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useSession } from "next-auth/react";
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
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  SlidersHorizontal,
  RefreshCw,
  BarChart3,
  Check,
  ChevronsUpDown,
  ShoppingBag,
  TrendingUp,
  Package,
  Layers,
  Store
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
import { format, subMonths, startOfMonth } from "date-fns";

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
import { SalesByProductPrintTemplate } from "@/components/Template/sales/SalesByProductTemplate";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export default function SalesByProductPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();

  // --- STATES ---
  const [date, setDate] = useState({ from: startOfMonth(new Date()), to: new Date() });
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalSold: 0, uniqueProducts: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [subCategory, setSubCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [store, setStore] = useState("all");

  // Combobox popover open states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subCategoryOpen, setSubCategoryOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);

  // --- METADATA STATES ---
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!session?.accessToken) return;
      try {
        const [catRes, subCatRes, brandRes, branchRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sub-categories/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
          })
        ]);

        const catData = await catRes.json();
        const subCatData = await subCatRes.json();
        const brandData = await brandRes.json();
        const branchData = await branchRes.json();

        if (catData.status === 'success') setCategories(catData.data);
        if (subCatData.status === 'success') setSubCategories(subCatData.data);
        if (brandData.status === 'success') setBrands(brandData.data);
        if (branchData.status === 'success') setBranches(branchData.data);

      } catch (err) {
        console.error("Failed to fetch metadata", err);
      }
    };
    fetchMetadata();
  }, [session?.accessToken]);

  const fetchData = async (targetPage = pagination.page) => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        branch_id: store,
        main_category_id: category,
        sub_category_id: subCategory,
        brand_id: brand,
        search: searchQuery,
        page: targetPage,
        limit: 10
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/product?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        const mappedData = result.data.data.map(item => ({
             id: item.product_id + (item.product_variant_id || ''),
             name: item.product.name + (item.variant ? ` (${item.variant.name})` : ''),
             sku: item.variant?.sku || item.product.code,
             sold: Number(item.total_quantity),
             sales: Number(item.total_revenue),
             price: Number(item.total_revenue) / (Number(item.total_quantity) || 1),
             profit: 0
        }));
        setData(mappedData);
        setSummary(result.data.summary);
        setPagination(result.data.pagination);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch product sales report");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [session?.accessToken, date, category, subCategory, brand, store, searchQuery]);

  // Reset sub-category if main category changes and current sub-category doesn't belong
  useEffect(() => {
    if (category !== "all" && subCategory !== "all") {
      const currentSub = subCategories.find(sc => String(sc.id) === String(subCategory));
      if (currentSub && String(currentSub.main_category_id) !== String(category)) {
        setSubCategory("all");
      }
    }
  }, [category, subCategories]);

  // --- PRINT ENGINE ---
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Sales_By_Product_Report",
  });

  // --- EXPORT LOGIC ---
  const handleExportCSV = () => {
    const exportData = data.map(item => ({
      "Product Name": item.name,
      "SKU": item.sku,
      "Qty Sold": item.sold,
      "Unit Price": item.price,
      "Total Sales": item.sales,
      "Total Profit": item.profit
    }));
    exportToCSV(exportData, "Sales_By_Product_Report");
  };

  const handleExportExcel = () => {
    const exportData = data.map(item => ({
      "Product Name": item.name,
      "SKU": item.sku,
      "Qty Sold": item.sold,
      "Unit Price": item.price,
      "Total Sales": item.sales,
      "Total Profit": item.profit
    }));
    exportToExcel(exportData, "Sales_By_Product_Report");
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 bg-background max-w-[1600px] mx-auto w-full font-sans text-foreground">
      
      {/* HIDDEN PRINT TEMPLATE */}
      <SalesByProductPrintTemplate 
        ref={printRef} 
        data={data} 
        stats={{
          totalSold: summary.totalSold,
          totalRevenue: summary.totalRevenue,
          totalProfit: 0,
          topSellingItem: data[0] || null,
          topRevenueItem: data[0] || null
        }}
        filters={{ 
          store: store === 'all' ? 'All Branches' : branches.find(b => b.id === store)?.name || store,
          category: category === 'all' ? 'All Categories' : categories.find(c => c.id === category)?.name || category,
          brand: brand === 'all' ? 'All Brands' : brands.find(b => b.id === brand)?.name || brand
        }}
      />

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20">
            <ShoppingBag className="w-6 h-6 text-[#10b981]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Product Sales Analytics</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 text-[11px] font-bold uppercase tracking-wider">
              <span>BI Reports</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Sales Performance</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Product Volume</span>
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

      {/* --- FILTERS SECTION --- */}
      <Card className="border-none shadow-sm bg-card overflow-visible">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
            
            {/* Date Range Selector */}
            <div className="space-y-2 w-full">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Time Horizon</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-bold h-11 border-border/50 bg-background/50 hover:bg-muted/20 rounded-xl px-4 gap-3",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 text-[#10b981]" />
                    <span className="text-xs">
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick period</span>
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

            {/* Category Filter */}
            <div className="space-y-2 w-full">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Classification</label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-11 justify-between bg-background/50 border-border/50 rounded-xl hover:bg-muted/20 font-bold text-xs px-4"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Layers className="h-3.5 w-3.5 text-[#10b981] shrink-0" />
                      <span className="truncate">
                        {category === "all" ? "All Categories" : categories.find((c) => String(c.id) === String(category))?.name}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 rounded-2xl border-border/40 shadow-xl" align="start">
                  <Command className="rounded-2xl">
                    <CommandInput placeholder="Search category..." className="h-10 text-xs" />
                    <CommandList>
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setCategory("all");
                            setCategoryOpen(false);
                          }}
                          className="rounded-lg m-1 text-xs"
                        >
                          <Check className={cn("mr-2 h-4 w-4", category === "all" ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                          All Categories
                        </CommandItem>
                        {categories.map((cat) => (
                          <CommandItem
                            key={cat.id}
                            value={cat.name}
                            onSelect={() => {
                              setCategory(cat.id);
                              setCategoryOpen(false);
                            }}
                            className="rounded-lg m-1 text-xs"
                          >
                            <Check className={cn("mr-2 h-4 w-4", String(category) === String(cat.id) ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                            {cat.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Sub-category Filter */}
            <div className="space-y-2 w-full">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Sub-Classification</label>
              <Popover open={subCategoryOpen} onOpenChange={setSubCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-11 justify-between bg-background/50 border-border/50 rounded-xl hover:bg-muted/20 font-bold text-xs px-4"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Filter className="h-3.5 w-3.5 text-[#10b981] shrink-0" />
                      <span className="truncate">
                        {subCategory === "all" ? "All Sub-cate..." : subCategories.find((sc) => String(sc.id) === String(subCategory))?.name}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 rounded-2xl border-border/40 shadow-xl" align="start">
                  <Command className="rounded-2xl">
                    <CommandInput placeholder="Search sub-category..." className="h-10 text-xs" />
                    <CommandList>
                      <CommandEmpty>No sub-category found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSubCategory("all");
                            setSubCategoryOpen(false);
                          }}
                          className="rounded-lg m-1 text-xs"
                        >
                          <Check className={cn("mr-2 h-4 w-4", subCategory === "all" ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                          All Sub-categories
                        </CommandItem>
                        {subCategories
                          .filter(sc => category === "all" || String(sc.main_category_id) === String(category))
                          .map((sc) => (
                            <CommandItem
                              key={sc.id}
                              value={sc.name}
                              onSelect={() => {
                                setSubCategory(sc.id);
                                setSubCategoryOpen(false);
                              }}
                              className="rounded-lg m-1 text-xs"
                            >
                              <Check className={cn("mr-2 h-4 w-4", String(subCategory) === String(sc.id) ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                              {sc.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2 w-full">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Brand Identity</label>
              <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-11 justify-between bg-background/50 border-border/50 rounded-xl hover:bg-muted/20 font-bold text-xs px-4"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Package className="h-3.5 w-3.5 text-[#10b981] shrink-0" />
                      <span className="truncate">
                        {brand === "all" ? "All Brands" : brands.find((b) => String(b.id) === String(brand))?.name}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 rounded-2xl border-border/40 shadow-xl" align="start">
                  <Command className="rounded-2xl">
                    <CommandInput placeholder="Search brand..." className="h-10 text-xs" />
                    <CommandList>
                      <CommandEmpty>No brand found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setBrand("all");
                            setBrandOpen(false);
                          }}
                          className="rounded-lg m-1 text-xs"
                        >
                          <Check className={cn("mr-2 h-4 w-4", brand === "all" ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                          All Brands
                        </CommandItem>
                        {brands.map((b) => (
                          <CommandItem
                            key={b.id}
                            value={b.name}
                            onSelect={() => {
                              setBrand(b.id);
                              setBrandOpen(false);
                            }}
                            className="rounded-lg m-1 text-xs"
                          >
                            <Check className={cn("mr-2 h-4 w-4", String(brand) === String(b.id) ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                            {b.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Store (Branch) Filter */}
            <div className="space-y-2 w-full">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Operational Unit</label>
              <Popover open={storeOpen} onOpenChange={setStoreOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-11 justify-between bg-background/50 border-border/50 rounded-xl hover:bg-muted/20 font-bold text-xs px-4"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Store className="h-3.5 w-3.5 text-[#10b981] shrink-0" />
                      <span className="truncate">
                        {store === "all" ? "All Branches" : branches.find((b) => String(b.id) === String(store))?.name}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 rounded-2xl border-border/40 shadow-xl" align="start">
                  <Command className="rounded-2xl">
                    <CommandInput placeholder="Search branch..." className="h-10 text-xs" />
                    <CommandList>
                      <CommandEmpty>No store found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setStore("all");
                            setStoreOpen(false);
                          }}
                          className="rounded-lg m-1 text-xs"
                        >
                          <Check className={cn("mr-2 h-4 w-4", store === "all" ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                          All Branches
                        </CommandItem>
                        {branches.map((b) => (
                          <CommandItem
                            key={b.id}
                            value={b.name}
                            onSelect={() => {
                              setStore(b.id);
                              setStoreOpen(false);
                            }}
                            className="rounded-lg m-1 text-xs"
                          >
                            <Check className={cn("mr-2 h-4 w-4", String(store) === String(b.id) ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                            {b.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                <Input 
                  placeholder="SKU or product name..." 
                  className="pl-10 h-11 bg-background/50 border-border/50 rounded-xl focus:bg-background transition-all font-semibold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => fetchData(1)}
                disabled={isLoading}
                className="h-11 w-11 rounded-xl bg-card border border-border/50 text-[#10b981] shadow-sm hover:bg-[#10b981]/10 active:scale-95 transition-all shrink-0"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-[#10b981]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none">Gross Revenue</p>
                <h3 className="text-xl font-black text-foreground mt-1.5">{formatCurrency(summary.totalRevenue)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform text-blue-600">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none">Units Dispatched</p>
                <h3 className="text-xl font-black text-foreground mt-1.5">{summary.totalSold.toLocaleString()}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 group-hover:scale-110 transition-transform text-purple-600">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none">Unique SKUs Sold</p>
                <h3 className="text-xl font-black text-foreground mt-1.5">{summary.uniqueProducts.toLocaleString()}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-[#10b981] overflow-hidden group hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 border border-white/30 group-hover:scale-110 transition-transform text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-100/80 uppercase tracking-widest leading-none">Performance Delta</p>
                <h3 className="text-xl font-black text-white mt-1.5">Elite Level</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- CHART SECTION --- */}
        <Card className="border-none shadow-sm bg-card lg:col-span-1 flex flex-col min-h-[450px]">
          <CardHeader className="pb-2 border-b border-border/30 bg-sidebar-accent/5 backdrop-blur-md">
            <CardTitle className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-tight">
              <BarChart3 className="h-4 w-4 text-[#10b981]" /> Volume Distribution
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">Top 5 SKU Movement</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center">
            {isLoading ? (
              <div className="space-y-4 w-full">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
              </div>
            ) : data.length === 0 ? (
              <div className="text-center italic text-muted-foreground p-8 flex flex-col items-center gap-3">
                 <Package className="h-10 w-10 opacity-20" />
                 <p className="text-sm font-medium">No movement detected in selected period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart 
                  data={[...data].sort((a,b) => b.sold - a.sold).slice(0, 5).map(item => ({ 
                    name: item.name.length > 15 ? item.name.substring(0, 12) + "..." : item.name, 
                    sold: item.sold,
                    fullName: item.name
                  }))} 
                  layout="vertical" 
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} width={100} className="font-bold" />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                    labelStyle={{ fontWeight: '900', color: 'hsl(var(--foreground))', marginBottom: '4px' }}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="sold" fill="#10b981" radius={[0, 8, 8, 0]} barSize={28}>
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
              <CardTitle className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-tight">Product Sales Inventory</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground mt-1">Movement Ledger</CardDescription>
            </div>
          </CardHeader>
          <div className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b border-border/30 hover:bg-transparent">
                  <TableHead className="pl-6 py-4 font-black text-muted-foreground text-[10px] uppercase tracking-[0.15em]">SKU Entity</TableHead>
                  <TableHead className="text-center font-black text-muted-foreground text-[10px] uppercase tracking-[0.15em]">Quantity</TableHead>
                  <TableHead className="text-right font-black text-muted-foreground text-[10px] uppercase tracking-[0.15em]">Unit MSRP</TableHead>
                  <TableHead className="text-right pr-6 font-black text-muted-foreground text-[10px] uppercase tracking-[0.15em]">Total Yield</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border/20 last:border-0 border-l-4 border-transparent">
                      <TableCell className="pl-6">
                        <Skeleton className="h-4 w-40 rounded-full bg-muted/60" />
                        <Skeleton className="h-2 w-20 mt-2 rounded-full" />
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-12 mx-auto rounded-full bg-muted/60" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto rounded-full bg-muted/60" /></TableCell>
                      <TableCell className="pr-6"><Skeleton className="h-4 w-24 ml-auto rounded-full bg-[#10b981]/20" /></TableCell>
                    </TableRow>
                  ))
                ) : data.length > 0 ? (
                  data.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-sidebar-accent/10 transition-colors border-b border-border/20 last:border-0 group border-l-4 border-transparent hover:border-l-[#10b981]">
                      <TableCell className="pl-6 py-4">
                        <p className="font-black text-foreground text-[13px] leading-tight group-hover:text-[#10b981] transition-colors">{item.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-tighter flex items-center gap-1.5">
                           <Badge variant="outline" className="h-4 px-1 pointer-events-none rounded-[4px] text-[8px] bg-muted/10 border-border/50">{item.sku}</Badge>
                           <span>• Stock Keeping Unit</span>
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                         <span className="font-black font-mono text-xs bg-muted/10 px-2 py-1 rounded-md border border-border/50">{item.sold}</span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground font-black tracking-tight text-xs">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right pr-6">
                         <p className="font-black text-foreground tracking-tighter">{formatCurrency(item.sales)}</p>
                         <p className="text-[10px] font-bold text-[#10b981] opacity-0 group-hover:opacity-100 transition-opacity">Gross Revenue</p>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center text-muted-foreground italic text-sm">
                       <div className="flex flex-col items-center gap-4 opacity-40">
                          <Search className="h-12 w-12" />
                          <p className="font-bold uppercase tracking-widest text-[11px]">Zero results in target scope</p>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="px-6 py-4 flex items-center justify-between bg-muted/5 border-t border-border/30 backdrop-blur-sm">
                <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">
                    Registry Segment: <span className="text-foreground">{(pagination.page-1)*pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}</span> / {pagination.total} ENTRIES
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-xl border-border/40 bg-background/50 hover:bg-[#10b981]/10 hover:text-[#10b981] transition-all" 
                        disabled={pagination.page <= 1 || isLoading}
                        onClick={() => fetchData(pagination.page - 1)}
                    >
                        <ChevronLeft className="h-4 w-4"/>
                    </Button>
                    <div className="text-[10px] font-black px-4 py-1.5 bg-card rounded-xl border border-border/50 shadow-inner flex items-center gap-2">
                        <span className="text-[#10b981]">{pagination.page}</span>
                        <span className="opacity-20 text-[8px]">OF</span>
                        <span>{pagination.totalPages}</span>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-xl border-border/40 bg-background/50 hover:bg-[#10b981]/10 hover:text-[#10b981] transition-all" 
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