"use client";

import { type ReactNode, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Download,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

interface FilterConfig {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  loading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  onRowHover?: (row: T) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  pagination?: boolean;
  /** When true, toolbar is portaled into the sticky PageHeader instead of inline */
  stickyToolbar?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  emptyState,
  onRowClick,
  onRowHover,
  searchPlaceholder = "Search...",
  pagination = true,
  stickyToolbar = false,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
  });

  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const rows = table.getRowModel().rows;
      if (!rows.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedRowIndex((prev) => Math.min(prev + 1, rows.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedRowIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && focusedRowIndex >= 0 && onRowClick) {
        e.preventDefault();
        onRowClick(rows[focusedRowIndex].original);
      }
    },
    [table, focusedRowIndex, onRowClick]
  );

  const exportToCsv = useCallback(() => {
    const headers = table
      .getVisibleFlatColumns()
      .map((col) => col.id)
      .join(",");
    const rows = table.getFilteredRowModel().rows.map((row) =>
      row
        .getVisibleCells()
        .map((cell) => {
          const val = cell.getValue();
          const str = String(val ?? "");
          return str.includes(",") ? `"${str}"` : str;
        })
        .join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [table]);

  const searchElement = (
    <div className="relative max-w-sm flex-1">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={searchPlaceholder}
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="pl-9 h-9"
      />
    </div>
  );

  const actionsElement = (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Columns3 className="mr-2 h-4 w-4" />
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter((col) => col.getCanHide())
            .map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={col.getIsVisible()}
                onCheckedChange={(value) => col.toggleVisibility(!!value)}
                className="capitalize"
              >
                {col.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" size="sm" onClick={exportToCsv}>
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
    </>
  );

  const portalSearchEl = useUiStore((s) => s.portalSearchEl);
  const portalActionsEl = useUiStore((s) => s.portalActionsEl);
  const portalSearch = stickyToolbar && portalSearchEl;
  const portalActions = stickyToolbar && portalActionsEl;

  return (
    <div className="space-y-4">
      {/* Portal toolbar into sticky PageHeader */}
      {portalSearch && createPortal(searchElement, portalSearch)}
      {portalActions && createPortal(actionsElement, portalActions)}

      {/* Inline toolbar when not portaled */}
      {!stickyToolbar && (
        <div className="flex items-center justify-between gap-4">
          {searchElement}
          <div className="flex items-center gap-2">
            {actionsElement}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-auto" role="region" aria-label="Data table">
        <table className="w-full" onKeyDown={handleTableKeyDown}>
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody ref={tbodyRef}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/30",
                    onRowClick && "cursor-pointer",
                    focusedRowIndex === rowIndex && "bg-muted/50 outline-none ring-1 ring-primary"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                  onMouseEnter={() => onRowHover?.(row.original)}
                  onFocus={() => setFocusedRowIndex(rowIndex)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  {emptyState ?? (
                    <span className="text-sm text-muted-foreground">
                      No results.
                    </span>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} row(s)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
