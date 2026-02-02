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
    <div ref={containerRef} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            onMouseEnter={onHoverEnter}
            onMouseLeave={onHoverLeave}
            className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-100 hover:shadow-lg hover:shadow-blue-100/50 transition-colors duration-300"
          >
            <div
              className={`action-icon mb-3 p-3.5 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-md will-change-transform`}
            >
              <action.icon className="w-6 h-6" strokeWidth={2.5} />
            </div>
            
            <div className="text-center">
              <span className="block text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                {action.name}
              </span>
              <span className="text-xs font-medium text-slate-400 mt-0.5 block">
                {action.description}
              </span>
            </div>

            {action.soon && (
              <span className="absolute top-2 right-2 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                SOON
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}