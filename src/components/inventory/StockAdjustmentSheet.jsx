"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle,
    SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
    Box, 
    PlusCircle, 
    MinusCircle, 
    Equal,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";

export const StockAdjustmentSheet = ({ open, onOpenChange, stock, onSuccess }) => {
    const { data: session } = useSession();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        type: "addition",
        quantity: "",
        reason: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
            toast.error("Please enter a valid quantity");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stocks/adjust`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}` 
                },
                body: JSON.stringify({
                    branch_id: stock.branch_id,
                    product_id: stock.product_id,
                    product_variant_id: stock.product_variant_id,
                    quantity: formData.quantity,
                    type: formData.type,
                    reason: formData.reason
                }),
            });

            const data = await res.json();
            if (data.status === "success") {
                toast.success("Stock adjusted successfully");
                onSuccess?.();
                onOpenChange(false);
                // Reset form
                setFormData({
                    type: "addition",
                    quantity: "",
                    reason: ""
                });
            } else {
                toast.error(data.message || "Failed to adjust stock");
            }
        } catch (error) {
            console.error("Error adjusting stock:", error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!stock) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto flex flex-col p-6 border-l shadow-2xl backdrop-blur-xl bg-background/95">
                <SheetHeader className="pb-4">
                    <SheetTitle className="flex items-center gap-2 text-2xl font-black text-foreground">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <Box className="h-6 w-6 text-emerald-500" />
                        </div>
                        Adjust Stock
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 space-y-6 mt-4">
                    <div className="bg-muted/30 p-5 rounded-2xl border border-border/50 transition-all hover:bg-muted/40">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Product</p>
                                <h4 className="font-bold text-foreground text-base leading-tight">{stock.product?.name}</h4>
                                {stock.variant && (
                                    <p className="text-xs text-primary font-bold mt-1 max-w-min px-2 py-0.5 rounded-full bg-primary/10">
                                        {stock.variant.name}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Current Stock</p>
                                <p className="text-2xl font-black text-foreground">{parseFloat(stock.quantity).toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                             <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                             Recording for <strong className="text-foreground">{stock.branch?.name}</strong> branch.
                        </div>
                    </div>

                    <form id="stock-adjust-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Adjustment Type</Label>
                            <Select 
                                value={formData.type} 
                                onValueChange={(val) => setFormData({...formData, type: val})}
                            >
                                <SelectTrigger className="h-12 bg-background/50 border-input focus:ring-emerald-500 rounded-xl transition-all shadow-sm">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-lg border-border/50">
                                    <SelectItem value="addition" className="py-2.5">
                                        <div className="flex items-center gap-3">
                                            <PlusCircle className="h-4 w-4 text-emerald-500" />
                                            <span className="font-medium">Addition (Add to stock)</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="subtraction" className="py-2.5">
                                        <div className="flex items-center gap-3">
                                            <MinusCircle className="h-4 w-4 text-red-500" />
                                            <span className="font-medium">Subtraction (Remove stock)</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="set_to" className="py-2.5">
                                        <div className="flex items-center gap-3">
                                            <Equal className="h-4 w-4 text-primary" />
                                            <span className="font-medium">Set Exactly (Override)</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quantity</Label>
                            <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00" 
                                className="h-12 bg-background/50 border-input focus:ring-emerald-500 rounded-xl transition-all shadow-sm font-semibold text-lg"
                                value={formData.quantity}
                                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Reason / Notes</Label>
                            <Textarea 
                                placeholder="State the reason for this adjustment..." 
                                className="min-h-[120px] bg-background/50 border-input focus:ring-emerald-500 rounded-xl transition-all shadow-sm resize-none p-3"
                                value={formData.reason}
                                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                            />
                        </div>
                    </form>
                </div>

                <SheetFooter className="mt-8 pt-4 border-t">
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            className=" flex-1 rounded-xl font-bold uppercase tracking-wider text-[11px]"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            form="stock-adjust-form"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-emerald-500/20 transition-all active:scale-95 px-6 gap-2"
                            disabled={submitting}
                        >
                            {submitting ? "Processing..." : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Confirm Adjustment
                                </>
                            )}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};
