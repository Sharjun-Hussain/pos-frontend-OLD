"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const ReceiptTemplate = forwardRef(({ sale, settings, business, branch }, ref) => {
  if (!sale) return null;

  const {
    paperWidth = "80mm",
    fontSize = "medium",
    showLogo = true,
    showHeader = true,
    showFooter = true,
    headerText = "",
    footerText = "",
    showTax = true,
    showDiscount = true,
    showSeller = true,
    showCustomer = true,
  } = settings || {};

  const paperWidthClass = paperWidth === "58mm" ? "w-[58mm]" : paperWidth === "80mm" ? "w-[80mm]" : "w-[210mm]";
  const fontSizeClass = fontSize === "small" ? "text-[10px]" : fontSize === "large" ? "text-sm" : "text-xs";

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith("http")) return logoPath;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "");
    return `${baseUrl}/${logoPath}`;
  };

  return (
    <div 
        ref={ref} 
        className={cn(
            "bg-white text-black p-4 font-mono print:p-0 mx-auto",
            paperWidthClass,
            fontSizeClass
        )}
    >
      {/* Header */}
      <div className="text-center space-y-1 mb-4">
        {showLogo && business?.logo && (
          <img 
            src={getLogoUrl(business.logo)} 
            alt="Business Logo" 
            className="w-16 h-16 mx-auto mb-2 object-contain"
          />
        )}
        <h1 className="text-lg font-black uppercase tracking-tight">{business?.name || "EMI-POS"}</h1>
        <div className="leading-tight opacity-80">
          <p>{business?.address || branch?.address}</p>
          <p>Tel: {business?.phone || branch?.phone}</p>
          {business?.tax_id && <p>VAT: {business.tax_id}</p>}
        </div>
        {showHeader && headerText && (
          <p className="mt-2 font-bold border-t border-black pt-1">{headerText}</p>
        )}
      </div>

      <div className="border-y border-dashed border-black py-2 my-2 space-y-0.5">
        <div className="flex justify-between">
          <span>INVOICE:</span>
          <span className="font-bold">{sale.invoice_number || "Draft"}</span>
        </div>
        {(settings.showDateTime ?? true) && (
            <div className="flex justify-between">
            <span>DATE:</span>
            <span>{sale.created_at ? format(new Date(sale.created_at), "yyyy-MM-dd HH:mm") : format(new Date(), "yyyy-MM-dd HH:mm")}</span>
            </div>
        )}
        {(settings.showSalesType ?? true) && (
             <div className="text-center font-bold uppercase tracking-widest text-[10px] my-1 border-b border-dashed border-black/30 pb-0.5">
                {sale.is_wholesale ? "WHOLESALE" : "RETAIL"} SALE
             </div>
        )}
        {showCustomer && sale.customer && (
            <div className="flex justify-between">
                <span>CUST:</span>
                <span>{sale.customer.name}</span>
            </div>
        )}
        {showSeller && sale.sellers && sale.sellers.length > 0 && (
            <div className="flex justify-between">
                <span>SELLER:</span>
                <span>{sale.sellers.map(s => s.name).join(", ")}</span>
            </div>
        )}
      </div>

      {/* Items Table */}
      <table className="w-full my-4 border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">ITEM (QTY)</th>
            <th className="text-right py-1">PRICE</th>
            {showDiscount && <th className="text-right py-1">DISC</th>}
            <th className="text-right py-1">TOTAL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dashed divide-black/20">
          {sale.items?.map((item, idx) => (
            <tr key={idx} className="align-top">
              <td className="py-2 pr-2">
                <div className="font-bold leading-tight">
                    {item.product_variant?.product?.name || item.product?.name || "Item"}
                    <span className="font-normal opacity-70 ml-1 whitespace-nowrap">
                        (x{parseFloat(item.quantity)})
                    </span>
                </div>
                {item.product_variant?.name && <div className="text-[10px] opacity-70 italic">{item.product_variant.name}</div>}
              </td>
              <td className="text-right py-2 whitespace-nowrap">{parseFloat(item.unit_price).toLocaleString()}</td>
              {showDiscount && (
                <td className="text-right py-2 text-[10px] whitespace-nowrap">
                    {(item.discount || item.discount_percentage) ? (
                        <span>
                            {item.discount || item.discount_percentage}%
                        </span>
                    ) : "-"}
                </td>
              )}
              <td className="text-right py-2 font-bold whitespace-nowrap">{parseFloat(item.total_amount).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="border-t border-black pt-2 space-y-1">
        <div className="flex justify-between">
          <span>SUB TOTAL:</span>
          <span>{parseFloat(sale.total_amount).toLocaleString()}</span>
        </div>
        {showDiscount && parseFloat(sale.discount_amount) > 0 && (
          <div className="flex justify-between text-[10px] text-green-700 italic border-b border-dashed border-black/20 pb-1 mb-1">
            <span>Your total discount is:</span>
            <span>{parseFloat(sale.discount_amount).toLocaleString()}</span>
          </div>
        )}
        {showTax && parseFloat(sale.tax_amount) > 0 && (
          <div className="flex justify-between">
            <span>TAX:</span>
            <span>{parseFloat(sale.tax_amount).toLocaleString()}</span>
          </div>
        )}
        {parseFloat(sale.adjustment) !== 0 && (
          <div className="flex justify-between">
            <span>ADJUSTMENT:</span>
            <span>{parseFloat(sale.adjustment).toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-black border-t-2 border-black pt-1 mt-1">
          <span>GRAND TOTAL:</span>
          <span>{parseFloat(sale.payable_amount || sale.net_total).toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-dashed border-black pt-2 space-y-1">
        <div className="flex justify-between">
          <span className="uppercase">{sale.payment_method || "CASH"} PAID:</span>
          <span>{parseFloat(sale.paid_amount || sale.payable_amount).toLocaleString()}</span>
        </div>
        {parseFloat(sale.paid_amount) > parseFloat(sale.payable_amount) && (
            <div className="flex justify-between font-bold">
                <span>CHANGE:</span>
                <span>{(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount)).toLocaleString()}</span>
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center space-y-3">
        {showFooter && footerText && (
          <div className="whitespace-pre-wrap leading-relaxed">{footerText}</div>
        )}
        <div className="pt-4 opacity-40">
           <p className="font-black text-[9px] tracking-[0.2em]">POWERED BY EMI-POS</p>
           <p className="text-[8px]">{new Date().getFullYear()} © INZEEDO PVT LTD</p>
        </div>
      </div>
    </div>
  );
});

ReceiptTemplate.displayName = "ReceiptTemplate";
