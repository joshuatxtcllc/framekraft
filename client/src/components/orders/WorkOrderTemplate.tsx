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
    name: "Jay's Frames",
    address: "218 W 27th St, Houston, TX 77008",
    phone: "(832) 893-3794",
    email: "Frames@jaysframes.com"
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
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Printer, Download } from 'lucide-react';

interface WorkOrderProps {
  order: {
    id: number;
    orderNumber?: string;
    customerName: string;
    artworkWidth: number;
    artworkHeight: number;
    artworkDescription?: string;
    artworkType?: string;
    frameName?: string;
    matDescription?: string;
    glassType?: string;
    specialServices?: string[];
    dueDate?: string;
    status: string;
    total: string;
    createdAt: string;
    artworkImage?: string;
  };
}

export function WorkOrderTemplate({ order }: WorkOrderProps) {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a blob with the work order HTML
    const workOrderHtml = generateWorkOrderHtml();
    const blob = new Blob([workOrderHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `work-order-${order.orderNumber || order.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateWorkOrderHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Work Order - ${order.orderNumber || order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .artwork-image { max-width: 200px; max-height: 200px; border: 1px solid #ccc; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>JAY'S FRAMES - WORK ORDER</h1>
          <h2>Order #${order.orderNumber || order.id}</h2>
        </div>
        <div class="grid">
          <div>
            <div class="section">
              <div class="label">Customer:</div>
              <div>${order.customerName}</div>
            </div>
            <div class="section">
              <div class="label">Artwork Dimensions:</div>
              <div>${order.artworkWidth}" × ${order.artworkHeight}"</div>
            </div>
            <div class="section">
              <div class="label">Artwork Description:</div>
              <div>${order.artworkDescription || 'N/A'}</div>
            </div>
            <div class="section">
              <div class="label">Artwork Type:</div>
              <div>${order.artworkType || 'N/A'}</div>
            </div>
          </div>
          <div>
            <div class="section">
              <div class="label">Frame:</div>
              <div>${order.frameName || 'N/A'}</div>
            </div>
            <div class="section">
              <div class="label">Mat:</div>
              <div>${order.matDescription || 'N/A'}</div>
            </div>
            <div class="section">
              <div class="label">Glass:</div>
              <div>${order.glassType || 'N/A'}</div>
            </div>
            <div class="section">
              <div class="label">Special Services:</div>
              <div>${order.specialServices?.join(', ') || 'None'}</div>
            </div>
          </div>
        </div>
        ${order.artworkImage ? `
          <div class="section">
            <div class="label">Artwork Reference:</div>
            <img src="${order.artworkImage}" alt="Artwork" class="artwork-image" />
          </div>
        ` : ''}
        <div class="section">
          <div class="label">Due Date:</div>
          <div>${order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'Not set'}</div>
        </div>
        <div class="section">
          <div class="label">Order Total:</div>
          <div style="font-size: 18px; font-weight: bold;">${formatCurrency(parseFloat(order.total))}</div>
        </div>
        <div class="section">
          <div class="label">Production Notes:</div>
          <div style="height: 100px; border: 1px solid #ccc; margin-top: 5px;"></div>
        </div>
        <div class="section">
          <div class="label">Quality Check:</div>
          <div style="margin-top: 10px;">
            □ Frame cut and assembled<br/>
            □ Mat cut and beveled<br/>
            □ Glass cut and cleaned<br/>
            □ Artwork mounted<br/>
            □ Hardware attached<br/>
            □ Final inspection<br/>
            □ Ready for pickup
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="text-center border-b">
        <CardTitle className="text-2xl font-bold">JAY'S FRAMES - WORK ORDER</CardTitle>
        <div className="text-xl font-semibold">Order #{order.orderNumber || order.id}</div>
        <div className="flex justify-center gap-2 mt-4">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <div className="font-semibold text-sm text-gray-600">Customer</div>
              <div className="text-lg">{order.customerName}</div>
            </div>

            <div>
              <div className="font-semibold text-sm text-gray-600">Artwork Dimensions</div>
              <div className="text-lg">{order.artworkWidth}" × {order.artworkHeight}"</div>
            </div>

            <div>
              <div className="font-semibold text-sm text-gray-600">Artwork Description</div>
              <div>{order.artworkDescription || 'N/A'}</div>
            </div>

            <div>
              <div className="font-semibold text-sm text-gray-600">Artwork Type</div>
              <div>{order.artworkType || 'N/A'}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="font-semibold text-sm text-gray-600">Frame</div>
              <div>{order.frameName || 'N/A'}</div>
            </div>

            <div>
              <div className="font-semibold text-sm text-gray-600">Mat</div>
              <div>{order.matDescription || 'N/A'}</div>
            </div>

            <div>
              <div className="font-semibold text-sm text-gray-600">Glass</div>
              <div>{order.glassType || 'N/A'}</div>
            </div>

            <div>
              <div className="font-semibold text-sm text-gray-600">Special Services</div>
              <div>{order.specialServices?.join(', ') || 'None'}</div>
            </div>
          </div>
        </div>

        {order.artworkImage && (
          <div className="mb-6">
            <div className="font-semibold text-sm text-gray-600 mb-2">Artwork Reference</div>
            <img 
              src={order.artworkImage} 
              alt="Artwork" 
              className="max-w-xs max-h-48 border border-gray-300 rounded"
            />
          </div>
        )}

        <Separator className="my-6" />

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="font-semibold text-sm text-gray-600">Due Date</div>
            <div className="text-lg">
              {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'Not set'}
            </div>
          </div>

          <div>
            <div className="font-semibold text-sm text-gray-600">Order Total</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(parseFloat(order.total))}
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="mb-6">
          <div className="font-semibold text-sm text-gray-600 mb-2">Production Notes</div>
          <div className="h-24 border border-gray-300 rounded p-2 bg-gray-50"></div>
        </div>

        <div>
          <div className="font-semibold text-sm text-gray-600 mb-3">Quality Checklist</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="frame-cut" />
              <label htmlFor="frame-cut">Frame cut and assembled</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="mat-cut" />
              <label htmlFor="mat-cut">Mat cut and beveled</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="glass-cut" />
              <label htmlFor="glass-cut">Glass cut and cleaned</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="artwork-mounted" />
              <label htmlFor="artwork-mounted">Artwork mounted</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="hardware" />
              <label htmlFor="hardware">Hardware attached</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="inspection" />
              <label htmlFor="inspection">Final inspection</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ready" />
              <label htmlFor="ready">Ready for pickup</label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}