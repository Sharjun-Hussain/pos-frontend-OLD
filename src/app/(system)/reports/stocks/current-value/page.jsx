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
  FileText
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
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Current Stock Value</h1>
          <p className="text-slate-500">Real-time valuation of your current inventory assets.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Total Items</CardTitle>
            <Box className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{summary?.totalItems?.toLocaleString()}</div>}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Total Cost Value</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">LKR {summary?.totalCostValue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Total Retail Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">LKR {summary?.totalRetailValue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-blue-100 uppercase">Potential Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-100" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-32 bg-blue-500" /> : <div className="text-2xl font-bold">LKR {summary?.potentialProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search products..." 
              className="pl-10 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0 bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Total Retail</TableHead>
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
                  <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                    No items found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900">{item.product}</TableCell>
                    <TableCell className="text-slate-500">{item.variant}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{item.branch}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{item.quantity || 0}</TableCell>
                    <TableCell className="text-right text-slate-600">LKR {(item.unit_cost || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-slate-600">LKR {(item.unit_price || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">LKR {(item.total_cost || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">LKR {(item.total_retail || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
