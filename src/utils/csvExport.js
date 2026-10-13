// Quote every cell and neutralize spreadsheet formula text.
export const csvCell = (value) => {
  let text = value == null ? '' : String(value);
  if (typeof value !== 'number' && /^[\s\u0000-\u001f]*[=+@-]/u.test(text)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
};
export const csvRows = rows => rows.map(row => row.map(csvCell).join(',')).join('\r\n');
export const downloadCSV = (rows, filename = 'export.csv') => {
  const url = URL.createObjectURL(new Blob([csvRows(rows)], {type: 'text/csv;charset=utf-8;'}));
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data?.length) return;
  const headers = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));
  downloadCSV([headers, ...data.map(row => headers.map(header => row[header]))], filename);
};
