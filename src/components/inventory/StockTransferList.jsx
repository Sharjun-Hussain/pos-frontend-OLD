"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
    Search, 
    RefreshCcw, 
    Plus, 
    ArrowRightLeft,
    Calendar,
    Warehouse,
    User,
    ChevronRight,
    FileText
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import StockTransferCreate from "./StockTransferCreate";
import StockTransferDetails from "./StockTransferDetails";

const StockTransferList = () => {
    const { data: session } = useSession();
    const { hasPermission } = usePermission();
    const [loading, setLoading] = useState(true);
    const [transfers, setTransfers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    
    // Dialog States
    const [createOpen, setCreateOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedTransferId, setSelectedTransferId] = useState(null);

    const fetchData = async (page = 1) => {
        if (!session?.accessToken) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stocks/transfers?page=${page}&size=${pagination.limit}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (data.status === "success") {
                // Handle paginatedResponse structure { data: { data: [], pagination: {} } }
                setTransfers(data.data.data || []);
                setPagination(data.data.pagination || pagination);
            }
        } catch (error) {
            console.error("Error fetching transfers:", error);
            toast.error("Failed to load transfer history");
        } finally {
            setLoading(false);
        }
    };

    const openDetails = (id) => {
        setSelectedTransferId(id);
        setDetailsOpen(true);
    };

    useEffect(() => {
        fetchData();
    }, [session?.accessToken]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <ArrowRightLeft className="h-6 w-6 text-indigo-600" />
                        Stock Transfers
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Movement of inventory between your business branches.</p>
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
                    {hasPermission(PERMISSIONS.STOCK_EDIT) && (
                        <Button 
                            size="sm" 
                            onClick={() => setCreateOpen(true)}
                            className="h-9 gap-2 bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" />
                            New Transfer
                        </Button>
                    )}
                </div>
            </div>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 p-4">
                    <div className="flex items-center gap-2 max-w-md">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Search transfer number..." className="pl-9 h-9 border-slate-200" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-slate-100">
                                <TableHead className="font-bold text-slate-600 py-4 pl-6">Transfer Info</TableHead>
                                <TableHead className="font-bold text-slate-600">Routes</TableHead>
                                <TableHead className="font-bold text-slate-600 text-center">Status</TableHead>
                                <TableHead className="font-bold text-slate-600">By</TableHead>
                                <TableHead className="font-bold text-slate-600 text-right pr-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && transfers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic">
                                        Loading transfers...
                                    </TableCell>
                                </TableRow>
                            ) : transfers.length > 0 ? (
                                transfers.map((transfer) => (
                                    <TableRow key={transfer.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 text-sm tracking-tight">{transfer.transfer_number}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 mt-0.5">
                                                    <Calendar className="h-2.5 w-2.5" />
                                                    {format(new Date(transfer.transfer_date), "MMM dd, yyyy")}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">From</span>
                                                    <span className="text-xs font-bold text-slate-700">{transfer.from_branch?.name}</span>
                                                </div>
                                                <ChevronRight className="h-3 w-3 text-slate-300" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">To</span>
                                                    <span className="text-xs font-bold text-indigo-600">{transfer.to_branch?.name}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5",
                                                transfer.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                transfer.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                "bg-slate-100 text-slate-600 border-slate-200"
                                            )}>
                                                {transfer.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <User className="h-3 w-3 text-slate-400" />
                                                </div>
                                                <span className="text-xs font-medium text-slate-600">{transfer.user?.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 gap-2 text-slate-500 hover:text-indigo-600"
                                                onClick={() => openDetails(transfer.id)}
                                            >
                                                <FileText className="h-4 w-4" />
                                                Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center text-slate-400 font-medium italic">
                                        No stock transfers recorded yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {createOpen && (
                <StockTransferCreate 
                    open={createOpen} 
                    onOpenChange={setCreateOpen}
                    onSuccess={() => fetchData(1)}
                />
            )}

            {detailsOpen && (
                <StockTransferDetails 
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                    transferId={selectedTransferId}
                />
            )}
        </div>
    );
};

export default StockTransferList;
