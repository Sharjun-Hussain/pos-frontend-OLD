"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useGSAP } from "@gsap/react";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  ArrowRight,
  PieChart,
  BarChart3,
  RefreshCcw,
  Activity,
  Box,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import gsap from "gsap";

const InventoryInsightsDashboard = () => {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [loading, setLoading] = useState(true);
  const [stockSummary, setStockSummary] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, low, out, healthy
  const containerRef = useRef(null);

  const fetchData = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const [summaryRes, lowStockRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/summary`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/low-stock`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
      ]);

      const summaryData = await summaryRes.json();
      const lowStockData = await lowStockRes.json();

      if (summaryData.status === "success") setStockSummary(summaryData.data);
      if (lowStockData.status === "success") setLowStockItems(lowStockData.data);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      toast.error("Failed to load inventory insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken]);

  // Use the useGSAP hook for robust animation handling
  useGSAP(() => {
    if (!loading && stockSummary.length > 0) {
      gsap.from(".insight-card", {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power3.out",
        clearProps: "all", // CRITICAL: resets properties after animation
        onComplete: () => {
          // Extra safety to ensure visibility
          gsap.set(".insight-card", { opacity: 1, visibility: "visible" });
        }
      });
    }
  }, { dependencies: [loading, stockSummary.length], scope: containerRef });

  const filteredItems = stockSummary.filter((item) => {
    const matchesSearch = 
      item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product?.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.variant?.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const qty = parseFloat(item.quantity);
    const threshold = parseFloat(item.variant?.low_stock_threshold || 10);
    
    if (filterStatus === "out") return matchesSearch && qty <= 0;
    if (filterStatus === "low") return matchesSearch && qty > 0 && qty <= threshold;
    if (filterStatus === "healthy") return matchesSearch && qty > threshold;
    
    return matchesSearch;
  });

  const getStatusInfo = (qty, threshold) => {
    if (qty <= 0) return { label: "Out of Stock", color: "bg-red-500", text: "text-red-600", bg: "bg-red-50" };
    if (qty <= threshold) return { label: "Low Stock", color: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" };
    return { label: "Healthy", color: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" };
  };

  const totals = {
    totalItems: stockSummary.length,
    lowStock: stockSummary.filter(s => parseFloat(s.quantity) > 0 && parseFloat(s.quantity) <= parseFloat(s.variant?.low_stock_threshold || 10)).length,
    outOfStock: stockSummary.filter(s => parseFloat(s.quantity) <= 0).length,
    totalQty: stockSummary.reduce((acc, s) => acc + parseFloat(s.quantity), 0)
  };

  return (
    <div className="w-full space-y-8 pb-12" ref={containerRef}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <PieChart className="h-8 w-8 text-indigo-600" />
            Inventory Insights
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">Real-time "One Eye View" of your entire product status.</p>
        </div>
        <div className="flex items-center gap-3">
            <Button 
                variant="outline" 
                onClick={fetchData} 
                disabled={loading}
                className="gap-2 border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm"
            >
                <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                Sync Status
            </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InsightCard 
          title="Total Products" 
          value={totals.totalItems} 
          icon={Package} 
          color="indigo" 
          description="Tracked variants"
        />
        <InsightCard 
          title="Out of Stock" 
          value={totals.outOfStock} 
          icon={TrendingDown} 
          color="red" 
          description="Critical items"
          isAlert={totals.outOfStock > 0}
        />
        <InsightCard 
          title="Low Stock" 
          value={totals.lowStock} 
          icon={AlertTriangle} 
          color="amber" 
          description="Below threshold"
          isAlert={totals.lowStock > 0}
        />
         <InsightCard 
          title="Total On-Hand" 
          value={totals.totalQty.toFixed(0)} 
          icon={Box} 
          color="emerald" 
          description="Units in inventory"
        />
      </div>

      <div className="space-y-8">
        {/* Main Status Table - Full Width */}
        <Card className="border-none shadow-sm bg-white overflow-hidden insight-card">
          <CardHeader className="border-b border-slate-50 bg-white/50 py-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                Product Status Explorer
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search SKU or Name..." 
                    className="pl-9 h-9 w-64 border-slate-200 focus:ring-indigo-500 rounded-lg text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Status Filters */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
                <FilterButton active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} label="All Status" count={totals.totalItems} />
                <FilterButton active={filterStatus === 'healthy'} onClick={() => setFilterStatus('healthy')} label="Healthy" color="emerald" />
                <FilterButton active={filterStatus === 'low'} onClick={() => setFilterStatus('low')} label="Low Stock" color="amber" count={totals.lowStock} />
                <FilterButton active={filterStatus === 'out'} onClick={() => setFilterStatus('out')} label="Out of Stock" color="red" count={totals.outOfStock} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="font-bold text-slate-600 py-4 pl-6">Product Details</TableHead>
                    <TableHead className="font-bold text-slate-600">Branch</TableHead>
                    <TableHead className="font-bold text-slate-600 text-center">Status</TableHead>
                    <TableHead className="font-bold text-slate-600 text-right pr-6">On Hand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <StatusShimmer rows={5} />
                  ) : filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                      const status = getStatusInfo(parseFloat(item.quantity), parseFloat(item.variant?.low_stock_threshold || 10));
                      return (
                        <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2.5 rounded-xl", status.bg, status.text)}>
                                <Package className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm leading-tight">{item.product?.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">
                                        {item.variant?.sku || item.product?.code}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        {item.variant?.name || "Standard"}
                                    </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-600">
                            {item.branch?.name}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider border-none", status.color, "text-white shadow-sm")}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex flex-col items-end">
                              <span className={cn("text-base font-black", status.text)}>
                                {parseFloat(item.quantity).toFixed(0)}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Units</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center text-slate-400 font-medium italic bg-slate-50/30">
                        No products match your current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Actionable Alerts & Health Dashboard - Moved to Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 insight-card">
            <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-400">
                  <AlertTriangle className="h-5 w-5" />
                  Urgent Restock Action Center
                </CardTitle>
                <p className="text-xs text-slate-400 font-medium italic">High-priority items requiring immediate replenishment across all branches.</p>
              </CardHeader>
              <CardContent className="pt-4 px-6 pb-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {lowStockItems.length > 0 ? (
                     lowStockItems.slice(0, 6).map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="size-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                <div>
                                    <p className="text-sm font-bold text-white leading-tight truncate w-32 md:w-36">{item.product}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{item.branch} • <span className="text-red-400 font-bold">{item.quantity} Left</span></p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg h-8 w-8 transition-transform group-hover:translate-x-1">
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                     ))
                   ) : (
                     <div className="col-span-2 p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-200">Perfect Levels!</p>
                        <p className="text-[10px] text-slate-500 mt-1">No low stock alerts found.</p>
                     </div>
                   )}
                 </div>
                 {lowStockItems.length > 6 && (
                    <Button variant="link" className="w-full text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-widest gap-2 mt-4 h-auto">
                      View All {lowStockItems.length} Critical Alerts <ArrowRight className="h-3 w-3" />
                    </Button>
                 )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 insight-card h-full">
            <Card className="border-none shadow-sm bg-white overflow-hidden border-l-4 border-l-emerald-500 h-full flex flex-col justify-center">
              <CardContent className="p-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-2xl">
                       <PieChart className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 font-black text-lg">Inventory Health</h3>
                      <p className="text-sm text-slate-500 font-medium">
                          {( ( (stockSummary.length - totals.lowStock - totals.outOfStock) / Math.max(stockSummary.length, 1) ) * 100).toFixed(0)}% of items are healthy
                      </p>
                    </div>
                 </div>
                 <div className="mt-6 w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${( ( (stockSummary.length - totals.lowStock - totals.outOfStock) / Math.max(stockSummary.length, 1) ) * 100)}%` }}
                    />
                 </div>
                 <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-wider">
                    {totals.totalItems - totals.lowStock - totals.outOfStock} items above reorder levels
                 </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const InsightCard = ({ title, value, icon: Icon, color, description, isAlert }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100/50",
    red: "bg-red-50 text-red-600 border-red-100/50",
    amber: "bg-amber-50 text-amber-600 border-amber-100/50",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100/50"
  };

  return (
    <Card className={cn(
        "border-none shadow-sm bg-white overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 group insight-card",
        isAlert && "ring-2 ring-red-500/20"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 leading-none">{value}</h3>
            <p className="text-[11px] text-slate-500 font-bold mt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
               {description}
            </p>
          </div>
          <div className={cn("p-4 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-12", colors[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const FilterButton = ({ active, onClick, label, count, color = "indigo" }) => {
    const variants = {
        indigo: active ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
        emerald: active ? "bg-emerald-600 text-white shadow-emerald-200" : "bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50",
        amber: active ? "bg-amber-600 text-white shadow-amber-200" : "bg-white text-amber-600 border-amber-100 hover:bg-amber-50",
        red: active ? "bg-red-600 text-white shadow-red-200" : "bg-white text-red-600 border-red-100 hover:bg-red-50",
    };

    return (
        <button 
            onClick={onClick}
            className={cn(
                "h-8 px-4 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-300 border flex items-center gap-2 flex-shrink-0 shadow-sm whitespace-nowrap",
                variants[color]
            )}
        >
            {label}
            {count !== undefined && (
                <span className={cn(
                    "size-4.5 rounded-full flex items-center justify-center text-[9px]",
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}>
                    {count}
                </span>
            )}
        </button>
    );
};

const StatusShimmer = ({ rows }) => (
  <>
    {[...Array(rows)].map((_, i) => (
      <TableRow key={i} className="animate-pulse">
        <TableCell colSpan={4} className="py-6">
          <div className="flex items-center gap-4 px-4 w-full">
             <div className="h-10 w-10 bg-slate-100 rounded-xl" />
             <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-2 bg-slate-50 rounded w-1/4" />
             </div>
             <div className="h-4 bg-slate-100 rounded w-24 mx-auto" />
             <div className="h-6 bg-slate-100 rounded w-12 ml-auto" />
          </div>
        </TableCell>
      </TableRow>
    ))}
  </>
);

export default InventoryInsightsDashboard;
