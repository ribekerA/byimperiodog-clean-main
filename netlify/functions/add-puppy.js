// Netlify Function: add-puppy
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Supabase env vars missing', SUPABASE_URL, SUPABASE_ANON_KEY })
    };
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON', body: event.body, parseError: err && err.message })
    };
  }

  // Adapte os campos conforme sua tabela Supabase
  // Recebe todos os campos usados no admin
  const {
    nome, name, color, gender, status, nascimento, image_url, descricao, notes, video_url, midia, price_cents, codigo, city, state
  } = data;
  let result;
  try {
    result = await client
      .from('puppies')
      .insert([{ nome, name, color, gender, status, nascimento, image_url, descricao, notes, video_url, midia, price_cents, codigo, city, state }]);
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Supabase JS Exception',
        exception: err && err.message,
        stack: err && err.stack,
        data,
        env: {
          SUPABASE_URL: SUPABASE_URL ? 'ok' : 'missing',
          SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'ok' : 'missing'
        }
      })
    };
  }
  const { error, data: inserted } = result;

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        supabaseError: error,
        sentData: data,
        env: {
          SUPABASE_URL: SUPABASE_URL ? 'ok' : 'missing',
          SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'ok' : 'missing'
        }
      })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, puppy: inserted, sentData: data })
  };
};
