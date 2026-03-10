"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Package, 
  Download, 
  Search, 
  AlertCircle,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Box,
  FileText,
  Printer
} from "lucide-react";
import { toast } from "sonner";
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

export default function CurrentStockValuePage() {
  const { data: session } = useSession();
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
    <div className="flex-1 p-8 bg-muted/30 min-h-screen space-y-6 font-sans text-foreground">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Current Stock Value</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Reports</span>
            <span className="text-muted-foreground/40">/</span>
            <span>Stocks</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground font-medium">Current Value</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-card border-border/50 shadow-sm gap-2 hover:bg-muted/30">
            <FileText className="h-4 w-4 text-muted-foreground" /> Export PDF
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="bg-card border-border/50 shadow-sm gap-2 hover:bg-muted/30">
            <Download className="h-4 w-4 text-muted-foreground" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-card border-border/50 shadow-sm gap-2 hover:bg-muted/30">
            <FileText className="h-4 w-4 text-muted-foreground" /> Excel
          </Button>
          <Button variant="outline" className="bg-card border-border/50 shadow-sm gap-2 hover:bg-muted/30">
            <Printer className="h-4 w-4 text-muted-foreground" /> Print
          </Button>
        </div>
      </div>

      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-card">
          <CardContent className="p-6">
             <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Items</p>
             <h3 className="text-3xl font-bold text-foreground mt-2">{summary?.totalItems?.toLocaleString() || 0}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card">
          <CardContent className="p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Cost Value</p>
            <h3 className="text-2xl font-bold text-foreground mt-2">LKR {(summary?.totalCostValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card">
          <CardContent className="p-6">
             <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Retail Value</p>
             <h3 className="text-2xl font-bold text-foreground mt-2">LKR {(summary?.totalRetailValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card">
          <CardContent className="p-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Potential Profit</p>
            <h3 className="text-3xl font-bold text-emerald-600 mt-2">LKR {(summary?.potentialProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          </CardContent>
        </Card>
      </div>

      {/* --- TABLE SECTION --- */}
      <Card className="border-none shadow-sm bg-card">
        <div className="p-4 border-b border-border/30 flex justify-between items-center bg-card">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input 
              placeholder="Search products..." 
              className="pl-9 h-10 bg-muted/30 border-border/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border/30">
              <TableRow>
                <TableHead className="pl-6 py-4 font-semibold text-muted-foreground">Product</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Variant</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Branch</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Quantity</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Unit Cost</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Unit Price</TableHead>
                <TableHead className="text-right font-semibold text-muted-foreground">Total Cost</TableHead>
                <TableHead className="text-right pr-6 font-semibold text-muted-foreground">Total Retail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground italic">
                    No items found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-b border-border/20">
                    <TableCell className="pl-6 py-4 font-medium text-foreground">{item.product}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{item.variant}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.branch}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground">{item.quantity || 0}</TableCell>
                    <TableCell className="text-right text-muted-foreground">LKR {(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right text-muted-foreground">LKR {(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">LKR {(item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right pr-6 font-bold text-green-600">LKR {(item.total_retail || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))
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
