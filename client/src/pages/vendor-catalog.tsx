import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Package, ShoppingCart, Eye, FileText, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface VendorProduct {
  id: number;
  productCode: string;
  productName: string;
  category: string;
  subcategory: string;
  description: string;
  specifications: any;
  unitType: string;
  wholesalePrice: string;
  suggestedRetail: string;
  minQuantity: number;
  packSize: number;
  leadTime: string;
  stockStatus: string;
  vendorCatalogPage: string;
  supplierName: string;
  supplierContact: string;
  supplierPhone: string;
  supplierEmail: string;
  paymentTerms: string;
  minOrderAmount: string;
}

interface Wholesaler {
  id?: number;
  _id?: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  specialties: string[];
  paymentTerms: string;
  minOrderAmount: string;
}

export default function VendorCatalog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [activeTab, setActiveTab] = useState('search');

  // Fetch wholesalers
  const { data: wholesalers = [] } = useQuery<Wholesaler[]>({
    queryKey: ['/api/vendor/wholesalers'],
  });

  // Build search query string
  const searchParams = new URLSearchParams();
  if (searchQuery) searchParams.append('query', searchQuery);
  if (selectedCategory && selectedCategory !== 'all') searchParams.append('category', selectedCategory);
  if (selectedSupplier && selectedSupplier !== 'all') searchParams.append('supplier', selectedSupplier);
  const searchQueryString = searchParams.toString();

  // Search products
  const { data: searchResults = [], isLoading: isSearching } = useQuery<VendorProduct[]>({
    queryKey: searchQueryString ? [`/api/vendor/products/search?${searchQueryString}`] : ['/api/vendor/products/search'],
    enabled: !!(searchQuery || (selectedCategory && selectedCategory !== 'all') || (selectedSupplier && selectedSupplier !== 'all')),
  });

  // Get frames
  const { data: frames = [] } = useQuery<VendorProduct[]>({
    queryKey: ['/api/vendor/categories/frame'],
  });

  // Get mats
  const { data: mats = [] } = useQuery<VendorProduct[]>({
    queryKey: ['/api/vendor/categories/mat'],
  });

  // Get glazing
  const { data: glazing = [] } = useQuery<VendorProduct[]>({
    queryKey: ['/api/vendor/categories/glazing'],
  });

  const ProductCard = ({ product }: { product: VendorProduct }) => (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {product.productName}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              SKU: {product.productCode}
            </CardDescription>
          </div>
          <Badge variant={product.stockStatus === 'available' ? 'default' : 'secondary'}>
            {product.stockStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Wholesale:</span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            ${product.wholesalePrice}/{product.unitType.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Retail:</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            ${product.suggestedRetail}/{product.unitType.replace('_', ' ')}
          </span>
        </div>
        
        <Separator />
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Supplier:</span>
            <span className="font-medium">{product.supplierName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Lead Time:</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {product.leadTime}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Min Qty:</span>
            <span>{product.minQuantity} {product.unitType.replace('_', ' ')}</span>
          </div>
          {product.vendorCatalogPage && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Catalog:</span>
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {product.vendorCatalogPage}
              </span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="h-4 w-4 mr-1" />
                Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{product.productName}</DialogTitle>
                <DialogDescription>
                  Complete product specifications and ordering information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Product Information</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>SKU:</strong> {product.productCode}</div>
                      <div><strong>Category:</strong> {product.category} / {product.subcategory}</div>
                      <div><strong>Description:</strong> {product.description}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Pricing & Ordering</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Wholesale:</strong> ${product.wholesalePrice} per {product.unitType.replace('_', ' ')}</div>
                      <div><strong>Retail:</strong> ${product.suggestedRetail} per {product.unitType.replace('_', ' ')}</div>
                      <div><strong>Min Order:</strong> {product.minQuantity} {product.unitType.replace('_', ' ')}</div>
                      <div><strong>Pack Size:</strong> {product.packSize}</div>
                    </div>
                  </div>
                </div>
                
                {product.specifications && (
                  <div>
                    <h4 className="font-semibold mb-2">Specifications</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(product.specifications, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold mb-2">Supplier Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Company:</strong> {product.supplierName}</div>
                    <div><strong>Contact:</strong> {product.supplierContact}</div>
                    <div><strong>Phone:</strong> {product.supplierPhone}</div>
                    <div><strong>Email:</strong> {product.supplierEmail}</div>
                    <div><strong>Payment Terms:</strong> {product.paymentTerms}</div>
                    <div><strong>Min Order Amount:</strong> ${product.minOrderAmount}</div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button size="sm" className="flex-1">
            <ShoppingCart className="h-4 w-4 mr-1" />
            Add to Order
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1">
          <div className="p-6 space-y-6" data-testid="vendor-catalog-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Vendor Catalog
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Search and browse wholesale vendor catalogs with exact SKUs for accurate ordering
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {wholesalers.length} Active Suppliers
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="search">Search All</TabsTrigger>
          <TabsTrigger value="frames">Frames</TabsTrigger>
          <TabsTrigger value="mats">Mats</TabsTrigger>
          <TabsTrigger value="glazing">Glazing</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Product Search
              </CardTitle>
              <CardDescription>
                Search across all vendor catalogs by product name, SKU, or description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by product name, SKU, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="search-input"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="frame">Frames</SelectItem>
                    <SelectItem value="mat">Mats</SelectItem>
                    <SelectItem value="glazing">Glazing</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {wholesalers
                      .filter((supplier) => supplier.companyName && supplier.companyName.trim() !== '')
                      .map((supplier, index) => (
                        <SelectItem key={supplier.id || supplier._id || index} value={supplier.companyName}>
                          {supplier.companyName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {isSearching && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Searching catalog...
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {searchResults.length === 0 && (searchQuery || (selectedCategory && selectedCategory !== 'all') || (selectedSupplier && selectedSupplier !== 'all')) && !isSearching && (
            <div className="text-center py-8 text-gray-500">
              No products found matching your search criteria
            </div>
          )}
        </TabsContent>

        <TabsContent value="frames" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Frame Catalog</h2>
            <Badge variant="outline">{frames.length} frames available</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {frames.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mats" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Mat Board Catalog</h2>
            <Badge variant="outline">{mats.length} mat boards available</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mats.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="glazing" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Glazing Catalog</h2>
            <Badge variant="outline">{glazing.length} glazing options available</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {glazing.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Wholesale Suppliers</h2>
            <Badge variant="outline">{wholesalers.length} active suppliers</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wholesalers.map((supplier) => (
              <Card key={supplier.id || supplier._id || supplier.companyName}>
                <CardHeader>
                  <CardTitle>{supplier.companyName}</CardTitle>
                  <CardDescription>{supplier.contactName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Phone:</span>
                    <span>{supplier.phone}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Email:</span>
                    <span>{supplier.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Payment Terms:</span>
                    <span>{supplier.paymentTerms}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Min Order:</span>
                    <span>${supplier.minOrderAmount}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {supplier.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary" className="text-xs">
                        {specialty.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                  {supplier.website && (
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Visit Website
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}