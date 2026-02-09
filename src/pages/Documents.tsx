import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Upload, FileText, Download, Eye, Calendar, AlertCircle } from "lucide-react";
import { api } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Document {
  id: number;
  title: string;
  tenant_name: string;
  category_name: string;
  file_type: string;
  document_date: string;
  expiry_date: string | null;
  is_expired: boolean;
  is_signed: boolean;
  file_size: number;
}

interface DocumentCategory {
  id: string;
  name: string;
  display_name: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expiryFilter, setExpiryFilter] = useState<string>("all");
  
  useEffect(() => {
    loadDocuments();
    loadCategories();
  }, [selectedCategory, expiryFilter]);
  
  const loadDocuments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }
      if (expiryFilter !== "all") {
        params.expiry_status = expiryFilter;
      }
      
      const response = await api.request('/documents/', {
        method: 'GET',
        params
      });
      
      if (response.data) {
        setDocuments(response.data);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadCategories = async () => {
    try {
      const response = await api.request('/document-categories/');
      if (response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };
  
  const handleDownload = async (documentId: number, title: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/documents/${documentId}/download/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };
  
  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Documents" />
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="Documents"
        action={
          <Button>
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        }
      />
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                {category.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={expiryFilter} onValueChange={setExpiryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Documents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Documents</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((document) => (
          <div
            key={document.id}
            className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-secondary rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm line-clamp-1">{document.title}</h3>
                  <p className="text-xs text-muted-foreground">{document.tenant_name || 'General'}</p>
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {document.file_type}
              </span>
            </div>
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Category:</span>
                <span>{document.category_name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Date:</span>
                <span>{formatDate(document.document_date)}</span>
              </div>
              {document.expiry_date && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Expires:</span>
                  <span className={document.is_expired ? "text-destructive" : ""}>
                    {formatDate(document.expiry_date)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Size:</span>
                <span>{formatFileSize(document.file_size)}</span>
              </div>
            </div>
            
            {/* Status Badges */}
            <div className="flex gap-2 mb-3">
              {document.is_signed && (
                <StatusBadge variant="success" size="sm">Signed</StatusBadge>
              )}
              {document.is_expired && (
                <StatusBadge variant="destructive" size="sm">Expired</StatusBadge>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {}}
              >
                <Eye className="h-3 w-3" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleDownload(document.id, document.title)}
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {documents.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
          <p className="text-muted-foreground mb-4">
            Upload your first document to get started
          </p>
          <Button>
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </div>
      )}
      
      {/* Expiry Alerts */}
      <div className="mt-6 bg-warning/10 border border-warning/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-warning" />
          <h3 className="font-semibold">Document Expiry Alerts</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          You have {documents.filter(d => d.is_expired).length} expired documents and{' '}
          {documents.filter(d => !d.is_expired && d.expiry_date).length} documents expiring soon.
        </p>
      </div>
    </AppLayout>
  );
}