"use client";

import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import {
  UploadCloud, FileSpreadsheet, ArrowRight, Save, 
  CheckCircle2, Database, Download, Loader2, ArrowUpFromLine
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";

const SYSTEM_FIELDS = [
  { id: "ignore", label: "Skip this column", required: false },
  { id: "name", label: "Product Name", required: true },
  { id: "code", label: "Product Code", required: true },
  { id: "brand", label: "Brand Name", required: true },
  { id: "main_category", label: "Category", required: true },
  { id: "selling_price", label: "Selling Price", required: true },
  { id: "cost_price", label: "Cost Price", required: false },
  { id: "unit", label: "Unit", required: false },
  { id: "stock_qty", label: "Opening Stock", required: false },
];

export function DataImportSettings() {
  const { data: session } = useSession();
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Import
  const [fileData, setFileData] = useState({ data: [], headers: [], fileName: "" });
  const [mapping, setMapping] = useState({});
  const [importStats, setImportStats] = useState({ total: 0, current: 0, success: 0, failed: 0 });
  const [logs, setLogs] = useState([]);

  const metadata = { brands: 12, categories: 8, units: 5 };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setFileData({
          data: results.data,
          headers: results.meta.fields || [],
          fileName: file.name
        });
        
        const initialMap = {};
        results.meta.fields.forEach(h => {
          const match = SYSTEM_FIELDS.find(f => 
            f.id !== 'ignore' && f.label.toLowerCase().includes(h.toLowerCase())
          );
          initialMap[h] = match ? match.id : "ignore";
        });
        setMapping(initialMap);
        setStep(2);
      }
    });
  };

  const startImport = async () => {
    setStep(3);
    setImportStats({ total: fileData.data.length, current: 0, success: 0, failed: 0 });
    setLogs([]);

    const productsToImport = fileData.data.map(row => {
      const product = {};
      Object.keys(mapping).forEach(header => {
        const systemField = mapping[header];
        if (systemField !== 'ignore') product[systemField] = row[header];
      });
      return product;
    });

    try {
      const token = session?.user?.accessToken || session?.accessToken;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/import`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ products: productsToImport })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Import failed");

      const { success, failed, logs: importLogs } = result.data;
      
      setImportStats({ total: productsToImport.length, current: productsToImport.length, success, failed });
      setLogs(importLogs || []);
      
      if (failed === 0) toast.success(`Successfully imported ${success} products`);
      else toast.warning(`Imported ${success} products with ${failed} failures`);
    } catch (error) {
      toast.error(error.message || "Server error during import");
      setStep(2);
    }
  };

  const handleExport = async () => {
    try {
      toast.loading("Preparing export data...");
      const token = session?.user?.accessToken || session?.accessToken;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/export`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Export failed");

      const csv = Papa.unparse(result.data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `products_export_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.dismiss();
      toast.success("Inventory exported successfully");
    } catch (error) {
      toast.dismiss();
      toast.error("Export failed: " + error.message);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8 relative">
      <div className="absolute top-1/2 -translate-y-1/2 w-64 h-0.5 bg-muted/50 -z-10" />
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all border-4 border-card",
            step === s ? "bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20 scale-110" 
            : step > s ? "bg-[#10b981]/10 text-[#10b981]" 
            : "bg-muted/50 text-muted-foreground/40"
          )}>
            {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
          </div>
          {s !== 3 && <div className={cn("w-16 h-0.5 mx-1 transition-colors", step > s ? "bg-[#10b981]" : "bg-transparent")} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Bulk Data Import</h2>
          <p className="text-sm text-muted-foreground/60 font-medium mt-0.5">Upload CSV to create or update products in bulk.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10 min-h-[500px]">
        <div className="bg-muted/30 border-b border-border/30 px-6 py-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-[#10b981]" />
          <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">Import Wizard</h3>
        </div>
        
        <CardContent className="p-8">
          <StepIndicator />

          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto border-2 border-dashed border-border/40 rounded-3xl bg-muted/10 p-12 text-center hover:bg-[#10b981]/5 hover:border-[#10b981]/30 transition-all duration-300">
               <div className="w-20 h-20 bg-background shadow-md border border-border/40 text-[#10b981] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <UploadCloud className="w-10 h-10" />
               </div>
               <h3 className="text-xl font-black text-foreground tracking-tight">Upload CSV File</h3>
               <p className="text-xs text-muted-foreground/60 font-medium mt-2 mb-8 max-w-sm mx-auto">
                 Drag & drop your formatted CSV data file here. Maximum file size 10MB.
               </p>
               <div className="relative inline-block w-full max-w-[200px]">
                 <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                 <Button className="w-full bg-[#10b981] hover:bg-[#059669] text-white h-12 rounded-xl font-black text-xs uppercase tracking-widest border-none shadow-lg shadow-[#10b981]/20 transition-all active:scale-95 gap-2">
                    <ArrowUpFromLine className="w-4 h-4" /> Browse Files
                 </Button>
               </div>
               
               <div className="mt-12 pt-8 border-t border-border/30 max-w-sm mx-auto">
                  <h4 className="text-[11px] font-black text-foreground uppercase tracking-widest mb-4">Export Current Inventory</h4>
                  <Button variant="outline" onClick={handleExport} className="w-full h-11 border-border/40 text-muted-foreground hover:text-[#10b981] hover:bg-[#10b981]/5 rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2">
                    <Download className="w-4 h-4" /> Download Backup CSV
                  </Button>
               </div>
            </div>
          )}

          {/* STEP 2: MAPPING */}
          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-[11px] font-black text-[#10b981] uppercase tracking-widest flex items-center gap-2 mb-4">
                  <FileSpreadsheet className="w-4 h-4" /> Map CSV Columns
                </h3>
                <div className="border border-border/30 rounded-2xl overflow-hidden bg-background">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 border-b border-border/30">
                      <tr>
                        <th className="px-5 py-3 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">Your CSV Header</th>
                        <th className="px-5 py-3 text-center w-10"></th>
                        <th className="px-5 py-3 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">System Database Field</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {fileData.headers.map((header) => (
                        <tr key={header} className="hover:bg-muted/10 transition-colors">
                          <td className="px-5 py-4 font-bold text-[13px] text-foreground">{header}</td>
                          <td className="px-5 py-4 text-center"><ArrowRight className="w-4 h-4 text-muted-foreground/30 mx-auto" /></td>
                          <td className="px-5 py-3">
                            <Select value={mapping[header]} onValueChange={(v) => setMapping(p => ({...p, [header]: v}))}>
                              <SelectTrigger className="h-10 bg-background border-border/40 rounded-xl focus:border-[#10b981]">
                                  <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  {SYSTEM_FIELDS.map(f => (
                                      <SelectItem key={f.id} value={f.id}>{f.label} {f.required && <span className="text-red-500">*</span>}</SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-muted/20 rounded-3xl p-6 h-fit border border-border/30">
                  <h4 className="text-[11px] font-black text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#10b981]" /> Status Checks
                  </h4>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm p-3 bg-background rounded-xl border border-border/20">
                          <span className="text-xs font-bold text-muted-foreground">Brands Setup</span> 
                          <Badge variant="outline" className="font-black tabular-nums border-border/40">{metadata.brands}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm p-3 bg-background rounded-xl border border-border/20">
                          <span className="text-xs font-bold text-muted-foreground">Categories</span> 
                          <Badge variant="outline" className="font-black tabular-nums border-border/40">{metadata.categories}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm p-3 bg-background rounded-xl border border-border/20">
                          <span className="text-xs font-bold text-muted-foreground">Units</span> 
                          <Badge variant="outline" className="font-black tabular-nums border-border/40">{metadata.units}</Badge>
                      </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-border/30">
                      <Button className="w-full h-11 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl font-black text-[11px] uppercase tracking-widest border-none shadow-lg shadow-[#10b981]/20 transition-all active:scale-95 gap-2" onClick={startImport}>
                          <Save className="w-4 h-4" /> Start Import Now
                      </Button>
                      <Button variant="ghost" className="w-full h-11 mt-3 font-bold text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted/40 rounded-xl" onClick={() => setStep(1)}>
                          Cancel Process
                      </Button>
                  </div>
              </div>
            </div>
          )}

          {/* STEP 3: PROGRESS */}
          {step === 3 && (
              <div className="max-w-2xl mx-auto space-y-8 text-center animate-in zoom-in-95 duration-300 py-12">
                  <div className="space-y-4">
                      <h3 className="text-2xl font-black tracking-tight">{importStats.current === importStats.total ? "Import Complete" : "Importing Data..."}</h3>
                      <Progress value={(importStats.current / importStats.total) * 100} className="h-4 rounded-full bg-muted/50 overflow-hidden [&>div]:bg-[#10b981]" />
                      <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 tabular-nums">
                        {importStats.current} / {importStats.total} rows processed
                      </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#10b981]/10 p-6 rounded-2xl border border-[#10b981]/20">
                          <div className="text-4xl font-black text-[#10b981] tabular-nums">{importStats.success}</div>
                          <div className="text-[10px] font-black text-[#10b981] uppercase tracking-[0.2em] mt-2">Successfully Imported</div>
                      </div>
                      <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20">
                          <div className="text-4xl font-black text-red-500 tabular-nums">{importStats.failed}</div>
                          <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mt-2">Failed Records</div>
                      </div>
                  </div>

                  {logs.length > 0 && (
                      <div className="text-left border border-border/30 rounded-2xl overflow-hidden bg-background">
                          <div className="bg-muted/30 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">Error Log</div>
                          <ScrollArea className="h-40 p-3">
                              {logs.map((l, i) => (
                                  <div key={i} className="text-xs font-mono py-1.5 px-3 border-b border-border/20 last:border-0">
                                      <span className="font-bold text-red-500 mr-2">Row {l.row}:</span> 
                                      <span className="text-muted-foreground">{l.msg}</span>
                                  </div>
                              ))}
                          </ScrollArea>
                      </div>
                  )}
                  
                  {importStats.current === importStats.total && (
                       <Button onClick={() => setStep(1)} variant="outline" className="h-12 px-8 font-bold text-[11px] uppercase tracking-widest border-border/40 rounded-xl hover:bg-muted/30">
                          Upload Another File
                       </Button>
                  )}
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}