import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const orderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  description: z.string().min(1, "Description is required"),
  artworkDescription: z.string().optional(),
  dimensions: z.string().optional(),
  frameStyle: z.string().optional(),
  matColor: z.string().optional(),
  glazing: z.string().optional(),
  totalAmount: z.string().min(1, "Total amount is required"),
  depositAmount: z.string().optional(),
  status: z.string().default("pending"),
  priority: z.string().default("normal"),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  customers: any[];
  initialData?: any;
  onSubmit: (data: OrderFormData) => void;
  isLoading: boolean;
  onCancel: () => void;
}

export default function OrderForm({
  customers,
  initialData,
  onSubmit,
  isLoading,
  onCancel,
}: OrderFormProps) {
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [laborCost, setLaborCost] = useState(35); // Default labor cost
  const [useCalculatedPrice, setUseCalculatedPrice] = useState(true);

  // Fetch pricing data
  const { data: priceStructure = [], isLoading: priceLoading, error: priceError } = useQuery({
    queryKey: ["/api/pricing/structure"],
  });



  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: initialData?.customerId ? initialData.customerId.toString() : "",
      description: initialData?.description || "",
      artworkDescription: initialData?.artworkDescription || "",
      dimensions: initialData?.dimensions || "",
      frameStyle: initialData?.frameStyle || "",
      matColor: initialData?.matColor || "",
      glazing: initialData?.glazing || "",
      totalAmount: initialData?.totalAmount ? initialData.totalAmount.toString() : "",
      depositAmount: initialData?.depositAmount ? initialData.depositAmount.toString() : "",
      status: initialData?.status || "pending",
      priority: initialData?.priority || "normal",
      dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : undefined,
      notes: initialData?.notes || "",
    },
  });

  // Auto-calculate price based on selections
  const calculatePrice = () => {
    const frameStyle = form.watch("frameStyle");
    const glazing = form.watch("glazing");
    const dimensions = form.watch("dimensions");

    if (!dimensions) return 0;

    // Parse dimensions (handles formats like "16x20", "16 x 20", "16\"x20\"", "16X20")
    const dimensionMatch = dimensions.match(/(\d+(?:\.\d+)?)(?:["']?)(?:\s*[xX×]\s*)(\d+(?:\.\d+)?)(?:["']?)/i);
    if (!dimensionMatch) return 0;

    const width = parseFloat(dimensionMatch[1]);
    const height = parseFloat(dimensionMatch[2]);
    
    // Calculate frame perimeter in linear feet
    const perimeterInches = (width + height) * 2;
    const perimeterFeet = perimeterInches / 12;
    
    // Calculate glass area in square feet
    const areaSquareInches = width * height;
    const areaSquareFeet = areaSquareInches / 144;

    // Find frame price - match exact item name (0 if no frame selected)
    let framePrice = 0;
    if (frameStyle && frameStyle !== "none" && priceStructure && Array.isArray(priceStructure)) {
      const frameItem = priceStructure.find((item: any) => 
        item && item.category === "frame" && item.itemName === frameStyle
      );
      framePrice = frameItem ? parseFloat(frameItem.retailPrice) * perimeterFeet : 0;
    }

    // Find glazing price - match exact item name (0 if no glazing selected)
    let glazingPrice = 0;
    if (glazing && glazing !== "none" && priceStructure && Array.isArray(priceStructure)) {
      const glazingItem = priceStructure.find((item: any) => 
        item && item.category === "glazing" && item.itemName === glazing
      );
      glazingPrice = glazingItem ? parseFloat(glazingItem.retailPrice) * areaSquareFeet : 0;
    }

    // Add labor cost
    const totalPrice = framePrice + glazingPrice + laborCost;
    
    return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
  };

  // Watch for changes and recalculate price
  useEffect(() => {
    const newPrice = calculatePrice();
    setCalculatedPrice(newPrice);
    if (newPrice > 0 && useCalculatedPrice) {
      form.setValue("totalAmount", newPrice.toFixed(2));
    }
  }, [form.watch("frameStyle"), form.watch("glazing"), form.watch("dimensions"), priceStructure, laborCost, useCalculatedPrice]);

  // Get frame options with wholesale prices from pricing structure
  const frameOptions = [
    { value: "none", label: "No Frame (Mat/Glass Only)", basePrice: 0, retailPrice: 0 },
    ...(priceStructure && Array.isArray(priceStructure) ? priceStructure
      .filter((item: any) => item && item.category === "frame")
      .map((item: any) => {
        return {
          value: item.itemName,
          label: `${item.itemName} - $${item.basePrice}/ft wholesale`,
          basePrice: item.basePrice,
          retailPrice: item.retailPrice
        };
      }) : [])
  ];



  // Get glazing options with wholesale prices from pricing structure  
  const glazingOptionsWithPrices = [
    { value: "none", label: "No Glass/Acrylic (Frame/Mat Only)", basePrice: 0, retailPrice: 0 },
    ...(priceStructure && Array.isArray(priceStructure) ? priceStructure
      .filter((item: any) => item && item.category === "glazing")
      .map((item: any) => ({
        value: item.itemName,
        label: `${item.itemName} - $${item.basePrice}/sq ft wholesale`,
        basePrice: item.basePrice,
        retailPrice: item.retailPrice
      })) : [])
  ];

  const matColors = [
    "Warm White",
    "Cream", 
    "Light Gray",
    "Charcoal",
    "Navy Blue",
    "Forest Green",
    "Burgundy",
    "Gold",
    "Silver",
    "Black",
  ];

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "measuring", label: "Measuring" },
    { value: "production", label: "Production" },
    { value: "ready", label: "Ready" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "rush", label: "Rush" },
  ];

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Get selected customer for display
  const selectedCustomer = customers.find(c => c.id.toString() === form.watch("customerId"));

  const handleFormSubmit = (data: OrderFormData) => {
    // Transform the data before sending
    const transformedData = {
      ...data,
      customerId: parseInt(data.customerId),
      totalAmount: parseFloat(data.totalAmount),
      depositAmount: data.depositAmount ? parseFloat(data.depositAmount) : undefined,
    };
    onSubmit(transformedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Selection */}
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Customer *</FormLabel>
                <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerOpen}
                        className="justify-between"
                      >
                        {selectedCustomer
                          ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                          : "Select or type customer name..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search customers or type new name..."
                        value={customerSearch}
                        onValueChange={setCustomerSearch}
                      />
                      <CommandEmpty>
                        {customerSearch && (
                          <div className="p-2">
                            <Button
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => {
                                // Create a temporary customer ID (negative number)
                                const tempId = -(Date.now());
                                const newCustomer = {
                                  id: tempId,
                                  firstName: customerSearch.split(' ')[0] || customerSearch,
                                  lastName: customerSearch.split(' ').slice(1).join(' ') || '',
                                };
                                
                                // Add to customers list temporarily
                                customers.push(newCustomer);
                                
                                // Set the form value
                                field.onChange(tempId.toString());
                                setCustomerOpen(false);
                                setCustomerSearch("");
                              }}
                            >
                              Create "{customerSearch}" as new customer
                            </Button>
                          </div>
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredCustomers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={`${customer.firstName} ${customer.lastName}`}
                            onSelect={() => {
                              field.onChange(customer.id.toString());
                              setCustomerOpen(false);
                              setCustomerSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {customer.firstName} {customer.lastName}
                            {customer.email && (
                              <span className="ml-auto text-sm text-muted-foreground">
                                {customer.email}
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Custom wedding photo frame - 16&quot;x20&quot;"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Artwork Description */}
        <FormField
          control={form.control}
          name="artworkDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Artwork Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the artwork, style, colors, etc."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dimensions */}
          <FormField
            control={form.control}
            name="dimensions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dimensions</FormLabel>
                <FormControl>
                  <Input placeholder='e.g., 16"x20"' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Frame Style */}
          <FormField
            control={form.control}
            name="frameStyle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frame Style</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frame style" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {frameOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mat Color */}
          <FormField
            control={form.control}
            name="matColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mat Color</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mat color" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {matColors.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Glazing */}
          <FormField
            control={form.control}
            name="glazing"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Glazing</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select glazing" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {glazingOptionsWithPrices.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pricing Mode Toggle */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm text-blue-800">
              <span className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Pricing Method
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={useCalculatedPrice ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseCalculatedPrice(true)}
                  className="h-7 text-xs"
                >
                  Auto Calculate
                </Button>
                <Button
                  type="button"
                  variant={!useCalculatedPrice ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseCalculatedPrice(false)}
                  className="h-7 text-xs"
                >
                  Manual Entry
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          {useCalculatedPrice && calculatedPrice > 0 && (
            <CardContent className="pt-0">
              <div className="text-sm text-blue-700">
                {(() => {
                  const frameStyle = form.watch("frameStyle");
                  const glazing = form.watch("glazing");
                  const dimensions = form.watch("dimensions");
                  
                  if (!dimensions) {
                    return <p>Enter dimensions to see calculation</p>;
                  }
                  
                  const dimensionMatch = dimensions.match(/(\d+(?:\.\d+)?)(?:["']?)(?:\s*[xX×]\s*)(\d+(?:\.\d+)?)(?:["']?)/i);
                  if (!dimensionMatch) {
                    return <p>Invalid dimension format. Use format like "16x20" or "16X20"</p>;
                  }
                  
                  const width = parseFloat(dimensionMatch[1]);
                  const height = parseFloat(dimensionMatch[2]);
                  const perimeterFeet = ((width + height) * 2) / 12;
                  const areaSquareFeet = (width * height) / 144;
                  
                  // Calculate frame price (0 if no frame)
                  let framePrice = 0;
                  if (frameStyle && frameStyle !== "none" && priceStructure && Array.isArray(priceStructure)) {
                    const frameItem = priceStructure.find((item: any) => 
                      item && item.category === "frame" && item.itemName === frameStyle
                    );
                    framePrice = frameItem ? parseFloat(frameItem.retailPrice) * perimeterFeet : 0;
                  }
                  
                  // Calculate glazing price (0 if no glazing)
                  let glazingPrice = 0;
                  if (glazing && glazing !== "none" && priceStructure && Array.isArray(priceStructure)) {
                    const glazingItem = priceStructure.find((item: any) => 
                      item && item.category === "glazing" && item.itemName === glazing
                    );
                    glazingPrice = glazingItem ? parseFloat(glazingItem.retailPrice) * areaSquareFeet : 0;
                  }
                  
                  return (
                    <>
                      <div className="flex justify-between text-xs mb-1 text-blue-600">
                        <span>Size: {width}"×{height}" ({perimeterFeet.toFixed(1)} linear ft, {areaSquareFeet.toFixed(1)} sq ft)</span>
                      </div>
                      {frameStyle && frameStyle !== "none" && (
                        <div className="flex justify-between">
                          <span>Frame Cost:</span>
                          <span>${framePrice.toFixed(2)}</span>
                        </div>
                      )}
                      {glazing && glazing !== "none" && (
                        <div className="flex justify-between">
                          <span>Glazing Cost:</span>
                          <span>${glazingPrice.toFixed(2)}</span>
                        </div>
                      )}
                      {(!frameStyle || frameStyle === "none") && (!glazing || glazing === "none") && (
                        <div className="flex justify-between text-amber-600">
                          <span>Mat/Custom Only:</span>
                          <span>No standard pricing</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Labor:</span>
                        <span>${laborCost.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-1 mt-1 font-semibold flex justify-between">
                        <span>Total:</span>
                        <span>${calculatedPrice.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 h-7 text-xs"
                  onClick={() => form.setValue("totalAmount", calculatedPrice.toFixed(2))}
                >
                  Apply Calculated Price
                </Button>
              </div>
            </CardContent>
          )}
          {!useCalculatedPrice && (
            <CardContent className="pt-0">
              <p className="text-sm text-blue-700">
                Manual pricing mode enabled. Enter your custom total amount below.
              </p>
            </CardContent>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Amount */}
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Total Amount *
                  {useCalculatedPrice && calculatedPrice > 0 && (
                    <span className="text-xs text-blue-600">(Auto-calculated)</span>
                  )}
                  {!useCalculatedPrice && (
                    <span className="text-xs text-gray-600">(Manual entry)</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    readOnly={useCalculatedPrice && calculatedPrice > 0}
                    className={
                      useCalculatedPrice && calculatedPrice > 0 
                        ? "bg-blue-50 border-blue-200" 
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Deposit Amount */}
          <FormField
            control={form.control}
            name="depositAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Deposit Amount
                  {form.watch("totalAmount") && parseFloat(form.watch("totalAmount")) > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        const total = parseFloat(form.watch("totalAmount"));
                        form.setValue("depositAmount", (total * 0.5).toFixed(2));
                      }}
                    >
                      50%
                    </Button>
                  )}
                </FormLabel>
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

          {/* Due Date */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span className="text-muted-foreground">Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes or special instructions"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? "Saving..." : initialData ? "Update Order" : "Create Order"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
