import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MaterialSpecification {
  id: string;
  material_type: string;
  cost_per_sqm: number;
  density_kg_per_cubic_m: number;
  standard_thickness_mm: number;
  weight_factor: number;
  weight_per_sqm: number;
  active: boolean;
}

export const useMaterialSpecifications = () => {
  const [materialSpecifications, setMaterialSpecifications] = useState<MaterialSpecification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterialSpecifications = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('material_specifications')
          .select('*')
          .eq('active', true)
          .order('material_type');
        
        if (fetchError) throw fetchError;
        
        setMaterialSpecifications(data || []);
      } catch (err) {
        console.error('Error fetching material specifications:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch material specifications');
        setMaterialSpecifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterialSpecifications();
  }, []);

  const getDefaultMaterial = () => {
    return materialSpecifications.find(m => m.material_type === 'MDF') || materialSpecifications[0];
  };

  const getMaterialByType = (type: string) => {
    return materialSpecifications.find(m => m.material_type === type);
  };

  const getDefaultMaterialRate = () => {
    const defaultMaterial = getDefaultMaterial();
    return defaultMaterial?.cost_per_sqm || 45;
  };

  return {
    materialSpecifications,
    loading,
    error,
    getDefaultMaterial,
    getMaterialByType,
    getDefaultMaterialRate,
  };
};

export default useMaterialSpecifications;