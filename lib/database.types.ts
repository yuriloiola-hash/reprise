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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clinicas: {
        Row: {
          complexo_id: string | null
          created_at: string | null
          google_place_id: string | null
          id: string
          nome: string
        }
        Insert: {
          complexo_id?: string | null
          created_at?: string | null
          google_place_id?: string | null
          id?: string
          nome: string
        }
        Update: {
          complexo_id?: string | null
          created_at?: string | null
          google_place_id?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinicas_complexo_id_fkey"
            columns: ["complexo_id"]
            isOneToOne: false
            referencedRelation: "locais_complexos"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          conteudo: string
          created_at: string | null
          eh_privado: boolean | null
          id: string
          medico_id: string
          rep_id: string
          sync_id: string | null
          synced_at: string | null
          tipo: string | null
          visita_id: string
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          eh_privado?: boolean | null
          id?: string
          medico_id: string
          rep_id?: string
          sync_id?: string | null
          synced_at?: string | null
          tipo?: string | null
          visita_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          eh_privado?: boolean | null
          id?: string
          medico_id?: string
          rep_id?: string
          sync_id?: string | null
          synced_at?: string | null
          tipo?: string | null
          visita_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "visitas"
            referencedColumns: ["id"]
          },
        ]
      }
      locais_complexos: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          tipo?: string | null
        }
        Relationships: []
      }
      medicos: {
        Row: {
          ativo: boolean
          categoria_cat: Database["public"]["Enums"]["categoria_cat"]
          clinica: string | null
          clinica_id: string | null
          complexo_id: string | null
          created_at: string | null
          crm: string | null
          email: string | null
          especialidade: string
          google_place_id: string | null
          id: string
          local_complexo: string | null
          marcas_chave: string[]
          nome: string
          observacoes: string | null
          rep_id: string | null
          sala_andar: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          categoria_cat?: Database["public"]["Enums"]["categoria_cat"]
          clinica?: string | null
          clinica_id?: string | null
          complexo_id?: string | null
          created_at?: string | null
          crm?: string | null
          email?: string | null
          especialidade: string
          google_place_id?: string | null
          id?: string
          local_complexo?: string | null
          marcas_chave?: string[]
          nome: string
          observacoes?: string | null
          rep_id?: string | null
          sala_andar?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          categoria_cat?: Database["public"]["Enums"]["categoria_cat"]
          clinica?: string | null
          clinica_id?: string | null
          complexo_id?: string | null
          created_at?: string | null
          crm?: string | null
          email?: string | null
          especialidade?: string
          google_place_id?: string | null
          id?: string
          local_complexo?: string | null
          marcas_chave?: string[]
          nome?: string
          observacoes?: string | null
          rep_id?: string | null
          sala_andar?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicos_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicos_complexo_id_fkey"
            columns: ["complexo_id"]
            isOneToOne: false
            referencedRelation: "locais_complexos"
            referencedColumns: ["id"]
          },
        ]
      }
      prescricoes: {
        Row: {
          concorrentes: Json | null
          created_at: string | null
          id: string
          marca_sirius: string
          medico_id: string | null
          quantidade_minha_marca: number
          quantidade_total: number
          rep_id: string | null
          trimestre: string
          updated_at: string | null
        }
        Insert: {
          concorrentes?: Json | null
          created_at?: string | null
          id?: string
          marca_sirius: string
          medico_id?: string | null
          quantidade_minha_marca?: number
          quantidade_total?: number
          rep_id?: string | null
          trimestre: string
          updated_at?: string | null
        }
        Update: {
          concorrentes?: Json | null
          created_at?: string | null
          id?: string
          marca_sirius?: string
          medico_id?: string | null
          quantidade_minha_marca?: number
          quantidade_total?: number
          rep_id?: string | null
          trimestre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescricoes_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
        ]
      }
      visitas: {
        Row: {
          created_at: string | null
          data_planejada: string
          hora_planejada: string | null
          id: string
          medico_id: string
          objetivo: string | null
          pos_visita_at: string | null
          pos_visita_feita: boolean
          pre_visita_at: string | null
          pre_visita_feita: boolean
          produtos_abordados: string[] | null
          proxima_acao: string | null
          rep_id: string | null
          resultado: string | null
          status: Database["public"]["Enums"]["status_visita"]
          nota_propaganda: number | null
          perfil_risco: number | null
          perfil_paciencia: number | null
          perfil_extroversao: number | null
          perfil_normas: number | null
          sync_id: string | null
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_planejada: string
          hora_planejada?: string | null
          id?: string
          medico_id: string
          objetivo?: string | null
          pos_visita_at?: string | null
          pos_visita_feita?: boolean
          pre_visita_at?: string | null
          pre_visita_feita?: boolean
          produtos_abordados?: string[] | null
          proxima_acao?: string | null
          rep_id?: string | null
          resultado?: string | null
          status?: Database["public"]["Enums"]["status_visita"]
          nota_propaganda?: number | null
          perfil_risco?: number | null
          perfil_paciencia?: number | null
          perfil_extroversao?: number | null
          perfil_normas?: number | null
          sync_id?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_planejada?: string
          hora_planejada?: string | null
          id?: string
          medico_id?: string
          objetivo?: string | null
          pos_visita_at?: string | null
          pos_visita_feita?: boolean
          pre_visita_at?: string | null
          pre_visita_feita?: boolean
          produtos_abordados?: string[] | null
          proxima_acao?: string | null
          rep_id?: string | null
          resultado?: string | null
          status?: Database["public"]["Enums"]["status_visita"]
          nota_propaganda?: number | null
          perfil_risco?: number | null
          perfil_paciencia?: number | null
          perfil_extroversao?: number | null
          perfil_normas?: number | null
          sync_id?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitas_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_painel: {
        Row: {
          id: string
          rep_id: string | null
          tipo: "adicao" | "exclusao"
          nome_medico: string
          especialidade: string
          cidade: string
          motivo: string
          status_gd: "aprovado" | "negado" | "pendente"
          obs_gd: string | null
          mes: number
          ano: number
          data_movimentacao: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rep_id?: string | null
          tipo: "adicao" | "exclusao"
          nome_medico: string
          especialidade: string
          cidade: string
          motivo: string
          status_gd?: "aprovado" | "negado" | "pendente"
          obs_gd?: string | null
          mes: number
          ano: number
          data_movimentacao: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rep_id?: string | null
          tipo?: "adicao" | "exclusao"
          nome_medico?: string
          especialidade?: string
          cidade?: string
          motivo?: string
          status_gd?: "aprovado" | "negado" | "pendente"
          obs_gd?: string | null
          mes?: number
          ano?: number
          data_movimentacao?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cupons: {
        Row: {
          id: string
          medico_id: string | null
          rep_id: string | null
          codigo: string
          produto: string
          status_entrega: Database["public"]["Enums"]["status_cupom"]
          tipo_envio: Database["public"]["Enums"]["tipo_envio_cupom"]
          data_prometida: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          medico_id?: string | null
          rep_id?: string | null
          codigo: string
          produto: string
          status_entrega?: Database["public"]["Enums"]["status_cupom"]
          tipo_envio?: Database["public"]["Enums"]["tipo_envio_cupom"]
          data_prometida?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          medico_id?: string | null
          rep_id?: string | null
          codigo?: string
          produto?: string
          status_entrega?: Database["public"]["Enums"]["status_cupom"]
          tipo_envio?: Database["public"]["Enums"]["tipo_envio_cupom"]
          data_prometida?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cupons_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categoria_cat: "CAT1" | "CAT2" | "CAT3" | "CAT4" | "MARCAS_CHAVE"
      categoria_medico: "CAT1" | "CAT2" | "CAT3" | "CAT4"
      status_visita: "PLANEJADO" | "PRE_FEITA" | "POS_FEITA" | "ATRASADO"
      status_cupom: "prometido" | "entregue"
      tipo_envio_cupom: "presencial" | "virtual"
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
      categoria_cat: ["CAT1", "CAT2", "CAT3", "CAT4", "MARCAS_CHAVE"],
      categoria_medico: ["CAT1", "CAT2", "CAT3", "CAT4"],
      status_visita: ["PLANEJADO", "PRE_FEITA", "POS_FEITA", "ATRASADO"],
    },
  },
} as const
