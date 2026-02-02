"use client";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect } from "react";
import {
  Printer,
  Download,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Scale,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";

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
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
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
    const exportData = allAccounts.map((item) => ({
      Account: item.name,
      Code: item.code,
      Category: item.Category,
      Balance: item.balance
    }));
    exportToCSV(exportData, "Capital_Balance_Report");
  };

  const handleExportExcel = () => {
    const allAccounts = [
      ...data.assets.map(a => ({ ...a, Category: 'Asset' })),
      ...data.liabilities.map(a => ({ ...a, Category: 'Liability' })),
      ...data.equity.map(a => ({ ...a, Category: 'Equity' }))
    ];
    const exportData = allAccounts.map((item) => ({
      Account: item.name,
      Code: item.code,
      Category: item.Category,
      Balance: item.balance
    }));
    exportToExcel(exportData, "Capital_Balance_Report");
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken]);

  return (
    <div className="flex-1 p-8 bg-slate-50 min-h-screen space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Capital Balance (Net Worth)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
             Financial snapshot of your business assets and liabilities.
          </p>
        </div>

        <div className="flex gap-2">
           <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="gap-2">
            <FileText className="h-4 w-4" /> Excel
          </Button>
          <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-none bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-blue-50 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Assets</p>
                   <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(data.summary.totalAssets)}</h3>
                </div>
            </div>
            <p className="text-[10px] text-slate-500 italic mt-2">Cash + Inventory + Receivables</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-red-50 rounded-xl">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Liabilities</p>
                   <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(data.summary.totalLiabilities)}</h3>
                </div>
            </div>
            <p className="text-[10px] text-slate-500 italic mt-2">Accounts Payable + Loans</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-emerald-900 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-emerald-800 rounded-xl">
                    <Scale className="h-6 w-6 text-emerald-300" />
                </div>
                <div>
                   <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Net Worth (Capital)</p>
                   <h3 className="text-2xl font-bold text-white">{formatCurrency(data.summary.netWorth)}</h3>
                </div>
            </div>
            <p className="text-[10px] text-emerald-400 italic mt-2">Business Equity / Retained Earnings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ASSETS TABLE */}
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-white border-b border-slate-50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                Assets
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right pr-6">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.assets.length > 0 ? data.assets.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-medium">{acc.name}</TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">{acc.code}</TableCell>
                  <TableCell className="text-right pr-6 font-bold text-blue-700">{formatCurrency(acc.balance)}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400 italic">No asset accounts found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <div className="p-4 bg-slate-50 border-t flex justify-between items-center text-sm font-bold">
              <span>TOTAL ASSETS</span>
              <span className="text-blue-600">{formatCurrency(data.summary.totalAssets)}</span>
          </div>
        </Card>

        {/* LIABILITIES TABLE */}
        <div className="space-y-8">
            <Card className="border-none shadow-sm">
            <CardHeader className="bg-white border-b border-slate-50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                    Liabilities
                </CardTitle>
            </CardHeader>
            <Table>
                <TableHeader className="bg-slate-50/50">
                <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right pr-6">Balance</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {data.liabilities.length > 0 ? data.liabilities.map((acc) => (
                    <TableRow key={acc.id}>
                    <TableCell className="font-medium">{acc.name}</TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">{acc.code}</TableCell>
                    <TableCell className="text-right pr-6 font-bold text-red-700">{formatCurrency(acc.balance)}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400 italic">No liability accounts found</TableCell></TableRow>
                )}
                </TableBody>
            </Table>
            <div className="p-4 bg-slate-50 border-t flex justify-between items-center text-sm font-bold">
                <span>TOTAL LIABILITIES</span>
                <span className="text-red-600">{formatCurrency(data.summary.totalLiabilities)}</span>
            </div>
            </Card>

            <Card className="border-none shadow-sm bg-emerald-50">
                <div className="p-6 flex justify-between items-center">
                    <div>
                        <h4 className="text-lg font-bold text-emerald-900">Total Capital</h4>
                        <p className="text-xs text-emerald-700">Assets minus Liabilities</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-black text-emerald-900">{formatCurrency(data.summary.netWorth)}</h2>
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}
