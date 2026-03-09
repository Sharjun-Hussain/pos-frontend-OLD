"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
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
    ArrowRightLeft, 
    Calendar, 
    Warehouse, 
    User, 
    Package,
    ArrowRight,
    FileText,
    History
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const StockTransferDetails = ({ open, onOpenChange, transferId }) => {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [transfer, setTransfer] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!transferId || !session?.accessToken) return;
            setLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stocks/transfers/${transferId}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                });
                const data = await res.json();
                if (data.status === "success") {
                    setTransfer(data.data);
                } else {
                    toast.error("Failed to load transfer details");
                }
            } catch (error) {
                console.error("Error fetching transfer details:", error);
                toast.error("An error occurred while fetching details");
            } finally {
                setLoading(false);
            }
        };

        if (open) fetchDetails();
    }, [open, transferId, session?.accessToken]);

    if (!transfer && loading) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card/50 backdrop-blur-xl border border-border/60 shadow-2xl">
                <DialogHeader className="p-6 border-b border-border/50 bg-muted/30">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-2xl font-black text-foreground">
                            <FileText className="h-6 w-6 text-emerald-500" />
                            Transfer Details
                        </DialogTitle>
                        <Badge className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-3 py-1",
                            transfer?.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            "bg-muted/50 text-muted-foreground border-border"
                        )} variant="outline">
                            {transfer?.status}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Header Info Grid */}
                    <div className="grid grid-cols-2 gap-6 bg-muted/30 p-6 rounded-2xl border border-border/50">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none mb-1.5">Transfer ID</p>
                                <p className="text-sm font-black text-foreground">{transfer?.transfer_number}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none mb-1.5">Date</p>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span className="text-xs font-bold text-foreground">{transfer?.transfer_date ? format(new Date(transfer.transfer_date), "MMMM dd, yyyy") : "N/A"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none mb-1.5">Processed By</p>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-3.5 w-3.5" />
                                    <span className="text-xs font-bold text-foreground">{transfer?.user?.name}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none mb-1.5">Route</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-foreground">{transfer?.from_branch?.name}</span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs font-bold text-emerald-600">{transfer?.to_branch?.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight flex items-center gap-2 px-1">
                            <Package className="h-4 w-4 text-emerald-500" />
                            Transferred Items
                        </h3>
                        <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-card/30 backdrop-blur-sm">
                            <Table>
                                <TableHeader className="bg-muted/30 border-b border-border/50">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground h-10 px-6">Product Details</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground h-10 text-right pr-8">Quantity</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfer?.items?.map((item, idx) => (
                                        <TableRow key={idx} className="border-border/40 last:border-none group hover:bg-muted/30 transition-colors">
                                            <TableCell className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground group-hover:bg-background transition-colors">
                                                        <Package className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground leading-tight">{item.product?.name}</p>
                                                        {item.variant && (
                                                            <p className="inline-block text-[10px] text-primary font-bold uppercase tracking-wider mt-0.5 px-2 py-0.5 bg-primary/10 rounded-full">{item.variant.name}</p>
                                                        )}
                                                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 italic">{item.variant?.sku || item.product?.code}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-right pr-8">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-black text-foreground">{parseFloat(item.quantity).toFixed(2)}</span>
                                                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Units Transferred</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Notes */}
                    {transfer?.notes && (
                        <div className="space-y-3 px-1">
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                                <History className="h-4 w-4 text-emerald-500" />
                                Transfer Notes
                            </h3>
                            <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                                <p className="text-sm text-foreground/80 italic leading-relaxed">"{transfer.notes}"</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t border-border/50 bg-muted/20">
                    <Button onClick={() => onOpenChange(false)} variant="outline" className="h-11 px-8 focus:ring-emerald-500 font-black shadow-sm">
                        Close Details
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Utility function for conditional class names if not globally available in this context
function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default StockTransferDetails;
