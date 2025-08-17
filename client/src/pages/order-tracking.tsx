import React, { useState } from 'react'
import { Link } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { Package, Search, Phone, Mail, MapPin, Clock, CheckCircle, Circle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface OrderTrackingData {
  orderNumber: string
  status: string
  description: string
  frameStyle: string
  matColor: string
  glassType: string
  totalPrice: number
  estimatedCompletion: string
  createdAt: string
  priority: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  stages: Array<{
    name: string
    status: 'completed' | 'current' | 'pending'
    description: string
    icon: string
  }>
  businessInfo: {
    name: string
    address: string
    phone: string
    email: string
    hours: string
  }
}

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchAttempted, setSearchAttempted] = useState(false)

  const { data: orderData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/public/track-order', orderNumber, lastName],
    queryFn: async () => {
      if (!orderNumber.trim()) return null
      
      const params = new URLSearchParams({ orderNumber: orderNumber.trim() })
      if (lastName.trim()) {
        params.append('lastName', lastName.trim())
      }
      
      const response = await fetch(`/api/public/track-order?${params}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found. Please check your order number.')
        } else if (response.status === 403) {
          throw new Error('Invalid order information. Please check your details.')
        }
        throw new Error('Unable to retrieve order information.')
      }
      return response.json() as Promise<OrderTrackingData>
    },
    enabled: false, // Only run when manually triggered
  })

  const handleSearch = async () => {
    if (!orderNumber.trim()) return
    
    setIsSearching(true)
    setSearchAttempted(true)
    
    try {
      await refetch()
    } finally {
      setIsSearching(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'rush': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'normal': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">FC</span>
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-gray-900">FrameCraft Pro</h1>
                <p className="text-sm text-gray-500">Order Tracking Portal</p>
              </div>
            </div>
            <Link href="/customer-portal">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Track Your Order
            </CardTitle>
            <CardDescription>
              Enter your order number to view real-time progress. For additional security, you may also provide your last name.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="text"
                  placeholder="Order Number (e.g., FC2401)"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="flex-1"
                  data-testid="input-order-number"
                />
                <Input
                  type="text"
                  placeholder="Last Name (optional)"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="sm:w-48"
                  data-testid="input-last-name"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={!orderNumber.trim() || isSearching}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  data-testid="button-search-order"
                >
                  {isSearching ? 'Searching...' : 'Track Order'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && searchAttempted && (
          <Card className="border-red-200">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-red-600 mb-4">
                  <Package className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Order Not Found</h3>
                <p className="text-red-600 mb-4">{error.message}</p>
                <div className="text-sm text-gray-600">
                  <p>Please check that you've entered the correct order number.</p>
                  <p>If you continue to have issues, please contact us.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {orderData && (
          <div className="space-y-6">
            {/* Order Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2">Order {orderData.orderNumber}</CardTitle>
                    <CardDescription>
                      Ordered on {formatDate(orderData.createdAt)} • {orderData.customer.firstName} {orderData.customer.lastName}
                    </CardDescription>
                  </div>
                  <Badge className={getPriorityColor(orderData.priority)}>
                    {orderData.priority.charAt(0).toUpperCase() + orderData.priority.slice(1)} Priority
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Project Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-600">Description:</span> {orderData.description}</p>
                      <p><span className="text-gray-600">Frame Style:</span> {orderData.frameStyle}</p>
                      <p><span className="text-gray-600">Mat Color:</span> {orderData.matColor}</p>
                      <p><span className="text-gray-600">Glass Type:</span> {orderData.glassType}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Order Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-600">Total Price:</span> {formatPrice(orderData.totalPrice)}</p>
                      <p><span className="text-gray-600">Estimated Completion:</span> {formatDate(orderData.estimatedCompletion)}</p>
                      <p><span className="text-gray-600">Current Status:</span> {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Tracker */}
            <Card>
              <CardHeader>
                <CardTitle>Production Progress</CardTitle>
                <CardDescription>Track your order through each stage of our production process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderData.stages.map((stage, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {stage.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : stage.status === 'current' ? (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          </div>
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`font-medium ${
                            stage.status === 'completed' ? 'text-green-800' :
                            stage.status === 'current' ? 'text-blue-800' :
                            'text-gray-600'
                          }`}>
                            {stage.icon} {stage.name}
                          </h4>
                          {stage.status === 'current' && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              In Progress
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{stage.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
                <CardDescription>Contact us with any questions about your order</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-medium">{orderData.businessInfo.phone}</p>
                        <p className="text-sm text-gray-600">Call us directly</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-medium">{orderData.businessInfo.email}</p>
                        <p className="text-sm text-gray-600">Send us an email</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-emerald-600 mt-1" />
                      <div>
                        <p className="font-medium">{orderData.businessInfo.address}</p>
                        <p className="text-sm text-gray-600">Visit our studio</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-emerald-600 mt-1" />
                      <div>
                        <p className="font-medium">{orderData.businessInfo.hours}</p>
                        <p className="text-sm text-gray-600">Studio hours</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-emerald-800">
                    <strong>Reference your order number:</strong> {orderData.orderNumber} when contacting us for the fastest service.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}