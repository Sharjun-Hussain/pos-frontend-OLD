"use client";

import { useState } from "react";
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
  {
    id: "r1",
    name: "Daily Sales Summary",
    href: "/sales/daily",
    category: "Sales",
    description: "Overview of daily sales transactions and revenue.",
    isFavorite: true,
  },
  {
    id: "r2",
    name: "Sales by Product",
    href: "/sales/product",
    category: "Sales",
    description: "Detailed sales performance breakdown per product.",
    isFavorite: false,
  },
  {
    id: "r3",
    name: "Sales by Supplier",
    href: "/sales/supplier",
    category: "Sales",
    description: "Detailed sales performance breakdown per supplier.",
    isFavorite: false,
  },
  {
    id: "r11",
    name: "Employee Performance",
    href: "/employee-performance",
    category: "Sales",
    description: "Track sales performance, total revenue, and customer counts by employee.",
    isFavorite: true,
  },
  {
    id: "r4",
    name: "Current Stock Value",
    href: "/stocks/current-value",
    category: "Stocks",
    description: "Total valuation of current inventory assets.",
    isFavorite: true,
  },
  {
    id: "r5",
    name: "Profit & Loss Report",
    href: "/sales/profit-loss",
    category: "Sales",
    description: "Summary of revenues, costs, and net expenses.",
    isFavorite: false,
  },
  {
    id: "r6",
    name: "Customer Purchase History",
    href: "/customer/history",
    category: "Customer",
    description: "View detailed purchase logs for each customer.",
    isFavorite: false,
  },
  {
    id: "r7",
    name: "Low Stock Summary",
    href: "/stocks/low-stock",
    category: "Stocks",
    description: "List of items below re-order level threshold.",
    isFavorite: false,
  },
  {
    id: "r8",
    name: "Tax Liability Report",
    href: "/sales/tax",
    category: "Sales",
    description: "Calculated tax collected vs tax payable.",
    isFavorite: false,
  },
  {
    id: "r9",
    name: "Supplier Performance",
    href: "/purchase/supplier-performance",
    category: "Purchase",
    description: "Analysis of supplier delivery times and costs.",
    isFavorite: false,
  },
  {
    id: "r10",
    name: "Card Reconciliation",
    href: "/sales/card-reconsile",
    category: "Sales",
    description: "Settlement verification and discrepancy tracking for card payments.",
    isFavorite: false,
  },
  {
    id: "r12",
    name: "Sales Return History",
    href: "/sales/returns",
    category: "Sales",
    description: "Detailed log of all customer sales returns.",
    isFavorite: false,
  },
  {
    id: "r13",
    name: "Main Category Sales",
    href: "/sales/main-category",
    category: "Sales",
    description: "Sales performance grouped by main product categories.",
    isFavorite: false,
  },
  {
    id: "r14",
    name: "Sub Category Sales",
    href: "/sales/sub-category",
    category: "Sales",
    description: "Sales performance grouped by sub-categories.",
    isFavorite: false,
  },
  {
    id: "r15",
    name: "Capital Balance",
    href: "/finance/capital",
    category: "Finance",
    description: "Overall financial position (Assets vs Liabilities).",
    isFavorite: true,
  },
  {
    id: "r16",
    name: "Cheque Summary",
    href: "/finance/cheques",
    category: "Finance",
    description: "Overview of all receivable and payable cheques.",
    isFavorite: false,
  },
  {
    id: "r17",
    name: "Sold Item Count",
    href: "/sales/item-count",
    category: "Sales",
    description: "Total quantity of items sold across all products.",
    isFavorite: false,
  },
  {
    id: "r18",
    name: "Current Stock Summary",
    href: "/stocks/summary",
    category: "Stocks",
    description: "Comprehensive list of current stock counts and levels.",
    isFavorite: false,
  },
  {
    id: "r19",
    name: "Stock Transfers",
    href: "/stocks/transfer",
    category: "Stocks",
    description: "History of internal stock movements between branches.",
    isFavorite: false,
  },
  {
    id: "r20",
    name: "Supplier Profitability",
    href: "/sales/supplier-profit",
    category: "Sales",
    description: "Profit generation analysis per supplier.",
    isFavorite: false,
  },
  {
    id: "r21",
    name: "Non-Stock Sales",
    href: "/sales/non-stock",
    category: "Sales",
    description: "Summary of sales for items not tracked in inventory.",
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
  const [activeCategory, setActiveCategory] = useState("All"); // "All", "Favorites", or Category Name
  const [searchQuery, setSearchQuery] = useState("");
  const [reports, setReports] = useState(REPORTS_DATA);

  // --- HANDLERS ---

  const toggleFavorite = (id) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
  };

  // Filter Logic
  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "All"
        ? true
        : activeCategory === "Favorites"
        ? report.isFavorite
        : report.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

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
        {/* --- LEFT SIDEBAR: FILTERS (NON-HIDABLE) --- */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm">
          <ScrollArea className="flex-1">
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                Quick Access
              </h3>
              <p className="text-xs text-slate-500">Filter and navigate reports</p>
            </div>

            {/* Favorites Filter */}
            <button
              onClick={() => setActiveCategory("Favorites")}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors mb-6 ${
                activeCategory === "Favorites"
                  ? "bg-amber-50 text-amber-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Star
                className={`h-4 w-4 ${
                  activeCategory === "Favorites"
                    ? "fill-amber-500 text-amber-500"
                    : "text-slate-400"
                }`}
              />
              Favorites
            </button>

            {/* Categories Header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Categories
              </h3>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </div>

            {/* Categories List */}
            <div className="space-y-1">
              <button
                onClick={() => setActiveCategory("All")}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeCategory === "All"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                All Reports
              </button>

              {CATEGORIES.map((cat) => {
                const categoryCount = reports.filter(r => r.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeCategory === cat.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <cat.icon className="h-4 w-4" />
                      {cat.label}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        activeCategory === cat.id 
                          ? "bg-blue-100 text-blue-700" 
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {categoryCount}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
          </ScrollArea>
          
          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500 text-center">
              {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'} found
            </p>
          </div>
        </aside>

        {/* --- MAIN CONTENT: REPORT LIST --- */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
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

          {/* Reports List Container */}
          <ScrollArea className="flex-1 px-8 pb-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-4">Report Name</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-slate-100">
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group"
                    >
                      {/* Name */}
                      <div className="col-span-4 font-medium text-slate-900 flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            report.category === "Sales"
                              ? "bg-green-50 text-green-600"
                              : report.category === "Stocks"
                              ? "bg-blue-50 text-blue-600"
                              : report.category === "Payroll"
                              ? "bg-purple-50 text-purple-600"
                              : "bg-orange-50 text-orange-600"
                          }`}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </div>
                        {report.name}
                      </div>

                      {/* Category */}
                      <div className="col-span-2">
                        <Badge
                          variant="secondary"
                          className="font-normal text-slate-600 bg-slate-100 hover:bg-slate-200"
                        >
                          {report.category}
                        </Badge>
                      </div>

                      {/* Description */}
                      <div className="col-span-4 text-sm text-slate-500 truncate pr-4">
                        {report.description}
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <Link
                          href={`/reports${report.href || ""}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline mr-3 flex items-center"
                        >
                          Open
                        </Link>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-amber-500"
                          onClick={() => toggleFavorite(report.id)}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              report.isFavorite
                                ? "fill-amber-500 text-amber-500"
                                : ""
                            }`}
                          />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-slate-600"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                            <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                            <DropdownMenuItem>Schedule Report</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                      <Search className="h-6 w-6 text-slate-300" />
                    </div>
                    <h3 className="text-slate-900 font-medium">
                      No reports found
                    </h3>
                    <p className="text-slate-500 text-sm">
                      Try adjusting your search or filter.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
