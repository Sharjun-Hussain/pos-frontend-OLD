"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { 
    RefreshCcw, 
    ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import StockTransferCreate from "./StockTransferCreate";
import StockTransferDetails from "./StockTransferDetails";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { getTransferColumns } from "./transfer-column";

const HeaderContent = () => (
    <div className="flex items-center gap-4">
      <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
        <ArrowRightLeft className="w-4.5 h-4.5 text-indigo-500" />
      </div>
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          Stock Transfers
        </h1>
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] opacity-80">
          Movement of inventory between business branches.
        </p>
      </div>
    </div>
);

const StockTransferList = () => {
    const { data: session } = useSession();
    const { hasPermission } = usePermission();
    const [loading, setLoading] = useState(true);
    const [transfers, setTransfers] = useState([]);
    const [error, setError] = useState(null);
    
    // Dialog States
    const [createOpen, setCreateOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedTransferId, setSelectedTransferId] = useState(null);

    const fetchData = useCallback(async () => {
        if (!session?.accessToken) return;
        setLoading(true);
        setError(null);
        try {
            // Fetching a large page limit to let ResourceManagementLayout's internal table handle filtering cleanly.
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stocks/transfers?page=1&size=500`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (data.status === "success") {
                setTransfers(data.data.data || []);
            } else {
                throw new Error("Failed to load transfer history");
            }
        } catch (error) {
            console.error("Error fetching transfers:", error);
            setError("Failed to load transfer history");
            toast.error("Failed to load transfer history");
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken]);

    const openDetails = useCallback((id) => {
        setSelectedTransferId(id);
        setDetailsOpen(true);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const columns = useMemo(() => getTransferColumns({ onOpenDetails: openDetails }), [openDetails]);

    const canCreate = hasPermission(PERMISSIONS.STOCK_EDIT);

    return (
        <>
            <ResourceManagementLayout
                data={transfers}
                columns={columns}
                isLoading={loading}
                isError={!!error}
                errorMessage={error}
                onRetry={fetchData}
                headerTitle={<HeaderContent />}
                addButtonLabel="New Transfer"
                onAddClick={canCreate ? () => setCreateOpen(true) : undefined}
                extraActions={
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchData} 
                        disabled={loading}
                        className="h-12 px-6 rounded-xl border-border/60 bg-muted/20 hover:bg-muted/40 font-bold uppercase text-[10px] tracking-widest transition-all gap-2"
                    >
                        <RefreshCcw className={cn("h-4 w-4 opacity-60", loading && "animate-spin")} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                }
                searchColumn="transfer_number"
                searchPlaceholder="Search transfer numbers..."
            />

            {createOpen && (
                <StockTransferCreate 
                    open={createOpen} 
                    onOpenChange={setCreateOpen}
                    onSuccess={() => fetchData()}
                />
            )}

            {detailsOpen && (
                <StockTransferDetails 
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                    transferId={selectedTransferId}
                />
            )}
        </>
    );
};

export default StockTransferList;
