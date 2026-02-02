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
      color: "text-blue-600",
      bg: "bg-blue-50",
      description: "Total registered profiles"
    },
    {
      label: "Active Retention",
      value: activeCustomers,
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      description: "High-engagement customers"
    },
    {
      label: "Premium Tier",
      value: vipCustomers,
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
      description: "Loyalty point leaders"
    },
    {
      label: "Avg. Portfolio Value",
      value: `LKR ${avgSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: Zap,
      color: "text-purple-600",
      bg: "bg-purple-50",
      description: "Mean revenue per client"
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, idx) => (
        <Card key={idx} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50">
              <p className="text-[11px] text-slate-400 font-medium italic">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
