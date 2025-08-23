import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  FileSpreadsheet,
  Package,
  DollarSign,
  Box,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const catalogUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.name.endsWith('.csv'),
    "File must be a CSV"
  ),
  importMode: z.enum(["replace", "append", "update"]),
});

type CatalogUploadFormData = z.infer<typeof catalogUploadSchema>;

interface CatalogCSVUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wholesalerId: string;
  wholesalerName: string;
}

interface CatalogStats {
  totalProducts: number;
  categories: { [key: string]: number };
  priceRange: { min: number; max: number };
  lastUpdated?: string;
}

interface ValidationResult {
  valid: number;
  invalid: number;
  duplicates: number;
  warnings: string[];
  errors: Array<{
    row: number;
    errors: string[];
  }>;
  preview: Array<{
    productCode: string;
    productName: string;
    category: string;
    wholesalePrice: number;
    suggestedRetail?: number;
    status: 'valid' | 'invalid' | 'duplicate' | 'update';
  }>;
  stats: {
    categories: { [key: string]: number };
    priceRange: { min: number; max: number };
  };
}

export default function CatalogCSVUploadModal({
  open,
  onOpenChange,
  wholesalerId,
  wholesalerName,
}: CatalogCSVUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("upload");
  const { toast } = useToast();

  // Fetch current catalog stats
  const { data: catalogStats } = useQuery<CatalogStats>({
    queryKey: ["/api/wholesalers", wholesalerId, "catalog-stats"],
    enabled: open,
  });

  const form = useForm<CatalogUploadFormData>({
    resolver: zodResolver(catalogUploadSchema),
    defaultValues: {
      importMode: "replace",
    },
  });

  // Validate catalog CSV mutation
  const validateMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("csv", file);
      formData.append("wholesalerId", wholesalerId);
      
      const response = await fetch(`/api/wholesalers/${wholesalerId}/validate-catalog`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to validate catalog");
      }
      
      return response.json();
    },
    onSuccess: (data: ValidationResult) => {
      setValidationResult(data);
      setActiveTab("preview");
      
      const message = `Found ${data.valid} valid products`;
      const hasIssues = data.invalid > 0 || data.duplicates > 0;
      
      toast({
        title: "Validation Complete",
        description: hasIssues 
          ? `${message}, ${data.invalid} invalid, ${data.duplicates} duplicates`
          : message,
        variant: hasIssues ? "destructive" : "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Import catalog CSV mutation
  const importMutation = useMutation({
    mutationFn: async (data: CatalogUploadFormData) => {
      const formData = new FormData();
      formData.append("csv", data.file);
      formData.append("wholesalerId", wholesalerId);
      formData.append("importMode", data.importMode);
      
      const response = await fetch(`/api/wholesalers/${wholesalerId}/import-catalog`, {
        method: "POST",
        body: formData,
        credentials: "include",
        
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to import catalog");
      }
      
      // Stream progress updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(Boolean);
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.progress) {
                setUploadProgress(data.progress);
              }
            } catch {}
          }
        }
      }
      
      return { imported: validationResult?.valid || 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wholesalers", wholesalerId, "products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wholesalers", wholesalerId, "catalog-stats"] });
      
      toast({
        title: "Catalog Import Successful",
        description: `Successfully imported ${data.imported} products to the catalog`,
      });
      
      onOpenChange(false);
      resetModal();
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear catalog mutation
  const clearCatalogMutation = useMutation({
    mutationFn: () => 
      apiRequest("DELETE", `/api/wholesalers/${wholesalerId}/catalog-products`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wholesalers", wholesalerId] });
      toast({
        title: "Catalog Cleared",
        description: "All products have been removed from the catalog",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear catalog",
        variant: "destructive",
      });
    },
  });

  // Export catalog mutation
  const exportCatalogMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/wholesalers/${wholesalerId}/export-catalog`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to export catalog");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${wholesalerName.replace(/\s+/g, '_')}_catalog_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Export Successful",
        description: "Catalog has been exported as CSV",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export catalog",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      form.setValue("file", selectedFile);
      validateMutation.mutate(selectedFile);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      form.setValue("file", droppedFile);
      validateMutation.mutate(droppedFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/wholesalers/catalog-template', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download template');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'catalog_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: CatalogUploadFormData) => {
    if (validationResult && validationResult.valid > 0) {
      if (data.importMode === "replace" && catalogStats?.totalProducts && catalogStats.totalProducts > 0) {
        if (!confirm(`This will replace all ${catalogStats.totalProducts} existing products. Continue?`)) {
          return;
        }
      }
      importMutation.mutate(data);
    }
  };

  const resetModal = () => {
    setFile(null);
    setValidationResult(null);
    setUploadProgress(0);
    setActiveTab("upload");
    form.reset();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetModal();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-5xl h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Catalog Management - {wholesalerName}
          </DialogTitle>
          <DialogDescription>
            Upload, manage, and export your complete product catalog
          </DialogDescription>
        </DialogHeader>

        {catalogStats && catalogStats.totalProducts > 0 && (
          <Alert className="mb-4">
            <Package className="h-4 w-4" />
            <AlertTitle>Current Catalog</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <div className="flex justify-between text-sm">
                <span>Total Products: <strong>{catalogStats.totalProducts}</strong></span>
                <span>Price Range: <strong>{formatCurrency(catalogStats.priceRange.min)} - {formatCurrency(catalogStats.priceRange.max)}</strong></span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(catalogStats.categories).map(([category, count]) => (
                  <Badge key={category} variant="secondary">
                    {category}: {count}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportCatalogMutation.mutate()}
                  disabled={exportCatalogMutation.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Current
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm(`Delete all ${catalogStats.totalProducts} products from the catalog?`)) {
                      clearCatalogMutation.mutate();
                    }
                  }}
                  disabled={clearCatalogMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Catalog
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="preview" disabled={!validationResult}>
              Preview ({validationResult?.valid || 0})
            </TabsTrigger>
            <TabsTrigger value="stats" disabled={!validationResult}>
              Statistics
            </TabsTrigger>
            <TabsTrigger value="errors" disabled={!validationResult || validationResult.invalid === 0}>
              Errors ({validationResult?.invalid || 0})
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
              <TabsContent value="upload" className="space-y-4 flex-1 overflow-auto">
                <div className="flex justify-between items-start gap-4">
                  <Alert className="flex-1">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Catalog CSV Format</AlertTitle>
                    <AlertDescription className="space-y-2 mt-2">
                      <div>Upload your complete product catalog with all details:</div>
                      <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                        <li><strong>Product Code</strong> - Unique SKU/Part Number</li>
                        <li><strong>Product Name</strong> - Product description</li>
                        <li><strong>Category</strong> - Product category</li>
                        <li><strong>Unit Type</strong> - Pricing unit</li>
                        <li><strong>Wholesale Price</strong> - Your cost</li>
                        <li><strong>Suggested Retail</strong> - MSRP (optional)</li>
                        <li>Plus: quantities, lead times, specifications, etc.</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        downloadTemplate();
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          const response = await fetch('/api/wholesalers/csv-example', {
                            credentials: 'include',
                          });
                          
                          if (!response.ok) {
                            throw new Error('Failed to download example');
                          }
                          
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'catalog_example.csv';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          toast({
                            title: "Download Failed",
                            description: "Failed to download example",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download Example
                    </Button>
                  </div>
                </div>

                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors relative"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  {file ? (
                    <div className="space-y-4">
                      <FileSpreadsheet className="w-12 h-12 mx-auto text-primary" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      {validateMutation.isPending && (
                        <div className="space-y-2">
                          <Progress value={30} className="w-full max-w-xs mx-auto" />
                          <p className="text-sm text-muted-foreground">Validating catalog...</p>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFile(null);
                          setValidationResult(null);
                          form.setValue("file", undefined as any);
                        }}
                      >
                        Remove File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium">Drop your catalog CSV here</p>
                        <p className="text-sm text-muted-foreground">or click to browse</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="importMode"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Import Mode</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="space-y-2"
                        >
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value="replace" id="replace" />
                            <div className="space-y-1">
                              <label htmlFor="replace" className="font-medium cursor-pointer">
                                Replace Entire Catalog
                              </label>
                              <p className="text-sm text-muted-foreground">
                                Remove all existing products and import new catalog
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value="append" id="append" />
                            <div className="space-y-1">
                              <label htmlFor="append" className="font-medium cursor-pointer">
                                Add to Existing Catalog
                              </label>
                              <p className="text-sm text-muted-foreground">
                                Keep existing products and add new ones (skip duplicates)
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value="update" id="update" />
                            <div className="space-y-1">
                              <label htmlFor="update" className="font-medium cursor-pointer">
                                Update & Add Products
                              </label>
                              <p className="text-sm text-muted-foreground">
                                Update existing products (by code) and add new ones
                              </p>
                            </div>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="preview" className="flex-1 min-h-0 flex flex-col">
                {validationResult && (
                  <>
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                      <div className="flex gap-4">
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {validationResult.valid} Valid
                        </Badge>
                        {validationResult.duplicates > 0 && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            {validationResult.duplicates} Duplicates
                          </Badge>
                        )}
                        {validationResult.invalid > 0 && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            {validationResult.invalid} Invalid
                          </Badge>
                        )}
                      </div>
                      <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={
                          !validationResult ||
                          validationResult.valid === 0 ||
                          importMutation.isPending
                        }
                        size="sm"
                      >
                        {importMutation.isPending ? (
                          <>Importing...</>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Import {validationResult?.valid || 0} Products
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex-1 min-h-0 border rounded-lg overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background border-b">
                          <TableRow>
                            <TableHead className="w-[50px]">Status</TableHead>
                            <TableHead className="min-w-[120px]">Product Code</TableHead>
                            <TableHead className="min-w-[200px]">Product Name</TableHead>
                            <TableHead className="min-w-[100px]">Category</TableHead>
                            <TableHead className="min-w-[100px]">Wholesale</TableHead>
                            <TableHead className="min-w-[100px]">Retail</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResult.preview.map((product, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                {product.status === 'valid' ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : product.status === 'duplicate' ? (
                                  <RefreshCw className="w-4 h-4 text-blue-500" />
                                ) : product.status === 'update' ? (
                                  <RefreshCw className="w-4 h-4 text-yellow-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {product.productCode}
                              </TableCell>
                              <TableCell className="text-sm">
                                {product.productName}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {product.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatCurrency(product.wholesalePrice)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {product.suggestedRetail 
                                  ? formatCurrency(product.suggestedRetail)
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="stats" className="flex-1 overflow-auto">
                {validationResult && (
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={
                          !validationResult ||
                          validationResult.valid === 0 ||
                          importMutation.isPending
                        }
                        size="sm"
                      >
                        {importMutation.isPending ? (
                          <>Importing...</>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Import {validationResult?.valid || 0} Products
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Price Range</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatCurrency(validationResult.stats.priceRange.min)}
                          </div>
                          <p className="text-xs text-muted-foreground">Minimum</p>
                          <div className="text-2xl font-bold mt-2">
                            {formatCurrency(validationResult.stats.priceRange.max)}
                          </div>
                          <p className="text-xs text-muted-foreground">Maximum</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Categories</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {Object.entries(validationResult.stats.categories).map(([category, count]) => (
                            <div key={category} className="flex justify-between">
                              <span className="text-sm capitalize">{category}</span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>

                    {validationResult.warnings.length > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Warnings</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                            {validationResult.warnings.map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="errors" className="flex-1 overflow-hidden">
                {validationResult && validationResult.errors.length > 0 && (
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      {validationResult.errors.map((error, idx) => (
                        <Alert key={idx} variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertTitle>Row {error.row}</AlertTitle>
                          <AlertDescription>
                            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                              {error.errors.map((err, errIdx) => (
                                <li key={errIdx}>{err}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                {importMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Progress value={uploadProgress} className="w-32" />
                    <span className="text-sm">{uploadProgress}%</span>
                  </div>
                ) : (
                  <Button
                    type="submit"
                    disabled={
                      !validationResult ||
                      validationResult.valid === 0 ||
                      importMutation.isPending
                    }
                  >
                    Import {validationResult?.valid || 0} Products
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Card components (simple versions if not imported)
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>;
}

function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
}

function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
}

function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}