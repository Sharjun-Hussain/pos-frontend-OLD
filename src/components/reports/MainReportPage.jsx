"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import {
  Search,
  Star,
  Filter,
  FileText,
  BarChart3,
  PieChart,
  MoreHorizontal,
  ChevronDown,
  ArrowUpRight,
  LayoutGrid,
  ShoppingBag,
  Users,
  Package,
  CreditCard,
  Briefcase,
} from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

// --- MOCK DATA ---
const REPORTS_DATA = [
  // Sales Category
  {
    id: "sales-daily",
    name: "Daily Sales Summary",
    href: "/reports/sales/daily",
    category: "Sales",
    description: "Overview of daily sales transactions and revenue.",
    isFavorite: true,
  },
  {
    id: "sales-product",
    name: "Sales by Product",
    href: "/reports/sales/product",
    category: "Sales",
    description: "Detailed sales performance breakdown per product.",
    isFavorite: false,
  },
  {
    id: "sales-supplier",
    name: "Sales by Supplier",
    href: "/reports/sales/supplier",
    category: "Sales",
    description: "Detailed sales performance breakdown per supplier.",
    isFavorite: false,
  },
  {
    id: "sales-returns",
    name: "Sales Return Report",
    href: "/reports/sales/returns",
    category: "Sales",
    description: "Detailed analysis and summary of customer sales returns.",
    isFavorite: true,
  },
  {
    id: "sales-employee",
    name: "Employee Performance",
    href: "/reports/employee-performance",
    category: "Sales",
    description: "Track sales performance, total revenue, and customer counts by employee.",
    isFavorite: true,
  },
  {
    id: "sales-profit-loss",
    name: "Profit & Loss",
    href: "/reports/sales/profit-loss",
    category: "Sales",
    description: "Summary of revenues, costs, and net expenses.",
    isFavorite: false,
  },
  {
    id: "sales-tax",
    name: "Tax Liability Report",
    href: "/reports/sales/tax",
    category: "Sales",
    description: "Calculated tax collected vs tax payable.",
    isFavorite: false,
  },
  {
    id: "sales-card-recon",
    name: "Card Reconciliation",
    href: "/reports/sales/card-reconsile",
    category: "Sales",
    description: "Settlement verification and discrepancy tracking for card payments.",
    isFavorite: false,
  },
  {
    id: "sales-main-cat",
    name: "Main Category Sales",
    href: "/reports/sales/main-category",
    category: "Sales",
    description: "Sales performance grouped by main product categories.",
    isFavorite: false,
  },
  {
    id: "sales-sub-cat",
    name: "Sub Category Sales",
    href: "/reports/sales/sub-category",
    category: "Sales",
    description: "Sales performance grouped by sub-categories.",
    isFavorite: false,
  },
  {
    id: "sales-item-count",
    name: "Sold Item Count",
    href: "/reports/sales/item-count",
    category: "Sales",
    description: "Total quantity of items sold across all products.",
    isFavorite: false,
  },
  {
    id: "sales-supplier-prof",
    name: "Supplier Profitability",
    href: "/reports/sales/supplier-profit",
    category: "Sales",
    description: "Profit generation analysis per supplier.",
    isFavorite: false,
  },
  {
    id: "sales-non-stock",
    name: "Non-Stock Sales",
    href: "/reports/sales/non-stock",
    category: "Sales",
    description: "Summary of sales for items not tracked in inventory.",
    isFavorite: false,
  },

  // Stocks Category
  {
    id: "stocks-value",
    name: "Current Stock Value",
    href: "/reports/stocks/current-value",
    category: "Stocks",
    description: "Total valuation of current inventory assets.",
    isFavorite: true,
  },
  {
    id: "stocks-low",
    name: "Low Stock Summary",
    href: "/reports/stocks/low-stock",
    category: "Stocks",
    description: "List of items below re-order level threshold.",
    isFavorite: false,
  },
  {
    id: "stocks-summary",
    name: "Current Stock Summary",
    href: "/reports/stocks/summary",
    category: "Stocks",
    description: "Comprehensive list of current stock counts and levels.",
    isFavorite: false,
  },
  {
    id: "stocks-transfer",
    name: "Stock Transfers",
    href: "/reports/stocks/transfer",
    category: "Stocks",
    description: "History of internal stock movements between branches.",
    isFavorite: false,
  },

  // Finance Category
  {
    id: "finance-capital",
    name: "Capital Balance",
    href: "/reports/finance/capital",
    category: "Finance",
    description: "Overall financial position (Assets vs Liabilities).",
    isFavorite: true,
  },
  {
    id: "finance-cheques",
    name: "Cheque Summary",
    href: "/reports/finance/cheques",
    category: "Finance",
    description: "Overview of all receivable and payable cheques.",
    isFavorite: false,
  },

  // Customer Category
  {
    id: "customer-history",
    name: "Customer Purchase History",
    href: "/reports/customer/history",
    category: "Customer",
    description: "View detailed purchase logs for each customer.",
    isFavorite: false,
  },

  // Purchase Category
  {
    id: "purchase-supplier-perf",
    name: "Supplier Performance",
    href: "/reports/purchase/supplier-performance",
    category: "Purchase",
    description: "Analysis of supplier delivery times and costs.",
    isFavorite: false,
  },
];

