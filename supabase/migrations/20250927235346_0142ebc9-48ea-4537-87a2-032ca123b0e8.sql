-- Add missing increment columns to cabinet_types table
ALTER TABLE public.cabinet_types 
ADD COLUMN width_increment INTEGER NOT NULL DEFAULT 50,
ADD COLUMN height_increment INTEGER NOT NULL DEFAULT 50,
ADD COLUMN depth_increment INTEGER NOT NULL DEFAULT 50;