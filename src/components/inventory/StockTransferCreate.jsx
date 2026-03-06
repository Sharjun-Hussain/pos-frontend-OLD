"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle,
    SheetFooter,
    SheetDescription
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
    Plus, 
    Trash2, 
    Search, 
    ArrowRight,
    Package,
    Warehouse,
    AlertCircle,
    Boxes,
    ArrowRightLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const StockTransferCreate = ({ open, onOpenChange, onSuccess }) => {
    const { data: session } = useSession();
    const [submitting, setSubmitting] = useState(false);
    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    
    // Form State
    const [fromBranchId, setFromBranchId] = useState("");
    const [toBranchId, setToBranchId] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState([]); // Array of { product_id, product_variant_id, quantity, name, variant_name }

    useEffect(() => {
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
        fetchBranches();
    }, [session?.accessToken]);

    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?search=${val}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (data.status === "success") {
                // products API also uses paginatedResponse
                const productList = data.data.data || [];
                // Flatten products and variants for easy selection
                const results = [];
                productList.forEach(p => {
                    if (p.variants && p.variants.length > 0) {
                        p.variants.forEach(v => {
                            results.push({
                                product_id: p.id,
                                product_variant_id: v.id,
                                name: p.name,
                                variant_name: v.name,
                                display_name: `${p.name} (${v.name})`,
                                sku: v.sku || p.code
                            });
                        });
                    } else {
                        results.push({
                            product_id: p.id,
                            product_variant_id: null,
                            name: p.name,
                            variant_name: null,
                            display_name: p.name,
                            sku: p.code
                        });
                    }
                });
                setSearchResults(results);
            }
        } catch (error) {
            console.error("Search error:", error);
        }
    };

    const addItem = (result) => {
        // Check if already added
        const exists = items.find(i => 
            i.product_id === result.product_id && 
            i.product_variant_id === result.product_variant_id
        );
        if (exists) {
            toast.error("Item already added to list");
            return;
        }

        setItems([...items, { ...result, quantity: 1 }]);
        setSearchQuery("");
        setSearchResults([]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateQuantity = (index, val) => {
        const newItems = [...items];
        newItems[index].quantity = val;
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!fromBranchId || !toBranchId) {
            toast.error("Please select both source and destination branches");
            return;
        }
        if (fromBranchId === toBranchId) {
            toast.error("Source and destination branches must be different");
            return;
        }
        if (items.length === 0) {
            toast.error("Please add at least one item to transfer");
            return;
        }
        if (items.some(i => !i.quantity || parseFloat(i.quantity) <= 0)) {
            toast.error("All items must have a valid quantity");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stocks/transfers`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}` 
                },
                body: JSON.stringify({
                    from_branch_id: fromBranchId,
                    to_branch_id: toBranchId,
                    notes,
                    items: items.map(i => ({
                        product_id: i.product_id,
                        product_variant_id: i.product_variant_id,
                        quantity: i.quantity
                    }))
                }),
            });

            const data = await res.json();
            if (data.status === "success") {
                toast.success("Stock transfer completed successfully");
                onSuccess?.();
                onOpenChange(false);
            } else {
                toast.error(data.message || "Transfer failed");
            }
        } catch (error) {
            console.error("Transfer error:", error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl flex flex-col h-full bg-white p-0 overflow-hidden border-l border-slate-100">
                <SheetHeader className="p-6 border-b border-slate-50 bg-slate-50/50">
                    <SheetTitle className="text-2xl font-black flex items-center gap-2">
                        <ArrowRightLeft className="h-6 w-6 text-indigo-600" />
                        Create Stock Transfer
                    </SheetTitle>
                    <SheetDescription>Move products between your business locations.</SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Branch Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                        <div className="md:col-span-5 space-y-2">
                            <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Source Branch</Label>
                            <Select value={fromBranchId} onValueChange={setFromBranchId}>
                                <SelectTrigger className="h-12 bg-white border-slate-200">
                                    <SelectValue placeholder="Select Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2 flex justify-center pt-5">
                            <div className="size-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-300">
                                <ArrowRight className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="md:col-span-5 space-y-2">
                            <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Destination Branch</Label>
                            <Select value={toBranchId} onValueChange={setToBranchId}>
                                <SelectTrigger className="h-12 bg-white border-slate-200">
                                    <SelectValue placeholder="Select Target" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name} {fromBranchId === b.id && "(Same)"}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Product Search */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                <Boxes className="h-4 w-4 text-indigo-600" />
                                Transfer Items
                            </h3>
                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-100 font-bold">
                                {items.length} Items Selected
                            </Badge>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search products by name or code..." 
                                className="pl-10 h-12 bg-white border-slate-200 ring-offset-indigo-600 focus-visible:ring-indigo-600"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />

                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-100 shadow-2xl rounded-xl max-h-64 overflow-y-auto">
                                    {searchResults.map((result, idx) => (
                                        <button
                                            key={idx}
                                            className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 last:border-none flex items-center justify-between group"
                                            onClick={() => addItem(result)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <Package className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 leading-tight">{result.display_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono italic">{result.sku}</p>
                                                </div>
                                            </div>
                                            <Plus className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-slate-50">
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400 h-9">Product</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400 h-9 w-24">Qty</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400 h-9 w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center text-slate-400 text-xs italic">
                                                Search and add products to transfer.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item, idx) => (
                                            <TableRow key={idx} className="border-slate-50">
                                                <TableCell className="py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-900">{item.name}</span>
                                                        {item.variant_name && (
                                                            <span className="text-[10px] text-indigo-600 font-medium">({item.variant_name})</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <Input 
                                                        type="number" 
                                                        className="h-8 text-xs font-black border-slate-200"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(idx, e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-3 px-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                                        onClick={() => removeItem(idx)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Transfer Notes</Label>
                        <Textarea 
                            placeholder="Add any specific instructions or reasons for this transfer..." 
                            className="min-h-[80px] border-slate-200 bg-slate-50/30"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <SheetFooter className="p-6 border-t border-slate-50 bg-slate-50/30">
                    <div className="flex w-full items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-slate-400 italic text-xs">
                             <AlertCircle className="h-3 w-3" />
                             Review items before submitting.
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                className="h-12 px-6 font-bold text-slate-600 border-slate-200"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? "Processing..." : "Finish & Transfer"}
                            </Button>
                        </div>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default StockTransferCreate;
