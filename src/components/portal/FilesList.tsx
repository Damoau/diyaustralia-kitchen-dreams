import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  Files, 
  Upload, 
  Download, 
  Eye, 
  FileText,
  Image,
  FileIcon,
  Calendar
} from "lucide-react";

export const FilesList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Mock data - in real app this would come from API
  const files = [
    {
      id: "f1",
      name: "kitchen-floor-plan.pdf",
      type: "application/pdf",
      size: 2450000, // bytes
      uploadedAt: "2024-01-15",
      scope: "quote",
      scopeId: "QT-2024-001",
      scopeLabel: "Kitchen Renovation Quote"
    },
    {
      id: "f2",
      name: "cabinet-style-reference.jpg",
      type: "image/jpeg",
      size: 1250000,
      uploadedAt: "2024-01-12",
      scope: "quote",
      scopeId: "QT-2024-001",
      scopeLabel: "Kitchen Renovation Quote"
    },
    {
      id: "f3",
      name: "measurements-final.pdf",
      type: "application/pdf",
      size: 850000,
      uploadedAt: "2024-01-08",
      scope: "order",
      scopeId: "ORD-2024-001",
      scopeLabel: "Kitchen Renovation Order"
    },
    {
      id: "f4",
      name: "installation-photos.zip",
      type: "application/zip",
      size: 15750000,
      uploadedAt: "2024-01-20",
      scope: "order",
      scopeId: "ORD-2024-001",
      scopeLabel: "Kitchen Renovation Order"
    }
  ];

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <Image className="w-4 h-4" />;
    } else if (type === "application/pdf") {
      return <FileText className="w-4 h-4" />;
    } else {
      return <FileIcon className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getScopeBadge = (scope: string) => {
    const variants = {
      quote: { variant: "secondary" as const, text: "Quote" },
      order: { variant: "default" as const, text: "Order" },
      general: { variant: "outline" as const, text: "General" }
    };
    
    const config = variants[scope as keyof typeof variants] || variants.general;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.scopeLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScope = scopeFilter === "all" || file.scope === scopeFilter;
    return matchesSearch && matchesScope;
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // In real app, this would upload files to the server
      console.log("Uploading files:", files);
      setUploadDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Files</h1>
          <p className="text-muted-foreground mt-2">
            Manage files for your quotes and orders.
          </p>
        </div>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select files to upload
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="w-full p-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                  accept=".pdf,.jpg,.jpeg,.png,.zip,.doc,.docx"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Supported formats: PDF, JPG, PNG, ZIP, DOC, DOCX. Max 100MB per file.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search files by name or scope..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Files</SelectItem>
            <SelectItem value="quote">Quote Files</SelectItem>
            <SelectItem value="order">Order Files</SelectItem>
            <SelectItem value="general">General Files</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Files List */}
      <div className="space-y-3">
        {filteredFiles.map((file) => (
          <Card key={file.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <Calendar className="w-3 h-3" />
                      <span>{file.uploadedAt}</span>
                      <span>•</span>
                      <span className="truncate">{file.scopeLabel}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {getScopeBadge(file.scope)}
                  
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Files className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || scopeFilter !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "You haven't uploaded any files yet."
              }
            </p>
            {!searchTerm && scopeFilter === "all" && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First File
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};