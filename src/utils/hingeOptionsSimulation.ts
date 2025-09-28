import { supabase } from '@/integrations/supabase/client';

export class HingeOptionsSimulation {
  async runCompleteHingeOptionsTest() {
    console.log('🔧 Running Complete Hinge Options Test...');
    
    const results = {
      databaseCheck: false,
      frontendQuery: false,
      optionValues: [],
      errors: []
    };

    try {
      // Step 1: Database verification
      console.log('Step 1: Verifying database data...');
      const { data: dbOptions, error: dbError } = await supabase
        .from('cabinet_product_options')
        .select(`
          id,
          option_name,
          option_type,
          required,
          active,
          cabinet_option_values(
            id,
            value,
            display_text,
            display_order,
            active,
            price_adjustment
          )
        `)
        .eq('cabinet_type_id', '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c')
        .eq('option_name', 'hinge_sides')
        .eq('active', true);

      if (dbError) {
        results.errors.push(`Database error: ${dbError.message}`);
        console.error('❌ Database query failed:', dbError);
        return results;
      }

      if (!dbOptions || dbOptions.length === 0) {
        results.errors.push('No hinge_sides option found in database');
        console.error('❌ No hinge_sides option found');
        return results;
      }

      results.databaseCheck = true;
      const hingeOption = dbOptions[0];
      console.log('✅ Database check passed:', {
        optionName: hingeOption.option_name,
        type: hingeOption.option_type,
        required: hingeOption.required,
        valueCount: hingeOption.cabinet_option_values?.length || 0
      });

      // Step 2: Frontend query simulation (same as useProductOptions hook)
      console.log('Step 2: Testing frontend query...');
      const { data: frontendOptions, error: frontendError } = await supabase
        .from('cabinet_product_options')
        .select(`
          id,
          option_name,
          option_type,
          required,
          description,
          display_order,
          active,
          cabinet_option_values(
            id,
            value,
            display_text,
            display_order,
            active,
            price_adjustment
          )
        `)
        .eq('cabinet_type_id', '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c')
        .eq('active', true)
        .order('display_order');

      if (frontendError) {
        results.errors.push(`Frontend query error: ${frontendError.message}`);
        console.error('❌ Frontend query failed:', frontendError);
        return results;
      }

      results.frontendQuery = true;
      console.log('✅ Frontend query successful');

      // Step 3: Process options like the hook does
      console.log('Step 3: Processing options...');
      const processedOptions = frontendOptions?.map(option => {
        const optionValues = option.option_type === 'select' && option.cabinet_option_values 
          ? option.cabinet_option_values
              .filter((v: any) => v.active)
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((v: any) => v.display_text)
          : undefined;

        return {
          id: option.id,
          name: option.option_name,
          type: option.option_type,
          required: option.required,
          description: option.description,
          options: optionValues
        };
      });

      const hingeProcessedOption = processedOptions?.find(opt => opt.name === 'hinge_sides');
      
      if (hingeProcessedOption) {
        results.optionValues = hingeProcessedOption.options || [];
        console.log('✅ Hinge sides option processed successfully:', {
          name: hingeProcessedOption.name,
          type: hingeProcessedOption.type,
          required: hingeProcessedOption.required,
          valueCount: results.optionValues.length,
          values: results.optionValues
        });
      } else {
        results.errors.push('Hinge sides option not found in processed options');
        console.error('❌ Hinge sides option not found in processed options');
      }

      // Step 4: Cabinet lookup verification
      console.log('Step 4: Verifying cabinet details...');
      const { data: cabinetData, error: cabinetError } = await supabase
        .from('cabinet_types')
        .select('id, name, category, url_slug')
        .eq('id', '5ec0aa14-2ad5-44ce-9df0-27d14beaec4c')
        .single();

      if (cabinetError || !cabinetData) {
        results.errors.push('Cabinet not found');
        console.error('❌ Cabinet lookup failed');
      } else {
        console.log('✅ Cabinet found:', {
          name: cabinetData.name,
          category: cabinetData.category,
          slug: cabinetData.url_slug || 'auto-generated'
        });
      }

    } catch (error) {
      results.errors.push(`Simulation error: ${error}`);
      console.error('❌ Simulation failed:', error);
    }

    // Final report
    console.log('\n📊 SIMULATION RESULTS:');
    console.log('Database Check:', results.databaseCheck ? '✅ PASS' : '❌ FAIL');
    console.log('Frontend Query:', results.frontendQuery ? '✅ PASS' : '❌ FAIL');
    console.log('Option Values Found:', results.optionValues.length);
    console.log('Values:', results.optionValues);
    
    if (results.errors.length > 0) {
      console.log('❌ ERRORS:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    // Next steps recommendation
    console.log('\n🎯 TO TEST IN FRONTEND:');
    console.log('1. Navigate to: /shop/kitchen/base-cabinets/1-door-base-cabinet');
    console.log('2. Click "Configure & Get Quote" button');
    console.log('3. Look for "Hinge Sides" dropdown in the Product Options section');
    console.log('4. The dropdown should have 6 options: Left Side, Right Side, etc.');

    return results;
  }
}

// Auto-run the simulation
const simulation = new HingeOptionsSimulation();
simulation.runCompleteHingeOptionsTest();