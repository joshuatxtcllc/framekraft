import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, Building2, Package, Phone, Mail, Globe, MapPin, Upload, 
  FileText, Download, Trash2, Edit, MoreVertical, Search, X, FileSpreadsheet
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CSVUploadModal from "@/components/wholesalers/CSVUploadModal";

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

const productSchema = z.object({
  productCode: z.string().min(1, "Product code is required"),
  productName: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  unitType: z.string().default("linear_foot"),
  wholesalePrice: z.string().min(1, "Wholesale price is required"),
  suggestedRetail: z.string().optional(),
  minQuantity: z.string().default("1"),
  packSize: z.string().default("1"),
  leadTime: z.string().optional(),
  stockStatus: z.string().default("available"),
});

type WholesalerFormData = z.infer<typeof wholesalerSchema>;
type ProductFormData = z.infer<typeof productSchema>;

export default function Wholesalers() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWholesaler, setEditingWholesaler] = useState<any>(null);
  const [selectedWholesaler, setSelectedWholesaler] = useState<string | null>(null);
  const [uploadingCatalog, setUploadingCatalog] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [csvUploadOpen, setCsvUploadOpen] = useState(false);
  const [csvUploadWholesaler, setCsvUploadWholesaler] = useState<{ id: string; name: string } | null>(null);
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

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      unitType: "linear_foot",
      minQuantity: "1",
      packSize: "1",
      stockStatus: "available",
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WholesalerFormData }) => 
      apiRequest("PUT", `/api/wholesalers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wholesalers"] });
      setDialogOpen(false);
      setEditingWholesaler(null);
      form.reset();
      toast({
        title: "Success",
        description: "Wholesaler updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update wholesaler",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/wholesalers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wholesalers"] });
      if (selectedWholesaler === deleteMutation.variables) {
        setSelectedWholesaler(null);
        setActiveTab("list");
      }
      toast({
        title: "Success",
        description: "Wholesaler deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete wholesaler",
        variant: "destructive",
      });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (data: ProductFormData) => 
      apiRequest("POST", `/api/wholesalers/${selectedWholesaler}/products`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wholesalers", selectedWholesaler, "products"] });
      setProductDialogOpen(false);
      productForm.reset();
      toast({
        title: "Success",
        description: "Product added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) => 
      apiRequest("PUT", `/api/wholesalers/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wholesalers", selectedWholesaler, "products"] });
      setProductDialogOpen(false);
      setEditingProduct(null);
      productForm.reset();
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/wholesalers/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wholesalers", selectedWholesaler, "products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WholesalerFormData) => {
    if (editingWholesaler) {
      updateMutation.mutate({ id: editingWholesaler._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const onProductSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct._id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const uploadCatalogMutation = useMutation({
    mutationFn: ({ wholesalerId, file }: { wholesalerId: string; file: File }) => {
      const formData = new FormData();
      formData.append('catalog', file);
      return fetch(`/api/wholesalers/${wholesalerId}/upload-catalog`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }).then(res => {
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
      });
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
    mutationFn: (wholesalerId: string) => 
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

  const handleFileUpload = (wholesalerId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingCatalog(wholesalerId);
      uploadCatalogMutation.mutate({ wholesalerId, file });
    }
  };

  const downloadCatalog = (wholesalerId: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `/api/wholesalers/${wholesalerId}/download-catalog`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditWholesaler = (wholesaler: any) => {
    setEditingWholesaler(wholesaler);
    form.reset({
      companyName: wholesaler.companyName,
      contactName: wholesaler.contactName || "",
      email: wholesaler.email || "",
      phone: wholesaler.phone || "",
      website: wholesaler.website || "",
      address: wholesaler.address || "",
      specialties: wholesaler.specialties || [],
      paymentTerms: wholesaler.paymentTerms || "",
      minOrderAmount: wholesaler.minOrderAmount?.toString() || "",
      notes: wholesaler.notes || "",
    });
    setDialogOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    productForm.reset({
      productCode: product.productCode,
      productName: product.productName,
      category: product.category,
      subcategory: product.subcategory || "",
      description: product.description || "",
      unitType: product.unitType || "linear_foot",
      wholesalePrice: product.wholesalePrice.toString(),
      suggestedRetail: product.suggestedRetail?.toString() || "",
      minQuantity: product.minQuantity?.toString() || "1",
      packSize: product.packSize?.toString() || "1",
      leadTime: product.leadTime || "",
      stockStatus: product.stockStatus || "available",
    });
    setProductDialogOpen(true);
  };

  const specialtyOptions = [
    "wood_frames",
    "metal_frames", 
    "mats",
    "glazing",
    "hardware",
    "conservation_materials"
  ];

  const categoryOptions = [
    "frame",
    "mat",
    "glazing",
    "hardware",
    "mounting",
    "other"
  ];

  const unitTypeOptions = [
    { value: "linear_foot", label: "Linear Foot" },
    { value: "square_foot", label: "Square Foot" },
    { value: "each", label: "Each" },
    { value: "box", label: "Box" },
    { value: "sheet", label: "Sheet" },
    { value: "roll", label: "Roll" },
  ];

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
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
              
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                  setEditingWholesaler(null);
                  form.reset();
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Wholesaler
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingWholesaler ? "Edit Wholesaler" : "Add New Wholesaler"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name *</FormLabel>
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
                        <div className="grid grid-cols-2 gap-2">
                          {specialtyOptions.map((specialty) => (
                            <label key={specialty} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                value={specialty}
                                checked={form.watch("specialties")?.includes(specialty)}
                                onChange={(e) => {
                                  const currentSpecialties = form.getValues("specialties") || [];
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

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDialogOpen(false);
                            setEditingWholesaler(null);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                          {editingWholesaler ? "Update" : "Add"} Wholesaler
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="list">Wholesaler List</TabsTrigger>
                <TabsTrigger value="products" disabled={!selectedWholesaler}>
                  Product Catalog {selectedWholesaler && `(${(wholesalers as any[])?.find((w: any) => w._id === selectedWholesaler)?.companyName})`}
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
                      <div className="text-center py-8">Loading wholesalers...</div>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {(wholesalers as any[])?.map((wholesaler: any) => (
                          <Card 
                            key={wholesaler._id} 
                            className="cursor-pointer transition-all hover:shadow-md relative"
                          >
                            <div className="absolute top-2 right-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditWholesaler(wholesaler)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedWholesaler(wholesaler._id);
                                      setActiveTab("products");
                                    }}
                                  >
                                    <Package className="mr-2 h-4 w-4" />
                                    View Products
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setCsvUploadWholesaler({ id: wholesaler._id, name: wholesaler.companyName });
                                      setCsvUploadOpen(true);
                                    }}
                                  >
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Import CSV
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete ${wholesaler.companyName}?`)) {
                                        deleteMutation.mutate(wholesaler._id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <CardHeader 
                              className="pb-3"
                              onClick={() => {
                                setSelectedWholesaler(wholesaler._id);
                                setActiveTab("products");
                              }}
                            >
                              <CardTitle className="text-lg pr-8">{wholesaler.companyName}</CardTitle>
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
                                  <div>Payment: {wholesaler.paymentTerms}</div>
                                )}
                                {wholesaler.minOrderAmount && (
                                  <div>Min Order: {formatCurrency(wholesaler.minOrderAmount)}</div>
                                )}
                              </div>

                              {/* Catalog Upload Section */}
                              <div className="pt-3 border-t">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Catalog</span>
                                  </div>
                                  {wholesaler.catalogFileName ? (
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          downloadCatalog(wholesaler._id, wholesaler.catalogFileName);
                                        }}
                                      >
                                        <Download className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (confirm("Delete this catalog?")) {
                                            deleteCatalogMutation.mutate(wholesaler._id);
                                          }
                                        }}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      <input
                                        type="file"
                                        accept=".pdf,.xlsx,.xls,.csv"
                                        onChange={(e) => handleFileUpload(wholesaler._id, e)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={uploadingCatalog === wholesaler._id}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={uploadingCatalog === wholesaler._id}
                                        className="pointer-events-none"
                                      >
                                        <Upload className="w-3 h-3 mr-1" />
                                        Upload
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                
                                {wholesaler.catalogFileName && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    {wholesaler.catalogFileName}
                                  </div>
                                )}
                                
                                {uploadingCatalog === wholesaler._id && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />
                                    <span className="text-xs">Uploading...</span>
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
                    <div className="flex justify-between items-start">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Product Catalog
                      </CardTitle>
                      {selectedWholesaler && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const wholesaler = (wholesalers as any[])?.find((w: any) => w._id === selectedWholesaler);
                              if (wholesaler) {
                                setCsvUploadWholesaler({ id: wholesaler._id, name: wholesaler.companyName });
                                setCsvUploadOpen(true);
                              }
                            }}
                          >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Import CSV
                          </Button>
                          <Dialog open={productDialogOpen} onOpenChange={(open) => {
                            setProductDialogOpen(open);
                            if (!open) {
                              setEditingProduct(null);
                              productForm.reset();
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Product
                              </Button>
                            </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                {editingProduct ? "Edit Product" : "Add New Product"}
                              </DialogTitle>
                            </DialogHeader>
                            
                            <Form {...productForm}>
                              <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={productForm.control}
                                    name="productCode"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Product Code *</FormLabel>
                                        <FormControl>
                                          <Input placeholder="SKU or Part Number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={productForm.control}
                                    name="productName"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Product Name *</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Product name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={productForm.control}
                                    name="category"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Category *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {categoryOptions.map((cat) => (
                                              <SelectItem key={cat} value={cat}>
                                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={productForm.control}
                                    name="subcategory"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Subcategory</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Optional subcategory" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <FormField
                                  control={productForm.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="Product description" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="grid grid-cols-3 gap-4">
                                  <FormField
                                    control={productForm.control}
                                    name="unitType"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Unit Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {unitTypeOptions.map((unit) => (
                                              <SelectItem key={unit.value} value={unit.value}>
                                                {unit.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={productForm.control}
                                    name="wholesalePrice"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Wholesale Price *</FormLabel>
                                        <FormControl>
                                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={productForm.control}
                                    name="suggestedRetail"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Suggested Retail</FormLabel>
                                        <FormControl>
                                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <FormField
                                    control={productForm.control}
                                    name="minQuantity"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Min Quantity</FormLabel>
                                        <FormControl>
                                          <Input type="number" placeholder="1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={productForm.control}
                                    name="packSize"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Pack Size</FormLabel>
                                        <FormControl>
                                          <Input type="number" placeholder="1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={productForm.control}
                                    name="leadTime"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Lead Time</FormLabel>
                                        <FormControl>
                                          <Input placeholder="e.g., 2-3 days" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <FormField
                                  control={productForm.control}
                                  name="stockStatus"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Stock Status</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="available">Available</SelectItem>
                                          <SelectItem value="low_stock">Low Stock</SelectItem>
                                          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                                          <SelectItem value="discontinued">Discontinued</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <DialogFooter>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setProductDialogOpen(false);
                                      setEditingProduct(null);
                                      productForm.reset();
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={createProductMutation.isPending || updateProductMutation.isPending}>
                                    {editingProduct ? "Update" : "Add"} Product
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search products by code or name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 max-w-md"
                        />
                      </div>
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
                              <TableHead>Min Qty</TableHead>
                              <TableHead>Lead Time</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
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
                              <TableRow key={product._id}>
                                <TableCell className="font-medium">{product.productCode}</TableCell>
                                <TableCell>{product.productName}</TableCell>
                                <TableCell className="capitalize">{product.category}</TableCell>
                                <TableCell className="capitalize">
                                  {product.unitType?.replace('_', ' ')}
                                </TableCell>
                                <TableCell>{formatCurrency(product.wholesalePrice)}</TableCell>
                                <TableCell>
                                  {product.suggestedRetail 
                                    ? formatCurrency(product.suggestedRetail) 
                                    : "-"}
                                </TableCell>
                                <TableCell>{product.minQuantity || 1}</TableCell>
                                <TableCell>{product.leadTime || "-"}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    product.stockStatus === 'available' ? 'default' :
                                    product.stockStatus === 'low_stock' ? 'secondary' :
                                    'destructive'
                                  }>
                                    {product.stockStatus?.replace('_', ' ') || 'available'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        className="text-destructive"
                                        onClick={() => {
                                          if (confirm(`Delete product ${product.productCode}?`)) {
                                            deleteProductMutation.mutate(product._id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        {selectedWholesaler 
                          ? "No products available. Click 'Add Product' to get started." 
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
      
      {csvUploadWholesaler && (
        <CSVUploadModal
          open={csvUploadOpen}
          onOpenChange={setCsvUploadOpen}
          wholesalerId={csvUploadWholesaler.id}
          wholesalerName={csvUploadWholesaler.name}
        />
      )}
    </div>
  );
}