import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

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

  const frameStyles = [
    "Walnut Wood Frame",
    "Oak Wood Frame",
    "Mahogany Frame",
    "Black Metal Frame",
    "Silver Metal Frame",
    "White Wood Frame",
    "Modern Walnut",
    "Classic Oak",
    "Rustic Pine",
    "Contemporary Black",
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

  const glazingOptions = [
    "Standard Glass",
    "UV-Protective Glass",
    "Anti-Reflective Glass",
    "Museum Glass",
    "Acrylic",
    "UV Acrylic",
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
                    {frameStyles.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
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
                    {glazingOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
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
          {/* Total Amount */}
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount *</FormLabel>
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

          {/* Deposit Amount */}
          <FormField
            control={form.control}
            name="depositAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deposit Amount</FormLabel>
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
