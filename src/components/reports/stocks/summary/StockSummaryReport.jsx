"use client";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect } from "react";
import {
  Printer,
  Download,
  Search,
  Package,
  AlertTriangle,
  FileText,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";

export default function StockSummaryReportPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [branch, setBranch] = useState("all");
  const [category, setCategory] = useState("all");
  const [subCategory, setSubCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [branchOpen, setBranchOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subCategoryOpen, setSubCategoryOpen] = useState(false);

  const fetchMetadata = async () => {
    if (!session?.accessToken) return;
    try {
      const [branchRes, catRes, subCatRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sub-categories`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        })
      ]);
      const branchData = await branchRes.json();
      const catData = await catRes.json();
      const subCatData = await subCatRes.json();
      if (branchData.status === 'success') setBranches(branchData.data || []);
      if (catData.status === 'success') setCategories(catData.data || []);
      if (subCatData.status === 'success') {
          // The /sub-categories endpoint returns paginated data (data.data.data) or a flat array (data.data)
          setSubCategories(subCatData.data?.data || subCatData.data || []);
      }
    } catch (err) { console.error(err); }
  };

  const fetchData = async () => {
    if (!session?.accessToken) return;
    try {
      const queryParams = new URLSearchParams({
        branch_id: branch,
        main_category_id: category,
        sub_category_id: subCategory
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/summary?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data);
      } else {
        toast.error(result.message || "Failed to fetch stock summary");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, [session?.accessToken]);

  const handleExportCSV = () => {
    const exportData = filteredData.map((item) => ({
      Branch: item.branch?.name,
      Category: item.product?.main_category?.name,
      Product: item.product?.name,
      Variant: item.variant?.name || "Standard",
      SKU: item.variant?.sku || item.product?.code,
      Quantity: item.quantity,
      "Reorder Level": item.product?.reorder_level || 0,
      Status: Number(item.quantity) <= Number(item.product?.reorder_level || 0) ? "Low Stock" : "OK",
    }));
    exportToCSV(exportData, "Stock_Summary_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((item) => ({
      Branch: item.branch?.name,
      Category: item.product?.main_category?.name,
      Product: item.product?.name,
      Variant: item.variant?.name || "Standard",
      SKU: item.variant?.sku || item.product?.code,
      Quantity: item.quantity,
      "Reorder Level": item.product?.reorder_level || 0,
      Status: Number(item.quantity) <= Number(item.product?.reorder_level || 0) ? "Low Stock" : "OK",
    }));
    exportToExcel(exportData, "Stock_Summary_Report");
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken, branch, category, subCategory]);

  const filteredData = data.filter((item) =>
    item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product?.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 bg-background max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20">
            <Package className="w-6 h-6 text-[#10b981]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Current Stock Summary
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time inventory levels across all branches and products.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="gap-2 bg-card border-border/50 shadow-sm hover:bg-muted/30">
            <Download className="h-4 w-4 text-muted-foreground" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="gap-2 bg-card border-border/50 shadow-sm hover:bg-muted/30">
            <FileText className="h-4 w-4 text-muted-foreground" /> Excel
          </Button>
          <Button className="gap-2 bg-[#10b981] hover:bg-[#059669] shadow-sm text-white">
            <Printer className="h-4 w-4 text-emerald-100" /> Print
          </Button>
        </div>
      </div>

      <Card className="border border-border/50 shadow-sm bg-card mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
             <div className="w-full space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch</label>
                <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={branchOpen}
                      className="w-full justify-between h-11 rounded-xl border-border/50 bg-background font-normal"
                    >
                      {branch === "all" ? "All Branches" : branches.find((b) => String(b.id) === String(branch))?.name || "All Branches"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search branch..." />
                      <CommandList>
                        <CommandEmpty>No branch found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="All Branches"
                            onSelect={() => {
                              setBranch("all");
                              setBranchOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", branch === "all" ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                            All Branches
                          </CommandItem>
                          {branches.map((b) => (
                            <CommandItem
                              key={b.id}
                              value={b.name}
                              onSelect={() => {
                                setBranch(b.id);
                                setBranchOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", String(branch) === String(b.id) ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                              {b.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
            </div>
            
            <div className="w-full space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={categoryOpen}
                      className="w-full justify-between h-11 rounded-xl border-border/50 bg-background font-normal"
                    >
                      {category === "all" ? "All Categories" : categories.find((c) => String(c.id) === String(category))?.name || "All Categories"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search category..." />
                      <CommandList>
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="All Categories"
                            onSelect={() => {
                              setCategory("all");
                              setCategoryOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", category === "all" ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                            All Categories
                          </CommandItem>
                          {categories.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.name}
                              onSelect={() => {
                                setCategory(c.id);
                                setCategoryOpen(false);
                                setSubCategory("all"); // Reset subcategory when main changes
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", String(category) === String(c.id) ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                              {c.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
            </div>

            <div className="w-full space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sub-Category</label>
                <Popover open={subCategoryOpen} onOpenChange={setSubCategoryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={subCategoryOpen}
                      className="w-full justify-between h-11 rounded-xl border-border/50 bg-background font-normal"
                      disabled={category === "all"} // Only enable if a main category is selected
                    >
                      {subCategory === "all" ? "All Sub-Categories" : subCategories.find((s) => String(s.id) === String(subCategory))?.name || "All Sub-Categories"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search sub-category..." />
                      <CommandList>
                        <CommandEmpty>No sub-category found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="All Sub-Categories"
                            onSelect={() => {
                              setSubCategory("all");
                              setSubCategoryOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", subCategory === "all" ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                            All Sub-Categories
                          </CommandItem>
                          {subCategories
                            .filter(s => String(s.main_category_id) === String(category))
                            .map((s) => (
                            <CommandItem
                              key={s.id}
                              value={s.name}
                              onSelect={() => {
                                setSubCategory(s.id);
                                setSubCategoryOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", String(subCategory) === String(s.id) ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                              {s.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
            </div>

            <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Search Product</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input 
                        placeholder="Search product name or SKU..." 
                        className="pl-10 h-11 rounded-xl border-border/50 bg-background" 
                        value={searchQuery}
                        onChange={(e)=>setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-t-xl border-x border-t border-border overflow-hidden bg-background/50 transition-colors duration-500">
        <Table>
          <TableHeader className="bg-sidebar-accent/20 backdrop-blur-md">
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="pl-6 h-12 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Product & Variant</TableHead>
              <TableHead className="h-12 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</TableHead>
              <TableHead className="h-12 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch</TableHead>
              <TableHead className="text-center h-12 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Min Level</TableHead>
              <TableHead className="text-right pr-6 h-12 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => {
                const isLow = parseFloat(item.quantity) <= parseFloat(item.product?.reorder_level || 0);
                return (
                    <TableRow key={item.id} className="hover:bg-sidebar-accent/15 border-b border-border/30 last:border-0 transition-all duration-200 group">
                    <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "p-2 rounded-lg",
                                isLow ? "bg-amber-500/10 text-amber-600 dark:text-amber-500" : "bg-sidebar-accent/50 text-foreground"
                            )}>
                                <Package className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">{item.product?.name}</p>
                                <p className="text-[11px] text-muted-foreground font-medium">{item.variant?.name || "Standard"} • {item.variant?.sku || item.product?.code}</p>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="text-[10px] bg-background text-muted-foreground border-border/50">
                            {item.product?.main_category?.name || "Uncategorized"}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                        {item.branch?.name}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground font-semibold">
                        {item.product?.reorder_level || 0}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                        <div className="flex flex-col items-end">
                            <span className={cn(
                                "text-[15px] font-bold font-mono tracking-tight",
                                isLow ? "text-amber-600 dark:text-amber-500" : "text-foreground"
                            )}>{parseFloat(item.quantity).toFixed(0)}</span>
                            {isLow && (
                                <div className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase tracking-tight">
                                    <AlertTriangle className="h-3 w-3" /> Low Stock
                                </div>
                            )}
                        </div>
                    </TableCell>
                    </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs opacity-50">No stock records found matching your filters.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
