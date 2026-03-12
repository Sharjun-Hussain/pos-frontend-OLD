"use client";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  User, Mail, Phone, Shield, Building, Calendar, 
  UserCircle, Lock, Camera, ArrowLeft, Save, X, Loader2,
  ShieldCheck, MapPin, Fingerprint, Briefcase, Eye, EyeOff
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { JoinedDatePicker } from "./JoinedDatePicker";
import { cn } from "@/lib/utils";

// --- 1. Define the Zod Schema ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const formSchema = z.object({
  profile_image: z.any().optional(),
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone number is required"),
  nic: z.string().optional(),
  role_ids: z.array(z.string()).min(1, "At least one role is required"),
  branch_ids: z.array(z.string()).optional(),
  joined_date: z.date({
    required_error: "Joined date is required",
  }),
});

export function EmployeeForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [fetchingData, setFetchingData] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // --- 3. Set up the form with react-hook-form ---
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      phone: "",
      nic: "",
      joined_date: new Date(),
      role_ids: [],
      branch_ids: [],
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.accessToken) return;
      try {
        setFetchingData(true);
        const [rolesRes, branchesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }),
        ]);

        const rolesData = await rolesRes.json();
        const branchesData = await branchesRes.json();

        if (rolesData.status === "success") setRoles(rolesData.data.data || []);
        if (branchesData.status === "success") setBranches(branchesData.data || []);
      } catch (err) {
        toast.error("Failed to load roles or branches");
      } finally {
        setFetchingData(false);
      }
    };

    if (session?.accessToken) fetchData();
  }, [session]);

  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (e, onChange) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error("Unsupported file format");
        return;
      }
      setPreviewUrl(URL.createObjectURL(file));
      onChange(file);
    }
  };

  // --- 4. Define the submit handler ---
  async function onSubmit(values) {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (response.ok && data.status === "success") {
        toast.success("Employee created successfully", {
            icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />
        });
        router.push("/employees");
      } else {
        throw new Error(data.message || "Failed to create employee");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetchingData) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <ShieldCheck className="absolute inset-0 m-auto w-6 h-6 text-emerald-500 animate-pulse" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Syncing System Registers...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-background max-w-[1600px] mx-auto w-full font-sans text-foreground pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <UserCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Personnel Provisioning</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Staff Management</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Employees</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Enrollment</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" /> Cancel
          </Button>
          <Button 
            onClick={() => form.handleSubmit(onSubmit)()} 
            className="bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20 gap-2 hover:bg-[#0da371] h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-none transition-all active:scale-95"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Initialize Account
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- SECTION 1: IDENTITY & PROFILE --- */}
            <div className="lg:col-span-1 space-y-8">
                <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border border-border/10">
                    <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-row items-center gap-3">
                        <User className="w-4 h-4 text-[#10b981]" />
                        <div>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Staff Identity</CardTitle>
                            <CardDescription className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-tight">Basic identification and system profile</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 flex flex-col items-center">
                        <div className="relative group/avatar mb-8">
                            <Avatar className="w-32 h-32 border-2 border-border/50 shadow-sm relative z-10 transition-all group-hover/avatar:border-[#10b981]/50">
                                <AvatarImage src={previewUrl} className="object-cover" />
                                <AvatarFallback className="bg-muted/50 text-muted-foreground text-3xl font-black">
                                    {form.watch("first_name")?.[0]}{form.watch("last_name")?.[0] || <UserCircle className="w-12 h-12 opacity-20" />}
                                </AvatarFallback>
                            </Avatar>
                            <FormField
                                control={form.control}
                                name="profile_image"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <label 
                                                htmlFor="photo-upload" 
                                                className="absolute bottom-1 right-1 z-20 h-9 w-9 flex items-center justify-center bg-[#10b981] text-white rounded-xl cursor-pointer shadow-lg hover:bg-[#0da371] transition-all border-2 border-background"
                                            >
                                                <Camera className="h-4 w-4" />
                                                <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, field.onChange)} />
                                            </label>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                        
                        <div className="w-full space-y-5">
                            <FormField
                                control={form.control}
                                name="first_name"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Legal First Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. John" {...field} className="h-11 rounded-xl border-border/50 bg-background font-bold text-xs focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" />
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-bold" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="last_name"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Legal Last Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Doe" {...field} className="h-11 rounded-xl border-border/50 bg-background font-bold text-xs focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" />
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-bold" />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* --- SECTION 2: ACCESS & SECURITY --- */}
            <div className="lg:col-span-1 space-y-8">
                <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border border-border/10">
                    <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-row items-center gap-3">
                        <Lock className="w-4 h-4 text-[#10b981]" />
                        <div>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Access & Security</CardTitle>
                            <CardDescription className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-tight">System authentication and contact details</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">System Email (UID)</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-[#10b981] transition-colors" />
                                            <Input type="email" placeholder="staff@enterprise.com" {...field} className="h-11 pl-10 rounded-xl border-border/50 bg-background font-bold text-xs focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-[10px] font-bold" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Primary Contact No</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-[#10b981] transition-colors" />
                                            <Input placeholder="+94 7X XXX XXXX" {...field} className="h-11 pl-10 rounded-xl border-border/50 bg-background font-bold text-xs focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-[10px] font-bold" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Authentication Secret</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-[#10b981] transition-colors" />
                                            <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} className="h-11 pl-10 pr-10 rounded-xl border-border/50 bg-background font-bold text-xs focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all tracking-widest" />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-[#10b981] transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormDescription className="text-[9px] font-medium uppercase tracking-tight opacity-50">Used for system login and digital signatures</FormDescription>
                                    <FormMessage className="text-[10px] font-bold" />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* --- SECTION 3: PLACEMENT & LEGAL --- */}
            <div className="lg:col-span-1 space-y-8">
                <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border border-border/10">
                    <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-row items-center gap-3">
                        <MapPin className="w-4 h-4 text-[#10b981]" />
                        <div>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Operational Placement</CardTitle>
                            <CardDescription className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-tight">Employment details and organizational role</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <FormField
                            control={form.control}
                            name="nic"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">National ID (NIC)</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-[#10b981] transition-colors" />
                                            <Input placeholder="XXXXXXXXXXXX" {...field} className="h-11 pl-10 rounded-xl border-border/50 bg-background font-bold text-xs focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-[10px] font-bold" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role_ids"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">System Privilege Level</FormLabel>
                                    <Select onValueChange={(val) => field.onChange([val])} value={field.value?.[0]}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background font-bold text-xs focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all group">
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="h-4 w-4 text-[#10b981]/50 group-hover:text-[#10b981] transition-colors" />
                                                    <SelectValue placeholder="Select Degree" />
                                                </div>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl border-border/50 p-1 shadow-xl">
                                            {roles.map((role) => (
                                                <SelectItem key={role.id} value={role.id} className="rounded-lg py-2.5 focus:bg-[#10b981]/10 focus:text-[#10b981] font-bold text-xs uppercase tracking-widest">
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-[10px] font-bold" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="branch_ids"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Operational Branch</FormLabel>
                                    <Select onValueChange={(val) => field.onChange([val])} value={field.value?.[0]}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background font-bold text-xs focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all group">
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-[#10b981]/50 group-hover:text-[#10b981] transition-colors" />
                                                    <SelectValue placeholder="Select Division" />
                                                </div>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl border-border/50 p-1 shadow-xl">
                                            {branches.map((branch) => (
                                                <SelectItem key={branch.id} value={branch.id} className="rounded-lg py-2.5 focus:bg-[#10b981]/10 focus:text-[#10b981] font-bold text-xs uppercase tracking-widest">
                                                    {branch.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-[10px] font-bold" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="joined_date"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Enlistment Date</FormLabel>
                                    <FormControl>
                                        <JoinedDatePicker value={field.value} onChange={field.onChange} />
                                    </FormControl>
                                    <FormMessage className="text-[10px] font-bold" />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>
          </div>

          <div className="pt-8 border-t border-border/30 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
               Verification required for system provisioning
            </p>
            <div className="flex gap-4">
                <Button 
                    type="button" 
                    variant="outline" 
                    className="h-11 px-8 rounded-xl border-border/50 hover:bg-muted/30 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
                    onClick={() => router.back()}
                    disabled={loading}
                >
                    Discard Changes
                </Button>
                <Button 
                    type="submit" 
                    className="bg-[#10b981] hover:bg-[#0da371] text-white h-11 px-10 rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#10b981]/20 disabled:opacity-50 transition-all active:scale-95 border-none"
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Finalize Enrollment
                </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
