import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface Column<T> {
  key: string
  header: React.ReactNode
  accessor?: keyof T | ((row: T) => React.ReactNode)
  render?: (row: T, index: number) => React.ReactNode
  width?: string | number
  align?: 'left' | 'center' | 'right'
  className?: string
  headerClassName?: string
}

export interface DataTablePagination {
  currentPage: number
  total: number
  perPage: number
  lastPage?: number
  onPageChange: (page: number) => void
  itemName?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  loadingMessage?: string
  emptyMessage?: React.ReactNode
  selectable?: boolean
  selectedIds?: (string | number)[]
  onSelectRow?: (id: string | number, row: T) => void
  onSelectAll?: (selected: boolean) => void
  getRowId?: (row: T) => string | number
  onRowClick?: (row: T, e: React.MouseEvent) => void
  rowClassName?: string | ((row: T, index: number) => string)
  pagination?: DataTablePagination
  className?: string
  tableClassName?: string
}

export function getPageNumbers(currentPage: number, lastPage: number): (number | string)[] {
  if (lastPage <= 1) return [1]
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, i) => i + 1)
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', lastPage]
  }
  if (currentPage >= lastPage - 3) {
    return [1, '...', lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage]
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', lastPage]
}

export default function DataTable<T>({
  data,
  columns,
  loading = false,
  loadingMessage = 'Loading records from server...',
  emptyMessage,
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  getRowId = (row: any) => row.id,
  onRowClick,
  rowClassName,
  pagination,
  className = '',
  tableClassName = '',
}: DataTableProps<T>) {
  const isAllSelected = data.length > 0 && selectedIds.length === data.length
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < data.length
  const totalCols = columns.length + (selectable ? 1 : 0)

  const itemName = pagination?.itemName || 'records'
  const currentPage = pagination?.currentPage || 1
  const perPage = pagination?.perPage || 15
  const total = pagination?.total ?? data.length
  const lastPage = pagination?.lastPage || Math.max(1, Math.ceil(total / perPage))

  const defaultEmptyMsg = `No ${itemName} found matching your criteria.`

  return (
    <div className={`table-card ${className}`}>
      <div className="table-responsive">
        <table className={`data-table ${tableClassName}`}>
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: 44, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isSomeSelected
                      }
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    width: col.width,
                    textAlign: col.align || 'left',
                  }}
                  className={col.headerClassName || ''}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={totalCols} className="table-loading-cell">
                  <div className="table-status-container">
                    <div className="table-loading-spinner" />
                    <span>{loadingMessage}</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="table-empty-cell">
                  <div className="table-empty-message">
                    {emptyMessage || defaultEmptyMsg}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowId = getRowId(row)
                const isSelected = selectedIds.includes(rowId)
                const customRowClass =
                  typeof rowClassName === 'function'
                    ? rowClassName(row, index)
                    : rowClassName || ''

                return (
                  <tr
                    key={String(rowId ?? index)}
                    className={`table-row ${isSelected ? 'row-selected' : ''} ${
                      onRowClick ? 'clickable-row' : ''
                    } ${customRowClass}`}
                    onClick={(e) => onRowClick?.(row, e)}
                  >
                    {selectable && (
                      <td
                        style={{ width: 44, textAlign: 'center' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="custom-checkbox"
                          checked={isSelected}
                          onChange={() => onSelectRow?.(rowId, row)}
                          aria-label={`Select row ${rowId}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      let cellContent: React.ReactNode = null
                      if (col.render) {
                        cellContent = col.render(row, index)
                      } else if (typeof col.accessor === 'function') {
                        cellContent = col.accessor(row)
                      } else if (col.accessor) {
                        cellContent = (row as any)[col.accessor] as React.ReactNode
                      } else {
                        cellContent = (row as any)[col.key] as React.ReactNode
                      }

                      return (
                        <td
                          key={col.key}
                          style={{
                            width: col.width,
                            textAlign: col.align || 'left',
                          }}
                          className={col.className || ''}
                        >
                          {cellContent}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Global Pagination Footer */}
      {pagination && (
        <div className="table-pagination-footer">
          <div className="pagination-info-text text-muted text-xs">
            {total === 0
              ? `Showing 0 ${itemName}`
              : `Showing ${(currentPage - 1) * perPage + 1} to ${Math.min(
                  currentPage * perPage,
                  total
                )} of ${total} ${itemName}`}
          </div>

          {lastPage > 1 && (
            <div className="pagination-pages-list">
              <button
                type="button"
                className="pagination-page-btn"
                disabled={currentPage <= 1 || loading}
                onClick={() => pagination.onPageChange(Math.max(1, currentPage - 1))}
                title="Previous page"
              >
                <ChevronLeft size={14} />
              </button>

              {getPageNumbers(currentPage, lastPage).map((item, idx) => {
                if (item === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                      ...
                    </span>
                  )
                }
                const pageNum = Number(item)
                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={`pagination-page-btn ${
                      currentPage === pageNum ? 'active' : ''
                    }`}
                    disabled={loading}
                    onClick={() => pagination.onPageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button
                type="button"
                className="pagination-page-btn"
                disabled={currentPage >= lastPage || loading}
                onClick={() => pagination.onPageChange(Math.min(lastPage, currentPage + 1))}
                title="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
