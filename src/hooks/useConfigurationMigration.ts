import { useState, useEffect } from 'react';
import { CabinetConfiguration, CabinetConfigurationService } from '@/services/CabinetConfigurationService';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface MigrationStats {
  legacyCount: number;
  productCount: number;
  unifiedCount: number;
  totalCount: number;
}

export function useConfigurationMigration() {
  const { toast } = useToast();
  const { cartItems } = useCart();
  const [migrationStats, setMigrationStats] = useState<MigrationStats>({
    legacyCount: 0,
    productCount: 0,
    unifiedCount: 0,
    totalCount: 0
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze existing configurations
  useEffect(() => {
    analyzeConfigurations();
  }, [cartItems]);

  const analyzeConfigurations = async () => {
    setIsAnalyzing(true);
    
    try {
      // Analyze cart items for configuration sources
      const legacyConfigs = cartItems?.filter(item => 
        item.configuration && 
        (item.configuration as any).configurationSource === 'legacy'
      ) || [];
      
      const productConfigs = cartItems?.filter(item => 
        item.configuration && 
        (item.configuration as any).configurationSource === 'product'
      ) || [];
      
      const unifiedConfigs = cartItems?.filter(item => 
        item.configuration && 
        (item.configuration as any).configurationSource === 'unified'
      ) || [];
      
      // Also check localStorage for saved preferences
      const savedConfigurations = getSavedConfigurations();
      
      setMigrationStats({
        legacyCount: legacyConfigs.length + savedConfigurations.legacy.length,
        productCount: productConfigs.length + savedConfigurations.product.length,
        unifiedCount: unifiedConfigs.length + savedConfigurations.unified.length,
        totalCount: cartItems?.length || 0
      });
    } catch (error) {
      console.error('Error analyzing configurations:', error);
    }
    
    setIsAnalyzing(false);
  };

  const getSavedConfigurations = () => {
    try {
      // Check for saved configurations in localStorage
      const savedConfigs = {
        legacy: [] as any[],
        product: [] as any[],
        unified: [] as any[]
      };
      
      // Check cabinet preferences (legacy system)
      const preferences = localStorage.getItem('cabinet-preferences');
      if (preferences) {
        savedConfigs.legacy.push(JSON.parse(preferences));
      }
      
      // Check for other saved configurations
      const configKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('config-') || key.includes('configuration')
      );
      
      configKeys.forEach(key => {
        try {
          const config = JSON.parse(localStorage.getItem(key) || '{}');
          if (config.configurationSource) {
            savedConfigs[config.configurationSource as keyof typeof savedConfigs].push(config);
          }
        } catch (error) {
          // Ignore malformed configurations
        }
      });
      
      return savedConfigs;
    } catch (error) {
      console.error('Error reading saved configurations:', error);
      return { legacy: [], product: [], unified: [] };
    }
  };

  const migrateConfiguration = (
    source: any, 
    targetSystem: 'legacy' | 'product' | 'unified'
  ): CabinetConfiguration => {
    switch (targetSystem) {
      case 'unified':
        // Convert from any system to unified
        if (source.configurationSource === 'legacy') {
          return CabinetConfigurationService.convertLegacyConfiguration(source);
        } else if (source.configurationSource === 'product') {
          return CabinetConfigurationService.convertProductConfiguration(source);
        } else {
          // Already unified
          return source as CabinetConfiguration;
        }
      
      case 'legacy':
        // Convert to legacy format (reverse conversion)
        return convertToLegacyFormat(source);
      
      case 'product':
        // Convert to product format (reverse conversion)
        return convertToProductFormat(source);
      
      default:
        throw new Error(`Unsupported target system: ${targetSystem}`);
    }
  };

  const convertToLegacyFormat = (config: CabinetConfiguration): any => {
    return {
      width: config.width,
      height: config.height,
      depth: config.depth,
      quantity: config.quantity,
      rightSideWidth: config.rightSideWidth,
      leftSideWidth: config.leftSideWidth,
      rightSideDepth: config.rightSideDepth,
      leftSideDepth: config.leftSideDepth,
      doorStyle: config.doorStyleId ? { id: config.doorStyleId } : null,
      color: config.colorId ? { id: config.colorId } : null,
      finish: config.finishId ? { id: config.finishId } : null,
      hardwareBrand: config.hardwareBrandId ? { id: config.hardwareBrandId } : null,
      configurationSource: 'legacy'
    };
  };

  const convertToProductFormat = (config: CabinetConfiguration): any => {
    return {
      productId: config.productId,
      productVariant: config.productVariantId ? { id: config.productVariantId } : null,
      selectedOptions: config.selectedOptions || {},
      dimensions: {
        width: config.width,
        height: config.height,
        depth: config.depth
      },
      quantity: config.quantity,
      configurationSource: 'product'
    };
  };

  const performBulkMigration = async (
    targetSystem: 'unified',
    configurations: any[]
  ): Promise<CabinetConfiguration[]> => {
    const migratedConfigs: CabinetConfiguration[] = [];
    const errors: string[] = [];
    
    for (const config of configurations) {
      try {
        const migrated = migrateConfiguration(config, targetSystem);
        migratedConfigs.push(migrated);
      } catch (error) {
        console.error('Migration error for config:', config, error);
        errors.push(`Failed to migrate configuration: ${(error as Error).message}`);
      }
    }
    
    if (errors.length > 0) {
      toast({
        title: "Migration Warnings",
        description: `${errors.length} configurations could not be migrated`,
        variant: "destructive",
      });
    }
    
    return migratedConfigs;
  };

  const validateMigration = (
    original: any,
    migrated: CabinetConfiguration
  ): { isValid: boolean; warnings: string[] } => {
    const warnings: string[] = [];
    
    // Check dimensions
    if (original.width !== migrated.width) {
      warnings.push('Width dimension changed during migration');
    }
    if (original.height !== migrated.height) {
      warnings.push('Height dimension changed during migration');
    }
    if (original.depth !== migrated.depth) {
      warnings.push('Depth dimension changed during migration');
    }
    
    // Check quantity
    if (original.quantity !== migrated.quantity) {
      warnings.push('Quantity changed during migration');
    }
    
    // Check if essential data was preserved
    const hasEssentialData = migrated.width > 0 && migrated.height > 0 && migrated.depth > 0;
    
    return {
      isValid: hasEssentialData && warnings.length < 3, // Allow minor warnings
      warnings
    };
  };

  const createMigrationBackup = (configurations: any[]): string => {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      configurations,
      stats: migrationStats
    };
    
    const backupData = JSON.stringify(backup, null, 2);
    
    // Save to localStorage as fallback
    try {
      localStorage.setItem(`migration-backup-${Date.now()}`, backupData);
    } catch (error) {
      console.warn('Could not save backup to localStorage:', error);
    }
    
    return backupData;
  };

  const restoreFromBackup = (backupData: string): any[] => {
    try {
      const backup = JSON.parse(backupData);
      return backup.configurations || [];
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return [];
    }
  };

  return {
    migrationStats,
    isAnalyzing,
    analyzeConfigurations,
    migrateConfiguration,
    performBulkMigration,
    validateMigration,
    createMigrationBackup,
    restoreFromBackup,
    getSavedConfigurations
  };
}