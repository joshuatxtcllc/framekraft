
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Shield, Zap, TrendingUp, Server, Globe, Package, Activity, Clock, FileText, Download } from 'lucide-react';
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
      setLastRunTime(new Date());
      
      const totalTests = results.reduce((sum: number, category: ValidationResult) => sum + category.tests.length, 0);
      const passedTests = results.reduce((sum: number, category: ValidationResult) => 
        sum + category.tests.filter(test => test.status === 'pass').length, 0);
      const failedTests = results.reduce((sum: number, category: ValidationResult) => 
        sum + category.tests.filter(test => test.status === 'fail').length, 0);
      const warningTests = results.reduce((sum: number, category: ValidationResult) => 
        sum + category.tests.filter(test => test.status === 'warning').length, 0);
      
      toast({
        title: "System Validation Complete",
        description: `${passedTests} passed, ${failedTests} failed, ${warningTests} warnings`,
        variant: failedTests > 0 ? "destructive" : "default",
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Database': return <Database className="w-5 h-5" />;
      case 'Security': return <Shield className="w-5 h-5" />;
      case 'Performance': return <Zap className="w-5 h-5" />;
      case 'Business Logic': return <TrendingUp className="w-5 h-5" />;
      case 'API Endpoints': return <Server className="w-5 h-5" />;
      case 'Third-Party Services': return <Globe className="w-5 h-5" />;
      case 'Features': return <Package className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
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

  const calculateCategoryStats = () => {
    const stats: Record<string, { passed: number; failed: number; warnings: number; total: number }> = {};
    
    validationResults.forEach(category => {
      stats[category.category] = {
        passed: category.tests.filter(t => t.status === 'pass').length,
        failed: category.tests.filter(t => t.status === 'fail').length,
        warnings: category.tests.filter(t => t.status === 'warning').length,
        total: category.tests.length
      };
    });
    
    return stats;
  };

  const exportValidationReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      overallScore: calculateOverallScore(),
      results: validationResults,
      health: healthData,
      metrics: metricsData
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-validation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "System validation report has been downloaded",
    });
  };

  const overallScore = calculateOverallScore();
  const categoryStats = calculateCategoryStats();
  const filteredResults = selectedCategory === 'all' 
    ? validationResults 
    : validationResults.filter(r => r.category === selectedCategory);

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
                {lastRunTime && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Last run: {lastRunTime.toLocaleTimeString()}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportValidationReport} disabled={validationResults.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button onClick={runSystemValidation} disabled={isRunning}>
                  {isRunning ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Run Validation
                </Button>
              </div>
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

            {/* Quick Stats */}
            {validationResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(categoryStats).map(([category, stats]) => (
                  <Card key={category} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedCategory(category === selectedCategory ? 'all' : category)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        {getCategoryIcon(category)}
                        <Badge variant={stats.failed > 0 ? 'destructive' : stats.warnings > 0 ? 'secondary' : 'default'}>
                          {Math.round((stats.passed / stats.total) * 100)}%
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <div className="text-sm font-medium">{category}</div>
                        <div className="text-xs text-muted-foreground">
                          {stats.passed} pass, {stats.failed} fail, {stats.warnings} warn
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Validation Results with Tabs */}
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Detailed Results</TabsTrigger>
                <TabsTrigger value="summary">Summary View</TabsTrigger>
                <TabsTrigger value="issues">Issues Only</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6">
                {filteredResults.map((category, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        {getCategoryIcon(category.category)}
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
                            <div className="flex items-center space-x-3 flex-1">
                              {getStatusIcon(test.status)}
                              <div className="flex-1">
                                <div className="font-medium">{test.name}</div>
                                <div className="text-sm text-muted-foreground">{test.message}</div>
                                {test.details && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {typeof test.details === 'object' ? (
                                      <pre className="bg-muted p-2 rounded mt-2">
                                        {JSON.stringify(test.details, null, 2)}
                                      </pre>
                                    ) : test.details}
                                  </div>
                                )}
                                {test.responseTime !== undefined && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Response time: {test.responseTime}ms
                                  </div>
                                )}
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
              </TabsContent>
              
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {validationResults.map((category, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(category.category)}
                            <span>{category.category}</span>
                          </div>
                          <Badge variant={category.tests.some(t => t.status === 'fail') ? 'destructive' : 
                                        category.tests.some(t => t.status === 'warning') ? 'secondary' : 'default'}>
                            {category.tests.filter(t => t.status === 'pass').length}/{category.tests.length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Progress 
                          value={(category.tests.filter(t => t.status === 'pass').length / category.tests.length) * 100} 
                          className="h-2" 
                        />
                        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                          <div className="text-center">
                            <div className="font-semibold text-green-600">
                              {category.tests.filter(t => t.status === 'pass').length}
                            </div>
                            <div className="text-muted-foreground">Passed</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-red-600">
                              {category.tests.filter(t => t.status === 'fail').length}
                            </div>
                            <div className="text-muted-foreground">Failed</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-yellow-600">
                              {category.tests.filter(t => t.status === 'warning').length}
                            </div>
                            <div className="text-muted-foreground">Warnings</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="issues" className="space-y-4">
                {validationResults.filter(cat => 
                  cat.tests.some(t => t.status === 'fail' || t.status === 'warning')
                ).length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>All Clear!</AlertTitle>
                    <AlertDescription>
                      No issues found. All system validations passed successfully.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {validationResults.map((category) => {
                      const issues = category.tests.filter(t => t.status === 'fail' || t.status === 'warning');
                      if (issues.length === 0) return null;
                      
                      return (
                        <Card key={category.category}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              {getCategoryIcon(category.category)}
                              {category.category} Issues ({issues.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {issues.map((test, index) => (
                                <Alert key={index} variant={test.status === 'fail' ? 'destructive' : 'default'}>
                                  <div className="flex items-start gap-2">
                                    {getStatusIcon(test.status)}
                                    <div className="flex-1">
                                      <AlertTitle className="text-sm">{test.name}</AlertTitle>
                                      <AlertDescription className="text-xs mt-1">
                                        {test.message}
                                        {test.details && (
                                          <div className="mt-2">
                                            <pre className="bg-background p-2 rounded text-xs">
                                              {typeof test.details === 'object' 
                                                ? JSON.stringify(test.details, null, 2) 
                                                : test.details}
                                            </pre>
                                          </div>
                                        )}
                                      </AlertDescription>
                                    </div>
                                  </div>
                                </Alert>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>

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
