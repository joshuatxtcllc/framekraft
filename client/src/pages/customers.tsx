import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CustomerList from "@/components/customers/CustomerList";
import CustomerForm from "@/components/customers/CustomerForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Customers() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const response = await apiRequest("POST", "/api/customers", customerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsFormOpen(false);
      setEditingCustomer(null);
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, ...customerData }: any) => {
      const response = await apiRequest("PUT", `/api/customers/${id}`, customerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsFormOpen(false);
      setEditingCustomer(null);
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, ...data });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Page Header */}
              <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-foreground sm:text-3xl sm:truncate">
                    Customers
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage your customer relationships and track their framing history.
                  </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                  <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                      <Button className="btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Customer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                        </DialogTitle>
                      </DialogHeader>
                      <CustomerForm
                        initialData={editingCustomer}
                        onSubmit={handleSubmit}
                        isLoading={createCustomerMutation.isPending || updateCustomerMutation.isPending}
                        onCancel={() => {
                          setIsFormOpen(false);
                          setEditingCustomer(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Customers List */}
              <CustomerList 
                customers={customers || []} 
                isLoading={isLoading}
                onEdit={handleEdit}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
