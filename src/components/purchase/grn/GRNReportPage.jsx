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
import { Search, Download, Eye, Loader2, Filter, ClipboardList, TrendingUp, Users, ReceiptText, X } from "lucide-react";
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
    <div className="flex-1 space-y-6 p-6 bg-background min-h-screen">
      {/* ── Premium Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20">
            <ClipboardList className="w-4.5 h-4.5 text-[#10b981]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">GRN History &amp; Reports</h1>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] opacity-80">
              Goods Received · Trends · Analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60" onClick={exportToCSV}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button size="sm" className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20" asChild>
            <Link href="/purchase/purchase-orders">New GRN</Link>
          </Button>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border/50 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Total Received</p>
              <p className="text-xl font-bold text-foreground">
                LKR {grns.reduce((acc, g) => acc + parseFloat(g.total_amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Active Suppliers</p>
              <p className="text-xl font-bold text-foreground">{new Set(grns.map(g => g.supplier_id)).size}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 shrink-0">
              <ReceiptText className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Total Transactions</p>
              <p className="text-xl font-bold text-foreground">{pagination.total}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters ── */}
      <Card className="border border-border/50 shadow-sm bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-end">
            {/* Search */}
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                  placeholder="GRN #, supplier..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-8 h-9 bg-background border-border/60"
                />
              </div>
            </div>

            {/* Supplier */}
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supplier</label>
              <Select value={filters.supplier_id} onValueChange={(v) => handleFilterChange("supplier_id", v)}>
                <SelectTrigger className="h-9 bg-background border-border/60">
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

            {/* Start Date */}
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From</label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange("start_date", e.target.value)}
                className="h-9 bg-background border-border/60"
              />
            </div>

            {/* End Date */}
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To</label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange("end_date", e.target.value)}
                className="h-9 bg-background border-border/60"
              />
            </div>

            {/* Reset */}
            <div className="shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-9 rounded-xl border-border/60"
                onClick={() => setFilters({ supplier_id: "all", start_date: "", end_date: "", search: "" })}
              >
                <X className="h-3.5 w-3.5" /> Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── GRN Table ── */}
      <Card className="border border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table className="[<Table>_th:first-child]:pl-5 [<Table>_td:first-child]:pl-5 [<Table>_th:last-child]:pr-5 [<Table>_td:last-child]:pr-5">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 w-[140px]">GRN #</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 w-[110px]">Date</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Supplier</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 w-[130px]">Branch</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 text-right w-[140px]">Amount (LKR)</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 w-[100px]">Status</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                      <span className="text-muted-foreground/70 text-sm">Loading reports...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : grns.length > 0 ? (
                grns.map((grn) => (
                  <TableRow key={grn.id} className="hover:bg-muted/20 border-b border-border/30 last:border-0">
                    <TableCell>
                      <span className="font-mono font-bold text-foreground text-sm">{grn.grn_number}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(grn.received_date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground text-sm">{grn.supplier?.name}</div>
                      <div className="text-xs text-muted-foreground/60">{grn.supplier?.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-muted/40 text-muted-foreground border border-border/40 font-medium">
                        {grn.branch?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-foreground text-sm">
                        {parseFloat(grn.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "capitalize text-xs font-semibold border",
                        grn.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10"
                      )}>
                        {grn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg hover:bg-emerald-500/10">
                        <Link href={`/purchase/grn/view/${grn.id}`}>
                          <Eye className="w-4 h-4 text-muted-foreground/50 group-hover:text-emerald-500" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-muted-foreground/60 text-sm">
                    No GRN records found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* ── Pagination ── */}
        <div className="p-4 bg-card border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: rows per page */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/60 shrink-0">Rows per page</span>
            <Select
              value={String(pagination.limit)}
              onValueChange={(v) => setPagination(prev => ({ ...prev, limit: Number(v), page: 1 }))}
            >
              <SelectTrigger className="h-8 w-[70px] text-xs rounded-lg border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Center: record count */}
          <span className="text-xs text-muted-foreground/60">
            {pagination.total === 0
              ? "No records"
              : `${((pagination.page - 1) * pagination.limit) + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} records`}
          </span>

          {/* Right: prev / page numbers / next */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-lg border-border/60 text-xs"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              ‹ Prev
            </Button>

            {/* Page number pills */}
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
              const start = Math.max(1, pagination.page - 2);
              const page = start + i;
              if (page > pagination.pages) return null;
              return (
                <Button
                  key={page}
                  variant={page === pagination.page ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 rounded-lg text-xs border-border/60",
                    page === pagination.page && "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                  )}
                  onClick={() => setPagination(prev => ({ ...prev, page }))}
                >
                  {page}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-lg border-border/60 text-xs"
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next ›
            </Button>
          </div>
        </div>

      </Card>
    </div>
  );
}

