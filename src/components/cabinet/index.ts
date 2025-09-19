// Legacy Configuration System (100% preserved)
export { ConfiguratorDialog } from './ConfiguratorDialog';
export { ProductConfiguratorDialog } from './ProductConfiguratorDialog';
export { PriceBreakdown } from './PriceBreakdown';
export { HardwareBrandSelector } from './HardwareBrandSelector';
export { CornerCabinetConfig } from './CornerCabinetConfig';
export { CartDrawer } from './CartDrawer';
export { CellConfigPopup } from './CellConfigPopup';
export { HardwareBreakdown } from './HardwareBreakdown';
export { HardwareCostPreview } from './HardwareCostPreview';

// New Unified Configuration System
export { UnifiedConfiguratorDialog } from './UnifiedConfiguratorDialog';
export { ConfigurationTemplates } from './ConfigurationTemplates';
export { ConfigurationHistory } from './ConfigurationHistory';
export { ConfigurationComparison } from './ConfigurationComparison';
export { ConfigurationMigration } from './ConfigurationMigration';

// Configuration Services and Utilities
export { CabinetConfigurationService } from '../../services/CabinetConfigurationService';
export type { 
  CabinetConfiguration,
  ConfigurationTemplate,
  ConfigurationValidation 
} from '../../services/CabinetConfigurationService';

// Hooks
export { useConfigurationMigration } from '../../hooks/useConfigurationMigration';
export { useCabinetPreferences } from '../../hooks/useCabinetPreferences';
export { useDynamicPricing } from '../../hooks/useDynamicPricing';
export { useProductIntegration } from '../../hooks/useProductIntegration';