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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
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
          part_name: string
          quantity: number
          width_formula: string | null
        }
        Insert: {
          cabinet_type_id: string
          created_at?: string
          height_formula?: string | null
          id?: string
          is_door?: boolean
          is_hardware?: boolean
          part_name: string
          quantity?: number
          width_formula?: string | null
        }
        Update: {
          cabinet_type_id?: string
          created_at?: string
          height_formula?: string | null
          id?: string
          is_door?: boolean
          is_hardware?: boolean
          part_name?: string
          quantity?: number
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
      cabinet_type_finishes: {
        Row: {
          active: boolean
          cabinet_type_id: string
          color_id: string | null
          created_at: string
          depth_mm: number | null
          door_style_finish_id: string | null
          door_style_id: string | null
          id: string
          image_url: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          cabinet_type_id: string
          color_id?: string | null
          created_at?: string
          depth_mm?: number | null
          door_style_finish_id?: string | null
          door_style_id?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          cabinet_type_id?: string
          color_id?: string | null
          created_at?: string
          depth_mm?: number | null
          door_style_finish_id?: string | null
          door_style_id?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cabinet_type_finishes_cabinet_type_id_fkey"
            columns: ["cabinet_type_id"]
            isOneToOne: false
            referencedRelation: "cabinet_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabinet_type_finishes_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabinet_type_finishes_door_style_finish_id_fkey"
            columns: ["door_style_finish_id"]
            isOneToOne: false
            referencedRelation: "door_style_finishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabinet_type_finishes_door_style_id_fkey"
            columns: ["door_style_id"]
            isOneToOne: false
            referencedRelation: "door_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      cabinet_type_price_ranges: {
        Row: {
          active: boolean
          cabinet_type_id: string
          created_at: string
          id: string
          label: string
          max_width_mm: number
          min_width_mm: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          cabinet_type_id: string
          created_at?: string
          id?: string
          label: string
          max_width_mm: number
          min_width_mm: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          cabinet_type_id?: string
          created_at?: string
          id?: string
          label?: string
          max_width_mm?: number
          min_width_mm?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cabinet_type_price_ranges_cabinet_type_id_fkey"
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
          backs_qty: number | null
          base_price: number | null
          bottoms_qty: number | null
          cabinet_style: string | null
          category: string
          created_at: string
          default_depth_mm: number
          default_height_mm: number
          default_width_mm: number
          display_order: number | null
          door_count: number
          door_qty: number | null
          drawer_count: number
          id: string
          is_featured: boolean | null
          left_side_depth_mm: number | null
          left_side_width_mm: number | null
          long_description: string | null
          max_depth_mm: number | null
          max_height_mm: number | null
          max_stock_level: number | null
          max_width_mm: number | null
          min_depth_mm: number | null
          min_height_mm: number | null
          min_stock_level: number | null
          min_width_mm: number | null
          name: string
          product_image_url: string | null
          qty_left_back: number | null
          qty_left_side: number | null
          qty_right_back: number | null
          qty_right_side: number | null
          range_id: string | null
          right_side_depth_mm: number | null
          right_side_width_mm: number | null
          short_description: string | null
          sides_qty: number | null
          stock_quantity: number | null
          subcategory: string | null
          subcategory_display_order: number | null
        }
        Insert: {
          active?: boolean
          backs_qty?: number | null
          base_price?: number | null
          bottoms_qty?: number | null
          cabinet_style?: string | null
          category: string
          created_at?: string
          default_depth_mm: number
          default_height_mm: number
          default_width_mm: number
          display_order?: number | null
          door_count?: number
          door_qty?: number | null
          drawer_count?: number
          id?: string
          is_featured?: boolean | null
          left_side_depth_mm?: number | null
          left_side_width_mm?: number | null
          long_description?: string | null
          max_depth_mm?: number | null
          max_height_mm?: number | null
          max_stock_level?: number | null
          max_width_mm?: number | null
          min_depth_mm?: number | null
          min_height_mm?: number | null
          min_stock_level?: number | null
          min_width_mm?: number | null
          name: string
          product_image_url?: string | null
          qty_left_back?: number | null
          qty_left_side?: number | null
          qty_right_back?: number | null
          qty_right_side?: number | null
          range_id?: string | null
          right_side_depth_mm?: number | null
          right_side_width_mm?: number | null
          short_description?: string | null
          sides_qty?: number | null
          stock_quantity?: number | null
          subcategory?: string | null
          subcategory_display_order?: number | null
        }
        Update: {
          active?: boolean
          backs_qty?: number | null
          base_price?: number | null
          bottoms_qty?: number | null
          cabinet_style?: string | null
          category?: string
          created_at?: string
          default_depth_mm?: number
          default_height_mm?: number
          default_width_mm?: number
          display_order?: number | null
          door_count?: number
          door_qty?: number | null
          drawer_count?: number
          id?: string
          is_featured?: boolean | null
          left_side_depth_mm?: number | null
          left_side_width_mm?: number | null
          long_description?: string | null
          max_depth_mm?: number | null
          max_height_mm?: number | null
          max_stock_level?: number | null
          max_width_mm?: number | null
          min_depth_mm?: number | null
          min_height_mm?: number | null
          min_stock_level?: number | null
          min_width_mm?: number | null
          name?: string
          product_image_url?: string | null
          qty_left_back?: number | null
          qty_left_side?: number | null
          qty_right_back?: number | null
          qty_right_side?: number | null
          range_id?: string | null
          right_side_depth_mm?: number | null
          right_side_width_mm?: number | null
          short_description?: string | null
          sides_qty?: number | null
          stock_quantity?: number | null
          subcategory?: string | null
          subcategory_display_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cabinet_types_range_id_fkey"
            columns: ["range_id"]
            isOneToOne: false
            referencedRelation: "product_ranges"
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
          converted_order_id: string | null
          converted_quote_id: string | null
          created_at: string
          id: string
          label: string | null
          merged_from_cart_id: string | null
          merged_into_cart_id: string | null
          name: string | null
          notes: string | null
          owner_user_id: string | null
          session_id: string | null
          source: string | null
          status: string
          tags: string[] | null
          total_amount: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          abandon_reason?: string | null
          abandoned_at?: string | null
          converted_order_id?: string | null
          converted_quote_id?: string | null
          created_at?: string
          id?: string
          label?: string | null
          merged_from_cart_id?: string | null
          merged_into_cart_id?: string | null
          name?: string | null
          notes?: string | null
          owner_user_id?: string | null
          session_id?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          abandon_reason?: string | null
          abandoned_at?: string | null
          converted_order_id?: string | null
          converted_quote_id?: string | null
          created_at?: string
          id?: string
          label?: string | null
          merged_from_cart_id?: string | null
          merged_into_cart_id?: string | null
          name?: string | null
          notes?: string | null
          owner_user_id?: string | null
          session_id?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
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
        ]
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
      color_finishes: {
        Row: {
          active: boolean
          color_id: string
          created_at: string
          door_style_finish_type_id: string
          id: string
          rate_per_sqm: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          color_id: string
          created_at?: string
          door_style_finish_type_id: string
          id?: string
          rate_per_sqm?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          color_id?: string
          created_at?: string
          door_style_finish_type_id?: string
          id?: string
          rate_per_sqm?: number
          updated_at?: string
        }
        Relationships: []
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
      door_style_finish_types: {
        Row: {
          active: boolean
          created_at: string
          door_style_id: string
          finish_name: string
          id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          door_style_id: string
          finish_name: string
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          door_style_id?: string
          finish_name?: string
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      door_style_finishes: {
        Row: {
          active: boolean
          created_at: string
          door_style_id: string
          id: string
          name: string
          rate_per_sqm: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          door_style_id: string
          id?: string
          name: string
          rate_per_sqm?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          door_style_id?: string
          id?: string
          name?: string
          rate_per_sqm?: number
          sort_order?: number
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
        ]
      }
      door_styles: {
        Row: {
          active: boolean
          base_rate_per_sqm: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          active?: boolean
          base_rate_per_sqm?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          active?: boolean
          base_rate_per_sqm?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
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
          brand_id: string
          created_at: string
          finish_type: string
          id: string
          name: string
          rate_per_sqm: number
        }
        Insert: {
          active?: boolean
          brand_id: string
          created_at?: string
          finish_type: string
          id?: string
          name: string
          rate_per_sqm?: number
        }
        Update: {
          active?: boolean
          brand_id?: string
          created_at?: string
          finish_type?: string
          id?: string
          name?: string
          rate_per_sqm?: number
        }
        Relationships: [
          {
            foreignKeyName: "finishes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
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
      invoices: {
        Row: {
          created_at: string
          due_date: string | null
          gst_amount: number
          id: string
          invoice_date: string
          invoice_number: string
          order_id: string
          payment_schedule_id: string | null
          pdf_url: string | null
          status: string
          subtotal: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          gst_amount?: number
          id?: string
          invoice_date?: string
          invoice_number: string
          order_id: string
          payment_schedule_id?: string | null
          pdf_url?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          gst_amount?: number
          id?: string
          invoice_date?: string
          invoice_number?: string
          order_id?: string
          payment_schedule_id?: string | null
          pdf_url?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          file_ids: string[] | null
          id: string
          message_text: string
          message_type: string
          scope: string
          scope_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_ids?: string[] | null
          id?: string
          message_text: string
          message_type?: string
          scope: string
          scope_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_ids?: string[] | null
          id?: string
          message_text?: string
          message_type?: string
          scope?: string
          scope_id?: string
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
          finish_id: string | null
          height_mm: number
          id: string
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
          finish_id?: string | null
          height_mm: number
          id?: string
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
          finish_id?: string | null
          height_mm?: number
          id?: string
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
          converted_order_id: string | null
          created_at: string
          id: string
          notes: string | null
          quote_number: string
          session_id: string | null
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
          user_id: string | null
          valid_until: string | null
          version_number: number
        }
        Insert: {
          accepted_at?: string | null
          converted_order_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          quote_number?: string
          session_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
          version_number?: number
        }
        Update: {
          accepted_at?: string | null
          converted_order_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          quote_number?: string
          session_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
          version_number?: number
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attach_file_to_scope: {
        Args: { p_file_id: string; p_scope: string; p_scope_id: string }
        Returns: undefined
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
    }
    Enums: {
      app_role: "admin" | "customer" | "sales_rep" | "fulfilment"
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
      app_role: ["admin", "customer", "sales_rep", "fulfilment"],
    },
  },
} as const
