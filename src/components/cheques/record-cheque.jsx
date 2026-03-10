"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Save, Calendar as CalendarIcon, Landmark, CreditCard } from "lucide-react";
import { useFormRestore } from "@/hooks/use-form-restore";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  type: z.enum(["receivable", "payable"], { required_error: "Type is required" }),
  cheque_number: z.string().min(1, "Cheque number is required"),
  bank_name: z.string().min(1, "Bank name is required"),
  branch_name: z.string().optional(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  cheque_date: z.date({ required_error: "Cheque date is required" }),
  received_issued_date: z.date({ required_error: "Received/Issued date is required" }),
  payee_payor_name: z.string().min(1, "Payee/Payor name is required"),
  note: z.string().optional(),
});

export default function RecordCheque() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "receivable",
      cheque_number: "",
      bank_name: "",
      branch_name: "",
      amount: 0,
      cheque_date: new Date(),
      received_issued_date: new Date(),
      payee_payor_name: "",
      note: "",
    },
  });

  const { clearSavedData } = useFormRestore(form);

  async function onSubmit(data) {
    if (!session?.accessToken) {
        toast.error("Not authenticated");
        return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        ...data,
        cheque_date: format(data.cheque_date, "yyyy-MM-dd"),
        received_issued_date: format(data.received_issued_date, "yyyy-MM-dd"),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/cheques`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Failed to record cheque");
      }

      toast.success("Cheque recorded successfully");
      clearSavedData();
      router.push("/cheques");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to record cheque");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:px-8 md:pt-4 md:pb-12">
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.05),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.1),rgba(0,0,0,0))]"></div>
      </div>

      <div className="relative flex flex-col gap-8 max-w-[1400px] mx-auto transition-all duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">
              <Landmark className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-foreground tracking-tight">
                Record New Cheque
              </h1>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wider mt-0.5">
                ENTER CHEQUE DETAILS
              </p>
            </div>
          </div>
          <Button variant="outline" className="rounded-xl font-bold text-[10px] tracking-widest gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-10 px-4" asChild>
            <Link href="/cheques">
              <ArrowLeft className="h-3.5 w-3.5" />
              BACK TO LIST
            </Link>
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="p-8 bg-emerald-50/30 dark:bg-emerald-500/5 border-b border-emerald-100 dark:border-emerald-500/10">
                  <div className="space-y-0.5">
                    <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-foreground">Cheque Information</CardTitle>
                    <p className="text-[11px] font-bold text-emerald-600/70 dark:text-emerald-500/70 tracking-widest uppercase">Basic Details</p>
                  </div>
              </CardHeader>
              <CardContent className="p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black tracking-widest text-emerald-600/70 ml-1">Cheque Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-14 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/10 focus:border-emerald-500/40 focus:ring-emerald-500/5 transition-all px-5 font-bold text-sm">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="receivable">Receivable (Inward)</SelectItem>
                        <SelectItem value="payable">Payable (Outward)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cheque_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black tracking-widest text-emerald-600/70 ml-1">Cheque Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter instrument serial..." className="h-14 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/10 focus:border-emerald-500/40 focus:ring-emerald-500/5 transition-all px-5 font-bold text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bank_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black tracking-widest text-emerald-600/70 ml-1">Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. BOC, Sampath Bank" className="h-14 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/10 focus:border-emerald-500/40 focus:ring-emerald-500/5 transition-all px-5 font-bold text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branch_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black tracking-widest text-emerald-600/70 ml-1">Branch Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter origin branch..." className="h-14 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/10 focus:border-emerald-500/40 focus:ring-emerald-500/5 transition-all px-5 font-bold text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black tracking-widest text-emerald-600/70 ml-1">Amount (LKR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" className="h-14 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/10 focus:border-emerald-500/40 focus:ring-emerald-500/5 transition-all px-5 font-black text-lg text-emerald-600" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payee_payor_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black tracking-widest text-emerald-600/70 ml-1">
                        {form.watch("type") === "receivable" ? "Payor (Received From)" : "Payee (Issued To)"}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter legal name..." className="h-14 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/10 focus:border-emerald-500/40 focus:ring-emerald-500/5 transition-all px-5 font-bold text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cheque_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[10px] font-black tracking-widest text-emerald-600/70 ml-1">Cheque Date (On the Cheque)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full h-14 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/10 focus:border-emerald-500/40 focus:ring-emerald-500/5 transition-all px-5 font-bold text-sm text-left pl-3",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="received_issued_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[10px] font-black tracking-widest text-emerald-600/70 ml-1">
                        {form.watch("type") === "receivable" ? "Received Date" : "Issued Date"}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full h-14 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/10 focus:border-emerald-500/40 focus:ring-emerald-500/5 transition-all px-5 font-bold text-sm text-left pl-3",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel className="text-[10px] font-black tracking-widest text-emerald-600/70 dark:text-emerald-500/70 ml-1">Note</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional details about this instrument..." 
                        className="resize-none rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 focus:border-emerald-500/40 focus:ring-emerald-500/5 transition-all p-5 font-medium text-sm min-h-[120px] dark:text-slate-200"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              variant="ghost"
              type="button"
              className="h-12 rounded-2xl font-bold text-[11px] tracking-widest px-8 text-slate-500 hover:text-red-600 transition-all uppercase"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="h-12 rounded-2xl font-bold text-[11px] tracking-widest px-10 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all uppercase flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Cheque
            </Button>
          </div>
        </form>
      </Form>
    </div>
  </div>
);
}
