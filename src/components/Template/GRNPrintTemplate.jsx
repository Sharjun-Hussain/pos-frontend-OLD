import React from "react";
import { format } from "date-fns";

export const GRNPrintTemplate = React.forwardRef(({ data }, ref) => {
  if (!data) return null;

  const grandTotal = parseFloat(data.total_amount || 0);

  return (
    <>
      {/* ─── PRINT-ONLY GLOBAL STYLES ─── */}
      <style type="text/css" media="print">{`
        @page {
          size: A4 portrait;
          margin: 14mm 16mm 14mm 16mm;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
        }
        /* hide everything on the screen except this template */
        body > *:not(#grn-print-root) {
          display: none !important;
        }
      `}</style>

      {/* ─── DOCUMENT WRAPPER ─── */}
      <div
        id="grn-print-root"
        ref={ref}
        style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}
        className="bg-white text-black w-full text-sm"
      >
        {/* ════ HEADER ════ */}
        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-5 mb-6">
          {/* Left — Company branding */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="h-9 w-9 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "#059669" }}
              >
                POS
              </div>
              <span className="text-xl font-black uppercase tracking-widest text-gray-900">
                Inzeedo
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-snug">
              123 Business Road, Colombo 03
            </p>
            <p className="text-xs text-gray-500 leading-snug">
              support@inzeedo.com &nbsp;|&nbsp; +94 77 123 4567
            </p>
          </div>

          {/* Right — Document title & metadata */}
          <div className="text-right">
            <h2 className="text-2xl font-black uppercase tracking-widest text-gray-900 mb-2">
              Goods Receipt Note
            </h2>
            <div
              className="text-xs text-gray-700 leading-relaxed"
              style={{ display: "grid", gridTemplateColumns: "auto auto", columnGap: "12px", rowGap: "2px" }}
            >
              <span className="font-bold text-gray-500 text-right">GRN #:</span>
              <span className="font-bold">{data.grn_number}</span>

              <span className="font-bold text-gray-500 text-right">Date:</span>
              <span>
                {data.received_date
                  ? format(new Date(data.received_date), "MMM dd, yyyy")
                  : "N/A"}
              </span>

              {data.invoice_number && (
                <>
                  <span className="font-bold text-gray-500 text-right">Invoice #:</span>
                  <span>{data.invoice_number}</span>
                </>
              )}

              <span className="font-bold text-gray-500 text-right">Branch:</span>
              <span>{data.branch?.name || "—"}</span>

              <span className="font-bold text-gray-500 text-right">Status:</span>
              <span
                className="font-bold uppercase"
                style={{ color: "#059669" }}
              >
                {data.status || "Completed"}
              </span>
            </div>
          </div>
        </div>

        {/* ════ SUPPLIER & ORDER LINK ════ */}
        <div className="grid grid-cols-2 gap-10 mb-7">
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-widest border-b border-gray-200 pb-1 mb-2">
              Supplier
            </h3>
            <p className="font-bold text-sm text-gray-900">
              {data.supplier?.name || "—"}
            </p>
            <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
              {data.supplier?.contact_person && `Attn: ${data.supplier.contact_person}`}
            </p>
            <p className="text-xs text-gray-600">{data.supplier?.email}</p>
            <p className="text-xs text-gray-600">{data.supplier?.phone}</p>
            <p className="text-xs text-gray-600">{data.supplier?.address}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-widest border-b border-gray-200 pb-1 mb-2">
              Linked Purchase Order
            </h3>
            <p className="font-bold text-sm text-gray-900">
              {data.purchase_order?.po_number || "—"}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Received by:{" "}
              <span className="font-semibold">
                {data.received_by_user?.name || "Authorized Staff"}
              </span>
            </p>
            {data.remarks && (
              <p className="text-xs text-gray-600 mt-1 italic">
                Remarks: {data.remarks}
              </p>
            )}
          </div>
        </div>

        {/* ════ ITEMS TABLE ════ */}
        <table
          className="w-full text-left mb-6"
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr
              style={{ background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}
              className="text-xs uppercase tracking-wider text-gray-600 font-bold"
            >
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-3 text-center">Ordered</th>
              <th className="py-2.5 px-3 text-center">Received</th>
              <th className="py-2.5 px-3 text-center">Free</th>
              <th className="py-2.5 px-3 text-right">Unit Cost</th>
              <th className="py-2.5 px-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(data.items || []).map((item, idx) => {
              const lineTotal =
                parseFloat(item.total_amount || 0) ||
                parseFloat(item.unit_cost || 0) *
                  parseFloat(item.quantity_received || 0);
              return (
                <tr
                  key={item.id || idx}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    background: idx % 2 === 0 ? "#fff" : "#f9fafb",
                  }}
                >
                  <td className="py-2.5 px-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-gray-900 block">
                      {item.product?.name || "Unknown Item"}
                    </span>
                    {item.variant && (
                      <span className="text-xs text-gray-500">
                        Variant: {item.variant.name || item.variant.sku}
                      </span>
                    )}
                    {item.batch_number && (
                      <span className="text-xs text-gray-400 block">
                        Batch: {item.batch_number}
                      </span>
                    )}
                    {item.expiry_date && (
                      <span className="text-xs text-gray-400 block">
                        Exp:{" "}
                        {format(new Date(item.expiry_date), "MM/yyyy")}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center text-gray-700">
                    {item.ordered_qty || item.quantity_ordered || "—"}
                  </td>
                  <td
                    className="py-2.5 px-3 text-center font-bold"
                    style={{ color: "#059669" }}
                  >
                    {parseFloat(item.quantity_received || 0).toFixed(0)}
                  </td>
                  <td className="py-2.5 px-3 text-center text-gray-500">
                    {item.free_qty || 0}
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-700">
                    LKR {parseFloat(item.unit_cost || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                    LKR {lineTotal.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ════ TOTALS ════ */}
        <div className="flex justify-end mb-8">
          <div style={{ width: "260px" }}>
            <div
              className="flex justify-between py-1.5 text-xs"
              style={{ borderBottom: "1px solid #e5e7eb" }}
            >
              <span className="text-gray-500">Number of Items:</span>
              <span className="font-medium">{(data.items || []).length}</span>
            </div>
            <div
              className="flex justify-between py-1.5 text-xs"
              style={{ borderBottom: "1px solid #e5e7eb" }}
            >
              <span className="text-gray-500">Tax / VAT:</span>
              <span className="font-medium">LKR 0.00</span>
            </div>
            <div
              className="flex justify-between py-2 mt-1"
              style={{
                borderTop: "2px solid #111827",
              }}
            >
              <span className="text-base font-black text-gray-900">
                Grand Total:
              </span>
              <span className="text-base font-black" style={{ color: "#059669" }}>
                LKR {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ════ FOOTER — Signature & Notes ════ */}
        <div
          className="grid grid-cols-2 gap-10 pt-5"
          style={{ borderTop: "1px solid #d1d5db" }}
        >
          <div>
            <p className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-1">
              Notes / Remarks
            </p>
            <p className="text-xs text-gray-600 italic leading-relaxed">
              {data.remarks ||
                "Goods received as per purchase order. Stock updated in inventory system."}
            </p>
          </div>
          <div className="flex flex-col justify-between">
            <div />
            <div>
              <div
                className="border-t border-gray-400 pt-1.5 text-center text-xs text-gray-500"
                style={{ marginTop: "32px" }}
              >
                Authorized Signature
              </div>
              <div className="text-center text-xs text-gray-400 mt-0.5">
                {data.received_by_user?.name || "Store Manager"}
              </div>
            </div>
          </div>
        </div>

        {/* ════ DOC FOOTER ════ */}
        <div
          className="text-center text-xs text-gray-400 mt-6 pt-3"
          style={{ borderTop: "1px dashed #e5e7eb" }}
        >
          This GRN was generated electronically by Inzeedo POS &nbsp;·&nbsp;{" "}
          {format(new Date(), "dd MMM yyyy, HH:mm")} &nbsp;·&nbsp;{" "}
          {data.grn_number}
        </div>
      </div>
    </>
  );
});

GRNPrintTemplate.displayName = "GRNPrintTemplate";
