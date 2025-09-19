import { useState, useEffect } from 'react';
import { CabinetType } from '@/types/cabinet';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { ConfiguratorDialog } from './ConfiguratorDialog';
import { ProductConfiguratorDialog } from './ProductConfiguratorDialog';
import { UnifiedConfiguratorDialog } from './UnifiedConfiguratorDialog';

interface ConfiguratorDialogWrapperProps {
  cabinetType: CabinetType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWidth?: number;
}

/**
 * Wrapper component that automatically selects the appropriate configurator
 * based on feature flags while maintaining 100% backward compatibility.
 * 
 * This ensures that existing code continues to work exactly as before
 * while providing access to new unified features when enabled.
 */
export function ConfiguratorDialogWrapper({
  cabinetType,
  open,
  onOpenChange,
  initialWidth
}: ConfiguratorDialogWrapperProps) {
  const { isEnabled } = useFeatureFlags();
  
  // Feature flags to control which system to use
  const useUnifiedSystem = isEnabled('use_unified_configurator');
  const useProductSystem = isEnabled('use_product_configurator');
  const enableMigrationMode = isEnabled('enable_configuration_migration');
  
  // Default to legacy system for 100% compatibility
  const [selectedSystem, setSelectedSystem] = useState<'legacy' | 'product' | 'unified'>('legacy');
  
  useEffect(() => {
    // Automatically select system based on feature flags
    if (useUnifiedSystem) {
      setSelectedSystem('unified');
    } else if (useProductSystem) {
      setSelectedSystem('product');
    } else {
      setSelectedSystem('legacy');
    }
  }, [useUnifiedSystem, useProductSystem]);

  // Legacy system (default - 100% preserved functionality)
  if (selectedSystem === 'legacy') {
    return (
      <ConfiguratorDialog
        cabinetType={cabinetType}
        open={open}
        onOpenChange={onOpenChange}
        initialWidth={initialWidth}
      />
    );
  }

  // Product system
  if (selectedSystem === 'product') {
    return (
      <ProductConfiguratorDialog
        cabinetType={cabinetType}
        open={open}
        onOpenChange={onOpenChange}
        initialWidth={initialWidth}
      />
    );
  }

  // Unified system (with migration capabilities)
  return (
    <UnifiedConfiguratorDialog
      cabinetType={cabinetType}
      open={open}
      onOpenChange={onOpenChange}
      initialWidth={initialWidth}
    />
  );
}

// Export as default for seamless replacement
export default ConfiguratorDialogWrapper;