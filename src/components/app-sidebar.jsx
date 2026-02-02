"use client";

import * as React from "react";
import {
  Frame,
  Origami,
  Settings,
  ShoppingCart,
  Boxes,
  Truck,
  UserCog,
  History,
  Wallet,
  BarChart3,
  LayoutDashboard,
  Undo2,
  Sparkles,
  PieChart,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function AppSidebar({ ...props }) {
  const { data: session } = useSession();
  const { hasPermission, hasAnyPermission } = usePermission();
  const { business, isLoading } = useAppSettings();

  const logoUrl = business.logo ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${business.logo}` : null;

  const data = {
    user: {
      name: session?.user?.name,
      email: session?.user?.email,
      avatar: session?.user?.image,
    },
    navMain: [
      {
        title: "Sales & CRM",
        url: "#",
        icon: ShoppingCart,
        items: [
          {
            title: "Point of Sale",
            url: "/pos",
            requiredPermission: "POS Access",
          },
          {
            title: "Sales History",
            url: "/sales",
            icon: History,
            requiredPermission: "POS Access",
          },
          {
            title: "Sales Return History",
            url: "/reports/sales/returns",
            icon: Undo2,
            requiredPermission: "Report View",
          },
          {
            title: "Customers",
            url: "/customers",
            requiredPermission: "Customer View",
          },
        ],
      },
      {
        title: "Inventory",
        url: "#",
        icon: Boxes,
        items: [
          {
            title: "Products",
            url: "/products",
            requiredPermission: PERMISSIONS.PRODUCT_VIEW,
          },
          {
            title: "Product Variants",
            url: "/variants",
            requiredPermission: "Product View",
          },
          {
            title: "Barcodes",
            url: "/barcode",
            requiredPermission: "Product View",
          },
          {
            title: "Main Categories",
            url: "/main-category",
            requiredPermission: "Main Category View",
          },
          {
            title: "Sub Categories",
            url: "/sub-category",
            requiredPermission: "Sub Category View",
          },
          {
            title: "Brands",
            url: "/brand",
            requiredPermission: PERMISSIONS.BRAND_VIEW,
          },
          {
            title: "Units & Measures",
            url: "/unit-measurement",
            requiredPermission: "Unit View",
          },
          {
            title: "Inventory Containers",
            url: "/containers",
            requiredPermission: "Container View",
          },
        ],
      },
      {
        title: "Purchases",
        url: "#",
        icon: Truck,
        items: [
          {
            title: "Suppliers",
            url: "/purchase/suppliers",
            requiredPermission: PERMISSIONS.SUPPLIER_VIEW,
          },
          {
            title: "Purchase Orders",
            url: "/purchase/purchase-orders",
            requiredPermission: PERMISSIONS.PURCHASE_ORDER_VIEW,
          },
          {
            title: "Goods Received (GRN)",
            url: "/purchase/grn",
            requiredPermission: "GRN View",
          },
          {
            title: "Purchase Returns",
            url: "/purchase/returns",
            requiredPermission: PERMISSIONS.PURCHASE_ORDER_VIEW,
          },
        ],
      },
      {
        title: "Finance",
        url: "#",
        icon: Wallet,
        items: [
          {
            title: "Expenses",
            url: "/expenses",
            requiredPermission: "Expense View",
          },
          {
            title: "Expense Categories",
            url: "/expense-categories",
            requiredPermission: "Expense View",
          },
          {
            title: "Chart of Accounts",
            url: "/accounting",
            requiredPermission: "Accounting View",
          },
          {
            title: "Manual Journal",
            url: "/accounting/journal",
            requiredPermission: "Accounting View",
          },
          {
            title: "Customer Ledgers",
            url: "/accounting/customer-ledgers",
            requiredPermission: "Accounting View",
          },
          {
            title: "Supplier Ledgers",
            url: "/accounting/supplier-ledgers",
            requiredPermission: "Accounting View",
          },
          {
            title: "Cheque Management",
            url: "/cheques",
            requiredPermission: "Accounting View",
          },
          {
            title: "Financial Reports",
            url: "/accounting/reports",
            requiredPermission: "Report View",
          },
        ],
      },
      {
        title: "Administration",
        url: "#",
        icon: UserCog,
        items: [
          {
            title: "Employees",
            url: "/employees",
            requiredPermission: "User View",
          },
          {
            title: "Application Users",
            url: "/users",
            requiredPermission: [
              PERMISSIONS.USER_VIEW,
              PERMISSIONS.ROLE_VIEW,
              PERMISSIONS.PERMISSION_VIEW,
            ],
          },
          {
            title: "Audit Logs",
            url: "/audit-logs",
            requiredPermission: PERMISSIONS.USER_VIEW,
          },
        ],
      },
    ],
    primaryNav: [
      {
        name: "Dashboard Overview",
        url: "/",
        icon: LayoutDashboard,
        requiredPermission: null,
      },
      {
        name: "Inventory Insights",
        url: "/inventory-insights",
        icon: PieChart,
        requiredPermission: "Product View",
      },
      {
        name: "Intelligent Insights",
        url: "/reports",
        icon: BarChart3,
        requiredPermission: "Report View",
      },
    ],
    system: [
      {
        name: "Global Settings",
        url: "/settings",
        icon: Settings,
        requiredPermission: null,
      },
      {
        name: "Entity Management",
        url: "/organizations",
        icon: Origami,
        requiredPermission: "Organization View",
      },
      {
        name: "Branch Hierarchy",
        url: "/branches",
        icon: Frame,
        requiredPermission: PERMISSIONS.BRANCH_VIEW,
      },
    ],
  };

  const filterNavItems = (items) => {
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
          if (filteredSubItems.length === 0) return null;
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

  const filteredNavMain = filterNavItems(data.navMain);
  const filteredPrimary = filterNavItems(data.primaryNav);
  const filteredSystem = filterNavItems(data.system);

  return (
    <Sidebar {...props} className="border-r border-zinc-200 shadow-sm">
      <SidebarHeader className="p-6 bg-white border-b border-zinc-100">
        <div className="flex items-center gap-4">
          <div className="flex aspect-square size-10 items-center justify-center rounded-2xl bg-zinc-900 shadow-xl relative overflow-hidden group">
            {logoUrl ? (
              <img src={logoUrl} className="w-full h-full object-contain p-2" alt="Logo" />
            ) : (
              <div className="flex flex-col items-center justify-center">
                 <Sparkles className="size-5 text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] font-black text-zinc-900 tracking-tight leading-none">
              {business.name || "EMI POS"}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 border border-emerald-600/20" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em]">
                Enterprise Pro
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-white overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-6 py-8 px-2">
            {filteredPrimary.length > 0 && (
              <NavProjects projects={filteredPrimary} label="Executive Overview" />
            )}
            
            {filteredNavMain.length > 0 && (
              <NavMain items={filteredNavMain} label="Core Operations" />
            )}
            
            {filteredSystem.length > 0 && (
              <NavProjects projects={filteredSystem} label="System Infrastructure" />
            )}
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-4 bg-zinc-50/50 border-t border-zinc-200/60">
        <NavUser user={data.user} />
      </SidebarFooter>
      
      <SidebarRail className="hover:after:bg-zinc-200" />
    </Sidebar>
  );
}
