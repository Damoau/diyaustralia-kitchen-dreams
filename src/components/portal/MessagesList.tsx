import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  MessageSquare, 
  Send, 
  Paperclip,
  User,
  UserCheck,
  Clock
} from "lucide-react";

export const MessagesList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Mock data - in real app this would come from API
  const threads = [
    {
      id: "t1",
      subject: "Kitchen Renovation - Design Changes",
      scope: "quote",
      scopeId: "QT-2024-001",
      scopeLabel: "Kitchen Renovation Quote",
      unreadCount: 2,
      lastMessageAt: "2024-01-20T10:30:00Z",
      lastMessage: "Thanks for the updated measurements. We'll revise the quote accordingly.",
      messages: [
        {
          id: "m1",
          content: "Hi, I'd like to make some changes to the kitchen design. Can we adjust the island size?",
          author: "customer",
          authorName: "John Smith",
          createdAt: "2024-01-19T14:20:00Z",
          attachments: []
        },
        {
          id: "m2",
          content: "Of course! What dimensions would you prefer for the island?",
          author: "staff",
          authorName: "Sarah Johnson - Design Team",
          createdAt: "2024-01-19T15:45:00Z",
          attachments: []
        },
        {
          id: "m3",
          content: "Could we make it 2400mm x 1000mm instead? I've attached the updated floor plan.",
          author: "customer",
          authorName: "John Smith",
          createdAt: "2024-01-20T09:15:00Z",
          attachments: ["updated-floor-plan.pdf"]
        },
        {
          id: "m4",
          content: "Thanks for the updated measurements. We'll revise the quote accordingly.",
          author: "staff",
          authorName: "Sarah Johnson - Design Team",
          createdAt: "2024-01-20T10:30:00Z",
          attachments: [],
          isUnread: true
        }
      ]
    },
    {
      id: "t2",
      subject: "Order Status Update - Production Timeline",
      scope: "order",
      scopeId: "ORD-2024-001",
      scopeLabel: "Kitchen Renovation Order",
      unreadCount: 1,
      lastMessageAt: "2024-01-18T16:20:00Z",
      lastMessage: "Your order is now in the CNC cutting stage. Expected completion is still on track for February 15th.",
      messages: [
        {
          id: "m5",
          content: "Could you provide an update on the production timeline?",
          author: "customer",
          authorName: "John Smith",
          createdAt: "2024-01-18T14:00:00Z",
          attachments: []
        },
        {
          id: "m6",
          content: "Your order is now in the CNC cutting stage. Expected completion is still on track for February 15th.",
          author: "staff",
          authorName: "Mike Chen - Production Manager",
          createdAt: "2024-01-18T16:20:00Z",
          attachments: [],
          isUnread: true
        }
      ]
    },
    {
      id: "t3",
      subject: "Installation Consultation Request",
      scope: "general",
      scopeId: null,
      scopeLabel: "General Inquiry",
      unreadCount: 0,
      lastMessageAt: "2024-01-15T11:45:00Z",
      lastMessage: "Perfect! I'll send you the installation guide and schedule a consultation call.",
      messages: [
        {
          id: "m7",
          content: "Hi, I'd like to schedule a consultation for cabinet installation. What's your availability?",
          author: "customer",
          authorName: "John Smith",
          createdAt: "2024-01-15T10:20:00Z",
          attachments: []
        },
        {
          id: "m8",
          content: "Perfect! I'll send you the installation guide and schedule a consultation call.",
          author: "staff",
          authorName: "Lisa Wong - Customer Service",
          createdAt: "2024-01-15T11:45:00Z",
          attachments: ["installation-guide.pdf"]
        }
      ]
    }
  ];

  const getScopeBadge = (scope: string) => {
    const variants = {
      quote: { variant: "secondary" as const, text: "Quote" },
      order: { variant: "default" as const, text: "Order" },
      general: { variant: "outline" as const, text: "General" }
    };
    
    const config = variants[scope as keyof typeof variants] || variants.general;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         thread.scopeLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "unread" && thread.unreadCount > 0) ||
                         (statusFilter === "read" && thread.unreadCount === 0);
    return matchesSearch && matchesStatus;
  });

  const selectedThreadData = selectedThread ? threads.find(t => t.id === selectedThread) : null;

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedThreadData) return;
    
    // In real app, this would send the message to the server
    console.log("Sending message:", newMessage);
    setNewMessage("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-2">
          Communicate with our team about your quotes and orders.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Messages List */}
        <div className="lg:col-span-1 flex flex-col">
          {/* Filters */}
          <div className="space-y-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter messages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Threads */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredThreads.map((thread) => (
              <Card 
                key={thread.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedThread === thread.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedThread(thread.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-sm line-clamp-1">{thread.subject}</p>
                      {thread.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getScopeBadge(thread.scope)}
                      <span className="text-xs text-muted-foreground truncate">
                        {thread.scopeLabel}
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {thread.lastMessage}
                    </p>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDate(thread.lastMessageAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2 flex flex-col">
          {selectedThreadData ? (
            <>
              {/* Thread Header */}
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedThreadData.subject}</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedThreadData.scopeLabel}</p>
                    </div>
                    {getScopeBadge(selectedThreadData.scope)}
                  </div>
                </CardHeader>
              </Card>

              {/* Messages */}
              <Card className="flex-1 flex flex-col">
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedThreadData.messages.map((message) => (
                    <div key={message.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {message.author === "customer" ? <User className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{message.authorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.createdAt)}
                        </span>
                        {message.isUnread && (
                          <Badge variant="destructive" className="text-xs">New</Badge>
                        )}
                      </div>
                      
                      <div className="ml-8 space-y-2">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {message.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                                <Paperclip className="w-3 h-3" />
                                {attachment}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
                
                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the list to view messages.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {filteredThreads.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No messages found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "You don't have any messages yet."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};