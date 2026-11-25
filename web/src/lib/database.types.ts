// Generated from the Supabase schema (see ../../supabase/migrations). Regenerate after schema changes.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      applications: {
        Row: {
          application_id: string;
          decided_at: string | null;
          matched_criteria: string[];
          missing_criteria: string[];
          registration_id: string;
          resume_text: string | null;
          resume_url: string | null;
          screening_outcome: Database["public"]["Enums"]["screening_outcome"] | null;
        };
        Insert: {
          application_id?: string;
          decided_at?: string | null;
          matched_criteria?: string[];
          missing_criteria?: string[];
          registration_id: string;
          resume_text?: string | null;
          resume_url?: string | null;
          screening_outcome?: Database["public"]["Enums"]["screening_outcome"] | null;
        };
        Update: {
          application_id?: string;
          decided_at?: string | null;
          matched_criteria?: string[];
          missing_criteria?: string[];
          registration_id?: string;
          resume_text?: string | null;
          resume_url?: string | null;
          screening_outcome?: Database["public"]["Enums"]["screening_outcome"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "applications_registration_id_fkey";
            columns: ["registration_id"];
            isOneToOne: true;
            referencedRelation: "registrations";
            referencedColumns: ["registration_id"];
          },
        ];
      };
      attendance: {
        Row: {
          attendance_id: string;
          checked_in_at: string;
          scanned_by: string;
          ticket_id: string;
        };
        Insert: {
          attendance_id?: string;
          checked_in_at?: string;
          scanned_by: string;
          ticket_id: string;
        };
        Update: {
          attendance_id?: string;
          checked_in_at?: string;
          scanned_by?: string;
          ticket_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_scanned_by_fkey";
            columns: ["scanned_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "attendance_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: true;
            referencedRelation: "tickets";
            referencedColumns: ["ticket_id"];
          },
        ];
      };
      events: {
        Row: {
          cancel_deadline: string | null;
          capacity: number;
          checkin_close_at: string | null;
          checkin_open_at: string | null;
          created_at: string;
          description: string;
          end_at: string;
          event_id: string;
          mode: Database["public"]["Enums"]["event_mode"];
          organiser_id: string;
          reg_close_at: string;
          reg_open_at: string;
          start_at: string;
          status: Database["public"]["Enums"]["event_status"];
          title: string;
          venue: string | null;
        };
        Insert: {
          cancel_deadline?: string | null;
          capacity: number;
          checkin_close_at?: string | null;
          checkin_open_at?: string | null;
          created_at?: string;
          description?: string;
          end_at: string;
          event_id?: string;
          mode?: Database["public"]["Enums"]["event_mode"];
          organiser_id: string;
          reg_close_at: string;
          reg_open_at?: string;
          start_at: string;
          status?: Database["public"]["Enums"]["event_status"];
          title: string;
          venue?: string | null;
        };
        Update: {
          cancel_deadline?: string | null;
          capacity?: number;
          checkin_close_at?: string | null;
          checkin_open_at?: string | null;
          created_at?: string;
          description?: string;
          end_at?: string;
          event_id?: string;
          mode?: Database["public"]["Enums"]["event_mode"];
          organiser_id?: string;
          reg_close_at?: string;
          reg_open_at?: string;
          start_at?: string;
          status?: Database["public"]["Enums"]["event_status"];
          title?: string;
          venue?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_organiser_id_fkey";
            columns: ["organiser_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["user_id"];
          },
        ];
      };
      registrations: {
        Row: {
          cancelled_at: string | null;
          event_id: string;
          registered_at: string;
          registration_id: string;
          status: Database["public"]["Enums"]["registration_status"];
          student_id: string;
          waitlist_position: number | null;
        };
        Insert: {
          cancelled_at?: string | null;
          event_id: string;
          registered_at?: string;
          registration_id?: string;
          status: Database["public"]["Enums"]["registration_status"];
          student_id: string;
          waitlist_position?: number | null;
        };
        Update: {
          cancelled_at?: string | null;
          event_id?: string;
          registered_at?: string;
          registration_id?: string;
          status?: Database["public"]["Enums"]["registration_status"];
          student_id?: string;
          waitlist_position?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["event_id"];
          },
          {
            foreignKeyName: "registrations_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["user_id"];
          },
        ];
      };
      role_audit: {
        Row: {
          audit_id: string;
          changed_at: string;
          changed_by: string | null;
          new_role: Database["public"]["Enums"]["user_role"];
          old_role: Database["public"]["Enums"]["user_role"];
          user_id: string;
        };
        Insert: {
          audit_id?: string;
          changed_at?: string;
          changed_by?: string | null;
          new_role: Database["public"]["Enums"]["user_role"];
          old_role: Database["public"]["Enums"]["user_role"];
          user_id: string;
        };
        Update: {
          audit_id?: string;
          changed_at?: string;
          changed_by?: string | null;
          new_role?: Database["public"]["Enums"]["user_role"];
          old_role?: Database["public"]["Enums"]["user_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_audit_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "role_audit_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["user_id"];
          },
        ];
      };
      screening_criteria: {
        Row: {
          criterion_id: string;
          criterion_type: Database["public"]["Enums"]["criterion_type"];
          event_id: string;
          expected_value: string;
          is_required: boolean;
        };
        Insert: {
          criterion_id?: string;
          criterion_type: Database["public"]["Enums"]["criterion_type"];
          event_id: string;
          expected_value: string;
          is_required?: boolean;
        };
        Update: {
          criterion_id?: string;
          criterion_type?: Database["public"]["Enums"]["criterion_type"];
          event_id?: string;
          expected_value?: string;
          is_required?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "screening_criteria_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["event_id"];
          },
        ];
      };
      tickets: {
        Row: {
          issued_at: string;
          registration_id: string;
          secret: string;
          status: Database["public"]["Enums"]["ticket_status"];
          ticket_id: string;
        };
        Insert: {
          issued_at?: string;
          registration_id: string;
          secret?: string;
          status?: Database["public"]["Enums"]["ticket_status"];
          ticket_id?: string;
        };
        Update: {
          issued_at?: string;
          registration_id?: string;
          secret?: string;
          status?: Database["public"]["Enums"]["ticket_status"];
          ticket_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_registration_id_fkey";
            columns: ["registration_id"];
            isOneToOne: true;
            referencedRelation: "registrations";
            referencedColumns: ["registration_id"];
          },
        ];
      };
      users: {
        Row: {
          approved_by: string | null;
          created_at: string;
          email: string;
          full_name: string;
          matric_no: string | null;
          organiser_status: Database["public"]["Enums"]["organiser_status"];
          phone: string | null;
          photo_url: string | null;
          programme: string | null;
          role: Database["public"]["Enums"]["user_role"];
          user_id: string;
          year_of_study: number | null;
        };
        Insert: {
          approved_by?: string | null;
          created_at?: string;
          email: string;
          full_name?: string;
          matric_no?: string | null;
          organiser_status?: Database["public"]["Enums"]["organiser_status"];
          phone?: string | null;
          photo_url?: string | null;
          programme?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          user_id: string;
          year_of_study?: number | null;
        };
        Update: {
          approved_by?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          matric_no?: string | null;
          organiser_status?: Database["public"]["Enums"]["organiser_status"];
          phone?: string | null;
          photo_url?: string | null;
          programme?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          user_id?: string;
          year_of_study?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["user_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      app_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      is_approved_organiser: { Args: never; Returns: boolean };
      owns_event: { Args: { p_event_id: string }; Returns: boolean };
      register_for_event: {
        Args: { p_event_id: string };
        Returns: Database["public"]["Enums"]["registration_status"];
      };
      seats_left: { Args: { p_event_id: string }; Returns: number };
      admin_set_role: {
        Args: { p_user_id: string; p_role: Database["public"]["Enums"]["user_role"] };
        Returns: undefined;
      };
      public_upcoming_events: {
        Args: { p_limit?: number };
        Returns: {
          event_id: string;
          title: string;
          venue: string | null;
          start_at: string;
          mode: Database["public"]["Enums"]["event_mode"];
          capacity: number;
          seats_left: number;
        }[];
      };
      issue_qr_token: { Args: { p_ticket_id: string }; Returns: Json };
      check_in: { Args: { p_token: string }; Returns: Json };
      event_attendance: {
        Args: { p_event_id: string };
        Returns: {
          registration_id: string;
          full_name: string;
          matric_no: string | null;
          programme: string | null;
          status: Database["public"]["Enums"]["registration_status"];
          attended: boolean;
          checked_in_at: string | null;
        }[];
      };
    };
    Enums: {
      criterion_type: "skill" | "cgpa" | "programme" | "year";
      event_mode: "open" | "application";
      event_status: "draft" | "published" | "closed";
      organiser_status: "none" | "pending" | "approved" | "rejected";
      registration_status:
        | "registered"
        | "pending"
        | "accepted"
        | "waitlisted"
        | "rejected"
        | "cancelled";
      screening_outcome: "eligible" | "needs_review" | "not_eligible";
      ticket_status: "active" | "used" | "revoked";
      user_role: "student" | "organiser" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
