addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const TELEGRAM_BOT_TOKEN = "7895030104:AAHfXqJ3f2yZQkLQVp5mNtRqWxYzAbCdEf";
const TELEGRAM_CHAT_ID = "2075850034";

async function handleRequest(request) {
  const url = new URL(request.url);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // 订阅接口
  if (url.pathname === '/subscribe' && request.method === 'POST') {
    const body = await request.json();
    const email = body.email;
    
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: '邮箱格式错误' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    try {
      // 1. 保存到 KV
      let subscribers = [];
      const existing = await SUBSCRIBERS.get('list');
      if (existing) {
        subscribers = JSON.parse(existing);
      }
      
      const alreadySubscribed = subscribers.some(s => s.email === email);
      if (!alreadySubscribed) {
        subscribers.push({
          email: email,
          time: new Date().toISOString()
        });
        await SUBSCRIBERS.put('list', JSON.stringify(subscribers));
      }
      
      // 2. 发送 Telegram 通知
      const msg = `📧 **新订阅者**\n\n邮箱: ${email}\n时间: ${new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}\n总计: ${subscribers.length} 人`;
      
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: msg,
          parse_mode: 'Markdown'
        })
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: '订阅成功！',
        total: subscribers.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (e) {
      console.error('Subscribe error:', e);
      return new Response(JSON.stringify({ error: '订阅失败，请重试' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  
  // 查询订阅者列表
  if (url.pathname === '/list' && request.method === 'GET') {
    const secret = url.searchParams.get('secret');
    if (secret !== '9527king') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const subscribers = await SUBSCRIBERS.get('list');
    return new Response(subscribers || '[]', {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
