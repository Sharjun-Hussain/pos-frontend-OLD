"use client";

import { useRef } from "react";
import {
  ShoppingCart,
  FileText,
  Package,
  Users,
  BarChart3,
  Barcode,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const quickActions = [
  {
    id: "pos",
    name: "Point of Sale",
    icon: ShoppingCart,
    description: "New Sale",
    gradient: "from-emerald-400 to-emerald-600",
    href: "/pos", 
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: Package,
    description: "Manage Stock",
    gradient: "from-orange-400 to-red-500",
    href: "/products",
  },
  {
    id: "reports",
    name: "Analytics",
    icon: BarChart3,
    description: "View Insights",
    gradient: "from-blue-400 to-indigo-600",
    href: "/reports", 
  },
  {
    id: "purchase",
    name: "Purchases",
    icon: CreditCard,
    description: "Create Order",
    gradient: "from-violet-400 to-fuchsia-600",
    href: "/purchase/purchase-orders", 
  },
  {
    id: "employee",
    name: "Staff",
    icon: Users,
    description: "Manage Team",
    gradient: "from-pink-400 to-rose-600",
    href: "/employees", 
  },
  {
    id: "barcodes",
    name: "Barcodes",
    icon: Barcode,
    description: "Print Labels",
    gradient: "from-slate-600 to-slate-800",
    href: "/barcode",
  },
];

export default function QuickActions() {
  const containerRef = useRef(null);
  const { contextSafe } = useGSAP({ scope: containerRef });

  // FIX: Added 'overwrite: true' to ensure animations don't conflict
  const onHoverEnter = contextSafe((e) => {
    const target = e.currentTarget;
    const icon = target.querySelector(".action-icon");
    
    gsap.to(target, { 
      y: -5, 
      scale: 1.02, 
      duration: 0.3, 
      ease: "back.out(1.7)",
      overwrite: true 
    });
    
    gsap.to(icon, { 
      scale: 1.1, 
      rotate: 5, 
      duration: 0.4, 
      ease: "back.out(1.7)",
      overwrite: true 
    });
  });

  const onHoverLeave = contextSafe((e) => {
    const target = e.currentTarget;
    const icon = target.querySelector(".action-icon");

    gsap.to(target, { 
      y: 0, 
      scale: 1, 
      duration: 0.25, // Made slightly faster for snappier feel
      ease: "power2.out",
      overwrite: true 
    });
    
    gsap.to(icon, { 
      scale: 1, 
      rotate: 0, 
      duration: 0.25, 
      ease: "power2.out",
      overwrite: true 
    });
  });

  return (
    <div ref={containerRef} className="bg-card rounded-[24px] border border-border shadow-sm p-6 transition-colors duration-500">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            onMouseEnter={onHoverEnter}
            onMouseLeave={onHoverLeave}
            className="group relative flex flex-col items-center justify-center p-4 rounded-2xl border border-border bg-sidebar-accent/30 hover:bg-card hover:border-[#10b981]/30 hover:shadow-xl hover:shadow-sidebar-accent/20 transition-all duration-500"
          >
            <div
              className={`action-icon mb-4 p-3.5 rounded-2xl bg-linear-to-br ${action.gradient} text-white shadow-lg will-change-transform group-hover:scale-110 transition-transform duration-300`}
            >
              <action.icon className="w-5 h-5" strokeWidth={2.5} />
            </div>
            
            <div className="text-center">
              <span className="block text-[12px] font-black text-foreground uppercase tracking-widest group-hover:text-[#10b981] transition-colors duration-300">
                {action.name}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 block opacity-70">
                {action.description}
              </span>
            </div>

            {action.soon && (
              <span className="absolute top-2 right-2 text-[9px] font-black bg-[#10b981]/10 text-[#10b981] px-1.5 py-0.5 rounded-lg border border-[#10b981]/20">
                SOON
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}