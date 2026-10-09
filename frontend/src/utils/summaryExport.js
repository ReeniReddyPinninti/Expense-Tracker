import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Quote cells containing commas/quotes/newlines. A leading = + - @ gets a
// apostrophe so Excel never treats shop names or notes as formulas.
function csvCell(value) {
  let s = String(value ?? '');
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadSummaryCsv(summary, monthLabel) {
  const rows = [];
  rows.push([`Expense Summary - ${monthLabel}`]);
  rows.push(['Total spent', summary.totalSpent.toFixed(2)]);
  rows.push(['Expenses', summary.expenseCount]);
  rows.push([]);

  for (const cat of summary.categories) {
    rows.push([cat.name]);
    rows.push(['Date', 'Shop', 'Amount', 'Notes']);
    for (const e of cat.expenses) {
      rows.push([e.date, e.shopName, e.amount.toFixed(2), e.notes]);
    }
    rows.push(['', `${cat.name} subtotal`, cat.total.toFixed(2)]);
    rows.push([]);
  }

  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
  // \ufeff (BOM) makes Excel read the file as UTF-8
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `expense-summary-${summary.month}.csv`);
}

export function downloadSummaryPdf(summary, monthLabel) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(58, 51, 53);
  doc.text('Expense Summary', 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text(monthLabel, 14, 25);
  doc.text(
    `Total spent: $${summary.totalSpent.toFixed(2)}   |   ${summary.expenseCount} expenses`,
    14,
    31
  );

  let y = 42;
  for (const cat of summary.categories) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.setTextColor(58, 51, 53);
    doc.text(cat.name, 14, y);

    autoTable(doc, {
      startY: y + 3,
      head: [['Date', 'Shop', 'Notes', 'Amount']],
      body: cat.expenses.map((e) => [e.date, e.shopName, e.notes, `$${e.amount.toFixed(2)}`]),
      foot: [['', '', 'Subtotal', `$${cat.total.toFixed(2)}`]],
      headStyles: { fillColor: [216, 140, 154] },
      footStyles: { fillColor: [253, 242, 244], textColor: [58, 51, 53] },
      columnStyles: { 3: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 12;
  }

  doc.save(`expense-summary-${summary.month}.pdf`);
}