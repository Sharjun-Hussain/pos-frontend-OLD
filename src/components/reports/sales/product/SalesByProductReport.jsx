"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print"; // Modern usage
import {
  Printer,
  FileText,
  Download,
  Search,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
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
import { format, subMonths } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { SalesByProductPrintTemplate } from "@/components/Template/sales/SalesByProductTemplate";

// Import the template


import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";


export default function SalesByProductPage() {
  // --- STATES ---
  const { data: session } = useSession();
  const [date, setDate] = useState({ from: subMonths(new Date(), 1), to: new Date() });
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState("All");
  const [store, setStore] = useState("All Branches");
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);

  // --- METADATA STATES ---
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!session?.accessToken) return;
      try {
        const [catRes, brandRes, branchRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/active/list`, {
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
        const brandData = await brandRes.json();
        const branchData = await branchRes.json();

        if (catData.status === 'success') setCategories(catData.data);
        if (brandData.status === 'success') setBrands(brandData.data);
        if (branchData.status === 'success') setBranches(branchData.data);

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
        main_category_id: category === 'All' ? 'all' : category,
        brand_id: brand === 'All' ? 'all' : brand,
        branch_id: store === 'All Branches' ? 'all' : store
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/product?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        setData(result.data.map(item => ({
             id: item.product_id + (item.product_variant_id || ''),
             name: item.product.name + (item.variant ? ` (${item.variant.name})` : ''),
             sku: item.variant?.sku || item.product.code,
             sold: Number(item.total_quantity),
             sales: Number(item.total_revenue),
             price: Number(item.total_revenue) / Number(item.total_quantity), // Implied avg price
             profit: 0 // Profit not available in this aggregate yet
        })));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch product sales report");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken, date, category, brand, store]);

  // --- FILTER LOGIC ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery, data]);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    const totalSold = filteredData.reduce((acc, curr) => acc + curr.sold, 0);
    const totalRevenue = filteredData.reduce((acc, curr) => acc + curr.sales, 0);
    const totalProfit = filteredData.reduce((acc, curr) => acc + curr.profit, 0);
    const topSellingItem = [...filteredData].sort((a, b) => b.sold - a.sold)[0];
    const topRevenueItem = [...filteredData].sort((a, b) => b.sales - a.sales)[0];

    return { totalSold, totalRevenue, totalProfit, topSellingItem, topRevenueItem };
  }, [filteredData]);

  // --- CHART DATA PREP (Top 5) ---
  const chartData = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)
      .map(item => ({ name: item.name, sold: item.sold }));
  }, [filteredData]);

  // --- PRINT FUNCTIONALITY (FIXED) ---
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef, // Updated syntax
    documentTitle: "Sales_By_Product_Report",
  });

  // --- EXPORT LOGIC ---
  const handleExportCSV = () => {
    const exportData = filteredData.map(item => ({
      "Product Name": item.name,
      "SKU": item.sku,
      "Category": item.category || 'Product',
      "Brand": item.brand || '-',
      "Qty Sold": item.sold,
      "Unit Price": item.price,
      "Total Sales": item.sales,
      "Total Profit": item.profit
    }));
    exportToCSV(exportData, "Sales_By_Product_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      "Product Name": item.name,
      "SKU": item.sku,
      "Category": item.category || 'Product',
      "Brand": item.brand || '-',
      "Qty Sold": item.sold,
      "Unit Price": item.price,
      "Total Sales": item.sales,
      "Total Profit": item.profit
    }));
    exportToExcel(exportData, "Sales_By_Product_Report");
  };

  return (
    <div className="flex-1 p-8 bg-muted/30 min-h-screen space-y-6 font-sans text-foreground">
      
      {/* HIDDEN PRINT TEMPLATE */}
      <SalesByProductPrintTemplate 
        ref={printRef} 
        data={filteredData} 
        stats={stats}
        filters={{ 
          store: store === 'All Branches' ? 'All Branches' : branches.find(b => b.id === store)?.name || store,
          category: category === 'All' ? 'All Categories' : categories.find(c => c.id === category)?.name || category,
          brand: brand === 'All' ? 'All Brands' : brands.find(b => b.id === brand)?.name || brand
        }}
      />

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales by Product</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Reports</span>
            <span className="text-muted-foreground/40">/</span>
            <span>Sales</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground font-medium">Sales by Product</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => handlePrint()} variant="outline" className="bg-card border-border/50 shadow-sm gap-2 hover:bg-muted/30">
            <FileText className="h-4 w-4 text-muted-foreground" /> Export PDF
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="bg-card border-border/50 shadow-sm gap-2 hover:bg-muted/30">
            <Download className="h-4 w-4 text-muted-foreground" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-card border-border/50 shadow-sm gap-2 hover:bg-muted/30">
            <FileText className="h-4 w-4 text-muted-foreground" /> Excel
          </Button>
          <Button onClick={() => handlePrint()} variant="outline" className="bg-card border-border/50 shadow-sm gap-2 hover:bg-muted/30">
            <Printer className="h-4 w-4 text-muted-foreground" /> Print
          </Button>
        </div>
      </div>

      {/* --- FILTERS SECTION --- */}
      <Card className="border-none shadow-sm bg-card">
        <CardHeader className="pb-2 pt-6 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Filters</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-emerald-500 hover:text-emerald-600 dark:text-emerald-500 h-8 px-2"
            onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
          >
            {isFiltersCollapsed ? "Expand" : "Collapse"}
            {isFiltersCollapsed ? <ChevronDown className="ml-1 h-4 w-4"/> : <ChevronUp className="ml-1 h-4 w-4"/>}
          </Button>
        </CardHeader>
        
        {!isFiltersCollapsed && (
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              {/* Date Range */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10 border-border/50", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground/60" />
                      {date?.from ? format(date.from, "LLL dd, y") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Product Search */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Product</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/60" />
                  <Input 
                    placeholder="Name or SKU" 
                    className="pl-9 h-10 bg-card border-border/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-10 bg-card border-border/50"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Brand</label>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger className="h-10 bg-card border-border/50"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Brands</SelectItem>
                    {brands.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Store */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Store</label>
                <Select value={store} onValueChange={setStore}>
                  <SelectTrigger className="h-10 bg-card border-border/50"><SelectValue placeholder="All Branches" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Branches">All Branches</SelectItem>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4">
              <span className="text-sm text-emerald-500 cursor-pointer hover:underline font-medium flex items-center w-fit">
                Advanced Filters <ChevronDown className="ml-1 h-3 w-3" />
              </span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-card">
          <CardContent className="p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Products Sold</p>
            <h3 className="text-3xl font-bold text-foreground mt-2">{stats.totalSold.toLocaleString()}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card">
          <CardContent className="p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top Selling Product</p>
            <h3 className="text-xl font-bold text-foreground mt-2 truncate" title={stats.topSellingItem?.name}>{stats.topSellingItem?.name || "N/A"}</h3>
            <p className="text-xs text-muted-foreground/60 mt-1">{stats.topSellingItem?.sold || 0} units sold</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card">
          <CardContent className="p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Highest Revenue Product</p>
            <h3 className="text-xl font-bold text-foreground mt-2 truncate" title={stats.topRevenueItem?.name}>{stats.topRevenueItem?.name || "N/A"}</h3>
            <p className="text-xs text-muted-foreground/60 mt-1">LKR {(stats.topRevenueItem?.sales || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card">
          <CardContent className="p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Profit</p>
            <h3 className="text-3xl font-bold text-foreground mt-2">LKR {(stats.totalProfit || 0).toLocaleString()}</h3>
          </CardContent>
        </Card>
      </div>

      {/* --- CHART --- */}
      <Card className="border-none shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Top 5 Selling Products (by Quantity)</CardTitle>
        </CardHeader>
        <CardContent className="pl-0 pr-6 pb-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" width={150} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sold" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* --- TABLE --- */}
      <Card className="border-none shadow-sm bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border/30">
              <TableRow>
                <TableHead className="pl-6 py-4 font-semibold text-muted-foreground">Product Name</TableHead>
                <TableHead className="font-semibold text-muted-foreground">SKU</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Category</TableHead>
                <TableHead className="text-center font-semibold text-muted-foreground">Qty Sold</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Unit Price</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Total Sales</TableHead>
                <TableHead className="text-right pr-6 font-semibold text-muted-foreground">Total Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-b border-border/20">
                    <TableCell className="pl-6 py-4 font-medium text-foreground">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">{item.sku}</TableCell>
                    <TableCell className="text-muted-foreground">Product</TableCell>
                    <TableCell className="text-center text-foreground">{item.sold || 0}</TableCell>
                    <TableCell className="text-right text-muted-foreground">LKR {(item.price || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium text-foreground">LKR {(item.sales || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right pr-6 font-bold text-green-600">LKR {(item.profit || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">No products found matching filters.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="p-4 border-t border-border/30 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Showing {filteredData.length} results</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}