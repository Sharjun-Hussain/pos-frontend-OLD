"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/store/useSettingsStore";
import { toast } from "sonner";
import { Save, Server, Mail, Layout, Smartphone, CheckCircle2 } from "lucide-react";
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

const SectionHeader = ({ icon: Icon, title, rightSlot }) => (
  <div className="bg-muted/30 border-b border-border/30 px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-[#10b981]" />
      <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">{title}</h3>
    </div>
    {rightSlot}
  </div>
);

const FieldLabel = ({ children }) => (
  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-0.5">{children}</label>
);

export function CommunicationSettings() {
  const { email, setEmailSettings, sms, setSmsSettings } = useSettingsStore();

  const handleSave = () => toast.success("Communication settings saved successfully");

  const updateEmailConfig = (key, value) => setEmailSettings({ config: { ...email.config, [key]: value } });
  const updateSmsConfig = (key, value) => setSmsSettings({ config: { ...sms.config, [key]: value } });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Communication Settings</h2>
          <p className="text-sm text-muted-foreground/60 font-medium mt-0.5">Email & SMS gateway configuration.</p>
        </div>
        <Button onClick={handleSave} className="bg-[#10b981] hover:bg-[#059669] text-white h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-none shadow-lg shadow-[#10b981]/20 transition-all active:scale-95 gap-2">
          <Save className="w-4 h-4" /> Save All Changes
        </Button>
      </div>

      {/* Email Card */}
      <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
        <SectionHeader
          icon={Mail}
          title="Email Configuration"
          rightSlot={
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Enable Email</span>
              <Switch checked={email.enabled} onCheckedChange={(c) => setEmailSettings({ enabled: c })} />
            </div>
          }
        />
        {email.enabled && (
          <CardContent className="p-6 space-y-6">
            {/* Provider Selection */}
            <div>
              <FieldLabel>Mail Transport Provider</FieldLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {EMAIL_PROVIDERS.map(prov => {
                  const isActive = email.provider === prov.id;
                  return (
                    <button
                      key={prov.id}
                      onClick={() => setEmailSettings({ provider: prov.id })}
                      className={cn(
                        "cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all relative",
                        isActive ? "border-[#10b981] bg-[#10b981]/5" : "border-border/30 bg-background hover:border-[#10b981]/40"
                      )}
                    >
                      {isActive && <CheckCircle2 className="absolute top-2 right-2 w-3.5 h-3.5 text-[#10b981]" />}
                      <prov.icon className={cn("w-5 h-5", isActive ? "text-[#10b981]" : "text-muted-foreground/40")} />
                      <span className={cn("text-[10px] font-black uppercase tracking-wider", isActive ? "text-[#10b981]" : "text-muted-foreground/60")}>{prov.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Fields */}
            <div className="bg-muted/20 p-5 rounded-xl border border-border/20 grid grid-cols-1 md:grid-cols-2 gap-4">
              {EMAIL_PROVIDERS.find(p => p.id === email.provider)?.fields.map(field => (
                <div key={field} className="space-y-1.5">
                  <FieldLabel>{field}</FieldLabel>
                  <Input
                    type={field.toLowerCase().includes('password') || field.includes('Key') ? "password" : "text"}
                    value={email.config?.[field] || ''}
                    onChange={(e) => updateEmailConfig(field, e.target.value)}
                    className="h-10 bg-background border-border/40 rounded-xl focus:border-[#10b981]"
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <FieldLabel>From Name</FieldLabel>
                <Input
                  placeholder="Company Name"
                  value={email.fromName}
                  onChange={(e) => setEmailSettings({ fromName: e.target.value })}
                  className="h-10 bg-background border-border/40 rounded-xl focus:border-[#10b981]"
                />
              </div>
            </div>

            <Button variant="outline" size="sm" className="border-border/40 text-muted-foreground hover:text-[#10b981] hover:border-[#10b981]/40 rounded-xl font-bold text-[10px] uppercase tracking-widest">
              Send Test Email
            </Button>
          </CardContent>
        )}
      </Card>

      {/* SMS Card */}
      <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
        <SectionHeader
          icon={Smartphone}
          title="SMS Gateway"
          rightSlot={
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Enable SMS</span>
              <Switch checked={sms.enabled} onCheckedChange={(c) => setSmsSettings({ enabled: c })} />
            </div>
          }
        />
        {sms.enabled && (
          <CardContent className="p-6 space-y-6">
            <div>
              <FieldLabel>SMS Provider</FieldLabel>
              <div className="flex gap-3 mt-2">
                {SMS_PROVIDERS.map(prov => (
                  <button
                    key={prov.id}
                    onClick={() => setSmsSettings({ provider: prov.id })}
                    className={cn(
                      "px-5 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                      sms.provider === prov.id
                        ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]"
                        : "bg-background text-muted-foreground border-border/30 hover:border-[#10b981]/40"
                    )}
                  >
                    {prov.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-muted/20 p-5 rounded-xl border border-border/20 grid grid-cols-1 md:grid-cols-2 gap-4">
              {SMS_PROVIDERS.find(p => p.id === sms.provider)?.fields.map(field => (
                <div key={field} className="space-y-1.5">
                  <FieldLabel>{field}</FieldLabel>
                  <Input
                    type={field.includes('Token') || field.includes('Secret') ? "password" : "text"}
                    value={sms.config?.[field] || ''}
                    onChange={(e) => updateSmsConfig(field, e.target.value)}
                    className="h-10 bg-background border-border/40 rounded-xl focus:border-[#10b981]"
                  />
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="border-border/40 text-muted-foreground hover:text-[#10b981] hover:border-[#10b981]/40 rounded-xl font-bold text-[10px] uppercase tracking-widest">
              Send Test SMS
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
