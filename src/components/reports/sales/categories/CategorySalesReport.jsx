"use client";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import {
  Printer,
  Download,
  Search,
  Calendar as CalendarIcon,
  Tag,
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
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function CategorySalesReportPage({ type = "main" }) {
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
        type,
        start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/categories?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data);
      } else {
        toast.error(result.message || "Failed to fetch category data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map((item) => ({
      "Category Name": item.category_name || "Uncategorized",
      "Total Quantity Sold": parseFloat(item.total_quantity).toFixed(0),
      "Total Revenue": parseFloat(item.total_revenue).toFixed(2),
      "Revenue Share (%)": ((parseFloat(item.total_revenue) / (totalRevenue || 1)) * 100).toFixed(1),
    }));
    exportToCSV(exportData, `${type}_Category_Sales_Report`);
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((item) => ({
      "Category Name": item.category_name || "Uncategorized",
      "Total Quantity Sold": parseFloat(item.total_quantity).toFixed(0),
      "Total Revenue": parseFloat(item.total_revenue).toFixed(2),
      "Revenue Share (%)": ((parseFloat(item.total_revenue) / (totalRevenue || 1)) * 100).toFixed(1),
    }));
    exportToExcel(exportData, `${type}_Category_Sales_Report`);
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken, date, type]);

  const filteredData = data.filter((item) =>
    (item.category_name || "Uncategorized").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = filteredData.reduce(
    (sum, item) => sum + parseFloat(item.total_revenue || 0),
    0
  );

  return (
    <div className="flex-1 p-8 bg-slate-50 min-h-screen space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 capitalize">
            {type} Category Sales
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Performance analysis grouped by {type} categories.
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
                Analysis Period
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 border-slate-200",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-full lg:w-96">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Search Category</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search categories..."
                  className="pl-10 h-10 border-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 flex flex-col justify-center border-l-4 border-l-blue-500">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
             Total Categories Sold
          </p>
          <h3 className="text-3xl font-bold">{filteredData.length}</h3>
        </Card>
        <Card className="p-6 flex flex-col justify-center border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Revenue
          </p>
          <h3 className="text-3xl font-bold">{formatCurrency(totalRevenue)}</h3>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="pl-6">Category Name</TableHead>
              <TableHead className="text-center">Total Quantity Sold</TableHead>
              <TableHead className="text-right">Total Revenue</TableHead>
              <TableHead className="text-right pr-6">Revenue Share %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="pl-6 font-semibold text-slate-900 flex items-center gap-3 py-4">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <Tag className="h-4 w-4 text-slate-400" />
                    </div>
                    {item.category_name || "Uncategorized"}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {parseFloat(item.total_quantity).toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900">
                    {formatCurrency(item.total_revenue)}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-3">
                        <span className="text-xs text-slate-500">
                            {((parseFloat(item.total_revenue) / (totalRevenue || 1)) * 100).toFixed(1)}%
                        </span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500" 
                                style={{ width: `${(parseFloat(item.total_revenue) / (totalRevenue || 1)) * 100}%` }}
                            />
                        </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500 italic">
                  No sales data found for Categories.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
