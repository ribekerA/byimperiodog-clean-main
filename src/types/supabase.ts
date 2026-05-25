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
  auth: {
    Tables: {
      audit_log_entries: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          ip_address: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          id: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Relationships: []
      }
      flow_state: {
        Row: {
          auth_code: string
          auth_code_issued_at: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at: string | null
          id: string
          provider_access_token: string | null
          provider_refresh_token: string | null
          provider_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_code: string
          auth_code_issued_at?: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_code?: string
          auth_code_issued_at?: string | null
          authentication_method?: string
          code_challenge?: string
          code_challenge_method?: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id?: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      identities: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          identity_data: Json
          last_sign_in_at: string | null
          provider: string
          provider_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data: Json
          last_sign_in_at?: string | null
          provider: string
          provider_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data?: Json
          last_sign_in_at?: string | null
          provider?: string
          provider_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          created_at: string | null
          id: string
          raw_base_config: string | null
          updated_at: string | null
          uuid: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Relationships: []
      }
      mfa_amr_claims: {
        Row: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Update: {
          authentication_method?: string
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_amr_claims_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_challenges: {
        Row: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code: string | null
          verified_at: string | null
          web_authn_session_data: Json | null
        }
        Insert: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Update: {
          created_at?: string
          factor_id?: string
          id?: string
          ip_address?: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_auth_factor_id_fkey"
            columns: ["factor_id"]
            isOneToOne: false
            referencedRelation: "mfa_factors"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_factors: {
        Row: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name: string | null
          id: string
          last_challenged_at: string | null
          last_webauthn_challenge_data: Json | null
          phone: string | null
          secret: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid: string | null
          web_authn_credential: Json | null
        }
        Insert: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id: string
          last_challenged_at?: string | null
          last_webauthn_challenge_data?: Json | null
          phone?: string | null
          secret?: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Update: {
          created_at?: string
          factor_type?: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id?: string
          last_challenged_at?: string | null
          last_webauthn_challenge_data?: Json | null
          phone?: string | null
          secret?: string | null
          status?: Database["auth"]["Enums"]["factor_status"]
          updated_at?: string
          user_id?: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_factors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_authorizations: {
        Row: {
          approved_at: string | null
          authorization_code: string | null
          authorization_id: string
          client_id: string
          code_challenge: string | null
          code_challenge_method:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at: string
          expires_at: string
          id: string
          nonce: string | null
          redirect_uri: string
          resource: string | null
          response_type: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state: string | null
          status: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id: string
          client_id: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id: string
          nonce?: string | null
          redirect_uri: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id?: string
          client_id?: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string | null
          redirect_uri?: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope?: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_clients: {
        Row: {
          client_name: string | null
          client_secret_hash: string | null
          client_type: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri: string | null
          created_at: string
          deleted_at: string | null
          grant_types: string
          id: string
          logo_uri: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types: string
          id: string
          logo_uri?: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types?: string
          id?: string
          logo_uri?: string | null
          redirect_uris?: string
          registration_type?: Database["auth"]["Enums"]["oauth_registration_type"]
          updated_at?: string
        }
        Relationships: []
      }
      oauth_consents: {
        Row: {
          client_id: string
          granted_at: string
          id: string
          revoked_at: string | null
          scopes: string
          user_id: string
        }
        Insert: {
          client_id: string
          granted_at?: string
          id: string
          revoked_at?: string | null
          scopes: string
          user_id: string
        }
        Update: {
          client_id?: string
          granted_at?: string
          id?: string
          revoked_at?: string | null
          scopes?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_consents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      one_time_tokens: {
        Row: {
          created_at: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relates_to?: string
          token_hash?: string
          token_type?: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string | null
          id: number
          instance_id: string | null
          parent: string | null
          revoked: boolean | null
          session_id: string | null
          token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_providers: {
        Row: {
          attribute_mapping: Json | null
          created_at: string | null
          entity_id: string
          id: string
          metadata_url: string | null
          metadata_xml: string
          name_id_format: string | null
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id: string
          id: string
          metadata_url?: string | null
          metadata_xml: string
          name_id_format?: string | null
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id?: string
          id?: string
          metadata_url?: string | null
          metadata_xml?: string
          name_id_format?: string | null
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_providers_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_relay_states: {
        Row: {
          created_at: string | null
          flow_state_id: string | null
          for_email: string | null
          id: string
          redirect_to: string | null
          request_id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id: string
          redirect_to?: string | null
          request_id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id?: string
          redirect_to?: string | null
          request_id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_relay_states_flow_state_id_fkey"
            columns: ["flow_state_id"]
            isOneToOne: false
            referencedRelation: "flow_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saml_relay_states_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          version: string
        }
        Insert: {
          version: string
        }
        Update: {
          version?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          aal: Database["auth"]["Enums"]["aal_level"] | null
          created_at: string | null
          factor_id: string | null
          id: string
          ip: unknown
          not_after: string | null
          oauth_client_id: string | null
          refresh_token_counter: number | null
          refresh_token_hmac_key: string | null
          refreshed_at: string | null
          scopes: string | null
          tag: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id: string
          ip?: unknown
          not_after?: string | null
          oauth_client_id?: string | null
          refresh_token_counter?: number | null
          refresh_token_hmac_key?: string | null
          refreshed_at?: string | null
          scopes?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id?: string
          ip?: unknown
          not_after?: string | null
          oauth_client_id?: string | null
          refresh_token_counter?: number | null
          refresh_token_hmac_key?: string | null
          refreshed_at?: string | null
          scopes?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_oauth_client_id_fkey"
            columns: ["oauth_client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_domains_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_providers: {
        Row: {
          created_at: string | null
          disabled: boolean | null
          id: string
          resource_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          disabled?: boolean | null
          id: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          disabled?: boolean | null
          id?: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          aud: string | null
          banned_until: string | null
          confirmation_sent_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_change: string | null
          email_change_confirm_status: number | null
          email_change_sent_at: string | null
          email_change_token_current: string | null
          email_change_token_new: string | null
          email_confirmed_at: string | null
          encrypted_password: string | null
          id: string
          instance_id: string | null
          invited_at: string | null
          is_anonymous: boolean
          is_sso_user: boolean
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          phone: string | null
          phone_change: string | null
          phone_change_sent_at: string | null
          phone_change_token: string | null
          phone_confirmed_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          reauthentication_sent_at: string | null
          reauthentication_token: string | null
          recovery_sent_at: string | null
          recovery_token: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
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
      email: { Args: never; Returns: string }
      jwt: { Args: never; Returns: Json }
      role: { Args: never; Returns: string }
      uid: { Args: never; Returns: string }
    }
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3"
      code_challenge_method: "s256" | "plain"
      factor_status: "unverified" | "verified"
      factor_type: "totp" | "webauthn" | "phone"
      oauth_authorization_status: "pending" | "approved" | "denied" | "expired"
      oauth_client_type: "public" | "confidential"
      oauth_registration_type: "dynamic" | "manual"
      oauth_response_type: "code"
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_generation_sessions: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          phase: string
          post_id: string | null
          progress: number
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          phase?: string
          post_id?: string | null
          progress?: number
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          phase?: string
          post_id?: string | null
          progress?: number
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_sessions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tasks: {
        Row: {
          created_at: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          payload: Json | null
          phase: string | null
          post_id: string | null
          progress: number
          result: Json | null
          started_at: string | null
          status: string
          topic: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          payload?: Json | null
          phase?: string | null
          post_id?: string | null
          progress?: number
          result?: Json | null
          started_at?: string | null
          status?: string
          topic?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          payload?: Json | null
          phase?: string | null
          post_id?: string | null
          progress?: number
          result?: Json | null
          started_at?: string | null
          status?: string
          topic?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tasks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          id: string
          ip: unknown
          label: string | null
          meta: Json | null
          metric_id: string | null
          name: string
          path: string | null
          ts: string
          ua: string | null
          value: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip?: unknown
          label?: string | null
          meta?: Json | null
          metric_id?: string | null
          name: string
          path?: string | null
          ts?: string
          ua?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          ip?: unknown
          label?: string | null
          meta?: Json | null
          metric_id?: string | null
          name?: string
          path?: string | null
          ts?: string
          ua?: string | null
          value?: number | null
        }
        Relationships: []
      }
      blog_authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          name: string
          slug: string | null
          socials: Json | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          slug?: string | null
          socials?: Json | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string | null
          socials?: Json | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          ai_score: number | null
          akismet_score: number | null
          approved: boolean | null
          author_email: string | null
          author_name: string | null
          body: string
          created_at: string
          id: string
          ip_hash: string | null
          parent_id: string | null
          post_id: string | null
          user_agent: string | null
        }
        Insert: {
          ai_score?: number | null
          akismet_score?: number | null
          approved?: boolean | null
          author_email?: string | null
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          parent_id?: string | null
          post_id?: string | null
          user_agent?: string | null
        }
        Update: {
          ai_score?: number | null
          akismet_score?: number | null
          approved?: boolean | null
          author_email?: string | null
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          parent_id?: string | null
          post_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_coverage_history: {
        Row: {
          covered: number
          id: number
          missing: Json | null
          percent: number
          snapshot_at: string
          total: number
        }
        Insert: {
          covered: number
          id?: number
          missing?: Json | null
          percent: number
          snapshot_at?: string
          total: number
        }
        Update: {
          covered?: number
          id?: number
          missing?: Json | null
          percent?: number
          snapshot_at?: string
          total?: number
        }
        Relationships: []
      }
      blog_post_categories: {
        Row: {
          category_id: string
          post_id: string
        }
        Insert: {
          category_id: string
          post_id: string
        }
        Update: {
          category_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_embeddings: {
        Row: {
          embedding: string | null
          post_id: string
          source: string
          updated_at: string
        }
        Insert: {
          embedding?: string | null
          post_id: string
          source?: string
          updated_at?: string
        }
        Update: {
          embedding?: string | null
          post_id?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_embeddings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_localizations: {
        Row: {
          content_mdx: string | null
          created_at: string
          id: string
          lang: string
          og_image_url: string | null
          post_id: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content_mdx?: string | null
          created_at?: string
          id?: string
          lang: string
          og_image_url?: string | null
          post_id: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content_mdx?: string | null
          created_at?: string
          id?: string
          lang?: string
          og_image_url?: string | null
          post_id?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_localizations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_revisions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          post_id: string | null
          reason: string | null
          snapshot: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          post_id?: string | null
          reason?: string | null
          snapshot: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          post_id?: string | null
          reason?: string | null
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_revisions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_schedule_events: {
        Row: {
          action: string
          created_at: string
          executed_at: string | null
          id: string
          payload: Json | null
          post_id: string | null
          run_at: string
        }
        Insert: {
          action: string
          created_at?: string
          executed_at?: string | null
          id?: string
          payload?: Json | null
          post_id?: string | null
          run_at: string
        }
        Update: {
          action?: string
          created_at?: string
          executed_at?: string | null
          id?: string
          payload?: Json | null
          post_id?: string | null
          run_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_schedule_events_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          post_id: string
          reason: string | null
          snapshot: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          post_id: string
          reason?: string | null
          snapshot: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          post_id?: string
          reason?: string | null
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_versions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      autosales_logs: {
        Row: {
          content: string
          created_at: string
          cta_link: string | null
          error: string | null
          id: string
          lead_id: string
          message_type: string
          metadata: Json | null
          objections: string[] | null
          puppy_id: string | null
          sent_at: string | null
          sequence_id: string
          status: string
        }
        Insert: {
          content: string
          created_at?: string
          cta_link?: string | null
          error?: string | null
          id?: string
          lead_id: string
          message_type: string
          metadata?: Json | null
          objections?: string[] | null
          puppy_id?: string | null
          sent_at?: string | null
          sequence_id: string
          status?: string
        }
        Update: {
          content?: string
          created_at?: string
          cta_link?: string | null
          error?: string | null
          id?: string
          lead_id?: string
          message_type?: string
          metadata?: Json | null
          objections?: string[] | null
          puppy_id?: string | null
          sent_at?: string | null
          sequence_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "autosales_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autosales_logs_puppy_id_fkey"
            columns: ["puppy_id"]
            isOneToOne: false
            referencedRelation: "puppies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autosales_logs_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "autosales_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      autosales_sequences: {
        Row: {
          bypass_human: boolean
          created_at: string
          fallback_reason: string | null
          fallback_required: boolean
          id: string
          last_message_sent_at: string | null
          last_message_type: string | null
          lead_id: string
          metrics: Json
          next_run_at: string | null
          next_step: string | null
          puppy_id: string | null
          status: string
          step_index: number
          strategy: Json
          tone: string | null
          total_steps: number
          updated_at: string
          urgency: string | null
        }
        Insert: {
          bypass_human?: boolean
          created_at?: string
          fallback_reason?: string | null
          fallback_required?: boolean
          id?: string
          last_message_sent_at?: string | null
          last_message_type?: string | null
          lead_id: string
          metrics?: Json
          next_run_at?: string | null
          next_step?: string | null
          puppy_id?: string | null
          status?: string
          step_index?: number
          strategy?: Json
          tone?: string | null
          total_steps?: number
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          bypass_human?: boolean
          created_at?: string
          fallback_reason?: string | null
          fallback_required?: boolean
          id?: string
          last_message_sent_at?: string | null
          last_message_type?: string | null
          lead_id?: string
          metrics?: Json
          next_run_at?: string | null
          next_step?: string | null
          puppy_id?: string | null
          status?: string
          step_index?: number
          strategy?: Json
          tone?: string | null
          total_steps?: number
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autosales_sequences_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autosales_sequences_puppy_id_fkey"
            columns: ["puppy_id"]
            isOneToOne: false
            referencedRelation: "puppies"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          canonical_url: string | null
          category: string | null
          content_blocks_json: Json | null
          content_mdx: string | null
          cover_alt: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          gallery_json: Json | null
          id: string
          lang: string | null
          og_image_url: string | null
          published_at: string | null
          reading_time: number | null
          scheduled_at: string | null
          seo_description: string | null
          seo_score: number | null
          seo_title: string | null
          slug: string
          status: string
          subtitle: string | null
          tags: string[] | null
          title: string
          tsv: unknown
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author_id?: string | null
          canonical_url?: string | null
          category?: string | null
          content_blocks_json?: Json | null
          content_mdx?: string | null
          cover_alt?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          gallery_json?: Json | null
          id?: string
          lang?: string | null
          og_image_url?: string | null
          published_at?: string | null
          reading_time?: number | null
          scheduled_at?: string | null
          seo_description?: string | null
          seo_score?: number | null
          seo_title?: string | null
          slug: string
          status?: string
          subtitle?: string | null
          tags?: string[] | null
          title: string
          tsv?: unknown
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author_id?: string | null
          canonical_url?: string | null
          category?: string | null
          content_blocks_json?: Json | null
          content_mdx?: string | null
          cover_alt?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          gallery_json?: Json | null
          id?: string
          lang?: string | null
          og_image_url?: string | null
          published_at?: string | null
          reading_time?: number | null
          scheduled_at?: string | null
          seo_description?: string | null
          seo_score?: number | null
          seo_title?: string | null
          slug?: string
          status?: string
          subtitle?: string | null
          tags?: string[] | null
          title?: string
          tsv?: unknown
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "blog_authors"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          code: string
          created_at: string
          customer_id: string | null
          hemograma_path: string | null
          id: string
          laudo_path: string | null
          lead_id: string | null
          payload: Json | null
          puppy_id: string
          signed_at: string | null
          status: Database["public"]["Enums"]["contract_status"]
          total_price_cents: number | null
          updated_at: string
        }
        Insert: {
          code?: string
          created_at?: string
          customer_id?: string | null
          hemograma_path?: string | null
          id?: string
          laudo_path?: string | null
          lead_id?: string | null
          payload?: Json | null
          puppy_id: string
          signed_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          total_price_cents?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          customer_id?: string | null
          hemograma_path?: string | null
          id?: string
          laudo_path?: string | null
          lead_id?: string | null
          payload?: Json | null
          puppy_id?: string
          signed_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          total_price_cents?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_puppy_id_fkey"
            columns: ["puppy_id"]
            isOneToOne: false
            referencedRelation: "puppies"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          notes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          notes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          notes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          lead_id: string | null
          meta: Json | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          lead_id?: string | null
          meta?: Json | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          lead_id?: string | null
          meta?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          audience: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          key: string
          name: string
          starts_at: string | null
          status: string
          updated_at: string
          variants: Json
        }
        Insert: {
          audience?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          key: string
          name: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          variants?: Json
        }
        Update: {
          audience?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          key?: string
          name?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          variants?: Json
        }
        Relationships: []
      }
      integrations: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          provider: string
          provider_account_id: string | null
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider: string
          provider_account_id?: string | null
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          provider_account_id?: string | null
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          cidade: string | null
          created_at: string
          fbclid: string | null
          first_name: string | null
          first_responded_at: string | null
          gclid: string | null
          id: string
          last_name: string | null
          mensagem: string | null
          nome: string | null
          notes: string | null
          page: string | null
          phone: string | null
          preferencia: string | null
          referer: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          telefone: string | null
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          fbclid?: string | null
          first_name?: string | null
          first_responded_at?: string | null
          gclid?: string | null
          id?: string
          last_name?: string | null
          mensagem?: string | null
          nome?: string | null
          notes?: string | null
          page?: string | null
          phone?: string | null
          preferencia?: string | null
          referer?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          telefone?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string
          fbclid?: string | null
          first_name?: string | null
          first_responded_at?: string | null
          gclid?: string | null
          id?: string
          last_name?: string | null
          mensagem?: string | null
          nome?: string | null
          notes?: string | null
          page?: string | null
          phone?: string | null
          preferencia?: string | null
          referer?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          telefone?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          alt: string | null
          created_at: string
          credits: string | null
          height: number | null
          id: string
          url: string
          width: number | null
        }
        Insert: {
          alt?: string | null
          created_at?: string
          credits?: string | null
          height?: number | null
          id?: string
          url: string
          width?: number | null
        }
        Update: {
          alt?: string | null
          created_at?: string
          credits?: string | null
          height?: number | null
          id?: string
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt: string | null
          caption: string | null
          created_at: string | null
          created_by: string | null
          dominant_color: string | null
          file_path: string
          height: number | null
          id: string
          mime: string | null
          size_bytes: number | null
          source: string | null
          tags: string[] | null
          width: number | null
        }
        Insert: {
          alt?: string | null
          caption?: string | null
          created_at?: string | null
          created_by?: string | null
          dominant_color?: string | null
          file_path: string
          height?: number | null
          id?: string
          mime?: string | null
          size_bytes?: number | null
          source?: string | null
          tags?: string[] | null
          width?: number | null
        }
        Update: {
          alt?: string | null
          caption?: string | null
          created_at?: string | null
          created_by?: string | null
          dominant_color?: string | null
          file_path?: string
          height?: number | null
          id?: string
          mime?: string | null
          size_bytes?: number | null
          source?: string | null
          tags?: string[] | null
          width?: number | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      post_media: {
        Row: {
          media_id: string
          position: number | null
          post_id: string
          role: string
        }
        Insert: {
          media_id: string
          position?: number | null
          post_id: string
          role?: string
        }
        Update: {
          media_id?: string
          position?: number | null
          post_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      puppies: {
        Row: {
          aggregate_rating: number | null
          available_for_shipping: boolean | null
          birth_date: string | null
          canonical_url: string | null
          city: string | null
          cidade: string | null
          codigo: string | null
          color: string | null
          cor: string | null
          cost_cents: number | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          descricao: string | null
          description: string | null
          estado: string | null
          favorite_count: number | null
          gender: string | null
          gallery_images: string[] | null
          has_microchip: boolean | null
          has_pedigree: boolean | null
          health_certificate_url: string | null
          health_notes: string | null
          id: string
          image_url: string | null
          images: string[] | null
          inquiry_count: number | null
          internal_notes: string | null
          internal_source_id: string | null
          media: string[] | null
          microchip: string | null
          microchip_id: string | null
          midia: Json | null
          name: string | null
          nascimento: string | null
          next_vaccination_date: string | null
          nome: string | null
          notes: string | null
          parents_female: string | null
          parents_images: Json | null
          parents_male: string | null
          pedigree: string | null
          pedigree_number: string | null
          pedigree_url: string | null
          preco: number | null
          price_cents: number | null
          profit_margin_percentage: number | null
          published_at: string | null
          ready_for_adoption_date: string | null
          reserved_at: string | null
          reserved_by: string | null
          reservation_expires_at: string | null
          review_count: number | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          sexo: Database["public"]["Enums"]["sexo_type"] | null
          share_count: number | null
          shipping_cities: string[] | null
          shipping_notes: string | null
          slug: string | null
          sold_at: string | null
          source: string | null
          state: string | null
          status: Database["public"]["Enums"]["puppy_status"]
          updated_at: string
          updated_by: string | null
          vaccination_dates: string[] | null
          vaccination_status: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          aggregate_rating?: number | null
          available_for_shipping?: boolean | null
          birth_date?: string | null
          canonical_url?: string | null
          city?: string | null
          cidade?: string | null
          codigo?: string | null
          color?: string | null
          cor?: string | null
          cost_cents?: number | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          descricao?: string | null
          description?: string | null
          estado?: string | null
          favorite_count?: number | null
          gender?: string | null
          gallery_images?: string[] | null
          has_microchip?: boolean | null
          has_pedigree?: boolean | null
          health_certificate_url?: string | null
          health_notes?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          inquiry_count?: number | null
          internal_notes?: string | null
          internal_source_id?: string | null
          media?: string[] | null
          microchip?: string | null
          microchip_id?: string | null
          midia?: Json | null
          name?: string | null
          nascimento?: string | null
          next_vaccination_date?: string | null
          nome?: string | null
          notes?: string | null
          parents_female?: string | null
          parents_images?: Json | null
          parents_male?: string | null
          pedigree?: string | null
          pedigree_number?: string | null
          pedigree_url?: string | null
          preco?: number | null
          price_cents?: number | null
          profit_margin_percentage?: number | null
          published_at?: string | null
          ready_for_adoption_date?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          reservation_expires_at?: string | null
          review_count?: number | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          sexo?: Database["public"]["Enums"]["sexo_type"] | null
          share_count?: number | null
          shipping_cities?: string[] | null
          shipping_notes?: string | null
          slug?: string | null
          sold_at?: string | null
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["puppy_status"]
          updated_at?: string
          updated_by?: string | null
          vaccination_dates?: string[] | null
          vaccination_status?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          aggregate_rating?: number | null
          available_for_shipping?: boolean | null
          birth_date?: string | null
          canonical_url?: string | null
          city?: string | null
          cidade?: string | null
          codigo?: string | null
          color?: string | null
          cor?: string | null
          cost_cents?: number | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          descricao?: string | null
          description?: string | null
          estado?: string | null
          favorite_count?: number | null
          gender?: string | null
          gallery_images?: string[] | null
          has_microchip?: boolean | null
          has_pedigree?: boolean | null
          health_certificate_url?: string | null
          health_notes?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          inquiry_count?: number | null
          internal_notes?: string | null
          internal_source_id?: string | null
          media?: string[] | null
          microchip?: string | null
          microchip_id?: string | null
          midia?: Json | null
          name?: string | null
          nascimento?: string | null
          next_vaccination_date?: string | null
          nome?: string | null
          notes?: string | null
          parents_female?: string | null
          parents_images?: Json | null
          parents_male?: string | null
          pedigree?: string | null
          pedigree_number?: string | null
          pedigree_url?: string | null
          preco?: number | null
          price_cents?: number | null
          profit_margin_percentage?: number | null
          published_at?: string | null
          ready_for_adoption_date?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          reservation_expires_at?: string | null
          review_count?: number | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          sexo?: Database["public"]["Enums"]["sexo_type"] | null
          share_count?: number | null
          shipping_cities?: string[] | null
          shipping_notes?: string | null
          slug?: string | null
          sold_at?: string | null
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["puppy_status"]
          updated_at?: string
          updated_by?: string | null
          vaccination_dates?: string[] | null
          vaccination_status?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "puppies_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      puppy_media: {
        Row: {
          id: number
          mime_hint: string | null
          puppy_id: string | null
          sort_order: number | null
          url: string
        }
        Insert: {
          id?: number
          mime_hint?: string | null
          puppy_id?: string | null
          sort_order?: number | null
          url: string
        }
        Update: {
          id?: number
          mime_hint?: string | null
          puppy_id?: string | null
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "puppy_media_puppy_id_fkey"
            columns: ["puppy_id"]
            isOneToOne: false
            referencedRelation: "puppies"
            referencedColumns: ["id"]
          },
        ]
      }
      redirects: {
        Row: {
          active: boolean
          created_at: string
          from_path: string
          to_url: string
          type: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          from_path: string
          to_url: string
          type?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          from_path?: string
          to_url?: string
          type?: string
        }
        Relationships: []
      }
      seo_overrides: {
        Row: {
          created_at: string
          data_json: Json
          entity_id: string | null
          entity_ref: string | null
          entity_type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          data_json?: Json
          entity_id?: string | null
          entity_ref?: string | null
          entity_type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          data_json?: Json
          entity_id?: string | null
          entity_ref?: string | null
          entity_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      seo_rules: {
        Row: {
          active: boolean
          created_at: string
          id: string
          rules_json: Json
          scope: string
          scope_ref: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          rules_json?: Json
          scope: string
          scope_ref?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          rules_json?: Json
          scope?: string
          scope_ref?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_suggestions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          data_json: Json
          entity_id: string | null
          entity_ref: string | null
          entity_type: string
          id: string
          score: number | null
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          data_json: Json
          entity_id?: string | null
          entity_ref?: string | null
          entity_type: string
          id?: string
          score?: number | null
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          data_json?: Json
          entity_id?: string | null
          entity_ref?: string | null
          entity_type?: string
          id?: string
          score?: number | null
          status?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          avg_response_minutes: number | null
          brand_name: string | null
          brand_tagline: string | null
          clarity_id: string | null
          contact_email: string | null
          contact_phone: string | null
          fb_capi_token: string | null
          followup_rules: string | null
          ga4_id: string | null
          google_ads_id: string | null
          google_ads_label: string | null
          gtm_id: string | null
          hotjar_id: string | null
          id: number
          instagram: string | null
          meta_domain_verify: string | null
          meta_pixel_id: string | null
          seo_description_default: string | null
          seo_meta_tags: string | null
          seo_title_default: string | null
          pinterest_tag_id: string | null
          tiktok_api_token: string | null
          tiktok: string | null
          tiktok_pixel_id: string | null
          template_first_contact: string | null
          template_followup: string | null
          updated_at: string
          whatsapp_message: string | null
          weekly_post_goal: number | null
        }
        Insert: {
          avg_response_minutes?: number | null
          brand_name?: string | null
          brand_tagline?: string | null
          clarity_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          fb_capi_token?: string | null
          followup_rules?: string | null
          ga4_id?: string | null
          google_ads_id?: string | null
          google_ads_label?: string | null
          gtm_id?: string | null
          hotjar_id?: string | null
          id?: number
          instagram?: string | null
          meta_domain_verify?: string | null
          meta_pixel_id?: string | null
          seo_description_default?: string | null
          seo_meta_tags?: string | null
          seo_title_default?: string | null
          pinterest_tag_id?: string | null
          tiktok_api_token?: string | null
          tiktok?: string | null
          tiktok_pixel_id?: string | null
          template_first_contact?: string | null
          template_followup?: string | null
          updated_at?: string
          whatsapp_message?: string | null
          weekly_post_goal?: number | null
        }
        Update: {
          avg_response_minutes?: number | null
          brand_name?: string | null
          brand_tagline?: string | null
          clarity_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          fb_capi_token?: string | null
          followup_rules?: string | null
          ga4_id?: string | null
          google_ads_id?: string | null
          google_ads_label?: string | null
          gtm_id?: string | null
          hotjar_id?: string | null
          id?: number
          instagram?: string | null
          meta_domain_verify?: string | null
          meta_pixel_id?: string | null
          seo_description_default?: string | null
          seo_meta_tags?: string | null
          seo_title_default?: string | null
          pinterest_tag_id?: string | null
          tiktok_api_token?: string | null
          tiktok?: string | null
          tiktok_pixel_id?: string | null
          template_first_contact?: string | null
          template_followup?: string | null
          updated_at?: string
          whatsapp_message?: string | null
          weekly_post_goal?: number | null
        }
        Relationships: []
      }
      tracking_settings: {
        Row: {
          facebook_pixel_id: string | null
          ga_measurement_id: string | null
          gtm_container_id: string | null
          id: string
          is_facebook_pixel_enabled: boolean
          is_ga_enabled: boolean
          is_gtm_enabled: boolean
          is_tiktok_enabled: boolean
          tiktok_pixel_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          facebook_pixel_id?: string | null
          ga_measurement_id?: string | null
          gtm_container_id?: string | null
          id?: string
          is_facebook_pixel_enabled?: boolean
          is_ga_enabled?: boolean
          is_gtm_enabled?: boolean
          is_tiktok_enabled?: boolean
          tiktok_pixel_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          facebook_pixel_id?: string | null
          ga_measurement_id?: string | null
          gtm_container_id?: string | null
          id?: string
          is_facebook_pixel_enabled?: boolean
          is_ga_enabled?: boolean
          is_gtm_enabled?: boolean
          is_tiktok_enabled?: boolean
          tiktok_pixel_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_outbox: {
        Row: {
          created_at: string
          event: string
          id: string
          payload: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          payload?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          payload?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_contracts_status: {
        Row: {
          status: Database["public"]["Enums"]["contract_status"] | null
          total: number | null
        }
        Relationships: []
      }
      v_dashboard_overview: {
        Row: {
          filhotes_disponiveis: number | null
          leads_hoje: number | null
          leads_semana: number | null
          taxa_conversao_pct: number | null
        }
        Relationships: []
      }
      v_lead_sources_7d: {
        Row: {
          origem: string | null
          total: number | null
        }
        Relationships: []
      }
      v_leads_by_day_30d: {
        Row: {
          day: string | null
          total: number | null
        }
        Relationships: []
      }
      v_leads_funnel: {
        Row: {
          status: Database["public"]["Enums"]["lead_status"] | null
          total: number | null
        }
        Relationships: []
      }
      v_puppies_status: {
        Row: {
          status: Database["public"]["Enums"]["puppy_status"] | null
          total: number | null
        }
        Relationships: []
      }
      v_sla_avg_7d: {
        Row: {
          sla_min: number | null
        }
        Relationships: []
      }
      v_top_sources_30d: {
        Row: {
          src: string | null
          total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      campaign_breakdown_v1: {
        Args: { days: number; source?: string; tz: string }
        Returns: {
          contacted: number
          contracts: number
          conv: number
          label: string
          leads: number
        }[]
      }
      distinct_sources: {
        Args: { days: number; tz: string }
        Returns: {
          source: string
        }[]
      }
      fn_compute_seo_score: {
        Args: {
          excerpt: string
          mdx: string
          seo_description: string
          seo_title: string
        }
        Returns: number
      }
      gen_short_code: { Args: { n?: number }; Returns: string }
      kpi_counts_v2: {
        Args: { days: number; source?: string; tz: string }
        Returns: {
          contacted_period: number
          contracts_period: number
          leads_period: number
          leads_today: number
          puppies_available: number
          sla_min: number
        }[]
      }
      leads_daily: {
        Args: { from_ts: string }
        Returns: {
          day: string
          value: number
        }[]
      }
      leads_daily_tz_v2: {
        Args: { days: number; source?: string; tz: string }
        Returns: {
          day: string
          value: number
        }[]
      }
      source_breakdown_v1: {
        Args: { days: number; tz: string }
        Returns: {
          contacted: number
          contracts: number
          conv: number
          label: string
          leads: number
        }[]
      }
    }
    Enums: {
      contract_status: "pendente" | "assinado" | "cancelado"
      lead_status:
        | "novo"
        | "contatado"
        | "qualificado"
        | "perdido"
        | "convertido"
      puppy_status:
        | "available"
        | "coming_soon"
        | "disponivel"
        | "indisponivel"
        | "pending"
        | "reserved"
        | "reservado"
        | "sold"
        | "vendido"
        | "unavailable"
      sexo_type: "macho" | "femea"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      lock_top_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
  auth: {
    Enums: {
      aal_level: ["aal1", "aal2", "aal3"],
      code_challenge_method: ["s256", "plain"],
      factor_status: ["unverified", "verified"],
      factor_type: ["totp", "webauthn", "phone"],
      oauth_authorization_status: ["pending", "approved", "denied", "expired"],
      oauth_client_type: ["public", "confidential"],
      oauth_registration_type: ["dynamic", "manual"],
      oauth_response_type: ["code"],
      one_time_token_type: [
        "confirmation_token",
        "reauthentication_token",
        "recovery_token",
        "email_change_token_new",
        "email_change_token_current",
        "phone_change_token",
      ],
    },
  },
  public: {
    Enums: {
      contract_status: ["pendente", "assinado", "cancelado"],
      lead_status: [
        "novo",
        "contatado",
        "qualificado",
        "perdido",
        "convertido",
      ],
      puppy_status: ["disponivel", "reservado", "vendido", "indisponivel"],
      sexo_type: ["macho", "femea"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
