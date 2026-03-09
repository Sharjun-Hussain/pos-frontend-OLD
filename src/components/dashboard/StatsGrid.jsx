"use client";

import React, { useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Package,
  Users,
  MoreHorizontal
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

// Helper for Number Animation
const AnimatedNumber = ({ value, isCurrency, formatCurrency }) => {
  const spanRef = useRef(null);
  
  useGSAP(() => {
    const cleanValue = parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
    const dummy = { val: 0 };
    
    gsap.to(dummy, {
      val: cleanValue,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => {
        if (spanRef.current) {
          // If currency, use the hook, else just round
          spanRef.current.textContent = isCurrency 
            ? formatCurrency(dummy.val.toFixed(2)) // Ensure currency format handles floats
            : Math.ceil(dummy.val).toString();
        }
      }
    });
  }, [value]);

  return <span ref={spanRef}>0</span>;
};

export default function StatsGrid() {
  const { data: session } = useSession();
  const { formatCurrency } = useCurrency();
  const containerRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.accessToken) return;
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/dashboard/summary`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        if (res.data.status === "success") {
          setData(res.data.data);
        }
      } catch (error) {
        console.error("Dashboard Stats Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session]);

  const stats = [
    {
      name: "Today Revenue",
      value: data?.todayRevenue?.value || 0,
      isCurrency: true,
      change: data?.todayRevenue?.change || "0%",
      trend: data?.todayRevenue?.trend || "up",
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-400",
      shadow: "shadow-emerald-100",
      text: "text-emerald-600"
    },
    {
      name: "Pending Invoices",
      value: data?.pendingInvoices?.value || 0,
      isCurrency: false,
      change: data?.pendingInvoices?.change || "0%",
      trend: data?.pendingInvoices?.trend || "stable",
      icon: FileText,
      gradient: "from-blue-500 to-indigo-400",
      shadow: "shadow-blue-100",
      text: "text-blue-600"
    },
    {
      name: "Low Stock Items",
      value: data?.lowStockCount?.value || 0,
      isCurrency: false,
      change: data?.lowStockCount?.change || "Alert",
      trend: data?.lowStockCount?.trend || "up",
      icon: Package,
      gradient: "from-orange-500 to-amber-400",
      shadow: "shadow-orange-100",
      text: "text-orange-600"
    },
    {
      name: "New Customers",
      value: data?.newCustomers?.value || 0,
      isCurrency: false,
      change: data?.newCustomers?.change || "Monthly",
      trend: data?.newCustomers?.trend || "up",
      icon: Users,
      gradient: "from-violet-500 to-purple-400",
      shadow: "shadow-violet-100",
      text: "text-violet-600"
    },
  ];

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={stat.name}
          className="group relative bg-card rounded-[24px] p-6 border border-border shadow-sm hover:shadow-xl hover:shadow-sidebar-accent/20 hover:-translate-y-1 transition-all duration-500 ease-out overflow-hidden"
        >
          {/* Subtle Background Decoration */}
          <div className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${stat.gradient} opacity-[0.05] rounded-bl-full group-hover:scale-150 transition-transform duration-700`} />

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-3 rounded-2xl bg-linear-to-br ${stat.gradient} text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className="w-5 h-5" />
            </div>
             <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-xl hover:bg-sidebar-accent/50">
                <MoreHorizontal className="w-5 h-5" />
             </button>
          </div>

          <div className="relative z-10">
            <p className="text-[12px] font-black text-muted-foreground uppercase tracking-widest mb-1 transition-colors duration-500">{stat.name}</p>
            <h3 className="text-3xl font-black text-foreground tracking-tight transition-colors duration-500">
               <AnimatedNumber 
                  value={stat.value} 
                  isCurrency={stat.isCurrency} 
                  formatCurrency={formatCurrency} 
               />
            </h3>
            
            <div className="flex items-center mt-4">
              <span className={`flex items-center text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg transition-colors ${stat.trend === "up" ? "bg-emerald-100/10 text-emerald-500 border border-emerald-500/20" : "bg-red-100/10 text-red-500 border border-red-500/20"}`}>
                {stat.trend === "up" ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {stat.change}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-2.5">vs last month</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}