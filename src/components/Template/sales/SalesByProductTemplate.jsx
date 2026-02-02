import React from "react";
import { format } from "date-fns";

export const SalesByProductPrintTemplate = React.forwardRef(({ data, filters, stats }, ref) => {
  return (
    <div style={{ display: "none" }}>
      <div ref={ref} className="p-8 font-sans text-slate-900 bg-white" style={{ width: "210mm", minHeight: "297mm" }}>
        
        {/* Global Print CSS */}
        <style type="text/css" media="print">
          {`
            @page { size: A4; margin: 0mm; }
            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
          `}
        </style>

        {/* --- HEADER --- */}
        <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
               {/* Placeholder Logo Block */}
               <div className="h-8 w-8 bg-slate-900 rounded flex items-center justify-center text-white font-bold text-xs">POS</div>
               <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">Inzeedo Corp</h1>
            </div>
            <h2 className="text-xl font-semibold text-slate-700">Sales by Product Report</h2>
            <p className="text-sm text-slate-500 mt-1">Generated from POS Admin System</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p><strong>Date Generated:</strong> {format(new Date(), "PPP p")}</p>
            <p><strong>Branch:</strong> {filters.store}</p>
            <p><strong>Category Filter:</strong> {filters.category}</p>
          </div>
        </div>

        {/* --- SUMMARY METRICS --- */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 border border-slate-200 rounded bg-slate-50">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Quantity</span>
            <div className="text-lg font-bold mt-1 text-slate-900">{(stats.totalSold || 0).toLocaleString()} Units</div>
          </div>
          <div className="p-4 border border-slate-200 rounded bg-slate-50">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Revenue</span>
            <div className="text-lg font-bold mt-1 text-slate-900">LKR {(stats.totalRevenue || 0).toLocaleString()}</div>
          </div>
          <div className="p-4 border border-slate-200 rounded bg-slate-50">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Profit</span>
            <div className="text-lg font-bold mt-1 text-emerald-700">LKR {(stats.totalProfit || 0).toLocaleString()}</div>
          </div>
          <div className="p-4 border border-slate-200 rounded bg-slate-50">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Top Mover</span>
            <div className="text-sm font-bold mt-2 truncate text-slate-900">{stats.topSellingItem?.name || "-"}</div>
          </div>
        </div>

        {/* --- DATA TABLE --- */}
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-xs uppercase">
              <th className="py-2 px-2 font-bold text-slate-600">Product Name</th>
              <th className="py-2 px-2 font-bold text-slate-600">SKU</th>
              <th className="py-2 px-2 font-bold text-slate-600 text-right">Qty Sold</th>
              <th className="py-2 px-2 font-bold text-slate-600 text-right">Unit Price (LKR)</th>
              <th className="py-2 px-2 font-bold text-slate-600 text-right">Revenue (LKR)</th>
              <th className="py-2 px-2 font-bold text-slate-600 text-right">Profit (LKR)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b border-slate-200 break-inside-avoid">
                <td className="py-2 px-2 font-medium">{item.name}</td>
                <td className="py-2 px-2 text-slate-500 text-xs">{item.sku}</td>
                <td className="py-2 px-2 text-right">{(item.sold || 0)}</td>
                <td className="py-2 px-2 text-right text-slate-600">{(item.price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td className="py-2 px-2 text-right font-medium">{(item.sales || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td className="py-2 px-2 text-right font-bold text-emerald-700">{(item.profit || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* --- FOOTER --- */}
        <div className="fixed bottom-10 left-10 right-10 pt-4 border-t border-slate-200 text-center text-xs text-slate-400 flex justify-between">
          <span>Printed by Administrator</span>
          <span>Confidential | Inzeedo POS</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
});

SalesByProductPrintTemplate.displayName = "SalesByProductPrintTemplate";