const CATEGORIES = [
  { id: "Stocks", label: "Stocks", icon: Package },
  { id: "Sales", label: "Sales", icon: BarChart3 },
  { id: "Finance", label: "Finance", icon: CreditCard },
  { id: "Customer", label: "Customer", icon: Users },
  { id: "Purchase", label: "Purchase", icon: ShoppingBag },
];

export default function ReportsHubPage({ isNested = false }) {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10b981]" />
      </div>
    }>
      <ReportsContent isNested={isNested} />
    </Suspense>
  );
}

function ReportsContent({ isNested }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [reports, setReports] = useState(REPORTS_DATA);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && (CATEGORIES.some(c => c.id === tab) || tab === "Favorites" || tab === "All")) {
      setActiveCategory(tab);
    }
  }, [searchParams]);

  const handleCategoryChange = (catId) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", catId);
    router.push(`${pathname}?${params.toString()}`);
    setActiveCategory(catId);
  };

  // --- HANDLERS ---

  const toggleFavorite = (id) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
  };

  // Filter Logic
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch = report.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) || 
        report.description.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesCategory =
        activeCategory === "All"
          ? true
          : activeCategory === "Favorites"
          ? report.isFavorite
          : report.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [reports, searchQuery, activeCategory]);

  // Grouping Logic for "All" view
  const groupedReports = useMemo(() => {
    const groups = {};
    filteredReports.forEach(report => {
      if (!groups[report.category]) groups[report.category] = [];
      groups[report.category].push(report);
    });
    return groups;
  }, [filteredReports]);

  // Sidebar counts - should be ORIGINAL count as per user request
  const categoryCounts = useMemo(() => {
    const counts = {};
    REPORTS_DATA.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-background font-sans text-slate-900 dark:text-white overflow-hidden">
      {/* Page Header */}
      {!isNested && (
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-5 shrink-0">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-[#10b981]/10 dark:bg-[#10b981]/20 border border-[#10b981]/20 dark:border-[#10b981]/30 shadow-sm shadow-emerald-500/5">
                <BarChart3 className="w-5 h-5 text-[#10b981]" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Reports Hub
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.08em] opacity-80">
                  Business Intelligence • Data Analysis & Exports
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-slate-500 dark:text-slate-400 rounded-xl h-9 font-semibold gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900">
                <FileText className="h-4 w-4" />
                Documentation
              </Button>
            </div>
          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 gap-6">
        {/* --- LEFT SIDEBAR --- */}
        <aside className="w-64 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 flex flex-col shrink-0 rounded-2xl overflow-hidden shadow-sm">
          <ScrollArea className="flex-1">
          <div className="p-5">
            <div className="mb-6">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">View Filters</p>
              
              <div className="space-y-1">
                <button
                  onClick={() => handleCategoryChange("All")}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 group",
                    activeCategory === "All"
                      ? "bg-[#10b981] text-white shadow-md shadow-emerald-500/10"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm"
                  )}
                >
                  <LayoutGrid className={cn("h-4 w-4 transition-colors", activeCategory === "All" ? "text-white" : "text-slate-400 group-hover:text-[#10b981]")} />
                  All Reports
                </button>

                <button
                  onClick={() => handleCategoryChange("Favorites")}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 group",
                    activeCategory === "Favorites"
                      ? "bg-[#10b981] text-white shadow-md shadow-emerald-500/10"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm"
                  )}
                >
                  <Star
                    className={cn(
                      "h-4 w-4 transition-colors",
                      activeCategory === "Favorites" ? "fill-white text-white" : "text-slate-400 group-hover:text-amber-500"
                    )}
                  />
                  My Favorites
                </button>
              </div>
            </div>

            <Separator className="my-6 bg-slate-100 dark:bg-slate-800" />

            <div className="mb-4">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">Library Categories</p>

              <div className="space-y-1">
                {CATEGORIES.map((cat) => {
                  const originalCount = categoryCounts[cat.id] || 0;
                  const isActive = activeCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={cn(
                        "flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 group",
                        isActive
                          ? "bg-[#10b981] text-white shadow-md shadow-emerald-500/10"
                          : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <cat.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-[#10b981]")} />
                        {cat.label}
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold",
                          isActive 
                            ? "bg-white/20 text-white border-none" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none group-hover:bg-[#10b981]/10 group-hover:text-[#10b981]"
                        )}
                      >
                        {originalCount}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-bold uppercase tracking-wider">
              {filteredReports.length} {filteredReports.length === 1 ? 'Report' : 'Reports'} available
            </p>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-slate-50/50 dark:bg-slate-900/10">
          {/* Toolbar */}
          <div className="px-8 py-5 flex justify-between items-center gap-4 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/50 dark:border-slate-800/50 mb-6 shadow-sm">
            <div className="relative flex-1 max-w-lg group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#10b981] transition-colors" />
              <Input
                placeholder="Search report library..."
                className="h-11 pl-11 bg-white/80 dark:bg-slate-900/80 border-slate-200/60 dark:border-slate-800/60 focus:bg-white dark:focus:bg-slate-900 shadow-sm rounded-xl font-semibold text-[13px] transition-all focus:ring-[#10b981]/20 placeholder:text-slate-400 placeholder:font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Select defaultValue="most-used">
                <SelectTrigger className="w-[140px] h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                  <Filter className="h-3.5 w-3.5 mr-2 text-slate-500 dark:text-slate-400" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="most-used">Most Used</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-8 pb-20 space-y-10">
              {activeCategory === "All" ? (
                // Grouped All View
                CATEGORIES.map((cat) => {
                  const items = groupedReports[cat.id] || [];
                  if (items.length === 0 && searchQuery) return null;
                  if (items.length === 0 && !searchQuery) return null; // Don't show empty categories
                  
                  return (
                    <section key={cat.id} className="space-y-6">
                      <div className="flex items-center gap-3 px-1">
                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-[#10b981]">
                          <cat.icon className="h-3.5 w-3.5" />
                        </div>
                        <h2 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                          {cat.label} Reports
                          <span className="ml-2 text-[10px] text-slate-400 font-bold opacity-60">({items.length})</span>
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {items.map((report) => (
                          <ReportCard key={report.id} report={report} toggleFavorite={toggleFavorite} />
                        ))}
                      </div>
                    </section>
                  );
                })
              ) : activeCategory === "Favorites" ? (
                 <section className="space-y-6">
                    <div className="flex items-center gap-3 px-1">
                      <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </div>
                      <h2 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Starred Reports</h2>
                    </div>
                    {filteredReports.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredReports.map((report) => (
                          <ReportCard key={report.id} report={report} toggleFavorite={toggleFavorite} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="You haven't added any favorites yet." />
                    )}
                 </section>
              ) : (
                // Single Category View
                <section className="space-y-6">
                  <div className="flex items-center gap-3 px-1">
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-[#10b981]">
                      {(() => {
                        const Icon = CATEGORIES.find(c => c.id === activeCategory)?.icon || LayoutGrid;
                        return <Icon className="h-4 w-4" />;
                      })()}
                    </div>
                    <h2 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                      {activeCategory} Reports
                    </h2>
                  </div>
                  {filteredReports.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredReports.map((report) => (
                        <ReportCard key={report.id} report={report} toggleFavorite={toggleFavorite} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState />
                  )}
                </section>
              )}
              
              {filteredReports.length === 0 && searchQuery && <EmptyState />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function ReportCard({ report, toggleFavorite }) {
  const getCategoryIcon = (category) => {
    const cat = CATEGORIES.find(c => c.id === category);
    if (!cat) return <FileText className="h-5 w-5" />;
    const Icon = cat.icon;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <Card className="group relative bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 hover:-translate-y-1 h-full flex flex-col">
      <CardContent className="p-7 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 flex items-center justify-center rounded-xl border border-slate-100 dark:border-slate-700/50 group-hover:bg-[#10b981]/10 group-hover:border-[#10b981]/20 group-hover:text-[#10b981] transition-all duration-500 shadow-sm">
            {getCategoryIcon(report.category)}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(report.id);
            }}
            className={cn(
              "h-9 w-9 rounded-xl transition-all duration-300",
              report.isFavorite 
                ? "text-amber-500 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 shadow-sm" 
                : "text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
            )}
          >
            <Star className={cn("h-4.5 w-4.5", report.isFavorite && "fill-current")} />
          </Button>
        </div>
        
        <div className="flex-1">
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-2.5 group-hover:text-[#10b981] transition-colors leading-tight tracking-tight">
            {report.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium opacity-80">
            {report.description}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between group/footer">
          <Link 
            href={report.href} 
            className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-[#10b981] dark:hover:text-[#10b981] transition-colors flex items-center gap-2 group-hover/footer:translate-x-1"
          >
            Generate Report
            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover/footer:opacity-100 transition-all" />
          </Link>
          <div className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-[#10b981] group-hover:text-white dark:group-hover:bg-[#10b981] dark:group-hover:text-white transition-all duration-500 shadow-sm">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm rounded-3xl border border-white/50 dark:border-slate-800/50 border-dashed">
      <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
        <Search className="h-7 w-7 text-slate-300 dark:text-slate-600" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">No Reports Found</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] mt-2 font-medium opacity-80 leading-relaxed">
        {message || "Try adjusting your search or category filters to find the data you need."}
      </p>
    </div>
  );
}
