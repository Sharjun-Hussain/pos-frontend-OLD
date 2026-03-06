"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
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
    AlertTriangle
} from "lucide-react";

const StockAdjustmentDialog = ({ open, onOpenChange, stock, onSuccess }) => {
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black">
                        <Box className="h-5 w-5 text-indigo-600" />
                        Adjust Stock
                    </DialogTitle>
                </DialogHeader>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Product</p>
                            <h4 className="font-bold text-slate-900">{stock.product?.name}</h4>
                            {stock.variant && (
                                <p className="text-xs text-indigo-600 font-medium">Variant: {stock.variant.name}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Current Stock</p>
                            <p className="text-lg font-black text-slate-900">{parseFloat(stock.quantity).toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center gap-1">
                         <AlertTriangle className="h-3 w-3 text-amber-500" />
                         Adjustment will be recorded for <strong>{stock.branch?.name}</strong> branch.
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wide text-slate-600">Adjustment Type</Label>
                        <Select 
                            value={formData.type} 
                            onValueChange={(val) => setFormData({...formData, type: val})}
                        >
                            <SelectTrigger className="h-11 border-slate-200 focus:ring-indigo-500">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="addition">
                                    <div className="flex items-center gap-2">
                                        <PlusCircle className="h-4 w-4 text-emerald-500" />
                                        <span>Addition (Add to stock)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="subtraction">
                                    <div className="flex items-center gap-2">
                                        <MinusCircle className="h-4 w-4 text-red-500" />
                                        <span>Subtraction (Remove from stock)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="set_to">
                                    <div className="flex items-center gap-2">
                                        <Equal className="h-4 w-4 text-indigo-500" />
                                        <span>Set Exactly (Override)</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wide text-slate-600">Quantity</Label>
                        <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            className="h-11 border-slate-200 focus:ring-indigo-500"
                            value={formData.quantity}
                            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wide text-slate-600">Reason / Notes</Label>
                        <Textarea 
                            placeholder="Why are you adjusting this stock?" 
                            className="min-h-[100px] border-slate-200 focus:ring-indigo-500"
                            value={formData.reason}
                            onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            className="h-11"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            className="h-11 bg-indigo-600 hover:bg-indigo-700"
                            disabled={submitting}
                        >
                            {submitting ? "Processing..." : "Confirm Adjustment"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default StockAdjustmentDialog;
