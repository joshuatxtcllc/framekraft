import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  FileSpreadsheet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const uploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.name.endsWith('.csv'),
    "File must be a CSV"
  ),
  updateExisting: z.boolean().default(false),
  skipDuplicates: z.boolean().default(true),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface CSVUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wholesalerId: string;
  wholesalerName: string;
}

interface ValidationResult {
  valid: number;
  invalid: number;
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
    status: 'valid' | 'invalid' | 'duplicate';
  }>;
}

export default function CSVUploadModal({
  open,
  onOpenChange,
  wholesalerId,
  wholesalerName,
}: CSVUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("upload");
  const { toast } = useToast();

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      updateExisting: false,
      skipDuplicates: true,
    },
  });

  // Validate CSV mutation
  const validateMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("csv", file);
      formData.append("wholesalerId", wholesalerId);
      
      const response = await fetch(`/api/wholesalers/${wholesalerId}/validate-csv`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to validate CSV");
      }
      
      return response.json();
    },
    onSuccess: (data: ValidationResult) => {
      setValidationResult(data);
      setActiveTab("preview");
      if (data.warnings.length > 0) {
        toast({
          title: "Validation Complete",
          description: `Found ${data.valid} valid products and ${data.invalid} invalid products`,
          variant: data.invalid > 0 ? "destructive" : "default",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Import CSV mutation
  const importMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      const formData = new FormData();
      formData.append("csv", data.file);
      formData.append("wholesalerId", wholesalerId);
      formData.append("updateExisting", data.updateExisting.toString());
      formData.append("skipDuplicates", data.skipDuplicates.toString());
      
      const response = await fetch(`/api/wholesalers/${wholesalerId}/import-csv`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to import CSV");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wholesalers", wholesalerId, "products"] });
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.imported} products`,
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

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/api/wholesalers/csv-template';
    link.download = 'product_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExample = () => {
    const link = document.createElement('a');
    link.href = '/api/wholesalers/csv-example';
    link.download = 'product_import_example.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onSubmit = (data: UploadFormData) => {
    if (validationResult && validationResult.valid > 0) {
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

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetModal();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import Products from CSV - {wholesalerName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="preview" disabled={!validationResult}>
              Preview ({validationResult?.valid || 0})
            </TabsTrigger>
            <TabsTrigger value="errors" disabled={!validationResult || validationResult.invalid === 0}>
              Errors ({validationResult?.invalid || 0})
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <TabsContent value="upload" className="space-y-4 flex-1 overflow-auto">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>CSV Format Requirements</AlertTitle>
                  <AlertDescription className="space-y-2 mt-2">
                    <div>Your CSV file must include these required columns:</div>
                    <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                      <li><strong>Product Code</strong> - Unique SKU or part number</li>
                      <li><strong>Product Name</strong> - Name of the product</li>
                      <li><strong>Category</strong> - frame, mat, glazing, hardware, mounting, or other</li>
                      <li><strong>Unit Type</strong> - linear_foot, square_foot, each, box, sheet, or roll</li>
                      <li><strong>Wholesale Price</strong> - Numeric price value</li>
                    </ul>
                    <div className="flex gap-2 mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadTemplate}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Template
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadExample}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Download Example
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>

                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
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
                          <p className="text-sm text-muted-foreground">Validating CSV...</p>
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
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium">Drop your CSV file here</p>
                        <p className="text-sm text-muted-foreground">or click to browse</p>
                      </div>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="updateExisting"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Update Existing Products</FormLabel>
                          <FormDescription>
                            Update prices and details for products that already exist (matched by product code)
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="skipDuplicates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Skip Duplicate Products</FormLabel>
                          <FormDescription>
                            Skip products that already exist in the catalog (unless update is enabled)
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 overflow-hidden">
                {validationResult && (
                  <div className="space-y-4 h-full flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {validationResult.valid} Valid
                        </Badge>
                        {validationResult.invalid > 0 && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            {validationResult.invalid} Invalid
                          </Badge>
                        )}
                      </div>
                    </div>

                    {validationResult.warnings.length > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Warnings</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                            {validationResult.warnings.slice(0, 5).map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                            {validationResult.warnings.length > 5 && (
                              <li>...and {validationResult.warnings.length - 5} more warnings</li>
                            )}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    <ScrollArea className="flex-1 border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Product Code</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResult.preview.map((product, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                {product.status === 'valid' ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : product.status === 'duplicate' ? (
                                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {product.productCode}
                              </TableCell>
                              <TableCell>{product.productName}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{product.category}</Badge>
                              </TableCell>
                              <TableCell>${product.wholesalePrice}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
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
                <Button
                  type="submit"
                  disabled={
                    !validationResult ||
                    validationResult.valid === 0 ||
                    importMutation.isPending
                  }
                >
                  {importMutation.isPending ? (
                    <>Importing...</>
                  ) : (
                    <>Import {validationResult?.valid || 0} Products</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}