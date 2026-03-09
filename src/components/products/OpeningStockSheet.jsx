"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  PackagePlus, 
  X, 
  Search,
  AlertCircle,
  CheckCircle2,
  Package,
  CalendarIcon
} from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
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
import { cn } from "@/lib/utils";

// --- Memoized Row Component for Performance ---
const StockItemRow = React.memo(({ 
  item, 
  index, 
  products, 
  updateItem, 
  removeItem 
}) => {
  const productObj = useMemo(() => products.find(p => p.id === item.productId), [products, item.productId]);
  const variants = useMemo(() => productObj?.variants || [], [productObj]);

  return (
    <tr className="group transition-colors hover:bg-sidebar-accent/15 border-b border-border/30 last:border-0 text-[13px]">
      <td className="py-4 pr-3 align-top min-w-[280px] pl-4">
        <div className="space-y-2">
          <div className="relative">
            <Select 
              value={item.productId} 
              onValueChange={(v) => updateItem(index, "productId", v)}
            >
              <SelectTrigger className="h-10 bg-background border-border/60 hover:border-emerald-500/50 transition-all font-medium rounded-xl shadow-none focus:ring-emerald-500/20">
                <SelectValue placeholder="Search product..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] rounded-xl border-border shadow-2xl">
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id} className="rounded-lg py-2.5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{p.name}</span>
                      {p.sku && <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{p.sku}</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {variants.length > 0 && (
            <Select 
              value={item.variantId} 
              onValueChange={(v) => updateItem(index, "variantId", v)}
            >
              <SelectTrigger className="h-9 text-xs bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20 text-emerald-600 font-medium rounded-lg shadow-none">
                <SelectValue placeholder="Select Variant" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                {variants.map(v => (
                  <SelectItem key={v.id} value={v.id} className="rounded-lg">
                    {v.name || v.sku || "Default Variant"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </td>
      <td className="py-4 px-2 align-top w-[140px]">
        <Input 
          className="h-10 bg-background border-border/60 rounded-xl focus-visible:ring-emerald-500/20 placeholder:text-muted-foreground/30 font-medium" 
          placeholder="BATCH-001" 
          value={item.batchNumber}
          onChange={(e) => updateItem(index, "batchNumber", e.target.value)}
        />
      </td>
      <td className="py-4 px-2 align-top w-[160px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-10 w-full bg-background border-border/60 rounded-xl justify-start text-left font-medium transition-all hover:border-emerald-500/50 focus:ring-emerald-500/20 px-3",
                !item.expiryDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
              <span className="truncate text-xs uppercase">
                {item.expiryDate ? format(new Date(item.expiryDate), "dd MMM yyyy") : "Expiry"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-xl" align="start">
            <Calendar
              mode="single"
              selected={item.expiryDate ? new Date(item.expiryDate) : undefined}
              onSelect={(date) => updateItem(index, "expiryDate", date ? format(date, "yyyy-MM-dd") : "")}
              initialFocus
              captionLayout="dropdown-buttons"
              fromYear={new Date().getFullYear()}
              toYear={new Date().getFullYear() + 20}
              className="rounded-xl"
            />
          </PopoverContent>
        </Popover>
      </td>
      <td className="py-4 px-2 align-top w-[100px]">
        <Input 
          type="number" 
          className="h-10 font-bold text-emerald-600 bg-emerald-600/5 border-emerald-600/20 rounded-xl focus-visible:ring-emerald-500/20 text-center" 
          placeholder="0"
          value={item.quantity}
          onChange={(e) => updateItem(index, "quantity", e.target.value)}
        />
      </td>
      <td className="py-4 px-2 align-top w-[120px]">
        <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-[10px] font-bold">Rs.</span>
             <Input 
                type="number" 
                className="h-10 pl-8 bg-background border-border/60 rounded-xl focus-visible:ring-emerald-500/20 font-medium" 
                placeholder="0.00"
                value={item.costPrice}
                onChange={(e) => updateItem(index, "costPrice", e.target.value)}
            />
        </div>
      </td>
      <td className="py-4 px-2 align-top w-[120px]">
        <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/50 text-[10px] font-bold">Rs.</span>
             <Input 
                type="number" 
                className="h-10 pl-8 bg-background border-border/60 rounded-xl focus-visible:ring-emerald-500/20 font-medium text-amber-600" 
                placeholder="0.00"
                value={item.wholesalePrice}
                onChange={(e) => updateItem(index, "wholesalePrice", e.target.value)}
            />
        </div>
      </td>
      <td className="py-4 px-2 align-top w-[120px]">
        <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50 text-[10px] font-bold">Rs.</span>
             <Input 
                type="number" 
                className="h-10 pl-8 bg-emerald-500/5 border-emerald-500/20 rounded-xl focus-visible:ring-emerald-500/20 font-bold text-emerald-600" 
                placeholder="0.00"
                value={item.sellingPrice}
                onChange={(e) => updateItem(index, "sellingPrice", e.target.value)}
            />
        </div>
      </td>
      <td className="py-4 pl-3 align-top text-right pr-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => removeItem(index)} 
          className="h-10 w-10 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-all rounded-xl opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </Button>
      </td>
    </tr>
  );
});

StockItemRow.displayName = "StockItemRow";

export function OpeningStockSheet({ open, onOpenChange, accessToken }) {
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [items, setItems] = useState([
    { productId: "", variantId: "", quantity: "", costPrice: "", sellingPrice: "", wholesalePrice: "", batchNumber: "", expiryDate: "" }
  ]);

  const fetchMetadata = useCallback(async () => {
    try {
      setMetadataLoading(true);
      const [branchRes, productRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/active/list`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      ]);

      const branchData = await branchRes.json();
      const productData = await productRes.json();

      if (branchData.status === "success") setBranches(branchData.data || []);
      if (productData.status === "success") setProducts(productData.data || []);
    } catch (error) {
      console.error("Failed to fetch metadata", error);
      toast.error("Failed to load metadata");
    } finally {
      setMetadataLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (open && accessToken && branches.length === 0) {
      fetchMetadata();
    }
  }, [open, accessToken, branches.length, fetchMetadata]);

  const addItem = () => {
    setItems(prev => [...prev, { productId: "", variantId: "", quantity: "", costPrice: "", sellingPrice: "", wholesalePrice: "", batchNumber: "", expiryDate: "" }]);
  };

  const removeItem = useCallback((index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index, field, value) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // If product changed, reset variant
      if (field === "productId") {
        newItems[index].variantId = "";
      }
      return newItems;
    });
  }, []);

  const handleSubmit = async () => {
    if (!selectedBranch) {
      toast.error("Please select a branch");
      return;
    }

    if (items.some(i => !i.productId || !i.quantity)) {
      toast.error("Required fields missing (Product/Quantity)");
      return;
    }

    try {
      setLoading(true);
      const payload = {
          branch_id: selectedBranch,
          items: items.map(i => ({
              product_id: i.productId,
              product_variant_id: i.variantId || null,
              quantity: parseFloat(i.quantity),
              cost_price: parseFloat(i.costPrice || 0),
              selling_price: parseFloat(i.sellingPrice || 0),
              wholesale_price: parseFloat(i.wholesalePrice || 0),
              batch_number: i.batchNumber || null,
              expiry_date: i.expiryDate || null
          }))
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/opening-stock`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.status === "success") {
          toast.success("Opening stock recorded!");
          onOpenChange(false);
          setItems([{ productId: "", variantId: "", quantity: "", costPrice: "", sellingPrice: "", wholesalePrice: "", batchNumber: "", expiryDate: "" }]);
      } else {
          toast.error(result.message || "Failed to save stock");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-7xl p-0 flex flex-col bg-background/95 backdrop-blur-xl border-l border-border [&>button]:hidden">
        {/* Elite Header */}
        <div className="px-8 py-5 border-b border-border/40 relative overflow-hidden shrink-0 bg-background/50 backdrop-blur-md">
          <div className="absolute top-0 right-0 p-12 -mr-16 -mt-16 bg-emerald-500/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex items-center gap-6">
            <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                  <PackagePlus className="size-5 text-emerald-600" />
                </div>
                <div className="flex flex-col text-left">
                  <SheetTitle className="text-lg font-bold tracking-tight text-foreground leading-none">Stock Opening</SheetTitle>
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Utility</span>
                </div>
            </div>

            <div className="h-8 w-px bg-border/40 mx-2" />

            {/* In-Header Controls */}
            <div className="flex-1 flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Branch</Label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger className="h-9 w-[180px] bg-background/50 border-border/60 rounded-lg shadow-none transition-all focus:ring-emerald-500/20 text-xs font-semibold">
                            <SelectValue placeholder="Select destination..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-2xl">
                            {branches.map(b => (
                                <SelectItem key={b.id} value={b.id} className="rounded-lg text-xs">{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-3 pl-6 border-l border-border/40">
                    <div className="flex flex-col items-start">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Entries</span>
                        <span className="text-xs font-bold text-emerald-600">{items.length}</span>
                    </div>
                    <Button 
                        size="icon"
                        onClick={addItem} 
                        className="h-9 w-9 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 shadow-none rounded-lg transition-all active:scale-95"
                        title="Add inventory row"
                    >
                        <Plus className="size-4" />
                    </Button>
                </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 border border-border/40 text-[9px] font-bold text-muted-foreground/60 tracking-widest uppercase">
                    Esc
                </div>
                <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onOpenChange(false)}
                    className="h-10 w-10 rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-200 group"
                >
                    <X className="size-5 transition-transform group-hover:rotate-90 duration-300" />
                </Button>
            </div>
          </div>
        </div>

        {/* Optimized Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 thin-scrollbar">
          <div className="min-w-full inline-block align-middle">
            <div className="relative rounded-t-xl border-x border-t border-border overflow-hidden bg-background/50">
              {metadataLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="size-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin" />
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Warming engine...</p>
                </div>
              ) : (
                <table className="w-full border-separate border-spacing-0">
                  <thead className="sticky top-0 z-20 bg-sidebar-accent/20 backdrop-blur-md">
                    <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 text-left">
                      <th className="py-4 pr-3 border-b border-border/60 pl-4">Product details</th>
                      <th className="py-4 px-2 border-b border-border/60">Batch ref</th>
                      <th className="py-4 px-2 border-b border-border/60 text-center">Expiry</th>
                      <th className="py-4 px-2 border-b border-border/60 text-center">Unit qty</th>
                      <th className="py-4 px-2 border-b border-border/60">Cost price</th>
                      <th className="py-4 px-2 border-b border-border/60">Wholesale</th>
                      <th className="py-4 px-2 border-b border-border/60">Selling</th>
                      <th className="py-4 pl-3 border-b border-border/60 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <StockItemRow 
                        key={`${index}-${item.productId}`} 
                        item={item} 
                        index={index} 
                        products={products} 
                        updateItem={updateItem} 
                        removeItem={removeItem} 
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {!metadataLoading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4 opacity-40">
                    <Package className="size-12" />
                    <p className="font-bold uppercase tracking-widest text-xs">No entries recorded</p>
                </div>
            )}
          </div>
        </div>

        {/* Elite Footer */}
        <div className="p-8 border-t border-border/40 bg-muted/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 text-muted-foreground">
                <AlertCircle className="size-4" />
                <span className="text-[11px] font-medium italic">All entries will update physical stock levels immediately upon finalization.</span>
            </div>
            
            <div className="flex items-center gap-4">
                 <div className="flex flex-col items-end mr-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Status</span>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px] uppercase tracking-wider">
                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Ready to process
                    </div>
                </div>
                <Button 
                    onClick={handleSubmit} 
                    disabled={loading} 
                    className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xl shadow-emerald-600/20 font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 group"
                >
                    {loading ? <Loader2 className="size-5 animate-spin" /> : (
                        <>
                            <CheckCircle2 className="size-5 mr-3 group-hover:scale-110 transition-transform" />
                            Finalize records
                        </>
                    )}
                </Button>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
