export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          country: string
          created_at: string
          id: string
          is_default: boolean
          line1: string
          line2: string | null
          name: string
          phone: string | null
          postcode: string
          state: string
          suburb: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          line1: string
          line2?: string | null
          name: string
          phone?: string | null
          postcode: string
          state: string
          suburb: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          line1?: string
          line2?: string | null
          name?: string
          phone?: string | null
          postcode?: string
          state?: string
          suburb?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_impersonation_sessions: {
        Row: {
          admin_user_id: string
          created_at: string
          ended_at: string | null
          expires_at: string
          id: string
          impersonated_customer_email: string
          quote_id: string | null
          session_token: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          ended_at?: string | null
          expires_at?: string
          id?: string
          impersonated_customer_email: string
          quote_id?: string | null
          session_token: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          ended_at?: string | null
          expires_at?: string
          id?: string
          impersonated_customer_email?: string
          quote_id?: string | null
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_impersonation_sessions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          last_active_at: string | null
          session_token: string
          two_fa_verified: boolean | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          last_active_at?: string | null
          session_token: string
          two_fa_verified?: boolean | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_active_at?: string | null
          session_token?: string
          two_fa_verified?: boolean | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assembly_jobs: {
        Row: {
          assigned_team: string | null
          completed_at: string | null
          components_included: string
          created_at: string
          created_by: string | null
          customer_notes: string | null
          hours_actual: number | null
          hours_estimated: number
          id: string
          order_id: string
          price_ex_gst: number
          scheduled_for: string | null
          shipment_id: string | null
          site_photos: Json | null
          started_at: string | null
          status: string
          technician_notes: string | null
          updated_at: string
        }
        Insert: {
          assigned_team?: string | null
          completed_at?: string | null
          components_included?: string
          created_at?: string
          created_by?: string | null
          customer_notes?: string | null
          hours_actual?: number | null
          hours_estimated?: number
          id?: string
          order_id: string
          price_ex_gst?: number
          scheduled_for?: string | null
          shipment_id?: string | null
          site_photos?: Json | null
          started_at?: string | null
          status?: string
          technician_notes?: string | null
          updated_at?: string
        }
        Update: {
          assigned_team?: string | null
          completed_at?: string | null
          components_included?: string
          created_at?: string
          created_by?: string | null
          customer_notes?: string | null
          hours_actual?: number | null
          hours_estimated?: number
          id?: string
          order_id?: string
          price_ex_gst?: number
          scheduled_for?: string | null
          shipment_id?: string | null
          site_photos?: Json | null
          started_at?: string | null
          status?: string
          technician_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assembly_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      assembly_surcharge_zones: {
        Row: {
          active: boolean
          affected_postcodes_count: number | null
          carcass_surcharge_pct: number
          center_latitude: number
          center_longitude: number
          created_at: string
          doors_surcharge_pct: number
          id: string
          radius_km: number
          updated_at: string
          zone_name: string
        }
        Insert: {
          active?: boolean
          affected_postcodes_count?: number | null
          carcass_surcharge_pct?: number
          center_latitude: number
          center_longitude: number
          created_at?: string
          doors_surcharge_pct?: number
          id?: string
          radius_km?: number
          updated_at?: string
          zone_name: string
        }
        Update: {
          active?: boolean
          affected_postcodes_count?: number | null
          carcass_surcharge_pct?: number
          center_latitude?: number
          center_longitude?: number
          created_at?: string
          doors_surcharge_pct?: number
          id?: string
          radius_km?: number
          updated_at?: string
          zone_name?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          scope: string | null
          scope_id: string | null
          table_name: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          scope?: string | null
          scope_id?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          scope?: string | null
          scope_id?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      cabinet_door_styles: {
        Row: {
          active: boolean
          cabinet_type_id: string
          created_at: string
          door_style_id: string
          id: string
          image_url: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          cabinet_type_id: string
          created_at?: string
          door_style_id: string
          id?: string
          image_url?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          cabinet_type_id?: string
          created_at?: string
          door_style_id?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_cabinet_door_styles_cabinet_type"
            columns: ["cabinet_type_id"]
            isOneToOne: false
            referencedRelation: "cabinet_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cabinet_door_styles_door_style"
            columns: ["door_style_id"]
            isOneToOne: false
            referencedRelation: "door_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      cabinet_hardware_options: {
        Row: {
          active: boolean
          created_at: string
          hardware_brand_id: string
          hardware_product_id: string
          id: string
          requirement_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          hardware_brand_id: string
          hardware_product_id: string
          id?: string
          requirement_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          hardware_brand_id?: string
          hardware_product_id?: string
          id?: string
          requirement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cabinet_hardware_options_hardware_brand_id_fkey"
            columns: ["hardware_brand_id"]
            isOneToOne: false
            referencedRelation: "hardware_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabinet_hardware_options_hardware_product_id_fkey"
            columns: ["hardware_product_id"]
            isOneToOne: false
            referencedRelation: "hardware_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabinet_hardware_options_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "cabinet_hardware_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      cabinet_hardware_requirements: {
        Row: {
          active: boolean
          cabinet_type_id: string
          created_at: string
          hardware_type_id: string
          id: string
          notes: string | null
          unit_scope: string
          units_per_scope: number
        }
        Insert: {
          active?: boolean
          cabinet_type_id: string
          created_at?: string
          hardware_type_id: string
          id?: string
          notes?: string | null
          unit_scope: string
          units_per_scope?: number
        }
        Update: {
          active?: boolean
          cabinet_type_id?: string
          created_at?: string
          hardware_type_id?: string
          id?: string
          notes?: string | null
          unit_scope?: string
          units_per_scope?: number
        }
        Relationships: [
          {
            foreignKeyName: "cabinet_hardware_requirements_cabinet_type_id_fkey"
            columns: ["cabinet_type_id"]
            isOneToOne: false
            referencedRelation: "cabinet_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabinet_hardware_requirements_hardware_type_id_fkey"
            columns: ["hardware_type_id"]
            isOneToOne: false
            referencedRelation: "hardware_types"
            referencedColumns: ["id"]
          },
        ]
      }
      cabinet_parts: {
        Row: {
          cabinet_type_id: string
          created_at: string
          height_formula: string | null
          id: string
          is_door: boolean
          is_hardware: boolean
          material_density_kg_per_sqm: number | null
          material_thickness_mm: number | null
          part_name: string
          quantity: number
          weight_multiplier: number | null
          width_formula: string | null
        }
        Insert: {
          cabinet_type_id: string
          created_at?: string
          height_formula?: string | null
          id?: string
          is_door?: boolean
          is_hardware?: boolean
          material_density_kg_per_sqm?: number | null
          material_thickness_mm?: number | null
          part_name: string
          quantity?: number
          weight_multiplier?: number | null
          width_formula?: string | null
        }
        Update: {
          cabinet_type_id?: string
          created_at?: string
          height_formula?: string | null
          id?: string
          is_door?: boolean
          is_hardware?: boolean
          material_density_kg_per_sqm?: number | null
          material_thickness_mm?: number | null
          part_name?: string
          quantity?: number
          weight_multiplier?: number | null
          width_formula?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cabinet_parts_cabinet_type_id_fkey"
            columns: ["cabinet_type_id"]
            isOneToOne: false
            referencedRelation: "cabinet_types"
            referencedColumns: ["id"]
          },
        ]
      }
      cabinet_types: {
        Row: {
          active: boolean
          assembly_available: boolean | null
          assembly_carcass_only_price: number | null
          assembly_with_doors_price: number | null
          backs_qty: number | null
          base_price: number | null
          bottoms_qty: number | null
          cabinet_style: string | null
          category: string
          category_id: string | null
          created_at: string
          default_depth_mm: number
          default_height_mm: number
          default_width_mm: number
          display_order: number | null
          door_count: number
          door_qty: number | null
          door_rate_per_sqm: number | null
          drawer_count: number
          id: string
          is_featured: boolean | null
          left_side_depth_mm: number | null
          left_side_width_mm: number | null
          long_description: string | null
          material_rate_per_sqm: number | null
          max_depth_mm: number | null
          max_height_mm: number | null
          max_width_mm: number | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          min_depth_mm: number | null
          min_height_mm: number | null
          min_width_mm: number | null
          name: string
          price_calculation_method: string | null
          pricing_formula: string | null
          product_image_url: string | null
          qty_left_back: number | null
          qty_left_side: number | null
          qty_right_back: number | null
          qty_right_side: number | null
          range_id: string | null
          right_side_depth_mm: number | null
          right_side_width_mm: number | null
          room_category_id: string | null
          short_description: string | null
          sides_qty: number | null
          subcategory: string | null
          subcategory_display_order: number | null
          subcategory_id: string | null
          url_slug: string | null
        }
        Insert: {
          active?: boolean
          assembly_available?: boolean | null
          assembly_carcass_only_price?: number | null
          assembly_with_doors_price?: number | null
          backs_qty?: number | null
          base_price?: number | null
          bottoms_qty?: number | null
          cabinet_style?: string | null
          category: string
          category_id?: string | null
          created_at?: string
          default_depth_mm: number
          default_height_mm: number
          default_width_mm: number
          display_order?: number | null
          door_count?: number
          door_qty?: number | null
          door_rate_per_sqm?: number | null
          drawer_count?: number
          id?: string
          is_featured?: boolean | null
          left_side_depth_mm?: number | null
          left_side_width_mm?: number | null
          long_description?: string | null
          material_rate_per_sqm?: number | null
          max_depth_mm?: number | null
          max_height_mm?: number | null
          max_width_mm?: number | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          min_depth_mm?: number | null
          min_height_mm?: number | null
          min_width_mm?: number | null
          name: string
          price_calculation_method?: string | null
          pricing_formula?: string | null
          product_image_url?: string | null
          qty_left_back?: number | null
          qty_left_side?: number | null
          qty_right_back?: number | null
          qty_right_side?: number | null
          range_id?: string | null
          right_side_depth_mm?: number | null
          right_side_width_mm?: number | null
          room_category_id?: string | null
          short_description?: string | null
          sides_qty?: number | null
          subcategory?: string | null
          subcategory_display_order?: number | null
          subcategory_id?: string | null
          url_slug?: string | null
        }
        Update: {
          active?: boolean
          assembly_available?: boolean | null
          assembly_carcass_only_price?: number | null
          assembly_with_doors_price?: number | null
          backs_qty?: number | null
          base_price?: number | null
          bottoms_qty?: number | null
          cabinet_style?: string | null
          category?: string
          category_id?: string | null
          created_at?: string
          default_depth_mm?: number
          default_height_mm?: number
          default_width_mm?: number
          display_order?: number | null
          door_count?: number
          door_qty?: number | null
          door_rate_per_sqm?: number | null
          drawer_count?: number
          id?: string
          is_featured?: boolean | null
          left_side_depth_mm?: number | null
          left_side_width_mm?: number | null
          long_description?: string | null
          material_rate_per_sqm?: number | null
          max_depth_mm?: number | null
          max_height_mm?: number | null
          max_width_mm?: number | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          min_depth_mm?: number | null
          min_height_mm?: number | null
          min_width_mm?: number | null
          name?: string
          price_calculation_method?: string | null
          pricing_formula?: string | null
          product_image_url?: string | null
          qty_left_back?: number | null
          qty_left_side?: number | null
          qty_right_back?: number | null
          qty_right_side?: number | null
          range_id?: string | null
          right_side_depth_mm?: number | null
          right_side_width_mm?: number | null
          room_category_id?: string | null
          short_description?: string | null
          sides_qty?: number | null
          subcategory?: string | null
          subcategory_display_order?: number | null
          subcategory_id?: string | null
          url_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cabinet_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabinet_types_range_id_fkey"
            columns: ["range_id"]
            isOneToOne: false
            referencedRelation: "product_ranges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabinet_types_room_category_id_fkey"
            columns: ["room_category_id"]
            isOneToOne: false
            referencedRelation: "unified_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabinet_types_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_activity_log: {
        Row: {
          action: string
          cart_id: string
          created_at: string | null
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          cart_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          cart_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_activity_log_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          attachment_file_ids: string[] | null
          cabinet_type_id: string
          cart_id: string
          color_id: string | null
          configuration: Json | null
          created_at: string
          custom_props_hash: string | null
          depth_mm: number
          door_style_id: string | null
          finish_id: string | null
          height_mm: number
          id: string
          locked: boolean | null
          notes: string | null
          price_override_amount: number | null
          price_override_reason: string | null
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
          width_mm: number
        }
        Insert: {
          attachment_file_ids?: string[] | null
          cabinet_type_id: string
          cart_id: string
          color_id?: string | null
          configuration?: Json | null
          created_at?: string
          custom_props_hash?: string | null
          depth_mm: number
          door_style_id?: string | null
          finish_id?: string | null
          height_mm: number
          id?: string
          locked?: boolean | null
          notes?: string | null
          price_override_amount?: number | null
          price_override_reason?: string | null
          quantity?: number
          total_price: number
          unit_price: number
          updated_at?: string
          width_mm: number
        }
        Update: {
          attachment_file_ids?: string[] | null
          cabinet_type_id?: string
          cart_id?: string
          color_id?: string | null
          configuration?: Json | null
          created_at?: string
          custom_props_hash?: string | null
          depth_mm?: number
          door_style_id?: string | null
          finish_id?: string | null
          height_mm?: number
          id?: string
          locked?: boolean | null
          notes?: string | null
          price_override_amount?: number | null
          price_override_reason?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
          width_mm?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cabinet_type_id_fkey"
            columns: ["cabinet_type_id"]
            isOneToOne: false
            referencedRelation: "cabinet_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_door_style_id_fkey"
            columns: ["door_style_id"]
            isOneToOne: false
            referencedRelation: "door_styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_finish_id_fkey"
            columns: ["finish_id"]
            isOneToOne: false
            referencedRelation: "finishes"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          abandon_reason: string | null
          abandoned_at: string | null
          archive_reason: string | null
          auto_archived_at: string | null
          change_summary: Json | null
          converted_order_id: string | null
          converted_quote_id: string | null
          created_at: string
          expiry_date: string | null
          id: string
          is_primary: boolean | null
          label: string | null
          last_activity_at: string | null
          lifecycle_state: string | null
          merged_from_cart_id: string | null
          merged_into_cart_id: string | null
          name: string | null
          notes: string | null
          owner_user_id: string | null
          parent_cart_id: string | null
          quote_version: string | null
          session_id: string | null
          source: string | null
          source_details: Json | null
          status: string
          tags: string[] | null
          total_amount: number | null
          updated_at: string
          user_id: string | null
          version_number: number | null
        }
        Insert: {
          abandon_reason?: string | null
          abandoned_at?: string | null
          archive_reason?: string | null
          auto_archived_at?: string | null
          change_summary?: Json | null
          converted_order_id?: string | null
          converted_quote_id?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          last_activity_at?: string | null
          lifecycle_state?: string | null
          merged_from_cart_id?: string | null
          merged_into_cart_id?: string | null
          name?: string | null
          notes?: string | null
          owner_user_id?: string | null
          parent_cart_id?: string | null
          quote_version?: string | null
          session_id?: string | null
          source?: string | null
          source_details?: Json | null
          status?: string
          tags?: string[] | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
          version_number?: number | null
        }
        Update: {
          abandon_reason?: string | null
          abandoned_at?: string | null
          archive_reason?: string | null
          auto_archived_at?: string | null
          change_summary?: Json | null
          converted_order_id?: string | null
          converted_quote_id?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          last_activity_at?: string | null
          lifecycle_state?: string | null
          merged_from_cart_id?: string | null
          merged_into_cart_id?: string | null
          name?: string | null
          notes?: string | null
          owner_user_id?: string | null
          parent_cart_id?: string | null
          quote_version?: string | null
          session_id?: string | null
          source?: string | null
          source_details?: Json | null
          status?: string
          tags?: string[] | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_converted_order_id_fkey"
            columns: ["converted_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_merged_from_cart_id_fkey"
            columns: ["merged_from_cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_merged_into_cart_id_fkey"
            columns: ["merged_into_cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_parent_cart_id_fkey"
            columns: ["parent_cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      checkout_quotes: {
        Row: {
          applied_at: string
          checkout_id: string
          id: string
          quote_id: string
        }
        Insert: {
          applied_at?: string
          checkout_id: string
          id?: string
          quote_id: string
        }
        Update: {
          applied_at?: string
          checkout_id?: string
          id?: string
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_quotes_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
        ]
      }
      checkouts: {
        Row: {
          accept_privacy: boolean | null
          accept_terms: boolean | null
          cart_id: string | null
          customer_abn: string | null
          customer_company: string | null
          customer_email: string | null
          customer_first_name: string | null
          customer_last_name: string | null
          customer_phone: string | null
          expires_at: string
          how_heard: string | null
          id: string
          marketing_opt_in: boolean | null
          session_id: string | null
          started_at: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accept_privacy?: boolean | null
          accept_terms?: boolean | null
          cart_id?: string | null
          customer_abn?: string | null
          customer_company?: string | null
          customer_email?: string | null
          customer_first_name?: string | null
          customer_last_name?: string | null
          customer_phone?: string | null
          expires_at?: string
          how_heard?: string | null
          id?: string
          marketing_opt_in?: boolean | null
          session_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accept_privacy?: boolean | null
          accept_terms?: boolean | null
          cart_id?: string | null
          customer_abn?: string | null
          customer_company?: string | null
          customer_email?: string | null
          customer_first_name?: string | null
          customer_last_name?: string | null
          customer_phone?: string | null
          expires_at?: string
          how_heard?: string | null
          id?: string
          marketing_opt_in?: boolean | null
          session_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkouts_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
        ]
      }
      color_door_styles: {
        Row: {
          active: boolean
          color_id: string
          created_at: string
          door_style_id: string
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color_id: string
          created_at?: string
          door_style_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color_id?: string
          created_at?: string
          door_style_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "color_door_styles_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "color_door_styles_door_style_id_fkey"
            columns: ["door_style_id"]
            isOneToOne: false
            referencedRelation: "door_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      color_finishes: {
        Row: {
          active: boolean
          color_id: string
          created_at: string
          finish_id: string
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color_id: string
          created_at?: string
          finish_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color_id?: string
          created_at?: string
          finish_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "color_finishes_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "color_finishes_finish_id_fkey"
            columns: ["finish_id"]
            isOneToOne: false
            referencedRelation: "finishes"
            referencedColumns: ["id"]
          },
        ]
      }
      colors: {
        Row: {
          active: boolean
          created_at: string
          door_style_id: string | null
          hex_code: string | null
          id: string
          image_url: string | null
          name: string
          sort_order: number | null
          surcharge_rate_per_sqm: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          door_style_id?: string | null
          hex_code?: string | null
          id?: string
          image_url?: string | null
          name: string
          sort_order?: number | null
          surcharge_rate_per_sqm?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          door_style_id?: string | null
          hex_code?: string | null
          id?: string
          image_url?: string | null
          name?: string
          sort_order?: number | null
          surcharge_rate_per_sqm?: number
        }
        Relationships: [
          {
            foreignKeyName: "colors_door_style_id_fkey"
            columns: ["door_style_id"]
            isOneToOne: false
            referencedRelation: "door_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      configuration_templates: {
        Row: {
          cabinet_type_id: string
          configuration: Json
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cabinet_type_id: string
          configuration: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cabinet_type_id?: string
          configuration?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuration_templates_cabinet_type_id_fkey"
            columns: ["cabinet_type_id"]
            isOneToOne: false
            referencedRelation: "cabinet_types"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          abn: string | null
          billing_address: Json | null
          company_name: string | null
          created_at: string
          credit_limit: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          payment_terms: number | null
          phone: string | null
          shipping_address: Json | null
          updated_at: string
          user_id: string | null
          xero_contact_id: string | null
        }
        Insert: {
          abn?: string | null
          billing_address?: Json | null
          company_name?: string | null
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          payment_terms?: number | null
          phone?: string | null
          shipping_address?: Json | null
          updated_at?: string
          user_id?: string | null
          xero_contact_id?: string | null
        }
        Update: {
          abn?: string | null
          billing_address?: Json | null
          company_name?: string | null
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          payment_terms?: number | null
          phone?: string | null
          shipping_address?: Json | null
          updated_at?: string
          user_id?: string | null
          xero_contact_id?: string | null
        }
        Relationships: []
      }
      credit_allocations: {
        Row: {
          allocated_amount: number
          allocated_at: string
          allocated_by: string | null
          credit_id: string
          id: string
          invoice_id: string
        }
        Insert: {
          allocated_amount: number
          allocated_at?: string
          allocated_by?: string | null
          credit_id: string
          id?: string
          invoice_id: string
        }
        Update: {
          allocated_amount?: number
          allocated_at?: string
          allocated_by?: string | null
          credit_id?: string
          id?: string
          invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_allocations_credit_id_fkey"
            columns: ["credit_id"]
            isOneToOne: false
            referencedRelation: "credits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          allocated_amount: number | null
          contact_id: string
          created_at: string
          created_by: string | null
          credit_date: string
          credit_note_number: string
          currency: string | null
          gst_amount: number
          id: string
          invoice_id: string | null
          notes: string | null
          pdf_url: string | null
          reason: string
          remaining_amount: number | null
          status: string | null
          subtotal: number
          total_amount: number
          updated_at: string
          xero_credit_note_id: string | null
        }
        Insert: {
          allocated_amount?: number | null
          contact_id: string
          created_at?: string
          created_by?: string | null
          credit_date?: string
          credit_note_number: string
          currency?: string | null
          gst_amount?: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
          pdf_url?: string | null
          reason: string
          remaining_amount?: number | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string
          xero_credit_note_id?: string | null
        }
        Update: {
          allocated_amount?: number | null
          contact_id?: string
          created_at?: string
          created_by?: string | null
          credit_date?: string
          credit_note_number?: string
          currency?: string | null
          gst_amount?: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
          pdf_url?: string | null
          reason?: string
          remaining_amount?: number | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string
          xero_credit_note_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credits_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_approvals: {
        Row: {
          all_approvals_completed_at: string | null
          created_at: string
          final_measurements_confirmed: boolean
          final_measurements_confirmed_at: string | null
          final_measurements_confirmed_by: string | null
          id: string
          notes: string | null
          order_id: string
          signature_completed_at: string | null
          signature_data: Json | null
          signature_required: boolean
          style_colour_finish_confirmed: boolean
          style_colour_finish_confirmed_at: string | null
          style_colour_finish_confirmed_by: string | null
          updated_at: string
        }
        Insert: {
          all_approvals_completed_at?: string | null
          created_at?: string
          final_measurements_confirmed?: boolean
          final_measurements_confirmed_at?: string | null
          final_measurements_confirmed_by?: string | null
          id?: string
          notes?: string | null
          order_id: string
          signature_completed_at?: string | null
          signature_data?: Json | null
          signature_required?: boolean
          style_colour_finish_confirmed?: boolean
          style_colour_finish_confirmed_at?: string | null
          style_colour_finish_confirmed_by?: string | null
          updated_at?: string
        }
        Update: {
          all_approvals_completed_at?: string | null
          created_at?: string
          final_measurements_confirmed?: boolean
          final_measurements_confirmed_at?: string | null
          final_measurements_confirmed_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          signature_completed_at?: string | null
          signature_data?: Json | null
          signature_required?: boolean
          style_colour_finish_confirmed?: boolean
          style_colour_finish_confirmed_at?: string | null
          style_colour_finish_confirmed_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      depot_list: {
        Row: {
          active: boolean
          address_id: string
          carrier: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          facilities: Json | null
          id: string
          name: string
          opening_hours: Json | null
        }
        Insert: {
          active?: boolean
          address_id: string
          carrier: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          facilities?: Json | null
          id?: string
          name: string
          opening_hours?: Json | null
        }
        Update: {
          active?: boolean
          address_id?: string
          carrier?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          facilities?: Json | null
          id?: string
          name?: string
          opening_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "depot_list_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      door_style_finishes: {
        Row: {
          active: boolean
          created_at: string
          door_style_id: string
          finish_id: string
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          door_style_id: string
          finish_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          door_style_id?: string
          finish_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "door_style_finishes_door_style_id_fkey"
            columns: ["door_style_id"]
            isOneToOne: false
            referencedRelation: "door_styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_style_finishes_finish_id_fkey"
            columns: ["finish_id"]
            isOneToOne: false
            referencedRelation: "finishes"
            referencedColumns: ["id"]
          },
        ]
      }
      door_styles: {
        Row: {
          active: boolean
          base_rate_per_sqm: number
          brand_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          material_density_kg_per_sqm: number | null
          name: string
          thickness_mm: number | null
          weight_factor: number | null
        }
        Insert: {
          active?: boolean
          base_rate_per_sqm?: number
          brand_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          material_density_kg_per_sqm?: number | null
          name: string
          thickness_mm?: number | null
          weight_factor?: number | null
        }
        Update: {
          active?: boolean
          base_rate_per_sqm?: number
          brand_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          material_density_kg_per_sqm?: number | null
          name?: string
          thickness_mm?: number | null
          weight_factor?: number | null
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      exceptions: {
        Row: {
          assigned_to: string | null
          cost_impact: number | null
          created_at: string
          description: string
          id: string
          photos: Json | null
          reported_by: string | null
          resolution_notes: string | null
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          shipment_id: string
          type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          cost_impact?: number | null
          created_at?: string
          description: string
          id?: string
          photos?: Json | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          shipment_id: string
          type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          cost_impact?: number | null
          created_at?: string
          description?: string
          id?: string
          photos?: Json | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          shipment_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          environment: string
          flag_key: string
          flag_name: string
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          environment?: string
          flag_key: string
          flag_name: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          environment?: string
          flag_key?: string
          flag_name?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      file_attachments: {
        Row: {
          attached_by: string
          created_at: string
          file_id: string
          id: string
          scope: string
          scope_id: string
        }
        Insert: {
          attached_by: string
          created_at?: string
          file_id: string
          id?: string
          scope: string
          scope_id: string
        }
        Update: {
          attached_by?: string
          created_at?: string
          file_id?: string
          id?: string
          scope?: string
          scope_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_attachments_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          created_by: string | null
          file_size: number
          filename: string
          id: string
          kind: string
          mime_type: string
          owner_user_id: string | null
          sha256_hash: string | null
          storage_url: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_size: number
          filename: string
          id?: string
          kind: string
          mime_type: string
          owner_user_id?: string | null
          sha256_hash?: string | null
          storage_url: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_size?: number
          filename?: string
          id?: string
          kind?: string
          mime_type?: string
          owner_user_id?: string | null
          sha256_hash?: string | null
          storage_url?: string
          visibility?: string
        }
        Relationships: []
      }
      finishes: {
        Row: {
          active: boolean
          created_at: string
          door_style_id: string | null
          finish_type: string
          id: string
          name: string
          rate_per_sqm: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          door_style_id?: string | null
          finish_type: string
          id?: string
          name: string
          rate_per_sqm?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          door_style_id?: string | null
          finish_type?: string
          id?: string
          name?: string
          rate_per_sqm?: number
        }
        Relationships: [
          {
            foreignKeyName: "finishes_door_style_id_fkey"
            columns: ["door_style_id"]
            isOneToOne: false
            referencedRelation: "door_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      global_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      hardware_brands: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          website_url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          website_url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
      hardware_products: {
        Row: {
          active: boolean
          cost_per_unit: number
          created_at: string
          description: string | null
          hardware_brand_id: string
          hardware_type_id: string
          id: string
          model_number: string | null
          name: string
          specifications: Json | null
        }
        Insert: {
          active?: boolean
          cost_per_unit?: number
          created_at?: string
          description?: string | null
          hardware_brand_id: string
          hardware_type_id: string
          id?: string
          model_number?: string | null
          name: string
          specifications?: Json | null
        }
        Update: {
          active?: boolean
          cost_per_unit?: number
          created_at?: string
          description?: string | null
          hardware_brand_id?: string
          hardware_type_id?: string
          id?: string
          model_number?: string | null
          name?: string
          specifications?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "hardware_products_hardware_brand_id_fkey"
            columns: ["hardware_brand_id"]
            isOneToOne: false
            referencedRelation: "hardware_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hardware_products_hardware_type_id_fkey"
            columns: ["hardware_type_id"]
            isOneToOne: false
            referencedRelation: "hardware_types"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_selections: {
        Row: {
          created_at: string
          hardware_product_id: string | null
          hardware_type: string
          id: string
          quantity: number
          quote_item_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          hardware_product_id?: string | null
          hardware_type: string
          id?: string
          quantity?: number
          quote_item_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          hardware_product_id?: string | null
          hardware_type?: string
          id?: string
          quantity?: number
          quote_item_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "hardware_selections_hardware_product_id_fkey"
            columns: ["hardware_product_id"]
            isOneToOne: false
            referencedRelation: "hardware_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hardware_selections_quote_item_id_fkey"
            columns: ["quote_item_id"]
            isOneToOne: false
            referencedRelation: "quote_items"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_types: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      inventory_transactions: {
        Row: {
          cabinet_type_id: string
          created_at: string
          created_by: string | null
          id: string
          new_stock: number
          notes: string | null
          previous_stock: number
          quantity_change: number
          reference_id: string | null
          transaction_type: string
        }
        Insert: {
          cabinet_type_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_stock: number
          notes?: string | null
          previous_stock: number
          quantity_change: number
          reference_id?: string | null
          transaction_type: string
        }
        Update: {
          cabinet_type_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          quantity_change?: number
          reference_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_cabinet_type_id_fkey"
            columns: ["cabinet_type_id"]
            isOneToOne: false
            referencedRelation: "cabinet_types"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          account_code: string | null
          cabinet_type_id: string | null
          created_at: string
          description: string
          discount_rate: number | null
          id: string
          invoice_id: string
          item_code: string | null
          line_amount_ex_gst: number
          line_amount_inc_gst: number
          line_number: number
          order_item_id: string | null
          quantity: number
          tax_amount: number | null
          tax_code: string | null
          tax_rate: number | null
          tracking_category_1: string | null
          tracking_category_2: string | null
          unit_price_ex_gst: number
          unit_price_inc_gst: number
          updated_at: string
        }
        Insert: {
          account_code?: string | null
          cabinet_type_id?: string | null
          created_at?: string
          description: string
          discount_rate?: number | null
          id?: string
          invoice_id: string
          item_code?: string | null
          line_amount_ex_gst?: number
          line_amount_inc_gst?: number
          line_number?: number
          order_item_id?: string | null
          quantity?: number
          tax_amount?: number | null
          tax_code?: string | null
          tax_rate?: number | null
          tracking_category_1?: string | null
          tracking_category_2?: string | null
          unit_price_ex_gst?: number
          unit_price_inc_gst?: number
          updated_at?: string
        }
        Update: {
          account_code?: string | null
          cabinet_type_id?: string | null
          created_at?: string
          description?: string
          discount_rate?: number | null
          id?: string
          invoice_id?: string
          item_code?: string | null
          line_amount_ex_gst?: number
          line_amount_inc_gst?: number
          line_number?: number
          order_item_id?: string | null
          quantity?: number
          tax_amount?: number | null
          tax_code?: string | null
          tax_rate?: number | null
          tracking_category_1?: string | null
          tracking_category_2?: string | null
          unit_price_ex_gst?: number
          unit_price_inc_gst?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_cabinet_type_id_fkey"
            columns: ["cabinet_type_id"]
            isOneToOne: false
            referencedRelation: "cabinet_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          contact_id: string | null
          created_at: string
          currency: string | null
          discount_amount: number | null
          discount_percentage: number | null
          due_date: string | null
          exchange_rate: number | null
          gst_amount: number
          id: string
          internal_notes: string | null
          invoice_date: string
          invoice_number: string
          milestone_percentage: number | null
          milestone_type: string | null
          notes: string | null
          order_id: string
          payment_schedule_id: string | null
          pdf_url: string | null
          purchase_order: string | null
          reference: string | null
          sent_at: string | null
          shipping_amount: number | null
          status: string
          subtotal: number
          terms: string | null
          total_amount: number
          updated_at: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
          xero_invoice_id: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date?: string | null
          exchange_rate?: number | null
          gst_amount?: number
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number: string
          milestone_percentage?: number | null
          milestone_type?: string | null
          notes?: string | null
          order_id: string
          payment_schedule_id?: string | null
          pdf_url?: string | null
          purchase_order?: string | null
          reference?: string | null
          sent_at?: string | null
          shipping_amount?: number | null
          status?: string
          subtotal?: number
          terms?: string | null
          total_amount?: number
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          xero_invoice_id?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date?: string | null
          exchange_rate?: number | null
          gst_amount?: number
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number?: string
          milestone_percentage?: number | null
          milestone_type?: string | null
          notes?: string | null
          order_id?: string
          payment_schedule_id?: string | null
          pdf_url?: string | null
          purchase_order?: string | null
          reference?: string | null
          sent_at?: string | null
          shipping_amount?: number | null
          status?: string
          subtotal?: number
          terms?: string | null
          total_amount?: number
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          xero_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      material_specifications: {
        Row: {
          active: boolean
          cost_per_sqm: number
          created_at: string
          density_kg_per_cubic_m: number
          id: string
          material_type: string
          standard_thickness_mm: number
          updated_at: string
          weight_factor: number
          weight_per_sqm: number | null
        }
        Insert: {
          active?: boolean
          cost_per_sqm?: number
          created_at?: string
          density_kg_per_cubic_m?: number
          id?: string
          material_type: string
          standard_thickness_mm?: number
          updated_at?: string
          weight_factor?: number
          weight_per_sqm?: number | null
        }
        Update: {
          active?: boolean
          cost_per_sqm?: number
          created_at?: string
          density_kg_per_cubic_m?: number
          id?: string
          material_type?: string
          standard_thickness_mm?: number
          updated_at?: string
          weight_factor?: number
          weight_per_sqm?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          extension: string | null
          file_ids: string[] | null
          id: string
          message_text: string
          message_type: string
          scope: string
          scope_id: string
          topic: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          extension?: string | null
          file_ids?: string[] | null
          id?: string
          message_text: string
          message_type?: string
          scope: string
          scope_id: string
          topic?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          extension?: string | null
          file_ids?: string[] | null
          id?: string
          message_text?: string
          message_type?: string
          scope?: string
          scope_id?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          digest_frequency: string
          email_enabled: boolean
          id: string
          marketing_emails: boolean
          order_updates: boolean
          payment_reminders: boolean
          quote_updates: boolean
          sms_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          digest_frequency?: string
          email_enabled?: boolean
          id?: string
          marketing_emails?: boolean
          order_updates?: boolean
          payment_reminders?: boolean
          quote_updates?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          digest_frequency?: string
          email_enabled?: boolean
          id?: string
          marketing_emails?: boolean
          order_updates?: boolean
          payment_reminders?: boolean
          quote_updates?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      option_values: {
        Row: {
          code: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          product_option_id: string
          sort_order: number
          swatch_hex: string | null
          value: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          product_option_id: string
          sort_order?: number
          swatch_hex?: string | null
          value: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          product_option_id?: string
          sort_order?: number
          swatch_hex?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "option_values_product_option_id_fkey"
            columns: ["product_option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          cabinet_type_id: string
          color_id: string | null
          configuration: Json | null
          created_at: string
          depth_mm: number
          door_style_id: string | null
          finish_id: string | null
          height_mm: number
          id: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
          width_mm: number
        }
        Insert: {
          cabinet_type_id: string
          color_id?: string | null
          configuration?: Json | null
          created_at?: string
          depth_mm: number
          door_style_id?: string | null
          finish_id?: string | null
          height_mm: number
          id?: string
          order_id: string
          quantity?: number
          total_price: number
          unit_price: number
          width_mm: number
        }
        Update: {
          cabinet_type_id?: string
          color_id?: string | null
          configuration?: Json | null
          created_at?: string
          depth_mm?: number
          door_style_id?: string | null
          finish_id?: string | null
          height_mm?: number
          id?: string
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          width_mm?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_cabinet_type_id_fkey"
            columns: ["cabinet_type_id"]
            isOneToOne: false
            referencedRelation: "cabinet_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_door_style_id_fkey"
            columns: ["door_style_id"]
            isOneToOne: false
            referencedRelation: "door_styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_finish_id_fkey"
            columns: ["finish_id"]
            isOneToOne: false
            referencedRelation: "finishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          created_at: string
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          production_status: string | null
          session_id: string | null
          shipping_address: Json | null
          shipping_amount: number
          status: string
          stripe_session_id: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          production_status?: string | null
          session_id?: string | null
          shipping_address?: Json | null
          shipping_amount?: number
          status?: string
          stripe_session_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          production_status?: string | null
          session_id?: string | null
          shipping_address?: Json | null
          shipping_amount?: number
          status?: string
          stripe_session_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_intents: {
        Row: {
          amount: number
          client_secret: string | null
          created_at: string
          currency: string | null
          failure_reason: string | null
          id: string
          invoice_id: string
          metadata: Json | null
          payment_method_types: string[] | null
          provider: string
          provider_intent_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          client_secret?: string | null
          created_at?: string
          currency?: string | null
          failure_reason?: string | null
          id?: string
          invoice_id: string
          metadata?: Json | null
          payment_method_types?: string[] | null
          provider: string
          provider_intent_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          client_secret?: string | null
          created_at?: string
          currency?: string | null
          failure_reason?: string | null
          id?: string
          invoice_id?: string
          metadata?: Json | null
          payment_method_types?: string[] | null
          provider?: string
          provider_intent_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedules: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          order_id: string
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          percentage: number
          schedule_type: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          percentage?: number
          schedule_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          percentage?: number
          schedule_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          checkout_id: string | null
          created_at: string
          currency: string
          external_payment_id: string | null
          id: string
          order_id: string | null
          payment_data: Json | null
          payment_method: string
          payment_schedule_id: string | null
          payment_status: string
          processed_at: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          checkout_id?: string | null
          created_at?: string
          currency?: string
          external_payment_id?: string | null
          id?: string
          order_id?: string | null
          payment_data?: Json | null
          payment_method: string
          payment_schedule_id?: string | null
          payment_status?: string
          processed_at?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          checkout_id?: string | null
          created_at?: string
          currency?: string
          external_payment_id?: string | null
          id?: string
          order_id?: string | null
          payment_data?: Json | null
          payment_method?: string
          payment_schedule_id?: string | null
          payment_status?: string
          processed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_schedule_id_fkey"
            columns: ["payment_schedule_id"]
            isOneToOne: false
            referencedRelation: "payment_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      payments_enhanced: {
        Row: {
          amount: number
          bank_reference: string | null
          created_at: string
          currency: string | null
          fee_amount: number | null
          id: string
          invoice_id: string
          net_amount: number | null
          notes: string | null
          paid_at: string | null
          payment_intent_id: string | null
          payment_method: string | null
          payment_method_details: Json | null
          provider: string
          provider_transaction_id: string | null
          receipt_number: string | null
          receipt_url: string | null
          reconciled_at: string | null
          reconciled_by: string | null
          reference: string | null
          status: string | null
          updated_at: string
          xero_payment_id: string | null
        }
        Insert: {
          amount: number
          bank_reference?: string | null
          created_at?: string
          currency?: string | null
          fee_amount?: number | null
          id?: string
          invoice_id: string
          net_amount?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_method_details?: Json | null
          provider: string
          provider_transaction_id?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reference?: string | null
          status?: string | null
          updated_at?: string
          xero_payment_id?: string | null
        }
        Update: {
          amount?: number
          bank_reference?: string | null
          created_at?: string
          currency?: string | null
          fee_amount?: number | null
          id?: string
          invoice_id?: string
          net_amount?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_method_details?: Json | null
          provider?: string
          provider_transaction_id?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reference?: string | null
          status?: string | null
          updated_at?: string
          xero_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_enhanced_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_enhanced_payment_intent_id_fkey"
            columns: ["payment_intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      payments_new: {
        Row: {
          amount: number
          bank_reference: string | null
          created_at: string
          currency: string | null
          fee_amount: number | null
          id: string
          invoice_id: string
          net_amount: number | null
          notes: string | null
          paid_at: string | null
          payment_intent_id: string | null
          payment_method: string | null
          payment_method_details: Json | null
          provider: string
          provider_transaction_id: string | null
          receipt_number: string | null
          receipt_url: string | null
          reconciled_at: string | null
          reconciled_by: string | null
          reference: string | null
          status: string | null
          updated_at: string
          xero_payment_id: string | null
        }
        Insert: {
          amount: number
          bank_reference?: string | null
          created_at?: string
          currency?: string | null
          fee_amount?: number | null
          id?: string
          invoice_id: string
          net_amount?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_method_details?: Json | null
          provider: string
          provider_transaction_id?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reference?: string | null
          status?: string | null
          updated_at?: string
          xero_payment_id?: string | null
        }
        Update: {
          amount?: number
          bank_reference?: string | null
          created_at?: string
          currency?: string | null
          fee_amount?: number | null
          id?: string
          invoice_id?: string
          net_amount?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_method_details?: Json | null
          provider?: string
          provider_transaction_id?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reference?: string | null
          status?: string | null
          updated_at?: string
          xero_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_new_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_new_payment_intent_id_fkey"
            columns: ["payment_intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_verifications: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          otp: string
          phone_number: string
          user_id: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          otp: string
          phone_number: string
          user_id: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          otp?: string
          phone_number?: string
          user_id?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: []
      }
      postcode_zones: {
        Row: {
          assembly_base_carcass_price: number | null
          assembly_base_doors_price: number | null
          assembly_carcass_surcharge_pct: number | null
          assembly_doors_surcharge_pct: number | null
          assembly_eligible: boolean
          assembly_price_per_cabinet: number | null
          assigned_from_zone_id: string | null
          assigned_zone_id: string | null
          assignment_method: string | null
          created_at: string
          delivery_eligible: boolean
          depot_delivery_available: boolean | null
          home_delivery_available: boolean | null
          id: string
          last_assignment_date: string | null
          lead_time_days: number
          metro: boolean
          postcode: string
          remote: boolean
          state: string
          updated_at: string
          zone: string
        }
        Insert: {
          assembly_base_carcass_price?: number | null
          assembly_base_doors_price?: number | null
          assembly_carcass_surcharge_pct?: number | null
          assembly_doors_surcharge_pct?: number | null
          assembly_eligible?: boolean
          assembly_price_per_cabinet?: number | null
          assigned_from_zone_id?: string | null
          assigned_zone_id?: string | null
          assignment_method?: string | null
          created_at?: string
          delivery_eligible?: boolean
          depot_delivery_available?: boolean | null
          home_delivery_available?: boolean | null
          id?: string
          last_assignment_date?: string | null
          lead_time_days?: number
          metro?: boolean
          postcode: string
          remote?: boolean
          state: string
          updated_at?: string
          zone: string
        }
        Update: {
          assembly_base_carcass_price?: number | null
          assembly_base_doors_price?: number | null
          assembly_carcass_surcharge_pct?: number | null
          assembly_doors_surcharge_pct?: number | null
          assembly_eligible?: boolean
          assembly_price_per_cabinet?: number | null
          assigned_from_zone_id?: string | null
          assigned_zone_id?: string | null
          assignment_method?: string | null
          created_at?: string
          delivery_eligible?: boolean
          depot_delivery_available?: boolean | null
          home_delivery_available?: boolean | null
          id?: string
          last_assignment_date?: string | null
          lead_time_days?: number
          metro?: boolean
          postcode?: string
          remote?: boolean
          state?: string
          updated_at?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "postcode_zones_assigned_from_zone_id_fkey"
            columns: ["assigned_from_zone_id"]
            isOneToOne: false
            referencedRelation: "assembly_surcharge_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postcode_zones_assigned_zone_id_fkey"
            columns: ["assigned_zone_id"]
            isOneToOne: false
            referencedRelation: "assembly_surcharge_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      printing_queue: {
        Row: {
          created_at: string
          doc_type: string
          error_message: string | null
          id: string
          payload: Json
          pdf_url: string | null
          printed_at: string | null
          printed_by: string | null
          printer_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          error_message?: string | null
          id?: string
          payload: Json
          pdf_url?: string | null
          printed_at?: string | null
          printed_by?: string | null
          printer_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          error_message?: string | null
          id?: string
          payload?: Json
          pdf_url?: string | null
          printed_at?: string | null
          printed_by?: string | null
          printer_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_options: {
        Row: {
          created_at: string
          display_type: string
          id: string
          name: string
          position: number
          product_id: string
        }
        Insert: {
          created_at?: string
          display_type?: string
          id?: string
          name: string
          position?: number
          product_id: string
        }
        Update: {
          created_at?: string
          display_type?: string
          id?: string
          name?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ranges: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      production_updates: {
        Row: {
          created_at: string
          created_by: string
          id: string
          notes: string | null
          order_id: string
          stage: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          order_id: string
          stage: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          order_id?: string
          stage?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_updates_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          handle: string
          id: string
          product_type: string
          status: string
          tax_exempt: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          handle: string
          id?: string
          product_type: string
          status?: string
          tax_exempt?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          handle?: string
          id?: string
          product_type?: string
          status?: string
          tax_exempt?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          email_verified_at: string | null
          id: string
          phone: string | null
          phone_verified_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_verified_at?: string | null
          id?: string
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_verified_at?: string | null
          id?: string
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          cabinet_type_id: string
          color_id: string | null
          configuration: Json | null
          created_at: string
          depth_mm: number
          door_style_id: string | null
          enhanced_notes: string | null
          finish_id: string | null
          hardware_selections: Json | null
          height_mm: number
          id: string
          item_name: string | null
          job_reference: string | null
          notes: string | null
          quantity: number
          quote_id: string
          total_price: number
          unit_price: number
          width_mm: number
        }
        Insert: {
          cabinet_type_id: string
          color_id?: string | null
          configuration?: Json | null
          created_at?: string
          depth_mm: number
          door_style_id?: string | null
          enhanced_notes?: string | null
          finish_id?: string | null
          hardware_selections?: Json | null
          height_mm: number
          id?: string
          item_name?: string | null
          job_reference?: string | null
          notes?: string | null
          quantity?: number
          quote_id: string
          total_price: number
          unit_price: number
          width_mm: number
        }
        Update: {
          cabinet_type_id?: string
          color_id?: string | null
          configuration?: Json | null
          created_at?: string
          depth_mm?: number
          door_style_id?: string | null
          enhanced_notes?: string | null
          finish_id?: string | null
          hardware_selections?: Json | null
          height_mm?: number
          id?: string
          item_name?: string | null
          job_reference?: string | null
          notes?: string | null
          quantity?: number
          quote_id?: string
          total_price?: number
          unit_price?: number
          width_mm?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_cabinet_type_id_fkey"
            columns: ["cabinet_type_id"]
            isOneToOne: false
            referencedRelation: "cabinet_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_door_style_id_fkey"
            columns: ["door_style_id"]
            isOneToOne: false
            referencedRelation: "door_styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_finish_id_fkey"
            columns: ["finish_id"]
            isOneToOne: false
            referencedRelation: "finishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_notifications: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          notification_type: string
          quote_id: string
          sent_at: string
          sent_to: string
          status: string
          template_used: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          notification_type: string
          quote_id: string
          sent_at?: string
          sent_to: string
          status?: string
          template_used?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          notification_type?: string
          quote_id?: string
          sent_at?: string
          sent_to?: string
          status?: string
          template_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_notifications_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          additional_notes: string | null
          approximate_budget: string
          cabinet_finish: string | null
          color_preference: string | null
          created_at: string
          email: string
          file_count: number
          id: string
          kitchen_style: string
          name: string
          other_kitchen_style: string | null
          phone: string
          project_type: string
          suburb: string
          timeframe: string
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          approximate_budget: string
          cabinet_finish?: string | null
          color_preference?: string | null
          created_at?: string
          email: string
          file_count?: number
          id?: string
          kitchen_style: string
          name: string
          other_kitchen_style?: string | null
          phone: string
          project_type: string
          suburb: string
          timeframe: string
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          approximate_budget?: string
          cabinet_finish?: string | null
          color_preference?: string | null
          created_at?: string
          email?: string
          file_count?: number
          id?: string
          kitchen_style?: string
          name?: string
          other_kitchen_style?: string | null
          phone?: string
          project_type?: string
          suburb?: string
          timeframe?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_versions: {
        Row: {
          changes_requested: string | null
          created_at: string
          created_by: string
          id: string
          quote_id: string
          status: string
          version_number: number
        }
        Insert: {
          changes_requested?: string | null
          created_at?: string
          created_by: string
          id?: string
          quote_id: string
          status?: string
          version_number: number
        }
        Update: {
          changes_requested?: string | null
          created_at?: string
          created_by?: string
          id?: string
          quote_id?: string
          status?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_versions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          admin_created_by: string | null
          converted_order_id: string | null
          created_at: string
          customer_abn: string | null
          customer_company: string | null
          customer_email: string
          customer_internal_notes: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          notes: string | null
          quote_number: string
          sent_at: string | null
          session_id: string | null
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
          user_id: string | null
          valid_until: string | null
          version_number: number
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          admin_created_by?: string | null
          converted_order_id?: string | null
          created_at?: string
          customer_abn?: string | null
          customer_company?: string | null
          customer_email: string
          customer_internal_notes?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          quote_number?: string
          sent_at?: string | null
          session_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
          version_number?: number
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          admin_created_by?: string | null
          converted_order_id?: string | null
          created_at?: string
          customer_abn?: string | null
          customer_company?: string | null
          customer_email?: string
          customer_internal_notes?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          quote_number?: string
          sent_at?: string | null
          session_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
          version_number?: number
          viewed_at?: string | null
        }
        Relationships: []
      }
      rate_cards: {
        Row: {
          active: boolean
          base_price: number
          carrier: string
          created_at: string
          effective_from: string
          effective_to: string | null
          fuel_levy_pct: number
          id: string
          max_weight_kg: number | null
          minimum_charge: number
          per_cubic_m: number
          per_kg: number
          reattempt_fee: number
          residential_surcharge: number
          service_name: string
          tail_lift_fee: number
          two_man_fee: number
          updated_at: string
          zone_from: string
          zone_to: string
        }
        Insert: {
          active?: boolean
          base_price?: number
          carrier: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          fuel_levy_pct?: number
          id?: string
          max_weight_kg?: number | null
          minimum_charge?: number
          per_cubic_m?: number
          per_kg?: number
          reattempt_fee?: number
          residential_surcharge?: number
          service_name: string
          tail_lift_fee?: number
          two_man_fee?: number
          updated_at?: string
          zone_from: string
          zone_to: string
        }
        Update: {
          active?: boolean
          base_price?: number
          carrier?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          fuel_levy_pct?: number
          id?: string
          max_weight_kg?: number | null
          minimum_charge?: number
          per_cubic_m?: number
          per_kg?: number
          reattempt_fee?: number
          residential_surcharge?: number
          service_name?: string
          tail_lift_fee?: number
          two_man_fee?: number
          updated_at?: string
          zone_from?: string
          zone_to?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          attempts: number
          blocked_until: string | null
          created_at: string
          id: string
          identifier: string
          updated_at: string
          window_start: string
        }
        Insert: {
          action: string
          attempts?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          action?: string
          attempts?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      room_categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          display_name: string
          hero_image_url: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_name: string
          hero_image_url?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_name?: string
          hero_image_url?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      shipment_events: {
        Row: {
          carrier: string | null
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          location: string | null
          metadata: Json | null
          order_id: string
          tracking_number: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_type: string
          id?: string
          location?: string | null
          metadata?: Json | null
          order_id: string
          tracking_number?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          order_id?: string
          tracking_number?: string | null
        }
        Relationships: []
      }
      shipment_packages: {
        Row: {
          contents: Json | null
          created_at: string
          cubic_m: number | null
          fragile: boolean | null
          height_mm: number
          id: string
          kind: string
          length_mm: number
          reference: string | null
          shipment_id: string
          stackable: boolean | null
          volumetric_weight_kg: number | null
          weight_kg: number
          width_mm: number
        }
        Insert: {
          contents?: Json | null
          created_at?: string
          cubic_m?: number | null
          fragile?: boolean | null
          height_mm: number
          id?: string
          kind?: string
          length_mm: number
          reference?: string | null
          shipment_id: string
          stackable?: boolean | null
          volumetric_weight_kg?: number | null
          weight_kg: number
          width_mm: number
        }
        Update: {
          contents?: Json | null
          created_at?: string
          cubic_m?: number | null
          fragile?: boolean | null
          height_mm?: number
          id?: string
          kind?: string
          length_mm?: number
          reference?: string | null
          shipment_id?: string
          stackable?: boolean | null
          volumetric_weight_kg?: number | null
          weight_kg?: number
          width_mm?: number
        }
        Relationships: []
      }
      shipments: {
        Row: {
          carrier: string
          created_at: string
          created_by: string
          delivered_at: string | null
          dimensions: Json | null
          estimated_delivery: string | null
          id: string
          label_url: string | null
          order_id: string
          pallet_count: number
          service_type: string
          shipped_at: string | null
          shipping_address: Json
          shipping_cost: number | null
          status: string
          tracking_number: string
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          carrier: string
          created_at?: string
          created_by: string
          delivered_at?: string | null
          dimensions?: Json | null
          estimated_delivery?: string | null
          id?: string
          label_url?: string | null
          order_id: string
          pallet_count?: number
          service_type: string
          shipped_at?: string | null
          shipping_address: Json
          shipping_cost?: number | null
          status?: string
          tracking_number: string
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string
          created_at?: string
          created_by?: string
          delivered_at?: string | null
          dimensions?: Json | null
          estimated_delivery?: string | null
          id?: string
          label_url?: string | null
          order_id?: string
          pallet_count?: number
          service_type?: string
          shipped_at?: string | null
          shipping_address?: Json
          shipping_cost?: number | null
          status?: string
          tracking_number?: string
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          active: boolean
          category_id: string
          created_at: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id: string
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_categories: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          display_name: string
          hero_image_url: string | null
          id: string
          level: number
          name: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          display_name: string
          hero_image_url?: string | null
          id?: string
          level: number
          name: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          hero_image_url?: string | null
          id?: string
          level?: number
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unified_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "unified_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cabinet_preferences: {
        Row: {
          created_at: string
          id: string
          preferred_color_id: string | null
          preferred_door_style_id: string | null
          preferred_finish_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferred_color_id?: string | null
          preferred_door_style_id?: string | null
          preferred_finish_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferred_color_id?: string | null
          preferred_door_style_id?: string | null
          preferred_finish_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      variant_metafields: {
        Row: {
          created_at: string
          id: string
          key: string
          value_json: Json
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value_json: Json
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value_json?: Json
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_metafields_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      variants: {
        Row: {
          barcode: string | null
          created_at: string
          height_mm: number | null
          id: string
          is_active: boolean
          lead_time_days: number | null
          length_mm: number | null
          media_url: string | null
          option_value_ids: string[]
          product_id: string
          sku: string
          updated_at: string
          weight_kg: number | null
          width_mm: number | null
        }
        Insert: {
          barcode?: string | null
          created_at?: string
          height_mm?: number | null
          id?: string
          is_active?: boolean
          lead_time_days?: number | null
          length_mm?: number | null
          media_url?: string | null
          option_value_ids: string[]
          product_id: string
          sku: string
          updated_at?: string
          weight_kg?: number | null
          width_mm?: number | null
        }
        Update: {
          barcode?: string | null
          created_at?: string
          height_mm?: number | null
          id?: string
          is_active?: boolean
          lead_time_days?: number | null
          length_mm?: number | null
          media_url?: string | null
          option_value_ids?: string[]
          product_id?: string
          sku?: string
          updated_at?: string
          weight_kg?: number | null
          width_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_tokens: {
        Row: {
          channel: string
          consumed_at: string | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          token_hash: string
          user_id: string | null
        }
        Insert: {
          channel: string
          consumed_at?: string | null
          created_at?: string
          email?: string | null
          expires_at: string
          id?: string
          token_hash: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          consumed_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          token_hash?: string
          user_id?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          provider: string
          retry_count: number
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          provider: string
          retry_count?: number
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          provider?: string
          retry_count?: number
        }
        Relationships: []
      }
      xero_mappings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      xero_sync_status: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          last_sync_at: string | null
          retry_count: number | null
          sync_error: string | null
          sync_status: string | null
          updated_at: string
          xero_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          last_sync_at?: string | null
          retry_count?: number | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
          xero_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          last_sync_at?: string | null
          retry_count?: number | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
          xero_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attach_file_to_scope: {
        Args: { p_file_id: string; p_scope: string; p_scope_id: string }
        Returns: undefined
      }
      auto_archive_old_carts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      calculate_gst_amount: {
        Args: { amount_ex_gst: number; tax_rate?: number }
        Returns: number
      }
      calculate_quote_totals: {
        Args: { quote_id: string }
        Returns: {
          subtotal: number
          tax_amount: number
          total_amount: number
        }[]
      }
      calculate_shipping_quote: {
        Args: {
          p_from_zone: string
          p_packages: Json
          p_residential?: boolean
          p_tail_lift?: boolean
          p_to_zone: string
        }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_action: string
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      enhanced_cart_consolidation: {
        Args: { p_session_id?: string; p_user_id?: string }
        Returns: {
          action: string
          cart_count: number
          details: string
        }[]
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_milestone_invoices: {
        Args: { p_order_id: string }
        Returns: {
          amount: number
          invoice_id: string
          milestone_type: string
          percentage: number
        }[]
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_quote_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_primary_cart: {
        Args: { p_session_id?: string; p_user_id?: string }
        Returns: {
          cart_id: string
          cart_name: string
          item_count: number
          last_activity_at: string
          lifecycle_state: string
          total_amount: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_address_access: {
        Args: {
          p_access_reason?: string
          p_accessed_by: string
          p_action: string
          p_address_id: string
          p_customer_name?: string
        }
        Returns: undefined
      }
      log_admin_audit: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_record_id: string
          p_table_name: string
        }
        Returns: undefined
      }
      log_audit_event: {
        Args: {
          p_action?: string
          p_actor_id?: string
          p_after_data?: string
          p_before_data?: string
          p_ip_address?: unknown
          p_scope?: string
          p_scope_id?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      log_cart_activity: {
        Args: { p_action: string; p_cart_id: string; p_details?: Json }
        Returns: undefined
      }
      log_failed_auth_attempt: {
        Args: { p_email: string; p_ip_address?: unknown }
        Returns: undefined
      }
      log_payment_access: {
        Args: {
          p_action: string
          p_payment_amount?: number
          p_table_name: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_quote_request_access: {
        Args: {
          p_access_reason?: string
          p_accessed_by: string
          p_action: string
          p_customer_email?: string
          p_quote_request_id: string
        }
        Returns: undefined
      }
      set_primary_cart: {
        Args: { p_cart_id: string }
        Returns: undefined
      }
      test_quote_requests_security_final: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "customer"
        | "sales_rep"
        | "fulfilment"
        | "logistics"
        | "assembly"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "customer",
        "sales_rep",
        "fulfilment",
        "logistics",
        "assembly",
      ],
    },
  },
} as const
