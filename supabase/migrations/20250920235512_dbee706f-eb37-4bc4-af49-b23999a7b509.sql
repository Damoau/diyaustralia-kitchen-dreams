-- Add hero images to room categories
UPDATE room_categories 
SET hero_image_url = CASE 
  WHEN name = 'kitchen' THEN '/lovable-uploads/1fa9627e-0972-4137-b95b-ef3bcb26b66c.png'
  WHEN name = 'laundry' THEN '/lovable-uploads/8bf7a8e1-3389-40d8-bd11-5ff1d7de50e8.png'
  WHEN name = 'vanity' THEN '/lovable-uploads/b6d88c5d-54f3-4b8d-9ac4-6fdf2711d29e.png'
  ELSE hero_image_url
END;