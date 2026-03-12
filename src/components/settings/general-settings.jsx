"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { useSettings } from "@/app/hooks/swr/useSettings";
import { toast } from "sonner";
import { useEffect, useState, useMemo } from "react";
import { 
  Globe, Palette, Hash, 
  Save, CreditCard, Search,
  Check, Trash2, Plus, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// --- CONSTANTS: Time Zones & Currencies ---
const TIMEZONES = [
  "Etc/UTC", "Pacific/Midway", "Pacific/Honolulu", "America/Anchorage", 
  "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York", 
  "America/Sao_Paulo", "Europe/London", "Europe/Paris", "Europe/Berlin", 
  "Europe/Moscow", "Africa/Cairo", "Africa/Johannesburg", "Asia/Dubai", 
  "Asia/Karachi", "Asia/Kolkata", "Asia/Bangkok", "Asia/Shanghai", 
  "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland"
];

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];

export function GeneralSettings() {
  const { useModularSettings, updateModularSettings } = useSettings();
  const { data: response, isLoading } = useModularSettings('general');

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initialize active tab from URL query param or default to 'localization'
  const [activeTab, setActiveTab] = useState(searchParams.get("config") || "localization");

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

  const [searchTerm, setSearchTerm] = useState("");

  const [settings, setSettings] = useState({
    localization: { currency: "LKR", timeZone: "Asia/Kolkata", dateFormat: "ymd", timeFormat: "12", language: "en" },
    finance: { fyStart: "jan", precision: "2", currencyPos: "before", taxRate: "8" },
    interface: { theme: "system", color: "blue", fontSize: 14, sidebar: "fixed" },
    modules: { inventory: true, pos: true, accounting: true, hrm: false, crm: false },
    prefixes: { sale: "INV", purchase: "PO", estimate: "EST", customer: "CUS", supplier: "SUP", employee: "EMP" },
    bankAccounts: []
  });

  useEffect(() => {
    if (response?.data) {
      setSettings(prev => ({ 
        ...prev, 
        ...response.data,
        prefixes: response.data.prefixes || prev.prefixes,
        bankAccounts: response.data.bankAccounts || prev.bankAccounts
      }));
    }
  }, [response]);

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value }
    }));
  };

  const handleSave = async () => {
    const result = await updateModularSettings('general', settings);
    if (result.success) {
        toast.success("General settings saved successfully");
    } else {
        toast.error(result.error || "Failed to save settings");
    }
  };

  // Filter Timezones
  const filteredTimezones = useMemo(() => {
    return TIMEZONES.filter(tz => tz.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#10b981]" /></div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">General Settings</h2>
          <p className="text-sm text-slate-500">Configure core system parameters.</p>
        </div>
        <Button onClick={handleSave} className="bg-[#10b981] hover:bg-[#059669] shadow-lg shadow-[#10b981]/20 text-white rounded-xl font-bold text-xs uppercase tracking-widest border-none transition-all active:scale-95">
          <Save className="w-4 h-4 mr-2" /> Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="localization" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <ScrollArea className="w-full whitespace-nowrap rounded-xl border border-border/30 bg-muted/20 p-1">
          <TabsList className="w-full justify-start bg-transparent h-auto">
            <TabsTrigger value="localization" className="gap-2 rounded-lg data-[state=active]:bg-[#10b981]/10 data-[state=active]:text-[#10b981] data-[state=active]:shadow-sm font-bold text-[11px] uppercase tracking-wider"><Globe className="w-4 h-4"/> Region & Finance</TabsTrigger>
            <TabsTrigger value="interface" className="gap-2 rounded-lg data-[state=active]:bg-[#10b981]/10 data-[state=active]:text-[#10b981] data-[state=active]:shadow-sm font-bold text-[11px] uppercase tracking-wider"><Palette className="w-4 h-4"/> Look & Feel</TabsTrigger>
            <TabsTrigger value="prefixes" className="gap-2 rounded-lg data-[state=active]:bg-[#10b981]/10 data-[state=active]:text-[#10b981] data-[state=active]:shadow-sm font-bold text-[11px] uppercase tracking-wider"><Hash className="w-4 h-4"/> Prefixes</TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* 1. LOCALIZATION & FINANCE */}
        <TabsContent value="localization" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Regional */}
            <Card>
              <CardHeader>
                <CardTitle>Localization</CardTitle>
                <CardDescription>Date, Time, and Zone preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                   <Label>Time Zone</Label>
                   <Dialog>
                     <DialogTrigger asChild>
                       <Button variant="outline" className="w-full justify-between font-normal text-slate-700">
                         {settings.localization.timeZone}
                         <Search className="w-4 h-4 opacity-50" />
                       </Button>
                     </DialogTrigger>
                     <DialogContent>
                       <DialogHeader>
                         <DialogTitle>Select Time Zone</DialogTitle>
                       </DialogHeader>
                       <Input 
                         placeholder="Search timezones..." 
                         className="mb-2" 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                       />
                       <ScrollArea className="h-[300px]">
                          {filteredTimezones.map((tz) => (
                            <div 
                              key={tz} 
                              className="p-2 hover:bg-muted/30 cursor-pointer text-sm rounded flex justify-between"
                              onClick={() => updateSetting('localization', 'timeZone', tz)}
                            >
                              {tz}
                              {settings.localization.timeZone === tz && <Check className="w-4 h-4 text-blue-600"/>}
                            </div>
                          ))}
                       </ScrollArea>
                     </DialogContent>
                   </Dialog>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Select value={settings.localization.dateFormat} onValueChange={(v) => updateSetting('localization', 'dateFormat', v)}>
                       <SelectTrigger><SelectValue/></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="dmy">DD-MM-YYYY</SelectItem>
                         <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                         <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Time Format</Label>
                    <Select value={settings.localization.timeFormat} onValueChange={(v) => updateSetting('localization', 'timeFormat', v)}>
                       <SelectTrigger><SelectValue/></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="12">12 Hour (AM/PM)</SelectItem>
                         <SelectItem value="24">24 Hour</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Settings</CardTitle>
                <CardDescription>Currency and Fiscal Year setup.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                   <Label>Primary Currency</Label>
                   <Select value={settings.localization.currency} onValueChange={(v) => updateSetting('localization', 'currency', v)}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.code} - {c.name} ({c.symbol})</SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol Position</Label>
                    <Select value={settings.finance.currencyPos} onValueChange={(v) => updateSetting('finance', 'currencyPos', v)}>
                       <SelectTrigger><SelectValue/></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="before">Before ($100)</SelectItem>
                         <SelectItem value="after">After (100$)</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fiscal Year Start</Label>
                    <Select value={settings.finance.fyStart} onValueChange={(v) => updateSetting('finance', 'fyStart', v)}>
                       <SelectTrigger><SelectValue/></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="jan">January</SelectItem>
                         <SelectItem value="apr">April</SelectItem>
                         <SelectItem value="jul">July</SelectItem>
                         <SelectItem value="oct">October</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bank Accounts Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
               <div>
                  <CardTitle>Bank Accounts</CardTitle>
                  <CardDescription>Manage accounts displayed on invoices.</CardDescription>
               </div>
               <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-2"/> Add Account</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Bank Account</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const newAccount = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: formData.get("name"),
                        accountNo: formData.get("accountNo"),
                        currency: formData.get("currency"),
                        status: "active"
                      };
                      setSettings(prev => ({
                        ...prev,
                        bankAccounts: [...(prev.bankAccounts || []), newAccount]
                      }));
                      toast.success("Account added to list. Click Save to persist.");
                    }} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Account Name</Label>
                        <Input name="name" placeholder="e.g. Chase Business Checking" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Number</Label>
                        <Input name="accountNo" placeholder="**** 4242" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select name="currency" defaultValue="LKR">
                          <SelectTrigger><SelectValue/></SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full bg-blue-600">Add to List</Button>
                    </form>
                  </DialogContent>
               </Dialog>
            </CardHeader>
            <CardContent>
               <div className="space-y-3">
                  {settings.bankAccounts?.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed rounded-lg">
                      No bank accounts added yet.
                    </div>
                  ) : (
                    settings.bankAccounts.map((acc) => (
                      <div key={acc.id} className="flex items-center justify-between p-3 border rounded-lg bg-white hover:border-[#10b981]/40 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-[#10b981]/10 text-[#10b981] rounded-lg flex items-center justify-center">
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{acc.name}</div>
                              <div className="text-xs text-slate-500">{acc.accountNo} | {acc.currency}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 uppercase text-[10px]">{acc.status}</Badge>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-red-500"
                              onClick={() => {
                                setSettings(prev => ({
                                  ...prev,
                                  bankAccounts: prev.bankAccounts.filter(a => a.id !== acc.id)
                                }));
                              }}
                            >
                              <Trash2 className="w-4 h-4"/>
                            </Button>
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. INTERFACE */}
        <TabsContent value="interface" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Theme & Display</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                     <Label>Color Mode</Label>
                     <div className="flex gap-2">
                        {['light', 'dark', 'system'].map(mode => (
                           <div 
                             key={mode} 
                             onClick={() => updateSetting('interface', 'theme', mode)}
                             className={cn(
                               "flex-1 p-3 text-center border rounded-lg cursor-pointer capitalize text-sm transition-all",
                               settings.interface.theme === mode ? "border-[#10b981] bg-[#10b981]/10 text-[#059669]" : "hover:bg-muted/20"
                             )}
                           >
                              {mode}
                           </div>
                        ))}
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                     <div className="flex justify-between">
                        <Label>Base Font Size</Label>
                        <span className="text-xs font-mono bg-slate-100 px-2 rounded">{settings.interface.fontSize}px</span>
                     </div>
                     <Slider 
                        value={[settings.interface.fontSize]} 
                        max={18} min={12} step={1} 
                        onValueChange={(val) => updateSetting('interface', 'fontSize', val[0])}
                     />
                  </div>

                  <div className="flex items-center justify-between border-t pt-4">
                     <Label className="flex flex-col">
                        <span>Collapsible Sidebar</span>
                        <span className="text-xs font-normal text-slate-500">Allow sidebar to minimize</span>
                     </Label>
                     <Switch 
                        checked={settings.interface.sidebar === 'collapsed'} 
                        onCheckedChange={(c) => updateSetting('interface', 'sidebar', c ? 'collapsed' : 'fixed')} 
                     />
                  </div>
                </CardContent>
              </Card>

              <Card>
                 <CardHeader>
                    <CardTitle>System Modules</CardTitle>
                    <CardDescription>Toggle features to declutter the interface.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    {Object.entries({
                       inventory: "Inventory Management",
                       pos: "Point of Sale",
                       accounting: "Accounting & Finance",
                       hrm: "HR & Payroll",
                       crm: "CRM & Leads",
                    }).map(([key, label]) => (
                       <div key={key} className="flex items-center justify-between">
                          <Label className="cursor-pointer" htmlFor={`mod-${key}`}>{label}</Label>
                          <Switch 
                             id={`mod-${key}`}
                             checked={settings.modules[key]} 
                             onCheckedChange={(c) => {
                                const newMods = { ...settings.modules, [key]: c };
                                updateSetting('modules', key, c); // Simplified for demo
                                setSettings(prev => ({ ...prev, modules: newMods }));
                             }} 
                          />
                       </div>
                    ))}
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        {/* 3. PREFIXES */}
        <TabsContent value="prefixes" className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
           <Card>
              <CardHeader>
                 <CardTitle>Document Prefixes</CardTitle>
                 <CardDescription>Standardize your document numbering.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                    {[
                       { label: 'Sales Invoice', key: 'sale', placeholder: 'INV' },
                       { label: 'Purchase Order', key: 'purchase', placeholder: 'PO' },
                       { label: 'Estimate / Quote', key: 'estimate', placeholder: 'EST' },
                       { label: 'Customer', key: 'customer', placeholder: 'CUS' },
                       { label: 'Supplier', key: 'supplier', placeholder: 'SUP' },
                       { label: 'Employee', key: 'employee', placeholder: 'EMP' },
                    ].map((item) => (
                       <div key={item.key} className="space-y-2">
                          <Label>{item.label}</Label>
                          <div className="flex">
                             <div className="bg-slate-100 border border-r-0 rounded-l-md px-3 flex items-center text-slate-500 text-sm font-mono">
                                #
                             </div>
                             <Input 
                               className="rounded-l-none font-mono uppercase" 
                               placeholder={item.placeholder} 
                               value={settings.prefixes?.[item.key] || ""} 
                               onChange={(e) => updateSetting('prefixes', item.key, e.target.value)}
                             />
                          </div>
                       </div>
                    ))}
                  </div>
              </CardContent>
           </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}