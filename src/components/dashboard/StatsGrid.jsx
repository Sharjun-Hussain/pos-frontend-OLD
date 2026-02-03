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
          className="group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden"
        >
          {/* Subtle Background Decoration */}
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-[0.03] rounded-bl-full group-hover:scale-150 transition-transform duration-500`} />

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg ${stat.shadow}`}>
              <stat.icon className="w-5 h-5" />
            </div>
             <button className="text-slate-300 hover:text-slate-500 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
             </button>
          </div>

          <div className="relative z-10">
            <p className="text-sm font-semibold text-slate-500 mb-1">{stat.name}</p>
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
               <AnimatedNumber 
                  value={stat.value} 
                  isCurrency={stat.isCurrency} 
                  formatCurrency={formatCurrency} 
               />
            </h3>
            
            <div className="flex items-center mt-3">
              <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-opacity-10 ${stat.trend === "up" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                {stat.trend === "up" ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {stat.change}
              </span>
              <span className="text-xs text-slate-400 ml-2">vs last month</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}