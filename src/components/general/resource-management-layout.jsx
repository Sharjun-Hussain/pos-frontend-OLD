"use client";

import React, { useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DataTable } from "@/components/general/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoaderIcon, PlusCircle, Download, Search, X, LayoutGrid } from "lucide-react";

const ResourceTableToolbar = ({
  table,
  searchColumn,
  searchPlaceholder,
  bulkActionsComponent,
  filterComponents,
}) => {
  const numSelected = table.getFilteredSelectedRowModel().rows.length;
  const columnFilters = table.getState().columnFilters;
  const isFiltered = columnFilters.length > 0;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
      <div className="flex flex-1 items-center space-x-2 w-full">
        <div className="relative w-full max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#10b981] transition-colors" />
            <Input
              placeholder={searchPlaceholder || "Filter entries..."}
              value={table.getColumn(searchColumn)?.getFilterValue() ?? ""}
              onChange={(event) =>
                table.getColumn(searchColumn)?.setFilterValue(event.target.value)
              }
              className="h-11 pl-10 bg-white dark:bg-card border-slate-200 dark:border-border focus:bg-white dark:focus:bg-card transition-all shadow-sm rounded-xl font-semibold tracking-tight text-[13px] focus:ring-[#00b076]/20 text-slate-700 dark:text-foreground placeholder:font-medium placeholder:text-slate-400"
            />
        </div>
        {filterComponents && filterComponents(table)}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-9 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {numSelected > 0 && bulkActionsComponent}
    </div>
  );
};

export const ResourceManagementLayout = ({
  data,
  columns,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  headerTitle,
  headerDescription,
  addButtonLabel = "Add New",
  onAddClick,
  onExportClick,
  isAdding,
  statCardsComponent,
  bulkActionsComponent,
  searchColumn,
  searchPlaceholder,
  loadingSkeleton,
  filterComponents,
  extraActions,
  children,
}) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  if (isLoading) {
    return (
      loadingSkeleton || (
        <p className="p-8 text-center text-slate-500">Loading resources...</p>
      )
    );
  }

  if (isError) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <p className="text-red-500 font-medium">
          Unable to load data: {errorMessage}
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    );
  }

  const renderedBulkActions = bulkActionsComponent
    ? React.cloneElement(bulkActionsComponent, { table })
    : null;

  return (
    <div className="min-h-screen bg-background p-4 md:px-8 md:pt-4 md:pb-12">
      <div className="fixed inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.05),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.1),rgba(0,0,0,0))]"></div>
      </div>

      <div className="relative flex flex-col gap-6 max-w-[1400px] mx-auto transition-all duration-500">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {headerTitle}
          <div className="flex items-center space-x-3">
            {extraActions}
            {onExportClick && (
              <Button
                variant="outline"
                className=" px-6 rounded-full border-border/60 bg-white hover:bg-slate-50 font-bold uppercase text-[11px] tracking-widest transition-all gap-2 text-slate-700 shadow-sm h-10"
                onClick={onExportClick}
              >
                <Download className="h-4 w-4 opacity-60" />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
            )}
            {onAddClick && (
              <Button
                onClick={onAddClick}
                disabled={isAdding}
                className=" px-5 rounded-full bg-[#00b076] hover:bg-[#00b076]/90 text-white font-bold uppercase text-[11px] tracking-wider shadow-md shadow-[#00b076]/20 transition-all active:scale-95 border-none gap-2 h-10"
              >
                {isAdding ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-[18px] w-[18px]" />
                )}
                {addButtonLabel}
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {statCardsComponent && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {statCardsComponent}
          </div>
        )}

        {/* Main Content Card */}
        <Card className="border border-slate-100 dark:border-border/60 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-card p-0 gap-0">
          <CardContent className="p-0">
            <div className="p-4 border-b border-slate-100 dark:border-border/40">
              <ResourceTableToolbar
                table={table}
                searchColumn={searchColumn}
                searchPlaceholder={searchPlaceholder}
                bulkActionsComponent={renderedBulkActions}
                filterComponents={filterComponents}
              />
            </div>

            <div className="px-1 pb-1">
              <DataTable table={table} columns={columns} />
            </div>
          </CardContent>
        </Card>
        {children}
      </div>
    </div>
  );
};
