"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
    Filter, 
    Box,
    RefreshCcw
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { StockAdjustmentSheet } from "./StockAdjustmentSheet";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { getStockColumns } from "./stock-column";
import { Button } from "../ui/button";

const HeaderContent = () => (
    <div className="flex items-center gap-4">
      <div className="p-2 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20">
        <Box className="w-4.5 h-4.5 text-[#10b981]" />
      </div>
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          Stock Management
        </h1>
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] opacity-80">
          Monitor & Adjust Branch Inventory
        </p>
      </div>
    </div>
  );

const StockManagement = () => {
    const { data: session } = useSession();
    const { hasPermission } = usePermission();
    const [loading, setLoading] = useState(true);
    const [stocks, setStocks] = useState([]);
    const [branches, setBranches] = useState([]);
    const [error, setError] = useState(null);
    
    // Filters
    const [selectedBranch, setSelectedBranch] = useState("all");
    
    // Dialog States
    const [adjustmentOpen, setAdjustmentOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);

    const hasEditPermission = hasPermission(PERMISSIONS.STOCK_EDIT);

    const fetchData = useCallback(async () => {
        if (!session?.accessToken) return;
        setLoading(true);
        setError(null);
        try {
            // Note: Since ResourceManagementLayout manages client-side filtering via searchColumn="name", 
            // we'll fetch a wider dataset, or rely on its built-in filtering for now.
            // Using size=100 as a temporary compromise if API requires pagination, or you can implement 
            // full server-side state in the layout if needed.
            const branchQuery = selectedBranch !== "all" ? `&branch_id=${selectedBranch}` : "";
            const searchParams = new URLSearchParams({
                page: 1,
                size: 500, // Fetching enough to allow client-side layout filtering
            });

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stocks?${searchParams.toString()}${branchQuery}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (data.status === "success") {
                setStocks(data.data.data || []);
            } else {
                throw new Error("Failed to load stocks");
            }
        } catch (error) {
            console.error("Error fetching stocks:", error);
            setError("Failed to load stock data");
            toast.error("Failed to load stock data");
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken, selectedBranch]);

    const fetchBranches = async () => {
        if (!session?.accessToken) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const data = await res.json();
            if (data.status === "success") {
                setBranches(data.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchBranches();
    }, [fetchData]);

    const openAdjustment = useCallback((stock) => {
        setSelectedStock(stock);
        setAdjustmentOpen(true);
    }, []);

    const columns = useMemo(() => getStockColumns({ 
        onAdjust: openAdjustment, 
        hasEditPermission 
    }), [openAdjustment, hasEditPermission]);

    // Custom Branch Filter injected into Layout
    const branchFilter = (table) => (
        <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-[180px] h-9 bg-background/50 border-input">
                    <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <>
            <ResourceManagementLayout
                data={stocks}
                columns={columns}
                isLoading={loading}
                isError={!!error}
                errorMessage={error}
                onRetry={fetchData}
                headerTitle={<HeaderContent />}
                extraActions={
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchData} 
                        disabled={loading}
                        className="h-10 px-4 rounded-xl border-border/60 bg-muted/20 hover:bg-muted/40 font-bold uppercase text-[10px] tracking-widest transition-all gap-2"
                    >
                        <RefreshCcw className={`h-4 w-4 opacity-60 ${loading ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                }
                searchColumn="product" // Matches the accessorKey string for the global filter in standard config (we may need to ensure string search works on complex cells)
                searchPlaceholder="Search products by name..."
                filterComponents={branchFilter}
            />

            {adjustmentOpen && (
                <StockAdjustmentSheet 
                    open={adjustmentOpen} 
                    onOpenChange={setAdjustmentOpen} 
                    stock={selectedStock}
                    onSuccess={() => fetchData()}
                />
            )}
        </>
    );
};

export default StockManagement;
