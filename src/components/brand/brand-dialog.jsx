"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { useFormRestore } from "@/hooks/use-form-restore";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().optional(),
  description: z.string().optional(),
});

export function BrandDialog({ open, onOpenChange, onSuccess, session, initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  const { clearSavedData } = useFormRestore(form, "brand_dialog_form");

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        slug: initialData.slug || "",
        description: initialData.description || "",
      });
    } else {
      form.reset({
        name: "",
        slug: "",
        description: "",
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data) => {
    if (!session?.accessToken) return;
    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands`;
      
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Brand ${isEditing ? "updated" : "created"} successfully`);
        onSuccess(result.data);
        onOpenChange(false);
        clearSavedData();
        form.reset();
      } else {
        toast.error(result.message || `Failed to ${isEditing ? "update" : "create"} brand`);
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4 shadow-sm shadow-emerald-500/10">
            <Tag className="size-6 text-emerald-600" />
          </div>
          <DialogTitle className="text-xl font-black tracking-tight">
            {isEditing ? "Modify Brand" : "New Brand Entry"}
          </DialogTitle>
          <DialogDescription className="text-[12px] font-medium text-muted-foreground/60 uppercase tracking-wider">
            {isEditing
              ? "Update Manufacturer & Identity Lineage"
              : "Forge a new market identifier"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 pt-4 space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2.5">
                  <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Brand Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Nike, Apple, Samsung" 
                      className="h-12 bg-background border-border/60 rounded-xl px-4 font-bold tracking-tight text-[13px] shadow-sm focus:ring-emerald-500/20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold text-red-500/80 ml-1 uppercase tracking-widest" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem className="space-y-2.5">
                  <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Slug (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="brand-identifier" 
                      className="h-12 bg-background border-border/60 rounded-xl px-4 font-bold tracking-tight text-[13px] shadow-sm focus:ring-emerald-500/20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold text-red-500/80 ml-1 uppercase tracking-widest" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-2.5">
                  <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brand heritage and market position..."
                      className="min-h-[100px] bg-background border-border/60 rounded-2xl px-4 py-3 font-bold tracking-tight text-[13px] shadow-sm focus:ring-emerald-500/20 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold text-red-500/80 ml-1 uppercase tracking-widest" />
                </FormItem>
              )}
            />
            <DialogFooter className="p-6 pt-2 gap-3 bg-muted/20">
              <Button
                type="button"
                variant="ghost"
                className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-all border-none"
                onClick={() => onOpenChange(false)}
              >
                Dismiss
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95 border-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-3 h-4 w-4 animate-spin opacity-60" />
                    Processing
                  </>
                ) : (
                  <>
                    {isEditing ? <Save className="mr-3 h-4 w-4 opacity-60" /> : <Plus className="mr-3 h-4 w-4 opacity-60" />}
                    {isEditing ? "Update Brand" : "Forge Entry"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
