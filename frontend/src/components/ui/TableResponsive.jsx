import React from 'react';
import { Card } from './Card';
import { ChevronRight } from 'lucide-react';

/**
 * TableResponsive Component
 * Renders a standard table on desktop (>= md) and a stacked card list on mobile (< md).
 * 
 * @param {Array} columns - Array of column definitions: { key, header, render(row), className }
 * @param {Array} data - Array of data objects
 * @param {Function} onRowClick - Optional callback when a row/card is clicked
 * @param {String} emptyMessage - Message to show when data is empty
 * @param {Function} renderMobileItem - Optional function to render a custom mobile item. Receives (row) and should return ReactNode.
 */
export function TableResponsive({ columns, data, onRowClick, emptyMessage = "No data available", renderMobileItem }) {

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-text-muted bg-surface/50 rounded-2xl border border-dashed border-border">
                {emptyMessage}
            </div>
        );
    }

    return (
        <>
            {/* Desktop View (Table) */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                {columns.map((col, idx) => (
                                    <th
                                        key={col.key || idx}
                                        className={`px-6 py-4 font-semibold text-text-secondary ${col.className || ''}`}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.map((row, rowIdx) => (
                                <tr
                                    key={row._id || row.id || rowIdx}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`
                    group transition-colors hover:bg-surface-highlight/50
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td
                                            key={`${rowIdx}-${colIdx}`}
                                            className={`px-6 py-4 text-text ${col.className || ''}`}
                                        >
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View (Cards) */}
            <div className="md:hidden space-y-4">
                {data.map((row, rowIdx) => (
                    renderMobileItem ? (
                        <div key={row._id || row.id || rowIdx}>
                            {renderMobileItem(row)}
                        </div>
                    ) : (
                        <Card
                            key={row._id || row.id || rowIdx}
                            className={`
                p-4 border-border shadow-sm active:scale-[0.99] transition-transform
                ${onRowClick ? 'cursor-pointer active:bg-surface-highlight' : ''}
              `}
                            onClick={() => onRowClick && onRowClick(row)}
                        >
                            <div className="space-y-3">
                                {columns.map((col, colIdx) => {
                                    const content = col.render ? col.render(row) : row[col.key];

                                    if (colIdx === 0) {
                                        return (
                                            <div key={colIdx} className="font-semibold text-base text-text flex justify-between items-start">
                                                <span>{content}</span>
                                                {onRowClick && <ChevronRight size={16} className="text-text-muted mt-1" />}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={colIdx} className="flex justify-between items-center text-xs">
                                            <span className="text-text-secondary font-medium">{col.header}</span>
                                            <span className="text-text text-sm text-right">{content}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )
                ))}
            </div>
        </>
    );
}
