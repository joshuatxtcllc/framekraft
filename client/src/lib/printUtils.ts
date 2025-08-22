interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  artworkDescription: string;
  artworkImage?: string;
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

export const printOrderInvoice = (data: OrderData) => {
  // Create the HTML content for the invoice
  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${data.orderNumber}</title>
      <style>
        @media print {
          @page { margin: 0.5in; }
          body { margin: 0; }
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          border-bottom: 2px solid #8B4513;
          padding-bottom: 20px;
        }
        
        .company-info h1 {
          margin: 0;
          color: #8B4513;
          font-size: 28px;
          font-weight: bold;
        }
        
        .company-info p {
          margin: 5px 0;
          color: #666;
        }
        
        .invoice-info {
          text-align: right;
        }
        
        .invoice-info h2 {
          margin: 0;
          color: #8B4513;
          font-size: 24px;
        }
        
        .invoice-info p {
          margin: 5px 0;
        }
        
        .customer-section, .project-section, .financial-section {
          margin: 30px 0;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #8B4513;
          margin-bottom: 10px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        
        .detail-row {
          margin: 8px 0;
          display: flex;
        }
        
        .detail-label {
          font-weight: bold;
          width: 150px;
          flex-shrink: 0;
        }
        
        .detail-value {
          flex: 1;
        }
        
        .financial-summary {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }
        
        .total-row {
          font-size: 18px;
          font-weight: bold;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
        }
        
        .notes-section {
          margin-top: 30px;
          background-color: #f0f8ff;
          padding: 15px;
          border-radius: 8px;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        
        .print-button {
          background-color: #8B4513;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin: 20px 0;
          font-size: 16px;
        }
        
        @media print {
          .print-button { display: none; }
        }
      </style>
    </head>
    <body>
      <button class="print-button" onclick="window.print()">🖨️ Print Invoice</button>
      
      <div class="header">
        <div class="company-info">
          <h1>FrameCraft Custom Framing</h1>
          <p>Professional Art Preservation Services</p>
          <p>Houston Heights, Texas</p>
          <p>Phone: (713) 555-FRAME</p>
          <p>Email: info@framecraft.com</p>
        </div>
        <div class="invoice-info">
          <h2>INVOICE</h2>
          <p><strong>Order #:</strong> ${data.orderNumber}</p>
          <p><strong>Date:</strong> ${new Date(data.createdAt).toLocaleDateString()}</p>
          ${data.dueDate ? `<p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>` : ''}
        </div>
      </div>
      
      <div class="customer-section">
        <div class="section-title">Customer Information</div>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${data.customerName}</span>
        </div>
        ${data.customerEmail ? `
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${data.customerEmail}</span>
        </div>
        ` : ''}
        ${data.customerPhone ? `
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value">${data.customerPhone}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="project-section">
        <div class="section-title">Project Details</div>
        <div class="detail-row">
          <span class="detail-label">Description:</span>
          <span class="detail-value">${data.description}</span>
        </div>
        ${data.artworkDescription ? `
        <div class="detail-row">
          <span class="detail-label">Artwork:</span>
          <span class="detail-value">${data.artworkDescription}</span>
        </div>
        ` : ''}
        ${data.artworkImage && data.artworkImage.startsWith('data:image') ? `
        <div class="detail-row">
          <span class="detail-label">Artwork Image:</span>
          <div style="margin-top: 10px;">
            <img src="${data.artworkImage}" alt="Artwork" style="max-width: 300px; max-height: 200px; border: 1px solid #ddd; border-radius: 4px;" />
          </div>
        </div>
        ` : ''}
        ${data.dimensions ? `
        <div class="detail-row">
          <span class="detail-label">Dimensions:</span>
          <span class="detail-value">${data.dimensions}</span>
        </div>
        ` : ''}
        ${data.frameStyle ? `
        <div class="detail-row">
          <span class="detail-label">Frame Style:</span>
          <span class="detail-value">${data.frameStyle}</span>
        </div>
        ` : ''}
        ${data.matColor ? `
        <div class="detail-row">
          <span class="detail-label">Mat Color:</span>
          <span class="detail-value">${data.matColor}</span>
        </div>
        ` : ''}
        ${data.glazing ? `
        <div class="detail-row">
          <span class="detail-label">Glass/Glazing:</span>
          <span class="detail-value">${data.glazing}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="financial-section">
        <div class="section-title">Financial Summary</div>
        <div class="financial-summary">
          <div class="detail-row">
            <span class="detail-label">Total Amount:</span>
            <span class="detail-value">$${data.totalAmount.toFixed(2)}</span>
          </div>
          ${data.depositAmount > 0 ? `
          <div class="detail-row">
            <span class="detail-label">Deposit Paid:</span>
            <span class="detail-value">$${data.depositAmount.toFixed(2)}</span>
          </div>
          <div class="detail-row total-row">
            <span class="detail-label">Balance Due:</span>
            <span class="detail-value">$${(data.totalAmount - data.depositAmount).toFixed(2)}</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      ${data.notes ? `
      <div class="notes-section">
        <div class="section-title">Notes</div>
        <p>${data.notes}</p>
      </div>
      ` : ''}
      
      <div class="footer">
        <p><strong>Thank you for choosing FrameCraft Custom Framing!</strong></p>
        <p>Payment is due within 30 days of invoice date.</p>
        <p>For questions about this invoice, please contact us at (713) 555-FRAME</p>
      </div>
    </body>
    </html>
  `;

  // Open new window with the invoice
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  } else {
    console.error('Failed to open print window. Pop-up blocker may be active.');
    alert('Unable to open print window. Please check your pop-up blocker settings.');
  }
};