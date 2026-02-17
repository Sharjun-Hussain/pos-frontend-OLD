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

export default function ReportsHubPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}

function ReportsContent() {
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
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
      {/* Page Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports Hub</h1>
            <p className="text-slate-500 text-sm mt-1">
              View, analyze, and export your business data.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="text-slate-500">
              <FileText className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* --- LEFT SIDEBAR --- */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <ScrollArea className="flex-1">
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                View Mode
              </h3>
              
              <div className="space-y-1">
                <button
                  onClick={() => handleCategoryChange("All")}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeCategory === "All"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  All Reports
                </button>

                <button
                  onClick={() => handleCategoryChange("Favorites")}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeCategory === "Favorites"
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Star
                    className={`h-4 w-4 ${
                      activeCategory === "Favorites" ? "fill-white" : ""
                    }`}
                  />
                  My Favorites
                </button>
              </div>
            </div>

            <Separator className="my-6 bg-slate-100" />

            <div className="mb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                Categories
              </h3>

              <div className="space-y-1">
                {CATEGORIES.map((cat) => {
                  const originalCount = categoryCounts[cat.id] || 0;
                  const isActive = activeCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        isActive
                          ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <cat.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                        {cat.label}
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                          isActive 
                            ? "bg-white/20 text-white" 
                            : "bg-linear-to-br transition-all duration-300"
                        }`}
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
          
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500 text-center font-medium">
              {filteredReports.length} {filteredReports.length === 1 ? 'result' : 'results'} matching
            </p>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-slate-50/50">
          {/* Toolbar */}
          <div className="px-8 py-6 flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search reports..."
                className="pl-10 bg-white border-slate-200 h-10 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Select defaultValue="most-used">
                <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200 shadow-sm">
                  <Filter className="h-3.5 w-3.5 mr-2 text-slate-500" />
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
                    <section key={cat.id} className="space-y-4">
                      <div className="flex items-center gap-2 px-1">
                        <cat.icon className="h-4 w-4 text-blue-600" />
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                          {cat.label} Reports
                          <span className="ml-2 text-[10px] text-slate-400 font-bold">({items.length})</span>
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {items.map((report) => (
                          <ReportCard key={report.id} report={report} toggleFavorite={toggleFavorite} />
                        ))}
                      </div>
                    </section>
                  );
                })
              ) : activeCategory === "Favorites" ? (
                 <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Starred Reports</h2>
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
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    {(() => {
                      const Icon = CATEGORIES.find(c => c.id === activeCategory)?.icon || LayoutGrid;
                      return <Icon className="h-4 w-4 text-blue-600" />;
                    })()}
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                      {activeCategory} Reports
                    </h2>
                  </div>
                  {filteredReports.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
  // Determine styles based on category
  const getStyle = (category) => {
    switch (category) {
      case 'Sales':
        return {
          gradient: "from-blue-500 to-indigo-400",
          shadow: "shadow-blue-100",
          text: "text-blue-600",
          bgInfo: "bg-blue-50"
        };
      case 'Stocks':
        return {
            gradient: "from-emerald-500 to-teal-400",
            shadow: "shadow-emerald-100",
            text: "text-emerald-600",
            bgInfo: "bg-emerald-50"
        };
      case 'Finance':
        return {
            gradient: "from-violet-500 to-purple-400",
            shadow: "shadow-violet-100",
            text: "text-violet-600",
            bgInfo: "bg-violet-50"
        };
      case 'Customer':
         return {
            gradient: "from-pink-500 to-rose-400",
            shadow: "shadow-pink-100",
            text: "text-pink-600",
            bgInfo: "bg-pink-50"
         };
      case 'Purchase':
          return {
            gradient: "from-orange-500 to-amber-400",
            shadow: "shadow-orange-100",
            text: "text-orange-600",
            bgInfo: "bg-orange-50"
          };
      default:
        return {
            gradient: "from-slate-500 to-slate-400",
            shadow: "shadow-slate-100",
            text: "text-slate-600",
            bgInfo: "bg-slate-50"
        };
    }
  };

  const style = getStyle(report.category);

  return (
    <Card className="group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden">
        {/* Subtle Background Decoration */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${style.gradient} opacity-[0.03] rounded-bl-full group-hover:scale-150 transition-transform duration-500`} />

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${style.gradient} text-white shadow-lg ${style.shadow}`}>
            {report.category === 'Sales' ? <BarChart3 className="h-5 w-5" /> :
             report.category === 'Stocks' ? <Package className="h-5 w-5" /> :
             report.category === 'Finance' ? <CreditCard className="h-5 w-5" /> :
             report.category === 'Customer' ? <Users className="h-5 w-5" /> :
             report.category === 'Purchase' ? <ShoppingBag className="h-5 w-5" /> :
             <FileText className="h-5 w-5" />}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-slate-300 hover:text-amber-500 hover:bg-amber-50"
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(report.id);
            }}
          >
            <Star className={`h-5 w-5 ${report.isFavorite ? "fill-amber-500 text-amber-500" : ""}`} />
          </Button>
        </div>

        <div className="relative z-10 space-y-2 mb-4">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
            {report.name}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
            {report.description}
          </p>
        </div>

        <div className="relative z-10 pt-4 border-t border-slate-50 flex items-center justify-between">
          <Badge variant="secondary" className={`${style.bgInfo} ${style.text} text-[10px] font-bold uppercase tracking-wider px-2`}>
            {report.category}
          </Badge>
          
          <Link
            href={report.href}
            className={`flex items-center gap-1.5 text-xs font-black ${style.text} uppercase tracking-widest hover:gap-3 transition-all`}
          >
            Open Report <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
    </Card>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Search className="h-6 w-6 text-slate-300" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">No Reports Found</h3>
      <p className="text-xs text-slate-500 max-w-[200px] mt-1">
        {message || "Try adjusting your search or filters to find what you're looking for."}
      </p>
    </div>
  );
}
