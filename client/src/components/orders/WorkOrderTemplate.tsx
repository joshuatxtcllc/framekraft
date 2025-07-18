
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

  const businessDetails = businessInfo || {
    name: "FrameCraft Studio",
    address: "123 Main Street, Anytown, ST 12345",
    phone: "(555) 123-4567",
    email: "info@framecraft.com"
  };

  const workflowSteps = [
    { name: "Consultation", status: "completed", description: "Initial customer consultation and requirements gathering" },
    { name: "Measuring", status: order.status === 'pending' ? 'pending' : 'completed', description: "Measure artwork and determine exact specifications" },
    { name: "Material Ordering", status: order.status === 'measuring' || order.status === 'pending' ? 'pending' : 'in_progress', description: "Order frame materials, matting, and glazing" },
    { name: "Production", status: order.status === 'production' ? 'in_progress' : order.status === 'ready' || order.status === 'completed' ? 'completed' : 'pending', description: "Cut frame, cut mat, assemble piece" },
    { name: "Quality Check", status: order.status === 'ready' || order.status === 'completed' ? 'completed' : 'pending', description: "Final inspection and quality assurance" },
    { name: "Ready for Pickup", status: order.status === 'ready' || order.status === 'completed' ? 'completed' : 'pending', description: "Package and prepare for customer pickup" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'rush': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

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
            <h2 className="text-2xl font-bold text-gray-800">WORK ORDER</h2>
            <p className="text-gray-600 mt-2">Order #: {order.orderNumber}</p>
            <p className="text-gray-600">Created: {formatDate(order.createdAt)}</p>
            {order.dueDate && (
              <p className="text-gray-600">Due Date: {formatDate(order.dueDate)}</p>
            )}
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 border ${getPriorityColor(order.priority)}`}>
              {order.priority.toUpperCase()} PRIORITY
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Customer Information:</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p className="font-medium">{customer.firstName} {customer.lastName}</p>
          {customer.email && <p className="text-gray-600">{customer.email}</p>}
          {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
          {customer.address && <p className="text-gray-600 whitespace-pre-line">{customer.address}</p>}
        </div>
      </div>

      {/* Project Specifications */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Project Specifications:</h3>
        <div className="border border-gray-300 rounded overflow-hidden">
          <table className="w-full">
            <tbody>
              <tr className="border-b bg-gray-50">
                <td className="p-3 font-medium w-1/3">Project Description:</td>
                <td className="p-3">{order.description}</td>
              </tr>
              {order.artworkDescription && (
                <tr className="border-b">
                  <td className="p-3 font-medium">Artwork Description:</td>
                  <td className="p-3">{order.artworkDescription}</td>
                </tr>
              )}
              {order.dimensions && (
                <tr className="border-b bg-gray-50">
                  <td className="p-3 font-medium">Dimensions:</td>
                  <td className="p-3">{order.dimensions}</td>
                </tr>
              )}
              {order.frameStyle && (
                <tr className="border-b">
                  <td className="p-3 font-medium">Frame Style:</td>
                  <td className="p-3">{order.frameStyle}</td>
                </tr>
              )}
              {order.matColor && (
                <tr className="border-b bg-gray-50">
                  <td className="p-3 font-medium">Mat Color:</td>
                  <td className="p-3">{order.matColor}</td>
                </tr>
              )}
              {order.glazing && (
                <tr className="border-b">
                  <td className="p-3 font-medium">Glazing:</td>
                  <td className="p-3">{order.glazing}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Production Workflow:</h3>
        <div className="space-y-3">
          {workflowSteps.map((step, index) => (
            <div key={index} className="border border-gray-300 rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-800">{index + 1}. {step.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                    {step.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {step.status === 'completed' && '✓ Complete'}
                  {step.status === 'in_progress' && '⏳ In Progress'}
                  {step.status === 'pending' && '⌛ Pending'}
                </div>
              </div>
              <p className="text-sm text-gray-600">{step.description}</p>
              <div className="mt-3 border-t pt-3 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-500">Started:</label>
                    <div className="border-b border-dotted border-gray-400 h-6"></div>
                  </div>
                  <div>
                    <label className="block text-gray-500">Completed:</label>
                    <div className="border-b border-dotted border-gray-400 h-6"></div>
                  </div>
                  <div>
                    <label className="block text-gray-500">Initials:</label>
                    <div className="border-b border-dotted border-gray-400 h-6"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Special Instructions */}
      {order.notes && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Special Instructions:</h3>
          <div className="border-2 border-red-200 bg-red-50 p-4 rounded">
            <p className="text-gray-700 whitespace-pre-line">{order.notes}</p>
          </div>
        </div>
      )}

      {/* Quality Control Checklist */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Quality Control Checklist:</h3>
        <div className="border border-gray-300 rounded p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="print:appearance-auto" />
                <span>Frame cuts accurate and clean</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="print:appearance-auto" />
                <span>Mat cuts precise and centered</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="print:appearance-auto" />
                <span>Glass/glazing clean and secure</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="print:appearance-auto" />
                <span>Artwork properly secured</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="print:appearance-auto" />
                <span>Backing secure and dust cover applied</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="print:appearance-auto" />
                <span>Hardware and wire properly installed</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-gray-500">Quality Check By:</label>
                <div className="border-b border-dotted border-gray-400 h-6 mt-1"></div>
              </div>
              <div>
                <label className="block text-gray-500">Date:</label>
                <div className="border-b border-dotted border-gray-400 h-6 mt-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-6 text-center text-gray-600 text-sm">
        <p className="font-medium">Internal Use Only - Not for Customer Distribution</p>
      </div>
    </div>
  );
}
