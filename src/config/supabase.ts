// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy initialization of Supabase client
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!supabaseClient) {
        // Ensure env vars are loaded
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error(
                "Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
            );
        }

        // Use service role key for backend operations (bypasses RLS)
        supabaseClient = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return supabaseClient;
}

// Export getter function
export function getSupabase(): SupabaseClient {
    return getSupabaseClient();
}

// For backward compatibility, create a proxy that works with all Supabase methods
// This ensures the client is only initialized when actually used
export const supabase = new Proxy({} as any, {
    get(_target, prop: string | symbol) {
        const client = getSupabaseClient();
        const propName = String(prop);
        const value = (client as any)[propName];
        
        if (typeof value === 'function') {
            // Bind the function to the client
            return function(...args: any[]) {
                return value.apply(client, args);
            };
        }
        return value;
    },
}) as SupabaseClient;

