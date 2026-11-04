export default async function handler(request) {
  if (request.method !== 'GET') return Response.json({error:'Método no permitido'}, {status:405});
  return Response.json({online:true, configured:!!process.env.GEMINI_API_KEY, requiresAccessCode:!!process.env.JOTAPE_ACCESS_CODE}, {headers:{'Cache-Control':'no-store'}});
}
