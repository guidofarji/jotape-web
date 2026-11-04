// Netlify Function — la clave principal de Gemini nunca sale al navegador.
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default async function handler(request){
  if(request.method!=='POST')return reply({error:'Método no permitido'},405);
  const apiKey=process.env.GEMINI_API_KEY;
  if(!apiKey)return reply({error:'Falta GEMINI_API_KEY en las variables de entorno de Netlify.'},503);
  const origin=request.headers.get('origin');
  if(origin && origin!==new URL(request.url).origin)return reply({error:'Origen no autorizado.'},403);
  let data;
  try {const raw=await request.text(); if(raw.length>2048) return reply({error:'Solicitud demasiado grande.'},413); data=JSON.parse(raw||'{}');}
  catch{return reply({error:'Solicitud incorrecta.'},400)}
  if(process.env.JOTAPE_ACCESS_CODE && data.accessCode!==process.env.JOTAPE_ACCESS_CODE)return reply({error:'Código de acceso incorrecto.'},403);
  const now=Date.now();
  const payload={uses:1,expireTime:new Date(now+20*60*1000).toISOString(),newSessionExpireTime:new Date(now+60*1000).toISOString()};
  let response;
  try{response=await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});}
  catch{return reply({error:'No se pudo conectar con Google AI Studio.'},502)}
  if(!response.ok){console.error('Gemini token',response.status);return reply({error:response.status===429?'Se alcanzó la cuota gratuita de Gemini.':'Gemini rechazó la emisión del token. Revisá clave, modelo y cuotas.',status:response.status},502)}
  const token=await response.json().catch(()=>({}));
  if(!token.name)return reply({error:'Gemini no devolvió un token válido.'},502);
  return reply({token:token.name,model:process.env.GEMINI_LIVE_MODEL||'gemini-3.1-flash-live-preview'});
}
