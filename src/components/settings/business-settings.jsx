"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { toast } from "sonner";
import { Save, Upload, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function BusinessSettings() {
  const { useBusinessSettings, updateBusinessSettings, uploadLogo } = useSettings();
  const { data: response, isLoading } = useBusinessSettings();
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formData, setFormData] = useState({
    businessName: '',
    taxId: '',
    businessType: 'retail',
    website: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  useEffect(() => {
    if (response?.data) {
      const org = response.data;
      setFormData({
        businessName: org.name || '',
        taxId: org.tax_id || '',
        businessType: org.business_type || 'retail',
        website: org.website || '',
        email: org.email || '',
        phone: org.phone || '',
        address: org.address || '',
        city: org.city || '', 
        state: org.state || '',
        zipCode: org.zip_code || ''
      });
      if (org.logo) {
        setLogoPreview(`${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${org.logo}`);
      }
    }
  }, [response]);

  const handleSave = async () => {
    const payload = {
      name: formData.businessName,
      tax_id: formData.taxId,
      business_type: formData.businessType,
      website: formData.website,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zipCode
    };

    const result = await updateBusinessSettings(payload);
    
    if (logoFile) {
      const logoResult = await uploadLogo(logoFile);
      if (!logoResult.success) {
        toast.error("Failed to upload logo: " + logoResult.error);
      }
    }

    if (result.success) {
        toast.success("Business settings saved successfully");
    } else {
        toast.error(result.error || "Failed to save settings");
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error("File size must be less than 2MB");
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Business Settings</h2>
          <p className="text-sm text-slate-500">Details used for billing, legal documents, and store profile.</p>
        </div>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
          <Save className="w-4 h-4 mr-2" /> Save Changes
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Logo Area */}
          <div className="w-full lg:w-1/3 flex flex-col items-center">
            <input 
              type="file" 
              id="logo-upload" 
              className="hidden" 
              accept="image/*" 
              onChange={handleLogoChange}
            />
            <label 
              htmlFor="logo-upload"
              className="w-full aspect-video border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center cursor-pointer group overflow-hidden relative"
            >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="absolute inset-0 w-full h-full object-contain p-2" />
                ) : (
                  <>
                    <div className="h-16 w-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-slate-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">Click to upload logo</span>
                    <span className="text-xs text-slate-400 mt-1">PNG, JPG (Max 2MB)</span>
                  </>
                )}
            </label>
          </div>

          {/* Form Fields */}
          <div className="w-full lg:w-2/3 grid gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.businessName} 
                    onChange={(e) => updateField('businessName', e.target.value)} 
                    placeholder="e.g. Acme Industries" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax ID / VAT No</Label>
                  <Input 
                    value={formData.taxId} 
                    onChange={(e) => updateField('taxId', e.target.value)} 
                    placeholder="Tax ID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Type</Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) => updateField('businessType', value)}
                  >
                    <SelectTrigger> 
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail Store</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="cafe">Cafe / Coffee Shop</SelectItem>
                      <SelectItem value="salon">Salon / Spa</SelectItem>
                      <SelectItem value="grocery">Grocery Store</SelectItem>
                      <SelectItem value="electronics">Electronics Store</SelectItem>
                      <SelectItem value="clothing">Clothing Store</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input 
                    value={formData.website} 
                    onChange={(e) => updateField('website', e.target.value)} 
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Official Email</Label>
                  <Input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => updateField('email', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={(e) => updateField('phone', e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input 
                  placeholder="Street Address" 
                  value={formData.address} 
                  onChange={(e) => updateField('address', e.target.value)} 
                  className="mb-2"
                />
                <div className="grid grid-cols-3 gap-2">
                   <Input 
                      placeholder="City" 
                      value={formData.city} 
                      onChange={(e) => updateField('city', e.target.value)} 
                   />
                   <Input 
                      placeholder="State" 
                      value={formData.state} 
                      onChange={(e) => updateField('state', e.target.value)} 
                   />
                   <Input 
                      placeholder="ZIP Code" 
                      value={formData.zipCode} 
                      onChange={(e) => updateField('zipCode', e.target.value)} 
                   />
                </div>
              </div>
              </div>
          </div>
      </CardContent>
    </Card>
    </div>
  );
}
