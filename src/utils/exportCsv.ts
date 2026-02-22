interface CsvColumn {
  key: string;
  header: string;
}

export function exportToCsv(filename: string, rows: Record<string, unknown>[], columns: CsvColumn[]) {
  const header = columns.map((c) => c.header).join(',');
  const csvRows = rows.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key] ?? '';
        const str = String(val);
        // Escape fields containing commas, quotes, or newlines
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',')
  );

  const csv = [header, ...csvRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
