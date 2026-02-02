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
import { LoaderIcon, PlusCircle, Download, Search, X } from "lucide-react";

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input
            placeholder={searchPlaceholder || "Search..."}
            value={table.getColumn(searchColumn)?.getFilterValue() ?? ""}
            onChange={(event) =>
              table.getColumn(searchColumn)?.setFilterValue(event.target.value)
            }
            className="pl-10 bg-white/50 border-slate-200 focus:bg-white transition-all shadow-sm"
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
    <>
      {/* --- UI/UX Scientist Layer: Global Backgrounds --- */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-slate-50 bg-size-[16px_16px] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-400/10 blur-[100px] rounded-full mix-blend-multiply"></div>
      </div>

      <div className="relative flex flex-col space-y-4 p-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              {headerTitle}
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl font-medium">
              {headerDescription}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {extraActions}
            {onExportClick && (
              <Button
                variant="outline"
                className="gap-2 bg-white hover:bg-slate-50 border-slate-200 shadow-sm"
                onClick={onExportClick}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}
            {onAddClick && (
              <Button
                onClick={onAddClick}
                disabled={isAdding}
                className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
              >
                {isAdding ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
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

        {/* Main Content Card - Glassmorphism applied here */}
        <Card className=" bg-white/80  overflow-hidden">
          <CardContent className="p-4">
            <ResourceTableToolbar
              table={table}
              searchColumn={searchColumn}
              searchPlaceholder={searchPlaceholder}
              bulkActionsComponent={renderedBulkActions}
              filterComponents={filterComponents}
            />

            <DataTable table={table} columns={columns} />
          </CardContent>
        </Card>
        {children}
      </div>
    </>
  );
};
