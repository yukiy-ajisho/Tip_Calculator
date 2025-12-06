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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      formatted_cash_tip: {
        Row: {
          cash_tips: number
          created_at: string | null
          date: string
          id: string
          stores_id: string
          updated_at: string | null
        }
        Insert: {
          cash_tips: number
          created_at?: string | null
          date: string
          id?: string
          stores_id: string
          updated_at?: string | null
        }
        Update: {
          cash_tips?: number
          created_at?: string | null
          date?: string
          id?: string
          stores_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formatted_cash_tip_stores_id_fkey"
            columns: ["stores_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      formatted_tip_data: {
        Row: {
          created_at: string | null
          id: string
          is_adjusted: boolean
          order_date: string
          original_payment_time: string | null
          payment_time: string | null
          stores_id: string
          tips: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_adjusted?: boolean
          order_date: string
          original_payment_time?: string | null
          payment_time?: string | null
          stores_id: string
          tips: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_adjusted?: boolean
          order_date?: string
          original_payment_time?: string | null
          payment_time?: string | null
          stores_id?: string
          tips?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formatted_tip_data_stores_id_fkey"
            columns: ["stores_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      formatted_working_hours: {
        Row: {
          created_at: string | null
          date: string | null
          end: string | null
          id: string
          is_complete: boolean
          is_complete_on_import: boolean
          name: string
          role: string | null
          start: string | null
          stores_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          end?: string | null
          id?: string
          is_complete?: boolean
          is_complete_on_import?: boolean
          name: string
          role?: string | null
          start?: string | null
          stores_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          end?: string | null
          id?: string
          is_complete?: boolean
          is_complete_on_import?: boolean
          name?: string
          role?: string | null
          start?: string | null
          stores_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formatted_working_hours_stores_id_fkey"
            columns: ["stores_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      role_mappings: {
        Row: {
          actual_role_name: string | null
          created_at: string | null
          id: string
          role_name: string
          store_id: string
          trainee_percentage: number | null
          trainee_role_name: string | null
          updated_at: string | null
        }
        Insert: {
          actual_role_name?: string | null
          created_at?: string | null
          id?: string
          role_name: string
          store_id: string
          trainee_percentage?: number | null
          trainee_role_name?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_role_name?: string | null
          created_at?: string | null
          id?: string
          role_name?: string
          store_id?: string
          trainee_percentage?: number | null
          trainee_role_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_mappings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      role_percentage: {
        Row: {
          created_at: string | null
          distribution_grouping: number | null
          id: string
          percentage: number
          role_mapping_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          distribution_grouping?: number | null
          id?: string
          percentage: number
          role_mapping_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          distribution_grouping?: number | null
          id?: string
          percentage?: number
          role_mapping_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_percentage_role_mapping_id_fkey"
            columns: ["role_mapping_id"]
            isOneToOne: false
            referencedRelation: "role_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      store_invitations: {
        Row: {
          code: string
          created_at: string | null
          created_by: string
          expires_at: string
          id: string
          store_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by: string
          expires_at: string
          id?: string
          store_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string
          id?: string
          store_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_invitations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_invitations_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      store_users: {
        Row: {
          id: string
          role: string
          store_id: string
          user_id: string
        }
        Insert: {
          id?: string
          role?: string
          store_id: string
          user_id: string
        }
        Update: {
          id?: string
          role?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_users_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          abbreviation: string | null
          created_at: string | null
          id: string
          name: string
          off_hours_adjustment_after_hours: number | null
          off_hours_adjustment_before_hours: number | null
          updated_at: string | null
        }
        Insert: {
          abbreviation?: string | null
          created_at?: string | null
          id?: string
          name: string
          off_hours_adjustment_after_hours?: number | null
          off_hours_adjustment_before_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          abbreviation?: string | null
          created_at?: string | null
          id?: string
          name?: string
          off_hours_adjustment_after_hours?: number | null
          off_hours_adjustment_before_hours?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tip_calculation_results: {
        Row: {
          calculation_id: string
          cash_tips: number | null
          created_at: string | null
          date: string | null
          id: string
          name: string | null
          tips: number | null
        }
        Insert: {
          calculation_id: string
          cash_tips?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          name?: string | null
          tips?: number | null
        }
        Update: {
          calculation_id?: string
          cash_tips?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          name?: string | null
          tips?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tip_calculation_results_calculation_id_fkey"
            columns: ["calculation_id"]
            isOneToOne: false
            referencedRelation: "tip_calculations"
            referencedColumns: ["id"]
          },
        ]
      }
      tip_calculations: {
        Row: {
          created_at: string | null
          id: string
          period_end: string | null
          period_start: string | null
          status: string | null
          stores_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stores_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stores_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tip_calculations_stores_id_fkey"
            columns: ["stores_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_off_hours_tips: {
        Args: {
          p_period_end: string
          p_period_start: string
          p_store_id: string
        }
        Returns: undefined
      }
      calculate_tips:
        | {
            Args: {
              p_calculation_id: string
              p_period_end: string
              p_period_start: string
              p_store_id: string
            }
            Returns: undefined
          }
        | {
            Args: { p_calculation_id: string; p_store_id: string }
            Returns: undefined
          }
      cleanup_expired_invitations: { Args: never; Returns: undefined }
      revert_calculation: {
        Args: { p_calculation_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
