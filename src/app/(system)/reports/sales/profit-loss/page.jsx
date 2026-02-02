"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Download,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  PieChart
} from "lucide-react";
import { toast } from "sonner";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ProfitLossReportPage() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [branchId, setBranchId] = useState("all");
  const [branches, setBranches] = useState([]);

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
        start_date: startDate,
        end_date: endDate,
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

  useEffect(() => {
    fetchData();
  }, [session?.accessToken, startDate, endDate, branchId]);

  const MetricItem = ({ label, value, color, tooltip, icon: Icon }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`h-4 w-4 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger><Info className="h-3 w-3 text-slate-400" /></TooltipTrigger>
              <TooltipContent><p>{tooltip}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <span className={`text-base font-bold text-slate-900 group-hover:scale-105 transition-transform`}>
        LKR {value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </span>
    </div>
  );

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profit & Loss Statement</h1>
          <p className="text-slate-500">Overview of revenues, costs, and net profit for the selected period.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
            <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 border-0 focus-visible:ring-0"
            />
            <span className="text-slate-300">-</span>
            <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 border-0 focus-visible:ring-0"
            />
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm px-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Store:</span>
          <select 
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="text-xs font-semibold bg-transparent border-0 focus:ring-0 cursor-pointer h-8 outline-none"
          >
            <option value="all">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Profit Card */}
        <Card className="md:col-span-1 border-none shadow-lg bg-white overflow-hidden relative group">
          <div className={`absolute top-0 left-0 w-full h-1 ${data?.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Net Profit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? <Skeleton className="h-10 w-40" /> : (
              <div className={`text-4xl font-black ${(data?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                LKR {Math.abs(data?.netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                <span className="text-sm ml-2 font-normal text-slate-400">{(data?.netProfit || 0) >= 0 ? 'Surplus' : 'Deficit'}</span>
              </div>
            )}
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Net Margin</span>
                    <span className="text-blue-600 font-bold">{(data?.margin || 0).toFixed(1)}%</span>
                </div>
                <Progress value={data?.margin || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Card */}
        <Card className="md:col-span-2 border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Income & Expenditure Summary</CardTitle>
            <CardDescription>Estimated totals based on completed sales and recorded expenses.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="space-y-4 mt-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <div className="space-y-1">
                    <MetricItem 
                        label="Total Revenue" 
                        value={data?.revenue} 
                        color="bg-emerald-500" 
                        icon={ArrowUpRight}
                        tooltip="Total income from all completed sales transactions."
                    />
                    <MetricItem 
                        label="Cost of Goods Sold (COGS)" 
                        value={data?.cogs} 
                        color="bg-amber-500" 
                        icon={TrendingDown}
                        tooltip="Total acquisition cost of products that were sold."
                    />
                    <div className="flex items-center justify-between py-3 border-b border-slate-100 bg-slate-50/50 px-3 rounded-md my-2">
                        <span className="text-sm font-bold text-slate-900 uppercase">Gross Profit</span>
                        <span className="text-base font-black text-slate-900">LKR {data?.grossProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <MetricItem 
                        label="Total Operating Expenses" 
                        value={data?.expenses} 
                        color="bg-red-500" 
                        icon={ArrowDownRight}
                        tooltip="Total sum of all expenses recorded (Rent, Electricity, etc.)"
                    />
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advisory Note */}
      <Card className="bg-blue-50 border-blue-100 shadow-none">
          <CardContent className="p-4 flex gap-3">
              <Info className="h-6 w-6 text-blue-500 shrink-0 mt-0.5" />
              <div>
                  <h4 className="font-bold text-blue-900 text-sm">Automated Calculation Note</h4>
                  <p className="text-xs text-blue-700 leading-relaxed mt-1">
                      Profit & Loss figures are estimates based on active sales records and cost prices at the time of sale. 
                      Inventory shrinkage, returns logistics, and unrecorded miscellaneous expenses may affect final accuracy.
                  </p>
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
