"use client";

import { Users, TrendingUp, Award, DollarSign, Target, UserCheck, Star, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

export function CustomerStats({ customers }) {
  const { formatCurrency } = useAppSettings();
  
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const vipCustomers = customers.filter((c) => c.loyaltyPoints >= 500).length;
  const totalRevenue = customers.reduce((sum, c) => sum + (parseFloat(c.totalSpent) || 0), 0);
  const avgSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  const stats = [
    {
      label: "Client Base",
      value: totalCustomers,
      icon: Users,
      gradient: "from-blue-500 to-indigo-400",
      shadow: "shadow-blue-100",
      trend: "up",
      change: "+12%"
    },
    {
      label: "Active Retention",
      value: activeCustomers,
      icon: UserCheck,
      gradient: "from-emerald-500 to-teal-400",
      shadow: "shadow-emerald-100",
      trend: "up",
      change: "+5%"
    },
    {
      label: "Premium Tier",
      value: vipCustomers,
      icon: Star,
      gradient: "from-amber-500 to-orange-400",
      shadow: "shadow-amber-100",
      trend: "stable",
      change: "0%"
    },
    {
      label: "Avg. Portfolio Value",
      value: `LKR ${avgSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: Zap,
      gradient: "from-purple-500 to-violet-400",
      shadow: "shadow-purple-100",
      trend: "up",
      change: "+8%"
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, idx) => (
        <div key={idx} className="group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden">
            {/* Subtle Background Decoration */}
            <div className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${stat.gradient} opacity-[0.03] rounded-bl-full group-hover:scale-150 transition-transform duration-500`} />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 rounded-xl bg-linear-to-br ${stat.gradient} text-white shadow-lg ${stat.shadow}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>

            <div className="relative z-10">
              <p className="text-sm font-semibold text-slate-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                {stat.value}
              </h3>
              
              <div className="flex items-center mt-3">
                <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
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
