import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Building2, Package, Phone, Mail, Globe, MapPin, Upload, FileText, Download, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const wholesalerSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  specialties: z.array(z.string()).default([]),
  paymentTerms: z.string().optional(),
  minOrderAmount: z.string().optional(),
  notes: z.string().optional(),
});

type WholesalerFormData = z.infer<typeof wholesalerSchema>;

export default function Wholesalers() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWholesaler, setSelectedWholesaler] = useState<number | null>(null);
  const [uploadingCatalog, setUploadingCatalog] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: wholesalers, isLoading } = useQuery({
    queryKey: ["/api/wholesalers"],
  });

  const { data: selectedProducts } = useQuery({
    queryKey: ["/api/wholesalers", selectedWholesaler, "products"],
    enabled: !!selectedWholesaler,
  });

  const form = useForm<WholesalerFormData>({
    resolver: zodResolver(wholesalerSchema),
    defaultValues: {
      specialties: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: WholesalerFormData) => 
      apiRequest("POST", "/api/wholesalers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wholesalers"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Wholesaler added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add wholesaler",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WholesalerFormData) => {
    createMutation.mutate(data);
  };

  const uploadCatalogMutation = useMutation({
    mutationFn: ({ wholesalerId, file }: { wholesalerId: number; file: File }) => {
      const formData = new FormData();
      formData.append('catalog', file);
      return fetch(`/api/wholesalers/${wholesalerId}/upload-catalog`, {
        method: 'POST',
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wholesalers"] });
      setUploadingCatalog(null);
      toast({
        title: "Success",
        description: "Catalog uploaded successfully",
      });
    },
    onError: () => {
      setUploadingCatalog(null);
      toast({
        title: "Error",
        description: "Failed to upload catalog",
        variant: "destructive",
      });
    },
  });

  const deleteCatalogMutation = useMutation({
    mutationFn: (wholesalerId: number) => 
      apiRequest("DELETE", `/api/wholesalers/${wholesalerId}/catalog`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wholesalers"] });
      toast({
        title: "Success",
        description: "Catalog deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete catalog",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (wholesalerId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingCatalog(wholesalerId);
      uploadCatalogMutation.mutate({ wholesalerId, file });
    }
  };

  const downloadCatalog = (wholesalerId: number, fileName: string) => {
    const link = document.createElement('a');
    link.href = `/api/wholesalers/${wholesalerId}/download-catalog`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const specialtyOptions = [
    "wood_frames",
    "metal_frames", 
    "mats",
    "glazing",
    "hardware",
    "conservation_materials"
  ];

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Wholesalers</h1>
                <p className="text-muted-foreground">
                  Manage your supplier relationships and product catalogs
                </p>
              </div>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Wholesaler
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Wholesaler</DialogTitle>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4 dialog-form">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Premium Frame Supply Co." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Smith" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="(555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="sales@company.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://company.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Company address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="paymentTerms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Terms</FormLabel>
                              <FormControl>
                                <Input placeholder="Net 30, COD, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="minOrderAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Min Order Amount ($)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Specialties</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {specialtyOptions.map((specialty) => (
                            <label key={specialty} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                value={specialty}
                                onChange={(e) => {
                                  const currentSpecialties = form.getValues("specialties");
                                  if (e.target.checked) {
                                    form.setValue("specialties", [...currentSpecialties, specialty]);
                                  } else {
                                    form.setValue("specialties", currentSpecialties.filter(s => s !== specialty));
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="text-sm capitalize">{specialty.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Additional notes about this wholesaler" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={createMutation.isPending}>
                          Add Wholesaler
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDialogOpen(false);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Tabs defaultValue="list" className="space-y-4">
              <TabsList>
                <TabsTrigger value="list">Wholesaler List</TabsTrigger>
                <TabsTrigger value="products" disabled={!selectedWholesaler}>
                  Product Catalog
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Wholesaler Directory
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div>Loading wholesalers...</div>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {(wholesalers as any[])?.map((wholesaler: any) => (
                          <Card 
                            key={wholesaler.id} 
                            className="cursor-pointer transition-all hover:shadow-md"
                            onClick={() => setSelectedWholesaler(wholesaler.id)}
                          >
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">{wholesaler.companyName}</CardTitle>
                              {wholesaler.contactName && (
                                <p className="text-sm text-muted-foreground">
                                  Contact: {wholesaler.contactName}
                                </p>
                              )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {wholesaler.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
                                  {wholesaler.phone}
                                </div>
                              )}
                              
                              {wholesaler.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="w-4 h-4 text-muted-foreground" />
                                  {wholesaler.email}
                                </div>
                              )}

                              {wholesaler.website && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Globe className="w-4 h-4 text-muted-foreground" />
                                  <a 
                                    href={wholesaler.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Website
                                  </a>
                                </div>
                              )}

                              {wholesaler.address && (
                                <div className="flex items-start gap-2 text-sm">
                                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                  <span className="text-muted-foreground">{wholesaler.address}</span>
                                </div>
                              )}

                              {wholesaler.specialties && wholesaler.specialties.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-2">
                                  {wholesaler.specialties.map((specialty: string) => (
                                    <Badge key={specialty} variant="secondary" className="text-xs">
                                      {specialty.replace('_', ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              <div className="pt-2 space-y-1 text-sm text-muted-foreground">
                                {wholesaler.paymentTerms && (
                                  <div>Payment Terms: {wholesaler.paymentTerms}</div>
                                )}
                                {wholesaler.minOrderAmount && (
                                  <div>Min Order: {formatCurrency(wholesaler.minOrderAmount)}</div>
                                )}
                              </div>

                              {/* Catalog Upload Section */}
                              <div className="pt-3 border-t bg-muted/20 rounded-b-lg -mx-6 -mb-6 px-6 pb-6">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium">
                                      Digital Price Catalog
                                    </span>
                                  </div>
                                  {wholesaler.catalogFileName ? (
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          downloadCatalog(wholesaler.id, wholesaler.catalogFileName);
                                        }}
                                        title="Download catalog"
                                      >
                                        <Download className="w-4 h-4 mr-1" />
                                        Download
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteCatalogMutation.mutate(wholesaler.id);
                                        }}
                                        title="Delete catalog"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      <input
                                        type="file"
                                        accept=".pdf,.xlsx,.xls,.csv"
                                        onChange={(e) => handleFileUpload(wholesaler.id, e)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={uploadingCatalog === wholesaler.id}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={uploadingCatalog === wholesaler.id}
                                        title="Upload catalog (PDF, Excel, CSV)"
                                        className="border-dashed"
                                      >
                                        <Upload className="w-4 h-4 mr-1" />
                                        Upload Catalog
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                
                                {wholesaler.catalogFileName ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-3 h-3 text-green-600" />
                                      <span className="text-sm font-medium text-green-700">
                                        {wholesaler.catalogFileName}
                                      </span>
                                    </div>
                                    {wholesaler.catalogUploadedAt && (
                                      <div className="text-xs text-muted-foreground pl-5">
                                        Uploaded: {new Date(wholesaler.catalogUploadedAt).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    Upload pricing catalogs in PDF, Excel, or CSV format (max 50MB)
                                  </div>
                                )}
                                
                                {uploadingCatalog === wholesaler.id && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
                                    <span className="text-xs text-primary">Uploading catalog...</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Product Catalog
                      {selectedWholesaler && (
                        <span className="text-base text-muted-foreground">
                          - {(wholesalers as any[])?.find((w: any) => w.id === selectedWholesaler)?.companyName}
                        </span>
                      )}
                    </CardTitle>
                    <div className="mt-4">
                      <Input
                        placeholder="Search products by code or name (e.g., 210286)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedProducts && (selectedProducts as any[]).length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product Code</TableHead>
                              <TableHead>Product Name</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Unit Type</TableHead>
                              <TableHead>Wholesale Price</TableHead>
                              <TableHead>Suggested Retail</TableHead>
                              <TableHead>Min Quantity</TableHead>
                              <TableHead>Lead Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(selectedProducts as any[])
                              .filter((product: any) => 
                                !searchQuery || 
                                product.productCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                product.productName?.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                              .map((product: any) => (
                              <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.productCode}</TableCell>
                                <TableCell>{product.productName}</TableCell>
                                <TableCell className="capitalize">{product.category}</TableCell>
                                <TableCell className="capitalize">
                                  {product.unitType.replace('_', ' ')}
                                </TableCell>
                                <TableCell>{formatCurrency(product.wholesalePrice)}</TableCell>
                                <TableCell>
                                  {product.suggestedRetail 
                                    ? formatCurrency(product.suggestedRetail) 
                                    : "-"}
                                </TableCell>
                                <TableCell>{product.minQuantity}</TableCell>
                                <TableCell>{product.leadTime || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        {selectedWholesaler 
                          ? "No products available for this wholesaler" 
                          : "Select a wholesaler to view their product catalog"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}