
import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Package, CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const orderStages = [
  { id: 'Order Processed', title: 'Order Received', icon: Package, description: 'Your order has been received and is being prepared' },
  { id: 'Materials Ordered', title: 'Materials Ordered', icon: Clock, description: 'We\'re sourcing the perfect materials for your project' },
  { id: 'Materials Arrived', title: 'Materials Arrived', icon: CheckCircle, description: 'All materials have arrived and are ready for production' },
  { id: 'Frame Cut', title: 'Frame Cutting', icon: Clock, description: 'Your custom frame is being precisely cut to size' },
  { id: 'Mat Cut', title: 'Mat Cutting', icon: Clock, description: 'Custom matting is being cut and prepared' },
  { id: 'Prepped', title: 'Assembly Prep', icon: Clock, description: 'All components are ready for final assembly' },
  { id: 'Completed', title: 'Completed', icon: CheckCircle, description: 'Your project is complete and ready for pickup!' },
  { id: 'Picked Up', title: 'Picked Up', icon: CheckCircle, description: 'Order has been picked up by customer' }
];

export default function CustomerTracking() {
  const [match, params] = useRoute('/track/:orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params?.orderId) {
      fetchOrderStatus(params.orderId);
    }
  }, [params?.orderId]);

  const fetchOrderStatus = async (orderId) => {
    try {
      setLoading(true);
      // This would normally be a public API endpoint that doesn't require authentication
      // For now, we'll simulate the data
      setTimeout(() => {
        const mockOrder = {
          id: orderId,
          orderNumber: orderId,
          customerName: 'John Smith',
          jobType: 'Custom Mirror Frame',
          description: '24"x36" ornate gold frame, beveled mirror, wall mount hardware',
          status: 'Frame Cut',
          dueDate: '2025-07-26',
          priority: 'High',
          createdAt: '2025-07-20',
          estimatedCompletion: '2025-07-26'
        };
        setOrder(mockOrder);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Order not found');
      setLoading(false);
    }
  };

  const getCurrentStageIndex = () => {
    if (!order) return -1;
    return orderStages.findIndex(stage => stage.id === order.status);
  };

  const getStageStatus = (index) => {
    const currentIndex = getCurrentStageIndex();
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order status...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              Order Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              We couldn't find an order with that number. Please check your order number and try again.
            </p>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
              <p className="text-gray-600">Track the progress of your custom framing order</p>
            </div>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Summary */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Order #{order.orderNumber}</CardTitle>
                <CardDescription className="text-base mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant={order.priority === 'High' ? 'destructive' : order.priority === 'Medium' ? 'default' : 'secondary'}>
                {order.priority} Priority
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Project Details</h3>
                <p className="text-lg font-medium text-emerald-600 mb-1">{order.jobType}</p>
                <p className="text-gray-600">{order.description}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Timeline</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Completion:</span>
                    <span className="font-medium">{new Date(order.estimatedCompletion).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-medium">{new Date(order.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Tracker */}
        <Card>
          <CardHeader>
            <CardTitle>Production Progress</CardTitle>
            <CardDescription>
              Your order is currently in the <strong>{orderStages[getCurrentStageIndex()]?.title}</strong> stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {orderStages.map((stage, index) => {
                const status = getStageStatus(index);
                const Icon = stage.icon;
                
                return (
                  <div key={stage.id} className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        status === 'completed' ? 'bg-emerald-600 text-white' :
                        status === 'current' ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-lg font-medium ${
                          status === 'completed' ? 'text-emerald-600' :
                          status === 'current' ? 'text-gray-900' :
                          'text-gray-400'
                        }`}>
                          {stage.title}
                        </h3>
                        {status === 'completed' && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Completed
                          </Badge>
                        )}
                        {status === 'current' && (
                          <Badge className="bg-emerald-600">
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <p className={`mt-1 ${
                        status === 'current' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {stage.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Questions About Your Order?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex-1">
                📞 Call (555) 123-FRAME
              </Button>
              <Button variant="outline" className="flex-1">
                ✉️ Email hello@framecraftpro.com
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Reference Order #{order.orderNumber} when contacting us
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
