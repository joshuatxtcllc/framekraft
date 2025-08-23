import React from 'react';

interface WorkOrderTemplateProps {
  order: any;
  customer: any;
  businessInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export default function WorkOrderTemplate({ order, customer, businessInfo }: WorkOrderTemplateProps) {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const defaultBusinessInfo = {
    name: "Jay's Frames",
    address: "123 Main Street, City, ST 12345",
    phone: "(555) 123-4567",
    email: "info@jaysframes.com"
  };

  const business = businessInfo || defaultBusinessInfo;

  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-white">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{business.name}</h1>
        <p className="text-gray-600">{business.address}</p>
        <p className="text-gray-600">{business.phone} | {business.email}</p>
      </div>

      <div className="border-t-2 border-b-2 border-gray-900 py-4 mb-6">
        <h2 className="text-2xl font-bold text-center">WORK ORDER</h2>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="font-semibold">Order Number:</p>
          <p className="text-lg">{order.orderNumber || `ORD-${order.id}`}</p>
        </div>
        <div>
          <p className="font-semibold">Date:</p>
          <p className="text-lg">{formatDate(order.createdAt)}</p>
        </div>
        <div>
          <p className="font-semibold">Due Date:</p>
          <p className="text-lg">{order.dueDate ? formatDate(order.dueDate) : 'Not Set'}</p>
        </div>
        <div>
          <p className="font-semibold">Status:</p>
          <p className="text-lg capitalize">{order.status}</p>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">{customer?.fullName || order.customerName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium">{customer?.phone || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{customer?.email || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Address</p>
            <p className="font-medium">{customer?.address || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Artwork Details */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Artwork Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Dimensions (W × H)</p>
            <p className="font-medium">{order.artworkWidth}" × {order.artworkHeight}"</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Type</p>
            <p className="font-medium">{order.artworkType || 'Not specified'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-600">Description</p>
            <p className="font-medium">{order.artworkDescription || 'No description provided'}</p>
          </div>
        </div>
      </div>

      {/* Frame & Materials */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Frame & Materials</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Frame</p>
            <p className="font-medium">{order.frameName || 'Not selected'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Frame SKU</p>
            <p className="font-medium">{order.frameSku || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mat</p>
            <p className="font-medium">{order.matDescription || 'No mat'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Glass Type</p>
            <p className="font-medium">{order.glassType || 'Standard'}</p>
          </div>
        </div>
      </div>

      {/* Special Services */}
      {order.specialServices && order.specialServices.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Special Services</h3>
          <ul className="list-disc list-inside space-y-1">
            {order.specialServices.map((service: string, index: number) => (
              <li key={index} className="text-gray-700">{service}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Production Notes */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Production Notes</h3>
        <div className="border border-gray-300 rounded p-4 min-h-[100px] bg-gray-50">
          <p className="text-gray-700">{order.notes || 'No special instructions'}</p>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-gray-900 text-white p-4 rounded-lg mb-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal || 0)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-300">
              <span>Discount:</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{formatCurrency(order.tax || 0)}</span>
          </div>
          <div className="border-t border-gray-600 pt-2">
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span>{formatCurrency(order.total || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Production Checklist */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Production Checklist</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="w-4 h-4" />
            <span>Artwork received and inspected</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="w-4 h-4" />
            <span>Frame cut to size</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="w-4 h-4" />
            <span>Mat cut and beveled</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="w-4 h-4" />
            <span>Glass cut and cleaned</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="w-4 h-4" />
            <span>Artwork mounted</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="w-4 h-4" />
            <span>Frame assembled</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="w-4 h-4" />
            <span>Hardware attached</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="w-4 h-4" />
            <span>Quality inspection complete</span>
          </label>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-sm text-gray-600 mb-2">Production Completed By:</p>
          <div className="border-b border-gray-400 h-8"></div>
          <p className="text-xs text-gray-500 mt-1">Signature / Date</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Quality Checked By:</p>
          <div className="border-b border-gray-400 h-8"></div>
          <p className="text-xs text-gray-500 mt-1">Signature / Date</p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-6 text-center text-gray-600 text-sm">
        <p className="font-medium">Internal Use Only - Not for Customer Distribution</p>
      </div>
    </div>
  );
}