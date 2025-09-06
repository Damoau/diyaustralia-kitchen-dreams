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
          bottoms_qty: number | null
          category: string
          created_at: string
          default_depth_mm: number
          default_height_mm: number
          default_width_mm: number
          door_count: number
          door_qty: number | null
          drawer_count: number
          id: string
          name: string
          range_id: string | null
          sides_qty: number | null
        }
        Insert: {
          active?: boolean
          backs_qty?: number | null
          bottoms_qty?: number | null
          category: string
          created_at?: string
          default_depth_mm: number
          default_height_mm: number
          default_width_mm: number
          door_count?: number
          door_qty?: number | null
          drawer_count?: number
          id?: string
          name: string
          range_id?: string | null
          sides_qty?: number | null
        }
        Update: {
          active?: boolean
          backs_qty?: number | null
          bottoms_qty?: number | null
          category?: string
          created_at?: string
          default_depth_mm?: number
          default_height_mm?: number
          default_width_mm?: number
          door_count?: number
          door_qty?: number | null
          drawer_count?: number
          id?: string
          name?: string
          range_id?: string | null
          sides_qty?: number | null
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
          cabinet_type_id: string
          cart_id: string
          color_id: string | null
          configuration: Json | null
          created_at: string
          depth_mm: number
          door_style_id: string | null
          finish_id: string | null
          height_mm: number
          id: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
          width_mm: number
        }
        Insert: {
          cabinet_type_id: string
          cart_id: string
          color_id?: string | null
          configuration?: Json | null
          created_at?: string
          depth_mm: number
          door_style_id?: string | null
          finish_id?: string | null
          height_mm: number
          id?: string
          quantity?: number
          total_price: number
          unit_price: number
          updated_at?: string
          width_mm: number
        }
        Update: {
          cabinet_type_id?: string
          cart_id?: string
          color_id?: string | null
          configuration?: Json | null
          created_at?: string
          depth_mm?: number
          door_style_id?: string | null
          finish_id?: string | null
          height_mm?: number
          id?: string
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
          created_at: string
          id: string
          name: string | null
          session_id: string | null
          total_amount: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          session_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          session_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
          name: string
        }
        Insert: {
          active?: boolean
          base_rate_per_sqm?: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          base_rate_per_sqm?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
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
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
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
      app_role: ["admin"],
    },
  },
} as const
