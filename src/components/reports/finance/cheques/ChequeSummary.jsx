"use client";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Printer,
  Download,
  CreditCard,
  History,
  AlertCircle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ChequeSummaryPage() {
  const { data: session } = useSession();
  const { formatCurrency, formatDate } = useAppSettings();
  const [data, setData] = useState({
    details: [],
    summary: { total: 0 }
  });
  const [type, setType] = useState("receivable");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/cheques?type=${type}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data);
      } else {
        toast.error(result.message || "Failed to fetch cheque data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = data.details.map((item) => ({
      "Cheque #": item.cheque_number,
      Bank: item.bank_name,
      "Payee/Payor": item.payee_payor_name || "N/A",
      Date: item.cheque_date,
      Amount: item.amount,
      Status: item.status,
      Branch: item.branch?.name,
    }));
    exportToCSV(exportData, `Cheque_${type}_Report`);
  };

  const handleExportExcel = () => {
    const exportData = data.details.map((item) => ({
      "Cheque #": item.cheque_number,
      Bank: item.bank_name,
      "Payee/Payor": item.payee_payor_name || "N/A",
      Date: item.cheque_date,
      Amount: item.amount,
      Status: item.status,
      Branch: item.branch?.name,
    }));
    exportToExcel(exportData, `Cheque_${type}_Report`);
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken, type]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'cleared': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Cleared</Badge>;
      case 'pending': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case 'bounced': return <Badge variant="destructive">Bounced</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 p-8 bg-slate-50 min-h-screen space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cheque Summary
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Detailed list and status overview of all cheques.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" /> Excel
          </Button>
          <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <Tabs value={type} onValueChange={setType} className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2 bg-white border border-slate-200 p-1 rounded-xl">
          <TabsTrigger value="receivable" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
             Receivable (Customers)
          </TabsTrigger>
          <TabsTrigger value="payable" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
             Payable (Suppliers)
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-center bg-white border-none shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Cheque Amount</p>
          <h3 className="text-xl font-bold text-slate-800">{formatCurrency(data.summary.total)}</h3>
        </Card>
        <Card className="p-4 flex flex-col justify-center bg-white border-none shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cleared</p>
          <h3 className="text-xl font-bold text-emerald-600">{formatCurrency(data.summary.cleared || 0)}</h3>
        </Card>
        <Card className="p-4 flex flex-col justify-center bg-white border-none shadow-sm border-l-4 border-l-amber-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending</p>
          <h3 className="text-xl font-bold text-amber-600">{formatCurrency(data.summary.pending || 0)}</h3>
        </Card>
        <Card className="p-4 flex flex-col justify-center bg-white border-none shadow-sm border-l-4 border-l-red-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bounced</p>
          <h3 className="text-xl font-bold text-red-600">{formatCurrency(data.summary.bounced || 0)}</h3>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="pl-6">Cheque #</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Payee/Payor</TableHead>
              <TableHead>Cheque Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right pr-6">Branch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.details.length > 0 ? (
              data.details.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="pl-6 font-mono text-xs font-bold text-blue-600">
                    {item.cheque_number}
                  </TableCell>
                  <TableCell className="text-slate-600 font-medium">
                    {item.bank_name}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {item.payee_payor_name || "N/A"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDate(item.cheque_date)}
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-900">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell className="text-right pr-6 text-slate-400 text-xs">
                    {item.branch?.name}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500 italic">
                  No {type} cheques found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
