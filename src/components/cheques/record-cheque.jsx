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
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-900">
            <div className="h-10 w-10 bg-blue-600 text-white flex items-center justify-center rounded-xl shadow-lg">
                <Landmark className="h-6 w-6" />
            </div>
            Record Cheque
          </h1>
          <p className="text-sm text-slate-500 font-medium">Capture details for receivable or payable cheques.</p>
        </div>
        <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 border-blue-200 text-blue-700 hover:bg-blue-50" asChild>
          <Link href="/cheques">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-8 bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-lg font-black uppercase tracking-tight">Cheque Information</CardTitle>
                <CardDescription className="text-xs font-medium text-slate-400">Enter the core details of the cheque</CardDescription>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cheque Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-blue-600 focus:border-blue-600">
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
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cheque Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter cheque number" className="h-12 rounded-xl border-slate-200 focus:ring-blue-600 focus:border-blue-600" {...field} />
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
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. BOC, Sampath Bank" className="h-12 rounded-xl border-slate-200 focus:ring-blue-600 focus:border-blue-600" {...field} />
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
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Branch Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter branch name" className="h-12 rounded-xl border-slate-200 focus:ring-blue-600 focus:border-blue-600" {...field} />
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
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount (LKR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" className="h-12 rounded-xl border-slate-200 font-bold focus:ring-blue-600 focus:border-blue-600" {...field} />
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
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {form.watch("type") === "receivable" ? "Payor (Received From)" : "Payee (Issued To)"}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" className="h-12 rounded-xl border-slate-200 focus:ring-blue-600 focus:border-blue-600" {...field} />
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
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cheque Date (On the Cheque)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full h-12 rounded-xl border-slate-200 pl-3 text-left font-normal",
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
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {form.watch("type") === "receivable" ? "Received Date" : "Issued Date"}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full h-12 rounded-xl border-slate-200 pl-3 text-left font-normal",
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
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">Note</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional details about this cheque..." 
                        className="resize-none rounded-xl border-slate-200 min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pb-12">
            <Button
              variant="outline"
              type="button"
              className="h-12 rounded-xl font-black text-[10px] uppercase tracking-widest px-8"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="h-12 rounded-xl font-black text-[10px] uppercase tracking-widest px-10 bg-blue-600 hover:bg-blue-700 shadow-xl transition-all">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Record Cheque
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
