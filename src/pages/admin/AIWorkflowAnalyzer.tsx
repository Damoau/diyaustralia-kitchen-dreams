import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info,
  Loader2,
  ShoppingCart,
  Shield,
  Code,
  Database,
  FileCode
} from "lucide-react";
import { CheckoutFlowValidator } from "@/components/admin/CheckoutFlowValidator";

interface AnalysisResult {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  file?: string;
  line?: number;
  recommendation?: string;
}

export default function AIWorkflowAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<string>("");

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-success" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
      info: 'outline'
    };
    return <Badge variant={variants[severity] || 'outline'}>{severity.toUpperCase()}</Badge>;
  };

  const runSecurityAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentAnalysis("Running security analysis...");
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-code-assistant', {
        body: {
          type: 'security_analysis',
          files: [
            { path: 'src/hooks/useAuth.ts', content: '' },
            { path: 'src/hooks/useCheckout.ts', content: '' },
            { path: 'src/components/checkout/CustomerIdentify.tsx', content: '' },
            { path: 'src/components/checkout/PaymentStep.tsx', content: '' },
          ]
        }
      });

      if (error) throw error;

      // Parse AI response into structured results
      const parsedResults = parseAIResponse(data.analysis, 'security');
      setResults(parsedResults);
      toast.success("Security analysis complete");
    } catch (error) {
      console.error('Security analysis error:', error);
      toast.error("Failed to run security analysis");
    } finally {
      setIsAnalyzing(false);
      setCurrentAnalysis("");
    }
  };

  const runCodeQualityAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentAnalysis("Analyzing code quality...");
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-code-assistant', {
        body: {
          type: 'code_quality',
          files: [
            { path: 'src/pages/Checkout.tsx', content: '' },
            { path: 'src/hooks/useCart.ts', content: '' },
            { path: 'src/hooks/useCartOptimized.ts', content: '' },
          ]
        }
      });

      if (error) throw error;

      const parsedResults = parseAIResponse(data.analysis, 'code_quality');
      setResults(parsedResults);
      toast.success("Code quality analysis complete");
    } catch (error) {
      console.error('Code quality analysis error:', error);
      toast.error("Failed to run code quality analysis");
    } finally {
      setIsAnalyzing(false);
      setCurrentAnalysis("");
    }
  };

  const runDatabaseAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentAnalysis("Analyzing database schema...");
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-code-assistant', {
        body: {
          type: 'database_analysis',
          content: 'Analyze carts, cart_items, checkouts, orders, order_items tables and their relationships'
        }
      });

      if (error) throw error;

      const parsedResults = parseAIResponse(data.analysis, 'database');
      setResults(parsedResults);
      toast.success("Database analysis complete");
    } catch (error) {
      console.error('Database analysis error:', error);
      toast.error("Failed to run database analysis");
    } finally {
      setIsAnalyzing(false);
      setCurrentAnalysis("");
    }
  };

  const parseAIResponse = (response: string, type: string): AnalysisResult[] => {
    // Simple parser - in production, you'd want more sophisticated parsing
    const results: AnalysisResult[] = [];
    
    // Look for severity indicators
    const criticalMatches = response.match(/CRITICAL[:\s]+(.*?)(?=HIGH|MEDIUM|LOW|$)/gis);
    const highMatches = response.match(/HIGH[:\s]+(.*?)(?=CRITICAL|MEDIUM|LOW|$)/gis);
    const mediumMatches = response.match(/MEDIUM[:\s]+(.*?)(?=CRITICAL|HIGH|LOW|$)/gis);
    
    criticalMatches?.forEach(match => {
      results.push({
        type,
        severity: 'critical',
        title: 'Critical Issue',
        description: match.trim().substring(0, 200),
      });
    });

    highMatches?.forEach(match => {
      results.push({
        type,
        severity: 'high',
        title: 'High Priority Issue',
        description: match.trim().substring(0, 200),
      });
    });

    mediumMatches?.forEach(match => {
      results.push({
        type,
        severity: 'medium',
        title: 'Medium Priority Issue',
        description: match.trim().substring(0, 200),
      });
    });

    if (results.length === 0) {
      results.push({
        type,
        severity: 'info',
        title: 'Analysis Complete',
        description: response.substring(0, 500),
      });
    }

    return results;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Workflow Analyzer</h1>
        <p className="text-muted-foreground">
          Powered by Google Gemini - Analyze workflows, security, and code quality
        </p>
      </div>

      <Tabs defaultValue="checkout" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="checkout">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Checkout Flow
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="quality">
            <Code className="h-4 w-4 mr-2" />
            Code Quality
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkout">
          <CheckoutFlowValidator />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Analysis</CardTitle>
              <CardDescription>
                Analyze authentication, authorization, and security vulnerabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runSecurityAnalysis} 
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Run Security Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Code Quality Analysis</CardTitle>
              <CardDescription>
                Check for best practices, performance issues, and maintainability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runCodeQualityAnalysis} 
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Code className="h-4 w-4 mr-2" />
                    Run Code Quality Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Analysis</CardTitle>
              <CardDescription>
                Analyze schema, relationships, and RLS policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runDatabaseAnalysis} 
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Run Database Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isAnalyzing && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>{currentAnalysis}</AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              Found {results.length} items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(result.severity)}
                          <div>
                            <CardTitle className="text-base">{result.title}</CardTitle>
                            {result.file && (
                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <FileCode className="h-3 w-3" />
                                {result.file}
                                {result.line && `:${result.line}`}
                              </div>
                            )}
                          </div>
                        </div>
                        {getSeverityBadge(result.severity)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {result.description}
                      </p>
                      {result.recommendation && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Recommendation:</strong> {result.recommendation}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
