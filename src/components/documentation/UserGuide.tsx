import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  BookOpen,
  Users,
  Settings,
  ShoppingCart,
  FileText,
  Package,
  Rocket,
  Play,
  ChevronRight,
  ExternalLink,
  Video,
  Download
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  steps: GuideStep[];
  videoUrl?: string;
  downloadUrl?: string;
}

interface GuideStep {
  id: string;
  title: string;
  description: string;
  screenshot?: string;
  code?: string;
  tips?: string[];
}

const userGuides: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of using DIY Kitchen Dreams platform',
    category: 'basics',
    difficulty: 'beginner',
    estimatedTime: '10 minutes',
    steps: [
      {
        id: 'account-setup',
        title: 'Setting Up Your Account',
        description: 'Create your account and complete your profile to get personalized recommendations.',
        tips: [
          'Use a strong password for better security',
          'Verify your email address to receive important updates',
          'Complete your profile for better service'
        ]
      },
      {
        id: 'navigation',
        title: 'Platform Navigation',
        description: 'Learn how to navigate between different sections of the platform.',
        tips: [
          'Use the main navigation menu to access different areas',
          'The breadcrumb navigation shows your current location',
          'Quick actions are available in the top bar'
        ]
      },
      {
        id: 'first-steps',
        title: 'Your First Configuration',
        description: 'Create your first cabinet configuration using our intuitive tools.',
        tips: [
          'Start with a simple configuration to familiarize yourself',
          'Save your work frequently',
          'Use templates for common configurations'
        ]
      }
    ]
  },
  {
    id: 'cabinet-configuration',
    title: 'Cabinet Configuration',
    description: 'Master the cabinet configuration system',
    category: 'features',
    difficulty: 'intermediate',
    estimatedTime: '20 minutes',
    videoUrl: '/videos/cabinet-configuration.mp4',
    steps: [
      {
        id: 'selecting-type',
        title: 'Selecting Cabinet Types',
        description: 'Choose from our extensive range of cabinet types including base, wall, and pantry cabinets.',
        tips: [
          'Consider your kitchen layout when selecting types',
          'Base cabinets are typically 24" deep',
          'Wall cabinets come in various heights'
        ]
      },
      {
        id: 'customizing-dimensions',
        title: 'Customizing Dimensions',
        description: 'Adjust width, height, and depth to fit your specific requirements.',
        tips: [
          'Measure twice, configure once',
          'Consider appliance dimensions',
          'Account for clearance requirements'
        ]
      },
      {
        id: 'choosing-finishes',
        title: 'Choosing Finishes and Hardware',
        description: 'Select door styles, colors, and hardware to match your design vision.',
        tips: [
          'Consider the overall style of your kitchen',
          'Hardware should be proportional to door size',
          'Sample finishes before making final decisions'
        ]
      }
    ]
  },
  {
    id: 'ordering-process',
    title: 'Ordering Process',
    description: 'Complete guide to placing and managing orders',
    category: 'process',
    difficulty: 'beginner',
    estimatedTime: '15 minutes',
    steps: [
      {
        id: 'cart-review',
        title: 'Reviewing Your Cart',
        description: 'Double-check all configurations and quantities before proceeding.',
        tips: [
          'Verify all measurements are correct',
          'Check quantities for each item',
          'Review finish selections'
        ]
      },
      {
        id: 'checkout',
        title: 'Checkout Process',
        description: 'Complete your order with secure payment and delivery options.',
        tips: [
          'Have your delivery address ready',
          'Choose appropriate delivery timing',
          'Review payment information carefully'
        ]
      },
      {
        id: 'order-tracking',
        title: 'Order Tracking',
        description: 'Monitor your order progress from production to delivery.',
        tips: [
          'Check order status regularly',
          'Contact support if you have questions',
          'Prepare your space for delivery'
        ]
      }
    ]
  },
  {
    id: 'admin-features',
    title: 'Admin Features',
    description: 'Advanced administration and management features',
    category: 'admin',
    difficulty: 'advanced',
    estimatedTime: '30 minutes',
    steps: [
      {
        id: 'user-management',
        title: 'User Management',
        description: 'Manage user accounts, roles, and permissions.',
        tips: [
          'Assign appropriate roles to users',
          'Regularly review user permissions',
          'Use groups for easier management'
        ]
      },
      {
        id: 'product-management',
        title: 'Product Management',
        description: 'Add and update products, pricing, and configurations.',
        tips: [
          'Keep product information up to date',
          'Use consistent naming conventions',
          'Test configurations before publishing'
        ]
      },
      {
        id: 'analytics',
        title: 'Analytics and Reporting',
        description: 'Use analytics to understand usage patterns and performance.',
        tips: [
          'Monitor key performance indicators regularly',
          'Use data to improve user experience',
          'Export reports for external analysis'
        ]
      }
    ]
  }
];

export const UserGuide = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const categories = ['all', 'basics', 'features', 'process', 'admin'];

  const filteredGuides = userGuides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guide.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: GuideSection['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basics':
        return <BookOpen className="w-4 h-4" />;
      case 'features':
        return <Settings className="w-4 h-4" />;
      case 'process':
        return <ShoppingCart className="w-4 h-4" />;
      case 'admin':
        return <Users className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (selectedGuide) {
    const guide = userGuides.find(g => g.id === selectedGuide);
    if (!guide) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setSelectedGuide(null)}
            className="flex items-center space-x-2"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>Back to Guides</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            {guide.videoUrl && (
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Video className="w-4 h-4" />
                <span>Watch Video</span>
              </Button>
            )}
            {guide.downloadUrl && (
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  {getCategoryIcon(guide.category)}
                  <span>{guide.title}</span>
                </CardTitle>
                <CardDescription>{guide.description}</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getDifficultyColor(guide.difficulty)}>
                  {guide.difficulty}
                </Badge>
                <Badge variant="outline">{guide.estimatedTime}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {guide.steps.map((step, index) => (
                <div key={step.id} className="border-l-2 border-primary/20 pl-6 relative">
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs text-primary-foreground font-bold">{index + 1}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                    
                    {step.code && (
                      <div className="bg-muted p-4 rounded-lg">
                        <code className="text-sm">{step.code}</code>
                      </div>
                    )}
                    
                    {step.tips && step.tips.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Tips:</h4>
                        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                          {step.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="flex items-start space-x-2">
                              <span>•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>User Guide & Documentation</span>
          </CardTitle>
          <CardDescription>
            Comprehensive guides to help you make the most of DIY Kitchen Dreams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search guides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex space-x-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="flex items-center space-x-2"
                >
                  {getCategoryIcon(category)}
                  <span className="capitalize">{category === 'all' ? 'All Guides' : category}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map(guide => (
              <Card key={guide.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(guide.category)}
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Badge className={getDifficultyColor(guide.difficulty)}>
                        {guide.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>⏱️ {guide.estimatedTime}</span>
                      <span>📝 {guide.steps.length} steps</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGuide(guide.id)}
                      className="flex items-center space-x-2"
                    >
                      <Play className="w-3 h-3" />
                      <span>Start Guide</span>
                    </Button>
                  </div>
                  
                  {(guide.videoUrl || guide.downloadUrl) && (
                    <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
                      {guide.videoUrl && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <Video className="w-3 h-3" />
                          <span>Video</span>
                        </Badge>
                      )}
                      {guide.downloadUrl && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredGuides.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No guides found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or category filter.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};