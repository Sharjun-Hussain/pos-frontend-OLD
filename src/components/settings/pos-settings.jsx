import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  Save, Volume2, Printer, Percent, Calculator,
  CreditCard, Banknote, Smartphone, QrCode,
  FileText, ScrollText, CheckCircle2, Settings2, Loader2, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { safeMergeSettings } from "@/lib/settings-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const AVAILABLE_PAYMENTS = [
  { id: "cash", label: "Cash", icon: Banknote, desc: "Physical currency" },
  { id: "card", label: "Card Terminal", icon: CreditCard, desc: "Credit/Debit transactions" },
  { id: "online", label: "Online Transfer", icon: CreditCard, desc: "Bank transfer / Reference" },
  { id: "qr", label: "QR Payment", icon: QrCode, desc: "Scan to pay" },
  { id: "wallet", label: "Digital Wallet", icon: Smartphone, desc: "Apple Pay / Google Pay" },
];

const SectionHeader = ({ icon: Icon, title, desc }) => (
  <div className="bg-muted/30 border-b border-border/30 px-6 py-4">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-[#10b981]" />
      <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">{title}</h3>
    </div>
    {desc && <p className="text-[10px] text-muted-foreground/50 font-medium mt-0.5 ml-6">{desc}</p>}
  </div>
);

const ToggleRow = ({ icon: Icon, label, desc, checked, onCheckedChange }) => (
  <div className="flex items-center justify-between py-4 group">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-muted/40 text-muted-foreground/40 group-hover:bg-[#10b981]/10 group-hover:text-[#10b981] transition-all">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[13px] font-bold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground/50 font-medium">{desc}</p>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export function PosSettings() {
  const { useModularSettings, updateModularSettings } = useSettings();
  const { data: response, isLoading } = useModularSettings('pos');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(searchParams.get("config") || "behavior");

  useEffect(() => {
    const config = searchParams.get("config");
    if (config) setActiveTab(config);
  }, [searchParams]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams);
    params.set("config", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [formData, setFormData] = useState({
    enableSound: true, beepStyle: "default", showReceiptPreview: true,
    showDiscount: true, showTax: true, activePaymentMethods: ["cash", "card"],
    invoiceTemplate: "thermal_80", defaultPaymentMethod: "cash"
  });

  useEffect(() => {
    if (response?.data) setFormData(prev => safeMergeSettings(prev, response.data));
  }, [response]);

  const togglePayment = (id) => {
    setFormData(prev => {
      const active = prev.activePaymentMethods || [];
      return { ...prev, activePaymentMethods: active.includes(id) ? active.filter(p => p !== id) : [...active, id] };
    });
  };

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    const result = await updateModularSettings('pos', formData);
    if (result.success) toast.success("POS Configuration Saved Successfully");
    else toast.error(result.error || "Failed to save settings");
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#10b981]" /></div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">POS Configuration</h2>
          <p className="text-sm text-muted-foreground/60 font-medium mt-0.5">Manage terminal behavior, hardware, and payments.</p>
        </div>
        <Button onClick={handleSave} className="bg-[#10b981] hover:bg-[#059669] text-white h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-none shadow-lg shadow-[#10b981]/20 transition-all active:scale-95 gap-2">
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Tab Bar */}
        <div className="bg-muted/20 border border-border/30 rounded-xl p-1">
          <TabsList className="w-full grid grid-cols-4 bg-transparent gap-1 h-auto">
            {[
              { id: "behavior", label: "Behavior" },
              { id: "invoice", label: "Invoice & Print" },
              { id: "printer", label: "Printers" },
              { id: "payments", label: "Payments" },
            ].map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-lg data-[state=active]:bg-[#10b981]/10 data-[state=active]:text-[#10b981] data-[state=active]:shadow-sm font-bold text-[11px] uppercase tracking-wider text-muted-foreground py-2.5"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* TAB 1: BEHAVIOR */}
        <TabsContent value="behavior" className="mt-4">
          <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
            <SectionHeader icon={Volume2} title="Terminal Interactions" desc="Customize how the POS interface reacts to actions." />
            <CardContent className="p-6 divide-y divide-border/20">
              <ToggleRow icon={Volume2} label="Sound Effects" desc="Enable audio feedback on POS actions." checked={formData.enableSound} onCheckedChange={(c) => updateField('enableSound', c)} />
              {formData.enableSound && (
                <div className="py-4 pl-11 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-2 block">Beep Tone Style</label>
                  <Select value={formData.beepStyle} onValueChange={(v) => updateField('beepStyle', v)}>
                    <SelectTrigger className="w-[300px] h-10 bg-background/50 border-border/40 rounded-xl focus:border-[#10b981]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Standard Beep</SelectItem>
                      <SelectItem value="subtle">Subtle Click</SelectItem>
                      <SelectItem value="mechanical">Mechanical (Cash Register)</SelectItem>
                      <SelectItem value="digital">Digital Synthetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <ToggleRow icon={Eye} label="Checkout Live Preview" desc="Show receipt preview during checkout process." checked={formData.showReceiptPreview} onCheckedChange={(c) => updateField('showReceiptPreview', c)} />
              <ToggleRow icon={Percent} label="Line Item Discounts" desc="Allow cashier to discount specific items." checked={formData.showDiscount} onCheckedChange={(c) => updateField('showDiscount', c)} />
              <ToggleRow icon={Calculator} label="Tax Breakdown" desc="Show detailed tax calculation in cart." checked={formData.showTax} onCheckedChange={(c) => updateField('showTax', c)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: INVOICE & PRINT */}
        <TabsContent value="invoice" className="mt-4 space-y-4">
          <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
            <SectionHeader icon={ScrollText} title="Receipt Template" desc="Select the layout style for printed receipts." />
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: "thermal_80", label: "Thermal 80mm", desc: "Standard POS", icon: ScrollText },
                  { id: "thermal_58", label: "Thermal 58mm", desc: "Narrow roll", icon: ScrollText },
                  { id: "a4_basic", label: "A4 Invoice", desc: "Full page print", icon: FileText },
                ].map((tpl) => {
                  const isActive = formData.invoiceTemplate === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => updateField('invoiceTemplate', tpl.id)}
                      className={cn(
                        "relative cursor-pointer rounded-xl border-2 p-5 transition-all",
                        isActive ? "border-[#10b981] bg-[#10b981]/5" : "border-border/30 bg-background hover:border-[#10b981]/30 hover:bg-muted/20"
                      )}
                    >
                      {isActive && <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-[#10b981]" />}
                      <div className={cn("mb-3 p-2 w-fit rounded-lg transition-all", isActive ? "bg-[#10b981]/10 text-[#10b981]" : "bg-muted/40 text-muted-foreground/40")}>
                        <tpl.icon className="w-6 h-6" />
                      </div>
                      <h4 className={cn("font-black text-[12px] uppercase tracking-widest", isActive ? "text-[#10b981]" : "text-foreground")}>{tpl.label}</h4>
                      <p className="text-[10px] text-muted-foreground/50 font-medium mt-0.5">{tpl.desc}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
            <SectionHeader icon={FileText} title="Invoice Sequencing" />
            <CardContent className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Invoice Prefix</label>
                <Input placeholder="INV-" defaultValue="INV-" className="h-11 bg-background/50 border-border/40 rounded-xl focus:border-[#10b981]" />
                <p className="text-[10px] text-muted-foreground/40">Example: INV-001</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Next Number</label>
                <Input type="number" placeholder="1001" className="h-11 bg-background/50 border-border/40 rounded-xl focus:border-[#10b981]" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PRINTERS */}
        <TabsContent value="printer" className="mt-4">
          <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
            <SectionHeader icon={Printer} title="Printer Configuration" desc="Setup connection to thermal or laser printers." />
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Connection Type</label>
                  <Select defaultValue="usb">
                    <SelectTrigger className="h-11 bg-background/50 border-border/40 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usb">USB / Direct</SelectItem>
                      <SelectItem value="network">Network (LAN/WiFi)</SelectItem>
                      <SelectItem value="bluetooth">Bluetooth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Paper Size</label>
                  <Select defaultValue="80mm">
                    <SelectTrigger className="h-11 bg-background/50 border-border/40 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="80mm">80mm (Standard Thermal)</SelectItem>
                      <SelectItem value="58mm">58mm (Narrow Thermal)</SelectItem>
                      <SelectItem value="a4">A4 / Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Target Printer (System Name)</label>
                <div className="flex gap-3">
                  <Input placeholder="e.g., EPSON_TM_T82" className="h-11 bg-background/50 border-border/40 rounded-xl focus:border-[#10b981]" />
                  <Button variant="outline" className="h-11 border-border/40 rounded-xl font-bold text-[10px] uppercase tracking-widest text-muted-foreground hover:text-[#10b981] gap-2 shrink-0">
                    <Settings2 className="w-4 h-4" /> Test Print
                  </Button>
                </div>
              </div>
              <Separator className="opacity-20" />
              <ToggleRow icon={Printer} label="Auto-Cut Paper" desc="Send cut command after each print." checked={true} onCheckedChange={() => {}} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: PAYMENTS */}
        <TabsContent value="payments" className="mt-4 space-y-4">
          <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
            <SectionHeader icon={CreditCard} title="Active Payment Methods" desc="Select which payment options are visible at checkout." />
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {AVAILABLE_PAYMENTS.map((payment) => {
                  const isSelected = (formData.activePaymentMethods || []).includes(payment.id);
                  return (
                    <div
                      key={payment.id}
                      onClick={() => togglePayment(payment.id)}
                      className={cn(
                        "group relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none",
                        isSelected ? "border-[#10b981] bg-[#10b981]/5" : "border-border/30 bg-background hover:border-[#10b981]/30 hover:bg-muted/20"
                      )}
                    >
                      <div className={cn(
                        "absolute top-3 right-3 h-5 w-5 rounded-full border flex items-center justify-center transition-colors",
                        isSelected ? "bg-[#10b981] border-[#10b981]" : "bg-transparent border-border/40"
                      )}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className={cn("p-3 rounded-xl transition-colors", isSelected ? "bg-[#10b981]/10 text-[#10b981]" : "bg-muted/40 text-muted-foreground/40")}>
                        <payment.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <h4 className={cn("font-black text-[12px] uppercase tracking-widest", isSelected ? "text-[#10b981]" : "text-foreground")}>{payment.label}</h4>
                        <p className="text-[10px] text-muted-foreground/50 font-medium mt-1">{payment.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border/20 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">{(formData.activePaymentMethods || []).length} methods enabled for cashier</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
            <SectionHeader icon={CreditCard} title="Default Payment Method" />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] whitespace-nowrap">Select Default:</label>
                <Select value={formData.defaultPaymentMethod} onValueChange={(v) => updateField('defaultPaymentMethod', v)}>
                  <SelectTrigger className="w-[300px] h-11 bg-background/50 border-border/40 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_PAYMENTS.filter(p => (formData.activePaymentMethods || []).includes(p.id)).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}