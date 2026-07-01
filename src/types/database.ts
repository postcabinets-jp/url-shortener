export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "editor" | "viewer";
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: "owner" | "editor" | "viewer";
          invited_by?: string | null;
          joined_at?: string;
        };
        Update: {
          role?: "owner" | "editor" | "viewer";
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      domains: {
        Row: {
          id: string;
          workspace_id: string;
          hostname: string;
          verified: boolean;
          verification_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          hostname: string;
          verified?: boolean;
          verification_token?: string;
          created_at?: string;
        };
        Update: {
          verified?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "domains_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      links: {
        Row: {
          id: string;
          workspace_id: string;
          domain_id: string | null;
          slug: string;
          destination_url: string;
          title: string | null;
          tags: string[];
          password_hash: string | null;
          expires_at: string | null;
          max_clicks: number | null;
          active: boolean;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_term: string | null;
          utm_content: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          domain_id?: string | null;
          slug: string;
          destination_url: string;
          title?: string | null;
          tags?: string[];
          password_hash?: string | null;
          expires_at?: string | null;
          max_clicks?: number | null;
          active?: boolean;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_term?: string | null;
          utm_content?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          domain_id?: string | null;
          slug?: string;
          destination_url?: string;
          title?: string | null;
          tags?: string[];
          password_hash?: string | null;
          expires_at?: string | null;
          max_clicks?: number | null;
          active?: boolean;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_term?: string | null;
          utm_content?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "links_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      clicks: {
        Row: {
          id: string;
          link_id: string;
          clicked_at: string;
          country: string | null;
          city: string | null;
          referrer: string | null;
          device_type: "mobile" | "desktop" | "tablet" | "bot" | "unknown" | null;
          browser: string | null;
          os: string | null;
          ip_hash: string | null;
        };
        Insert: {
          id?: string;
          link_id: string;
          clicked_at?: string;
          country?: string | null;
          city?: string | null;
          referrer?: string | null;
          device_type?: "mobile" | "desktop" | "tablet" | "bot" | "unknown" | null;
          browser?: string | null;
          os?: string | null;
          ip_hash?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "clicks_link_id_fkey";
            columns: ["link_id"];
            isOneToOne: false;
            referencedRelation: "links";
            referencedColumns: ["id"];
          },
        ];
      };
      api_keys: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          key_hash: string;
          last_used_at: string | null;
          created_by: string;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          key_hash: string;
          last_used_at?: string | null;
          created_by: string;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          last_used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "api_keys_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type WorkspaceMember = Database["public"]["Tables"]["workspace_members"]["Row"];
export type Domain = Database["public"]["Tables"]["domains"]["Row"];
export type Link = Database["public"]["Tables"]["links"]["Row"];
export type Click = Database["public"]["Tables"]["clicks"]["Row"];
export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
