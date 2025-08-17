
import React, { useState, useEffect } from 'react';
import { Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: number;
  artworkDimensions: { width: number; height: number; unit: string };
  frameStyle?: string;
  frameColor?: string;
  matOption: 'none' | 'single' | 'double';
  matColor1?: string;
  matColor2?: string;
  totalPrice: number;
  artworkImage?: string;
}

export default function Cart() {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('frameCart') || '[]');
    setCartItems(savedCart);
  }, []);

  const removeItem = (id: number) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('frameCart', JSON.stringify(updatedCart));
    toast({
      title: "Item Removed",
      description: "Item removed from cart",
    });
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('frameCart');
    toast({
      title: "Cart Cleared",
      description: "All items removed from cart",
    });
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Shopping Cart</h1>
                <p className="text-muted-foreground">
                  {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
                </p>
              </div>
              {cartItems.length > 0 && (
                <Button variant="outline" onClick={clearCart}>
                  Clear Cart
                </Button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                  <p className="text-muted-foreground mb-4">
                    Add some custom frame designs to get started
                  </p>
                  <Button asChild>
                    <a href="/virtual-frame-designer">
                      Design a Frame
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">Custom Frame Design</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <strong>Dimensions:</strong> {item.artworkDimensions.width}" × {item.artworkDimensions.height}"
                            </div>
                            <div>
                              <strong>Frame:</strong> {item.frameStyle} - {item.frameColor}
                            </div>
                            <div>
                              <strong>Mat:</strong> {item.matOption === 'none' ? 'No Mat' : 
                                item.matOption === 'single' ? `Single Mat (${item.matColor1})` : 
                                `Double Mat (${item.matColor1}, ${item.matColor2})`}
                            </div>
                            <div>
                              <strong>Price:</strong> ${item.totalPrice}.00
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">${item.totalPrice}.00</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">Total: ${totalPrice}.00</h3>
                        <p className="text-sm text-muted-foreground">
                          Ready to create your custom frames?
                        </p>
                      </div>
                      <Button size="lg">
                        Proceed to Checkout
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
