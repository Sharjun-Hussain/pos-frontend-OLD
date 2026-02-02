"use client";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect } from "react";
import {
  Printer,
  Download,
  Search,
  Package,
  AlertTriangle,
  FileText,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StockSummaryReportPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branch, setBranch] = useState("all");
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMetadata = async () => {
    if (!session?.accessToken) return;
    try {
      const [branchRes, catRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        })
      ]);
      const branchData = await branchRes.json();
      const catData = await catRes.json();
      if (branchData.status === 'success') setBranches(branchData.data);
      if (catData.status === 'success') setCategories(catData.data);
    } catch (err) { console.error(err); }
  };

  const fetchData = async () => {
    if (!session?.accessToken) return;
    try {
      const queryParams = new URLSearchParams({
        branch_id: branch,
        main_category_id: category
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/summary?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data);
      } else {
        toast.error(result.message || "Failed to fetch stock summary");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, [session?.accessToken]);

  const handleExportCSV = () => {
    const exportData = filteredData.map((item) => ({
      Branch: item.branch?.name,
      Category: item.product?.main_category?.name,
      Product: item.product?.name,
      Variant: item.variant?.name || "Standard",
      SKU: item.variant?.sku || item.product?.code,
      Quantity: item.quantity,
      "Reorder Level": item.product?.reorder_level || 0,
      Status: Number(item.quantity) <= Number(item.product?.reorder_level || 0) ? "Low Stock" : "OK",
    }));
    exportToCSV(exportData, "Stock_Summary_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((item) => ({
      Branch: item.branch?.name,
      Category: item.product?.main_category?.name,
      Product: item.product?.name,
      Variant: item.variant?.name || "Standard",
      SKU: item.variant?.sku || item.product?.code,
      Quantity: item.quantity,
      "Reorder Level": item.product?.reorder_level || 0,
      Status: Number(item.quantity) <= Number(item.product?.reorder_level || 0) ? "Low Stock" : "OK",
    }));
    exportToExcel(exportData, "Stock_Summary_Report");
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken, branch, category]);

  const filteredData = data.filter((item) =>
    item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product?.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 bg-slate-50 min-h-screen space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Current Stock Summary
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time inventory levels across all branches and products.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" /> Excel
          </Button>
          <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
             <div className="w-full lg:w-64 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch</label>
                <Select value={branch} onValueChange={setBranch}>
                    <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="All Branches" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {branches.map(b => (
                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="w-full lg:w-64 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Product</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search product name or SKU..." 
                        className="pl-10 h-10 border-slate-200" 
                        value={searchQuery}
                        onChange={(e)=>setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="pl-6">Product & Variant</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-center">Min Level</TableHead>
              <TableHead className="text-right pr-6">Current Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => {
                const isLow = parseFloat(item.quantity) <= parseFloat(item.product?.reorder_level || 0);
                return (
                    <TableRow key={item.id} className="hover:bg-slate-50 transition-colors py-4">
                    <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "p-2 rounded-lg",
                                isLow ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                            )}>
                                <Package className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{item.product?.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{item.variant?.name || "Standard"} • {item.variant?.sku || item.product?.code}</p>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-100">
                            {item.product?.main_category?.name || "Uncategorized"}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-medium">
                        {item.branch?.name}
                    </TableCell>
                    <TableCell className="text-center text-xs text-slate-400 font-bold">
                        {item.product?.reorder_level || 0}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                        <div className="flex flex-col items-end">
                            <span className={cn(
                                "text-lg font-black",
                                isLow ? "text-amber-600" : "text-slate-900"
                            )}>{parseFloat(item.quantity).toFixed(0)}</span>
                            {isLow && (
                                <div className="flex items-center gap-1 text-[9px] text-amber-600 font-bold uppercase tracking-tight">
                                    <AlertTriangle className="h-2.5 w-2.5" /> Low Stock
                                </div>
                            )}
                        </div>
                    </TableCell>
                    </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500 italic">No stock records found matching your filters.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
