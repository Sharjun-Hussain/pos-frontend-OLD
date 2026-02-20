"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import {
  Printer,
  Settings,
  Search,
  Barcode as BarcodeIcon,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  Maximize,
  ScrollText,
  Sheet,
  XCircle,
  ScanLine,
  Ruler,
  ChevronRight,
  ChevronDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useCurrency } from "@/hooks/useCurrency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { useSettingsStore } from "@/store/useSettingsStore";

// --- COMPONENT: BARCODE STICKER ---
const BarcodeSticker = ({ product, settings, scale = 1, showRulers = false }) => {
  const widthPx = settings.labelWidth * 3.78 * scale;
  const heightPx = settings.labelHeight * 3.78 * scale;
  const fontSize = Math.max(8 * scale, 8);

  const { formatCurrency } = useCurrency();

  return (
    <div className="relative group">
      
      {/* VISUAL RULERS (Preview Only) */}
      {showRulers && (
        <>
          {/* Top Width Indicator */}
          <div className="absolute -top-5 left-0 w-full flex flex-col items-center opacity-50 group-hover:opacity-100 transition-opacity">
             <div className="text-[9px] font-mono text-blue-600 font-bold bg-blue-50 px-1 rounded">{settings.labelWidth}mm</div>
             <div className="w-full h-px bg-blue-300 relative top-px">
                <div className="absolute left-0 top-[-2px] h-1.5 w-px bg-blue-300"></div>
                <div className="absolute right-0 top-[-2px] h-1.5 w-px bg-blue-300"></div>
             </div>
          </div>
          {/* Left Height Indicator */}
          <div className="absolute top-0 -left-6 h-full flex flex-row items-center opacity-50 group-hover:opacity-100 transition-opacity">
             <div className="text-[9px] font-mono text-blue-600 font-bold bg-blue-50 px-1 rounded -rotate-90 whitespace-nowrap">{settings.labelHeight}mm</div>
             <div className="h-full w-px bg-blue-300 relative left-[2px]">
                <div className="absolute top-0 left-[-2px] w-1.5 h-px bg-blue-300"></div>
                <div className="absolute bottom-0 left-[-2px] w-1.5 h-px bg-blue-300"></div>
             </div>
          </div>
        </>
      )}

      {/* Sticker Content */}
      <div
        className="bg-white flex flex-col items-center justify-center text-center overflow-hidden relative box-border transition-all duration-200"
        style={{
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          // Dashed outline for preview, none for print
          outline: showRulers ? '1px dashed #cbd5e1' : 'none',
          padding: `${2 * scale}px`,
          pageBreakInside: "avoid",
        }}
      >
        <div className="flex flex-col items-center w-full h-full justify-between">
          <div className="w-full">
              {settings.showFields.name && (
              <div className="font-bold text-black leading-tight w-full truncate px-1" style={{ fontSize: `${fontSize + 2}px` }}>
                  {product.name}
              </div>
              )}
              {settings.showFields.variant && (
              <div className="text-gray-600 leading-none mt-0.5" style={{ fontSize: `${fontSize - 1}px` }}>
                  {product.variant}
              </div>
              )}
          </div>

          <div className="flex-1 flex items-center justify-center w-full overflow-hidden my-1">
            <Barcode 
                  value={product.barcode} 
                  format={settings.barcodeFormat} 
                  // Adjust Barcode Thickness based on settings
                  width={settings.barThickness * scale} 
                  // Adjust Barcode Height based on settings
                  height={settings.barHeight * scale} 
                  displayValue={settings.showFields.barcode}
                  fontSize={settings.barFontSize * scale}
                  margin={0}
                  background="transparent"
            />
          </div>

          <div className="w-full flex flex-col items-center">
              <div className="flex justify-between w-full px-2 font-semibold" style={{ fontSize: `${fontSize + 1}px` }}>
                  {settings.showFields.price && <span>{formatCurrency(product.price)}</span>}
                  {settings.showFields.sku && <span className="font-normal text-gray-500">{product.sku}</span>}
              </div>
              {settings.showFields.customText && settings.customTextContent && (
                  <span className="text-gray-500 block mt-0.5 truncate w-full" style={{ fontSize: `${fontSize - 2}px` }}>
                      {settings.customTextContent}
                  </span>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: HIDDEN PRINT SHEET ---
const PrintableSheet = ({ itemsToPrint, settings, refInstance }) => {
    return (
        <div style={{ display: "none" }}>
            <div ref={refInstance}>
                <style type="text/css" media="print">
                    {` @page { size: auto; margin: 0mm; } body { margin: 0; padding: 0; } `}
                </style>
                <div 
                    className="w-full"
                    style={{ 
                        paddingTop: `${settings.marginTop}mm`, 
                        paddingLeft: `${settings.marginLeft}mm`,
                        display: 'grid',
                        gridTemplateColumns: settings.perRow === 'auto' 
                            ? `repeat(auto-fill, ${settings.labelWidth}mm)` 
                            : `repeat(${settings.perRow}, ${settings.labelWidth}mm)`,
                        columnGap: `${settings.gapX}mm`,
                        rowGap: `${settings.gapY}mm`,
                    }}
                >
                    {itemsToPrint.map((item, idx) => (
                        <div key={idx}>
                            <BarcodeSticker product={item} settings={settings} scale={1} showRulers={false} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function BarcodePrintingPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [zoomLevel, setZoomLevel] = useState([1]);

  // Print Configuration
  const [settings, setSettings] = useState({
    paperType: "a4",
    labelWidth: 50,
    labelHeight: 30,
    perRow: "auto",
    marginTop: 10, marginLeft: 10, gapX: 2, gapY: 2,
    customQty: 1,
    barcodeFormat: "CODE128",
    // New Barcode Styling Props
    barThickness: 1.5,
    barHeight: 30,
    barFontSize: 12,
    showFields: {
      name: true, variant: true, sku: true, barcode: true, price: true, customText: false,
    },
    customTextContent: "",
  });

  const { data: session } = useSession();
  const { formatCurrency } = useCurrency();
  const { useModularSettings } = useSettings();
  const { setGlobalSettings, setBusinessSettings } = useSettingsStore();

  const { data: globalSettingsResponse } = useModularSettings("global");

  useEffect(() => {
    if (globalSettingsResponse?.data) {
      const { business, modules } = globalSettingsResponse.data;
      if (business) {
        setBusinessSettings(business);
        // Explicitly sync business currency to global store if business has it
        if (business.currency) {
          setGlobalSettings({ currency: business.currency });
        }
      }
      // Modules contains category keys like 'global', 'receipt', 'pos'
      if (modules?.global) {
        setGlobalSettings(modules.global);
      }
    }
  }, [globalSettingsResponse, setGlobalSettings, setBusinessSettings]);

  const fetchData = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?size=2000`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const result = await response.json();

      if (response.ok) {
        setProducts(result.data.data || []);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Network error fetching barcode data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  // Flatten logic for printing and filtered views
  const allVariants = useMemo(() => {
    const list = [];
    products.forEach(p => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach(v => {
          let variantLabel = v.name;
          if (!variantLabel && v.attribute_values) {
              variantLabel = v.attribute_values.map(av => av.value).join(" / ");
          }
          list.push({
            id: v.id,
            productId: p.id,
            name: p.name,
            variant: variantLabel || "Default",
            sku: v.sku || p.sku,
            barcode: v.barcode || p.barcode,
            stock: v.stock_quantity || 0,
            price: v.price || p.price
          });
        });
      } else {
        // Simple product
        list.push({
          id: `p-${p.id}`, // Pseudo-ID for simple product variant
          productId: p.id,
          name: p.name,
          variant: "Standard",
          sku: p.sku,
          barcode: p.barcode,
          stock: 0,
          price: p.price
        });
      }
    });
    return list;
  }, [products]);

  const itemsToPrint = useMemo(() => {
    let list = [];
    selectedVariants.forEach(id => {
        const variant = allVariants.find(v => v.id === id);
        if(!variant) return;
        const count = parseInt(settings.customQty) || 1;
        list = [...list, ...Array(count).fill(variant)];
    });
    return list;
  }, [selectedVariants, allVariants, settings.customQty]);

  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Barcodes_Export`,
  });

  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));
  
  const toggleField = (field) => {
    setSettings(prev => ({ ...prev, showFields: { ...prev.showFields, [field]: !prev.showFields[field] } }));
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(p => {
        const productMatch = p.name.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term));
        const variantMatch = p.variants?.some(v => 
            (v.name && v.name.toLowerCase().includes(term)) || 
            (v.barcode && v.barcode.toLowerCase().includes(term)) ||
            (v.sku && v.sku.toLowerCase().includes(term))
        );
        return productMatch || variantMatch;
    });
  }, [products, searchTerm]);

  const toggleVariantSelection = (id) => {
    setSelectedVariants(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const toggleProductSelection = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const variantIds = product.variants && product.variants.length > 0 
        ? product.variants.map(v => v.id)
        : [`p-${product.id}`];
    
    const allSelected = variantIds.every(id => selectedVariants.includes(id));
    
    if (allSelected) {
        setSelectedVariants(prev => prev.filter(id => !variantIds.includes(id)));
    } else {
        setSelectedVariants(prev => [...new Set([...prev, ...variantIds])]);
    }
  };

  const toggleAll = () => {
    const allVisibleVariantIds = [];
    filteredProducts.forEach(p => {
        if (p.variants && p.variants.length > 0) {
            p.variants.forEach(v => allVisibleVariantIds.push(v.id));
        } else {
            allVisibleVariantIds.push(`p-${p.id}`);
        }
    });

    const allSelected = allVisibleVariantIds.every(id => selectedVariants.includes(id));
    if (allSelected) {
        setSelectedVariants(prev => prev.filter(id => !allVisibleVariantIds.includes(id)));
    } else {
        setSelectedVariants(prev => [...new Set([...prev, ...allVisibleVariantIds])]);
    }
  };

  const toggleExpand = (id) => {
      setExpandedProducts(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  return (
    <div className="flex flex-1 w-full pr-4  bg-slate-50 font-sans">
      <PrintableSheet itemsToPrint={itemsToPrint} settings={settings} refInstance={componentRef} />

      {/* --- LEFT: MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-[600px]">
        <header className="px-8 py-5 z-10 shrink-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-blue-200">
                        <BarcodeIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Barcode Center</h1>
                        <p className="text-slate-500 text-xs font-medium">Select items, configure layout, and print.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden xl:block">
                        <p className="text-sm font-bold text-slate-700">{itemsToPrint.length} Labels</p>
                        <p className="text-xs text-slate-400">Total to print</p>
                    </div>
                    <Separator orientation="vertical" className="h-8 hidden xl:block" />
                    <Button onClick={handlePrint} disabled={itemsToPrint.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 gap-2">
                        <Printer className="h-4 w-4" /> Print Labels
                    </Button>
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-20">
                {/* Unified Search */}

                {/* Filters & Table (Same as previous) */}
                <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Search products or variants (Name, SKU, Barcode)..." className="pl-9 bg-white border-slate-300 h-10"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {searchTerm && (
                        <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600">
                             Clear
                        </Button>
                    )}
                </div>

                <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                    <div className="bg-slate-50/80 px-4 py-2 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Checkbox 
                                checked={filteredProducts.length > 0 && filteredProducts.every(p => {
                                    const variantIds = p.variants?.length > 0 ? p.variants.map(v => v.id) : [`p-${p.id}`];
                                    return variantIds.every(id => selectedVariants.includes(id));
                                }) ? true : (filteredProducts.some(p => {
                                    const variantIds = p.variants?.length > 0 ? p.variants.map(v => v.id) : [`p-${p.id}`];
                                    return variantIds.some(id => selectedVariants.includes(id));
                                }) ? "indeterminate" : false)} 
                                onCheckedChange={toggleAll} 
                            />
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide ml-2">Select All Visible</span>
                        </div>
                        <Badge variant="secondary" className="bg-white border border-slate-200 text-slate-600">{selectedVariants.length} selected</Badge>
                    </div>
                    <div className="overflow-auto max-h-[500px]">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-xs text-slate-500 bg-white sticky top-0 z-10 shadow-sm border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 w-10"></th>
                                    <th className="px-4 py-3 w-8"></th>
                                    <th className="px-4 py-3 font-medium">Product / Variant</th>
                                    <th className="px-4 py-3 font-medium">Barcode</th>
                                    <th className="px-4 py-3 font-medium text-right">Stock</th>
                                    <th className="px-4 py-3 font-medium text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProducts.map((p) => {
                                    const hasVariants = p.variants && p.variants.length > 0;
                                    const variantIds = hasVariants ? p.variants.map(v => v.id) : [`p-${p.id}`];
                                    const isExpanded = expandedProducts.has(p.id);
                                    const isAllSelected = variantIds.every(id => selectedVariants.includes(id));
                                    const isSomeSelected = variantIds.some(id => selectedVariants.includes(id));

                                    return (
                                        <>
                                            {/* Product Row */}
                                            <tr key={p.id} className={`group ${isAllSelected ? "bg-blue-50/40" : "hover:bg-slate-50/80"}`} onClick={() => toggleProductSelection(p.id)}>
                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox 
                                                        checked={isAllSelected ? true : (isSomeSelected ? "indeterminate" : false)}
                                                        onCheckedChange={() => toggleProductSelection(p.id)} 
                                                    />
                                                </td>
                                                <td className="px-2 py-3" onClick={(e) => { e.stopPropagation(); if(hasVariants) toggleExpand(p.id); }}>
                                                    {hasVariants && (
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400">
                                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                        </Button>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-900">{p.name}</span>
                                                        {!hasVariants && <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Simple Product</span>}
                                                        {hasVariants && <span className="text-[10px] text-blue-500 font-medium uppercase tracking-tighter">{p.variants.length} Variants</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-slate-400">
                                                    {!hasVariants ? (p.barcode) : "---"}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {!hasVariants ? (
                                                        <Badge variant="outline" className="bg-slate-50">{p.stock || 0}</Badge>
                                                    ) : "---"}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    {!hasVariants ? formatCurrency(p.price || 0) : "---"}
                                                </td>
                                            </tr>

                                            {/* Variant Rows */}
                                            {hasVariants && isExpanded && p.variants.map(v => {
                                                const vId = v.id;
                                                const isVSelected = selectedVariants.includes(vId);
                                                let variantLabel = v.name;
                                                if (!variantLabel && v.attribute_values) {
                                                    variantLabel = v.attribute_values.map(av => av.value).join(" / ");
                                                }
                                                return (
                                                    <tr key={vId} className={`group transition-colors ${isVSelected ? "bg-blue-50/40" : "bg-slate-50/30 hover:bg-slate-50"}`} onClick={(e) => { e.stopPropagation(); toggleVariantSelection(vId); }}>
                                                        <td className="px-4 py-2 border-l-2 border-blue-200"></td>
                                                        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                                                            <Checkbox checked={isVSelected} onCheckedChange={() => toggleVariantSelection(vId)} />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-slate-600 font-medium">{variantLabel || "Default"}</span>
                                                                {v.sku && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-slate-100">{v.sku}</Badge>}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 font-mono text-[11px] text-slate-400">{v.barcode || p.barcode}</td>
                                                        <td className="px-4 py-2 text-right">
                                                            <span className="text-xs text-slate-500">{v.stock_quantity || 0}</span>
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-bold text-slate-700">
                                                            {formatCurrency(v.price || p.price || 0)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* LIVE PREVIEW WITH RULERS */}
                <Card className="h-[400px] border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0 mb-6">
                    <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-sm font-semibold text-slate-700">Live Preview</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-2 py-2 rounded-lg border border-slate-200">
                            <ZoomOut className="h-5 w-5 text-slate-400 cursor-pointer" onClick={() => setZoomLevel([Math.max(0.5, zoomLevel[0] - 0.1)])}/>
                            <Slider value={zoomLevel} onValueChange={setZoomLevel} min={0.5} max={2.0} step={0.1} className="w-50" />
                            <ZoomIn className="h-5 w-5 text-slate-400 cursor-pointer" onClick={() => setZoomLevel([Math.min(2.0, zoomLevel[0] + 0.1)])}/>
                        </div>
                    </div>
                    
                    <div className="flex-1 bg-slate-200/50 overflow-auto p-8 flex justify-center relative">
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        {/* Paper Visual */}
                        <div 
                            className="bg-white shadow-xl transition-all origin-top box-content"
                            style={{ 
                                width: '210mm', minHeight: '297mm', padding: '10mm',
                                transform: `scale(${zoomLevel[0]})`,
                                display: 'grid', alignContent: 'start',
                                gridTemplateColumns: settings.perRow === 'auto' ? `repeat(auto-fill, ${settings.labelWidth}mm)` : `repeat(${settings.perRow}, ${settings.labelWidth}mm)`,
                                columnGap: `${settings.gapX}mm`, rowGap: `${settings.gapY}mm`,
                            }}
                        >
                            {itemsToPrint.length > 0 ? itemsToPrint.map((item, i) => (
                                <div key={i} className="relative group hover:z-10">
                                    <BarcodeSticker product={item} settings={settings} scale={1} showRulers={true} />
                                </div>
                            )) : (
                                <div className="col-span-full h-64 flex items-center justify-center text-slate-300 text-xl font-bold uppercase tracking-widest">Preview Area</div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      </div>

      {/* --- RIGHT: SETTINGS --- */}
      <div className="w-[340px] rounded-2xl bg-white h-full flex flex-col shadow-[-4px_0_20px_-5px_rgba(0,0,0,0.05)] z-20">
        <div className="p-5 border-b border-slate-200  shrink-0"><h2 className="font-bold text-slate-900 flex items-center gap-2"><Settings className="h-4 w-4 text-slate-500" /> Configuration</h2></div>

        <ScrollArea className="flex-1">
            <div className="p-5 space-y-6">
                {/* Paper Settings */}
                <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Paper Settings</Label>
                    <Tabs value={settings.paperType} onValueChange={(v) => updateSetting('paperType', v)} className="w-full">
                        <TabsList className="w-full grid grid-cols-2 h-9 ">
                            <TabsTrigger value="roll" className="text-xs"><ScrollText className="h-3 w-3 mr-2"/> Thermal</TabsTrigger>
                            <TabsTrigger value="a4" className="text-xs"><Sheet className="h-3 w-3 mr-2"/> A4 Sheet</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Label Dimensions */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label className="text-xs font-semibold text-slate-700">Label Size</Label>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-blue-600 font-mono">{settings.labelWidth} x {settings.labelHeight} mm</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[ { w: 40, h: 20 }, { w: 50, h: 30 }, { w: 60, h: 40 }, { w: 100, h: 50 } ].map((size, idx) => (
                            <button key={idx} onClick={() => { setSettings(p => ({...p, labelWidth: size.w, labelHeight: size.h})) }} className={`border rounded px-2 py-2 text-xs flex flex-col items-center justify-center gap-1 transition-all h-14 ${settings.labelWidth === size.w && settings.labelHeight === size.h ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}>
                                <Maximize className="h-3 w-3 opacity-50" />{size.w} x {size.h}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="relative"><Label className="text-[10px] text-slate-500">Width (mm)</Label><Input type="number" value={settings.labelWidth} onChange={(e) => updateSetting('labelWidth', Number(e.target.value))} className="h-8 text-xs"/></div>
                        <div className="relative"><Label className="text-[10px] text-slate-500">Height (mm)</Label><Input type="number" value={settings.labelHeight} onChange={(e) => updateSetting('labelHeight', Number(e.target.value))} className="h-8 text-xs"/></div>
                    </div>
                </div>

                <Separator />

                {/* ADVANCED BARCODE STYLING (NEW) */}
                <Accordion type="single" collapsible defaultValue="styling" className="w-full">
                    <AccordionItem value="styling" className="border-b-0">
                        <AccordionTrigger className="py-2 text-xs font-bold uppercase text-slate-400 tracking-widest hover:no-underline group">
                            <span className="flex items-center gap-2"><ScanLine className="h-3 w-3"/> Barcode Styling</span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between"><Label className="text-xs text-slate-600">Bar Thickness</Label><span className="text-[10px] text-slate-400">{settings.barThickness}</span></div>
                                <Slider value={[settings.barThickness]} onValueChange={(v) => updateSetting('barThickness', v[0])} min={1} max={4} step={0.5} className="py-1" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between"><Label className="text-xs text-slate-600">Bar Height</Label><span className="text-[10px] text-slate-400">{settings.barHeight}px</span></div>
                                <Slider value={[settings.barHeight]} onValueChange={(v) => updateSetting('barHeight', v[0])} min={10} max={100} step={5} className="py-1" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between"><Label className="text-xs text-slate-600">Font Size</Label><span className="text-[10px] text-slate-400">{settings.barFontSize}px</span></div>
                                <Slider value={[settings.barFontSize]} onValueChange={(v) => updateSetting('barFontSize', v[0])} min={8} max={24} step={1} className="py-1" />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <Separator />

                {/* LAYOUT & SPACING */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="layout" className="border-b-0">
                        <AccordionTrigger className="py-2 text-xs font-bold uppercase text-slate-400 tracking-widest hover:no-underline"><span className="flex items-center gap-2"><Ruler className="h-3 w-3"/> Layout & Spacing</span></AccordionTrigger>
                        <AccordionContent className="pt-2 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-600">Barcodes per Row</Label>
                                <div className="flex bg-slate-50 p-1 rounded border border-slate-200">
                                    {['auto', 2, 3, 4, 5].map(val => (
                                        <button key={val} onClick={() => updateSetting('perRow', val)} className={`flex-1 py-1 text-xs rounded transition-all ${settings.perRow === val ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}>{val}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><Label className="text-[10px] text-slate-500">Top Margin (mm)</Label><Input type="number" value={settings.marginTop} onChange={(e) => updateSetting('marginTop', Number(e.target.value))} className="h-7 text-xs"/></div>
                                <div className="space-y-1"><Label className="text-[10px] text-slate-500">Left Margin (mm)</Label><Input type="number" value={settings.marginLeft} onChange={(e) => updateSetting('marginLeft', Number(e.target.value))} className="h-7 text-xs"/></div>
                                <div className="space-y-1"><Label className="text-[10px] text-slate-500">Horiz. Gap (mm)</Label><Input type="number" value={settings.gapX} onChange={(e) => updateSetting('gapX', Number(e.target.value))} className="h-7 text-xs"/></div>
                                <div className="space-y-1"><Label className="text-[10px] text-slate-500">Vert. Gap (mm)</Label><Input type="number" value={settings.gapY} onChange={(e) => updateSetting('gapY', Number(e.target.value))} className="h-7 text-xs"/></div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <Separator />

                {/* Quantity Logic */}
                <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Quantity</Label>
                    <RadioGroup value={settings.qtyMode} onValueChange={(val) => updateSetting('qtyMode', val)} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between border border-slate-200 p-2 rounded bg-white">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="grn" id="q-grn" className="text-blue-600 scale-90" /><Label htmlFor="q-grn" className="text-xs font-medium cursor-pointer">Use Stock Count</Label></div>
                        </div>
                        <div className="flex items-center justify-between border border-slate-200 p-2 rounded bg-white">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="q-custom" className="text-blue-600 scale-90" /><Label htmlFor="q-custom" className="text-xs font-medium cursor-pointer">Fixed Amount</Label></div>
                            {settings.qtyMode === 'custom' && <Input type="number" value={settings.customQty} onChange={(e) => updateSetting('customQty', e.target.value)} className="h-6 w-12 text-center text-xs p-0" />}
                        </div>
                    </RadioGroup>
                </div>

                <Separator />

                {/* Content Toggles */}
                <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Fields Display</Label>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                        {Object.keys(settings.showFields).filter(k => k !== 'customTextContent').map((key) => (
                            <div key={key} className="flex items-center space-x-2">
                                <Checkbox id={`field-${key}`} checked={settings.showFields[key]} onCheckedChange={() => toggleField(key)} className="h-3.5 w-3.5 text-blue-600" />
                                <Label htmlFor={`field-${key}`} className="text-xs capitalize cursor-pointer select-none">{key}</Label>
                            </div>
                        ))}
                    </div>
                    {settings.showFields.customText && <Input placeholder="E.g. 'Non-Refundable'" value={settings.customTextContent} onChange={(e) => updateSetting('customTextContent', e.target.value)} className="mt-2 h-7 text-xs bg-blue-50/50 border-blue-200" />}
                </div>
            </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50 shrink-0">
            <Button variant="outline" className="w-full border-slate-300 text-slate-600 hover:bg-white text-xs h-8">Save Configuration</Button>
        </div>
      </div>
    </div>
  );
}