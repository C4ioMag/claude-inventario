import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function header(doc, title, filters) {
  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text('Controle de Inventário — Fibra Ótica', 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(title, 14, 26);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 32);
  if (filters) {
    doc.text(`Filtros: ${filters}`, 14, 37);
  }
  return filters ? 42 : 38;
}

export function exportEquipmentPDF(equipment) {
  const doc = new jsPDF();
  const startY = header(doc, 'Lista de Equipamentos', null);

  const rows = equipment.map((e) => [
    e.name,
    e.category || '—',
    e.description || '—',
    e.quantity,
    e.inUse,
    e.quantity - e.inUse,
  ]);

  autoTable(doc, {
    startY,
    head: [['Nome', 'Categoria', 'Descrição', 'Total', 'Em Uso', 'Disponível']],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 64, 175] },
    alternateRowStyles: { fillColor: [240, 245, 255] },
  });

  doc.save('equipamentos.pdf');
}

export function exportHistoricoPDF(outings, getPurchases, filtersObj) {
  const doc = new jsPDF();
  const filterStr = [
    filtersObj.search && `Nome: ${filtersObj.search}`,
    filtersObj.statusFilter && `Status: ${filtersObj.statusFilter}`,
    filtersObj.dateFrom && `De: ${filtersObj.dateFrom}`,
    filtersObj.dateTo && `Até: ${filtersObj.dateTo}`,
  ].filter(Boolean).join(', ') || 'Nenhum';

  let y = header(doc, 'Histórico de Saídas', filterStr);

  outings.forEach((outing) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175);
    doc.text(`${outing.person}`, 14, y);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const hasPending = outing.pendingItems?.length > 0;
    const statusLabel = outing.status === 'active'
      ? 'Em campo'
      : hasPending ? 'Encerrado com pendência' : 'Encerrado';
    const retornoStr = outing.endDate
      ? ` | Retorno: ${new Date(outing.endDate + 'T12:00:00').toLocaleDateString('pt-BR')}`
      : '';
    doc.text(
      `Saída: ${new Date(outing.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}${retornoStr} | Status: ${statusLabel}`,
      14, y + 5
    );
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [['Item', 'Retirado', 'Devolvido', 'Pendência']],
      body: outing.items.map((i) => {
        const missing = i.taken - i.returned;
        const hasMissing = missing > 0 && outing.status === 'closed';
        return [
          i.name,
          i.taken,
          outing.status === 'closed' ? i.returned : '—',
          hasMissing ? `⚠ ${missing} não devolvido(s)` : outing.status === 'closed' ? '✓ ok' : '—',
        ];
      }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 116, 139] },
      margin: { left: 14 },
      didParseCell: (data) => {
        if (data.column.index === 3 && typeof data.cell.raw === 'string' && data.cell.raw.startsWith('⚠')) {
          data.cell.styles.textColor = [220, 53, 69];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    y = doc.lastAutoTable.finalY + 4;

    // Bloco de pendências destacado
    if (hasPending) {
      doc.setFontSize(9);
      doc.setTextColor(220, 53, 69);
      doc.text('Itens não devolvidos (pendência registrada):', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Item', 'Qtd não devolvida']],
        body: outing.pendingItems.map((i) => [i.name, i.missing]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [220, 53, 69] },
        margin: { left: 14 },
      });
      y = doc.lastAutoTable.finalY + 4;
    }

    const purchases = getPurchases(outing.id);
    if (purchases.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text('Compras:', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Data', 'Itens', 'Valor']],
        body: purchases.map((p) => [
          new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR'),
          p.lines.map((l) => `${l.item} ×${l.qty}`).join(', '),
          p.total ? `R$ ${p.total}` : '—',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: 14 },
      });
      y = doc.lastAutoTable.finalY + 6;
    } else {
      y += 4;
    }
  });

  doc.save('historico.pdf');
}
