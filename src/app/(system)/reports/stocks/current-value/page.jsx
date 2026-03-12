"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Package, 
  Download, 
  Search, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Box,
  FileText,
  Printer,
  RefreshCw,
  Info,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

export default function CurrentStockValuePage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/value`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch stock value data");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data.details);
        setSummary(result.data.summary);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stock value data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map(item => ({
      "Product": item.product,
      "Variant": item.variant,
      "Branch": item.branch,
      "Quantity": item.quantity,
      "Unit Cost": item.unit_cost,
      "Unit Price": item.unit_price,
      "Total Cost": item.total_cost,
      "Total Retail": item.total_retail
    }));
    exportToCSV(exportData, "Current_Stock_Value_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      "Product": item.product,
      "Variant": item.variant,
      "Branch": item.branch,
      "Quantity": item.quantity,
      "Unit Cost": item.unit_cost,
      "Unit Price": item.unit_price,
      "Total Cost": item.total_cost,
      "Total Retail": item.total_retail
    }));
    exportToExcel(exportData, "Current_Stock_Value_Report");
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken]);

  const filteredData = data.filter(item => 
    item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.variant.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-background max-w-[1400px] mx-auto w-full font-sans text-foreground pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Stock Valuation</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Inventory Hub</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Reports</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Asset Value</span>
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
          <Button onClick={() => window.print()} className="bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20 gap-2 hover:bg-[#0da371] h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-none transition-all active:scale-95">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button onClick={fetchData} className="h-10 w-10 rounded-xl bg-card border border-border/50 text-foreground hover:bg-muted/30 shadow-sm transition-all active:scale-95" variant="outline" disabled={isLoading}>
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* --- SUMMARY STATS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Items */}
        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-[#10b981]/10" />
          <CardContent className="p-6">
            <div className="flex flex-col gap-3">
              <div className="p-3.5 w-fit rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70 mb-1">Total Stock Quantity</p>
                <h3 className="text-2xl font-black text-foreground tabular-nums tracking-tight">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : (summary?.totalItems?.toLocaleString() || 0)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Cost Value */}
        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-red-500/10" />
          <CardContent className="p-6">
            <div className="flex flex-col gap-3">
              <div className="p-3.5 w-fit rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70 mb-1">Total Valuation (Cost)</p>
                <h3 className="text-2xl font-black text-foreground tabular-nums tracking-tight">
                  {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(summary?.totalCostValue || 0)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Retail Value */}
        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-blue-500/10" />
          <CardContent className="p-6">
            <div className="flex flex-col gap-3">
              <div className="p-3.5 w-fit rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70 mb-1">Total Valuation (Retail)</p>
                <h3 className="text-2xl font-black text-foreground tabular-nums tracking-tight">
                  {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(summary?.totalRetailValue || 0)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Potential Profit */}
        <Card className="border-none shadow-sm bg-[#10b981] overflow-hidden group hover:shadow-md transition-all duration-500 relative text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-white/20" />
          <CardContent className="p-6">
            <div className="flex flex-col gap-3">
              <div className="p-3.5 w-fit rounded-2xl bg-white/20 border border-white/30 shadow-lg group-hover:scale-110 transition-transform duration-500">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.15em] text-white/80 uppercase mb-1">Estimated Asset Profit</p>
                <h3 className="text-2xl font-black tabular-nums tracking-tight">
                  {isLoading ? <Skeleton className="h-8 w-32 bg-white/20" /> : formatCurrency(summary?.potentialProfit || 0)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- TABLE SECTION --- */}
      <Card className="border-none shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-[#10b981]" />
              <div>
                <CardTitle className="text-base font-bold text-foreground">Asset Inventory</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-0.5">Valuation breakdown by product and variant</CardDescription>
              </div>
            </div>
            <div className="relative group max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#10b981] transition-colors" />
              <Input 
                placeholder="Search products..." 
                className="w-full bg-muted/30 border border-border/50 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="pl-6 font-bold text-foreground py-4 text-[10px] uppercase tracking-widest">Product Information</TableHead>
              <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Branch</TableHead>
              <TableHead className="text-right font-bold text-foreground text-[10px] uppercase tracking-widest">Stock</TableHead>
              <TableHead className="text-right font-bold text-foreground text-[10px] uppercase tracking-widest">Cost Analysis</TableHead>
              <TableHead className="text-right pr-6 font-bold text-foreground text-[10px] uppercase tracking-widest">Retail Analysis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  <TableCell className="pl-6 py-4"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-20 mt-1" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-32 ml-auto" /><Skeleton className="h-3 w-24 ml-auto mt-1" /></TableCell>
                  <TableCell className="text-right pr-6"><Skeleton className="h-4 w-32 ml-auto" /><Skeleton className="h-3 w-24 ml-auto mt-1" /></TableCell>
                </TableRow>
              ))
            ) : filteredData.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-32 text-center py-20">
                   <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-full bg-muted/30 text-muted-foreground/20">
                      <Search className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="font-bold text-muted-foreground text-sm uppercase tracking-widest">No matching assets found</h4>
                      <p className="text-xs text-muted-foreground/60 font-medium">Try refining your search to see results.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-border/40 group">
                  <TableCell className="pl-6 py-4">
                    <div className="font-bold text-sm text-foreground mb-0.5">{item.product}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide flex items-center gap-1.5">
                       <Layers className="w-2.5 h-2.5" /> {item.variant}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground/80 px-2 py-0.5 rounded shadow-none bg-muted/20 border-border/50">
                      {item.branch}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-foreground tabular-nums">
                    {item.quantity || 0}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <div className="font-bold text-foreground text-xs">{formatCurrency(item.unit_cost || 0)} <span className="text-[9px] text-muted-foreground/50 ml-0.5 italic">/unit</span></div>
                    <div className="text-[11px] font-black text-red-600/80 mt-0.5">{formatCurrency(item.total_cost || 0)}</div>
                  </TableCell>
                  <TableCell className="text-right pr-6 tabular-nums">
                    <div className="font-bold text-foreground text-xs">{formatCurrency(item.unit_price || 0)} <span className="text-[9px] text-muted-foreground/50 ml-0.5 italic">/unit</span></div>
                    <div className="text-[11px] font-black text-[#10b981] mt-0.5">{formatCurrency(item.total_retail || 0)}</div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="px-6 py-4 flex justify-between items-center border-t border-border/30 bg-muted/5 font-sans">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
             Showing {filteredData.length} active inventory assets
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-30" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-30" disabled>Next</Button>
          </div>
        </div>
      </Card>

      {/* --- TIPS CARD --- */}
      <Card className="border-none shadow-sm bg-[#10b981]/5 overflow-hidden font-sans border-l-4 border-l-[#10b981]">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="p-2.5 rounded-xl bg-[#10b981]/10 text-[#10b981] shrink-0 h-fit">
              <Info className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-[#10b981] text-xs mb-1.5 uppercase tracking-[0.2em]">Asset Intelligence Note</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-bold uppercase tracking-wide opacity-80">
                Current Stock Value is calculated based on Weighted Average Cost (WAC) or Last Purchase Price depending on your system configuration. Retail value represents the snapshot of current selling prices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
