import React from 'react';

interface InvoiceTemplateProps {
  order: any;
  customer: any;
  businessInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export default function InvoiceTemplate({ order, customer, businessInfo }: InvoiceTemplateProps) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const businessDetails = businessInfo || {
    name: "Jay's Frames",
    address: "218 W 27th St, Houston, TX 77008",
    phone: "(832) 893-3794",
    email: "Frames@jaysframes.com"
  };

  const subtotal = parseFloat(order.totalAmount);
  const tax = subtotal * 0.08; // 8% tax rate
  const total = subtotal + tax;
  const depositPaid = order.depositAmount ? parseFloat(order.depositAmount) : 0;
  const balanceDue = total - depositPaid;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black print:p-0 print:shadow-none">
      {/* Header */}
      <div className="mb-8 border-b-2 border-gray-300 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{businessDetails.name}</h1>
            <p className="text-gray-600 mt-2">{businessDetails.address}</p>
            <p className="text-gray-600">{businessDetails.phone}</p>
            <p className="text-gray-600">{businessDetails.email}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
            <p className="text-gray-600 mt-2">Invoice #: {order.orderNumber}</p>
            <p className="text-gray-600">Date: {formatDate(order.createdAt)}</p>
            {order.dueDate && (
              <p className="text-gray-600">Due Date: {formatDate(order.dueDate)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Bill To:</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p className="font-medium">{customer.firstName} {customer.lastName}</p>
          {customer.email && <p className="text-gray-600">{customer.email}</p>}
          {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
          {customer.address && <p className="text-gray-600 whitespace-pre-line">{customer.address}</p>}
        </div>
      </div>

      {/* Order Details */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Order Details:</h3>
        <div className="border border-gray-300 rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3 font-semibold">Description</th>
                <th className="text-right p-3 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-3">
                  <div className="font-medium">{order.description}</div>
                  {order.artworkDescription && (
                    <div className="text-sm text-gray-600 mt-1">
                      Artwork: {order.artworkDescription}
                    </div>
                  )}
                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                    {order.dimensions && <div>Dimensions: {order.dimensions}</div>}
                    {order.frameStyle && <div>Frame: {order.frameStyle}</div>}
                    {order.matColor && <div>Mat: {order.matColor}</div>}
                    {order.glazing && <div>Glazing: {order.glazing}</div>}
                  </div>
                </td>
                <td className="p-3 text-right font-medium">{formatCurrency(order.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="border border-gray-300 rounded overflow-hidden">
            <div className="bg-gray-100 p-3 font-semibold">Summary</div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal.toString())}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%):</span>
                <span>{formatCurrency(tax.toString())}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(total.toString())}</span>
              </div>
              {depositPaid > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Deposit Paid:</span>
                  <span>-{formatCurrency(depositPaid.toString())}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Balance Due:</span>
                <span className={balanceDue > 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(balanceDue.toString())}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Notes:</h3>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-700 whitespace-pre-line">{order.notes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-6 text-center text-gray-600 text-sm">
        <p>Thank you for your business!</p>
        <p className="mt-2">
          Payment is due within 30 days. Please reference invoice #{order.orderNumber} with your payment.
        </p>
      </div>
    </div>
  );
}