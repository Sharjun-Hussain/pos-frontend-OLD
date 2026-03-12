"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Package, 
  Download, 
  Search, 
  AlertTriangle,
  ShoppingCart,
  ArrowRight,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Info,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

export default function LowStockSummaryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { formatDate } = useAppSettings();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/low-stock`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch low stock data");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load low stock data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map(item => ({
      "Product": item.product,
      "Branch": item.branch,
      "Current Stock": item.quantity,
      "Threshold": item.threshold,
      "Status": item.status
    }));
    exportToCSV(exportData, "Low_Stock_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      "Product": item.product,
      "Branch": item.branch,
      "Current Stock": item.quantity,
      "Threshold": item.threshold,
      "Status": item.status
    }));
    exportToExcel(exportData, "Low_Stock_Report");
  };

  const handleBulkPO = () => {
    if (filteredData.length === 0) return;
    const variantIds = filteredData
      .map(item => item.variant_id || item.product_id || item.id)
      .join(",");
    router.push(`/purchase/purchase-orders/create?variants=${variantIds}`);
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken]);

  const filteredData = data.filter(item => 
    item.product.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-background max-w-[1400px] mx-auto w-full font-sans text-foreground pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-inner text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Low Stock Alert
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Inventory Hub</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Reports</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-amber-500">Stock Out Risk</span>
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
          <Button onClick={handleBulkPO} className="bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20 gap-2 hover:bg-[#0da371] h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-none transition-all active:scale-95">
            <ShoppingCart className="h-4 w-4" /> Bulk PO
          </Button>
          <Button onClick={fetchData} className="h-10 w-10 rounded-xl bg-card border border-border/50 text-foreground hover:bg-muted/30 shadow-sm transition-all active:scale-95" variant="outline" disabled={isLoading}>
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* --- STAT CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-red-500/10" />
          <CardContent className="p-6">
             <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70 mb-1">Items at Risk</p>
                   <h3 className="text-3xl font-black text-foreground tabular-nums tracking-tight">
                    {isLoading ? <Skeleton className="h-9 w-16" /> : data.length}
                   </h3>
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Info card describing the threshold */}
        <Card className="md:col-span-2 border-none shadow-sm bg-[#10b981]/5 overflow-hidden group hover:shadow-md transition-all duration-500 relative">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] shadow-inner">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-[#10b981] text-xs mb-1 uppercase tracking-[0.15em]">Restock Intelligence</h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                The reports below highlight items that have fallen below their safety threshold. 
                Use the <span className="text-[#10b981] font-bold">Bulk PO</span> feature to quickly initialize purchase orders for all low-stock variants.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- DATA TABLE --- */}
      <Card className="border-none shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-amber-500" />
              <div>
                <CardTitle className="text-base font-bold text-foreground">Critical Stock Levels</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-0.5">Variants requiring immediate attention across all branches</CardDescription>
              </div>
            </div>
            <div className="relative group max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#10b981] transition-colors" />
              <Input 
                placeholder="Search products..." 
                className="w-full bg-muted/30 border border-border/50 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="pl-6 font-bold text-foreground py-4 text-[10px] uppercase tracking-widest">Product & Identity</TableHead>
              <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Branch</TableHead>
              <TableHead className="text-right font-bold text-foreground text-[10px] uppercase tracking-widest">Current Stock</TableHead>
              <TableHead className="text-right font-bold text-foreground text-[10px] uppercase tracking-widest">Threshold</TableHead>
              <TableHead className="text-center font-bold text-foreground text-[10px] uppercase tracking-widest">Risk Level</TableHead>
              <TableHead className="text-right pr-6 font-bold text-foreground text-[10px] uppercase tracking-widest">Procurement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  <TableCell className="pl-6 py-4"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-xl" /><div className="space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto rounded-lg" /></TableCell>
                  <TableCell className="pr-6"><Skeleton className="h-8 w-24 ml-auto rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : filteredData.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-32 text-center py-20">
                   <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-full bg-muted/30 text-[#10b981]/20">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="font-bold text-muted-foreground text-sm uppercase tracking-widest">No critical stock detected</h4>
                      <p className="text-xs text-muted-foreground/60 font-medium">{searchQuery ? "Try refining your search." : "All inventory levels are currently above reorder thresholds."}</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-border/40 group">
                  <TableCell className="pl-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 rounded-xl border border-border/30 bg-muted/20 overflow-hidden shadow-inner">
                        <AvatarImage src={item.image} className="object-cover" />
                        <AvatarFallback className="bg-transparent text-muted-foreground/40"><Package className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-sm text-foreground mb-0.5">{item.product}</div>
                        <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" /> ID: {item.variant_id || item.product_id || item.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground/80 px-2 py-0.5 rounded shadow-none bg-muted/20 border-border/50">
                      {item.branch}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-red-600 tabular-nums">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground font-semibold tabular-nums">
                    {item.threshold}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "px-2.5 py-1 rounded-lg font-bold shadow-none text-[10px] uppercase border-none",
                      item.quantity === 0 
                        ? "bg-red-500/10 text-red-600" 
                        : "bg-amber-500/10 text-amber-600"
                    )}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                     <Button asChild variant="ghost" size="sm" className="bg-[#10b981]/5 text-[#10b981] hover:text-white hover:bg-[#10b981] gap-1.5 h-8 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wide transition-all active:scale-95 group-hover:shadow-md group-hover:shadow-[#10b981]/20">
                        <Link href={`/purchase/purchase-orders/create?variants=${item.variant_id || item.product_id || item.id}`}>
                          Restock <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                     </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="px-6 py-4 border-t border-border/30 bg-muted/5 flex items-center justify-between">
           <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
             {filteredData.length} critical inventory rows available
           </div>
           <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-border/50 bg-background hover:bg-muted text-foreground transition-all" disabled>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-border/50 bg-background hover:bg-muted text-foreground transition-all" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-border/50 bg-background hover:bg-muted text-foreground transition-all" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-border/50 bg-background hover:bg-muted text-foreground transition-all" disabled>
                <ChevronsRight className="h-4 w-4" />
              </Button>
           </div>
        </div>
      </Card>

    </div>
  );
}
