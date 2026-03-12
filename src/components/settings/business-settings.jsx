"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { toast } from "sonner";
import { Save, Upload, Loader2, Store, BadgeCheck, Globe, Phone, Mail, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function BusinessSettings() {
  const { useBusinessSettings, updateBusinessSettings, uploadLogo } = useSettings();
  const { data: response, isLoading } = useBusinessSettings();
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formData, setFormData] = useState({
    businessName: '', taxId: '', businessType: 'retail',
    website: '', email: '', phone: '', address: '', city: '', state: '', zipCode: ''
  });

  useEffect(() => {
    if (response?.data) {
      const org = response.data;
      setFormData({
        businessName: org.name || '', taxId: org.tax_id || '',
        businessType: org.business_type || 'retail', website: org.website || '',
        email: org.email || '', phone: org.phone || '', address: org.address || '',
        city: org.city || '', state: org.state || '', zipCode: org.zip_code || ''
      });
      if (org.logo) setLogoPreview(`${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${org.logo}`);
    }
  }, [response]);

  const handleSave = async () => {
    const payload = {
      name: formData.businessName, tax_id: formData.taxId,
      business_type: formData.businessType, website: formData.website,
      email: formData.email, phone: formData.phone, address: formData.address,
      city: formData.city, state: formData.state, zip_code: formData.zipCode
    };
    const result = await updateBusinessSettings(payload);
    if (logoFile) {
      const logoResult = await uploadLogo(logoFile);
      if (!logoResult.success) toast.error("Failed to upload logo: " + logoResult.error);
    }
    if (result.success) toast.success("Business settings saved successfully");
    else toast.error(result.error || "Failed to save settings");
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error("File size must be less than 2MB");
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#10b981]" /></div>;

  const FieldLabel = ({ children, required }) => (
    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-0.5 flex items-center gap-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Business Identity</h2>
          <p className="text-sm text-muted-foreground/60 font-medium mt-0.5">Details used for billing, legal documents, and store profile.</p>
        </div>
        <Button onClick={handleSave} className="bg-[#10b981] hover:bg-[#059669] text-white h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-none shadow-lg shadow-[#10b981]/20 transition-all active:scale-95 gap-2">
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </div>

      {/* Logo + Core Fields */}
      <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
        <div className="bg-muted/30 border-b border-border/30 px-6 py-4 flex items-center gap-2">
          <Store className="w-4 h-4 text-[#10b981]" />
          <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">Brand Identity & Legal</h3>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Logo Uploader */}
            <div className="w-full lg:w-1/3">
              <FieldLabel>Business Logo</FieldLabel>
              <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoChange} />
              <label
                htmlFor="logo-upload"
                className="mt-2 w-full aspect-video border-2 border-dashed border-border/40 rounded-2xl bg-muted/20 hover:bg-[#10b981]/5 hover:border-[#10b981]/40 transition-all flex flex-col items-center justify-center cursor-pointer group overflow-hidden relative"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="absolute inset-0 w-full h-full object-contain p-3" />
                ) : (
                  <>
                    <div className="h-14 w-14 bg-[#10b981]/10 border border-[#10b981]/20 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-[#10b981]">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-[12px] font-black text-muted-foreground uppercase tracking-widest">Upload Logo</span>
                    <span className="text-[10px] text-muted-foreground/40 mt-1">PNG, JPG · Max 2MB</span>
                  </>
                )}
              </label>
            </div>

            {/* Form Fields */}
            <div className="w-full lg:w-2/3 grid gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel required>Business Name</FieldLabel>
                  <Input value={formData.businessName} onChange={(e) => updateField('businessName', e.target.value)} placeholder="e.g. Acme Industries" className="h-11 bg-background/50 border-border/40 rounded-xl focus:border-[#10b981]" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Tax ID / VAT No</FieldLabel>
                  <Input value={formData.taxId} onChange={(e) => updateField('taxId', e.target.value)} placeholder="Tax ID" className="h-11 bg-background/50 border-border/40 rounded-xl focus:border-[#10b981]" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel>Business Type</FieldLabel>
                  <Select value={formData.businessType} onValueChange={(v) => updateField('businessType', v)}>
                    <SelectTrigger className="h-11 bg-background/50 border-border/40 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Retail Store", "Restaurant", "Cafe / Coffee Shop", "Salon / Spa", "Grocery Store", "Electronics Store", "Clothing Store", "Other"].map(t => (
                        <SelectItem key={t} value={t.toLowerCase().replace(/\s+/g, '_').split('/')[0].trim()}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Website</FieldLabel>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <Input value={formData.website} onChange={(e) => updateField('website', e.target.value)} placeholder="https://example.com" className="h-11 pl-10 bg-background/50 border-border/40 rounded-xl focus:border-[#10b981]" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel>Official Email</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <Input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className="h-11 pl-10 bg-background/50 border-border/40 rounded-xl focus:border-[#10b981]" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Phone Number</FieldLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <Input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} className="h-11 pl-10 bg-background/50 border-border/40 rounded-xl focus:border-[#10b981]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
        <div className="bg-muted/30 border-b border-border/30 px-6 py-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#10b981]" />
          <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">Registered Address</h3>
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <FieldLabel>Street Address</FieldLabel>
            <Input placeholder="Street Address" value={formData.address} onChange={(e) => updateField('address', e.target.value)} className="h-11 bg-background/50 border-border/40 rounded-xl focus:border-[#10b981]" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'city', placeholder: 'City' },
              { key: 'state', placeholder: 'State / Province' },
              { key: 'zipCode', placeholder: 'ZIP Code' },
            ].map(f => (
              <div key={f.key} className="space-y-1.5">
                <FieldLabel>{f.placeholder}</FieldLabel>
                <Input placeholder={f.placeholder} value={formData[f.key]} onChange={(e) => updateField(f.key, e.target.value)} className="h-11 bg-background/50 border-border/40 rounded-xl focus:border-[#10b981]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
