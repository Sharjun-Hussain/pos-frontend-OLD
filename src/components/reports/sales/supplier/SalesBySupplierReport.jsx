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
  Loader2
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
import { format, subDays } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SalesBySupplierPrintTemplate } from "@/components/Template/sales/SalesBySupplierTemplate";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

export default function SalesBySupplierPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();

  // --- STATE ---
  const [date, setDate] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const [store, setStore] = useState("all");
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- FETCH DATA ---
  const fetchData = async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
        branch_id: store,
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/supplier-profit?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data);
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
    fetchData();
  }, [session?.accessToken, date, store]);

  // --- FILTER LOGIC (Local Search) ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.supplier_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [data, searchQuery]);

  // --- STATS & CHART CALCULATION ---
  const stats = useMemo(() => {
    const totalSales = filteredData.reduce((acc, curr) => acc + curr.totalSales, 0);
    const totalProfit = filteredData.reduce((acc, curr) => acc + curr.profit, 0);
    const topSupplier = [...filteredData].sort((a, b) => b.totalSales - a.totalSales)[0];
    const activeSuppliers = filteredData.length;

    return { totalSales, totalProfit, topSupplier, activeSuppliers };
  }, [filteredData]);

  // Top 5 for Chart
  const chartData = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5)
      .map(item => ({ name: item.supplier_name, sales: item.totalSales }));
  }, [filteredData]);

  // --- PRINT ENGINE ---
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Sales_By_Supplier_Report",
  });

  // --- EXPORT LOGIC ---
  const handleExportCSV = () => {
    const exportData = filteredData.map(item => ({
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
    <div className="flex-1 p-8 bg-slate-50 min-h-screen space-y-8 font-sans text-slate-900">
      
      {/* HIDDEN PRINT TEMPLATE */}
      <SalesBySupplierPrintTemplate 
        ref={printRef} 
        data={filteredData} 
        stats={stats} 
        filters={{ store, category: "All" }}
      />

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sales Summary By Supplier</h1>
          <p className="text-slate-500 mt-1">Analyze vendor performance and procurement profitability.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" className="bg-white border-slate-200 shadow-sm gap-2 text-slate-700 hover:bg-slate-50">
            <FileText className="h-4 w-4" /> Export PDF
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="bg-white border-slate-200 shadow-sm gap-2 text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-white border-slate-200 shadow-sm gap-2 text-slate-700 hover:bg-slate-50">
            <FileText className="h-4 w-4" /> Excel
          </Button>
          <Button onClick={handlePrint} className="bg-slate-900 text-white shadow-sm gap-2 hover:bg-slate-800">
            <Printer className="h-4 w-4" /> Print Report
          </Button>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-5 items-end">
            
            {/* Date Range */}
            <div className="space-y-2 flex-1 min-w-[220px]">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10 border-slate-200 bg-slate-50/50", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                      {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}</> : format(date.from, "LLL dd")) : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
            </div>

            {/* Supplier Name Search (Local) */}
            <div className="space-y-2 flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Supplier</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Filter list..." 
                    className="pl-9 h-10 border-slate-200 bg-slate-50/50 focus:bg-white transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
            </div>

            {/* Branch Selector */}
            <div className="space-y-2 w-full lg:w-[180px]">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch</label>
                <Select value={store} onValueChange={setStore}>
                  <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

            <div className="pb-1">
               {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
            </div>

          </div>
        </CardContent>
      </Card>

      {/* --- KPI METRICS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white transition-all hover:shadow-md">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sales from Suppliers</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(stats.totalSales)}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white transition-all hover:shadow-md border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Performing Supplier</p>
            <h3 className="text-xl font-bold text-slate-900 mt-2 truncate" title={stats.topSupplier?.supplier_name}>{stats.topSupplier?.supplier_name || "-"}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
               <TrendingUp className="h-3 w-3 text-emerald-500"/> Highest Revenue
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white transition-all hover:shadow-md">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suppliers with Sales</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">{stats.activeSuppliers}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white transition-all hover:shadow-md border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Gross Profit</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(stats.totalProfit)}</h3>
          </CardContent>
        </Card>
      </div>

      {/* --- CHART SECTION --- */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">Top 5 Suppliers by Sales</CardTitle>
        </CardHeader>
        <CardContent className="pl-0 pr-6 pb-6 pt-4">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <YAxis dataKey="name" type="category" width={150} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  formatter={(value) => [formatCurrency(value), "Sales"]}
                />
                <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* --- DATA TABLE --- */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="pl-6 py-4 font-semibold text-slate-600 border-l-4 border-l-transparent">Supplier Name</TableHead>
                <TableHead className="text-center font-semibold text-slate-600">Items Sold</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Total Sales</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Discount</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Net Sales</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Gross Profit</TableHead>
                <TableHead className="text-right pr-6 font-semibold text-slate-600">Margin (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500 italic">
                    <div className="flex flex-col items-center gap-2">
                       <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                       <span>Loading supplier data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0 group">
                    <TableCell className="pl-6 py-4 font-bold text-slate-900 border-l-4 border-l-transparent group-hover:border-l-blue-500 transition-all">{item.supplier_name}</TableCell>
                    <TableCell className="text-center text-slate-700">{item.sold}</TableCell>
                    <TableCell className="text-right text-slate-600 font-medium">{formatCurrency(item.totalSales)}</TableCell>
                    <TableCell className="text-right text-red-600">({formatCurrency(item.discount)})</TableCell>
                    <TableCell className="text-right font-bold text-slate-900">{formatCurrency(item.netSales)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(item.profit)}</TableCell>
                    <TableCell className="text-right pr-6">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-bold",
                          item.margin >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}>
                          {item.margin.toFixed(1)}%
                        </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500 italic">
                    No supplier performance data found for the selected period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <p className="text-sm text-slate-500">Showing {filteredData.length} active suppliers</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 bg-white text-slate-600" disabled>Previous</Button>
              <Button variant="outline" size="sm" className="h-8 bg-white text-slate-600" disabled>Next</Button>
            </div>
          </div>
        </div>
      </Card>

    </div>
  );
}