import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import {
  Rocket,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Target,
  TrendingUp,
  Shield,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';

interface RolloutStage {
  id: string;
  name: string;
  description: string;
  userPercentage: number;
  status: 'pending' | 'active' | 'completed' | 'paused' | 'failed';
  startDate?: Date;
  completedDate?: Date;
  metrics: {
    totalUsers: number;
    activeUsers: number;
    errorRate: number;
    completionRate: number;
  };
}

interface FeatureRollout {
  id: string;
  name: string;
  description: string;
  flagKey: string;
  version: string;
  stages: RolloutStage[];
  currentStage: number;
  isActive: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  rollbackEnabled: boolean;
}

const mockRollouts: FeatureRollout[] = [
  {
    id: 'unified-config',
    name: 'Unified Cabinet Configurator',
    description: 'New streamlined configuration experience with improved UX',
    flagKey: 'unified_configurator',
    version: '2.1.0',
    currentStage: 1,
    isActive: true,
    riskLevel: 'medium',
    rollbackEnabled: true,
    stages: [
      {
        id: 'internal',
        name: 'Internal Testing',
        description: 'Testing with internal team and beta users',
        userPercentage: 5,
        status: 'completed',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        metrics: {
          totalUsers: 12,
          activeUsers: 12,
          errorRate: 0.8,
          completionRate: 95
        }
      },
      {
        id: 'early-adopters',
        name: 'Early Adopters',
        description: 'Power users and customers who opted for beta features',
        userPercentage: 15,
        status: 'active',
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        metrics: {
          totalUsers: 156,
          activeUsers: 142,
          errorRate: 1.2,
          completionRate: 87
        }
      },
      {
        id: 'gradual-rollout',
        name: 'Gradual Rollout',
        description: 'Gradual expansion to 50% of user base',
        userPercentage: 50,
        status: 'pending',
        metrics: {
          totalUsers: 0,
          activeUsers: 0,
          errorRate: 0,
          completionRate: 0
        }
      },
      {
        id: 'full-release',
        name: 'Full Release',
        description: 'Complete rollout to all users',
        userPercentage: 100,
        status: 'pending',
        metrics: {
          totalUsers: 0,
          activeUsers: 0,
          errorRate: 0,
          completionRate: 0
        }
      }
    ]
  },
  {
    id: 'config-migration',
    name: 'Configuration Migration System',
    description: 'System for migrating and analyzing cabinet configurations',
    flagKey: 'configuration_migration',
    version: '2.0.5',
    currentStage: 0,
    isActive: false,
    riskLevel: 'high',
    rollbackEnabled: true,
    stages: [
      {
        id: 'admin-only',
        name: 'Admin Only',
        description: 'Available only to admin users for testing',
        userPercentage: 1,
        status: 'pending',
        metrics: {
          totalUsers: 0,
          activeUsers: 0,
          errorRate: 0,
          completionRate: 0
        }
      },
      {
        id: 'controlled-test',
        name: 'Controlled Test',
        description: 'Limited release to selected customers',
        userPercentage: 10,
        status: 'pending',
        metrics: {
          totalUsers: 0,
          activeUsers: 0,
          errorRate: 0,
          completionRate: 0
        }
      },
      {
        id: 'full-release',
        name: 'Full Release',
        description: 'Release to all eligible users',
        userPercentage: 100,
        status: 'pending',
        metrics: {
          totalUsers: 0,
          activeUsers: 0,
          errorRate: 0,
          completionRate: 0
        }
      }
    ]
  }
];

export const RolloutManager = () => {
  const [rollouts, setRollouts] = useState<FeatureRollout[]>(mockRollouts);
  const [selectedRollout, setSelectedRollout] = useState<string>(mockRollouts[0].id);
  const [rollbackReason, setRollbackReason] = useState('');
  const { toast } = useToast();
  const { refreshFlags } = useFeatureFlags();

  const currentRollout = rollouts.find(r => r.id === selectedRollout);

  const getStatusColor = (status: RolloutStage['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: RolloutStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getRiskColor = (risk: FeatureRollout['riskLevel']) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    }
  };

  const progressToNextStage = async (rolloutId: string) => {
    const rollout = rollouts.find(r => r.id === rolloutId);
    if (!rollout || rollout.currentStage >= rollout.stages.length - 1) return;

    setRollouts(prev => prev.map(r => 
      r.id === rolloutId
        ? {
            ...r,
            currentStage: r.currentStage + 1,
            stages: r.stages.map((stage, index) => 
              index === r.currentStage 
                ? { ...stage, status: 'completed' as const, completedDate: new Date() }
                : index === r.currentStage + 1
                ? { ...stage, status: 'active' as const, startDate: new Date() }
                : stage
            )
          }
        : r
    ));

    await refreshFlags();
    
    toast({
      title: "Stage Progressed",
      description: `Moved to next rollout stage: ${rollout.stages[rollout.currentStage + 1].name}`,
    });
  };

  const pauseRollout = async (rolloutId: string) => {
    setRollouts(prev => prev.map(r => 
      r.id === rolloutId
        ? {
            ...r,
            isActive: false,
            stages: r.stages.map((stage, index) => 
              index === r.currentStage 
                ? { ...stage, status: 'paused' as const }
                : stage
            )
          }
        : r
    ));

    toast({
      title: "Rollout Paused",
      description: "Feature rollout has been paused for safety",
      variant: "destructive"
    });
  };

  const resumeRollout = async (rolloutId: string) => {
    setRollouts(prev => prev.map(r => 
      r.id === rolloutId
        ? {
            ...r,
            isActive: true,
            stages: r.stages.map((stage, index) => 
              index === r.currentStage 
                ? { ...stage, status: 'active' as const }
                : stage
            )
          }
        : r
    ));

    toast({
      title: "Rollout Resumed",
      description: "Feature rollout has been resumed",
    });
  };

  const initiateRollback = async (rolloutId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Rollback Failed",
        description: "Please provide a reason for rollback",
        variant: "destructive"
      });
      return;
    }

    setRollouts(prev => prev.map(r => 
      r.id === rolloutId
        ? {
            ...r,
            isActive: false,
            currentStage: 0,
            stages: r.stages.map(stage => ({ 
              ...stage, 
              status: 'pending' as const,
              startDate: undefined,
              completedDate: undefined,
              metrics: {
                totalUsers: 0,
                activeUsers: 0,
                errorRate: 0,
                completionRate: 0
              }
            }))
          }
        : r
    ));

    await refreshFlags();
    setRollbackReason('');
    
    toast({
      title: "Rollback Initiated",
      description: "Feature has been rolled back successfully",
      variant: "destructive"
    });
  };

  const calculateOverallProgress = (rollout: FeatureRollout): number => {
    const completedStages = rollout.stages.filter(s => s.status === 'completed').length;
    const activeStage = rollout.stages.find(s => s.status === 'active');
    const activeProgress = activeStage ? 0.5 : 0;
    
    return ((completedStages + activeProgress) / rollout.stages.length) * 100;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Rocket className="w-5 h-5" />
            <span>Feature Rollout Manager</span>
          </CardTitle>
          <CardDescription>
            Manage feature rollouts, monitor progress, and control deployments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedRollout} onValueChange={setSelectedRollout}>
            <TabsList className="grid w-full grid-cols-2">
              {rollouts.map(rollout => (
                <TabsTrigger key={rollout.id} value={rollout.id} className="flex items-center space-x-2">
                  <span>{rollout.name}</span>
                  <Badge variant="outline" className={getRiskColor(rollout.riskLevel)}>
                    {rollout.riskLevel}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {rollouts.map(rollout => (
              <TabsContent key={rollout.id} value={rollout.id} className="space-y-6">
                {/* Rollout Overview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{rollout.name}</span>
                          <Badge variant="outline">{rollout.version}</Badge>
                        </CardTitle>
                        <CardDescription>{rollout.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`active-${rollout.id}`}>Active</Label>
                        <Switch
                          id={`active-${rollout.id}`}
                          checked={rollout.isActive}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              resumeRollout(rollout.id);
                            } else {
                              pauseRollout(rollout.id);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Overall Progress</span>
                          <span className="text-sm text-muted-foreground">
                            {calculateOverallProgress(rollout).toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={calculateOverallProgress(rollout)} className="h-2" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {rollout.stages[rollout.currentStage]?.userPercentage || 0}%
                          </div>
                          <div className="text-sm text-muted-foreground">Current Coverage</div>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {rollout.stages.reduce((sum, stage) => sum + stage.metrics.activeUsers, 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Active Users</div>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {(rollout.stages.reduce((sum, stage) => sum + stage.metrics.errorRate, 0) / 
                              rollout.stages.filter(s => s.status !== 'pending').length || 0).toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Avg Error Rate</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rollout Stages */}
                <Card>
                  <CardHeader>
                    <CardTitle>Rollout Stages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rollout.stages.map((stage, index) => (
                        <div 
                          key={stage.id} 
                          className={`p-4 border rounded-lg ${
                            index === rollout.currentStage ? 'border-primary bg-primary/5' : 'border-muted'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(stage.status)}
                              <div>
                                <h4 className="font-medium">{stage.name}</h4>
                                <p className="text-sm text-muted-foreground">{stage.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(stage.status)}>
                                {stage.status}
                              </Badge>
                              <Badge variant="outline">
                                {stage.userPercentage}% users
                              </Badge>
                            </div>
                          </div>

                          {stage.status !== 'pending' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div className="text-center">
                                <div className="text-lg font-semibold">{stage.metrics.totalUsers}</div>
                                <div className="text-xs text-muted-foreground">Total Users</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-green-600">{stage.metrics.activeUsers}</div>
                                <div className="text-xs text-muted-foreground">Active Users</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-red-600">{stage.metrics.errorRate}%</div>
                                <div className="text-xs text-muted-foreground">Error Rate</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-blue-600">{stage.metrics.completionRate}%</div>
                                <div className="text-xs text-muted-foreground">Completion</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Control Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Rollout Controls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-x-2">
                        <Button
                          onClick={() => progressToNextStage(rollout.id)}
                          disabled={!rollout.isActive || rollout.currentStage >= rollout.stages.length - 1}
                          className="flex items-center space-x-2"
                        >
                          <Target className="w-4 h-4" />
                          <span>Progress to Next Stage</span>
                        </Button>
                        
                        {rollout.isActive ? (
                          <Button
                            variant="outline"
                            onClick={() => pauseRollout(rollout.id)}
                            className="flex items-center space-x-2"
                          >
                            <Pause className="w-4 h-4" />
                            <span>Pause Rollout</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => resumeRollout(rollout.id)}
                            className="flex items-center space-x-2"
                          >
                            <Play className="w-4 h-4" />
                            <span>Resume Rollout</span>
                          </Button>
                        )}
                      </div>

                      {rollout.rollbackEnabled && (
                        <div className="flex items-center space-x-2">
                          <Textarea
                            placeholder="Reason for rollback..."
                            value={rollbackReason}
                            onChange={(e) => setRollbackReason(e.target.value)}
                            className="w-64 h-10"
                          />
                          <Button
                            variant="destructive"
                            onClick={() => initiateRollback(rollout.id, rollbackReason)}
                            className="flex items-center space-x-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Rollback</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};