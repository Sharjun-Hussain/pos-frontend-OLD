"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, PackagePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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

export function OpeningStockDialog({ open, onOpenChange, accessToken }) {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [items, setItems] = useState([
    { productId: "", variantId: "", quantity: "", costPrice: "", sellingPrice: "", wholesalePrice: "", batchNumber: "", expiryDate: "" }
  ]);

  useEffect(() => {
    if (open && accessToken) {
      fetchMetadata();
    }
  }, [open, accessToken]);

  const fetchMetadata = async () => {
    try {
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
      toast.error("Failed to load branches and products");
    }
  };

  const addItem = () => {
    setItems([...items, { productId: "", variantId: "", quantity: "", costPrice: "", sellingPrice: "", wholesalePrice: "", batchNumber: "", expiryDate: "" }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // If product changed, reset variant
    if (field === "productId") {
      newItems[index].variantId = "";
    }
    
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedBranch) {
      toast.error("Please select a branch");
      return;
    }

    if (items.some(i => !i.productId || !i.quantity)) {
      toast.error("Please fill in required fields (Product & Quantity) for all items");
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
          toast.success("Opening stock recorded successfully");
          onOpenChange(false);
          setItems([{ productId: "", variantId: "", quantity: "", costPrice: "", sellingPrice: "", wholesalePrice: "", batchNumber: "", expiryDate: "" }]);
      } else {
          toast.error(result.message || "Failed to record opening stock");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <PackagePlus className="w-6 h-6 text-blue-600" />
            Stock Opening Utility
          </DialogTitle>
          <DialogDescription>
            Migrate your existing inventory into the system. This creates batches and updates stock levels for your shop.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Select Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="bg-white border-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Which branch is this stock for?" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-bold text-slate-800">Inventory Items</Label>
              <Button onClick={addItem} variant="outline" size="sm" className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 transition-colors">
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </div>

            <div className="border rounded-xl overflow-hidden shadow-sm border-slate-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-tighter text-[11px]">
                  <tr>
                    <th className="px-3 py-3 w-[250px]">Product / Variant</th>
                    <th className="px-3 py-3 w-[120px]">Batch #</th>
                    <th className="px-3 py-3 w-[150px]">Expiry Date</th>
                    <th className="px-3 py-3 w-[100px]">Qty</th>
                    <th className="px-3 py-3 w-[120px]">Cost</th>
                    <th className="px-3 py-3 w-[120px]">Wholesale</th>
                    <th className="px-3 py-3 w-[120px]">Selling</th>
                    <th className="px-3 py-3 w-[50px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, index) => {
                    const productObj = products.find(p => p.id === item.productId);
                    const variants = productObj?.variants || [];

                    return (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-3 space-y-2">
                          <Select value={item.productId} onValueChange={(v) => updateItem(index, "productId", v)}>
                            <SelectTrigger className="h-9 bg-transparent border-slate-200 hover:border-slate-300 transition-all font-medium">
                              <SelectValue placeholder="Search product..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {variants.length > 0 && (
                            <Select value={item.variantId} onValueChange={(v) => updateItem(index, "variantId", v)}>
                              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-600 italic">
                                <SelectValue placeholder="Select Variant" />
                              </SelectTrigger>
                              <SelectContent>
                                {variants.map(v => (
                                  <SelectItem key={v.id} value={v.id}>
                                    {v.name || v.sku || "Default Variant"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <Input 
                            className="h-9 bg-transparent border-slate-200" 
                            placeholder="Batch #" 
                            value={item.batchNumber}
                            onChange={(e) => updateItem(index, "batchNumber", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <Input 
                            type="date" 
                            className="h-9 bg-transparent border-slate-200" 
                            value={item.expiryDate}
                            onChange={(e) => updateItem(index, "expiryDate", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <Input 
                            type="number" 
                            className="h-9 font-bold text-blue-700 bg-transparent border-slate-200" 
                            placeholder="0"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <Input 
                            type="number" 
                            className="h-9 bg-transparent border-slate-200" 
                            placeholder="0.00"
                            value={item.costPrice}
                            onChange={(e) => updateItem(index, "costPrice", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <Input 
                            type="number" 
                            className="h-9 bg-transparent border-slate-200 font-medium text-amber-600" 
                            placeholder="0.00"
                            value={item.wholesalePrice}
                            onChange={(e) => updateItem(index, "wholesalePrice", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <Input 
                            type="number" 
                            className="h-9 font-semibold text-emerald-600 bg-transparent border-slate-200" 
                            placeholder="0.00"
                            value={item.sellingPrice}
                            onChange={(e) => updateItem(index, "sellingPrice", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            Discard
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 transition-all active:scale-95">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PackagePlus className="w-4 h-4 mr-2" />}
            Finalize Opening Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
