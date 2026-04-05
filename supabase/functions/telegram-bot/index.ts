const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const body = await req.json();
    const { action, chat_id, text, parse_mode } = body;

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

      const { severity, title, description, source, timestamp } = body;
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

    if (action === 'auto_alert') {
      if (!chat_id) {
        return new Response(JSON.stringify({ error: 'chat_id is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { metrics } = body;
      if (!metrics) {
        return new Response(JSON.stringify({ error: 'metrics object is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const alerts: string[] = [];
      const { cpu, ram, disk, network_in, network_out, agent_name } = metrics;

      if (cpu !== undefined && cpu > 90) {
        alerts.push(`🔴 <b>CPU Critical:</b> ${cpu.toFixed(1)}% (threshold: 90%)`);
      } else if (cpu !== undefined && cpu > 80) {
        alerts.push(`🟠 <b>CPU High:</b> ${cpu.toFixed(1)}% (threshold: 80%)`);
      }

      if (ram !== undefined && ram > 90) {
        alerts.push(`🔴 <b>RAM Critical:</b> ${ram.toFixed(1)}% (threshold: 90%)`);
      } else if (ram !== undefined && ram > 80) {
        alerts.push(`🟠 <b>RAM High:</b> ${ram.toFixed(1)}% (threshold: 80%)`);
      }

      if (disk !== undefined && disk > 90) {
        alerts.push(`🔴 <b>Disk Critical:</b> ${disk.toFixed(1)}% (threshold: 90%)`);
      } else if (disk !== undefined && disk > 85) {
        alerts.push(`🟠 <b>Disk High:</b> ${disk.toFixed(1)}% (threshold: 85%)`);
      }

      if (alerts.length === 0) {
        return new Response(JSON.stringify({ success: true, message: 'No thresholds exceeded', alerts_sent: 0 }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const hasCritical = alerts.some(a => a.includes('Critical'));
      const emoji = hasCritical ? '🚨' : '⚠️';
      const severity = hasCritical ? 'CRITICAL' : 'WARNING';

      const autoAlertMsg = [
        `${emoji} <b>NMSLEX Auto Alert — ${severity}</b>`,
        '',
        agent_name ? `🖥️ <b>Agent:</b> ${agent_name}` : '',
        '',
        ...alerts,
        '',
        `📅 <b>Time:</b> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`,
        '',
        `<i>Auto-generated by NMSLEX Monitoring</i>`,
        '🐼 NMSLEX',
      ].filter(Boolean).join('\n');

      const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TELEGRAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat_id, text: autoAlertMsg, parse_mode: 'HTML' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Telegram API failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify({ success: true, alerts_sent: alerts.length }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: send, test, alert, auto_alert' }), {
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
