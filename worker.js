addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const BUTTONDOWN_API_KEY = "c8b9ac08-5a50-43c0-a1d8-61986ca05710";

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
    
    // 同时订阅到 KV 和 Buttondown
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
      
      // 2. 订阅到 Buttondown（会发送确认邮件）
      const bdResponse = await fetch('https://api.buttondown.email/v1/subscribers', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${BUTTONDOWN_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_address: email,
          notes: 'Subscribed from AI Stories website',
          referrer_url: 'https://ai2091.com'
        })
      });
      
      const bdData = await bdResponse.json();
      
      if (bdResponse.ok || bdData.code === 'subscriber_already_subscribed') {
        return new Response(JSON.stringify({ 
          success: true, 
          message: '订阅成功！确认邮件已发送到您的邮箱',
          total: subscribers.length
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } else {
        console.error('Buttondown error:', bdData);
        // 即使 Buttondown 失败，本地 KV 保存成功也算订阅成功
        return new Response(JSON.stringify({ 
          success: true, 
          message: '订阅成功！',
          total: subscribers.length
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
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
