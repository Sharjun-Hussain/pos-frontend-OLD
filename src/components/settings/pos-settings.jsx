import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useSettings } from "@/app/hooks/swr/useSettings";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { 
  Save, Volume2, Printer, Percent, Calculator, 
  CreditCard, Banknote, Smartphone, QrCode, 
  FileText, ScrollText, CheckCircle2, Settings2, Loader2,
  Music, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { safeMergeSettings } from "@/lib/settings-utils";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// --- Mock Data for Payment Methods ---
const AVAILABLE_PAYMENTS = [
  { id: "cash", label: "Cash", icon: Banknote, desc: "Physical currency" },
  { id: "card", label: "Card Terminal", icon: CreditCard, desc: "Credit/Debit transactions" },
  { id: "online", label: "Online Transfer", icon: GlobeIcon, desc: "Bank transfer / Reference" },
  { id: "qr", label: "QR Payment", icon: QrCode, desc: "Scan to pay (Alipay/WeChat)" },
  { id: "wallet", label: "Digital Wallet", icon: Smartphone, desc: "Apple Pay / Google Pay" },
];

function GlobeIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

export function PosSettings() {
  const { useModularSettings, updateModularSettings } = useSettings();
  const { data: response, isLoading } = useModularSettings('pos');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initialize active tab from URL query param or default to 'behavior'
  const [activeTab, setActiveTab] = useState(searchParams.get("config") || "behavior");

  // Sync state when URL param changes
  useEffect(() => {
    const config = searchParams.get("config");
    if (config) setActiveTab(config);
  }, [searchParams]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    // Update URL without reloading the page
    const params = new URLSearchParams(searchParams);
    params.set("config", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [formData, setFormData] = useState({
    enableSound: true,
    beepStyle: "default",
    showReceiptPreview: true,
    showDiscount: true,
    showTax: true,
    activePaymentMethods: ["cash", "card"],
    invoiceTemplate: "thermal_80",
    defaultPaymentMethod: "cash"
  });

  useEffect(() => {
    if (response?.data) {
      setFormData(prev => safeMergeSettings(prev, response.data));
    }
  }, [response]);

  const togglePayment = (id) => {
    setFormData(prev => {
        const active = prev.activePaymentMethods || [];
        const newActive = active.includes(id) ? active.filter(p => p !== id) : [...active, id];
        return { ...prev, activePaymentMethods: newActive };
    });
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const result = await updateModularSettings('pos', formData);
    if (result.success) {
        toast.success("POS Configuration Saved Successfully");
    } else {
        toast.error(result.error || "Failed to save settings");
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
           <h2 className="text-xl font-bold tracking-tight text-slate-900">POS Configuration</h2>
           <p className="text-sm text-slate-500">Manage terminal behavior, hardware, and payments.</p>
        </div>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
            <Save className="w-4 h-4 mr-2"/> Save Changes
        </Button>
      </div>

      <Tabs defaultValue="behavior" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="invoice">Invoice & Print</TabsTrigger>
          <TabsTrigger value="printer">Printers</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: BEHAVIOR --- */}
        <TabsContent value="behavior" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
           <Card>
             <CardHeader>
               <CardTitle className="text-base">Terminal Interactions</CardTitle>
               <CardDescription>Customize how the POS interface reacts to actions.</CardDescription>
             </CardHeader>
             <CardContent className="grid gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-md"><Volume2 className="w-4 h-4 text-slate-600"/></div>
                        <div>
                            <Label className="text-base">Sound Effects</Label>
                            <p className="text-xs text-slate-500">Enable audio feedback on POS actions.</p>
                        </div>
                    </div>
                    <Switch checked={formData.enableSound} onCheckedChange={(c) => updateField('enableSound', c)} />
                </div>

                {formData.enableSound && (
                    <div className="pl-12 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-sm font-semibold">Beep Tone Style</Label>
                        <Select value={formData.beepStyle} onValueChange={(v) => updateField('beepStyle', v)}>
                            <SelectTrigger className="w-[300px]">
                                <SelectValue placeholder="Select tone style" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Standard Beep</SelectItem>
                                <SelectItem value="subtle">Subtle Click</SelectItem>
                                <SelectItem value="mechanical">Mechanical (Cash Register)</SelectItem>
                                <SelectItem value="digital">Digital Synthetic</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
                
                <Separator />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-md"><Eye className="w-4 h-4 text-slate-600"/></div>
                        <div>
                            <Label className="text-base">Checkout Live Preview</Label>
                            <p className="text-xs text-slate-500">Show receipt preview during checkout process.</p>
                        </div>
                    </div>
                    <Switch checked={formData.showReceiptPreview} onCheckedChange={(c) => updateField('showReceiptPreview', c)} />
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-md"><Percent className="w-4 h-4 text-slate-600"/></div>
                        <div>
                            <Label className="text-base">Line Item Discounts</Label>
                            <p className="text-xs text-slate-500">Allow cashier to discount specific items.</p>
                        </div>
                    </div>
                    <Switch checked={formData.showDiscount} onCheckedChange={(c) => updateField('showDiscount', c)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-md"><Calculator className="w-4 h-4 text-slate-600"/></div>
                        <div>
                            <Label className="text-base">Tax Breakdown</Label>
                            <p className="text-xs text-slate-500">Show detailed tax calculation in cart.</p>
                        </div>
                    </div>
                    <Switch checked={formData.showTax} onCheckedChange={(c) => updateField('showTax', c)} />
                </div>
             </CardContent>
           </Card>
        </TabsContent>

        {/* --- TAB 2: INVOICE & TEMPLATES --- */}
        <TabsContent value="invoice" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Template Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Receipt Template</CardTitle>
                    <CardDescription>Select the layout style for printed receipts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { id: "thermal_80", label: "Thermal 80mm", desc: "Standard POS", icon: ScrollText },
                            { id: "thermal_58", label: "Thermal 58mm", desc: "Narrow", icon: ScrollText },
                            { id: "a4_basic", label: "A4 Invoice", desc: "Full Page", icon: FileText },
                        ].map((tpl) => (
                            <div 
                                key={tpl.id}
                                onClick={() => updateField('invoiceTemplate', tpl.id)}
                                className={cn(
                                    "relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-slate-50",
                                    formData.invoiceTemplate === tpl.id 
                                        ? "border-blue-600 bg-blue-50/50" 
                                        : "border-slate-100 bg-white"
                                )}
                            >
                                {formData.invoiceTemplate === tpl.id && (
                                    <div className="absolute top-2 right-2 text-blue-600">
                                        <CheckCircle2 className="w-5 h-5 fill-blue-100" />
                                    </div>
                                )}
                                <div className="mb-3 p-2 w-fit rounded-lg bg-slate-100">
                                    <tpl.icon className="w-6 h-6 text-slate-600" />
                                </div>
                                <h4 className="font-semibold text-sm">{tpl.label}</h4>
                                <p className="text-xs text-slate-500">{tpl.desc}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Sequence Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Invoice Sequencing</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Invoice Prefix</Label>
                        <Input placeholder="INV-" defaultValue="INV-" />
                        <p className="text-[10px] text-slate-400">Example: INV-001</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Next Number</Label>
                        <Input type="number" placeholder="1001" />
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* --- TAB 3: PRINTERS --- */}
        <TabsContent value="printer" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
           <Card>
                <CardHeader>
                    <CardTitle className="text-base">Printer Configuration</CardTitle>
                    <CardDescription>Setup connection to thermal or laser printers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Connection Type</Label>
                            <Select defaultValue="usb">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="usb">USB / Direct</SelectItem>
                                    <SelectItem value="network">Network (LAN/WiFi)</SelectItem>
                                    <SelectItem value="bluetooth">Bluetooth</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <Label>Paper Size</Label>
                            <Select defaultValue="80mm">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="80mm">80mm (Standard Thermal)</SelectItem>
                                    <SelectItem value="58mm">58mm (Narrow Thermal)</SelectItem>
                                    <SelectItem value="a4">A4 / Letter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Target Printer (System Name)</Label>
                        <div className="flex gap-2">
                            <Input placeholder="e.g., EPSON_TM_T82" />
                            <Button variant="outline"><Settings2 className="w-4 h-4 mr-2"/> Test Print</Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-md"><Printer className="w-4 h-4 text-slate-600"/></div>
                            <div>
                                <Label className="text-base">Auto-Cut Paper</Label>
                                <p className="text-xs text-slate-500">Send cut command after print.</p>
                            </div>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </CardContent>
           </Card>
        </TabsContent>

        {/* --- TAB 4: PAYMENTS (The New Requirement) --- */}
        <TabsContent value="payments" className="mt-6 animate-in fade-in slide-in-from-bottom-2">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Active Payment Methods</CardTitle>
                    <CardDescription>
                        Select which payment options are visible on the POS checkout screen.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {AVAILABLE_PAYMENTS.map((payment) => {
                            const isSelected = (formData.activePaymentMethods || []).includes(payment.id);
                            return (
                                <div
                                    key={payment.id}
                                    onClick={() => togglePayment(payment.id)}
                                    className={cn(
                                        "group relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none",
                                        isSelected 
                                            ? "border-blue-600 bg-blue-50/30" 
                                            : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm"
                                    )}
                                >
                                    {/* Checkmark Indicator */}
                                    <div className={cn(
                                        "absolute top-3 right-3 h-5 w-5 rounded-full border flex items-center justify-center transition-colors",
                                        isSelected 
                                            ? "bg-blue-600 border-blue-600" 
                                            : "bg-transparent border-slate-300 group-hover:border-blue-300"
                                    )}>
                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                    </div>

                                    {/* Icon */}
                                    <div className={cn(
                                        "p-3 rounded-lg transition-colors",
                                        isSelected ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                                    )}>
                                        <payment.icon className="w-6 h-6" />
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 pt-0.5">
                                        <h4 className={cn(
                                            "font-semibold text-sm",
                                            isSelected ? "text-blue-900" : "text-slate-700"
                                        )}>
                                            {payment.label}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                                            {payment.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
                 <CardFooter className="bg-slate-50/50 border-t p-4">
                     <div className="w-full flex items-center gap-2 text-sm text-slate-500">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>{(formData.activePaymentMethods || []).length} methods enabled for cashier.</span>
                     </div>
                </CardFooter>
            </Card>

            <div className="mt-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Default Method</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Label className="whitespace-nowrap">Select Default:</Label>
                            <Select value={formData.defaultPaymentMethod} onValueChange={(v) => updateField('defaultPaymentMethod', v)}>
                                <SelectTrigger className="w-[300px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {AVAILABLE_PAYMENTS.filter(p => (formData.activePaymentMethods || []).includes(p.id)).map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                 </Card>
            </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}