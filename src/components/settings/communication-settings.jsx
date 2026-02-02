"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/store/useSettingsStore";
import { toast } from "sonner";
import { Save, Server, Mail, Layout, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

const EMAIL_PROVIDERS = [
  { id: "smtp", name: "SMTP Server", icon: Server, fields: ["Host", "Port", "Username", "Password", "Encryption"] },
  { id: "sendgrid", name: "SendGrid", icon: Mail, fields: ["API Key", "From Email"] },
  { id: "mailgun", name: "Mailgun", icon: Mail, fields: ["Domain", "API Key", "Region"] },
  { id: "ses", name: "Amazon SES", icon: Layout, fields: ["Access Key", "Secret Key", "Region"] },
];

const SMS_PROVIDERS = [
  { id: "twilio", name: "Twilio", icon: Smartphone, fields: ["Account SID", "Auth Token", "From Number"] },
  { id: "nexmo", name: "Nexmo (Vonage)", icon: Smartphone, fields: ["API Key", "API Secret", "From"] },
];

export function CommunicationSettings() {
  const { email, setEmailSettings, sms, setSmsSettings } = useSettingsStore();

  const handleSave = () => {
    // In a real app, you might trigger an API call here
    toast.success("Communication settings saved successfully");
  };

  // Helper to update email config
  const updateEmailConfig = (key, value) => {
    setEmailSettings({
        config: { ...email.config, [key]: value }
    });
  };

  // Helper to update sms config
  const updateSmsConfig = (key, value) => {
    setSmsSettings({
        config: { ...sms.config, [key]: value }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Communication Settings</h2>
          <p className="text-sm text-slate-500">Email & SMS gateway configuration.</p>
        </div>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
          <Save className="w-4 h-4 mr-2" /> Save All Changes
        </Button>
      </div>

      {/* Email Settings */}
       <Card>
         <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
               <CardTitle>Email Configuration</CardTitle>
               <CardDescription>Select and configure your mail transport.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
               <Label className="text-sm">Enable Email</Label>
               <Switch checked={email.enabled} onCheckedChange={(c) => setEmailSettings({ enabled: c })} />
            </div>
         </CardHeader>
         
         {email.enabled && (
           <CardContent className="space-y-6">
              {/* Provider Selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {EMAIL_PROVIDERS.map(prov => (
                    <div 
                       key={prov.id}
                       onClick={() => setEmailSettings({ provider: prov.id })}
                       className={cn(
                          "cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:bg-slate-50",
                          email.provider === prov.id ? "border-blue-600 bg-blue-50/50" : "border-slate-100"
                       )}
                    >
                       <prov.icon className={cn("w-6 h-6", email.provider === prov.id ? "text-blue-600" : "text-slate-400")} />
                       <span className="text-xs font-semibold">{prov.name}</span>
                    </div>
                 ))}
              </div>

              {/* Dynamic Fields */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                 {EMAIL_PROVIDERS.find(p => p.id === email.provider)?.fields.map(field => (
                    <div key={field} className="space-y-2">
                       <Label>{field}</Label>
                       <Input 
                            type={field.toLowerCase().includes('password') || field.includes('Key') ? "password" : "text"} 
                            value={email.config?.[field] || ''}
                            onChange={(e) => updateEmailConfig(field, e.target.value)}
                       />
                    </div>
                 ))}
                 {/* Common Field */}
                 <div className="space-y-2">
                    <Label>From Name</Label>
                    <Input 
                        placeholder="Company Name" 
                        value={email.fromName}
                        onChange={(e) => setEmailSettings({ fromName: e.target.value })}
                    />
                 </div>
              </div>

              <div className="flex justify-start items-center pt-2">
                 <Button variant="outline" size="sm">Send Test Email</Button>
              </div>
           </CardContent>
         )}
       </Card>

       {/* SMS Settings */}
       <Card>
         <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
               <CardTitle>SMS Gateway</CardTitle>
               <CardDescription>Configure SMS notifications for customers.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
               <Label className="text-sm">Enable SMS</Label>
               <Switch checked={sms.enabled} onCheckedChange={(c) => setSmsSettings({ enabled: c })} />
            </div>
         </CardHeader>
         
         {sms.enabled && (
           <CardContent className="space-y-6">
              <div className="flex gap-4">
                 {SMS_PROVIDERS.map(prov => (
                    <div 
                       key={prov.id}
                       onClick={() => setSmsSettings({ provider: prov.id })}
                       className={cn(
                          "cursor-pointer px-4 py-2 border rounded-full text-sm font-medium transition-colors",
                          sms.provider === prov.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 hover:border-slate-400"
                       )}
                    >
                       {prov.name}
                    </div>
                 ))}
              </div>

               <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                 {SMS_PROVIDERS.find(p => p.id === sms.provider)?.fields.map(field => (
                    <div key={field} className="space-y-2">
                       <Label>{field}</Label>
                       <Input 
                            type={field.includes('Token') || field.includes('Secret') ? "password" : "text"} 
                            value={sms.config?.[field] || ''}
                            onChange={(e) => updateSmsConfig(field, e.target.value)}
                       />
                    </div>
                 ))}
              </div>
               <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm">Send Test SMS</Button>
               </div>
           </CardContent>
         )}
       </Card>
    </div>
  );
}
