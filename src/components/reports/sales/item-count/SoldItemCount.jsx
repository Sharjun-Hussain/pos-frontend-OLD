"use client";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import {
  Printer,
  Download,
  Search,
  Calendar as CalendarIcon,
  Package,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { Calendar } from "@/components/ui/calendar";
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
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function SoldItemCountPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/item-count?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data);
      } else {
        toast.error(result.message || "Failed to fetch item data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map((item) => ({
      Product: item.product?.name,
      Code: item.product?.code || item.variant?.sku || "N/A",
      Variant: item.variant?.name || "Standard",
      "Quantity Sold": parseFloat(item.count || 0).toFixed(0),
    }));
    exportToCSV(exportData, "Sold_Item_Count_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((item) => ({
      Product: item.product?.name,
      Code: item.product?.code || item.variant?.sku || "N/A",
      Variant: item.variant?.name || "Standard",
      "Quantity Sold": parseFloat(item.count || 0).toFixed(0),
    }));
    exportToExcel(exportData, "Sold_Item_Count_Report");
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken, date]);

  const filteredData = data.filter((item) =>
    item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product?.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalQty = filteredData.reduce(
    (sum, item) => sum + parseFloat(item.count || 0),
    0
  );

  return (
    <div className="flex-1 p-8 bg-muted/30 min-h-screen space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sold Item Count
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Total quantities sold for each product within the selected period.
          </p>
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

      <Card className="border-none shadow-sm bg-card">
        <CardContent className="p-6 flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Analysis Period</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left h-10 border-border/50">
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
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Search Product</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input 
                        placeholder="Search product name or code..." 
                        className="pl-10 h-10" 
                        value={searchQuery}
                        onChange={(e)=>setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </CardContent>
      </Card>

      <Card className="p-6 flex flex-col justify-center border-l-4 border-l-slate-900 w-fit min-w-[300px]">
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider mb-1">Total Items Sold (Qty)</p>
          <h3 className="text-3xl font-black text-foreground">{totalQty.toFixed(0)}</h3>
      </Card>

      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="pl-6">Product</TableHead>
              <TableHead>Code / SKU</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead className="text-right pr-6">Quantity Sold</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item, idx) => (
                <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="pl-6 font-semibold text-foreground py-4 flex items-center gap-3">
                     <div className="p-2 bg-background rounded-lg"><Package className="h-4 w-4 text-muted-foreground/60" /></div>
                     {item.product?.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {item.product?.code || item.variant?.sku || "N/A"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.variant?.name || "Standard"}
                  </TableCell>
                  <TableCell className="text-right pr-6 font-black text-lg text-foreground">
                    {parseFloat(item.count).toFixed(0)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">No sales found for the selected period.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
