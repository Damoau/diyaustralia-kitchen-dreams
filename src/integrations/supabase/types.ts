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
      cabinet_types: {
        Row: {
          active: boolean
          category: string
          created_at: string
          default_depth_mm: number
          default_height_mm: number
          default_width_mm: number
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          default_depth_mm: number
          default_height_mm: number
          default_width_mm: number
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          default_depth_mm?: number
          default_height_mm?: number
          default_width_mm?: number
          id?: string
          name?: string
        }
        Relationships: []
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
      colors: {
        Row: {
          active: boolean
          created_at: string
          finish_id: string
          hex_code: string | null
          id: string
          image_url: string | null
          name: string
          surcharge_rate_per_sqm: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          finish_id: string
          hex_code?: string | null
          id?: string
          image_url?: string | null
          name: string
          surcharge_rate_per_sqm?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          finish_id?: string
          hex_code?: string | null
          id?: string
          image_url?: string | null
          name?: string
          surcharge_rate_per_sqm?: number
        }
        Relationships: [
          {
            foreignKeyName: "colors_finish_id_fkey"
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
