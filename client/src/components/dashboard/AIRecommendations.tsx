import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Frame, AlertTriangle, ArrowRight, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function AIRecommendations() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          AI features have been disabled to reduce complexity. Focus on core business operations.
        </p>
      </CardContent>
    </Card>
  );
}