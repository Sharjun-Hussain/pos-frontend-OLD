"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ArrowLeft, 
  Home, 
  ChevronRight, 
  Settings, 
  Users, 
  Package, 
  ShoppingCart, 
  Calculator, 
  LayoutDashboard,
  Plus,
  Monitor,
  PlusCircle,
  Tag,
  Wallet,
  UserPlus,
  Truck,
  Sun,
  Moon,
  Bell
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import ZoomControl from "@/components/common/ZoomControl";

import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";

export function SystemBreadcrumb() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);
  const [showBackButton, setShowBackButton] = useState(false);
  const { breadcrumbs } = useBreadcrumbStore();
  const { theme, setTheme } = useTheme();

  // Format segment names to be more readable
  const getSegmentIcon = (segment) => {
    switch (segment.toLowerCase()) {
      case "home": return <Home className="h-3.5 w-3.5" />;
      case "inventory": return <Package className="h-3.5 w-3.5" />;
      case "purchase": return <ShoppingCart className="h-3.5 w-3.5" />;
      case "accounting": return <Calculator className="h-3.5 w-3.5" />;
      case "settings": return <Settings className="h-3.5 w-3.5" />;
      case "users": return <Users className="h-3.5 w-3.5" />;
      case "dashboard": return <LayoutDashboard className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const formatSegmentName = (segment) => {
    // Check if there is a custom label for this segment
    if (breadcrumbs[segment]) {
      return breadcrumbs[segment];
    }

    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    // Don't render breadcrumb if we're only on home or app page
    // Also hide on dashboard as it has its own header
    if (pathname === "/" || pathname === "/pos" || pathname === "/dashboard") {
      setBreadcrumbItems([]);
      setShowBackButton(false);
      return;
    }

    const pathSegments = pathname
      .split("/")
      .filter((segment) => segment !== "" && segment !== "pos");

    if (pathSegments.length === 0) {
      setBreadcrumbItems([]);
      setShowBackButton(false);
      return;
    }

    // Show back button on all other pages (depth >= 1)
    setShowBackButton(pathSegments.length >= 1);

    const items = [];

    // Add Home breadcrumb
    items.push(
      <BreadcrumbItem key="home">
        <BreadcrumbLink asChild>
          <Link href="/" className="flex items-center gap-1.5 hover:text-[#10b981] transition-colors">
            <Home className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-xs font-medium">Home</span>
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    );

    // Add separator if there are additional segments
    if (pathSegments.length > 0) {
      items.push(<BreadcrumbSeparator key="sep-home" />);
    }

    // Generate breadcrumb items
    pathSegments.forEach((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/");
      const isLast = index === pathSegments.length - 1;
      const formattedName = formatSegmentName(segment);
      const icon = getSegmentIcon(segment);

      // Add the breadcrumb item
      items.push(
        <BreadcrumbItem key={href}>
          {!isLast ? (
            <BreadcrumbLink asChild>
              <Link href={href} className="flex items-center gap-1.5 hover:text-[#10b981] transition-colors">
                {icon}
                <span className="text-xs font-medium">{formattedName}</span>
              </Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="flex items-center gap-1.5 font-bold text-foreground">
              {icon}
              <span className="text-xs">{formattedName}</span>
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>
      );

      // Add separator if not the last item
      if (!isLast) {
        items.push(<BreadcrumbSeparator key={`sep-${href}`} />);
      }
    });

    setBreadcrumbItems(items);
  }, [pathname, breadcrumbs]);

  const renderHeader = (content) => (
    <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/95 backdrop-blur-md transition-all duration-500">
      <div className="flex h-14 items-center gap-4 px-6">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 rounded-xl transition-all group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back</span>
            </Button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap overflow-hidden">
              {content}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 mr-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 gap-2 border-border bg-card hover:bg-sidebar-accent/50 text-foreground font-black uppercase tracking-widest text-[10px] shadow-sm rounded-xl"
            >
              <Link href="/pos">
                <Monitor className="h-4 w-4 text-[#10b981]" />
                <span>POS</span>
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="h-9 gap-2 bg-[#10b981] hover:bg-[#059669] text-white font-black uppercase tracking-widest text-[10px] shadow-sm rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                  <span>Quick Action</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-card border border-border shadow-2xl transition-all duration-500">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-3">Create New</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-3 focus:bg-sidebar-accent">
                  <Link href="/pos" className="flex items-center gap-3">
                    <ShoppingCart className="h-4 w-4 text-[#10b981]" />
                    <span className="font-bold">New Sale (POS)</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-3 focus:bg-sidebar-accent">
                  <Link href="/products/new" className="flex items-center gap-3">
                    <PlusCircle className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">New Product</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-3 focus:bg-sidebar-accent">
                  <Link href="/brand" className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium">New Brand</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-3 focus:bg-sidebar-accent">
                  <Link href="/expenses/new" className="flex items-center gap-3">
                    <Wallet className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">New Expense</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-3 focus:bg-sidebar-accent">
                  <Link href="/customers" className="flex items-center gap-3">
                    <UserPlus className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">New Customer</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-3 focus:bg-sidebar-accent">
                  <Link href="/purchase/suppliers" className="flex items-center gap-3">
                    <Truck className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">New Supplier</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <ZoomControl className="border-none shadow-none bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors" />
            
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30 rounded-xl transition-all duration-300 group"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 group-hover:rotate-45 transition-transform duration-500" />
              ) : (
                <Moon className="h-4 w-4 group-hover:-rotate-12 transition-transform duration-500" />
              )}
            </button>
          </div>
          
          <div className="h-9 w-9 rounded-2xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center text-xs font-black border border-[#10b981]/20 cursor-pointer hover:scale-105 transition-transform shadow-sm ml-2">
            {session?.user?.name?.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  );

  if (breadcrumbItems.length === 0 && pathname !== "/dashboard") {
    return null;
  }

  return renderHeader(breadcrumbItems);
}
