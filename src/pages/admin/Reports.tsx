import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Download, Calendar, DollarSign, Package, Users } from 'lucide-react';

const Reports = () => {
  const reportCategories = [
    {
      title: 'Sales Reports',
      description: 'Revenue, orders, and sales performance analytics',
      reports: [
        { name: 'Daily Sales Summary', last_run: '2024-01-15', format: 'PDF' },
        { name: 'Monthly Revenue Report', last_run: '2024-01-01', format: 'Excel' },
        { name: 'Product Performance', last_run: '2024-01-14', format: 'CSV' },
      ]
    },
    {
      title: 'Operations Reports',
      description: 'Production, inventory, and fulfillment analytics', 
      reports: [
        { name: 'Production Schedule', last_run: '2024-01-15', format: 'PDF' },
        { name: 'Inventory Levels', last_run: '2024-01-15', format: 'Excel' },
        { name: 'Shipping Performance', last_run: '2024-01-14', format: 'CSV' },
      ]
    },
    {
      title: 'Customer Reports',
      description: 'Customer behavior, retention, and satisfaction metrics',
      reports: [
        { name: 'Customer Acquisition', last_run: '2024-01-10', format: 'PDF' },
        { name: 'Order History Analysis', last_run: '2024-01-12', format: 'Excel' },
        { name: 'Customer Satisfaction', last_run: '2024-01-08', format: 'CSV' },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate and download business intelligence reports</p>
        </div>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Report
        </Button>
      </div>
      
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Reports</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">Auto-generated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4M</div>
            <p className="text-xs text-muted-foreground">Processed this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Categories */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {reportCategories.map((category, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {category.title}
                <Badge variant="secondary">{category.reports.length}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {category.reports.map((report, reportIndex) => (
                <div key={reportIndex} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{report.name}</p>
                    <p className="text-xs text-muted-foreground">Last run: {report.last_run}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">{report.format}</Badge>
                    <Button size="sm" variant="ghost">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Report Generation</CardTitle>
          <p className="text-sm text-muted-foreground">Generate common reports instantly</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="justify-start">
              <DollarSign className="mr-2 h-4 w-4" />
              Sales Performance (Today)
            </Button>
            <Button variant="outline" className="justify-start">
              <Package className="mr-2 h-4 w-4" />
              Inventory Status
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              Customer Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;