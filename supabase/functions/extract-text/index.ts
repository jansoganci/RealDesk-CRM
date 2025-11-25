/**
 * Supabase Edge Function: Text Extraction Proxy
 * 
 * This function acts as a secure proxy between your frontend and Flavius API.
 * Firebase tokens are stored in environment variables (secrets).
 * 
 * Setup:
 * 1. Deploy this function: supabase functions deploy extract-text
 * 2. Set secrets:
 *    supabase secrets set FLAVIUS_FIREBASE_ID_TOKEN=your_token
 *    supabase secrets set FLAVIUS_APP_CHECK_TOKEN=your_token
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FLAVIUS_API_URL = 'https://api.flavius.app/api/v1/process-file';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

interface Env {
  FLAVIUS_FIREBASE_ID_TOKEN: string;
  FLAVIUS_APP_CHECK_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    // Use dummy tokens (API doesn't enforce auth validation yet)
    // TODO: Replace with real Firebase tokens when API enforces authentication
    const firebaseIdToken = Deno.env.get('FLAVIUS_FIREBASE_ID_TOKEN') || 'dummy_firebase_token_12345';
    const appCheckToken = Deno.env.get('FLAVIUS_APP_CHECK_TOKEN') || 'dummy_appcheck_token_67890';

    // Verify Supabase authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/epub+zip', 'application/octet-stream'];
    const allowedExtensions = ['.pdf', '.epub'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return new Response(
        JSON.stringify({ error: 'Unsupported file type. Please upload a PDF or EPUB file.' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File size too large. Maximum 100 MB.' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Forward request to Flavius API
    const flaviusFormData = new FormData();
    flaviusFormData.append('file', file);

    const flaviusResponse = await fetch(FLAVIUS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseIdToken}`,
        'X-Firebase-AppCheck': appCheckToken,
      },
      body: flaviusFormData,
    });

    if (!flaviusResponse.ok) {
      const errorData = await flaviusResponse.json().catch(() => ({ error: 'Unknown error' }));
      return new Response(
        JSON.stringify({ 
          success: false,
          error: errorData.error || `Flavius API error: ${flaviusResponse.status}` 
        }),
        { 
          status: flaviusResponse.status,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const flaviusData = await flaviusResponse.json();

    // Return response to client
    return new Response(
      JSON.stringify(flaviusData),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

