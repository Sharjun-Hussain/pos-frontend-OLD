import StockManagement from "@/components/inventory/StockManagement";

export const metadata = {
  title: "Stock Management | EMI POS",
  description: "Manage inventory levels across branches.",
};

export default function StockPage() {
  return (
    <div className="p-6">
      <StockManagement />
    </div>
  );
}
