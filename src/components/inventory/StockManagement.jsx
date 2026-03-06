"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
    Search, 
    Filter, 
    RefreshCcw, 
    MoreHorizontal, 
    ArrowRightLeft, 
    SlidersHorizontal,
    Box,
    Warehouse,
    AlertCircle,
    Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import StockAdjustmentDialog from "./StockAdjustmentDialog";

const StockManagement = () => {
    const { data: session } = useSession();
    const { hasPermission } = usePermission();
    const [loading, setLoading] = useState(true);
    const [stocks, setStocks] = useState([]);
    const [branches, setBranches] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    
    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("all");
    
    // Dialog States
    const [adjustmentOpen, setAdjustmentOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);

    const fetchData = async (page = 1) => {
        if (!session?.accessToken) return;
        setLoading(true);
        try {
            const branchQuery = selectedBranch !== "all" ? `&branch_id=${selectedBranch}` : "";
            const searchParams = new URLSearchParams({
                page,
                size: pagination.limit,
                product_name: searchQuery
            });

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stocks?${searchParams.toString()}${branchQuery}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (data.status === "success") {
                // Handle paginatedResponse structure { data: { data: [], pagination: {} } }
                setStocks(data.data.data || []);
                setPagination(data.data.pagination || pagination);
            }
        } catch (error) {
            console.error("Error fetching stocks:", error);
            toast.error("Failed to load stock data");
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        if (!session?.accessToken) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (data.status === "success") {
                // branches API also uses paginatedResponse
                setBranches(data.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchBranches();
    }, [session?.accessToken, selectedBranch]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') fetchData(1);
    };

    const openAdjustment = (stock) => {
        setSelectedStock(stock);
        setAdjustmentOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Box className="h-6 w-6 text-indigo-600" />
                        Stock Management
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Monitor and manage inventory levels across all branches.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchData()} 
                        disabled={loading}
                        className="h-9 gap-2"
                    >
                        <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Search product name..." 
                                    className="pl-9 h-9 border-slate-200"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearch}
                                />
                            </div>
                            <Button size="sm" onClick={() => fetchData(1)} className="h-9">Search</Button>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                    <SelectTrigger className="w-[180px] h-9 border-slate-200">
                                        <SelectValue placeholder="All Branches" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Branches</SelectItem>
                                        {branches.map(branch => (
                                            <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-slate-100">
                                <TableHead className="font-bold text-slate-600 py-4 pl-6">Product</TableHead>
                                <TableHead className="font-bold text-slate-600">Branch</TableHead>
                                <TableHead className="font-bold text-slate-600">Variant</TableHead>
                                <TableHead className="font-bold text-slate-600 text-right">Quantity</TableHead>
                                <TableHead className="font-bold text-slate-600 text-right pr-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && stocks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic">
                                        Loading inventory data...
                                    </TableCell>
                                </TableRow>
                            ) : stocks.length > 0 ? (
                                stocks.map((stock) => (
                                    <TableRow key={stock.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                                                    {stock.product?.image ? (
                                                        <img src={stock.product.image} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="h-5 w-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{stock.product?.name}</h4>
                                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{stock.product?.code}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Warehouse className="h-3 w-3 text-slate-400" />
                                                <span className="text-xs font-medium text-slate-600">{stock.branch?.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {stock.variant ? (
                                                <Badge variant="outline" className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border-indigo-100">
                                                    {stock.variant.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 italic">No variant</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={cn(
                                                    "text-sm font-black",
                                                    parseFloat(stock.quantity) <= 0 ? "text-red-600" : 
                                                    parseFloat(stock.quantity) <= 10 ? "text-amber-600" : "text-slate-900"
                                                )}>
                                                    {parseFloat(stock.quantity).toFixed(2)}
                                                </span>
                                                {parseFloat(stock.quantity) <= 0 && (
                                                    <span className="text-[9px] text-red-500 font-bold uppercase flex items-center gap-0.5">
                                                        <AlertCircle className="h-2 w-2" /> Out of Stock
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    {hasPermission(PERMISSIONS.STOCK_EDIT) && (
                                                        <DropdownMenuItem 
                                                            onClick={() => openAdjustment(stock)}
                                                            className="gap-2"
                                                        >
                                                            <SlidersHorizontal className="h-4 w-4" /> Adjust Stock
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center text-slate-400 font-medium italic">
                                        No stock records found matching your filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {stocks.length > 0 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-slate-500 font-medium">
                        Showing {stocks.length} of {pagination.total} records
                    </p>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={pagination.page <= 1}
                            onClick={() => fetchData(pagination.page - 1)}
                            className="h-8 text-[11px] font-bold uppercase tracking-wider"
                        >
                            Previous
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                            onClick={() => fetchData(pagination.page + 1)}
                            className="h-8 text-[11px] font-bold uppercase tracking-wider"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {adjustmentOpen && (
                <StockAdjustmentDialog 
                    open={adjustmentOpen} 
                    onOpenChange={setAdjustmentOpen} 
                    stock={selectedStock}
                    onSuccess={() => fetchData(pagination.page)}
                />
            )}
        </div>
    );
};

export default StockManagement;
