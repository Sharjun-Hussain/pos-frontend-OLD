import StockTransferList from "@/components/inventory/StockTransferList";

export const metadata = {
  title: "Stock Transfers | EMI POS",
  description: "Move inventory between branches.",
};

export default function TransfersPage() {
  return (
    <div className="p-6">
      <StockTransferList />
    </div>
  );
}
