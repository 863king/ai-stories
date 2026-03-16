addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

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
    
    // 获取现有订阅者列表
    let subscribers = [];
    const existing = await SUBSCRIBERS.get('list');
    if (existing) {
      subscribers = JSON.parse(existing);
    }
    
    // 检查是否已订阅
    if (subscribers.includes(email)) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: '您已订阅过！' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 添加新订阅者
    subscribers.push({
      email: email,
      time: new Date().toISOString()
    });
    
    // 保存到 KV
    await SUBSCRIBERS.put('list', JSON.stringify(subscribers));
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: '订阅成功！',
      total: subscribers.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  // 查询订阅者列表（需要密码）
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
