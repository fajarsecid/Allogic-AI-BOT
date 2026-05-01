const fetchFn = global.fetch || require('node-fetch');

function stripAiPrefix(text = '') {
  return String(text || '')
    .replace(/^\s*(\.ai|\.ask|\.gpt|\.gemini|\.groq|\.allogic)\s*/i, '')
    .trim();
}

function shouldUseWebSearch(message = '') {
  const text = stripAiPrefix(message).toLowerCase();

  if (!text) return false;

  const hasUrl = /https?:\/\/\S+/i.test(text);
  if (hasUrl) return true;

  const triggers = [
    'cari di internet',
    'search internet',
    'cek web',
    'cek internet',
    'cari web',
    'web search',
    'googling',
    'berita',
    'terbaru',
    'update terbaru',
    'versi terbaru',
    'harga sekarang',
    'sekarang',
    'rilis',
    '2026',
    '2025',
    'model terbaru',
    'api terbaru',
    'library terbaru',
    'dokumentasi terbaru'
  ];

  return triggers.some(x => text.includes(x));
}

function cleanQuery(message = '') {
  let q = stripAiPrefix(message);

  q = q
    .replace(/cari di internet/ig, '')
    .replace(/search internet/ig, '')
    .replace(/cek web/ig, '')
    .replace(/cek internet/ig, '')
    .replace(/cari web/ig, '')
    .replace(/web search/ig, '')
    .replace(/googling/ig, '')
    .trim();

  return q || stripAiPrefix(message);
}

function extractUrls(text = '') {
  const found = String(text || '').match(/https?:\/\/[^\s)]+/gi);
  return found ? found.slice(0, 2) : [];
}

function stripHtml(html = '') {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function readUrl(url = '') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetchFn(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Allogic-AI-BOT/1.0'
      }
    });

    const type = res.headers.get('content-type') || '';
    const raw = await res.text();

    let text = type.includes('text/html') ? stripHtml(raw) : raw;
    text = String(text || '').replace(/\s+/g, ' ').trim();

    if (!text) return null;

    return {
      title: url,
      url,
      text: text.slice(0, 2500)
    };
  } catch (e) {
    return {
      title: url,
      url,
      text: 'Gagal membaca URL: ' + e.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function duckDuckGoSearch(query = '') {
  const q = cleanQuery(query);
  const url =
    'https://api.duckduckgo.com/?q=' +
    encodeURIComponent(q) +
    '&format=json&no_redirect=1&no_html=1&skip_disambig=1';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetchFn(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Allogic-AI-BOT/1.0'
      }
    });

    const data = await res.json();

    const results = [];

    if (data.AbstractText) {
      results.push({
        title: data.Heading || 'DuckDuckGo Abstract',
        url: data.AbstractURL || '',
        text: data.AbstractText
      });
    }

    if (data.Answer) {
      results.push({
        title: 'Instant Answer',
        url: data.AbstractURL || '',
        text: data.Answer
      });
    }

    const related = Array.isArray(data.RelatedTopics) ? data.RelatedTopics : [];

    for (const item of related) {
      if (results.length >= 6) break;

      if (item.Text) {
        results.push({
          title: item.FirstURL || 'Related result',
          url: item.FirstURL || '',
          text: item.Text
        });
      }

      if (Array.isArray(item.Topics)) {
        for (const sub of item.Topics) {
          if (results.length >= 6) break;
          if (sub.Text) {
            results.push({
              title: sub.FirstURL || 'Related result',
              url: sub.FirstURL || '',
              text: sub.Text
            });
          }
        }
      }
    }

    return {
      query: q,
      results
    };
  } catch (e) {
    return {
      query: q,
      results: [],
      error: e.message
    };
  } finally {
    clearTimeout(timeout);
  }
}


function buildLocalTermContext(message = '') {
  const text = stripAiPrefix(message);
  const lower = text.toLowerCase();

  const aiContext =
    lower.includes('ai') ||
    lower.includes('bot') ||
    lower.includes('memory') ||
    lower.includes('memori') ||
    lower.includes('knowledge') ||
    lower.includes('database') ||
    lower.includes('retrieval') ||
    lower.includes('embedding') ||
    lower.includes('vector') ||
    lower.includes('rag') ||
    lower.includes('dokumen');

  const marketingContext =
    lower.includes('iklan') ||
    lower.includes('ads') ||
    lower.includes('marketing') ||
    lower.includes('campaign') ||
    lower.includes('roas') ||
    lower.includes('biaya iklan') ||
    lower.includes('laba iklan');

  if (/\brag\b/i.test(text) && aiContext && !marketingContext) {
    return [
      'KONTEKS ISTILAH LOKAL:',
      'Dalam konteks AI, bot, memory, knowledge base, database, dokumen, retrieval, embedding, atau vector search:',
      'RAG berarti Retrieval-Augmented Generation.',
      'RAG adalah teknik AI yang mengambil informasi relevan dari sumber eksternal seperti dokumen, database, web, atau knowledge base, lalu memasukkannya ke prompt agar jawaban model lebih akurat dan lebih update.',
      'Jangan artikan RAG sebagai Return on Ad Spend, Relevance Accuracy Generality, atau istilah lain kecuali konteksnya jelas bukan AI.'
    ].join('\n');
  }

  return '';
}



