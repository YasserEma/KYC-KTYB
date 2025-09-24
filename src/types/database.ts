export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string
          tenant_id: string | null
          actor_user_id: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          action: string
          entity_type: string | null
          entity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          actor_user_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          actor_user_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string
          type_key: string
          storage_path: string
          original_name: string
          ext: string
          bytes: number
          expires_at: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          entity_id: string
          type_key: string
          storage_path: string
          original_name: string
          ext: string
          bytes: number
          expires_at?: string | null
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          entity_id?: string
          type_key?: string
          storage_path?: string
          original_name?: string
          ext?: string
          bytes?: number
          expires_at?: string | null
          uploaded_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      entities: {
        Row: {
          id: string
          tenant_id: string
          type: Database["public"]["Enums"]["entity_type"]
          status: Database["public"]["Enums"]["entity_status"]
          name: string
          government_id: string | null
          nationality_codes: string[] | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          type: Database["public"]["Enums"]["entity_type"]
          status?: Database["public"]["Enums"]["entity_status"]
          name: string
          government_id?: string | null
          nationality_codes?: string[] | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          type?: Database["public"]["Enums"]["entity_type"]
          status?: Database["public"]["Enums"]["entity_status"]
          name?: string
          government_id?: string | null
          nationality_codes?: string[] | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      impersonations: {
        Row: {
          id: string
          super_admin_user_id: string
          tenant_id: string
          started_at: string
          ended_at: string | null
          reason: string
        }
        Insert: {
          id?: string
          super_admin_user_id: string
          tenant_id: string
          started_at?: string
          ended_at?: string | null
          reason: string
        }
        Update: {
          id?: string
          super_admin_user_id?: string
          tenant_id?: string
          started_at?: string
          ended_at?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "impersonations_super_admin_user_id_fkey"
            columns: ["super_admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impersonations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      individuals: {
        Row: {
          entity_id: string
          date_of_birth: string | null
          gender: string | null
          residence_countries: string[] | null
          occupation_key: string | null
          address: string | null
          id_docs: Json
        }
        Insert: {
          entity_id: string
          date_of_birth?: string | null
          gender?: string | null
          residence_countries?: string[] | null
          occupation_key?: string | null
          address?: string | null
          id_docs?: Json
        }
        Update: {
          entity_id?: string
          date_of_birth?: string | null
          gender?: string | null
          residence_countries?: string[] | null
          occupation_key?: string | null
          address?: string | null
          id_docs?: Json
        }
        Relationships: [
          {
            foreignKeyName: "individuals_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "entities"
            referencedColumns: ["id"]
          }
        ]
      }
      list_values: {
        Row: {
          id: string
          tenant_id: string | null
          list_id: string
          order: number
          key: string
          label: string
          status: string
          used_by_count: number
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          list_id: string
          order?: number
          key: string
          label: string
          status?: string
          used_by_count?: number
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          list_id?: string
          order?: number
          key?: string
          label?: string
          status?: string
          used_by_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_values_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_values_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      lists: {
        Row: {
          id: string
          tenant_id: string | null
          name: string
          key: string
          type: Database["public"]["Enums"]["list_type"]
          status: string
          description: string | null
          items_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          name: string
          key: string
          type: Database["public"]["Enums"]["list_type"]
          status?: string
          description?: string | null
          items_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          name?: string
          key?: string
          type?: Database["public"]["Enums"]["list_type"]
          status?: string
          description?: string | null
          items_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lists_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          entity_id: string
          country_of_incorporation: string | null
          date_of_incorporation: string | null
          legal_structure_key: string | null
          tax_id: string | null
          cr_number: string | null
          address1: string | null
          address2: string | null
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
        }
        Insert: {
          entity_id: string
          country_of_incorporation?: string | null
          date_of_incorporation?: string | null
          legal_structure_key?: string | null
          tax_id?: string | null
          cr_number?: string | null
          address1?: string | null
          address2?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
        }
        Update: {
          entity_id?: string
          country_of_incorporation?: string | null
          date_of_incorporation?: string | null
          legal_structure_key?: string | null
          tax_id?: string | null
          cr_number?: string | null
          address1?: string | null
          address2?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "entities"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      related_parties: {
        Row: {
          id: string
          tenant_id: string
          organization_entity_id: string
          kind_key: string
          name: string
          dob: string | null
          nationality_code: string | null
          id_type_key: string | null
          id_expiry: string | null
          address: string | null
          ownership_pct: number | null
          relationship_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          organization_entity_id: string
          kind_key: string
          name: string
          dob?: string | null
          nationality_code?: string | null
          id_type_key?: string | null
          id_expiry?: string | null
          address?: string | null
          ownership_pct?: number | null
          relationship_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          organization_entity_id?: string
          kind_key?: string
          name?: string
          dob?: string | null
          nationality_code?: string | null
          id_type_key?: string | null
          id_expiry?: string | null
          address?: string | null
          ownership_pct?: number | null
          relationship_type?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "related_parties_organization_entity_id_fkey"
            columns: ["organization_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_parties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      review_notes: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string
          reviewer_user_id: string
          note: string
          status: Database["public"]["Enums"]["review_status"]
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          entity_id: string
          reviewer_user_id: string
          note: string
          status?: Database["public"]["Enums"]["review_status"]
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          entity_id?: string
          reviewer_user_id?: string
          note?: string
          status?: Database["public"]["Enums"]["review_status"]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_notes_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_notes_reviewer_user_id_fkey"
            columns: ["reviewer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      risk_decisions: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string
          decided_by: string
          decided_role: Database["public"]["Enums"]["user_role"]
          decision: Database["public"]["Enums"]["decision_type"]
          rationale: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          entity_id: string
          decided_by: string
          decided_role: Database["public"]["Enums"]["user_role"]
          decision: Database["public"]["Enums"]["decision_type"]
          rationale: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          entity_id?: string
          decided_by?: string
          decided_role?: Database["public"]["Enums"]["user_role"]
          decision?: Database["public"]["Enums"]["decision_type"]
          rationale?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_decisions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_decisions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_decisions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      risk_rule_values: {
        Row: {
          id: string
          tenant_id: string
          rule_id: string
          key: string
          label: string
          value: number
          status: string
          order: number
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          rule_id: string
          key: string
          label: string
          value: number
          status?: string
          order?: number
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          rule_id?: string
          key?: string
          label?: string
          value?: number
          status?: string
          order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_rule_values_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "risk_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_rule_values_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      risk_rules: {
        Row: {
          id: string
          tenant_id: string
          name: string
          kind: Database["public"]["Enums"]["rule_kind"]
          weight: number
          status: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          kind: Database["public"]["Enums"]["rule_kind"]
          weight: number
          status?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          kind?: Database["public"]["Enums"]["rule_kind"]
          weight?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      risk_runs: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string
          score: number
          level: Database["public"]["Enums"]["risk_level"]
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          entity_id: string
          score: number
          level: Database["public"]["Enums"]["risk_level"]
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          entity_id?: string
          score?: number
          level?: Database["public"]["Enums"]["risk_level"]
          details?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_runs_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      screening_runs: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string
          result: Database["public"]["Enums"]["screening_result"]
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          entity_id: string
          result: Database["public"]["Enums"]["screening_result"]
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          entity_id?: string
          result?: Database["public"]["Enums"]["screening_result"]
          details?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "screening_runs_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screening_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      screening_settings: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          status: string
          json_value: Json
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          status?: string
          json_value?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          status?: string
          json_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "screening_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      super_admins: {
        Row: {
          user_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "super_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      tenant_domains: {
        Row: {
          id: string
          tenant_id: string
          domain: string
          is_primary: boolean
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          domain: string
          is_primary?: boolean
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          domain?: string
          is_primary?: boolean
          verified?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      tenants: {
        Row: {
          id: string
          slug: string
          name: string
          status: Database["public"]["Enums"]["tenant_status"]
          plan: string
          brand: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          status?: Database["public"]["Enums"]["tenant_status"]
          plan?: string
          brand?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          plan?: string
          brand?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_tenants: {
        Row: {
          user_id: string
          tenant_id: string
          role: Database["public"]["Enums"]["user_role"]
          added_at: string
        }
        Insert: {
          user_id: string
          tenant_id: string
          role: Database["public"]["Enums"]["user_role"]
          added_at?: string
        }
        Update: {
          user_id?: string
          tenant_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tenants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
      decision_type: "ACCEPT" | "REJECT" | "ON_HOLD"
      entity_status: "ACTIVE" | "INACTIVE"
      entity_type: "INDIVIDUAL" | "ORGANIZATION"
      list_type: "SYSTEM" | "CUSTOM"
      review_status: "REVIEWED" | "NEEDS_CHANGES"
      risk_level: "LOW" | "MEDIUM" | "HIGH"
      rule_kind: "KYC" | "KYB"
      screening_result: "CLEAR" | "HIT" | "REVIEW"
      tenant_status: "ACTIVE" | "SUSPENDED"
      user_role: "ADMIN" | "ANALYST" | "REVIEWER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}