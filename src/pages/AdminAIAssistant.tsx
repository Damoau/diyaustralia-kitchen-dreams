import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Shield, 
  Code, 
  Database, 
  MessageSquare, 
  Send, 
  Loader2,
  FileCode,
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Scan,
  Zap
} from 'lucide-react';
import {
  SECURITY_SCAN_FILES,
  CODE_QUALITY_SCAN_FILES,
  DATABASE_SCAN_FILES,
  categorizeFile,
  type FileInfo
} from '@/utils/fileScanner';
import {
  createSecurityAnalysisPrompt,
  createCodeQualityPrompt,
  createDatabaseAnalysisPrompt
} from '@/utils/codeAnalysisHelper';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysisType?: string;
}

interface FileOption {
  path: string;
  name: string;
  type: 'component' | 'page' | 'hook' | 'lib' | 'config';
}

const AdminAIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<string>('chat');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Sample file structure - in a real app, this would come from your build system
  const availableFiles: FileOption[] = [
    { path: 'src/hooks/useAuth.ts', name: 'useAuth Hook', type: 'hook' },
    { path: 'src/hooks/useCart.ts', name: 'useCart Hook', type: 'hook' },
    { path: 'src/lib/pricing.ts', name: 'Pricing Library', type: 'lib' },
    { path: 'src/lib/dynamicPricing.ts', name: 'Dynamic Pricing', type: 'lib' },
    { path: 'src/components/cabinet/CellConfigPopup.tsx', name: 'Cell Config Popup', type: 'component' },
    { path: 'src/pages/Admin.tsx', name: 'Admin Page', type: 'page' },
    { path: 'src/pages/Auth.tsx', name: 'Auth Page', type: 'page' },
    { path: 'src/integrations/supabase/client.ts', name: 'Supabase Client', type: 'config' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const runBatchAnalysis = async (fileList: string[], type: typeof analysisType, customPrompt?: string) => {
    setIsLoading(true);
    
    const scanName = type === 'security_analysis' ? 'Security Audit' :
                     type === 'code_quality' ? 'Code Quality Review' :
                     'Database Analysis';
    
    addMessage({
      type: 'user',
      content: `Running ${scanName} on ${fileList.length} files...`
    });

    try {
      const categorizedFiles = fileList
        .map(categorizeFile)
        .filter((f): f is FileInfo => f !== null);

      let prompt = customPrompt;
      if (!prompt) {
        if (type === 'security_analysis') {
          prompt = createSecurityAnalysisPrompt(categorizedFiles);
        } else if (type === 'code_quality') {
          prompt = createCodeQualityPrompt(categorizedFiles);
        }
      }

      const { data, error } = await supabase.functions.invoke('ai-code-assistant', {
        body: {
          type,
          content: prompt || fileList.join('\n'),
          files: []
        }
      });

      if (error) throw error;

      addMessage({
        type: 'assistant',
        content: data.analysis,
        analysisType: type
      });

      toast({
        title: "Analysis Complete",
        description: `${scanName} finished successfully`,
      });
    } catch (error: any) {
      console.error('Error running batch analysis:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || `Failed to run ${scanName}`,
        variant: "destructive",
      });
      addMessage({
        type: 'assistant',
        content: `❌ ${scanName} failed: ${error.message || 'Unknown error'}`,
        analysisType: type
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!input.trim() && analysisType === 'chat') return;
    
    setIsLoading(true);
    
    try {
      let analysisContent = '';
      let userMessage = '';
      
      if (analysisType === 'chat') {
        userMessage = input.trim();
        addMessage({ type: 'user', content: userMessage });
      } else {
        analysisContent = `// Selected files: ${selectedFiles.join(', ')}`;
        userMessage = `Running ${analysisType.replace('_', ' ')} analysis${selectedFiles.length > 0 ? ` on: ${selectedFiles.join(', ')}` : ''}`;
        addMessage({ 
          type: 'user', 
          content: userMessage,
          analysisType 
        });
      }

      const { data, error } = await supabase.functions.invoke('ai-code-assistant', {
        body: {
          type: analysisType,
          content: analysisContent,
          question: analysisType === 'chat' ? input : undefined,
          files: selectedFiles.length > 0 ? selectedFiles.map(path => ({
            path,
            content: '// File content would be loaded here'
          })) : undefined
        }
      });

      if (error) throw error;

      if (data?.analysis) {
        addMessage({ 
          type: 'assistant', 
          content: data.analysis,
          analysisType 
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }

      setInput('');
      
    } catch (error: any) {
      console.error('AI Assistant error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to get AI analysis",
        variant: "destructive",
      });
      
      addMessage({ 
        type: 'assistant', 
        content: `❌ Analysis failed: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runAnalysis();
    }
  };

  const getAnalysisIcon = (type?: string) => {
    switch (type) {
      case 'security_analysis': return <Shield className="h-4 w-4 text-red-500" />;
      case 'code_quality': return <Code className="h-4 w-4 text-blue-500" />;
      case 'database_analysis': return <Database className="h-4 w-4 text-green-500" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getSeverityIcon = (text: string) => {
    if (text.includes('CRITICAL') || text.includes('🔴')) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (text.includes('HIGH') || text.includes('🟡')) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
    if (text.includes('MEDIUM') || text.includes('🔵')) {
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
    if (text.includes('LOW') || text.includes('🟢')) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const toggleFileSelection = (filePath: string) => {
    setSelectedFiles(prev => 
      prev.includes(filePath) 
        ? prev.filter(f => f !== filePath)
        : [...prev, filePath]
    );
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Bot className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">AI Code Assistant</h1>
              <p className="text-muted-foreground">AI-powered security and code quality analysis</p>
            </div>
          </div>

          <div className="flex-1 grid lg:grid-cols-4 gap-6 overflow-hidden">
            {/* Left Sidebar - Analysis Tools */}
            <div className="lg:col-span-1 space-y-4 overflow-y-auto">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Analysis Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Button
                      variant={analysisType === 'security_analysis' ? 'default' : 'outline'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setAnalysisType('security_analysis')}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Security Analysis
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-7"
                      onClick={() => runBatchAnalysis(SECURITY_SCAN_FILES, 'security_analysis')}
                      disabled={isLoading}
                    >
                      <Scan className="h-3 w-3 mr-2" />
                      Full Security Audit
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <Button
                      variant={analysisType === 'code_quality' ? 'default' : 'outline'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setAnalysisType('code_quality')}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Code Quality
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-7"
                      onClick={() => runBatchAnalysis(CODE_QUALITY_SCAN_FILES, 'code_quality')}
                      disabled={isLoading}
                    >
                      <Zap className="h-3 w-3 mr-2" />
                      Complete Code Review
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <Button
                      variant={analysisType === 'database_analysis' ? 'default' : 'outline'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setAnalysisType('database_analysis')}
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Database Analysis
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-7"
                      onClick={() => runBatchAnalysis(DATABASE_SCAN_FILES, 'database_analysis')}
                      disabled={isLoading}
                    >
                      <Database className="h-3 w-3 mr-2" />
                      Database Security Check
                    </Button>
                  </div>
                  
                  <Button
                    variant={analysisType === 'chat' ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setAnalysisType('chat')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat Mode
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* File Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <FileCode className="h-4 w-4 mr-2" />
                  Files to Analyze
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {availableFiles.map((file) => (
                      <div
                        key={file.path}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          selectedFiles.includes(file.path)
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleFileSelection(file.path)}
                      >
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{file.path}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {selectedFiles.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">
                      {selectedFiles.length} file(s) selected
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedFiles([])}
                      className="w-full"
                    >
                      Clear Selection
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3 flex flex-col overflow-hidden">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getAnalysisIcon(analysisType)}
                    AI Assistant Chat
                  </div>
                  <Badge variant="secondary">
                    {analysisType.replace('_', ' ')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
                {/* Messages */}
                <ScrollArea className="flex-1 pr-2 -mx-2">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Welcome! I'm your AI assistant for code analysis and security.</p>
                        <p className="text-sm mt-2">
                          Select an analysis type and ask me anything about your codebase.
                        </p>
                      </div>
                    )}
                    
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {message.type === 'assistant' && getAnalysisIcon(message.analysisType)}
                            <div className="flex-1">
                              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {message.content.split('\n').map((line, i) => {
                                  const icon = getSeverityIcon(line);
                                  return (
                                    <div key={i} className={`${icon ? 'flex items-center gap-2' : ''}`}>
                                      {icon}
                                      {line}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="text-xs opacity-70 mt-2">
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Analyzing code...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                <Separator className="my-3" />

                {/* Input Area */}
                <div className="space-y-3 flex-shrink-0">
                  {analysisType !== 'chat' && (
                    <Button
                      onClick={runAnalysis}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        getAnalysisIcon(analysisType)
                      )}
                      <span className="ml-2">
                        Run {analysisType.replace('_', ' ')} Analysis
                      </span>
                    </Button>
                  )}
                  
                  {analysisType === 'chat' && (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask me about security, code quality, or anything else..."
                          rows={2}
                          className="resize-none min-h-[60px]"
                        />
                      </div>
                      <Button
                        onClick={runAnalysis}
                        disabled={!input.trim() || isLoading}
                        size="icon"
                        className="h-[60px] w-12"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default AdminAIAssistant;