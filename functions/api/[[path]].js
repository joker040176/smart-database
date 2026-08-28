// Cloudflare Pages Functions - 飞书API代理
// 处理所有 /api/* 请求，代理到飞书多维表格API

const FEISHU_APP_ID = 'cli_aa04c9e51879dcef';
const FEISHU_APP_SECRET = 'xwECQodcqOfmgPvkaiZKihuKhRKDdDkj';
const FEISHU_APP_TOKEN = 'CSxQbQ2I1aD03FsrfKicKKvNnlc';

// 表ID映射
const TABLE_MAP = {
  'characters': 'tblUbDm8MN1N5A1i',
  'factions': 'tblGsKuoMoqMBSNb',
  'chapters': 'tblFSHHGzrLmzdJq',
  'romances': 'tblYquov5csZPuJG',
  'events': 'tblJe2OzIbgmfdaV',
  'items': 'tblbv79CMcL7ZLNz',
  'relations': 'tblG5ExeUW9QIqtQ',
  'worldsettings': 'tblfmXcOZTnKcuA4',
  'gamblings': 'tblNZoL9mvzemfUg',
  'cliques': 'tblPHshJtflwDr46',
  'volumes': 'tblxOSsSQsddIrUL',
  'statuschanges': 'tbloZg1M5O9VzBXo',
  'timeline': 'tbldtI6gbg9QWz02',
  'dashboard': 'tblMsROZaAeitGIw',
  'tasks': 'tblEwMLmXPTkcz2Q',
  'inspirations': 'tblLm9DDlqesP6Rt',
  'foreshadows': 'tbly7KS3ob7r2pky',
  'snapshots': 'tbludHkQlHm6IQTl',
  'feedbacks': 'tbl61KyUpuhPWoOt'
};

// 获取tenant_access_token（带缓存）
let cachedToken = null;
let tokenExpireTime = 0;

async function getTenantToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpireTime) {
    return cachedToken;
  }
  
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET
    })
  });
  
  const data = await res.json();
  if (data.code === 0) {
    cachedToken = data.tenant_access_token;
    tokenExpireTime = now + (data.expire - 60) * 1000; // 提前60秒过期
    return cachedToken;
  }
  throw new Error('获取飞书令牌失败: ' + data.msg);
}

// 处理请求
export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  
  // 解析路径: /api/{tableKey}/records/{recordId}
  const pathParts = params.path.split('/');
  const tableKey = pathParts[0];
  const action = pathParts[1]; // records
  const recordId = pathParts[2]; // 可选
  
  const tableId = TABLE_MAP[tableKey];
  if (!tableId) {
    return new Response(JSON.stringify({ error: '未知的表: ' + tableKey }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  try {
    const token = await getTenantToken();
    const basePath = `/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${tableId}`;
    
    let feishuUrl = 'https://open.feishu.cn' + basePath;
    let method = request.method;
    let body = null;
    
    if (action === 'records') {
      if (recordId) {
        feishuUrl += `/records/${recordId}`;
      } else {
        feishuUrl += `/records`;
        // 保留查询参数
        if (url.search) {
          feishuUrl += url.search;
        }
      }
      
      if (method === 'POST' || method === 'PUT') {
        body = await request.text();
      }
    } else {
      return new Response(JSON.stringify({ error: '不支持的操作: ' + action }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const feishuRes = await fetch(feishuUrl, {
      method,
      headers,
      body
    });
    
    const data = await feishuRes.text();
    
    return new Response(data, {
      status: feishuRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// 处理OPTIONS预检请求
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
