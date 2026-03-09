"use client";

import { flexRender } from "@tanstack/react-table";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Pagination Sub-Component ---
const DataTablePagination = ({ table }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 gap-4 bg-card/10 backdrop-blur-sm border-t border-border rounded-b-xl">
      <div className="flex-1 text-[11px] text-muted-foreground font-semibold">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected
      </div>
      <div className="flex items-center space-x-6 lg:space-x-10">
        <div className="flex items-center space-x-3">
          <p className="text-[11px] font-semibold text-muted-foreground">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-9 w-[80px] bg-background border-border focus:ring-sidebar-accent/50 rounded-xl transition-all font-bold">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top" className="rounded-xl border-border bg-card shadow-2xl">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`} className="rounded-lg focus:bg-sidebar-accent">
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-[120px] items-center justify-center text-[11px] font-semibold text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-9 w-9 p-0 lg:flex border-border bg-background hover:bg-sidebar-accent/50 text-foreground rounded-xl transition-all"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-9 w-9 p-0 border-border bg-background hover:bg-sidebar-accent/50 text-foreground rounded-xl transition-all"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-9 w-9 p-0 border-border bg-background hover:bg-sidebar-accent/50 text-foreground rounded-xl transition-all"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-9 w-9 p-0 lg:flex border-border bg-background hover:bg-sidebar-accent/50 text-foreground rounded-xl transition-all"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Main Data Table Component ---
export function DataTable({ table, columns }) {
  return (
    <div className="space-y-0">
      <div className="rounded-t-xl border-x border-t border-border overflow-hidden bg-background/50 transition-colors duration-500">
        <UITable>
          <TableHeader className="bg-sidebar-accent/20 backdrop-blur-md">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-b border-border/60 transition-colors group"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="h-12 py-3 text-foreground font-semibold text-xs tracking-tight transition-colors"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table?.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-sidebar-accent/15 data-[state=selected]:bg-[#10b981]/5 border-b border-border/30 last:border-0 transition-all duration-200 group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3.5 text-[13px] text-foreground/90 font-medium transition-colors"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs opacity-50"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </UITable>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
