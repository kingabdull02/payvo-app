// Supabase Edge Function: send-reminders
// Deploy with: supabase functions deploy send-reminders
// Set environment variables: supabase secrets set RESEND_API_KEY=your_key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Missing environment variables.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Initialize Admin client (bypasses RLS to query multiple profiles/invoices)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Fetch all Premium users with email alerts active
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_premium', true)
      .eq('email_notifications', true);

    if (profileErr) throw profileErr;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: 'No active premium notification profiles found.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const logs = [];

    // 2. Loop through each user profile to check for due invoices
    for (const user of profiles) {
      // Calculate soon due date
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + user.reminder_days);
      const soonDateStr = soonDate.toISOString().split('T')[0];

      // Query unpaid invoices due:
      // a) Exactly in X days (soonDateStr)
      // b) Exactly today (todayStr)
      const { data: invoices, error: invoiceErr } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_paid', false)
        .or(`due_date.eq.${soonDateStr},due_date.eq.${todayStr}`);

      if (invoiceErr) {
        console.error(`Error querying invoices for user ${user.id}:`, invoiceErr);
        continue;
      }

      if (!invoices || invoices.length === 0) continue;

      // Group invoices by category (due today vs due soon)
      const dueToday = invoices.filter(inv => inv.due_date === todayStr);
      const dueSoon = invoices.filter(inv => inv.due_date === soonDateStr);

      if (dueToday.length === 0 && dueSoon.length === 0) continue;

      // 3. Construct email content
      let emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #F4F7FB; border-radius: 24px; color: #0D1B2A;">
          <h2 style="color: #0D1B2A; margin-bottom: 8px;">Payvo Påminnelse</h2>
          <p style="font-size: 14px; color: #5C6B73; margin-top: 0;">Hej ${user.name || 'Payvo-användare'}, du har obetalda fakturor som förfaller inom kort.</p>
          <hr style="border: 0; border-top: 1px solid rgba(13, 27, 42, 0.08); margin: 20px 0;" />
      `;

      if (dueToday.length > 0) {
        emailHtml += `
          <h3 style="color: #FF4D6D; font-size: 15px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Förfaller IDAG</h3>
          <ul style="list-style: none; padding: 0; margin: 0 0 20px 0;">
        `;
        for (const inv of dueToday) {
          emailHtml += `
            <li style="background: white; padding: 12px 16px; border-radius: 12px; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold; color: #0D1B2A;">${inv.name}</span>
              <span style="font-weight: bold; color: #FF4D6D;">${Number(inv.amount).toLocaleString('sv-SE')} kr</span>
            </li>
          `;
        }
        emailHtml += `</ul>`;
      }

      if (dueSoon.length > 0) {
        emailHtml += `
          <h3 style="color: #FFB347; font-size: 15px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Förfaller om ${user.reminder_days} dagar</h3>
          <ul style="list-style: none; padding: 0; margin: 0 0 20px 0;">
        `;
        for (const inv of dueSoon) {
          emailHtml += `
            <li style="background: white; padding: 12px 16px; border-radius: 12px; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold; color: #0D1B2A;">${inv.name}</span>
              <span style="font-weight: bold; color: #FFB347;">${Number(inv.amount).toLocaleString('sv-SE')} kr</span>
            </li>
          `;
        }
        emailHtml += `</ul>`;
      }

      emailHtml += `
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://payvo.vercel.app/" style="background-color: #00C2D1; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Gå till Payvo</a>
          </div>
          <p style="font-size: 11px; text-align: center; color: #A0AEC0; margin-top: 30px;">
            Denna notis skickades automatiskt eftersom du har valt att få e-postpåminnelser. Du kan hantera dina aviseringar under Inställningar i appen.
          </p>
        </div>
      `;

      // 4. Send email request via Resend API
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Payvo <no-reply@payvo.se>',
          to: [user.email],
          subject: 'Payvo - Påminnelse om obetalda räkningar',
          html: emailHtml,
        }),
      });

      if (resendRes.ok) {
        logs.push(`Reminder email sent successfully to ${user.email}`);
      } else {
        const resendErr = await resendRes.json();
        console.error(`Failed to send email to ${user.email} via Resend:`, resendErr);
        logs.push(`Failed to send email to ${user.email}`);
      }
    }

    return new Response(JSON.stringify({ status: 'success', logs }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
