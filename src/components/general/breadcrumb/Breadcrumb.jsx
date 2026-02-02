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
  Truck
} from "lucide-react";
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
    if (pathname === "/" || pathname === "/pos") {
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
          <Link href="/" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
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
              <Link href={href} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                {icon}
                <span className="text-xs font-medium">{formattedName}</span>
              </Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="flex items-center gap-1.5 font-semibold text-slate-900">
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

  // Don't render anything if no breadcrumb items
  const renderHeader = (content) => (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md transition-all duration-200">
    <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex items-center gap-1">
          <SidebarTrigger className="h-8 w-8" />
          <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block" />
          
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-9 px-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all group"
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

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 mr-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-xs"
            >
              <Link href="/pos">
                <Monitor className="h-3.5 w-3.5 text-blue-600" />
                <span>POS</span>
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Quick Action</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Create New</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/pos" className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">New Sale (POS)</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/products/new" className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-blue-500" />
                    <span>New Product</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/brand" className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-indigo-500" />
                    <span>New Brand</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/expenses/new" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-500" />
                    <span>New Expense</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/customers" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-orange-500" />
                    <span>New Customer</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/purchase/suppliers" className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-slate-500" />
                    <span>New Supplier</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden md:flex items-center">
            <ZoomControl className="border-none shadow-none bg-slate-100/50 hover:bg-slate-100 transition-colors" />
          </div>
          
          {/* Action buttons placeholder */}
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-105 transition-transform">
            {session?.user?.name?.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  );

  if (breadcrumbItems.length === 0) {
    return renderHeader(null);
  }

  return renderHeader(breadcrumbItems);
}
