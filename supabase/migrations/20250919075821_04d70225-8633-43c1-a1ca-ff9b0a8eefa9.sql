-- Add foreign key constraints to cabinet_door_styles table
ALTER TABLE public.cabinet_door_styles 
ADD CONSTRAINT fk_cabinet_door_styles_cabinet_type 
FOREIGN KEY (cabinet_type_id) REFERENCES public.cabinet_types(id) ON DELETE CASCADE;

ALTER TABLE public.cabinet_door_styles 
ADD CONSTRAINT fk_cabinet_door_styles_door_style 
FOREIGN KEY (door_style_id) REFERENCES public.door_styles(id) ON DELETE CASCADE;