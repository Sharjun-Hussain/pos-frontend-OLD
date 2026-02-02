import React from "react";
import { format } from "date-fns";

export const PurchaseOrderTemplate = React.forwardRef(({ data }, ref) => {
  if (!data) return null;

  return (
    <>
      {/* 1. GLOBAL PRINT STYLES to remove default browser margins */}
      <style type="text/css" media="print">
        {`
          @page {
            size: auto;   /* auto is the initial value */
            margin: 0mm;  /* this affects the margin in the printer settings */
          }
          html, body {
            height: 100%;
            margin: 0 !important; 
            padding: 0 !important;
            overflow: hidden;
          }
        `}
      </style>

      {/* 2. MAIN CONTAINER */}
      {/* Removed fixed width/height. Added 'p-12' (approx 3rem/48px) to create the document margin visually */}
      <div 
        ref={ref} 
        className="bg-white text-black font-sans p-12 w-full h-full"
      >
        
        {/* --- HEADER --- */}
        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8">
          <div>
             <div className="flex items-center gap-2 mb-2">
              <div className="h-10 w-10 bg-black rounded-md flex items-center justify-center text-white font-bold">
                 POS
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-wider">Inzeedo</h1>
            </div>
             <p className="text-sm text-gray-600">123 Business Road, Colombo 03</p>
             <p className="text-sm text-gray-600">support@inzeedo.com | +94 77 123 4567</p>
          </div>
           <div className="text-right">
             <h2 className="text-3xl font-bold uppercase tracking-widest text-gray-900 mb-2">Purchase Order</h2>
             <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1 text-right">
                <span className="font-bold text-gray-600">PO #:</span> <span>{data.po_number || data.id}</span>
                <span className="font-bold text-gray-600">Date:</span> <span>{data.order_date ? format(new Date(data.order_date), "MMM dd, yyyy") : "N/A"}</span>
                <span className="font-bold text-gray-600">Expected:</span> <span>{data.expected_delivery_date ? format(new Date(data.expected_delivery_date), "MMM dd, yyyy") : "N/A"}</span>
             </div>
          </div>
        </div>

        {/* --- SUPPLIER & SHIPPING INFO --- */}
        <div className="grid grid-cols-2 gap-12 mb-10">
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider border-b pb-1">Vendor</h3>
            <div className="text-sm text-gray-800 leading-relaxed">
              <p className="font-bold text-base">{data.supplier.name}</p>
              <p>Attn: {data.supplier.contact}</p>
              <p>{data.supplier.address}</p>
              <p>{data.supplier.email}</p>
              <p>{data.supplier.phone}</p>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider border-b pb-1">Ship To</h3>
            <div className="text-sm text-gray-800 leading-relaxed">
              <p className="font-bold text-base">{data.branch?.name || "Inventory Warehouse"}</p>
              <p>{data.branch?.address || "Main Distribution Center"}</p>
              <p>Attn: Receiving Department</p>
            </div>
          </div>
        </div>

        {/* --- TABLE --- */}
        <table className="w-full text-left mb-8 border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider border-b-2 border-gray-300">
              <th className="py-3 px-2">#</th>
              <th className="py-3 px-2">Item Description</th>
              <th className="py-3 px-2 text-right">Qty</th>
              <th className="py-3 px-2 text-right">Unit Price</th>
              <th className="py-3 px-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {(data.items || []).map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3 px-2 text-gray-500">{index + 1}</td>
                <td className="py-3 px-2">
                  <span className="font-bold block text-gray-900">{item.product?.name || "Unknown Item"}</span>
                  <span className="text-xs text-gray-500">
                     SKU: {item.variant?.sku || item.product?.code || "N/A"} {item.variant?.barcode && `| Barcode: ${item.variant.barcode}`}
                  </span>
                </td>
                <td className="py-3 px-2 text-right">{item.quantity}</td>
                <td className="py-3 px-2 text-right">LKR {Number(item.unit_cost).toFixed(2)}</td>
                <td className="py-3 px-2 text-right font-bold">LKR {Number(item.total_amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* --- TOTALS --- */}
        <div className="flex justify-end mb-12">
          <div className="w-1/2 md:w-1/3 space-y-2 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>LKR {Number(data.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1">
                  <span className="text-gray-600">Tax / VAT:</span>
                  <span>LKR 0.00</span>
              </div>
               <div className="flex justify-between border-t-2 border-gray-800 pt-2 mt-2">
                  <span className="text-xl font-bold">Total:</span>
                  <span className="text-xl font-bold">LKR {Number(data.total_amount).toFixed(2)}</span>
              </div>
          </div>
        </div>

        {/* --- NOTES & FOOTER --- */}
        <div className="grid grid-cols-2 gap-10">
            <div>
              <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Terms & Notes</h4>
              <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded border">
                  {data.notes || "Standard payment terms apply. Please include PO number on all invoices."}
              </p>
            </div>
            <div>
               <div className="mt-8 border-t border-gray-400 pt-2 text-center text-xs text-gray-500">Authorized Signature</div>
            </div>
        </div>

      </div>
    </>
  );
});

PurchaseOrderTemplate.displayName = "PurchaseOrderTemplate";