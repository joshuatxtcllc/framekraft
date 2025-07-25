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
  discountPercentage: z.string().optional(),
  status: z.string().default("pending"),
  priority: z.string().default("normal"),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

type OrderSubmitData = Omit<OrderFormData, 'customerId' | 'dueDate'> & {
  customerId: number;
  dueDate?: string;
};

interface OrderFormProps {
  customers: any[];
  initialData?: any;
  onSubmit: (data: OrderSubmitData) => void;
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
  const [frameOpen, setFrameOpen] = useState(false);
  const [frameSearch, setFrameSearch] = useState("");
  const [matOpen, setMatOpen] = useState(false);
  const [matSearch, setMatSearch] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [laborCost, setLaborCost] = useState(38); // Labor cost before retail markup
  const overheadCost = 54.00; // Overhead cost per frame job
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
      discountPercentage: initialData?.discountPercentage ? initialData.discountPercentage.toString() : "",
      status: initialData?.status || "pending",
      priority: initialData?.priority || "normal",
      dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : undefined,
      notes: initialData?.notes || "",
    },
  });

  // Calculate frame markup based on wholesale price per foot
  const getFrameMarkupFactor = (pricePerFoot: number): number => {
    if (pricePerFoot <= 1.99) return 4.5;
    if (pricePerFoot <= 2.99) return 4.0;
    if (pricePerFoot <= 3.99) return 3.5;
    if (pricePerFoot <= 4.99) return 3.0;
    return 2.5; // $5.00+ per foot
  };

  // Calculate mat markup based on united inches
  const getMatMarkupFactor = (unitedInches: number): number => {
    if (unitedInches <= 32) return 2.0; // 100% markup
    if (unitedInches <= 60) return 1.8; // 80% markup
    if (unitedInches <= 80) return 1.6; // 60% markup
    return 1.4; // 40% markup for 80+ united inches
  };

  // Calculate glass markup based on united inches
  const getGlassMarkupFactor = (unitedInches: number): number => {
    if (unitedInches <= 40) return 2.0; // 100% markup
    if (unitedInches <= 60) return 1.75; // 75% markup
    if (unitedInches <= 80) return 1.5; // 50% markup
    return 1.25; // 25% markup for 80+ united inches
  };

  // Advanced united inch-based pricing calculation
  const calculatePrice = () => {
    const frameStyle = form.watch("frameStyle");
    const glazing = form.watch("glazing");
    const dimensions = form.watch("dimensions");
    const matColor = form.watch("matColor");

    if (!dimensions) return 0;

    // Parse dimensions (handles formats like "16x20", "16 x 20", "16\"x20\"", "16X20")
    const dimensionMatch = dimensions.match(/(\d+(?:\.\d+)?)(?:["']?)(?:\s*[xX×]\s*)(\d+(?:\.\d+)?)(?:["']?)/i);
    if (!dimensionMatch) return 0;

    const artworkWidth = parseFloat(dimensionMatch[1]);
    const artworkHeight = parseFloat(dimensionMatch[2]);
    const matWidth = 2; // Standard 2" mat border

    // Calculate united inches (core measurement for custom framing)
    const unitedInches = artworkWidth + artworkHeight + (matWidth * 4);

    // Calculate frame price with advanced pricing
    let framePrice = 0;
    if (frameStyle && frameStyle !== "none" && priceStructure && Array.isArray(priceStructure)) {
      const frameItem = priceStructure.find((item: any) => 
        item && item.category === "frame" && item.itemName === frameStyle
      );

      if (frameItem) {
        // Frame size with mat: 16x20 becomes 20x24 with 2" mat (add 4" to each dimension)
        const frameWidth = artworkWidth + (matColor ? matWidth * 2 : 0);
        const frameHeight = artworkHeight + (matColor ? matWidth * 2 : 0);
        const framePerimeterInches = (frameWidth * 2) + (frameHeight * 2);
        const framePerimeterFeet = framePerimeterInches / 12;
        const pricePerFoot = parseFloat(frameItem.basePrice);

        // Wholesale cost = feet × price per foot, then round up to nearest dollar
        const wholesaleCost = Math.ceil(framePerimeterFeet * pricePerFoot);

        // Apply sliding scale retail markup based on price per foot
        const markupFactor = getFrameMarkupFactor(pricePerFoot);
        framePrice = wholesaleCost * markupFactor;
      }
    }

    // Calculate mat price using united inches: 16+20=36 united inches at $0.0109 per square inch
    let matPrice = 0;
    if (matColor && matColor !== "none") {
      const unitedInches = artworkWidth + artworkHeight; // 16+20=36 for your example
      const pricePerSquareInch = 0.0109; // $0.0109 per square inch
      matPrice = unitedInches * pricePerSquareInch;
    }

    // Calculate glass price using proper united inch-based markup without location discounts
    let glazingPrice = 0;
    if (glazing && glazing !== "none" && priceStructure && Array.isArray(priceStructure)) {
      const glazingItem = priceStructure.find((item: any) => 
        item && item.category === "glazing" && item.itemName === glazing
      );

      if (glazingItem) {
        // Glass size matches frame size (includes mat border)
        const glassWidth = artworkWidth + (matColor ? matWidth * 2 : 0);
        const glassHeight = artworkHeight + (matColor ? matWidth * 2 : 0);
        const glassAreaFeet = (glassWidth * glassHeight) / 144;
        const unitedInches = glassWidth + glassHeight;
        const markupFactor = getGlassMarkupFactor(unitedInches);
        glazingPrice = glassAreaFeet * parseFloat(glazingItem.basePrice) * markupFactor;
      }
    }

    // Calculate total with all components including overhead
    let totalPrice = framePrice + matPrice + glazingPrice + laborCost + overheadCost;

    // Apply discount if specified
    const discountPercentage = parseFloat(form.watch("discountPercentage") || "0");
    if (discountPercentage > 0) {
      totalPrice = totalPrice * (1 - discountPercentage / 100);
    }

    return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
  };

  // Watch for changes and recalculate price (include matColor for united inch calculations)
  useEffect(() => {
    const newPrice = calculatePrice();
    setCalculatedPrice(newPrice);
    if (newPrice > 0 && useCalculatedPrice) {
      form.setValue("totalAmount", newPrice.toFixed(2));
    }
  }, [form.watch("frameStyle"), form.watch("glazing"), form.watch("dimensions"), form.watch("matColor"), form.watch("discountPercentage"), priceStructure, laborCost, useCalculatedPrice]);

  // Get frame options with wholesale prices from pricing structure
  const frameOptions = [
    { value: "none", label: "No Frame (Mat/Glass Only)", basePrice: 0, retailPrice: 0 },
    ...(priceStructure && Array.isArray(priceStructure) ? priceStructure
      .filter((item: any) => item && item.category === "frame")
      .map((item: any) => {
        return {
          value: item.itemName,
          label: `${item.itemName} - $${item.basePrice}/ft wholesale → $${item.retailPrice}/ft retail`,
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
        label: `${item.itemName} - $${item.basePrice}/sq ft wholesale → $${item.retailPrice}/sq ft retail`,
        basePrice: item.basePrice,
        retailPrice: item.retailPrice
      })) : [])
  ];

  // Get mat options with wholesale prices from pricing structure
  const matOptions = [
    ...(priceStructure && Array.isArray(priceStructure) ? priceStructure
      .filter((item: any) => item && item.category === "mat")
      .map((item: any) => ({
        value: item.itemName,
        label: `${item.itemName} - $${item.basePrice} wholesale → $${item.retailPrice} retail`,
        basePrice: item.basePrice,
        retailPrice: item.retailPrice
      })) : [])
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

  // Filter frames based on search
  const filteredFrames = frameOptions.filter(option =>
    option.label.toLowerCase().includes(frameSearch.toLowerCase())
  );

  // Filter mats based on search
  const filteredMats = matOptions.filter(option =>
    option.label.toLowerCase().includes(matSearch.toLowerCase())
  );

  // Get selected customer for display
  const selectedCustomer = customers.find(c => c.id.toString() === form.watch("customerId"));

  // Get selected frame for display
  const selectedFrame = frameOptions.find(f => f.value === form.watch("frameStyle"));

  // Get selected mat for display
  const selectedMat = matOptions.find(m => m.value === form.watch("matColor"));

  const handleFormSubmit = (data: OrderFormData) => {
    // Transform the data before sending
    const transformedData: OrderSubmitData = {
      ...data,
      customerId: parseInt(data.customerId),
      dueDate: data.dueDate ? data.dueDate.toISOString() : undefined, // Convert date to ISO string
    };
    onSubmit(transformedData);
  };

  // Get matboard options with area-based pricing from pricing structure
  const matColorOptions = [
    { value: "none", label: "No Mat (Frame Only)", basePrice: 0, retailPrice: 0 },
    ...(priceStructure && Array.isArray(priceStructure) ? priceStructure
      .filter((item: any) => item && item.category === "mat")
      .map((item: any) => ({
        value: item.itemName,
        label: `${item.itemName} - $${parseFloat(item.basePrice).toFixed(4)}/sq in wholesale → $${parseFloat(item.retailPrice).toFixed(4)}/sq in retail`,
        basePrice: item.basePrice,
        retailPrice: item.retailPrice
      })) : [])
  ];

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
              <FormItem className="flex flex-col">
                <FormLabel>Frame Style</FormLabel>
                <Popover open={frameOpen} onOpenChange={setFrameOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={frameOpen}
                        className="justify-between"
                        data-testid="button-frame-select"
                      >
                        {selectedFrame
                          ? selectedFrame.label.split(' - ')[0] // Show just the frame name, not the pricing
                          : "Select frame style..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search frame styles..."
                        value={frameSearch}
                        onValueChange={setFrameSearch}
                        data-testid="input-frame-search"
                      />
                      <CommandEmpty>No frame style found.</CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-auto">
                        {filteredFrames.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                              field.onChange(option.value);
                              setFrameOpen(false);
                              setFrameSearch("");
                            }}
                            data-testid={`option-frame-${option.value}`}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedFrame?.value === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{option.label.split(' - ')[0]}</span>
                              {option.basePrice > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ${option.basePrice}/ft wholesale → ${option.retailPrice}/ft retail
                                </span>
                              )}
                            </div>
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

          {/* Mat Color */}
          <FormField
            control={form.control}
            name="matColor"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Mat Color</FormLabel>
                <Popover open={matOpen} onOpenChange={setMatOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={matOpen}
                        className="justify-between"
                        data-testid="button-mat-select"
                      >
                        {selectedMat
                          ? selectedMat.label.split(' - ')[0] // Show just the mat name, not the pricing
                          : "Select mat color..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search mat colors..."
                        value={matSearch}
                        onValueChange={setMatSearch}
                        data-testid="input-mat-search"
                      />
                      <CommandEmpty>No mat color found.</CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-auto">
                        {filteredMats.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                              field.onChange(option.value);
                              setMatOpen(false);
                              setMatSearch("");
                            }}
                            data-testid={`option-mat-${option.value}`}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedMat?.value === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{option.label.split(' - ')[0]}</span>
                              {option.basePrice > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ${option.basePrice} wholesale → ${option.retailPrice} retail
                                </span>
                              )}
                            </div>
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
                  const matColor = form.watch("matColor");
                  const dimensions = form.watch("dimensions");

                  if (!dimensions) {
                    return <p>Enter dimensions to see calculation</p>;
                  }

                  const dimensionMatch = dimensions.match(/(\d+(?:\.\d+)?)(?:["']?)(?:\s*[xX×]\s*)(\d+(?:\.\d+)?)(?:["']?)/i);
                  if (!dimensionMatch) {
                    return <p>Invalid dimension format. Use format like "16x20" or "16X20"</p>;
                  }

                  const artworkWidth = parseFloat(dimensionMatch[1]);
                  const artworkHeight = parseFloat(dimensionMatch[2]);
                  const matWidth = 2; // Standard 2" mat border

                  // Calculate frame price with mat border (if selected)
                  let framePrice = 0;
                  let frameDetails = "";
                  if (frameStyle && frameStyle !== "none" && priceStructure && Array.isArray(priceStructure)) {
                    const frameItem = priceStructure.find((item: any) => 
                      item && item.category === "frame" && item.itemName === frameStyle
                    );
                    if (frameItem) {
                      const frameWidth = artworkWidth + (matColor ? matWidth * 2 : 0);
                      const frameHeight = artworkHeight + (matColor ? matWidth * 2 : 0);
                      const framePerimeterInches = (frameWidth * 2) + (frameHeight * 2);
                      const framePerimeterFeet = framePerimeterInches / 12;
                      const pricePerFoot = parseFloat(frameItem.basePrice);
                      const wholesaleCost = Math.ceil(framePerimeterFeet * pricePerFoot);
                      const markupFactor = getFrameMarkupFactor(pricePerFoot);
                      framePrice = wholesaleCost * markupFactor;
                      frameDetails = `${frameWidth}×${frameHeight} = ${framePerimeterInches}" = ${framePerimeterFeet.toFixed(2)} ft × $${pricePerFoot}/ft = $${wholesaleCost} × ${markupFactor}x`;
                    }
                  }

                  // Calculate mat price using united inches: 16+20=36 at $0.0109 per square inch
                  let matPrice = 0;
                  let matDetails = "";
                  if (matColor && matColor !== "none") {
                    const unitedInches = artworkWidth + artworkHeight; // 16+20=36
                    const pricePerSquareInch = 0.0109;
                    matPrice = unitedInches * pricePerSquareInch;
                    matDetails = `${artworkWidth}+${artworkHeight} = ${unitedInches} united inches × $${pricePerSquareInch}`;
                  }

                  // Calculate glazing price - glass size matches frame size
                  let glazingPrice = 0;
                  let glazingDetails = "";
                  if (glazing && glazing !== "none" && priceStructure && Array.isArray(priceStructure)) {
                    const glazingItem = priceStructure.find((item: any) => 
                      item && item.category === "glazing" && item.itemName === glazing
                    );
                    if (glazingItem) {
                      const glassWidth = artworkWidth + (matColor ? matWidth * 2 : 0);
                      const glassHeight = artworkHeight + (matColor ? matWidth * 2 : 0);
                      const glassAreaFeet = (glassWidth * glassHeight) / 144;
                      const unitedInches = glassWidth + glassHeight;
                      const markupFactor = getGlassMarkupFactor(unitedInches);
                      glazingPrice = glassAreaFeet * parseFloat(glazingItem.basePrice) * markupFactor;
                      glazingDetails = `${glassWidth}×${glassHeight} = ${glassAreaFeet.toFixed(2)} sq ft × $${glazingItem.basePrice}/sq ft × ${markupFactor}x`;
                    }
                  }

                  return (
                    <>
                      <div className="flex justify-between text-xs mb-1 text-blue-600">
                        <span>Artwork: {artworkWidth}"×{artworkHeight}"</span>
                        {matColor && <span>Frame/Glass: {artworkWidth + matWidth * 2}"×{artworkHeight + matWidth * 2}"</span>}
                      </div>
                      {frameStyle && frameStyle !== "none" && framePrice > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Frame ({frameStyle}):</span>
                            <span>${framePrice.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-gray-500 pl-2">
                            {frameDetails}
                          </div>
                        </div>
                      )}
                      {matColor && matPrice > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Mat ({matDetails}):</span>
                            <span>${matPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                      {glazing && glazing !== "none" && glazingPrice > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Glass ({glazing}):</span>
                            <span>${glazingPrice.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-gray-500 pl-2">
                            {glazingDetails}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Labor:</span>
                        <span>${laborCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overhead:</span>
                        <span>${overheadCost.toFixed(2)}</span>
                      </div>
                      {(() => {
                        const discountPercentage = parseFloat(form.watch("discountPercentage") || "0");
                        const subtotal = framePrice + matPrice + glazingPrice + laborCost + overheadCost;

                        if (discountPercentage > 0) {
                          return (
                            <>
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>${subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-red-600">
                                <span>Discount ({discountPercentage}%):</span>
                                <span>-${(subtotal * discountPercentage / 100).toFixed(2)}</span>
                              </div>
                              <div className="border-t pt-1 mt-1 font-semibold flex justify-between">
                                <span>Total:</span>
                                <span>${calculatedPrice.toFixed(2)}</span>
                              </div>
                            </>
                          );
                        } else {
                          return (
                            <div className="border-t pt-1 mt-1 font-semibold flex justify-between">
                              <span>Total:</span>
                              <span>${calculatedPrice.toFixed(2)}</span>
                            </div>
                          );
                        }
                      })()}
                      <div className="text-xs text-green-600 mt-1">
                        <span>Industry-standard united inch pricing methodology</span>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Discount Percentage */}
          <FormField
            control={form.control}
            name="discountPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount %</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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