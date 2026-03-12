"use client";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect } from "react";
import {
  Printer,
  Download,
  FileText,
  TrendingDown,
  TrendingUp,
  Scale,
  Landmark,
  RefreshCw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CapitalBalancePage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [data, setData] = useState({
    assets: [],
    liabilities: [],
    equity: [],
    summary: { totalAssets: 0, totalLiabilities: 0, netWorth: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/capital-balance`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data);
      } else {
        toast.error(result.message || "Failed to fetch financial data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const allAccounts = [
      ...data.assets.map(a => ({ ...a, Category: 'Asset' })),
      ...data.liabilities.map(a => ({ ...a, Category: 'Liability' })),
      ...data.equity.map(a => ({ ...a, Category: 'Equity' }))
    ];
    exportToCSV(allAccounts.map(item => ({
      Account: item.name, Code: item.code, Category: item.Category, Balance: item.balance
    })), "Capital_Balance_Report");
  };

  const handleExportExcel = () => {
    const allAccounts = [
      ...data.assets.map(a => ({ ...a, Category: 'Asset' })),
      ...data.liabilities.map(a => ({ ...a, Category: 'Liability' })),
      ...data.equity.map(a => ({ ...a, Category: 'Equity' }))
    ];
    exportToExcel(allAccounts.map(item => ({
      Account: item.name, Code: item.code, Category: item.Category, Balance: item.balance
    })), "Capital_Balance_Report");
  };

  useEffect(() => { fetchData(); }, [session?.accessToken]);

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-background max-w-[1400px] mx-auto w-full font-sans text-foreground pb-20">

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Capital Balance</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Financial Hub</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Reports</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Net Worth</span>
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
          <Button onClick={() => window.print()} className="bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20 gap-2 hover:bg-[#0da371] h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-none transition-all active:scale-95">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button onClick={fetchData} className="h-10 w-10 rounded-xl bg-card border border-border/50 text-foreground hover:bg-muted/30 shadow-sm transition-all active:scale-95" variant="outline" disabled={isLoading}>
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* --- SUMMARY STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Total Assets */}
        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-blue-500/10" />
          <CardContent className="p-7">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500 text-blue-600 shadow-inner">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground/80 mb-1 uppercase tracking-tight">Total Assets</p>
                <h3 className="text-2xl font-bold text-foreground tabular-nums">
                  {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(data.summary.totalAssets)}
                </h3>
                <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">Cash · Inventory · Receivables</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Liabilities */}
        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-red-500/10" />
          <CardContent className="p-7">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 group-hover:scale-110 transition-transform duration-500 text-red-600 shadow-inner">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground/80 mb-1 uppercase tracking-tight">Total Liabilities</p>
                <h3 className="text-2xl font-bold text-foreground tabular-nums">
                  {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(data.summary.totalLiabilities)}
                </h3>
                <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">Payables · Loans · Obligations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Worth */}
        <Card className="border-none shadow-sm bg-[#10b981] overflow-hidden group hover:shadow-md transition-all duration-500 relative text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-white/20" />
          <CardContent className="p-7">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-white/20 border border-white/30 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/80 mb-1 uppercase tracking-tight">Net Worth (Capital)</p>
                <h3 className="text-2xl font-bold tabular-nums">
                  {isLoading ? <Skeleton className="h-8 w-32 bg-white/20" /> : formatCurrency(data.summary.netWorth)}
                </h3>
                <p className="text-[10px] text-white/60 mt-1 font-medium">Business Equity · Retained Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- TABLES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ASSETS TABLE */}
        <Card className="border-none shadow-sm overflow-hidden bg-card">
          <CardHeader className="pb-4 border-b border-border/30 bg-muted/5">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-blue-500" />
              <div>
                <CardTitle className="text-base font-bold text-foreground">Assets</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-0.5">Resources owned and controlled by the business</CardDescription>
              </div>
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="pl-6 font-bold text-foreground py-4">Account Name</TableHead>
                <TableHead className="font-bold text-foreground">Code</TableHead>
                <TableHead className="text-right pr-6 font-bold text-foreground">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    <TableCell className="pl-6 py-4"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data.assets.length > 0 ? data.assets.map((acc) => (
                <TableRow key={acc.id} className="hover:bg-muted/30 transition-colors border-border/40">
                  <TableCell className="pl-6 py-4 font-semibold text-foreground text-sm">{acc.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono bg-muted/20 rounded">{acc.code}</TableCell>
                  <TableCell className="text-right pr-6 font-black text-blue-600 dark:text-blue-400 tabular-nums">{formatCurrency(acc.balance)}</TableCell>
                </TableRow>
              )) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="text-center py-12 text-muted-foreground/40 italic font-medium text-sm">No asset accounts found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="px-6 py-4 flex justify-between items-center border-t border-border/30 bg-muted/5">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Assets</span>
            <span className="text-base font-black text-blue-600 dark:text-blue-400 tabular-nums">{isLoading ? <Skeleton className="h-5 w-28" /> : formatCurrency(data.summary.totalAssets)}</span>
          </div>
        </Card>

        {/* LIABILITIES + EQUITY */}
        <div className="space-y-6">

          {/* Liabilities Table */}
          <Card className="border-none shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-4 border-b border-border/30 bg-muted/5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-red-500" />
                <div>
                  <CardTitle className="text-base font-bold text-foreground">Liabilities</CardTitle>
                  <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-0.5">Financial obligations owed by the business</CardDescription>
                </div>
              </div>
            </CardHeader>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="pl-6 font-bold text-foreground py-4">Account Name</TableHead>
                  <TableHead className="font-bold text-foreground">Code</TableHead>
                  <TableHead className="text-right pr-6 font-bold text-foreground">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-border/40">
                      <TableCell className="pl-6 py-4"><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell className="pr-6"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : data.liabilities.length > 0 ? data.liabilities.map((acc) => (
                  <TableRow key={acc.id} className="hover:bg-muted/30 transition-colors border-border/40">
                    <TableCell className="pl-6 py-4 font-semibold text-foreground text-sm">{acc.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono bg-muted/20 rounded">{acc.code}</TableCell>
                    <TableCell className="text-right pr-6 font-black text-red-600 dark:text-red-400 tabular-nums">{formatCurrency(acc.balance)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="text-center py-12 text-muted-foreground/40 italic font-medium text-sm">No liability accounts found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="px-6 py-4 flex justify-between items-center border-t border-border/30 bg-muted/5">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Liabilities</span>
              <span className="text-base font-black text-red-600 dark:text-red-400 tabular-nums">{isLoading ? <Skeleton className="h-5 w-28" /> : formatCurrency(data.summary.totalLiabilities)}</span>
            </div>
          </Card>

          {/* Net Capital Card */}
          <Card className="border-none shadow-sm bg-[#10b981] overflow-hidden text-white">
            <CardContent className="p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-1">Total Capital</p>
                  <p className="text-xs text-white/50 font-medium">Assets minus Liabilities</p>
                </div>
                <div className="text-right">
                  <h2 className="text-4xl font-black tabular-nums">
                    {isLoading ? <Skeleton className="h-10 w-36 bg-white/20" /> : formatCurrency(data.summary.netWorth)}
                  </h2>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-none shadow-sm bg-[#10b981]/5 overflow-hidden font-sans">
        <CardContent className="p-6">
          <div className="flex gap-5">
            <div className="p-3 rounded-2xl bg-[#10b981]/10 text-[#10b981] shrink-0">
              <Info className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-[#10b981] text-sm mb-2 uppercase tracking-widest">Capital Balance Intelligence</h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                The Capital Balance (or Net Worth) represents the financial health of your business. A positive net worth means assets exceed liabilities, indicating financial stability and retained earnings over time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
