
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Shield, Zap, TrendingUp } from 'lucide-react';
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ValidationResult {
  category: string;
  tests: {
    name: string;
    status: 'pass' | 'fail' | 'warning' | 'running';
    message: string;
    details?: any;
  }[];
}

export default function SystemValidation() {
  const { toast } = useToast();
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const { data: healthData } = useQuery({
    queryKey: ["/health"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const { data: metricsData } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const runSystemValidation = async () => {
    setIsRunning(true);
    try {
      const response = await apiRequest("POST", "/api/system/validate", {});
      const results = await response.json();
      setValidationResults(results);
      
      const totalTests = results.reduce((sum: number, category: ValidationResult) => sum + category.tests.length, 0);
      const passedTests = results.reduce((sum: number, category: ValidationResult) => 
        sum + category.tests.filter(test => test.status === 'pass').length, 0);
      
      toast({
        title: "System Validation Complete",
        description: `${passedTests}/${totalTests} tests passed`,
        variant: passedTests === totalTests ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: "Unable to run system validation",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runSystemValidation();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'running': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-50';
      case 'fail': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const calculateOverallScore = () => {
    if (validationResults.length === 0) return 0;
    
    const totalTests = validationResults.reduce((sum, category) => sum + category.tests.length, 0);
    const passedTests = validationResults.reduce((sum, category) => 
      sum + category.tests.filter(test => test.status === 'pass').length, 0);
    
    return totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  };

  const overallScore = calculateOverallScore();

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">System Validation</h1>
                <p className="text-muted-foreground">
                  Comprehensive testing and validation of all FrameCraft features
                </p>
              </div>
              <Button onClick={runSystemValidation} disabled={isRunning}>
                {isRunning ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Run Validation
              </Button>
            </div>

            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Overall System Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">System Score</span>
                    <span className={`text-2xl font-bold ${
                      overallScore >= 90 ? 'text-green-600' : 
                      overallScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {overallScore}%
                    </span>
                  </div>
                  <Progress value={overallScore} className="h-2" />
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {healthData?.status === 'healthy' ? '✓' : '✗'}
                      </div>
                      <div className="text-muted-foreground">Infrastructure</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        ${metricsData?.monthlyRevenue?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-muted-foreground">Revenue Tracking</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {validationResults.length > 0 ? '✓' : '⏳'}
                      </div>
                      <div className="text-muted-foreground">Feature Tests</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation Results */}
            <div className="grid gap-6">
              {validationResults.map((category, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {category.category === 'Database' && <Database className="w-5 h-5" />}
                      {category.category === 'Security' && <Shield className="w-5 h-5" />}
                      {category.category === 'Performance' && <Zap className="w-5 h-5" />}
                      {category.category === 'Business Logic' && <TrendingUp className="w-5 h-5" />}
                      <span>{category.category}</span>
                      <Badge variant="outline">
                        {category.tests.filter(t => t.status === 'pass').length}/{category.tests.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.tests.map((test, testIndex) => (
                        <div key={testIndex} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(test.status)}
                            <div>
                              <div className="font-medium">{test.name}</div>
                              <div className="text-sm text-muted-foreground">{test.message}</div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(test.status)}>
                            {test.status.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* System Status */}
            {healthData && (
              <Card>
                <CardHeader>
                  <CardTitle>Live System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${
                        healthData.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {healthData.status?.toUpperCase()}
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Status</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${
                        healthData.database?.status === 'connected' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {healthData.database?.status?.toUpperCase()}
                      </div>
                      <div className="text-sm text-muted-foreground">Database</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {healthData.memory?.heapUsed ? 
                          `${Math.round(healthData.memory.heapUsed / 1024 / 1024)}MB` : 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Memory Usage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {healthData.uptime ? `${Math.round(healthData.uptime / 3600)}h` : 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
