"use client";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import {
  Printer,
  Download,
  Search,
  Calendar as CalendarIcon,
  Box,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function NonStockSalesPage() {
  const { data: session } = useSession();
  const { formatCurrency, formatDate } = useAppSettings();
  const [date, setDate] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    if (!session?.accessToken) return;
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/non-stock?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === "success") setData(result.data);
    } catch (error) { toast.error("Failed to load report"); }
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map((item) => ({
      Invoice: item.sale?.invoice_number,
      Date: item.sale?.created_at,
      Product: item.product?.name,
      Code: item.product?.code,
      Quantity: item.quantity,
      Price: item.unit_price,
      Total: item.total_amount,
    }));
    exportToCSV(exportData, "Non_Stock_Sales_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((item) => ({
      Invoice: item.sale?.invoice_number,
      Date: item.sale?.created_at,
      Product: item.product?.name,
      Code: item.product?.code,
      Quantity: item.quantity,
      Price: item.unit_price,
      Total: item.total_amount,
    }));
    exportToExcel(exportData, "Non_Stock_Sales_Report");
  };

  useEffect(() => { fetchData(); }, [session?.accessToken, date]);

  const filteredData = data.filter(item => 
    item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product?.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 bg-slate-50 min-h-screen space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Non-Stock Sales summary</h1>
          <p className="text-sm text-slate-500">Sales tracking for items not managed in inventory (Services, Digital, etc.)</p>
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

      <Card className="border-none shadow-sm"><CardContent className="p-6 flex gap-4 items-end">
        <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-400">Date Range</label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-10 border-slate-200">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}</> : format(date.from, "LLL dd")) : <span>Pick dates</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start"><Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2}/></PopoverContent>
            </Popover>
        </div>
        <div className="w-96 space-y-2">
            <label className="text-xs font-bold text-slate-400">Search Item</label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input placeholder="Service or Item name..." className="pl-10 h-10" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)}/>
            </div>
        </div>
      </CardContent></Card>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="pl-6">Service/Item Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-center">Quantity</TableHead>
              <TableHead className="text-right pr-6">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item, idx) => (
              <TableRow key={idx} className="hover:bg-slate-50">
                <TableCell className="pl-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                    <PackageOpen className="h-4 w-4 text-slate-400" />
                    {item.product?.name}
                </TableCell>
                <TableCell className="text-slate-500 text-xs font-mono">{item.product?.code}</TableCell>
                <TableCell className="text-center">{parseFloat(item.quantity).toFixed(0)}</TableCell>
                <TableCell className="text-right pr-6 font-bold">{formatCurrency(item.total_amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
