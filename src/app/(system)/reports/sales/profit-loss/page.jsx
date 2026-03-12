"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar as CalendarIcon,
  Download,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  FileText,
  Store,
  RefreshCw,
  Check,
  ChevronsUpDown,
  Wallet,
  Scale,
  Activity,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip
} from 'recharts';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export default function ProfitLossReportPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();

  // --- STATES ---
  const [date, setDate] = useState({ 
    from: startOfMonth(new Date()), 
    to: endOfMonth(new Date()) 
  });
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [branchId, setBranchId] = useState("all");
  const [branches, setBranches] = useState([]);
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!session?.accessToken) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        const result = await response.json();
        if (result.status === 'success') {
          setBranches(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch branches", err);
      }
    };
    fetchBranches();
  }, [session?.accessToken]);

  const fetchData = async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        branch_id: branchId
      });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/profit-loss?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch profit loss data");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profit loss data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken, date, branchId]);

  // --- EXPORT LOGIC ---
  const handleExportCSV = () => {
    if (!data) return;
    const exportData = [
      { "Metric": "Total Revenue", "Value": data.revenue },
      { "Metric": "Cost of Goods Sold (COGS)", "Value": data.cogs },
      { "Metric": "Gross Profit", "Value": data.grossProfit },
      { "Metric": "Total Operating Expenses", "Value": data.expenses },
      { "Metric": "Net Profit", "Value": data.netProfit },
      { "Metric": "Net Margin (%)", "Value": data.margin }
    ];
    exportToCSV(exportData, "Profit_Loss_Report");
  };

  const handleExportExcel = () => {
    if (!data) return;
    const exportData = [
      { "Metric": "Total Revenue", "Value": data.revenue },
      { "Metric": "Cost of Goods Sold (COGS)", "Value": data.cogs },
      { "Metric": "Gross Profit", "Value": data.grossProfit },
      { "Metric": "Total Operating Expenses", "Value": data.expenses },
      { "Metric": "Net Profit", "Value": data.netProfit },
      { "Metric": "Net Margin (%)", "Value": data.margin }
    ];
    exportToExcel(exportData, "Profit_Loss_Report");
  };

  // --- CHART DATA ---
  const chartData = data ? [
    { name: 'COGS', value: data.cogs, color: '#f59e0b' },
    { name: 'Expenses', value: data.expenses, color: '#ef4444' },
    { name: 'Net Profit', value: Math.max(0, data.netProfit), color: '#10b981' },
  ].filter(item => item.value > 0) : [];

  const MetricItem = ({ label, value, color, tooltip, icon: Icon, isBold = false }) => (
    <div className={cn(
      "flex items-center justify-between py-4 border-b border-border/40 last:border-0 group transition-all px-2 rounded-xl hover:bg-muted/30",
      isBold && "bg-muted/10 my-2 py-5"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2.5 rounded-xl bg-opacity-10 shrink-0", color)}>
          <Icon className={cn("h-4 w-4", color.replace('bg-', 'text-'))} />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className={cn("text-xs font-bold uppercase tracking-wider text-muted-foreground/80", isBold && "text-foreground")}>{label}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/40" /></TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-[10px] font-medium leading-relaxed">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 leading-none">Categorical Ledger</span>
        </div>
      </div>
      <div className="text-right">
        <span className={cn(
          "text-sm font-black tracking-tighter tabular-nums",
          isBold ? "text-lg text-foreground" : "text-foreground/90"
        )}>
          {formatCurrency(value)}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-background max-w-[1400px] mx-auto w-full font-sans text-foreground pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner">
            <Scale className="w-6 h-6 text-[#10b981]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Profit and Loss</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Financial Hub</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Reports</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Profit & Loss</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest">
            <FileText className="h-4 w-4" /> Excel Ledger
          </Button>
          <Button onClick={() => window.print()} className="bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20 gap-2 hover:bg-[#0da371] h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-none">
            <Activity className="h-4 w-4" /> Generate Report
          </Button>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <Card className="border-none shadow-sm bg-card overflow-visible">
        <CardContent className="p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            
            {/* Date Range Selector */}
            <div className="space-y-2.5 w-full">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Select Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-semibold h-11 border-border/50 bg-background/50 hover:bg-muted/20 rounded-xl px-4 gap-3 shadow-sm transition-all",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 text-[#10b981] shrink-0" />
                    <span className="text-[11px] truncate uppercase tracking-tight">
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd")} — {format(date.to, "LLL dd, yyyy")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, yyyy")
                        )
                      ) : (
                        <span>Pick period</span>
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-border/40 overflow-hidden" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    className="p-4"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Branch Selector */}
            <div className="space-y-2.5 w-full">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Retail Branch</label>
              <Popover open={isBranchOpen} onOpenChange={setIsBranchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-11 justify-between bg-background/50 border-border/50 rounded-xl hover:bg-muted/20 font-semibold text-[11px] px-4 shadow-sm transition-all uppercase tracking-tight"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <Store className="h-4 w-4 text-[#10b981] shrink-0" />
                      <span className="truncate uppercase">
                        {branchId === "all" ? "Whole Organization" : branches.find((b) => b.id === branchId)?.name}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 rounded-2xl border-border/40 shadow-2xl overflow-hidden" align="start">
                  <Command className="p-2">
                    <CommandInput placeholder="Search branch..." className="h-11 text-xs border-none focus:ring-0 px-3 font-medium" />
                    <CommandList className="max-h-[300px] mt-1">
                      <CommandEmpty className="py-6 text-sm font-medium text-muted-foreground text-center">No branch found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setBranchId("all");
                            setIsBranchOpen(false);
                          }}
                          className="rounded-xl m-1 text-sm font-semibold px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
                        >
                          <Check className={cn("mr-3 h-4 w-4 text-[#10b981]", branchId === "all" ? "opacity-100" : "opacity-0")} />
                          All Branches
                        </CommandItem>
                        {branches.map((b) => (
                          <CommandItem
                            key={b.id}
                            value={b.name}
                            onSelect={() => {
                              setBranchId(b.id);
                              setIsBranchOpen(false);
                            }}
                            className="rounded-xl m-1 text-[11px] font-black uppercase px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
                          >
                            <Check className={cn("mr-3 h-4 w-4 text-[#10b981]", branchId === b.id ? "opacity-100" : "opacity-0")} />
                            {b.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="lg:col-span-2 flex justify-end">
              <Button 
                onClick={fetchData} 
                className="h-11 w-11 rounded-xl bg-[#10b981] hover:bg-[#0da371] text-white shadow-lg shadow-[#10b981]/20 transition-all active:scale-95 border-none"
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* --- SUMMARY STATS --- */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-[#10b981]/10" />
             <CardContent className="p-7">
                <div className="flex items-center gap-5">
                   <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500 text-emerald-600">
                      <Wallet className="w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-sm font-semibold text-muted-foreground/80 mb-1">Total Sales</p>
                      <h3 className="text-2xl font-bold text-foreground tabular-nums">{isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(data?.revenue)}</h3>
                   </div>
                </div>
             </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-amber-500/10" />
             <CardContent className="p-7">
                <div className="flex items-center gap-5">
                   <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 group-hover:scale-110 transition-transform duration-500 text-amber-600">
                      <BarChart3 className="w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-sm font-semibold text-muted-foreground/80 mb-1">Gross Profit</p>
                      <h3 className="text-2xl font-bold text-foreground tabular-nums">{isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(data?.grossProfit)}</h3>
                   </div>
                </div>
             </CardContent>
          </Card>

          <Card className={cn(
            "border-none shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 relative text-white",
            (!isLoading && data?.netProfit >= 0) ? "bg-[#10b981]" : "bg-red-500"
          )}>
             <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl transition-all group-hover:scale-125" />
             <CardContent className="p-7">
                <div className="flex items-center gap-5">
                   <div className="p-4 rounded-2xl bg-white/20 border border-white/30 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                      {isLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : (data?.netProfit >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />)}
                   </div>
                   <div>
                      <p className="text-sm font-semibold text-white/80 mb-1">Net Profit</p>
                      <h3 className="text-2xl font-bold tabular-nums">{isLoading ? <Skeleton className="h-8 w-32 bg-white/20" /> : formatCurrency(data?.netProfit)}</h3>
                   </div>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* --- MAIN STATEMENT --- */}
        <div className="lg:col-span-7 space-y-8">
           <Card className="border-none shadow-sm bg-card overflow-hidden h-full">
              <CardHeader className="pb-3 border-b border-border/30 bg-muted/5 backdrop-blur-md">
                 <div className="flex items-center justify-between">
                    <div>
                       <CardTitle className="text-lg font-bold text-foreground flex items-center gap-3">
                          <Activity className="h-4 w-4 text-[#10b981]" /> Financial Summary
                       </CardTitle>
                       <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-1">Detailed breakdown of income and expenses</CardDescription>
                    </div>
                    {!isLoading && (
                       <Badge variant="outline" className={cn(
                          "px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest border-none",
                          data?.netProfit >= 0 ? "bg-[#10b981]/10 text-[#10b981]" : "bg-red-500/10 text-red-500"
                       )}>
                          {data?.netProfit >= 0 ? 'Positive Surplus' : 'Net Deficit'}
                       </Badge>
                    )}
                 </div>
              </CardHeader>
              <CardContent className="p-6">
                 {isLoading ? (
                    <div className="space-y-6">
                       {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl bg-muted/40" />)}
                    </div>
                 ) : (
                    <div className="space-y-2">
                       <MetricItem 
                          label="Gross Revenue" 
                          value={data?.revenue} 
                          color="bg-emerald-500" 
                          icon={ArrowUpRight}
                          tooltip="Total income generated from all completed retail and commercial sales within the current horizon."
                       />
                       <MetricItem 
                          label="Cost Basis (COGS)" 
                          value={data?.cogs} 
                          color="bg-amber-500" 
                          icon={TrendingDown}
                          tooltip="The direct cost of inventory procurement relative to sold units. Calculated based on purchase-time cost."
                       />
                       
                       <MetricItem 
                          label="Merchant Margin" 
                          value={data?.grossProfit} 
                          color="bg-blue-500" 
                          icon={DollarSign}
                          isBold
                          tooltip="Operational profit remaining after subtracting inventory costs from revenue, but before accounting for fixed expenses."
                       />

                       <MetricItem 
                          label="Secondary Outflows" 
                          value={data?.expenses} 
                          color="bg-red-500" 
                          icon={ArrowDownRight}
                          tooltip="Total combined operating costs including rent, utilities, labor, and miscellaneous administrative outlays."
                       />

                       <div className="mt-8 pt-8 border-t border-border/30 flex flex-col gap-4">
                          <div className="flex justify-between items-end mb-1">
                             <div>
                                <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] mb-1 leading-none">Fiscal Efficiency</h4>
                                <p className="text-xl font-black text-foreground tabular-nums tracking-tighter">{(data?.margin || 0).toFixed(2)}% <span className="text-xs font-bold text-muted-foreground">NET MARGIN</span></p>
                             </div>
                             <div className="text-right">
                                <span className={cn(
                                   "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                   (data?.margin || 0) > 15 ? "bg-[#10b981]/10 text-[#10b981]" : "bg-amber-500/10 text-amber-500"
                                )}>
                                   {(data?.margin || 0) > 15 ? 'High Grade' : 'Monitoring Required'}
                                </span>
                             </div>
                          </div>
                          <Progress value={Math.max(0, Math.min(100, data?.margin || 0))} className="h-3 rounded-full bg-muted/30" />
                       </div>
                    </div>
                 )}
              </CardContent>
           </Card>
        </div>

        {/* --- VISUALS --- */}
        <div className="lg:col-span-5 space-y-8">
           <Card className="border-none shadow-sm bg-card overflow-hidden h-full flex flex-col">
              <CardHeader className="pb-3 border-b border-border/30 bg-muted/5 backdrop-blur-md">
                 <CardTitle className="text-lg font-bold text-foreground flex items-center gap-3">
                    <PieChartIcon className="h-4 w-4 text-[#10b981]" /> Profit Breakdown
                 </CardTitle>
                 <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-1">Visualizing cost vs profit</CardDescription>
              </CardHeader>
              <CardContent className="p-8 flex-1 flex flex-col items-center justify-center min-h-[350px]">
                 {isLoading ? (
                    <Skeleton className="h-64 w-64 rounded-full bg-muted/40 animate-pulse" />
                 ) : chartData.length > 0 ? (
                    <div className="w-full h-full flex flex-col">
                       <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                             <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={95}
                                paddingAngle={8}
                                dataKey="value"
                             >
                                {chartData.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={entry.color} stroke="none" className="hover:opacity-80 transition-opacity" />
                                ))}
                             </Pie>
                             <RechartsTooltip 
                                contentStyle={{ 
                                   backgroundColor: 'hsl(var(--card))', 
                                   borderRadius: '16px', 
                                   border: '1px solid hsl(var(--border))', 
                                   boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                   fontSize: '11px',
                                   fontWeight: 'bold',
                                   textTransform: 'uppercase'
                                }} 
                             />
                          </PieChart>
                       </ResponsiveContainer>
                       <div className="mt-6 flex flex-wrap justify-center gap-6">
                          {chartData.map((item, i) => (
                             <div key={i} className="flex items-center gap-2.5">
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{item.name}</span>
                                <span className="text-[11px] font-black text-foreground">
                                   {((item.value / (data?.revenue || 1)) * 100).toFixed(1)}%
                                </span>
                             </div>
                          ))}
                       </div>
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center gap-4 opacity-20 py-10 text-center">
                       <PieChartIcon className="h-16 w-16" />
                       <p className="text-xs font-black uppercase tracking-[0.2em]">Zero Fiscal Movement</p>
                    </div>
                 )}
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-[#10b981]/5 border-l-4 border-l-[#10b981] overflow-hidden">
              <CardContent className="p-6">
                 <div className="flex gap-5">
                    <div className="p-3 rounded-2xl bg-[#10b981]/10 text-[#10b981] shrink-0">
                       <Info className="h-6 w-6" />
                    </div>
                    <div>
                       <h4 className="font-black text-[#10b981] text-xs uppercase tracking-[0.2em] mb-2 leading-none">Fiscal Integrity Note</h4>
                       <p className="text-[11px] text-muted-foreground/80 leading-relaxed font-medium">
                          The figures presented within this statement represent estimations derived from real-time sales aggregation and recorded expenditure categories. Final fiscal accuracy may be influenced by unrecorded inventory variances, returns logistics, or miscellaneous overhead adjustments.
                       </p>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>

    </div>
  );
}
