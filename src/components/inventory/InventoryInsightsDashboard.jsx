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
    <div className="w-full space-y-10 p-4 md:px-8 max-w-[1600px] mx-auto pb-12" ref={containerRef}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-[#10b981]/10 dark:bg-[#10b981]/20 border border-[#10b981]/20 dark:border-[#10b981]/30 shadow-sm shadow-emerald-500/5">
            <PieChart className="w-5 h-5 text-[#10b981]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Inventory Insights
            </h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.08em] opacity-80">
              Real-time "One Eye View" • Stock Status Center
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={fetchData} 
            disabled={loading}
            className="gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm rounded-xl h-9 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
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
        <Card className="border border-slate-200/50 dark:border-slate-800/60 shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                Product Status Explorer
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search SKU or Name..." 
                    className="h-11 pl-11 w-72 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-xl font-semibold text-[13px] transition-all focus:ring-emerald-500/20 text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-medium"
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
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/80">
                  <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400 py-4 pl-6 text-xs uppercase tracking-wider">Product Details</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Branch</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400 text-center text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400 text-right pr-6 text-xs uppercase tracking-wider">On Hand</TableHead>
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
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{item.product?.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold border border-transparent dark:border-slate-700">
                                        {item.variant?.sku || item.product?.code}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        {item.variant?.name || "Standard"}
                                    </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            {item.branch?.name}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("rounded-lg px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border-none shadow-none", status.color, "text-white")}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex flex-col items-end">
                              <span className={cn("text-sm font-bold", status.text)}>
                                {parseFloat(item.quantity).toFixed(0)}
                              </span>
                              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-tight">Units</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center text-slate-400 dark:text-slate-500 font-medium italic bg-slate-50/30 dark:bg-slate-900/20">
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
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden h-full border border-slate-200/50 dark:border-slate-800/60 rounded-2xl">
              <CardHeader className="pb-2 border-b border-slate-50 dark:border-slate-800">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white tracking-tight">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Urgent Restock Action
                </CardTitle>
                <p className="text-xs text-slate-400 font-semibold italic opacity-80 uppercase tracking-wider">High-priority items requiring immediate replenishment.</p>
              </CardHeader>
              <CardContent className="pt-4 px-6 pb-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {lowStockItems.length > 0 ? (
                     lowStockItems.slice(0, 6).map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-100 dark:hover:border-indigo-500/30 hover:shadow-md hover:shadow-indigo-500/5 transition-all group cursor-default">
                            <div className="flex items-center gap-3.5">
                                <div className="size-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse" />
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate w-32 md:w-36 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{item.product}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold flex items-center gap-1.5 uppercase tracking-wide">
                                      {item.branch} 
                                      <span className="text-slate-200 dark:text-slate-700">•</span>
                                      <span className="text-red-500 font-bold">{item.quantity} Left</span>
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg h-8 w-8 transition-all group-hover:translate-x-0.5">
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                     ))
                   ) : (
                     <div className="col-span-2 p-10 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Perfect Levels!</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold uppercase tracking-widest">No low stock alerts found.</p>
                     </div>
                   )}
                 </div>
                 {lowStockItems.length > 6 && (
                    <Button variant="link" className="w-full text-indigo-600 hover:text-indigo-700 text-xs font-bold uppercase tracking-widest gap-2 mt-5 h-auto py-2 group">
                      View All {lowStockItems.length} Critical Alerts 
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Button>
                 )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 insight-card h-full">
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden border border-slate-200/50 dark:border-slate-800/60 h-full flex flex-col justify-center rounded-2xl relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl" />
              <CardContent className="p-7">
                 <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 shadow-sm shadow-emerald-500/5 transition-transform group-hover:scale-105 duration-500">
                       <Activity className="h-5.5 w-5.5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 dark:text-white font-bold text-lg tracking-tight">Inventory Health</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5 opacity-80">
                          {( ( (stockSummary.length - totals.lowStock - totals.outOfStock) / Math.max(stockSummary.length, 1) ) * 100).toFixed(0)}% Items Healthy
                      </p>
                    </div>
                 </div>
                 <div className="mt-7 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner border border-slate-200/30 dark:border-slate-700/30">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.4)]" 
                      style={{ width: `${( ( (stockSummary.length - totals.lowStock - totals.outOfStock) / Math.max(stockSummary.length, 1) ) * 100)}%` }}
                    />
                 </div>
                 <div className="flex items-center justify-between mt-5">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       {totals.totalItems - totals.lowStock - totals.outOfStock} Healthy
                    </p>
                    <p className="text-[10px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-widest">
                       Target 100%
                    </p>
                 </div>
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
    indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-500/20",
    red: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100/50 dark:border-red-500/20",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-500/20",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-500/20"
  };

  return (
    <Card className={cn(
        "border-none shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 group rounded-2xl border border-slate-200/50 dark:border-slate-800/60",
        isAlert && "ring-2 ring-red-500/10 dark:ring-red-500/20 border-red-200 dark:border-red-900/50"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-none tracking-tight">{value}</h3>
            <p className="text-[11px] font-semibold mt-2.5 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
               <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
               {description}
            </p>
          </div>
          <div className={cn("p-3.5 rounded-xl transition-all duration-500 group-hover:scale-110", colors[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const FilterButton = ({ active, onClick, label, count, color = "indigo" }) => {
    const variants = {
        indigo: active ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800",
        emerald: active ? "bg-emerald-600 text-white shadow-emerald-200" : "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
        amber: active ? "bg-amber-600 text-white shadow-amber-200" : "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20 hover:bg-amber-50 dark:hover:bg-amber-500/10",
        red: active ? "bg-red-600 text-white shadow-red-200" : "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10",
    };

    return (
        <button 
            onClick={onClick}
            className={cn(
                "h-8 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border flex items-center gap-2 shrink-0 shadow-sm whitespace-nowrap",
                variants[color]
            )}
        >
            {label}
            {count !== undefined && (
                <span className={cn(
                    "size-4.5 rounded-full flex items-center justify-center text-[9px] font-bold",
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
      <TableRow key={i} className="animate-pulse border-slate-50 dark:border-slate-800">
        <TableCell colSpan={4} className="py-6">
          <div className="flex items-center gap-4 px-4 w-full">
             <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
             <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-2 bg-slate-50 dark:bg-slate-900 rounded w-1/4" />
             </div>
             <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24 mx-auto" />
             <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-12 ml-auto" />
          </div>
        </TableCell>
      </TableRow>
    ))}
  </>
);

export default InventoryInsightsDashboard;
