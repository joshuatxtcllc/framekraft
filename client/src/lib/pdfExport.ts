import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface InvoiceData {
  id: number;
  invoiceNumber: string;
  customer: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  dueDate: string;
  notes?: string;
  createdAt: string;
}

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  artworkDescription: string;
  dimensions: string;
  frameStyle: string;
  matColor: string;
  glazing: string;
  totalAmount: number;
  depositAmount: number;
  status: string;
  priority: string;
  dueDate: string;
  createdAt: string;
  notes: string;
}

export const exportToPDF = (data: OrderData, type: 'invoice' | 'work-order') => {
  const doc = new jsPDF();
  
  // Company header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Jay\'s Frames', 20, 30);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Professional Custom Framing Services', 20, 38);
  doc.text('Houston Heights, Texas', 20, 45);
  doc.text('Phone: (713) 555-FRAME | Email: info@jaysframes.com', 20, 52);
  
  // Document title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const title = type === 'invoice' ? 'INVOICE' : 'WORK ORDER';
  doc.text(title, 150, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order #: ${data.orderNumber}`, 150, 40);
  doc.text(`Date: ${new Date(data.createdAt).toLocaleDateString()}`, 150, 48);
  if (data.dueDate) {
    doc.text(`Due Date: ${new Date(data.dueDate).toLocaleDateString()}`, 150, 56);
  }
  
  // Customer information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer:', 20, 75);
  
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerName, 20, 85);
  if (data.customerEmail) {
    doc.text(data.customerEmail, 20, 93);
  }
  if (data.customerPhone) {
    doc.text(data.customerPhone, 20, 101);
  }
  
  // Project details
  doc.setFont('helvetica', 'bold');
  doc.text('Project Details:', 20, 120);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Description: ${data.description}`, 20, 130);
  
  if (data.dimensions) {
    doc.text(`Dimensions: ${data.dimensions}`, 20, 138);
  }
  
  if (data.frameStyle) {
    doc.text(`Frame: ${data.frameStyle}`, 20, 146);
  }
  
  if (data.matColor) {
    doc.text(`Mat: ${data.matColor}`, 20, 154);
  }
  
  if (data.glazing) {
    doc.text(`Glass: ${data.glazing}`, 20, 162);
  }
  
  // Financial information (for invoices)
  if (type === 'invoice') {
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary:', 20, 180);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Amount: $${data.totalAmount.toFixed(2)}`, 20, 190);
    
    if (data.depositAmount > 0) {
      doc.text(`Deposit: $${data.depositAmount.toFixed(2)}`, 20, 198);
      doc.text(`Balance Due: $${(data.totalAmount - data.depositAmount).toFixed(2)}`, 20, 206);
    }
  }
  
  // Status and priority (for work orders)
  if (type === 'work-order') {
    doc.setFont('helvetica', 'bold');
    doc.text('Status Information:', 20, 180);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${data.status}`, 20, 190);
    doc.text(`Priority: ${data.priority}`, 20, 198);
  }
  
  // Notes
  if (data.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, 220);
    
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(data.notes, 170);
    doc.text(splitNotes, 20, 230);
  }
  
  // Download the PDF
  const filename = `${type}-${data.orderNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

export const exportInvoiceToPDF = (invoice: InvoiceData) => {
  const doc = new jsPDF();
  
  // Company header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FrameCraft Studio', 20, 30);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Professional Custom Framing Services', 20, 38);
  doc.text('123 Frame Street, Art District, NY 10001', 20, 45);
  doc.text('Phone: (555) 123-FRAME | Email: info@framecraft.com', 20, 52);
  
  // Invoice title and number
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 150, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 150, 40);
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 150, 48);
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 150, 56);
  
  // Customer information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 75);
  
  doc.setFont('helvetica', 'normal');
  const customerName = `${invoice.customer.firstName} ${invoice.customer.lastName}`;
  doc.text(customerName, 20, 85);
  
  if (invoice.customer.email) {
    doc.text(invoice.customer.email, 20, 93);
  }
  
  if (invoice.customer.phone) {
    doc.text(invoice.customer.phone, 20, 101);
  }
  
  if (invoice.customer.address) {
    const addressLines = invoice.customer.address.split('\n');
    addressLines.forEach((line, index) => {
      doc.text(line, 20, 109 + (index * 8));
    });
  }
  
  // Invoice items table
  const tableStartY = 130;
  
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    `$${parseFloat(item.unitPrice.toString()).toFixed(2)}`,
    `$${parseFloat(item.totalPrice.toString()).toFixed(2)}`
  ]);
  
  (doc as any).autoTable({
    startY: tableStartY,
    head: [['Description', 'Quantity', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    }
  });
  
  // Calculate totals position
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  
  // Totals section
  const totalsX = 130;
  doc.setFontSize(10);
  
  doc.text('Subtotal:', totalsX, finalY);
  doc.text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, totalsX + 50, finalY);
  
  if (parseFloat(invoice.discountAmount) > 0) {
    doc.text('Discount:', totalsX, finalY + 8);
    doc.text(`-$${parseFloat(invoice.discountAmount).toFixed(2)}`, totalsX + 50, finalY + 8);
  }
  
  if (parseFloat(invoice.taxAmount) > 0) {
    doc.text('Tax:', totalsX, finalY + 16);
    doc.text(`$${parseFloat(invoice.taxAmount).toFixed(2)}`, totalsX + 50, finalY + 16);
  }
  
  // Total line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const totalY = finalY + (parseFloat(invoice.discountAmount) > 0 ? 24 : 16) + (parseFloat(invoice.taxAmount) > 0 ? 8 : 0);
  doc.text('Total:', totalsX, totalY);
  doc.text(`$${parseFloat(invoice.totalAmount).toFixed(2)}`, totalsX + 50, totalY);
  
  // Notes section
  if (invoice.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Notes:', 20, totalY + 20);
    
    const noteLines = doc.splitTextToSize(invoice.notes, 170);
    doc.text(noteLines, 20, totalY + 28);
  }
  
  // Footer
  const footerY = doc.internal.pageSize.height - 30;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', 20, footerY);
  doc.text('Payment is due within 30 days of invoice date.', 20, footerY + 8);
  
  // Save the PDF
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
};