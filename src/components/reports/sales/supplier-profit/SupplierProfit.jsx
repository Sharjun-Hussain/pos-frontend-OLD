"use client";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import {
  Printer,
  Download,
  Search,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
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

export default function SupplierProfitPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/supplier-profit?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === "success") setData(result.data);
      else toast.error(result.message || "Failed to fetch profit data");
    } catch (error) { toast.error("Failed to load report"); }
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map((item) => ({
      Supplier: item.supplier_name,
      Revenue: item.revenue,
      Cost: item.cost,
      Profit: item.profit,
      "Margin (%)": item.margin.toFixed(2),
    }));
    exportToCSV(exportData, "Supplier_Profit_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((item) => ({
      Supplier: item.supplier_name,
      Revenue: item.revenue,
      Cost: item.cost,
      Profit: item.profit,
      "Margin (%)": item.margin.toFixed(2),
    }));
    exportToExcel(exportData, "Supplier_Profit_Report");
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken, date]);

  const filteredData = data.filter(item => item.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 p-8 bg-muted/30 min-h-screen space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Supplier Profitability</h1>
          <p className="text-sm text-muted-foreground">Analysis of profit generated per supplier source.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" /> Excel
          </Button>
          <Button className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm"><CardContent className="p-6 flex gap-4 items-end">
        <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-muted-foreground/60 uppercase">Period</label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-10 border-border/50">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}</> : format(date.from, "LLL dd")) : <span>Pick dates</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start"><Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2}/></PopoverContent>
            </Popover>
        </div>
        <div className="w-96 space-y-2">
            <label className="text-xs font-bold text-muted-foreground/60 uppercase">Search Supplier</label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                <Input placeholder="Supplier name..." className="pl-10 h-10" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)}/>
            </div>
        </div>
      </CardContent></Card>

      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="pl-6">Supplier Name</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Cost (COGS)</TableHead>
              <TableHead className="text-right">Gross Profit</TableHead>
              <TableHead className="text-right pr-6">Margin %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item, idx) => (
              <TableRow key={idx} className="hover:bg-muted/30">
                <TableCell className="pl-6 py-4 font-bold text-foreground border-l-4 border-l-transparent hover:border-l-emerald-500">
                    {item.supplier_name}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatCurrency(item.cost)}</TableCell>
                <TableCell className="text-right font-black text-emerald-600">{formatCurrency(item.profit)}</TableCell>
                <TableCell className="text-right pr-6">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold">{item.margin.toFixed(1)}%</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
