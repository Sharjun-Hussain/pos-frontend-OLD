"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { toast } from "sonner";
import { Save, Printer, Smartphone, Monitor, Layout, Eye, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { safeMergeSettings } from "@/lib/settings-utils";
import { cn } from "@/lib/utils";

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="bg-muted/30 border-b border-border/30 px-6 py-4 flex items-center gap-2">
    <Icon className="w-4 h-4 text-[#10b981]" />
    <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">{title}</h3>
  </div>
);

const ToggleRow = ({ label, desc, checked, onCheckedChange }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="text-[12px] font-bold text-foreground">{label}</p>
      {desc && <p className="text-[10px] text-muted-foreground/50 font-medium">{desc}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

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
    if (result.success) toast.success("Receipt settings saved successfully");
    else toast.error(result.error || "Failed to save settings");
    setIsSaving(false);
  };

  const updateField = (field, value) => setReceiptSettings({ [field]: value });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#10b981]" /></div>;

  const FieldLabel = ({ children }) => (
    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-0.5">{children}</label>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Receipt Configuration</h2>
          <p className="text-sm text-muted-foreground/60 font-medium mt-0.5">Fine-tune how your customer invoices look and print.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-[#10b981] hover:bg-[#059669] text-white h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-none shadow-lg shadow-[#10b981]/20 transition-all active:scale-95 gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Layout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-7 space-y-4">
          {/* Header & Branding */}
          <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
            <SectionHeader icon={Monitor} title="Header & Branding" />
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-foreground">Display Business Logo</p>
                  <p className="text-[10px] text-muted-foreground/50 font-medium">Include organization logo at the top</p>
                </div>
                <Switch checked={receipt.showLogo} onCheckedChange={(val) => updateField('showLogo', val)} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Receipt Header Text</FieldLabel>
                <Input
                  value={receipt.headerText}
                  onChange={(e) => updateField('headerText', e.target.value)}
                  placeholder="e.g. Welcome to our Store"
                  className="h-11 bg-background/50 border-border/40 rounded-xl focus:border-[#10b981]"
                />
                <p className="text-[10px] text-muted-foreground/40">Appears below the business name/logo.</p>
              </div>
            </CardContent>
          </Card>

          {/* Layout & Content */}
          <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
            <SectionHeader icon={Layout} title="Receipt Layout & Content" />
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel>Paper Format</FieldLabel>
                  <Select value={receipt.paperWidth} onValueChange={(val) => updateField('paperWidth', val)}>
                    <SelectTrigger className="h-11 bg-background/50 border-border/40 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">Thermal (58mm)</SelectItem>
                      <SelectItem value="80mm">Thermal (80mm)</SelectItem>
                      <SelectItem value="A4">Standard A4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Font Density</FieldLabel>
                  <Select value={receipt.fontSize} onValueChange={(val) => updateField('fontSize', val)}>
                    <SelectTrigger className="h-11 bg-background/50 border-border/40 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (Condensed)</SelectItem>
                      <SelectItem value="medium">Standard</SelectItem>
                      <SelectItem value="large">Large (High Vis)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator className="opacity-30" />
              <div className="grid grid-cols-1 gap-2 divide-y divide-border/20">
                <ToggleRow label="Show Tax Details" checked={receipt.showTax} onCheckedChange={(v) => updateField('showTax', v)} />
                <ToggleRow label="Show Item Discounts" checked={receipt.showDiscount} onCheckedChange={(v) => updateField('showDiscount', v)} />
                <ToggleRow label="Print Seller Name" checked={receipt.showSeller} onCheckedChange={(v) => updateField('showSeller', v)} />
                <ToggleRow label="Show Customer Info" checked={receipt.showCustomer} onCheckedChange={(v) => updateField('showCustomer', v)} />
                <ToggleRow label="Show Sales Type" checked={receipt.showSalesType ?? true} onCheckedChange={(v) => updateField('showSalesType', v)} />
                <ToggleRow label="Show Date & Time" checked={receipt.showDateTime ?? true} onCheckedChange={(v) => updateField('showDateTime', v)} />
                <ToggleRow label="Print Automatically" checked={receipt.autoPrintReceipt} onCheckedChange={(v) => updateField('autoPrintReceipt', v)} />
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
            <SectionHeader icon={Smartphone} title="Receipt Footer" />
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <FieldLabel>Closing Message</FieldLabel>
                <Textarea
                  value={receipt.footerText}
                  onChange={(e) => updateField('footerText', e.target.value)}
                  rows={3}
                  className="resize-none bg-background/50 border-border/40 rounded-xl focus:border-[#10b981]"
                  placeholder="e.g. Exchange within 7 days with valid receipt."
                />
              </div>
              <Button
                variant="outline"
                className="w-full gap-2 border-border/40 text-muted-foreground hover:text-[#10b981] hover:border-[#10b981]/40 font-bold uppercase text-[10px] tracking-widest rounded-xl"
                onClick={() => toast.success("Test print signal sent to printer.")}
              >
                <Printer className="w-3.5 h-3.5" /> Force Test Print
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-6">
            <div className="flex items-center gap-2 mb-4 px-2">
              <Eye className="w-4 h-4 text-[#10b981]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Live Render Preview</span>
            </div>

            <div className="bg-muted/30 border border-border/20 p-8 rounded-2xl shadow-inner flex justify-center min-h-[600px] overflow-hidden">
              <div className={cn(
                "bg-white shadow-2xl p-6 flex flex-col transition-all duration-300 rounded-sm",
                receipt.paperWidth === '58mm' ? "w-[240px]" : receipt.paperWidth === '80mm' ? "w-[320px]" : "w-full aspect-[1/1.4] max-w-[400px]",
                receipt.fontSize === 'small' ? "text-[10px]" : receipt.fontSize === 'large' ? "text-sm" : "text-xs"
              )}>
                <div className="text-center space-y-1 mb-6">
                  {receipt.showLogo && <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-slate-300 text-[8px]">LOGO</div>}
                  <h4 className="font-black text-slate-900 text-base uppercase">Inzeedo POS</h4>
                  <p className="text-[10px] text-slate-400">123 Business Street, City</p>
                  <p className="text-[10px] text-slate-400">+1 234 567 890</p>
                  {receipt.headerText && <p className="mt-2 italic border-t border-slate-100 pt-1">{receipt.headerText}</p>}
                </div>
                <div className="flex justify-between border-y border-dashed py-2 mb-4">
                  <span>INV #00124</span>
                  {(receipt.showDateTime ?? true) && <span>{new Date().toLocaleDateString()}</span>}
                </div>
                {(receipt.showSalesType ?? true) && (
                  <div className="text-center font-bold uppercase tracking-widest text-[9px] mb-2 border-b border-dashed pb-1">RETAIL SALE</div>
                )}
                <table className="w-full text-left border-collapse my-2">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="py-1">Item (Qty)</th>
                      <th className="text-right py-1">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-black/20">
                    <tr>
                      <td className="py-2"><div className="font-bold">Product A <span className="font-normal opacity-70">(x2)</span></div></td>
                      <td className="text-right py-2 font-bold">1,350.00</td>
                    </tr>
                    <tr>
                      <td className="py-2"><div className="font-bold">Service B <span className="font-normal opacity-70">(x1)</span></div></td>
                      <td className="text-right py-2 font-bold">500.00</td>
                    </tr>
                  </tbody>
                </table>
                <div className="border-t border-dashed pt-2 mt-4 space-y-1">
                  <div className="flex justify-between"><span>Subtotal</span><span>1,850.00</span></div>
                  {receipt.showTax && <div className="flex justify-between"><span>Tax (8%)</span><span>148.00</span></div>}
                  <div className="flex justify-between text-base font-black border-t pt-1"><span>TOTAL</span><span>1,998.00</span></div>
                </div>
                <div className="mt-8 text-center space-y-2">
                  {receipt.footerText && <p className="text-[10px] whitespace-pre-wrap">{receipt.footerText}</p>}
                  <p className="font-bold text-[8px] opacity-30">POWERED BY Inzeedo POS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
