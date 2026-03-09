"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Plus, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  base_unit_id: z.string().optional(),
  measurement_unit_id: z.string().optional(),
  capacity: z.coerce.number().min(0, "Capacity must be positive").optional(),
  description: z.string().optional(),
});

export function ContainerDialog({ open, onOpenChange, onSuccess, session, initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [units, setUnits] = useState([]);
  const [measurementUnits, setMeasurementUnits] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [openUnitCombobox, setOpenUnitCombobox] = useState(false);
  const [openMeasurementCombobox, setOpenMeasurementCombobox] = useState(false);
  
  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      base_unit_id: "",
      measurement_unit_id: "",
      capacity: 0,
      description: "",
    },
  });

  // Fetch Units and Measurement Units
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.accessToken || !open) return;
      
      setLoadingData(true);
      try {
        const [mUnitsRes, unitsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/measurement-units/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/units/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
        ]);

        const mUnitsData = await mUnitsRes.json();
        const unitsData = await unitsRes.json();

        if (mUnitsData.status === "success") {
          setMeasurementUnits(mUnitsData.data || []);
        }
        if (unitsData.status === "success") {
          setUnits(unitsData.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load unit data");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [session?.accessToken, open]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        slug: initialData.slug || "",
        base_unit_id: initialData.base_unit_id?.toString() || "",
        measurement_unit_id: initialData.measurement_unit_id?.toString() || "",
        capacity: initialData.capacity || 0,
        description: initialData.description || "",
      });
    } else {
      form.reset({
        name: "",
        slug: "",
        base_unit_id: "",
        measurement_unit_id: "",
        capacity: 0,
        description: "",
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data) => {
    if (!session?.accessToken) return;
    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/containers/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/containers`;
      
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
        toast.success(`Container ${isEditing ? "updated" : "created"} successfully`);
        onSuccess(result.data);
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.message || `Failed to ${isEditing ? "update" : "create"} container`);
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full bg-card/50 backdrop-blur-xl p-0 overflow-hidden border-l border-border/60 shadow-2xl">
        <SheetHeader className="p-6 border-b border-border/50 bg-muted/30">
          <SheetTitle className="text-2xl font-black text-foreground">
            {isEditing ? "Edit Container" : "Create Container"}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground font-medium">
            {isEditing
              ? "Make changes to the container details here."
              : "Add a new container to your inventory."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Container Name" 
                        className="h-11 bg-background border-border/50 focus-visible:ring-emerald-500 font-bold"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="base_unit_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">Base Unit</FormLabel>
                    <Popover open={openUnitCombobox} onOpenChange={setOpenUnitCombobox}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between h-11 bg-background border-border/50 font-bold",
                              !field.value && "text-muted-foreground font-medium"
                            )}
                          >
                            {field.value
                              ? units.find(
                                  (unit) => unit.id.toString() === field.value
                                )?.name
                              : "Select unit"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search unit..." />
                          <CommandList>
                            <CommandEmpty>No unit found.</CommandEmpty>
                            <CommandGroup>
                              {units.map((unit) => (
                                <CommandItem
                                  value={unit.name}
                                  key={unit.id}
                                  onSelect={() => {
                                    form.setValue("base_unit_id", unit.id.toString());
                                    setOpenUnitCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      unit.id.toString() === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {unit.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="measurement_unit_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">Measurement Unit</FormLabel>
                    <Popover open={openMeasurementCombobox} onOpenChange={setOpenMeasurementCombobox}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between h-11 bg-background border-border/50 font-bold",
                              !field.value && "text-muted-foreground font-medium"
                            )}
                          >
                            {field.value
                              ? measurementUnits.find(
                                  (unit) => unit.id.toString() === field.value
                                )?.name
                              : "Select unit"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search unit..." />
                          <CommandList>
                            <CommandEmpty>No unit found.</CommandEmpty>
                            <CommandGroup>
                              {measurementUnits.map((unit) => (
                                <CommandItem
                                  value={unit.name}
                                  key={unit.id}
                                  onSelect={() => {
                                    form.setValue("measurement_unit_id", unit.id.toString());
                                    setOpenMeasurementCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      unit.id.toString() === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {unit.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">Capacity</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" className="h-11 bg-background border-border/50 focus-visible:ring-emerald-500 font-bold" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">Slug (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="container-slug" className="h-11 bg-background border-border/50 focus-visible:ring-emerald-500 font-mono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description..."
                      className="resize-none min-h-[100px] border-border/50 bg-background/50 focus-visible:ring-emerald-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </form>
          </Form>
        </div>
        
        <SheetFooter className="p-6 border-t border-border/50 bg-muted/20 flex-none">
          <div className="flex w-full items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className=" px-6 font-bold text-muted-foreground hover:bg-muted transition-colors rounded-xl border-border/50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className=" px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {isEditing ? "Save Changes" : "Create Container"}
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
