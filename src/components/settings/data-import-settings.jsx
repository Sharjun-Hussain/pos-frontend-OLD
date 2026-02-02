"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import {
  UploadCloud, FileSpreadsheet, ArrowRight, Save, 
  CheckCircle2, AlertTriangle, XCircle, Database, Download, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";

// --- Constants ---
const SYSTEM_FIELDS = [
  { id: "ignore", label: "Skip this column", required: false },
  { id: "name", label: "Product Name", required: true },
  { id: "code", label: "Product Code", required: true },
  { id: "brand", label: "Brand Name", required: true },
  { id: "main_category", label: "Category", required: true },
  { id: "selling_price", label: "Selling Price", required: true },
  { id: "cost_price", label: "Cost Price", required: false },
  { id: "unit", label: "Unit", required: false }, // Added Unit to mapping options
  { id: "stock_qty", label: "Opening Stock", required: false },
];

export function DataImportSettings() {
  const { data: session } = useSession();
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Import
  const [fileData, setFileData] = useState({ data: [], headers: [], fileName: "" });
  const [mapping, setMapping] = useState({});
  const [importStats, setImportStats] = useState({ total: 0, current: 0, success: 0, failed: 0 });
  const [logs, setLogs] = useState([]);

  // Mock Metadata (replace with real fetch if needed, but not critical for this UI)
  const metadata = { brands: 12, categories: 8, units: 5 };

  // 1. File Upload
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
        
        // Auto-map
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

  // 2. Import Logic
  const startImport = async () => {
    setStep(3);
    setImportStats({ total: fileData.data.length, current: 0, success: 0, failed: 0 });
    setLogs([]);

    // Format products based on mapping
    const productsToImport = fileData.data.map(row => {
      const product = {};
      Object.keys(mapping).forEach(header => {
        const systemField = mapping[header];
        if (systemField !== 'ignore') {
          product[systemField] = row[header];
        }
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

      if (!response.ok) {
          throw new Error(result.message || "Import failed");
      }

      const { success, failed, logs: importLogs } = result.data;
      
      setImportStats({
        total: productsToImport.length,
        current: productsToImport.length,
        success,
        failed
      });
      setLogs(importLogs || []);
      
      if (failed === 0) {
        toast.success(`Successfully imported ${success} products`);
      } else {
        toast.warning(`Imported ${success} products with ${failed} failures`);
      }
    } catch (error) {
      console.error("Import failed:", error);
      toast.error(error.message || "Server error during import");
      setStep(2); // Go back to mapping on fatal error
    }
  };

  // 3. Export Logic
  const handleExport = async () => {
    try {
      toast.loading("Preparing export data...");
      const token = session?.user?.accessToken || session?.accessToken;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/export`, {
          headers: {
              Authorization: `Bearer ${token}`,
          }
      });

      const result = await response.json();
      
      if (!response.ok) {
          throw new Error(result.message || "Export failed");
      }

      const data = result.data;
      
      const csv = Papa.unparse(data);
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

  // --- Components ---
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
            step === s ? "bg-blue-600 text-white" : step > s ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400"
          )}>
            {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
          </div>
          {s !== 3 && <div className={cn("w-12 h-0.5 mx-2", step > s ? "bg-green-500" : "bg-slate-100")} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Bulk Data Import</h2>
          <p className="text-sm text-slate-500">Upload CSV to create or update products.</p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm min-h-[500px]">
        <CardContent className="pt-6">
        <StepIndicator />

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-12 text-center hover:bg-slate-50 transition-colors">
             <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UploadCloud className="w-8 h-8" />
             </div>
             <h3 className="text-lg font-semibold text-slate-900">Upload CSV File</h3>
             <p className="text-sm text-slate-500 mt-2 mb-6 max-w-sm mx-auto">
               Drag & drop your file here. Maximum 10MB.
             </p>
             <div className="relative inline-block">
               <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
               <Button>Browse Files</Button>
             </div>
             
             <div className="mt-12 pt-8 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-900 mb-4">Backup Your Data</h4>
                <Button variant="outline" onClick={handleExport} className="gap-2">
                  <Download className="w-4 h-4" /> Export Current Inventory
                </Button>
                <p className="text-xs text-slate-400 mt-2">Download your product list as a CSV file for backup or editing.</p>
             </div>
          </div>
        )}

        {/* STEP 2: MAPPING */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" /> 
                Map CSV Columns to System Fields
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">CSV Header</th>
                      <th className="px-4 py-3 text-center w-10"></th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500">System Field</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {fileData.headers.map((header) => (
                      <tr key={header} className="bg-white">
                        <td className="px-4 py-3 font-medium text-slate-700">{header}</td>
                        <td className="px-4 py-3 text-center"><ArrowRight className="w-4 h-4 text-slate-300 mx-auto" /></td>
                        <td className="px-4 py-2">
                          <Select 
                            value={mapping[header]} 
                            onValueChange={(v) => setMapping(p => ({...p, [header]: v}))}
                          >
                            <SelectTrigger className="h-9 border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SYSTEM_FIELDS.map(f => (
                                    <SelectItem key={f.id} value={f.id}>{f.label} {f.required && "*"}</SelectItem>
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
            
            <div className="bg-slate-50 rounded-xl p-6 h-fit border border-slate-100">
                <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Database Status
                </h4>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Brands</span> <Badge variant="secondary">{metadata.brands}</Badge></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Categories</span> <Badge variant="secondary">{metadata.categories}</Badge></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Units</span> <Badge variant="secondary">{metadata.units}</Badge></div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-200">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={startImport}>
                        <Save className="w-4 h-4 mr-2" /> Start Import
                    </Button>
                    <Button variant="ghost" className="w-full mt-2 text-slate-500" onClick={() => setStep(1)}>Cancel</Button>
                </div>
            </div>
          </div>
        )}

        {/* STEP 3: PROGRESS */}
        {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-8 text-center animate-in zoom-in-95 duration-300">
                <div className="space-y-2">
                    <h3 className="text-xl font-bold">{importStats.current === importStats.total ? "Import Complete" : "Importing Data..."}</h3>
                    <Progress value={(importStats.current / importStats.total) * 100} className="h-3" />
                    <p className="text-xs text-slate-400">{importStats.current} / {importStats.total} rows processed</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <div className="text-2xl font-bold text-green-600">{importStats.success}</div>
                        <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">Success</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <div className="text-2xl font-bold text-red-600">{importStats.failed}</div>
                        <div className="text-xs font-semibold text-red-700 uppercase tracking-wide">Failed</div>
                    </div>
                </div>

                {logs.length > 0 && (
                    <div className="text-left border rounded-lg overflow-hidden">
                        <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500 border-b">Error Log</div>
                        <ScrollArea className="h-32 bg-white p-2">
                            {logs.map((l, i) => (
                                <div key={i} className="text-xs text-red-600 font-mono py-1 px-2 border-b border-slate-50 last:border-0">
                                    Row {l.row}: {l.msg}
                                </div>
                            ))}
                        </ScrollArea>
                    </div>
                )}
                
                {importStats.current === importStats.total && (
                     <Button onClick={() => setStep(1)} variant="outline">Import Another File</Button>
                )}
            </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}