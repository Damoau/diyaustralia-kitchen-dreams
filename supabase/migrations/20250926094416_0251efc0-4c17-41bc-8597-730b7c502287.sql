-- Fix assembly eligibility for postcode 2000 and other major city postcodes
UPDATE postcode_zones 
SET assembly_eligible = true 
WHERE postcode IN ('2000', '3000', '4000', '5000', '6000') 
  AND assembly_eligible = false;