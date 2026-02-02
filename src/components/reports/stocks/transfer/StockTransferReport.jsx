"use client";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import {
  Printer,
  Download,
  Search,
  Calendar as CalendarIcon,
  Truck,
  ArrowRight,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function StockTransferReportPage() {
  const { data: session } = useSession();
  const { formatDate } = useAppSettings();
  const [date, setDate] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    if (!session?.accessToken) return;
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/transfers?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data);
      } else {
        toast.error(result.message || "Failed to fetch transfer data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map((item) => ({
      "Transfer #": item.transfer_number,
      Date: item.transfer_date,
      From: item.from_branch?.name,
      To: item.to_branch?.name,
      Items: item.items?.length || 0,
      Status: item.status,
      "Processed By": item.user?.name,
    }));
    exportToCSV(exportData, "Stock_Transfer_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((item) => ({
      "Transfer #": item.transfer_number,
      Date: item.transfer_date,
      From: item.from_branch?.name,
      To: item.to_branch?.name,
      Items: item.items?.length || 0,
      Status: item.status,
      "Processed By": item.user?.name,
    }));
    exportToExcel(exportData, "Stock_Transfer_Report");
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken, date]);

  const filteredData = data.filter((item) =>
    item.transfer_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.from_branch?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.to_branch?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 bg-slate-50 min-h-screen space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Stock Transfers history
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Logs of all internal stock movements between branches.
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

      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Transfer Period
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left h-10 border-slate-200">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (date.to ? <>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</> : format(date.from, "LLL dd, y")) : <span>Pick a date range</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-full lg:w-96 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Transfers</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search by transfer # or branch..." 
                        className="pl-10 h-10" 
                        value={searchQuery}
                        onChange={(e)=>setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="pl-6">Transfer #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Route</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right pr-6">Processed By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="pl-6 font-mono text-xs font-bold text-slate-900">
                    {item.transfer_number}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(item.transfer_date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">{item.from_branch?.name}</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span className="font-semibold text-blue-600">{item.to_branch?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none px-2 h-5">
                        {item.items?.length || 0} Items
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn(
                        "uppercase text-[10px] h-5",
                        item.status === 'completed' ? "bg-green-50 text-green-700 border-green-100" :
                        item.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                        "bg-red-50 text-red-700 border-red-100"
                    )}>
                        {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 text-xs text-slate-500">
                    {item.user?.name}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500 italic">No transfers found for the selected criteria.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
