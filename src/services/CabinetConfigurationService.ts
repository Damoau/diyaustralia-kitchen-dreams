import { CabinetType } from '@/types/cabinet';
import { supabase } from '@/integrations/supabase/client';

export interface ConfigurationTemplate {
  id: string;
  name: string;
  description?: string;
  cabinetTypeId: string;
  configuration: CabinetConfiguration;
  isDefault?: boolean;
  userId?: string;
  createdAt: Date;
}

export interface CabinetConfiguration {
  // Core dimensions
  width: number;
  height: number;
  depth: number;
  
  // Corner cabinet dimensions
  rightSideWidth?: number;
  leftSideWidth?: number;
  rightSideDepth?: number;
  leftSideDepth?: number;
  
  // Style and finish
  doorStyleId?: string;
  colorId?: string;
  finishId?: string;
  hardwareBrandId?: string;
  
  // Quantity and notes
  quantity: number;
  notes?: string;
  
  // Product system compatibility
  productId?: string;
  productVariantId?: string;
  selectedOptions?: Record<string, string>;
  
  // Configuration metadata
  configurationSource: 'legacy' | 'product' | 'unified';
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigurationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class CabinetConfigurationService {
  // Validate configuration against cabinet type constraints
  static validateConfiguration(
    config: CabinetConfiguration, 
    cabinetType: CabinetType
  ): ConfigurationValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate dimensions
    if (config.width < cabinetType.min_width_mm || config.width > cabinetType.max_width_mm) {
      errors.push(`Width must be between ${cabinetType.min_width_mm}mm and ${cabinetType.max_width_mm}mm`);
    }
    
    if (config.height < cabinetType.min_height_mm || config.height > cabinetType.max_height_mm) {
      errors.push(`Height must be between ${cabinetType.min_height_mm}mm and ${cabinetType.max_height_mm}mm`);
    }
    
    if (config.depth < cabinetType.min_depth_mm || config.depth > cabinetType.max_depth_mm) {
      errors.push(`Depth must be between ${cabinetType.min_depth_mm}mm and ${cabinetType.max_depth_mm}mm`);
    }

    // Validate corner cabinet dimensions if applicable
    if (cabinetType.cabinet_style === 'corner') {
      if (!config.rightSideWidth || !config.leftSideWidth) {
        errors.push('Corner cabinets require both left and right side widths');
      }
      if (!config.rightSideDepth || !config.leftSideDepth) {
        errors.push('Corner cabinets require both left and right side depths');
      }
    }

    // Validate quantity
    if (config.quantity < 1) {
      errors.push('Quantity must be at least 1');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Create a default configuration for a cabinet type
  static createDefaultConfiguration(cabinetType: CabinetType): CabinetConfiguration {
    return {
      width: cabinetType.default_width_mm,
      height: cabinetType.default_height_mm,
      depth: cabinetType.default_depth_mm,
      quantity: 1,
      configurationSource: 'unified',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Corner cabinet defaults
      ...(cabinetType.cabinet_style === 'corner' && {
        rightSideWidth: cabinetType.right_side_width_mm || cabinetType.default_width_mm,
        leftSideWidth: cabinetType.left_side_width_mm || cabinetType.default_width_mm,
        rightSideDepth: cabinetType.right_side_depth_mm || cabinetType.default_depth_mm,
        leftSideDepth: cabinetType.left_side_depth_mm || cabinetType.default_depth_mm,
      }),
    };
  }

  // Convert legacy configuration to unified format
  static convertLegacyConfiguration(legacyConfig: any): CabinetConfiguration {
    return {
      width: legacyConfig.width || legacyConfig.cabinetType?.default_width_mm || 300,
      height: legacyConfig.height || legacyConfig.cabinetType?.default_height_mm || 720,
      depth: legacyConfig.depth || legacyConfig.cabinetType?.default_depth_mm || 560,
      quantity: legacyConfig.quantity || 1,
      
      // Copy corner dimensions if present
      rightSideWidth: legacyConfig.rightSideWidth,
      leftSideWidth: legacyConfig.leftSideWidth,
      rightSideDepth: legacyConfig.rightSideDepth,
      leftSideDepth: legacyConfig.leftSideDepth,
      
      // Copy style selections
      doorStyleId: legacyConfig.doorStyle?.id,
      colorId: legacyConfig.color?.id,
      finishId: legacyConfig.finish?.id,
      hardwareBrandId: legacyConfig.hardwareBrand?.id,
      
      configurationSource: 'legacy',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Convert product configuration to unified format
  static convertProductConfiguration(productConfig: any): CabinetConfiguration {
    return {
      width: productConfig.dimensions?.width || 300,
      height: productConfig.dimensions?.height || 720,
      depth: productConfig.dimensions?.depth || 560,
      quantity: productConfig.quantity || 1,
      
      productId: productConfig.productId,
      productVariantId: productConfig.productVariant?.id,
      selectedOptions: productConfig.selectedOptions,
      
      configurationSource: 'product',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Clone configuration with modifications
  static cloneConfiguration(
    baseConfig: CabinetConfiguration, 
    modifications: Partial<CabinetConfiguration>
  ): CabinetConfiguration {
    return {
      ...baseConfig,
      ...modifications,
      updatedAt: new Date(),
    };
  }

  // Compare two configurations
  static compareConfigurations(config1: CabinetConfiguration, config2: CabinetConfiguration): {
    identical: boolean;
    differences: string[];
  } {
    const differences: string[] = [];
    
    // Compare dimensions
    if (config1.width !== config2.width) differences.push(`Width: ${config1.width}mm → ${config2.width}mm`);
    if (config1.height !== config2.height) differences.push(`Height: ${config1.height}mm → ${config2.height}mm`);
    if (config1.depth !== config2.depth) differences.push(`Depth: ${config1.depth}mm → ${config2.depth}mm`);
    
    // Compare corner dimensions
    if (config1.rightSideWidth !== config2.rightSideWidth) {
      differences.push(`Right Side Width: ${config1.rightSideWidth}mm → ${config2.rightSideWidth}mm`);
    }
    if (config1.leftSideWidth !== config2.leftSideWidth) {
      differences.push(`Left Side Width: ${config1.leftSideWidth}mm → ${config2.leftSideWidth}mm`);
    }
    
    // Compare styles
    if (config1.doorStyleId !== config2.doorStyleId) differences.push('Door style changed');
    if (config1.colorId !== config2.colorId) differences.push('Color changed');
    if (config1.hardwareBrandId !== config2.hardwareBrandId) differences.push('Hardware brand changed');
    
    // Compare quantity
    if (config1.quantity !== config2.quantity) differences.push(`Quantity: ${config1.quantity} → ${config2.quantity}`);
    
    return {
      identical: differences.length === 0,
      differences
    };
  }

  // Save configuration template to database  
  static async saveTemplate(template: Omit<ConfigurationTemplate, 'id' | 'createdAt'>): Promise<ConfigurationTemplate | null> {
    try {
      // Use any type to bypass TypeScript issues with new table
      const { data, error } = await (supabase as any)
        .from('configuration_templates')
        .insert({
          name: template.name,
          description: template.description,
          cabinet_type_id: template.cabinetTypeId,
          configuration: template.configuration,
          is_default: template.isDefault || false,
          user_id: template.userId
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        cabinetTypeId: data.cabinet_type_id,
        configuration: data.configuration as CabinetConfiguration,
        isDefault: data.is_default,
        userId: data.user_id,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error saving configuration template:', error);
      return null;
    }
  }

  // Load configuration templates
  static async loadTemplates(cabinetTypeId?: string, userId?: string): Promise<ConfigurationTemplate[]> {
    try {
      // Use any type to bypass TypeScript issues with new table
      let query = (supabase as any)
        .from('configuration_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (cabinetTypeId) {
        query = query.eq('cabinet_type_id', cabinetTypeId);
      }

      if (userId) {
        query = query.or(`user_id.eq.${userId},is_default.eq.true`);
      } else {
        query = query.eq('is_default', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        cabinetTypeId: item.cabinet_type_id,
        configuration: item.configuration as CabinetConfiguration,
        isDefault: item.is_default,
        userId: item.user_id,
        createdAt: new Date(item.created_at)
      }));
    } catch (error) {
      console.error('Error loading configuration templates:', error);
      return [];
    }
  }

  // Delete configuration template
  static async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      // Use any type to bypass TypeScript issues with new table
      const { error } = await (supabase as any)
        .from('configuration_templates')
        .delete()
        .eq('id', templateId);

      return !error;
    } catch (error) {
      console.error('Error deleting configuration template:', error);
      return false;
    }
  }
}