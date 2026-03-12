"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Search, 
  Download,
  Calendar,
  DollarSign,
  ShoppingBag,
  ArrowRight,
  User as UserIcon,
  FileText,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export default function CustomerHistoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { formatCurrency } = useAppSettings();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/customers/history`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch customer history");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map(item => ({
      "Customer Name": item.name,
      "Phone": item.phone || '-',
      "Email": item.email || '-',
      "Total Visits": item.totalSales,
      "Total Spent": item.totalSpent,
      "Last Visit": item.lastVisit ? format(new Date(item.lastVisit), 'yyyy-MM-dd') : 'Never'
    }));
    exportToCSV(exportData, "Customer_Purchase_History");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      "Customer Name": item.name,
      "Phone": item.phone || '-',
      "Email": item.email || '-',
      "Total Visits": item.totalSales,
      "Total Spent": item.totalSpent,
      "Last Visit": item.lastVisit ? format(new Date(item.lastVisit), 'yyyy-MM-dd') : 'Never'
    }));
    exportToExcel(exportData, "Customer_Purchase_History");
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken]);

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.phone && item.phone.includes(searchQuery))
  );

  const stats = {
    totalClients: data.length,
    netCrmValue: data.reduce((acc, curr) => acc + (curr.totalSpent || 0), 0),
    highFrequencyCount: data.filter(item => item.totalSales > 5).length,
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-background max-w-[1600px] mx-auto w-full font-sans text-foreground pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Customer History</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Customer Intelligence</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Reports</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Engagement Analytics</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
            <FileText className="h-4 w-4" /> Excel
          </Button>
          <Button onClick={fetchData} className="h-10 w-10 rounded-xl bg-card border border-border/50 text-foreground hover:bg-muted/30 shadow-sm transition-all active:scale-95" variant="outline" disabled={isLoading}>
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* --- DASHBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Client Base", value: stats.totalClients, icon: Users, color: "text-[#10b981]", bg: "bg-[#10b981]/10", border: "border-[#10b981]/20" },
          { label: "Net CRM Value", value: formatCurrency(stats.netCrmValue), icon: DollarSign, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "High-Frequency Buyers", value: stats.highFrequencyCount, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
            <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:opacity-100 opacity-50", stat.bg)} />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3.5 rounded-2xl border shadow-inner group-hover:scale-110 transition-transform duration-500", stat.bg, stat.border, stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70 mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-black text-foreground tabular-nums tracking-tight">
                    {isLoading ? <Skeleton className="h-8 w-24" /> : stat.value}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-[#10b981]" />
              <div>
                <CardTitle className="text-base font-bold text-foreground">Customer Engagement Ledger</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-0.5">Comprehensive history of client interactions and fiscal contribution</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative w-full md:w-80 group/search">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/search:text-[#10b981] transition-colors" />
                    <Input 
                        placeholder="Search by name or phone..." 
                        className="pl-11 h-11 rounded-xl border-border/50 bg-background font-bold text-[11px] focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                        value={searchQuery}
                        onChange={(e)=>setSearchQuery(e.target.value)}
                    />
                </div>
                {isLoading && <Badge className="bg-[#10b981]/10 text-[#10b981] animate-pulse rounded-lg font-bold border-none uppercase text-[9px] tracking-widest px-2 shadow-none">Syncing Profiles</Badge>}
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="pl-6 font-bold text-foreground py-4 text-[10px] uppercase tracking-widest">Client Identity</TableHead>
                <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Communication Channel</TableHead>
                <TableHead className="text-right font-bold text-foreground text-[10px] uppercase tracking-widest">Frequency (Visits)</TableHead>
                <TableHead className="text-right font-bold text-foreground text-[10px] uppercase tracking-widest">Fiscal Equity</TableHead>
                <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Recent Activity</TableHead>
                <TableHead className="text-right pr-6 font-bold text-foreground text-[10px] uppercase tracking-widest">Management</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    <TableCell className="pl-6 py-4"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-32" /></div></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-12 ml-auto rounded-lg" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-32 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center py-20">
                     <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 rounded-full bg-muted/30 text-muted-foreground/20">
                          <Users className="w-10 h-10" />
                        </div>
                        <div>
                          <h4 className="font-bold text-muted-foreground text-sm uppercase tracking-widest">No customer records found</h4>
                          <p className="text-xs text-muted-foreground/60 font-medium">Clear search terms to refresh the history ledger.</p>
                        </div>
                      </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-border/40 group relative">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border/40 shadow-sm group-hover:border-[#10b981]/50 transition-all duration-300">
                          <AvatarFallback className="bg-muted text-muted-foreground font-black uppercase text-[10px] group-hover:bg-[#10b981]/10 group-hover:text-[#10b981] transition-all">
                            {item.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground/80 group-hover:text-[#10b981] transition-colors tracking-tight">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest">UUID: {item.id.substring(0,8)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-foreground/70 tabular-nums">{item.phone || '-'}</span>
                            <span className="text-[10px] text-muted-foreground/40 font-medium lowercase tracking-tight">{item.email || '-'}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <Badge variant="outline" className="bg-muted/20 text-muted-foreground/80 border-border/50 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-none group-hover:bg-[#10b981]/10 group-hover:text-[#10b981] group-hover:border-[#10b981]/30 transition-all">
                            {item.totalSales} <span className="ml-1 opacity-40 font-medium">VISITS</span>
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <span className="text-sm font-black text-[#10b981] tabular-nums tracking-tight font-mono">{formatCurrency(item.totalSpent || 0)}</span>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground/70 font-bold uppercase tracking-tight">
                        {item.lastVisit ? format(new Date(item.lastVisit), 'MMM dd, yyyy') : 'Never Registered'}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="text-muted-foreground/40 hover:text-[#10b981] gap-1.5 h-8 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-[#10b981]/5 transition-all"
                         onClick={() => router.push(`/customers?id=${item.id}`)}
                       >
                           Profile <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <div className="px-6 py-4 flex justify-between items-center border-t border-border/30 bg-muted/5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
             Monitoring {filteredData.length} client success profiles
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-30" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-30" disabled>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
