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
  ChevronsRight
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function LowStockSummaryPage() {
  const { data: session } = useSession();
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

  useEffect(() => {
    fetchData();
  }, [session?.accessToken]);

  const filteredData = data.filter(item => 
    item.product.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 bg-muted/30 min-h-screen space-y-6 font-sans text-foreground">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Low Stock Summary <AlertTriangle className="h-6 w-6 text-amber-500" />
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Reports</span>
            <span className="text-muted-foreground/40">/</span>
            <span>Stocks</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground font-medium">Low Stock</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="bg-card border-border/50 shadow-sm gap-2 hover:bg-muted/30">
            <Download className="h-4 w-4 text-muted-foreground" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-card border-border/50 shadow-sm gap-2 hover:bg-muted/30">
            <FileText className="h-4 w-4 text-muted-foreground" /> Excel
          </Button>
          <Button className="gap-2 bg-[#10b981] hover:bg-[#059669] shadow-sm text-white">
            <ShoppingCart className="h-4 w-4 text-emerald-100" /> Create Bulk PO
          </Button>
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="space-y-0">
        <div className="rounded-t-xl border-x border-t border-border overflow-hidden bg-background/50 transition-colors duration-500">
          <div className="p-4 border-b border-border/30 flex justify-between items-center bg-card">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input 
                placeholder="Search products..." 
                className="pl-9 h-10 bg-background border-border/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="text-sm font-medium text-muted-foreground">
               Total Low Stock Items: <span className="text-red-600 font-bold">{data.length}</span>
            </div>
          </div>
          <Table>
            <TableHeader className="bg-sidebar-accent/20 backdrop-blur-md">
              <TableRow className="hover:bg-transparent border-b border-border/60 transition-colors group">
                <TableHead className="pl-6 h-12 py-3 text-foreground font-semibold text-xs tracking-tight transition-colors">Product</TableHead>
                <TableHead className="h-12 py-3 text-foreground font-semibold text-xs tracking-tight transition-colors">Branch</TableHead>
                <TableHead className="text-right h-12 py-3 text-foreground font-semibold text-xs tracking-tight transition-colors">Current Stock</TableHead>
                <TableHead className="text-right h-12 py-3 text-foreground font-semibold text-xs tracking-tight transition-colors">Threshold</TableHead>
                <TableHead className="text-center h-12 py-3 text-foreground font-semibold text-xs tracking-tight transition-colors">Status</TableHead>
                <TableHead className="text-right pr-6 h-12 py-3 text-foreground font-semibold text-xs tracking-tight transition-colors">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-md" /><Skeleton className="h-4 w-40" /></div></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs opacity-50">
                    {searchQuery ? "No results found." : "Great! No items are currently low on stock."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-sidebar-accent/15 border-b border-border/30 last:border-0 transition-all duration-200 group">
                    <TableCell className="pl-6 py-3.5 text-[13px] text-foreground/90 font-medium transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-md border border-border/30">
                          <AvatarImage src={item.image} />
                          <AvatarFallback className="bg-muted/50"><Package className="h-4 w-4 text-muted-foreground/60" /></AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-foreground">{item.product}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 text-[13px] text-foreground/90 font-medium transition-colors">
                      <Badge variant="outline" className="font-normal text-muted-foreground">{item.branch}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600 py-3.5 text-[13px] transition-colors">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground font-medium py-3.5 text-[13px] transition-colors">
                      {item.threshold}
                    </TableCell>
                    <TableCell className="text-center py-3.5 text-[13px] transition-colors">
                      <Badge className={item.quantity === 0 ? "bg-red-500/10 text-red-600 hover:bg-red-500/10" : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-3.5 text-[13px] transition-colors">
                       <Button asChild variant="ghost" size="sm" className="text-[#10b981] hover:text-[#059669] hover:bg-[#10b981]/10 gap-1 h-8">
                          <Link href="/purchase-orders/new">
                            Restock <ArrowRight className="h-3 w-3" />
                          </Link>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 gap-4 bg-card/10 backdrop-blur-sm border-x border-b border-border rounded-b-xl border-t">
          <div className="flex-1 text-[11px] text-muted-foreground font-semibold">
            {filteredData.length} row(s) available
          </div>
          <div className="flex items-center space-x-6 lg:space-x-10">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-9 w-9 p-0 lg:flex border-border bg-background hover:bg-sidebar-accent/50 text-foreground rounded-xl transition-all"
                disabled
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-9 w-9 p-0 border-border bg-background hover:bg-sidebar-accent/50 text-foreground rounded-xl transition-all"
                disabled
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-9 w-9 p-0 border-border bg-background hover:bg-sidebar-accent/50 text-foreground rounded-xl transition-all"
                disabled
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-9 w-9 p-0 lg:flex border-border bg-background hover:bg-sidebar-accent/50 text-foreground rounded-xl transition-all"
                disabled
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
