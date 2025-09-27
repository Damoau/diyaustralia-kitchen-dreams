import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Calendar, DollarSign } from "lucide-react";
import { useQuotes } from "@/hooks/useQuotes";

export const QuotesList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { getQuotes } = useQuotes();

  useEffect(() => {
    loadQuotes();
  }, [statusFilter, searchTerm]);

  // Listen for quote updates from detail page
  useEffect(() => {
    const handleQuoteUpdate = () => {
      loadQuotes();
    };
    
    window.addEventListener('quote-updated', handleQuoteUpdate);
    return () => window.removeEventListener('quote-updated', handleQuoteUpdate);
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const data = await getQuotes({
        status: statusFilter,
        search: searchTerm,
        adminView: false // Customer view
      });
      setQuotes(data);
    } catch (error) {
      console.error('Error loading quotes:', error);
      // Don't show error for empty results, just show empty state
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Mock data fallback for demo
  const mockQuotes = [
    {
      id: "QT-2024-001",
      label: "Kitchen Renovation",
      status: "pending_approval",
      amount: 12500,
      validUntil: "2024-02-15",
      createdAt: "2024-01-15",
      version: 2
    },
    {
      id: "QT-2024-002", 
      label: "Laundry Cabinets",
      status: "draft",
      amount: 3200,
      validUntil: "2024-02-01",
      createdAt: "2024-01-10",
      version: 1
    },
    {
      id: "QT-2023-045",
      label: "Pantry & Storage",
      status: "accepted",
      amount: 8900,
      validUntil: "2024-01-15",
      createdAt: "2023-12-20",
      version: 1
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      pending_approval: { variant: "secondary" as const, text: "Pending Approval" },
      draft: { variant: "outline" as const, text: "Draft" },
      accepted: { variant: "default" as const, text: "Accepted" },
      expired: { variant: "destructive" as const, text: "Expired" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.draft;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  // Use real quotes, no mock data
  const filteredQuotes = quotes.filter(quote => {
    const searchText = quote.quote_number || quote.id;
    const matchesSearch = searchText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quotes</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your quote requests.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search quotes by ID or label..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="revision_requested">Revision Requested</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuotes.map((quote) => (
          <Card key={quote.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{quote.quote_number}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {quote.customer_name || 'Unnamed Quote'}
                    </p>
                  </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(quote.status)}
                  {(quote.version || quote.version_number) > 1 && (
                    <Badge variant="outline" className="text-xs">
                      v{quote.version || quote.version_number}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">${((quote.total_amount || quote.amount) || 0).toLocaleString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Valid until {quote.valid_until}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Created {new Date(quote.created_at).toLocaleDateString()}</span>
                </div>

                <div className="pt-2">
                  <Button asChild className="w-full">
                    <Link to={`/portal/quotes/${quote.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredQuotes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No quotes found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "You don't have any quotes yet."
              }
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button asChild>
                <Link to="/get-quote">Request a Quote</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};