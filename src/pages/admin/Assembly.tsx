import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/admin/shared/DataTable';
import { StatusChip } from '@/components/admin/shared/StatusChip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, Clock, CheckCircle, AlertTriangle, Plus, Edit, Play, Square } from 'lucide-react';
import { useAssemblyJobs, type AssemblyJob } from '@/hooks/useAssemblyJobs';
import { formatDistanceToNow } from 'date-fns';

const Assembly = () => {
  const { jobs, stats, loading, createAssemblyJob, updateAssemblyJob, scheduleJob, startJob, completeJob } = useAssemblyJobs();
  const [selectedJob, setSelectedJob] = useState<AssemblyJob | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const formatJobsForTable = (jobs: AssemblyJob[]) => {
    return jobs.map(job => ({
      ...job,
      order_number: job.orders?.order_number || 'N/A',
      customer: job.orders?.order_number || 'N/A', // Use order number as customer identifier
      items: job.components_included || 'N/A',
      assembler: job.assigned_team || 'Unassigned',
      scheduled_for: job.scheduled_for ? new Date(job.scheduled_for).toLocaleString() : 'Not scheduled',
    }));
  };

  const columns = [
    { 
      key: 'order_number' as const, 
      label: 'Order Number',
      render: (value: string) => <Badge variant="outline">{value}</Badge>
    },
    { key: 'customer' as const, label: 'Customer' },
    { key: 'items' as const, label: 'Components' },
    { 
      key: 'status' as const, 
      label: 'Status',
      render: (value: string) => <StatusChip status={value} />
    },
    { key: 'assembler' as const, label: 'Team' },
    { 
      key: 'scheduled_for' as const, 
      label: 'Scheduled For',
      render: (value: string, job: any) => {
        if (!job.scheduled_for) return <Badge variant="secondary">Not scheduled</Badge>;
        const isOverdue = new Date(job.scheduled_for) < new Date() && job.status !== 'completed';
        return (
          <Badge variant={isOverdue ? "destructive" : "outline"}>
            {formatDistanceToNow(new Date(job.scheduled_for), { addSuffix: true })}
          </Badge>
        );
      }
    },
    {
      key: 'actions' as const,
      label: 'Actions',
      render: (_: any, job: AssemblyJob) => (
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedJob(job);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
          {job.status === 'pending' && (
            <Button
              size="sm"
              onClick={() => scheduleJob(job.id, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())}
            >
              <Clock className="h-3 w-3" />
            </Button>
          )}
          {job.status === 'scheduled' && (
            <Button
              size="sm"
              onClick={() => startJob(job.id)}
            >
              <Play className="h-3 w-3" />
            </Button>
          )}
          {job.status === 'in_progress' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => completeJob(job.id)}
            >
              <CheckCircle className="h-3 w-3" />
            </Button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assembly Management</h1>
          <p className="text-muted-foreground">Track cabinet assembly progress and workstation assignments</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Assembly Job
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently being assembled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting assembly</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">Ready for QC</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Behind Schedule</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.behindSchedule}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>
      
      <DataTable
        data={formatJobsForTable(jobs)}
        columns={columns}
        loading={loading}
        selectable
        emptyState={<div>No assembly jobs found</div>}
      />

      {/* Create Assembly Job Dialog */}
      <CreateAssemblyJobDialog 
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreate={async (jobData) => {
          await createAssemblyJob(jobData);
        }}
      />

      {/* Edit Assembly Job Dialog */}
      <EditAssemblyJobDialog 
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedJob(null);
        }}
        job={selectedJob}
        onUpdate={async (id, updates) => {
          await updateAssemblyJob(id, updates);
        }}
      />
    </div>
  );
};

// Import the dialog components
const CreateAssemblyJobDialog = React.lazy(() => import('@/components/admin/CreateAssemblyJobDialog').then(module => ({ default: module.CreateAssemblyJobDialog })));
const EditAssemblyJobDialog = React.lazy(() => import('@/components/admin/EditAssemblyJobDialog').then(module => ({ default: module.EditAssemblyJobDialog })));

export default Assembly;