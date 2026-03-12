"use client";

import { Users, TrendingUp, Award, DollarSign, Target, UserCheck, Star, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

export function CustomerStats({ customers }) {
  const { formatCurrency } = useAppSettings();
  
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.is_active).length;
  const vipCustomers = customers.filter((c) => (c.loyaltyPoints || 0) >= 1000).length;
  const totalRevenue = customers.reduce((sum, c) => sum + (parseFloat(c.totalSpent) || 0), 0);

  const stats = [
    {
      label: "Total Client Base",
      value: totalCustomers,
      icon: Users,
      color: "text-[#10b981]",
      bg: "bg-[#10b981]/10",
      border: "border-[#10b981]/20",
      description: "Aggregated member profiles"
    },
    {
      label: "Active Relationships",
      value: activeCustomers,
      icon: UserCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      description: "Recent transaction velocity"
    },
    {
      label: "Premium VIP Tier",
      value: vipCustomers,
      icon: Star,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      description: "High-loyalty portfolio"
    },
    {
      label: "Net CRM Equity",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      description: "Lifetime fiscal contribution"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <Card key={i} className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
          <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 blur-3xl transition-all group-hover:opacity-100 opacity-50", stat.bg)} />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl border shadow-inner group-hover:scale-110 transition-transform duration-500", stat.bg, stat.border, stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70 mb-1 truncate">{stat.label}</p>
                <h3 className="text-xl font-black text-foreground tabular-nums tracking-tight truncate">
                  {stat.value}
                </h3>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2">
                <div className={cn("h-1 w-full rounded-full bg-muted/30 overflow-hidden")}>
                    <div className={cn("h-full rounded-full w-[65%]", stat.color.replace('text-', 'bg-'))} />
                </div>
                <p className="text-[9px] font-medium text-muted-foreground/50 tracking-wide uppercase italic">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
