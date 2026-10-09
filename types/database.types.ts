/**
 * Tipi scritti a mano rispecchiando esattamente lo schema testato in
 * supabase/migrations/ (Fase 2) — la CLI ufficiale richiede Docker per la
 * generazione da connessione diretta, non disponibile in questo ambiente.
 *
 * Una volta collegato il progetto Supabase reale, rigenera con:
 *   npx supabase gen types typescript --project-id <tuo-project-id> > types/database.types.ts
 * (sostituirà questo file mantenendo la stessa forma).
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Richiesto dalle versioni recenti di @supabase/postgrest-js per la
  // corretta inferenza dei tipi (senza, tutte le query risolvono a `never`).
  // Verrà scritto automaticamente quando rigenererai questo file con la CLI
  // reale collegata al progetto.
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          company_name: string | null;
          vat_number: string | null;
          tax_code: string | null;
          address: string | null;
          city: string | null;
          postal_code: string | null;
          province: string | null;
          country: string;
          phone: string | null;
          logo_url: string | null;
          default_vat_rate: number;
          invoice_number_prefix: string;
          quote_number_prefix: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          referent_name: string | null;
          email: string | null;
          phone: string | null;
          vat_number: string | null;
          tax_code: string | null;
          address: string | null;
          city: string | null;
          postal_code: string | null;
          province: string | null;
          country: string;
          notes: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          name: string;
          description: string | null;
          status: "planned" | "in_progress" | "paused" | "completed" | "cancelled";
          priority: "low" | "medium" | "high" | "urgent";
          start_date: string | null;
          expected_end_date: string | null;
          actual_end_date: string | null;
          budget: number | null;
          project_value: number;
          notes: string | null;
          custom_fields: Json;
          duration_days: number | null;
          timeline_running: boolean;
          frozen_since: string | null;
          frozen_days: number;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["projects"]["Row"]> & {
          user_id: string;
          client_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
        Relationships: [
          { foreignKeyName: "projects_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] }
        ];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          client_id: string | null;
          title: string;
          description: string | null;
          status: "todo" | "in_progress" | "in_review" | "completed";
          priority: "low" | "medium" | "high" | "urgent";
          due_date: string | null;
          start_date: string | null;
          duration_days: number | null;
          timeline_running: boolean;
          frozen_since: string | null;
          frozen_days: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tasks"]["Row"]> & {
          user_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Row"]>;
        Relationships: [
          { foreignKeyName: "tasks_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "tasks_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] }
        ];
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          event_date: string;
          event_time: string | null;
          event_type: "meeting" | "reminder" | "other";
          client_id: string | null;
          project_id: string | null;
          task_id: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["events"]["Row"]> & {
          user_id: string;
          title: string;
          event_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
        Relationships: [
          { foreignKeyName: "events_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
          { foreignKeyName: "events_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "events_task_id_fkey"; columns: ["task_id"]; referencedRelation: "tasks"; referencedColumns: ["id"] }
        ];
      };
      document_counters: {
        Row: {
          user_id: string;
          document_type: "quote" | "invoice";
          year: number;
          last_number: number;
        };
        Insert: Partial<Database["public"]["Tables"]["document_counters"]["Row"]> & {
          user_id: string;
          document_type: "quote" | "invoice";
          year: number;
        };
        Update: Partial<Database["public"]["Tables"]["document_counters"]["Row"]>;
        Relationships: [];
      };
      quotes: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          project_id: string | null;
          quote_number: string;
          issue_date: string;
          expiry_date: string | null;
          status: "draft" | "sent" | "accepted" | "rejected" | "expired";
          subtotal: number;
          vat_amount: number;
          total: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quotes"]["Row"]> & {
          user_id: string;
          client_id: string;
          quote_number: string;
        };
        Update: Partial<Database["public"]["Tables"]["quotes"]["Row"]>;
        Relationships: [
          { foreignKeyName: "quotes_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
          { foreignKeyName: "quotes_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] }
        ];
      };
      quote_items: {
        Row: {
          id: string;
          user_id: string;
          quote_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          discount_percent: number;
          vat_rate: number;
          line_total: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quote_items"]["Row"]> & {
          user_id: string;
          quote_id: string;
          description: string;
        };
        Update: Partial<Database["public"]["Tables"]["quote_items"]["Row"]>;
        Relationships: [
          { foreignKeyName: "quote_items_quote_id_fkey"; columns: ["quote_id"]; referencedRelation: "quotes"; referencedColumns: ["id"] }
        ];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          project_id: string | null;
          quote_id: string | null;
          invoice_number: string;
          issue_date: string;
          due_date: string | null;
          status: "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled";
          subtotal: number;
          vat_amount: number;
          total: number;
          paid_amount: number;
          remaining_amount: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["invoices"]["Row"]> & {
          user_id: string;
          client_id: string;
          invoice_number: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
        Relationships: [
          { foreignKeyName: "invoices_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
          { foreignKeyName: "invoices_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "invoices_quote_id_fkey"; columns: ["quote_id"]; referencedRelation: "quotes"; referencedColumns: ["id"] }
        ];
      };
      invoice_items: {
        Row: {
          id: string;
          user_id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          discount_percent: number;
          vat_rate: number;
          line_total: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["invoice_items"]["Row"]> & {
          user_id: string;
          invoice_id: string;
          description: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Row"]>;
        Relationships: [
          { foreignKeyName: "invoice_items_invoice_id_fkey"; columns: ["invoice_id"]; referencedRelation: "invoices"; referencedColumns: ["id"] }
        ];
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          invoice_id: string;
          amount: number;
          payment_date: string;
          payment_method: "bank_transfer" | "card" | "cash" | "paypal" | "other";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          user_id: string;
          invoice_id: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        Relationships: [
          { foreignKeyName: "payments_invoice_id_fkey"; columns: ["invoice_id"]; referencedRelation: "invoices"; referencedColumns: ["id"] }
        ];
      };
      transaction_categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: "income" | "expense";
          is_default: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["transaction_categories"]["Row"]> & {
          user_id: string;
          name: string;
          type: "income" | "expense";
        };
        Update: Partial<Database["public"]["Tables"]["transaction_categories"]["Row"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: "income" | "expense";
          category_id: string | null;
          description: string | null;
          amount: number;
          transaction_date: string;
          client_id: string | null;
          project_id: string | null;
          invoice_id: string | null;
          payment_id: string | null;
          payment_method: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["transactions"]["Row"]> & {
          user_id: string;
          type: "income" | "expense";
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
        Relationships: [
          { foreignKeyName: "transactions_category_id_fkey"; columns: ["category_id"]; referencedRelation: "transaction_categories"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_invoice_id_fkey"; columns: ["invoice_id"]; referencedRelation: "invoices"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_payment_id_fkey"; columns: ["payment_id"]; referencedRelation: "payments"; referencedColumns: ["id"] }
        ];
      };
      commissions: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          amount: number;
          percentage: number | null;
          commission_date: string;
          client_id: string | null;
          project_id: string | null;
          status: "to_pay" | "paid";
          transaction_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["commissions"]["Row"]> & {
          user_id: string;
          description: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["commissions"]["Row"]>;
        Relationships: [
          { foreignKeyName: "commissions_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
          { foreignKeyName: "commissions_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "commissions_transaction_id_fkey"; columns: ["transaction_id"]; referencedRelation: "transactions"; referencedColumns: ["id"] }
        ];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          storage_path: string;
          mime_type: string | null;
          file_size: number | null;
          client_id: string | null;
          project_id: string | null;
          quote_id: string | null;
          invoice_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["documents"]["Row"]> & {
          user_id: string;
          file_name: string;
          storage_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Row"]>;
        Relationships: [
          { foreignKeyName: "documents_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
          { foreignKeyName: "documents_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "documents_quote_id_fkey"; columns: ["quote_id"]; referencedRelation: "quotes"; referencedColumns: ["id"] },
          { foreignKeyName: "documents_invoice_id_fkey"; columns: ["invoice_id"]; referencedRelation: "invoices"; referencedColumns: ["id"] }
        ];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          client_id: string | null;
          project_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notes"]["Row"]> & {
          user_id: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Row"]>;
        Relationships: [
          { foreignKeyName: "notes_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] },
          { foreignKeyName: "notes_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] }
        ];
      };
      project_phases: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          /** se valorizzato è una micro attività della macro attività indicata */
          parent_id: string | null;
          name: string;
          start_date: string;
          duration_days: number;
          timeline_running: boolean;
          frozen_since: string | null;
          frozen_days: number;
          completed: boolean;
          completed_at: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["project_phases"]["Row"]> & {
          user_id: string;
          project_id: string;
          name: string;
          start_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_phases"]["Row"]>;
        Relationships: [
          { foreignKeyName: "project_phases_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "project_phases_parent_id_fkey"; columns: ["parent_id"]; referencedRelation: "project_phases"; referencedColumns: ["id"] }
        ];
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          kind: "client" | "collaborator" | "supplier" | "other";
          company: string | null;
          role: string | null;
          email: string | null;
          phone: string | null;
          client_id: string | null;
          notes: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["contacts"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Row"]>;
        Relationships: [
          { foreignKeyName: "contacts_client_id_fkey"; columns: ["client_id"]; referencedRelation: "clients"; referencedColumns: ["id"] }
        ];
      };
      project_contacts: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          contact_id: string;
          role: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["project_contacts"]["Row"]> & {
          user_id: string;
          project_id: string;
          contact_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_contacts"]["Row"]>;
        Relationships: [
          { foreignKeyName: "project_contacts_project_id_fkey"; columns: ["project_id"]; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "project_contacts_contact_id_fkey"; columns: ["contact_id"]; referencedRelation: "contacts"; referencedColumns: ["id"] }
        ];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: "general" | "work" | "life" | "finance";
          source: "manual" | "income_year" | "invested_year" | "gym_days" | "travel_days" | "clients_acquired";
          target: number;
          manual_value: number;
          year: number;
          /** ultimo anno dell'obiettivo (null = vale solo per `year`) */
          end_year: number | null;
          show_on_home: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["goals"]["Row"]> & {
          user_id: string;
          title: string;
          target: number;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Row"]>;
        Relationships: [];
      };
      investments: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          kind: "etf" | "stocks" | "bonds" | "crypto" | "real_estate" | "cash" | "other";
          current_value: number | null;
          notes: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["investments"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["investments"]["Row"]>;
        Relationships: [];
      };
      investment_movements: {
        Row: {
          id: string;
          user_id: string;
          investment_id: string;
          movement_date: string;
          kind: "deposit" | "withdrawal";
          amount: number;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["investment_movements"]["Row"]> & {
          user_id: string;
          investment_id: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["investment_movements"]["Row"]>;
        Relationships: [
          { foreignKeyName: "investment_movements_investment_id_fkey"; columns: ["investment_id"]; referencedRelation: "investments"; referencedColumns: ["id"] }
        ];
      };
      rentals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string | null;
          tenant_name: string | null;
          rent_amount: number;
          rent_frequency: "monthly" | "quarterly" | "yearly";
          /** giorno del mese (1-31) in cui si incassa l'affitto */
          rent_day: number | null;
          contract_start: string | null;
          contract_end: string | null;
          imu_amount: number | null;
          notes: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["rentals"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["rentals"]["Row"]>;
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          plate: string | null;
          kind: "car" | "motorbike" | "other";
          notes: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["vehicles"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["vehicles"]["Row"]>;
        Relationships: [];
      };
      life_deadlines: {
        Row: {
          id: string;
          user_id: string;
          rental_id: string | null;
          vehicle_id: string | null;
          kind: "imu" | "rent" | "insurance" | "bollo" | "service" | "inspection" | "other";
          title: string;
          due_date: string;
          amount: number | null;
          recurrence: "none" | "monthly" | "quarterly" | "yearly";
          /** tempo a giorni (come i progetti): inizio + durata + congelamento */
          start_date: string | null;
          duration_days: number | null;
          timeline_running: boolean;
          frozen_since: string | null;
          frozen_days: number;
          last_paid_at: string | null;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["life_deadlines"]["Row"]> & {
          user_id: string;
          title: string;
          due_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["life_deadlines"]["Row"]>;
        Relationships: [
          { foreignKeyName: "life_deadlines_rental_id_fkey"; columns: ["rental_id"]; referencedRelation: "rentals"; referencedColumns: ["id"] },
          { foreignKeyName: "life_deadlines_vehicle_id_fkey"; columns: ["vehicle_id"]; referencedRelation: "vehicles"; referencedColumns: ["id"] }
        ];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          workout_date: string;
          kind: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workouts"]["Row"]> & {
          user_id: string;
          workout_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["workouts"]["Row"]>;
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          destination: string | null;
          start_date: string | null;
          end_date: string | null;
          status: "idea" | "planned" | "booked" | "done";
          budget: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["trips"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["trips"]["Row"]>;
        Relationships: [];
      };
      trip_items: {
        Row: {
          id: string;
          user_id: string;
          trip_id: string;
          kind: "transport" | "stay" | "activity" | "todo" | "other";
          title: string;
          item_date: string | null;
          cost: number | null;
          booked: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["trip_items"]["Row"]> & {
          user_id: string;
          trip_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["trip_items"]["Row"]>;
        Relationships: [
          { foreignKeyName: "trip_items_trip_id_fkey"; columns: ["trip_id"]; referencedRelation: "trips"; referencedColumns: ["id"] }
        ];
      };
      pages: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          icon: string | null;
          section: "general" | "work" | "life" | "finance";
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pages"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["pages"]["Row"]>;
        Relationships: [];
      };
      page_blocks: {
        Row: {
          id: string;
          user_id: string;
          page_id: string;
          type: "heading" | "text" | "checklist" | "table" | "gantt";
          content: Json;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["page_blocks"]["Row"]> & {
          user_id: string;
          page_id: string;
          type: "heading" | "text" | "checklist" | "table" | "gantt";
        };
        Update: Partial<Database["public"]["Tables"]["page_blocks"]["Row"]>;
        Relationships: [
          { foreignKeyName: "page_blocks_page_id_fkey"; columns: ["page_id"]; referencedRelation: "pages"; referencedColumns: ["id"] }
        ];
      };
    };
    Views: {
      project_financials: {
        Row: {
          project_id: string;
          project_value: number;
          costs_incurred: number | null;
          profit: number | null;
        };
        Relationships: [];
      };
      client_financials: {
        Row: {
          client_id: string;
          total_invoiced: number | null;
          total_collected: number | null;
          total_outstanding: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_next_document_number: {
        Args: { p_document_type: string; p_year: number };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
