"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Plus, Check, ChevronsUpDown, FolderOpen } from "lucide-react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  main_category_id: z.string().min(1, "Main Category is required"),
  description: z.string().optional(),
});

export function SubCategoryDialog({ open, onOpenChange, onSuccess, session, initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mainCategories, setMainCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  
  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      main_category_id: "",
      description: "",
    },
  });

  const { clearSavedData } = useFormRestore(form, "sub_category_dialog_form");

  // Fetch Main Categories
  useEffect(() => {
    const fetchMainCategories = async () => {
      if (!session?.accessToken || !open) return;
      
      setLoadingCategories(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const data = await response.json();
        if (data.status === "success") {
          setMainCategories(data.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch main categories:", error);
        toast.error("Failed to load main categories");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchMainCategories();
  }, [session?.accessToken, open]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        main_category_id: initialData.main_category_id?.toString() || "",
        description: initialData.description || "",
      });
    } else {
      form.reset({
        name: "",
        main_category_id: "",
        description: "",
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data) => {
    if (!session?.accessToken) return;
    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/sub-categories/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/sub-categories`;
      
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
        toast.success(`Sub Category ${isEditing ? "updated" : "created"} successfully`);
        onSuccess(result.data);
        onOpenChange(false);
        clearSavedData();
        form.reset();
      } else {
        toast.error(result.message || `Failed to ${isEditing ? "update" : "create"} sub category`);
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
      <DialogContent className="sm:max-w-[520px] rounded-3xl border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4 shadow-sm shadow-emerald-500/10">
            <FolderOpen className="size-6 text-emerald-600" />
          </div>
          <DialogTitle className="text-xl font-black tracking-tight">
            {isEditing ? "Modify Sub Category" : "New Subset Entry"}
          </DialogTitle>
          <DialogDescription className="text-[12px] font-medium text-muted-foreground/60 uppercase tracking-wider">
            {isEditing
              ? "Update Granular Product Classification"
              : "Forge a new niche segment"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 pt-4 space-y-6">
            <FormField
              control={form.control}
              name="main_category_id"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-2.5">
                  <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Parent Category</FormLabel>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "h-12 justify-between bg-background border-border/60 rounded-xl px-4 font-bold tracking-tight text-[13px] shadow-sm focus:ring-emerald-500/20",
                            !field.value && "text-muted-foreground font-medium"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {field.value && <Folder className="size-4 text-emerald-500/50" />}
                            {field.value
                              ? mainCategories.find(
                                  (category) => category.id.toString() === field.value
                                )?.name
                              : "Map to primary taxonomy"}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0 rounded-2xl border-border/60 shadow-2xl overflow-hidden backdrop-blur-xl">
                      <Command className="bg-background/95">
                        <CommandInput placeholder="Search taxonomy..." className="h-11 border-none bg-transparent" />
                        <CommandList>
                          <CommandEmpty className="py-4 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40">No segments discovered</CommandEmpty>
                          <CommandGroup>
                            {mainCategories.map((category) => (
                              <CommandItem
                                value={category.name}
                                key={category.id}
                                className="px-3 py-2.5 cursor-pointer aria-selected:bg-emerald-500/10 aria-selected:text-emerald-600 transition-colors"
                                onSelect={() => {
                                  form.setValue("main_category_id", category.id.toString());
                                  setOpenCombobox(false);
                                }}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-3">
                                    <div className="size-6 rounded-lg bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
                                      <Folder className="size-3 text-emerald-500/60" />
                                    </div>
                                    <span className="text-[13px] font-bold tracking-tight">{category.name}</span>
                                  </div>
                                  <Check
                                    className={cn(
                                      "h-4 w-4 text-emerald-500",
                                      category.id.toString() === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-[10px] font-bold text-red-500/80 ml-1 uppercase tracking-widest" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2.5">
                  <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Sub Category Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Smartphones, T-Shirts, Soft Drinks" 
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
                      placeholder="Niche scope and granular logistics..."
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
                    {isEditing ? "Update Subset" : "Forge Entry"}
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
