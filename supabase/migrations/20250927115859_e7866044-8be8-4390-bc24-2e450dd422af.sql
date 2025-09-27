-- Cart system health restoration - massive cleanup
UPDATE carts 
SET lifecycle_state = 'archived', 
    is_primary = false, 
    updated_at = now(),
    archive_reason = 'Mass cleanup - empty cart optimization'
WHERE (SELECT COUNT(*) FROM cart_items WHERE cart_id = carts.id) = 0
  AND lifecycle_state = 'active'
  AND last_activity_at < (now() - interval '1 day');