"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  BarChart3, 
  Search, 
  Download,
  Calendar,
  DollarSign,
  FileText,
  Printer,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

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
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

export default function TaxLiabilityReportPage() {
  const { data: session } = useSession();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/tax?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch tax report");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data.details);
        setSummary(result.data.summary);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tax report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = data.map(item => ({
      "Invoice No": item.invoice_number,
      "Date": format(new Date(item.created_at), 'yyyy-MM-dd HH:mm'),
      "Taxable Amount": item.total_amount,
      "Tax Amount": item.tax_amount,
      "Total Amount": item.payable_amount
    }));
    exportToCSV(exportData, "Tax_Liability_Report");
  };

  const handleExportExcel = () => {
    const exportData = data.map(item => ({
      "Invoice No": item.invoice_number,
      "Date": format(new Date(item.created_at), 'yyyy-MM-dd HH:mm'),
      "Taxable Amount": item.total_amount,
      "Tax Amount": item.tax_amount,
      "Total Amount": item.payable_amount
    }));
    exportToExcel(exportData, "Tax_Liability_Report");
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken, startDate, endDate, branchId]);

  return (
    <div className="p-8 space-y-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Tax Liability Report</h1>
          <p className="text-slate-500 dark:text-slate-400">Summary of tax collected from sales within the fiscal period.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border dark:border-slate-700 shadow-sm px-3">
              <Calendar className="h-4 w-4 text-slate-400" />
              <Input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 border-0 focus-visible:ring-0 w-32 px-0 bg-transparent"
              />
              <span className="text-slate-300 dark:text-slate-600">-</span>
              <Input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 border-0 focus-visible:ring-0 w-32 px-0 bg-transparent"
              />
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border dark:border-slate-700 shadow-sm px-3 h-10">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Store:</span>
            <select 
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="text-xs font-semibold bg-transparent border-0 focus:ring-0 cursor-pointer h-full outline-none text-slate-900 dark:text-white [&>option]:text-slate-900 [&>option]:dark:bg-slate-800 [&>option]:dark:text-white"
            >
              <option value="all">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2 dark:bg-slate-800 dark:border-slate-700">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="gap-2 dark:bg-slate-800 dark:border-slate-700">
            <FileText className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Total Taxable Value</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold dark:text-white">LKR {summary?.totalTaxable?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Gross sales before tax</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-600 dark:bg-blue-600/20 text-white dark:text-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100 dark:text-blue-200 uppercase">Total Tax Collected</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-32 bg-blue-500 dark:bg-blue-500/50" /> : <div className="text-2xl font-bold dark:text-blue-100">LKR {summary?.totalTax?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>}
            <p className="text-xs text-blue-100 mt-1">Liability to government</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Total Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold dark:text-white">LKR {summary?.totalPayable?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Inclusive of tax</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden dark:bg-slate-800 text-slate-900 dark:text-white">
        <CardHeader className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex flex-row items-center justify-between py-4">
            <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Tax Breakdown by Invoice</CardTitle>
                <CardDescription className="dark:text-slate-400">Itemized list of all transactions with tax components.</CardDescription>
            </div>
            <Printer className="h-5 w-5 text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300" />
        </CardHeader>
        <CardContent className="p-0 bg-white dark:bg-slate-900/50">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800">
              <TableRow className="dark:border-slate-700">
                <TableHead className="pl-6">Invoice No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Taxable Amount</TableHead>
                <TableHead className="text-right">Tax Amount</TableHead>
                <TableHead className="text-right pr-6">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow className="dark:border-slate-700">
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500 dark:text-slate-400">
                    No transactions found for the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-700/50">
                    <TableCell className="pl-6 font-medium text-slate-900 dark:text-slate-200">{item.invoice_number}</TableCell>
                    <TableCell className="text-sm text-slate-500 dark:text-slate-400">{format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                    <TableCell className="text-right text-slate-700 dark:text-slate-300 font-medium">LKR {Number(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400">LKR {Number(item.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right pr-6 font-black text-slate-900 dark:text-white">LKR {Number(item.payable_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 gap-4 border border-amber-100 dark:border-amber-500/20">
          <Info className="h-6 w-6 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200/90 leading-relaxed">
            <strong>Disclaimer:</strong> This report is for informational purposes for VAT/NBT estimation. Final tax liability must be verified by a certified accountant against actual tax invoice records and regional regulations.
          </p>
      </div>
    </div>
  );
}
