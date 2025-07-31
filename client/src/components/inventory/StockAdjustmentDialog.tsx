
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Inventory } from "../../../../shared/schema";

interface StockAdjustmentDialogProps {
  item: Inventory;
}

export default function StockAdjustmentDialog({ item }: StockAdjustmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [newQuantity, setNewQuantity] = useState(item.quantity || 0);

  const queryClient = useQueryClient();

  const updateStockMutation = useMutation({
    mutationFn: async (quantity: number) => {
      const response = await fetch(`/api/inventory/${item.id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error("Failed to update stock");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast.success("Stock updated successfully");
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to update stock");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStockMutation.mutate(newQuantity);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Package className="w-4 h-4 mr-1" />
          Adjust Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust Stock - {item.itemName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Current Stock: {item.quantity}</Label>
          </div>

          <div>
            <Label htmlFor="newQuantity">New Quantity</Label>
            <Input
              id="newQuantity"
              type="number"
              min="0"
              value={newQuantity}
              onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateStockMutation.isPending}
            >
              {updateStockMutation.isPending ? "Updating..." : "Update Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
