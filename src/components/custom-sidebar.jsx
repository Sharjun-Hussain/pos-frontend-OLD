"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Home,
  ShoppingCart,
  Boxes,
  Truck,
  UserCog,
  History,
  Wallet,
  BarChart3,
  LayoutDashboard,
  Sparkles,
  PieChart,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Settings,
  Undo2,
  Frame,
  Origami,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { signOut } from "next-auth/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CustomSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { hasPermission, hasAnyPermission } = usePermission();
  const { business } = useAppSettings();
  
  const [activeCategory, setActiveCategory] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  const sidebarRef = useRef(null);

  const user = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "user@example.com",
    avatar: session?.user?.image,
  };

  const sidebarData = {
    primary: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
        requiredPermission: null,
      },
      {
        title: "Inventory",
        url: "/products",
        icon: Boxes,
        requiredPermission: PERMISSIONS.PRODUCT_VIEW,
        items: [
          { title: "Products", url: "/products", requiredPermission: PERMISSIONS.PRODUCT_VIEW },
          { title: "Product Variants", url: "/variants", requiredPermission: PERMISSIONS.PRODUCT_VIEW },
          { title: "Barcodes", url: "/barcode", requiredPermission: PERMISSIONS.PRODUCT_VIEW },
          { title: "Main Categories", url: "/main-category", requiredPermission: PERMISSIONS.CATEGORY_VIEW },
          { title: "Sub Categories", url: "/sub-category", requiredPermission: PERMISSIONS.CATEGORY_VIEW },
          { title: "Brands", url: "/brand", requiredPermission: PERMISSIONS.BRAND_VIEW },
          { title: "Stock Management", url: "/inventory/stock", requiredPermission: PERMISSIONS.STOCK_VIEW },
          { title: "Stock Transfers", url: "/inventory/transfers", requiredPermission: PERMISSIONS.STOCK_VIEW },
          { title: "Units & Measures", url: "/unit-measurement", requiredPermission: PERMISSIONS.UNIT_VIEW },
          { title: "Inventory Containers", url: "/containers", requiredPermission: PERMISSIONS.UNIT_VIEW },
        ],
      },
      {
        title: "Sales",
        url: "/sales",
        icon: ShoppingCart,
        requiredPermission: PERMISSIONS.SALE_VIEW,
        items: [
          { title: "Point of Sale", url: "/pos", requiredPermission: PERMISSIONS.POS_ACCESS },
          { title: "Sales History", url: "/sales", requiredPermission: PERMISSIONS.SALE_VIEW },
          { title: "Sales Return History", url: "/sales/returns", requiredPermission: PERMISSIONS.SALE_VIEW },
          { title: "Sales Return Report", url: "/reports/sales/returns", requiredPermission: PERMISSIONS.REPORT_VIEW },
          { title: "Customers", url: "/customers", requiredPermission: PERMISSIONS.CUSTOMER_VIEW },
        ],
      },
      {
        title: "Purchases",
        url: "/purchase/suppliers",
        icon: Truck,
        requiredPermission: PERMISSIONS.SUPPLIER_VIEW,
        items: [
          { title: "Suppliers", url: "/purchase/suppliers", requiredPermission: PERMISSIONS.SUPPLIER_VIEW },
          { title: "Purchase Orders", url: "/purchase/purchase-orders", requiredPermission: PERMISSIONS.PURCHASE_VIEW },
          { title: "Goods Received (GRN)", url: "/purchase/grn", requiredPermission: PERMISSIONS.PURCHASE_VIEW },
          { title: "Purchase Returns", url: "/purchase/returns", requiredPermission: PERMISSIONS.PURCHASE_VIEW },
        ],
      },
      {
        title: "Finance",
        url: "/expenses",
        icon: Wallet,
        requiredPermission: PERMISSIONS.EXPENSE_VIEW,
        items: [
          { title: "Expenses", url: "/expenses", requiredPermission: PERMISSIONS.EXPENSE_VIEW },
          { title: "Expense Categories", url: "/expense-categories", requiredPermission: PERMISSIONS.EXPENSE_VIEW },
          { title: "Chart of Accounts", url: "/accounting", requiredPermission: PERMISSIONS.FINANCE_VIEW },
          { title: "Manual Journal", url: "/accounting/journal", requiredPermission: PERMISSIONS.FINANCE_MANAGE },
          { title: "Customer Ledgers", url: "/accounting/customer-ledgers", requiredPermission: PERMISSIONS.FINANCE_VIEW },
          { title: "Supplier Ledgers", url: "/accounting/supplier-ledgers", requiredPermission: PERMISSIONS.FINANCE_VIEW },
          { title: "Cheque Management", url: "/cheques", requiredPermission: PERMISSIONS.FINANCE_VIEW },
          { title: "Financial Reports", url: "/accounting/reports", requiredPermission: PERMISSIONS.REPORT_VIEW },
        ],
      },
      {
        title: "Reports",
        url: "/reports",
        icon: BarChart3,
        requiredPermission: PERMISSIONS.REPORT_VIEW,
        items: [
          // { title: "Overview", url: "/reports", requiredPermission: PERMISSIONS.REPORT_VIEW },
          { title: "Inventory Insights", url: "/inventory-insights", requiredPermission: PERMISSIONS.PRODUCT_VIEW },
          { title: "Intelligent Insights", url: "/reports", requiredPermission: PERMISSIONS.REPORT_VIEW },
        ]
      },
      {
        title: "System",
        url: "/settings",
        icon: Settings,
        requiredPermission: PERMISSIONS.SETTINGS_MANAGE,
        items: [
          { title: "Global Settings", url: "/settings", requiredPermission: PERMISSIONS.SETTINGS_MANAGE },
          { title: "Business Profiles", url: "/organizations", requiredPermission: PERMISSIONS.ORG_VIEW },
          { title: "Branch Hierarchy", url: "/branches", requiredPermission: PERMISSIONS.BRANCH_VIEW },
          { title: "Application Users", url: "/users", requiredPermission: [PERMISSIONS.USER_VIEW, PERMISSIONS.ROLE_VIEW] },
          { title: "Employees", url: "/employees", requiredPermission: PERMISSIONS.USER_VIEW },
          { title: "Audit Logs", url: "/audit-logs", requiredPermission: PERMISSIONS.AUDIT_LOG_VIEW },
        ]
      }
    ]
  };

  const filterItems = (items) => {
    return items
      .map((item) => {
        if (item.items) {
          const filteredSubItems = item.items.filter((subItem) => {
            if (!subItem.requiredPermission) return true;
            if (Array.isArray(subItem.requiredPermission)) {
              return hasAnyPermission(subItem.requiredPermission);
            }
            return hasPermission(subItem.requiredPermission);
          });
          if (filteredSubItems.length === 0) return { ...item, items: null };
          return { ...item, items: filteredSubItems };
        }

        if (!item.requiredPermission) return item;
        if (Array.isArray(item.requiredPermission)) {
          return hasAnyPermission(item.requiredPermission) ? item : null;
        }
        return hasPermission(item.requiredPermission) ? item : null;
      })
      .filter(Boolean);
  };

  const filteredPrimary = filterItems(sidebarData.primary);

  const handleCategoryClick = (category) => {
    if (category.items) {
      if (activeCategory?.title === category.title) {
        setIsPanelOpen(!isPanelOpen);
      } else {
        setActiveCategory(category);
        setIsPanelOpen(true);
      }
    } else {
      setIsPanelOpen(false);
      setActiveCategory(category);
    }
  };

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={sidebarRef} className="flex h-screen sticky top-0 z-50 gap-0 transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] group/sidebar overflow-visible">
      {/* Sidebar Rail */}
      <aside className="w-30 flex flex-col items-center py-6 bg-(--sidebar-bg-custom) border-r border-sidebar-border/40 z-50 relative pointer-events-auto shrink-0 transition-colors duration-500">
        {/* Logo */}
        <div className="mb-8 flex shrink-0">
          <div className="size-12 rounded-2xl bg-[#10b981]/10 flex items-center justify-center">
            <Sparkles className="size-7 text-[#10b981]" />
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 w-full  flex flex-col gap-1 overflow-y-auto thin-scrollbar items-center">
          {filteredPrimary.map((item) => {
            // Find the best (longest) matching sub-item first.
            // This prevents a short URL like `/sales` from being considered active when on `/sales/returns`.
            const matchingSubItems = item.items
              ?.filter(sub => pathname === sub.url || pathname.startsWith(`${sub.url}/`))
              ?.sort((a, b) => b.url.length - a.url.length);
            const bestMatch = matchingSubItems?.[0];
            // Parent is active only if:
            //  1. pathname exactly equals the parent's own url, OR
            //  2. the best (longest) matching sub-item URL is an exact match with pathname,
            //     OR pathname starts with that best sub-item URL + '/'
            //     (avoids `/sales` matching `/sales/returns` via startsWith bleed)
            const isActive = pathname === item.url ||
              (bestMatch != null && (
                pathname === bestMatch.url || pathname.startsWith(`${bestMatch.url}/`)
              ));
            const isSelected = activeCategory?.title === item.title;

            return (
              <button
                key={item.title}
                onClick={() => handleCategoryClick(item)}
                className={cn(
                  "w-20 group relative flex flex-col items-center justify-center py-3 px-1 transition-all duration-300 rounded-2xl mb-1 outline-none",
                  isActive || isSelected ? "bg-sidebar-accent/50 text-[#10b981]" : "text-zinc-500 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("size-6 mb-1.5 transition-transform group-hover:scale-110", isActive || isSelected ? "text-[#10b981]" : "text-zinc-400 group-hover:text-sidebar-foreground")} />
                <span className={cn("text-[10px] uppercase font-black tracking-widest text-center leading-none px-1", isActive || isSelected ? "text-[#10b981]" : "text-zinc-500 group-hover:text-zinc-400 transition-colors")}>
                  {item.title}
                </span>
                
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="mt-auto pt-4 shrink-0 px-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-12 w-12 rounded-full overflow-hidden border-2 border-transparent hover:border-[#10b981]/50 transition-all outline-none">
                <div className="relative size-full">
                  <div className="size-full bg-zinc-800 flex items-center justify-center text-white font-bold text-sm">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="size-full object-cover" />
                    ) : (
                      user.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 size-3 rounded-full bg-[#10b981] border-2 border-(--sidebar-bg-custom)" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" sideOffset={20} className="w-56 rounded-2xl p-2 bg-sidebar border border-sidebar-border shadow-2xl">
              <div className="px-2 py-3 border-b border-zinc-100 mb-2">
                <p className="font-bold text-sm text-zinc-900 truncate">{user.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
              <DropdownMenuItem
                onClick={() => signOut()}
                className="text-red-600 focus:bg-red-50 focus:text-red-700 font-medium cursor-pointer rounded-xl p-3"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Sidebar Panel */}
      <div 
        className={cn(
          "h-full bg-(--sidebar-bg-custom)/90 backdrop-blur-xl shadow-[15px_0_30px_rgb(0,0,0,0.05)] transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] z-40 overflow-hidden border-l border-sidebar-border/40 shrink-0",
          isPanelOpen ? "w-64 opacity-100 pl-0" : "w-0 opacity-0 pl-0"
        )}
      >
        <div className="flex flex-col h-full py-8 px-5 w-64">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sidebar-foreground font-black text-lg uppercase tracking-wider">{activeCategory?.title}</h2>
            <button 
              onClick={() => setIsPanelOpen(false)}
              className="p-1.5 rounded-xl hover:bg-sidebar-accent text-zinc-500 hover:text-sidebar-foreground transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto thin-scrollbar pr-1">
            <div className="space-y-1.5">
              {activeCategory?.items?.map((sub) => {
                // Find the longest URL among siblings that matches the current path.
                // This prevents shorter URLs (e.g. `/sales`) from matching longer paths (e.g. `/sales/returns`).
                const longestMatchUrl = activeCategory.items
                  ?.filter(s => pathname === s.url || pathname.startsWith(`${s.url}/`))
                  ?.sort((a, b) => b.url.length - a.url.length)[0]?.url;
                const isActive = longestMatchUrl === sub.url && (pathname === sub.url || pathname.startsWith(`${sub.url}/`));
                
                return (
                  <Link
                    key={sub.title}
                    href={sub.url}
                    onClick={() => {
                        if (window.innerWidth < 1024) setIsPanelOpen(false);
                    }}
                    className={cn(
                      "flex items-center h-12 px-5 rounded-2xl transition-all duration-300 group",
                      isActive 
                        ? "bg-[#10b981] text-white font-bold shadow-[0_4px_20px_rgba(16,185,129,0.3)]" 
                        : "text-zinc-500 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <span className="text-[14px]">{sub.title}</span>
                    <ChevronRight className={cn("size-4 ml-auto transition-transform", isActive ? "translate-x-1" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1")} />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Business Name Branding */}
          <div className="mt-auto pt-6 border-t border-sidebar-border/50 flex items-center gap-3">
             <div className="size-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center shrink-0">
                <Sparkles className="size-5 text-[#10b981]" />
             </div>
             <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-black text-sidebar-foreground uppercase tracking-widest truncate">{business?.name || "EMI POS"}</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">v2.0 PRO</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

