import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, DollarSign, Calculator } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const priceSchema = z.object({
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  itemName: z.string().min(1, "Item name is required"),
  unitType: z.enum(["linear_foot", "square_foot", "each"]),
  basePrice: z.string().min(1, "Base price is required"),
  markupPercentage: z.string().min(1, "Markup percentage is required"),
  retailPrice: z.string().min(1, "Retail price is required"),
  notes: z.string().optional(),
});

type PriceFormData = z.infer<typeof priceSchema>;

export default function Pricing() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<any>(null);
  const { toast } = useToast();

  const { data: priceStructure, isLoading } = useQuery({
    queryKey: ["/api/pricing/structure"],
  });

  const form = useForm<PriceFormData>({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      category: "frame",
      unitType: "linear_foot",
      markupPercentage: "50.00",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PriceFormData) => 
      apiRequest("POST", "/api/pricing/structure", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing/structure"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Price item created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create price item",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PriceFormData }) =>
      apiRequest("PUT", `/api/pricing/structure/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing/structure"] });
      setDialogOpen(false);
      setEditingPrice(null);
      form.reset();
      toast({
        title: "Success",
        description: "Price item updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update price item",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PriceFormData) => {
    if (editingPrice) {
      updateMutation.mutate({ id: editingPrice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (price: any) => {
    setEditingPrice(price);
    form.reset({
      category: price.category,
      subcategory: price.subcategory || "",
      itemName: price.itemName,
      unitType: price.unitType,
      basePrice: price.basePrice,
      markupPercentage: price.markupPercentage,
      retailPrice: price.retailPrice,
      notes: price.notes || "",
    });
    setDialogOpen(true);
  };

  const calculateRetailPrice = () => {
    const basePrice = parseFloat(form.watch("basePrice") || "0");
    const markup = parseFloat(form.watch("markupPercentage") || "0");
    const retailPrice = basePrice * (1 + markup / 100);
    form.setValue("retailPrice", retailPrice.toFixed(2));
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
                <h1 className="text-3xl font-bold text-foreground">Price Structure</h1>
                <p className="text-muted-foreground">
                  Manage your pricing for frames, materials, and services
                </p>
              </div>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingPrice(null);
                    form.reset({
                      category: "frame",
                      unitType: "linear_foot",
                      markupPercentage: "50.00",
                    });
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Price Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPrice ? "Edit Price Item" : "Add New Price Item"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="frame">Frame</SelectItem>
                                  <SelectItem value="mat">Mat</SelectItem>
                                  <SelectItem value="glazing">Glazing</SelectItem>
                                  <SelectItem value="labor">Labor</SelectItem>
                                  <SelectItem value="misc">Miscellaneous</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="subcategory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subcategory (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Wood, Metal, Fabric" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="itemName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Oak Wood Frame 2 inch" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="unitType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="linear_foot">Linear Foot</SelectItem>
                                  <SelectItem value="square_foot">Square Foot</SelectItem>
                                  <SelectItem value="each">Each</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="basePrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Base Price ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    setTimeout(calculateRetailPrice, 100);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="markupPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Markup %</FormLabel>
                              <FormControl>
                                <div className="flex">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="50.00"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      setTimeout(calculateRetailPrice, 100);
                                    }}
                                  />
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    className="ml-2"
                                    onClick={calculateRetailPrice}
                                  >
                                    <Calculator className="w-4 h-4" />
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="retailPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Retail Price ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Additional notes about this item" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                          {editingPrice ? "Update" : "Create"} Price Item
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDialogOpen(false);
                            setEditingPrice(null);
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Price Structure Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div>Loading price structure...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Unit Type</TableHead>
                          <TableHead>Base Price</TableHead>
                          <TableHead>Markup %</TableHead>
                          <TableHead>Retail Price</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(priceStructure as any[])?.map((price: any) => (
                          <TableRow key={price.id}>
                            <TableCell>
                              <div className="font-medium capitalize">{price.category}</div>
                              {price.subcategory && (
                                <div className="text-sm text-muted-foreground capitalize">
                                  {price.subcategory}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{price.itemName}</TableCell>
                            <TableCell className="capitalize">
                              {price.unitType.replace('_', ' ')}
                            </TableCell>
                            <TableCell>${parseFloat(price.basePrice).toFixed(2)}</TableCell>
                            <TableCell>{parseFloat(price.markupPercentage).toFixed(1)}%</TableCell>
                            <TableCell className="font-medium">
                              ${parseFloat(price.retailPrice).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(price)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}