function buildKnownFactsContext(message = '') {
  const text = stripAiPrefix(message).toLowerCase();
  const facts = [];

  if (text.includes('claude')) {
    facts.push([
      'KONTEKS FAKTA WAJIB:',
      '- Claude AI dikembangkan oleh Anthropic.',
      '- Claude bukan dikembangkan oleh Google.',
      '- Jika user meminta berita terbaru Claude AI tetapi web search kosong, jangan mengarang berita terbaru.',
      '- Jawab jujur bahwa hasil web search ringan tidak menemukan data terbaru yang cukup.',
      '- Informasi umum yang aman: Claude adalah AI assistant / keluarga model AI dari Anthropic untuk chat, coding, analisis, penulisan, dan problem solving.'
    ].join('\n'));
  }

  if (text.includes('gemini')) {
    facts.push([
      'KONTEKS FAKTA WAJIB:',
      '- Gemini adalah model/AI dari Google.',
      '- Jangan menyebut Gemini sebagai buatan Anthropic atau OpenAI.'
    ].join('\n'));
  }

  if (text.includes('chatgpt') || text.includes('openai')) {
    facts.push([
      'KONTEKS FAKTA WAJIB:',
      '- ChatGPT dikembangkan oleh OpenAI.',
      '- Jangan menyebut ChatGPT sebagai buatan Google atau Anthropic.'
    ].join('\n'));
  }

  if (text.includes('groq')) {
    facts.push([
      'KONTEKS FAKTA WAJIB:',
      '- Groq adalah penyedia inference/API cepat untuk menjalankan model AI.',
      '- Groq berbeda dari Grok milik xAI.'
    ].join('\n'));
  }

  if (/\brag\b/i.test(text)) {
    facts.push([
      'KONTEKS FAKTA WAJIB:',
      '- Dalam konteks AI, RAG berarti Retrieval-Augmented Generation.',
      '- RAG adalah teknik mengambil informasi relevan dari sumber eksternal seperti dokumen, database, web, atau knowledge base, lalu memasukkannya ke prompt AI.',
      '- Jangan artikan RAG sebagai Return on Ad Spend kecuali konteksnya jelas tentang iklan/marketing.'
    ].join('\n'));
  }

  return facts.join('\n\n');
}


async function buildWebContext(message = '') {
  const urls = extractUrls(message);
  const blocks = [];

  const knownFacts = buildKnownFactsContext(message);
  if (knownFacts) {
    blocks.push(knownFacts);
  }

  const localTermContext = buildLocalTermContext(message);
  if (localTermContext) {
    blocks.push(localTermContext);
  }

  if (urls.length) {
    for (const url of urls) {
      const page = await readUrl(url);
      if (page) {
        blocks.push(
          'URL: ' + page.url + '\n' +
          'Isi ringkas: ' + page.text
        );
      }
    }
  }

  if (shouldUseWebSearch(message)) {
    const search = await duckDuckGoSearch(message);

    if (search.error) {
      blocks.push('Web search error: ' + search.error);
    }

    if (search.results.length) {
      const lines = [];

      lines.push('Query web: ' + search.query);

      search.results.forEach((r, i) => {
        lines.push(
          (i + 1) + '. ' +
          (r.title || 'Result') +
          (r.url ? '\n   URL: ' + r.url : '') +
          '\n   Ringkasan: ' + String(r.text || '').slice(0, 700)
        );
      });

      blocks.push(lines.join('\n'));
    }
  }

  if (!blocks.length && shouldUseWebSearch(message)) {
    return [
      'KONTEKS WEB SEARCH:',
      'User meminta pencarian web/info terbaru, tetapi web search ringan tidak menemukan hasil yang cukup.',
      'Jangan mengarang berita, tanggal, perusahaan, rilis, harga, atau klaim terbaru.',
      'Jawab jujur bahwa hasil pencarian terbatas. Berikan informasi umum yang aman jika diketahui.'
    ].join('\n');
  }

  if (!blocks.length) return '';

  const max = Number(process.env.ALLOGIC_WEB_CONTEXT_MAX_CHARS || 5000);
  const text = [
    'KONTEKS WEB SEARCH:',
    'Gunakan data web ini hanya jika relevan.',
    'Jika hasil web tidak cukup kuat, katakan bahwa hasil pencarian terbatas.',
    'Untuk info terbaru, jangan hanya mengandalkan pengetahuan model.',
    '',
    blocks.join('\n\n')
  ].join('\n');

  return text.slice(0, Number.isFinite(max) ? max : 5000);
}

module.exports = {
  shouldUseWebSearch,
  buildWebContext,
  duckDuckGoSearch,
  readUrl
};
