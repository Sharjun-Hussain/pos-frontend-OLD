"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Eye, Loader2, Calendar as CalendarIcon, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function GRNReportPage() {
  const { data: session } = useSession();
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [filters, setFilters] = useState({
    supplier_id: "all",
    start_date: "",
    end_date: "",
    search: ""
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  // Fetch Suppliers for dropdown
  useEffect(() => {
    async function fetchSuppliers() {
      if (!session?.accessToken) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers?size=100`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const result = await response.json();
        if (result.status === "success") {
          setSuppliers(result.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch suppliers", error);
      }
    }
    fetchSuppliers();
  }, [session]);

  const fetchGRNs = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", pagination.page);
      params.append("size", pagination.limit);
      if (filters.supplier_id !== "all") params.append("supplier_id", filters.supplier_id);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/grn?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const result = await response.json();
      
      if (result.status === "success") {
        setGrns(result.data.data);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.message || "Failed to fetch GRNs");
      }
    } catch (error) {
      console.error("GRN fetch error:", error);
      toast.error("An error occurred while fetching GRNs");
    } finally {
      setLoading(false);
    }
  }, [session, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchGRNs();
  }, [fetchGRNs]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportToCSV = () => {
    if (grns.length === 0) {
      toast.error("No data available to export");
      return;
    }

    const headers = ["GRN #", "Date", "Supplier", "Branch", "Amount (LKR)", "Status"];
    const rows = grns.map(grn => [
      grn.grn_number,
      format(new Date(grn.received_date), "yyyy-MM-dd"),
      grn.supplier?.name || "N/A",
      grn.branch?.name || "N/A",
      grn.total_amount,
      grn.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `GRN_Report_${format(new Date(), "yyyyMMdd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">GRN History & Reports</h1>
          <p className="text-sm text-slate-500">Analyze received goods and purchase trends.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="bg-white" onClick={exportToCSV}>
             <Download className="w-4 h-4 mr-2" /> Export CSV
           </Button>
           <Button className="bg-blue-600 hover:bg-blue-700 shadow-md" asChild>
             <Link href="/purchase/purchase-orders">New GRN</Link>
           </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
             <CardDescription className="text-xs uppercase font-bold tracking-wider">Total Received (This Month)</CardDescription>
             <CardTitle className="text-2xl font-bold text-slate-800">
               LKR {grns.reduce((acc, g) => acc + parseFloat(g.total_amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
             </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
             <CardDescription className="text-xs uppercase font-bold tracking-wider">Active Suppliers</CardDescription>
             <CardTitle className="text-2xl font-bold text-slate-800">{new Set(grns.map(g => g.supplier_id)).size}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
             <CardDescription className="text-xs uppercase font-bold tracking-wider">Total Transactions</CardDescription>
             <CardTitle className="text-2xl font-bold text-slate-800">{pagination.total}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Filter by Supplier</label>
              <Select value={filters.supplier_id} onValueChange={(v) => handleFilterChange("supplier_id", v)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Start Date</label>
              <Input type="date" value={filters.start_date} onChange={(e) => handleFilterChange("start_date", e.target.value)} className="bg-white" />
            </div>
            <div className="space-y-2">
               <label className="text-sm font-medium text-slate-700">End Date</label>
               <Input type="date" value={filters.end_date} onChange={(e) => handleFilterChange("end_date", e.target.value)} className="bg-white" />
            </div>
            <div className="flex gap-2">
               <Button variant="secondary" className="flex-1" onClick={() => { setFilters({ supplier_id: "all", start_date: "", end_date: "", search: "" }); }}>
                 Reset
               </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRN Table */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>GRN #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Amount (LKR)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 bg-white">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="text-slate-500 text-sm">Loading reports...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : grns.length > 0 ? (
                grns.map((grn) => (
                  <TableRow key={grn.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold text-slate-900">{grn.grn_number}</TableCell>
                    <TableCell className="text-slate-600">{format(new Date(grn.received_date), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800">{grn.supplier?.name}</div>
                      <div className="text-xs text-slate-400">{grn.supplier?.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100">
                        {grn.branch?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      {parseFloat(grn.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "capitalize",
                        grn.status === 'completed' ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                      )}>
                        {grn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" asChild>
                          <Link href={`/purchase/grn/view/${grn.id}`}>
                            <Eye className="w-4 h-4 text-slate-400 hover:text-blue-600" />
                          </Link>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 bg-white text-slate-500">
                    No GRN records found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {pagination.pages > 1 && (
           <div className="p-4 bg-white border-t flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({...prev, page: prev.page - 1}))}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(prev => ({...prev, page: prev.page + 1}))}
              >
                Next
              </Button>
           </div>
        )}
      </Card>
    </div>
  );
}
