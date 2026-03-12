"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  ShoppingBag, 
  Search, 
  Download,
  Calendar,
  Building2,
  Package,
  ArrowUpRight,
  TrendingDown,
  Award,
  Truck,
  FileText,
  RefreshCw,
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
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export default function SupplierPerformancePage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/purchase/supplier-performance`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch supplier performance");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load supplier performance");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map(item => ({
      "Supplier Name": item.name,
      "Company": item.company || '-',
      "Active Products": item.productCount,
      "Total Orders": item.orderCount,
      "Total Purchase Value": item.totalPurchase
    }));
    exportToCSV(exportData, "Supplier_Performance_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      "Supplier Name": item.name,
      "Company": item.company || '-',
      "Active Products": item.productCount,
      "Total Orders": item.orderCount,
      "Total Purchase Value": item.totalPurchase
    }));
    exportToExcel(exportData, "Supplier_Performance_Report");
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken]);

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.company && item.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const topSupplier = data.length > 0 ? data[0] : null;

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-background max-w-[1600px] mx-auto w-full font-sans text-foreground pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Supplier Performance</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Procurement Analysis</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Reports</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Vendor Reliability</span>
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
          <Button onClick={fetchData} className="h-10 w-10 rounded-xl bg-card border border-border/50 text-foreground hover:bg-muted/30 shadow-sm transition-all active:scale-95" variant="outline" disabled={isLoading}>
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-none shadow-sm bg-gradient-to-br from-[#10b981] to-[#059669] text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-white/20" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 flex items-center gap-2">
                <Award className="h-4 w-4" /> Strategic Partner
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-48 bg-white/20" />
                    <Skeleton className="h-4 w-32 bg-white/20" />
                    <div className="pt-4 border-t border-white/20 flex justify-between">
                        <Skeleton className="h-12 w-24 bg-white/20" />
                        <Skeleton className="h-12 w-24 bg-white/20" />
                    </div>
                </div>
            ) : (
                <>
                    <div className="text-2xl font-black tabular-nums tracking-tight">{topSupplier?.name || 'N/A'}</div>
                    <p className="text-[11px] text-white/70 mt-1 uppercase font-bold tracking-widest">{topSupplier?.company || 'Authorized Supply Chain'}</p>
                    <div className="mt-8 pt-6 border-t border-white/20 flex justify-between">
                        <div>
                            <p className="text-[9px] text-white/60 uppercase font-black tracking-widest mb-1">Procurement</p>
                            <p className="text-xl font-black tabular-nums tracking-tight">{formatCurrency(topSupplier?.totalPurchase || 0)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-white/60 uppercase font-black tracking-widest mb-1">Fulfillment</p>
                            <p className="text-xl font-black tabular-nums tracking-tight">{topSupplier?.orderCount} <span className="text-xs font-medium opacity-60">Orders</span></p>
                        </div>
                    </div>
                </>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-sm bg-card overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-emerald-500/10" />
            <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 rounded-full bg-[#10b981]" />
                    <div>
                        <CardTitle className="text-base font-bold text-foreground">Supply Chain Analytics</CardTitle>
                        <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-0.5">Performance distribution across the vendor network</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="flex items-center gap-12 h-32">
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Active Entities</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-foreground tabular-nums tracking-tighter">
                                {isLoading ? <Skeleton className="h-10 w-16" /> : data.length}
                            </span>
                            <span className="text-xs font-bold text-muted-foreground/40 uppercase">Suppliers</span>
                        </div>
                    </div>
                    <div className="w-px h-16 bg-border/50" />
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Total Capital Flow</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-foreground tabular-nums tracking-tighter">
                                {isLoading ? <Skeleton className="h-10 w-64" /> : formatCurrency(data.reduce((s,i) => s + (i.totalPurchase || 0), 0))}
                            </span>
                            <Badge variant="outline" className="bg-[#10b981]/5 text-[#10b981] border-[#10b981]/20 font-black text-[9px] px-2 py-0">FISCAL YEAR</Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-[#10b981]" />
              <div>
                <CardTitle className="text-base font-bold text-foreground">Vendor Performance Ledger</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-0.5">Comparative intelligence on procurement metrics</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative w-full md:w-80 group/search">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/search:text-[#10b981] transition-colors" />
                    <Input 
                        placeholder="Search by name or company..." 
                        className="pl-11 h-10 rounded-xl border-border/50 bg-background font-bold text-[11px] focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                        value={searchQuery}
                        onChange={(e)=>setSearchQuery(e.target.value)}
                    />
                </div>
                {isLoading && <Badge className="bg-[#10b981]/10 text-[#10b981] animate-pulse rounded-lg font-bold border-none uppercase text-[9px] tracking-widest px-2 shadow-none">Syncing Ledger</Badge>}
            </div>
        </CardHeader>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="pl-6 font-bold text-foreground py-4 text-[10px] uppercase tracking-widest">Supplier Identity</TableHead>
              <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Affiliated Organization</TableHead>
              <TableHead className="text-center font-bold text-foreground text-[10px] uppercase tracking-widest">SKU Diversity</TableHead>
              <TableHead className="text-center font-bold text-foreground text-[10px] uppercase tracking-widest">Transaction Volume</TableHead>
              <TableHead className="text-right pr-6 font-bold text-foreground text-[10px] uppercase tracking-widest">Cumulative Exposure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  <TableCell className="pl-6 py-4"><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-12 mx-auto rounded-lg" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-12 mx-auto rounded-lg" /></TableCell>
                  <TableCell className="text-right pr-6"><Skeleton className="h-4 w-32 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-border/40 group relative">
                    <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-muted/40 text-muted-foreground/60 border-border/40 group-hover:bg-[#10b981]/10 group-hover:text-[#10b981] group-hover:border-[#10b981]/20 transition-all duration-300">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-bold text-[13px] text-foreground mb-0.5 group-hover:text-[#10b981] transition-colors tracking-tight uppercase">{item.name}</p>
                                <p className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest">SUPPLIER ID: #{item.id?.toString().padStart(4, '0')}</p>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground/80">{item.company || "Independent Entity"}</span>
                            <span className="text-[9px] text-muted-foreground/30 font-medium uppercase tracking-tight">Verified Corporate Partner</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                        <Badge variant="outline" className="bg-muted/20 text-muted-foreground/80 border-border/50 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-none group-hover:bg-[#10b981]/10 group-hover:text-[#10b981] group-hover:border-[#10b981]/30 transition-all">
                            {item.productCount} <span className="ml-1 opacity-40 font-medium">SKUs</span>
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                        <span className="text-[13px] font-bold text-foreground/80 tabular-nums">
                            {item.orderCount} <span className="text-[10px] text-muted-foreground/30 font-black uppercase tracking-widest ml-1">Orders</span>
                        </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                        <p className="text-sm font-black text-[#10b981] tabular-nums tracking-tight">{formatCurrency(item.totalPurchase || 0)}</p>
                        <p className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-widest mt-0.5">Fiscal Assessment Complete</p>
                    </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-48 text-center py-20">
                   <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-full bg-muted/30 text-muted-foreground/20">
                      <Building2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="font-bold text-muted-foreground text-sm uppercase tracking-widest">No vendor records found</h4>
                      <p className="text-xs text-muted-foreground/60 font-medium">Clear search terms to refresh the performance ledger.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="px-6 py-4 flex justify-between items-center border-t border-border/30 bg-muted/5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
             Monitoring {filteredData.length} global partners
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
