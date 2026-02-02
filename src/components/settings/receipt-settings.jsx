"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { toast } from "sonner";
import { Save, Printer, Smartphone, Monitor, Layout, Eye, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { safeMergeSettings } from "@/lib/settings-utils";
import { cn } from "@/lib/utils";

export function ReceiptSettings() {
  const { receipt, setReceiptSettings } = useSettingsStore();
  const { useModularSettings, updateModularSettings } = useSettings();
  const { data: response, isLoading } = useModularSettings('receipt');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (response?.data) {
      const merged = safeMergeSettings(receipt, response.data);
      setReceiptSettings(merged);
    }
  }, [response]);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateModularSettings('receipt', receipt);
    if (result.success) {
      toast.success("Receipt settings saved successfully");
    } else {
      toast.error(result.error || "Failed to save settings");
    }
    setIsSaving(false);
  };

  const updateField = (field, value) => {
    setReceiptSettings({ [field]: value });
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Receipt Configuration</h2>
          <p className="text-sm text-slate-500">Fine-tune how your customer invoices look and print.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
          Save Layout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-7 space-y-6">
           <Card className="border-none shadow-sm overflow-hidden">
             <div className="bg-slate-50 border-b border-slate-100 p-4">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Monitor className="w-4 h-4" /> Header & Branding
                </h3>
             </div>
             <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-slate-700">Display Business Logo</Label>
                        <p className="text-xs text-slate-400">Include organization logo at the top</p>
                    </div>
                    <Switch
                        checked={receipt.showLogo}
                        onCheckedChange={(val) => updateField('showLogo', val)}
                    />
                </div>

                <div className="space-y-2">
                  <Label>Receipt Header Information</Label>
                  <Input
                    value={receipt.headerText}
                    onChange={(e) => updateField('headerText', e.target.value)}
                    placeholder="e.g. Welcome to our Store"
                  />
                  <p className="text-[10px] text-slate-400">This appears below the business name/logo.</p>
                </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-sm overflow-hidden">
             <div className="bg-slate-50 border-b border-slate-100 p-4">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Layout className="w-4 h-4" /> Receipt Layout & Content
                </h3>
             </div>
             <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Paper Format</Label>
                        <Select value={receipt.paperWidth} onValueChange={(val) => updateField('paperWidth', val)}>
                            <SelectTrigger className="h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="58mm">Thermal (58mm)</SelectItem>
                                <SelectItem value="80mm">Thermal (80mm)</SelectItem>
                                <SelectItem value="A4">Standard A4 / Letter</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Font Density</Label>
                        <Select value={receipt.fontSize} onValueChange={(val) => updateField('fontSize', val)}>
                            <SelectTrigger className="h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="small">Small (Condensed)</SelectItem>
                                <SelectItem value="medium">Standard</SelectItem>
                                <SelectItem value="large">Large (High Vis)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Separator className="opacity-50" />

                <div className="grid grid-cols-2 gap-y-4">
                    <div className="flex items-center justify-between pr-4 border-r border-slate-50">
                        <Label className="text-slate-600 text-xs">Show Tax Details</Label>
                        <Switch checked={receipt.showTax} onCheckedChange={(v)=>updateField('showTax', v)} />
                    </div>
                    <div className="flex items-center justify-between pl-4">
                        <Label className="text-slate-600 text-xs">Show Item Discounts</Label>
                        <Switch checked={receipt.showDiscount} onCheckedChange={(v)=>updateField('showDiscount', v)} />
                    </div>
                    <div className="flex items-center justify-between pr-4 border-r border-slate-50">
                        <Label className="text-slate-600 text-xs">Print Seller Name</Label>
                        <Switch checked={receipt.showSeller} onCheckedChange={(v)=>updateField('showSeller', v)} />
                    </div>
                    <div className="flex items-center justify-between pl-4">
                        <Label className="text-slate-600 text-xs">Show Customer Info</Label>
                        <Switch checked={receipt.showCustomer} onCheckedChange={(v)=>updateField('showCustomer', v)} />
                    </div>
                    <div className="flex items-center justify-between pr-4 border-r border-slate-50">
                        <Label className="text-slate-600 text-xs">Print Automatically</Label>
                        <Switch checked={receipt.autoPrintReceipt} onCheckedChange={(v)=>updateField('autoPrintReceipt', v)} />
                    </div>
                </div>

                <Separator className="opacity-50" />

                <div className="grid grid-cols-2 gap-y-4">
                     <div className="flex items-center justify-between pr-4 border-r border-slate-50">
                        <Label className="text-slate-600 text-xs">Show Sales Type</Label>
                        <Switch checked={receipt.showSalesType ?? true} onCheckedChange={(v)=>updateField('showSalesType', v)} />
                    </div>
                    <div className="flex items-center justify-between pl-4">
                        <Label className="text-slate-600 text-xs">Show Date & Time</Label>
                        <Switch checked={receipt.showDateTime ?? true} onCheckedChange={(v)=>updateField('showDateTime', v)} />
                    </div>
                </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-sm overflow-hidden">
             <div className="bg-slate-50 border-b border-slate-100 p-4">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" /> Receipt Footer
                </h3>
             </div>
             <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Closing Message</Label>
                  <Textarea
                    value={receipt.footerText}
                    onChange={(e) => updateField('footerText', e.target.value)}
                    rows={3}
                    className="resize-none"
                    placeholder="e.g. Exchange within 7 days with valid receipt."
                  />
                </div>

                <div className="pt-4 border-t border-dashed">
                   <Button 
                    variant="outline" 
                    className="w-full gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold uppercase text-[10px] tracking-widest"
                    onClick={() => toast.success("Test print signal sent to printer.")}
                   >
                     <Printer className="w-3.5 h-3.5" /> Force Test Print
                   </Button>
                </div>
             </CardContent>
           </Card>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-5 relative">
            <div className="sticky top-6">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-black uppercase tracking-tighter text-slate-400">Live Render Preview</span>
                </div>
                
                <div className="bg-slate-200 p-8 rounded-2xl shadow-inner flex justify-center min-h-[600px] overflow-hidden">
                    <div className={cn(
                        "bg-white shadow-2xl p-6 flex flex-col transition-all duration-300 transform rounded-sm",
                        receipt.paperWidth === '58mm' ? "w-[240px]" : receipt.paperWidth === '80mm' ? "w-[320px]" : "w-full aspect-[1/1.4] max-w-[400px]",
                        receipt.fontSize === 'small' ? "text-[10px]" : receipt.fontSize === 'large' ? "text-sm" : "text-xs"
                    )}>
                        {/* Mock Receipt Content */}
                        <div className="text-center space-y-1 mb-6">
                            {receipt.showLogo && <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-slate-300">LOGO</div>}
                            <h4 className="font-black text-slate-900 text-base uppercase">Business Name</h4>
                            <p className="text-[10px] text-slate-400">123 Business Street, City, State</p>
                            <p className="text-[10px] text-slate-400">Phone: +1 234 567 890</p>
                            {receipt.headerText && <p className="mt-2 italic border-t border-slate-100 pt-1">{receipt.headerText}</p>}
                        </div>

                        <div className="flex justify-between border-y border-dashed py-2 mb-4">
                            <span>INV #00124</span>
                            {(receipt.showDateTime ?? true) && <span>{new Date().toLocaleDateString()}</span>}
                        </div>
                        
                        {(receipt.showSalesType ?? true) && (
                            <div className="text-center font-bold uppercase tracking-widest text-[9px] mb-2 border-b border-dashed pb-1">
                                RETAIL SALE
                            </div>
                        )}

                        <table className="w-full text-left border-collapse my-2">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="py-1">Item (Qty)</th>
                                    <th className="text-right py-1">Price</th>
                                    {receipt.showDiscount && <th className="text-right py-1">Disc</th>}
                                    <th className="text-right py-1">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dashed divide-black/20">
                                <tr>
                                    <td className="py-2">
                                        <div className="font-bold">Product A <span className="font-normal opacity-70">(x2)</span></div>
                                    </td>
                                    <td className="text-right py-2">750.00</td>
                                    {receipt.showDiscount && <td className="text-right py-2 text-[9px]">-10%</td>}
                                    <td className="text-right py-2 font-bold">1,350.00</td>
                                </tr>
                                <tr>
                                    <td className="py-2">
                                        <div className="font-bold">Service B <span className="font-normal opacity-70">(x1)</span></div>
                                    </td>
                                    <td className="text-right py-2">500.00</td>
                                    {receipt.showDiscount && <td className="text-right py-2 text-[9px]">-</td>}
                                    <td className="text-right py-2 font-bold">500.00</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="border-t border-dashed pt-2 mt-4 space-y-1">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>2,000.00</span>
                            </div>
                            {receipt.showTax && (
                                <div className="flex justify-between">
                                    <span>Tax (8%)</span>
                                    <span>160.00</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-black border-t pt-1">
                                <span>GRAND TOTAL</span>
                                <span>2,160.00</span>
                            </div>
                        </div>

                        <div className="mt-8 text-center space-y-2">
                             {receipt.footerText && <p className="text-[10px] whitespace-pre-wrap">{receipt.footerText}</p>}
                             <p className="font-bold text-[8px] opacity-40">POWERED BY EMI-POS</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
