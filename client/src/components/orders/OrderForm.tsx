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
  quantity: z.string().min(1, "Quantity is required").default("1"),
  frameStyle: z.string().optional(),
  matColor: z.string().optional(),
  glazing: z.string().optional(),
  totalAmount: z.string().min(1, "Total amount is required"),
  depositAmount: z.string().optional(),
  discountPercentage: z.string().optional(),
  taxExempt: z.boolean().default(false),
  status: z.string().default("pending"),
  priority: z.string().default("normal"),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
  artLocation: z.string().optional(), // Added artLocation
});

type OrderFormData = z.infer<typeof orderSchema>;

type OrderSubmitData = Omit<OrderFormData, 'customerId' | 'dueDate'> & {
  customerId: number;
  dueDate?: string | null;
  taxExempt?: boolean;
  totalAmount: string;
  taxAmount?: string;
  discountAmount?: string;
  specialServices?: string[]; // Added specialServices
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
  const [specialServices, setSpecialServices] = useState<string[]>([]);
  const [artLocation, setArtLocation] = useState("");

  // Fetch pricing data
  const { data: priceStructure = [], isLoading: priceLoading, error: priceError } = useQuery({
    queryKey: ["/api/pricing/structure"],
  });

    // Define special services with prices
    const specialServicesOptions = [
      { id: "shadowbox", label: "Shadowbox", price: 25 },
      { id: "floatMount", label: "Float Mount", price: 30 },
      { id: "canvasStretching", label: "Canvas Stretching", price: 40 },
      { id: "jersey", label: "Jersey", price: 50 },
      { id: "oneHourLabor", label: "1 Hour Labor", price: 75 },
      { id: "halfHourLabor", label: "Half Hour Labor", price: 40 },
      { id: "delivery", label: "Delivery", price: 20 },
      { id: "installation", label: "Installation", price: 35 },
      { id: "stitching", label: "Stitching", price: 15 },
      { id: "customPainting", label: "Custom Painting (per hour)", price: 60 },
      { id: "multipleOpeningMatt", label: "Multiple Opening Matt", price: 45 },
      { id: "oversize", label: "Oversize", price: 55 },
      { id: "glassFloat", label: "Glass Float", price: 22 },
      { id: "vGroove", label: "V Groove", price: 18 },
      { id: "elevatedMatt", label: "Elevated Matt", price: 28 },
      { id: "paintedBevel", label: "Painted Bevel", price: 33 },
    ];


  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: initialData?.customerId ? initialData.customerId.toString() : "",
      description: initialData?.description || "",
      artworkDescription: initialData?.artworkDescription || "",
      dimensions: initialData?.dimensions || "",
      quantity: initialData?.quantity ? initialData.quantity.toString() : "1",
      frameStyle: initialData?.frameStyle || "",
      matColor: initialData?.matColor || "",
      glazing: initialData?.glazing || "Museum Glass",
      totalAmount: initialData?.totalAmount ? initialData.totalAmount.toString() : "",
      depositAmount: initialData?.depositAmount ? initialData.depositAmount.toString() : "",
      discountPercentage: initialData?.discountPercentage ? initialData.discountPercentage.toString() : "",
      taxExempt: initialData?.taxExempt || false,
      status: initialData?.status || "pending",
      priority: initialData?.priority || "normal",
      dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : undefined,
      notes: initialData?.notes || "",
      artLocation: initialData?.artLocation || "", // Initialize artLocation
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

  // Advanced united inch-based pricing calculation with tax
  const calculatePrice = () => {
    const frameStyle = form.watch("frameStyle");
    const glazing = form.watch("glazing");
    const dimensions = form.watch("dimensions");
    const matColor = form.watch("matColor");
    const quantity = parseInt(form.watch("quantity") || "1");
    const taxExempt = form.watch("taxExempt");

    if (!dimensions) return { subtotal: 0, tax: 0, total: 0 };

    // Parse dimensions (handles formats like "16x20", "16 x 20", "16\"x20\"", "16X20")
    const dimensionMatch = dimensions.match(/(\d+(?:\.\d+)?)(?:["']?)(?:\s*[xX×]\s*)(\d+(?:\.\d+)?)(?:["']?)/i);
    if (!dimensionMatch) return { subtotal: 0, tax: 0, total: 0 };

    const artworkWidth = parseFloat(dimensionMatch[1]);
    const artworkHeight = parseFloat(dimensionMatch[2]);
    const matWidth = 2; // Standard 2" mat border

    // Calculate frame price with advanced pricing - FIXED: multiply by quantity for frame moulding
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

        // Wholesale cost = feet × price per foot × quantity, then round up to nearest dollar
        const wholesaleCost = Math.ceil(framePerimeterFeet * pricePerFoot * quantity);

        // Apply sliding scale retail markup based on price per foot
        const markupFactor = getFrameMarkupFactor(pricePerFoot);
        framePrice = wholesaleCost * markupFactor;
      }
    }

    // Calculate mat price using united inches method as specified in pricing documentation
    let matPrice = 0;
    let matDetails = "";
    if (matColor && matColor !== "none" && priceStructure && Array.isArray(priceStructure)) {
      const matItem = priceStructure.find((item: any) => 
        item && item.category === "mat" && item.itemName === matColor
      );
      if (matItem) {
        // Use united inches method: width + height (not square inches)
        const unitedInches = artworkWidth + artworkHeight + (matWidth * 4); // Add mat border to united inches
        const markupFactor = getMatMarkupFactor(unitedInches);
        const baseMatCost = 17; // Base cost per piece as documented
        matPrice = baseMatCost * markupFactor * quantity;
        matDetails = `United inches: ${artworkWidth} + ${artworkHeight} + ${matWidth * 4} = ${unitedInches}" × $${baseMatCost} base × ${markupFactor}x markup × ${quantity} qty = $${matPrice.toFixed(2)}`;
      }
    }

    // Calculate glass price using united inch-based markup
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
        glazingPrice = glassAreaFeet * parseFloat(glazingItem.basePrice) * markupFactor * quantity;
      }
    }

        // Calculate special services price
        let specialServicesPrice = 0;
        specialServices.forEach(serviceId => {
          const service = specialServicesOptions.find(s => s.id === serviceId);
          if (service) {
            specialServicesPrice += service.price;
          }
        });

    // Calculate subtotal with all components including overhead (labor and overhead per quantity)
    let subtotal = framePrice + matPrice + glazingPrice + (laborCost * quantity) + (overheadCost * quantity) + specialServicesPrice;

    // Apply discount if specified
    const discountPercentage = parseFloat(form.watch("discountPercentage") || "0");
    if (discountPercentage > 0) {
      subtotal = subtotal * (1 - discountPercentage / 100);
    }

    // Calculate tax (8% unless tax exempt)
    const taxRate = 0.08;
    const tax = taxExempt ? 0 : subtotal * taxRate;
    const total = subtotal + tax;

    return { 
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  };

  // Watch for changes and recalculate price (include matColor for united inch calculations)
  useEffect(() => {
    const pricing = calculatePrice();
    setCalculatedPrice(pricing.total);
    if (pricing.total > 0 && useCalculatedPrice) {
      form.setValue("totalAmount", pricing.total.toFixed(2));
    }
  }, [form.watch("frameStyle"), form.watch("glazing"), form.watch("dimensions"), form.watch("matColor"), form.watch("quantity"), form.watch("discountPercentage"), form.watch("taxExempt"), priceStructure, laborCost, useCalculatedPrice, specialServices]);

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
    const baseAmount = parseFloat(data.totalAmount);
    const quantity = parseInt(data.quantity) || 1;
    const discount = parseFloat(data.discountPercentage || "0");

    // Calculate amounts
    const discountAmount = (baseAmount * discount) / 100;
    const subtotal = baseAmount - discountAmount;
    const taxAmount = data.taxExempt ? 0 : subtotal * 0.08;
    const finalTotal = subtotal + taxAmount;

    const submitData: OrderSubmitData = {
      ...data,
      customerId: parseInt(data.customerId),
      dueDate: data.dueDate ? data.dueDate.toISOString().split('T')[0] : null,
      taxExempt: data.taxExempt,
      totalAmount: finalTotal.toString(),
      taxAmount: taxAmount.toString(),
      discountAmount: discountAmount.toString(),
      specialServices: specialServices,
    };
    onSubmit(submitData);
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          {/* Quantity */}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="1"
                    {...field}
                  />
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
                  <SelectContent className="max-h-60 overflow-y-auto">
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

        {/* Special Services */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-800 text-sm">Special Services</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {specialServicesOptions.map((service) => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={service.id}
                    checked={specialServices.includes(service.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSpecialServices([...specialServices, service.id]);
                      } else {
                        setSpecialServices(specialServices.filter(s => s !== service.id));
                      }
                    }}
                  />
                  <label htmlFor={service.id} className="text-sm">
                    {service.label} (+${service.price})
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Art Location */}
        <FormField
          control={form.control}
          name="artLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Art Location</FormLabel>
              <FormControl>
                <Input
                  placeholder="Where is the artwork stored? (e.g., Shelf A3, Customer holding, etc.)"
                  value={artLocation}
                  onChange={(e) => {
                    setArtLocation(e.target.value);
                    field.onChange(e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  const quantity = parseInt(form.watch("quantity") || "1");
                  const taxExempt = form.watch("taxExempt");
                  const pricing = calculatePrice();

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

                  // Calculate frame price with mat border (if selected) - FIXED for quantity
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
                      const wholesaleCost = Math.ceil(framePerimeterFeet * pricePerFoot * quantity);
                      const markupFactor = getFrameMarkupFactor(pricePerFoot);
                      framePrice = wholesaleCost * markupFactor;
                      frameDetails = `${frameWidth}×${frameHeight} = ${framePerimeterInches}" = ${framePerimeterFeet.toFixed(2)} ft × $${pricePerFoot}/ft × ${quantity} qty = $${wholesaleCost} × ${markupFactor}x`;
                    }
                  }

                  // Calculate mat price using united inches method as specified in pricing documentation
                  let matPrice = 0;
                  let matDetails = "";
                  if (matColor && matColor !== "none" && priceStructure && Array.isArray(priceStructure)) {
                    const matItem = priceStructure.find((item: any) => 
                      item && item.category === "mat" && item.itemName === matColor
                    );
                    if (matItem) {
                      // Use united inches method: width + height (not square inches)
                      const unitedInches = artworkWidth + artworkHeight + (matWidth * 4); // Add mat border to united inches
                      const markupFactor = getMatMarkupFactor(unitedInches);
                      const baseMatCost = 17; // Base cost per piece as documented
                      matPrice = baseMatCost * markupFactor * quantity;
                      matDetails = `United inches: ${artworkWidth} + ${artworkHeight} + ${matWidth * 4} = ${unitedInches}" × $${baseMatCost} base × ${markupFactor}x markup × ${quantity} qty = $${matPrice.toFixed(2)}`;
                    }
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
                      glazingPrice = glassAreaFeet * parseFloat(glazingItem.basePrice) * markupFactor * quantity;
                      glazingDetails = `${glassWidth}×${glassHeight} = ${glassAreaFeet.toFixed(2)} sq ft × $${glazingItem.basePrice}/sq ft × ${markupFactor}x × ${quantity} qty`;
                    }
                  }

                                  // Calculate special services price
                                  let specialServicesPrice = 0;
                                  specialServices.forEach(serviceId => {
                                    const service = specialServicesOptions.find(s => s.id === serviceId);
                                    if (service) {
                                      specialServicesPrice += service.price;
                                    }
                                  });

                  return (
                    <>
                      <div className="flex justify-between text-xs mb-1 text-blue-600">
                        <span>Artwork: {artworkWidth}"×{artworkHeight}" × {quantity}</span>
                        {matColor && <span>Frame/Glass: {artworkWidth + matWidth * 2}"×{artworkHeight + matWidth * 2}""</span>}
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
                      {specialServices.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Special Services:</span>
                            <span>${specialServicesPrice.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-gray-500 pl-2">
                            {specialServices.map(serviceId => {
                              const service = specialServicesOptions.find(s => s.id === serviceId);
                              return service ? service.label : null;
                            }).filter(label => label !== null).join(", ")}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Labor (${laborCost} × {quantity}):</span>
                        <span>${(laborCost * quantity).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overhead (${overheadCost} × {quantity}):</span>
                        <span>${(overheadCost * quantity).toFixed(2)}</span>
                      </div>
                      {(() => {
                        const discountPercentage = parseFloat(form.watch("discountPercentage") || "0");

                        if (discountPercentage > 0) {
                          return (
                            <>
                              <div className="flex justify-between">
                                <span>Subtotal (before discount):</span>
                                <span>${(pricing.subtotal / (1 - discountPercentage / 100)).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-red-600">
                                <span>Discount ({discountPercentage}%):</span>
                                <span>-${((pricing.subtotal / (1 - discountPercentage / 100)) - pricing.subtotal).toFixed(2)}</span>
                              </div>
                            </>
                          );
                        }
                        return null;
                      })()}
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${pricing.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (8%{taxExempt ? " - EXEMPT" : ""}):</span>
                        <span>${pricing.tax.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-1 mt-1 font-semibold flex justify-between">
                        <span>Total:</span>
                        <span>${pricing.total.toFixed(2)}</span>
                      </div>
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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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

          {/* Tax Exempt */}
          <FormField
            control={form.control}
            name="taxExempt"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end">
                <FormLabel>Tax Status</FormLabel>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="taxExempt"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4"
                  />
                  <label htmlFor="taxExempt" className="text-sm">
                    Tax Exempt
                  </label>
                </div>
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