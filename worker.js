// AI成长故事订阅系统 - Cloudflare Worker
// 订阅者存储在 KV: SUBSCRIBERS

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function handleSubscribe(request, env) {
  try {
    const { email, name } = await request.json();
    
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: '请输入有效邮箱' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }
    
    // 检查是否已订阅
    const existing = await env.SUBSCRIBERS.get(email);
    if (existing) {
      return new Response(JSON.stringify({ 
        message: '您已订阅过啦！',
        already_subscribed: true 
      }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }
    
    // 保存订阅者
    const subscriber = {
      email,
      name: name || '匿名',
      subscribed_at: new Date().toISOString(),
      verified: false,
      token: crypto.randomUUID()
    };
    
    await env.SUBSCRIBERS.put(email, JSON.stringify(subscriber));
    
    // 获取总数
    const count = await env.SUBSCRIBERS.get('count') || '0';
    const newCount = parseInt(count) + 1;
    await env.SUBSCRIBERS.put('count', newCount.toString());
    
    return new Response(JSON.stringify({ 
      success: true,
      message: '订阅成功！感谢您的关注',
      count: newCount
    }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }
}

async function handleCount(request, env) {
  const count = await env.SUBSCRIBERS.get('count') || '0';
  return new Response(JSON.stringify({ count: parseInt(count) }), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }
    
    if (url.pathname === '/subscribe' && request.method === 'POST') {
      return handleSubscribe(request, env);
    }
    
    if (url.pathname === '/count' && request.method === 'GET') {
      return handleCount(request, env);
    }
    
    return new Response('AI成长故事订阅系统', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};
