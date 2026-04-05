import { corsHeaders } from '@supabase/supabase-js/cors'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_API_KEY is not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action, chat_id, text, parse_mode } = await req.json();

    if (action === 'send') {
      if (!chat_id || !text) {
        return new Response(JSON.stringify({ error: 'chat_id and text are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TELEGRAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id,
          text,
          parse_mode: parse_mode || 'HTML',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Telegram API failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify({ success: true, message_id: data.result?.message_id }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'test') {
      if (!chat_id) {
        return new Response(JSON.stringify({ error: 'chat_id is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const testMsg = `🐼 <b>NMSLEX Bot Connected!</b>\n\n✅ Koneksi berhasil!\nBot siap mengirim notifikasi realtime.\n\n📅 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

      const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TELEGRAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat_id, text: testMsg, parse_mode: 'HTML' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Telegram API failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify({ success: true, message: 'Test notification sent!' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'alert') {
      if (!chat_id) {
        return new Response(JSON.stringify({ error: 'chat_id is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { severity, title, description, source, timestamp } = await req.json().catch(() => ({}));
      const severityEmoji: Record<string, string> = {
        critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', info: 'ℹ️',
      };

      const emoji = severityEmoji[severity || 'info'] || 'ℹ️';
      const alertMsg = [
        `${emoji} <b>NMSLEX Alert: ${title || 'System Alert'}</b>`,
        '',
        `📋 <b>Severity:</b> ${(severity || 'info').toUpperCase()}`,
        description ? `📝 <b>Detail:</b> ${description}` : '',
        source ? `🖥️ <b>Source:</b> ${source}` : '',
        `📅 <b>Time:</b> ${timestamp || new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`,
        '',
        '🐼 NMSLEX Monitoring System',
      ].filter(Boolean).join('\n');

      const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TELEGRAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat_id, text: alertMsg, parse_mode: 'HTML' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Telegram API failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: send, test, alert' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Telegram bot error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
