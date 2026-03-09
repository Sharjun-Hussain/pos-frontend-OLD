"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Trash2, 
  PlusCircle,
  Building2,
  Contact,
  CreditCard,
  CheckCircle2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const supplierSchema = z.object({
  // Step 1: Basic Info
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(3, "Code must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(phoneRegex, "Invalid phone number"),
  description: z.string().optional(),
  
  // Step 2: Contact & Address
  contact_person_name: z.string().min(2, "Contact person is required"),
  contact_person_phone: z.string().regex(phoneRegex, "Invalid contact person phone"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  
  // Step 3: Bank Accounts
  bank_accounts: z.array(z.object({
    bank_name: z.string().min(2, "Bank name is required"),
    account_holder_name: z.string().min(2, "Account holder name is required"),
    branch_name: z.string().min(2, "Branch name is required"),
    account_number: z.string().min(5, "Account number is required"),
    is_default: z.boolean().default(false),
  })).min(1, "At least one bank account is required"),
});

const STEPS = [
  { id: 1, title: "Basic Info", icon: Building2 },
  { id: 2, title: "Contact & Address", icon: Contact },
  { id: 3, title: "Bank Accounts", icon: CreditCard },
];

export function CreateSupplierSheet({ open, onOpenChange, onSuccess }) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      code: `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
      email: "",
      phone: "",
      description: "",
      contact_person_name: "",
      contact_person_phone: "",
      address: "",
      city: "",
      state: "",
      country: "Sri Lanka",
      bank_accounts: [{
        bank_name: "",
        account_holder_name: "",
        branch_name: "",
        account_number: "",
        is_default: true,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bank_accounts",
  });

  const nextStep = async () => {
    const fieldsToValidate = currentStep === 1 
      ? ['name', 'code', 'email', 'phone']
      : currentStep === 2
      ? ['contact_person_name', 'contact_person_phone', 'address', 'city', 'state', 'country']
      : [];
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data) => {
    if (!session?.accessToken) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      // Append regular fields
      const regularFields = [
        'name', 'code', 'email', 'phone', 'description',
        'contact_person_name', 'contact_person_phone', 
        'address', 'city', 'state', 'country'
      ];
      regularFields.forEach(key => {
        if (data[key]) formData.append(key, data[key]);
      });

      // Append bank details as arrays
      data.bank_accounts.forEach((account) => {
        formData.append("bank_names[]", account.bank_name);
        formData.append("account_holder_names[]", account.account_holder_name);
        formData.append("branch_names[]", account.branch_name);
        formData.append("account_numbers[]", account.account_number);
        formData.append("is_default[]", account.is_default ? "1" : "0");
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Supplier created successfully!");
        form.reset();
        setCurrentStep(1);
        onSuccess(result.data);
        onOpenChange(false);
      } else {
        toast.error(result.message || "Failed to create supplier");
      }
    } catch (error) {
      console.error("Error creating supplier:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col h-full border-l border-emerald-500/20 backdrop-blur-3xl bg-white/95 dark:bg-slate-950/95 shadow-2xl overflow-hidden">
        
        {/* PREMIUM HEADER WITH PATTERN */}
        <div className="relative shrink-0 overflow-hidden bg-emerald-600/5">
          <div className="absolute inset-0 bg-emerald-600 opacity-[0.03] dark:opacity-[0.05]" 
               style={{backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`, backgroundSize: '20px 20px'}} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative p-8 border-b border-emerald-500/10">
            <div className="flex items-center gap-5 mb-6">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-xl shadow-emerald-500/10 transition-transform hover:rotate-3 duration-500">
                <Plus className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <SheetTitle className="text-2xl font-black text-foreground tracking-tight leading-none mb-1">
                  Onboard Strategic Partner
                </SheetTitle>
                <SheetDescription className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest opacity-70">
                  Registry Initialization Protocol
                </SheetDescription>
              </div>
            </div>

            {/* Redesigned Progress Indicator */}
            <div className="flex items-center gap-4">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-500 relative group",
                        currentStep === step.id 
                          ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 scale-110" 
                          : currentStep > step.id
                          ? "bg-emerald-500/20 text-emerald-600"
                          : "bg-emerald-500/5 text-muted-foreground/40 grayscale"
                      )}
                    >
                      {currentStep === step.id && (
                        <div className="absolute inset-0 bg-emerald-600 rounded-xl blur-md opacity-40 animate-pulse" />
                      )}
                      <div className="relative z-10">
                        {currentStep > step.id ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                      </div>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={cn(
                        "h-1 flex-1 rounded-full transition-all duration-700",
                        currentStep > step.id ? "bg-emerald-600" : "bg-emerald-500/10"
                      )} />
                    )}
                  </div>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest transition-colors duration-300",
                    currentStep === step.id ? "text-emerald-700" : "text-muted-foreground/40"
                  )}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 text-foreground font-semibold mb-2">
                    <Building2 className="h-5 w-5 text-emerald-500" />
                    Basic Information
                  </div>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/70 ml-1">Identity Designation</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Strategic Global Sourcing" className="h-14 px-5 text-sm font-bold border-2 border-emerald-500/10 focus:border-emerald-500/40 bg-background/50 rounded-2xl transition-all shadow-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/70 ml-1">Registry Code (Unique)</FormLabel>
                        <FormControl>
                          <Input placeholder="SUP-001" className="h-14 px-5 text-sm font-bold border-2 border-emerald-500/10 focus:border-emerald-500/40 bg-background/50 rounded-2xl transition-all shadow-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/70 ml-1">Digital Correspondence</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="vendor@strategic.com" className="h-14 px-5 text-sm font-bold border-2 border-emerald-500/10 focus:border-emerald-500/40 bg-background/50 rounded-2xl transition-all shadow-sm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/70 ml-1">Primary Link</FormLabel>
                          <FormControl>
                            <Input placeholder="+94..." className="h-14 px-5 text-sm font-bold border-2 border-emerald-500/10 focus:border-emerald-500/40 bg-background/50 rounded-2xl transition-all shadow-sm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/70 ml-1">Strategic Narrative</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief notes about the supplier scope..." className="min-h-[120px] p-5 text-sm font-bold border-2 border-emerald-500/10 focus:border-emerald-500/40 bg-background/50 rounded-2xl transition-all shadow-sm resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Contact & Address */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 text-foreground font-semibold mb-2">
                    <Contact className="h-5 w-5 text-emerald-500" />
                    Contact & Address
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact_person_name"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/70 ml-1">Liaison Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Officer Name" className="h-14 px-5 text-sm font-bold border-2 border-emerald-500/10 focus:border-emerald-500/40 bg-background/50 rounded-2xl transition-all shadow-sm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact_person_phone"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/70 ml-1">Liaison Direct</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone" className="h-14 px-5 text-sm font-bold border-2 border-emerald-500/10 focus:border-emerald-500/40 bg-background/50 rounded-2xl transition-all shadow-sm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/70 ml-1">Logistics Headquarters</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Strategic Ave" className="h-14 px-5 text-sm font-bold border-2 border-emerald-500/10 focus:border-emerald-500/40 bg-background/50 rounded-2xl transition-all shadow-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/70 ml-1">Urban Hub</FormLabel>
                          <FormControl>
                            <Input placeholder="City" className="h-14 px-4 text-sm font-bold border-2 border-emerald-500/10 focus:border-emerald-500/40 bg-background/50 rounded-2xl transition-all shadow-sm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/70 ml-1">Region</FormLabel>
                          <FormControl>
                            <Input placeholder="State" className="h-14 px-4 text-sm font-bold border-2 border-emerald-500/10 focus:border-emerald-500/40 bg-background/50 rounded-2xl transition-all shadow-sm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/70 ml-1">Jurisdiction</FormLabel>
                          <FormControl>
                            <Input placeholder="Country" className="h-14 px-4 text-sm font-bold border-2 border-emerald-500/10 focus:border-emerald-500/40 bg-background/50 rounded-2xl transition-all shadow-sm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Bank Accounts */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <CreditCard className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Financial Gateways</h3>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-10 text-[10px] font-black uppercase tracking-widest text-emerald-600 border-2 border-emerald-500/20 hover:bg-emerald-500/10 rounded-xl px-4"
                      onClick={() => append({ bank_name: "", account_holder_name: "", branch_name: "", account_number: "", is_default: fields.length === 0 })}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Pipeline
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <div key={field.id} className="p-6 rounded-3xl border-2 border-emerald-500/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm relative space-y-6 group/item transition-all hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5 overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 right-4 h-10 w-10 text-muted-foreground/40 hover:text-red-600 hover:bg-red-500/10 rounded-2xl opacity-0 group-hover/item:opacity-100 transition-all z-20"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                      
                      <div className="grid grid-cols-2 gap-6 relative z-10">
                        <FormField
                          control={form.control}
                          name={`bank_accounts.${index}.bank_name`}
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/70 ml-1">Bank Identifier</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Strategic Bank" className="h-14 px-5 text-sm font-bold border-2 border-emerald-500/10 focus:border-emerald-500/40 bg-background/60 rounded-2xl transition-all shadow-inner" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`bank_accounts.${index}.account_holder_name`}
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/70 ml-1">Authorized Holder</FormLabel>
                              <FormControl>
                                <Input placeholder="Legal name" className="h-14 px-5 text-sm font-bold border-2 border-emerald-500/10 focus:border-emerald-500/40 bg-background/60 rounded-2xl transition-all shadow-inner" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6 relative z-10">
                        <FormField
                          control={form.control}
                          name={`bank_accounts.${index}.branch_name`}
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/70 ml-1">Branch Focus</FormLabel>
                              <FormControl>
                                <Input placeholder="Region" className="h-14 px-5 text-sm font-bold border-2 border-emerald-500/10 focus:border-emerald-500/40 bg-background/60 rounded-2xl transition-all shadow-inner" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`bank_accounts.${index}.account_number`}
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/70 ml-1">Secure Account #</FormLabel>
                              <FormControl>
                                <Input placeholder="XXXX-XXXX-XXXX" className="h-14 px-5 text-sm font-bold border-2 border-emerald-500/10 focus:border-emerald-500/40 bg-background/60 rounded-2xl transition-all shadow-inner" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name={`bank_accounts.${index}.is_default`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 relative z-10 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/5">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                className="h-5 w-5 rounded-md border-emerald-500/20 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    const currentAccounts = form.getValues("bank_accounts");
                                    const newAccounts = currentAccounts.map((acc, i) => ({
                                      ...acc,
                                      is_default: i === index,
                                    }));
                                    form.setValue("bank_accounts", newAccounts);
                                  } else {
                                    field.onChange(false);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60 cursor-pointer">Set as Primary Settlement Gateway</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              )}

            </form>
          </Form>
        </div>

        <SheetFooter className="px-8 py-8 bg-emerald-500/5 backdrop-blur-md border-t border-emerald-500/10 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="h-14 px-8 border-2 border-emerald-500/20 text-[11px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-500/10 rounded-2xl transition-all shadow-sm"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Regress
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-14 px-8 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-red-600 hover:bg-red-500/5 rounded-2xl transition-all"
            >
              Terminate
            </Button>
          </div>

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              onClick={nextStep}
              className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Advance Protocol
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={form.handleSubmit(onSubmit)}
              className="h-14 px-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  <Plus className="mr-3 h-5 w-5 group-hover:rotate-90 transition-transform" />
                  Initialize Registry
                </>
              )}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
