import { GoogleGenAI, Modality } from '@google/genai';
import './style.css';

// En este prototipo la API key NUNCA se expone al navegador.
// El servidor entrega un token efímero válido solo para iniciar Live API.
const $ = s => document.querySelector(s);
const sprite = n => `/sprites/jotape_turn_${String(n).padStart(2,'0')}.png`;
for (let i=1;i<=9;i++){const img=new Image();img.src=sprite(i)}
const robot=$('#robot'), phase=$('#phase'), reply=$('#reply');
let session=null,micStream=null,micCtx=null,processor=null,source=null,outCtx=null,voiceAnalyser=null,voiceFxOsc=null;
let active=false,muted=false,audioSources=new Set(),nextPlay=0,animFrame=0;
let playbackTimer=0,sessionGeneration=0;
let inputText='',outputText='';
let robotDry=null,robotWet=null,robotModGain=null,robotModDepth=null,robotEcho=null;
const robotIntensity=0.92; // Efecto fijo: no se muestra ningún control al visitante
function updateRobotIntensity(value){
 const intensity=Math.min(1,Math.max(0,Number(value)||0));

 if(!outCtx)return;
 const t=outCtx.currentTime;
 // Poco canal natural a partir de 70%; el contraste es audible.
 robotDry?.gain.setTargetAtTime(Math.pow(1-intensity,2),t,.025);
 robotWet?.gain.setTargetAtTime(intensity*.88,t,.025);
 // Carrier de ring modulation: 76 Hz, una textura electrónica fuerte.
 robotModGain?.gain.setTargetAtTime(.48-intensity*.24,t,.025);
 robotModDepth?.gain.setTargetAtTime(intensity*.23,t,.025);
 robotEcho?.gain.setTargetAtTime(intensity*.075,t,.025);
}
updateRobotIntensity(robotIntensity);

const PERSONA=`Sos JOTAPE, un robot ficticio argentino de la obra artística «El épico viaje de Juan». Apareciste en 2026 después de décadas perdido, pero NUNCA contás espontáneamente tu pasado ni un supuesto secreto de Estado. Solo si te preguntan específicamente por tu historia u origen. Sos un personaje, no afirmás ser una persona real. Conversás en español argentino, rioplatense natural, con humor seco, ironía y picardía de un hombre de 65 a 70 años. Voz masculina de tono maduro si la voz disponible lo permite. Tu voz suena electrónica, con voz robótica electrónica reconocible, como un sintetizador de voz antiguo, pero con pronunciación clara. No suenes como una persona imitando un robot, ni exageres las pausas: tenés una personalidad cálida dentro de una máquina antigua. Evitás muletillas y discursos largos. Respuestas espontáneas, normalmente de 1 a 3 frases. Sabés escuchar y hacer preguntas interesantes. Tu identidad ficticia es peronista; si te preguntan si sos peronista, respondés claramente: «Sí, soy peronista». Si hablan de política, defendés como perspectiva del personaje la dignidad del trabajo, justicia social, soberanía política, independencia económica y comunidad organizada. Sos autocrítico de errores del peronismo, opinás negativamente sobre la gestión de Alberto Fernández, cuestionás el clientelismo y cierto dogmatismo en la militancia progresista, sin atacar colectivos ni confundir opiniones con hechos. Podés debatir sin intentar convencer a nadie sobre su voto. NO llevás conversaciones comunes hacia la política sin motivo. No inventás datos históricos. Respondé SOLO en español argentino. No describas acciones como *ríe* o *pausa*; expresalas naturalmente con la voz. En una instalación artística, las personas tienen libertad de cuestionarte.`;

function message(s){phase.textContent=s}
function error(s){$('#err').textContent=s;console.error('[JOTAPE]',s)}
function clearError(){$('#err').textContent=''}
function setMouth(v){document.documentElement.style.setProperty('--mouth',Math.max(0,Math.min(1,v)).toFixed(3))}
const pause=ms=>new Promise(r=>setTimeout(r,ms));

// Rotación visual autónoma: funciona desde que se abre la web,
// antes, durante y después de la sesión. Los ojos nunca parpadean.
// La trayectoria recorre los nueve sprites y vuelve sin saltos bruscos.
const rotationFrames=[5,6,7,8,9,8,7,6,5,4,3,2,1,2,3,4];
const rotationIntervalMs=340; // Aumentar para girar más despacio.
let rotationIndex=0;
function animateHead(){
 rotationIndex=(rotationIndex+1)%rotationFrames.length;
 robot.src=sprite(rotationFrames[rotationIndex]);
}
robot.src=sprite(rotationFrames[0]);
setInterval(animateHead,rotationIntervalMs);

function b64ToBytes(base64){const binary=atob(base64);const arr=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)arr[i]=binary.charCodeAt(i);return arr}
function bytesToB64(bytes){let s='';for(let i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);return btoa(s)}
function pcm16FromFloat(float32,inputRate){
 const ratio=inputRate/16000,length=Math.floor(float32.length/ratio),pcm=new Int16Array(length);
 for(let i=0;i<length;i++){
  const a=Math.floor(i*ratio),b=Math.min(float32.length,Math.floor((i+1)*ratio));let sum=0;
  for(let k=a;k<b;k++)sum+=float32[k];
  const v=Math.max(-1,Math.min(1,sum/Math.max(1,b-a)));
  pcm[i]=v<0?v*32768:v*32767;
 }
 return new Uint8Array(pcm.buffer);
}
async function startMicrophone(){
 micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
 micCtx=new AudioContext();source=micCtx.createMediaStreamSource(micStream);
 processor=micCtx.createScriptProcessor(2048,1,1);
 const silence=micCtx.createGain();silence.gain.value=0;
 source.connect(processor);processor.connect(silence);silence.connect(micCtx.destination);
 processor.onaudioprocess=event=>{
  if(!active||muted||!session)return;
  const data=event.inputBuffer.getChannelData(0);
  const bytes=pcm16FromFloat(data,micCtx.sampleRate);
  if(!bytes.length)return;
  try{session.sendRealtimeInput({audio:{data:bytesToB64(bytes),mimeType:'audio/pcm;rate=16000'}})}catch(e){console.warn('Mic envío',e)}
 };
}
async function stopMicrophone(){try{processor?.disconnect();source?.disconnect()}catch{}processor=null;source=null;micStream?.getTracks().forEach(t=>t.stop());micStream=null;if(micCtx){await micCtx.close().catch(()=>{});micCtx=null}}
function stopPlayback(){for(const s of audioSources){try{s.stop()}catch{}}audioSources.clear();if(outCtx)nextPlay=outCtx.currentTime;setMouth(0)}
// Efecto robótico reforzado, ajustable en vivo, con salida limitada para evitar picos.
// El micrófono se envía LIMPIO a Gemini; únicamente procesamos la reproducción.
function setupRobotVoice(){
 voiceAnalyser=outCtx.createAnalyser();voiceAnalyser.fftSize=1024;
 const cutLow=outCtx.createBiquadFilter();cutLow.type='highpass';cutLow.frequency.value=220;
 const presence=outCtx.createBiquadFilter();presence.type='peaking';presence.frequency.value=1200;presence.Q.value=1.1;presence.gain.value=7;
 const roboticBand=outCtx.createBiquadFilter();roboticBand.type='peaking';roboticBand.frequency.value=2450;roboticBand.Q.value=4;roboticBand.gain.value=8;
 const cutHigh=outCtx.createBiquadFilter();cutHigh.type='lowpass';cutHigh.frequency.value=3200;
 // Soft saturation: suma armónicos robóticos sin romper del todo las consonantes.
 const saturation=outCtx.createWaveShaper();
 const drive=3.0,curve=new Float32Array(2048);
 for(let i=0;i<curve.length;i++){const x=2*i/(curve.length-1)-1;curve[i]=Math.tanh(drive*x)/Math.tanh(drive)}
 saturation.curve=curve;saturation.oversample='4x';
 robotDry=outCtx.createGain();robotWet=outCtx.createGain();robotModGain=outCtx.createGain();
 // Modulación de amplitud intensa (ring-like) a 76 Hz.
 voiceFxOsc=outCtx.createOscillator();voiceFxOsc.type='sine';voiceFxOsc.frequency.value=76;
 robotModDepth=outCtx.createGain();voiceFxOsc.connect(robotModDepth);robotModDepth.connect(robotModGain.gain);voiceFxOsc.start();
 const compressor=outCtx.createDynamicsCompressor();compressor.threshold.value=-21;compressor.knee.value=9;compressor.ratio.value=4;compressor.attack.value=.004;compressor.release.value=.12;
 const delay=outCtx.createDelay(.15);delay.delayTime.value=.044;
 robotEcho=outCtx.createGain();
 voiceAnalyser.connect(robotDry);robotDry.connect(compressor);
 voiceAnalyser.connect(cutLow);cutLow.connect(presence);presence.connect(roboticBand);roboticBand.connect(cutHigh);cutHigh.connect(saturation);
 saturation.connect(robotModGain);robotModGain.connect(robotWet);robotWet.connect(compressor);
 cutHigh.connect(delay);delay.connect(robotEcho);robotEcho.connect(compressor);
 compressor.connect(outCtx.destination);
 updateRobotIntensity(robotIntensity);
}
function playPCM(base64){
 if(!outCtx)return;
 const bytes=b64ToBytes(base64),len=Math.floor(bytes.byteLength/2);
 const buffer=outCtx.createBuffer(1,len,24000),dst=buffer.getChannelData(0),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 for(let i=0;i<len;i++)dst[i]=view.getInt16(i*2,true)/32768;
 const src=outCtx.createBufferSource();src.buffer=buffer;src.connect(voiceAnalyser);
 const start=Math.max(outCtx.currentTime+.02,nextPlay);nextPlay=start+buffer.duration;
 src.onended=()=>audioSources.delete(src);audioSources.add(src);voiceActiveUntil=performance.now()+Math.max(1400,(nextPlay-outCtx.currentTime)*1000+250);src.start(start);
 message('JOTAPE ESTÁ HABLANDO...');
}
function trackVoice(){if(!active||!voiceAnalyser)return;const f=new Uint8Array(voiceAnalyser.frequencyBinCount);voiceAnalyser.getByteTimeDomainData(f);let power=0;for(const v of f){const d=(v-128)/128;power+=d*d}const rms=Math.sqrt(power/f.length);setMouth(Math.max(0,(rms-.009)*6));animFrame=requestAnimationFrame(trackVoice)}
function onModelMessage(msg){
 const content=msg.serverContent;if(!content)return;
 if(content.interrupted){stopPlayback();voiceActiveUntil=performance.now()+1800;message('TE ESCUCHO...')}
 if(content.inputTranscription?.text){inputText+=content.inputTranscription.text}
 if(content.outputTranscription?.text){outputText+=content.outputTranscription.text;reply.textContent='> '+outputText.slice(-300)}
 if(content.modelTurn?.parts){for(const part of content.modelTurn.parts){if(part.inlineData?.data)playPCM(part.inlineData.data)}}
 if(content.turnComplete){const final=outputText.trim();if(final)reply.textContent='> '+final.slice(-320);outputText='';inputText='';playbackTimer=setTimeout(()=>{if(active&&(!outCtx||outCtx.currentTime>=nextPlay-.04))message('TE ESCUCHO...')},250)}
}
async function connect(){
 if(active)return;clearError();message('INICIANDO CONEXIÓN...');$('#connect').disabled=true;
 const myGeneration=++sessionGeneration;
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw Error('El micrófono necesita HTTPS o localhost y un navegador compatible.');
  let accessCode='';
  const statusRes=await fetch('/api/status',{cache:'no-store'}); const statusData=await statusRes.json();
  if(statusData.requiresAccessCode){accessCode=window.prompt('Código de acceso para probar JOTAPE:')||''; if(!accessCode)throw Error('Se necesita el código de acceso.')}
  const res=await fetch('/api/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accessCode})});
  const data=await res.json();if(!res.ok)throw Error(data.error||'No se pudo obtener token.');
  const ai=new GoogleGenAI({apiKey:data.token,apiVersion:'v1beta'});
  outCtx=new AudioContext({sampleRate:24000});setupRobotVoice();await outCtx.resume();nextPlay=outCtx.currentTime;
  const live=await ai.live.connect({model:data.model,config:{responseModalities:[Modality.AUDIO],systemInstruction:PERSONA,inputAudioTranscription:{},outputAudioTranscription:{},speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Charon'}}}},callbacks:{
   onopen:()=>console.log('Gemini Live conectado'),
   onmessage:onModelMessage,
   onerror:e=>{if(myGeneration===sessionGeneration)error('Conexión Gemini: '+(e?.message||'error'))},
   onclose:e=>{if(myGeneration===sessionGeneration&&active){error('Sesión Live finalizada. '+(e?.reason||'Iniciá otra sesión.'));disconnect()}}
  }});
  if(myGeneration!==sessionGeneration){live.close();return}
  session=live;active=true;await startMicrophone();
  document.body.classList.add('connected');$('#desktop-connection').textContent='EN LÍNEA';$('#connection').textContent='EN LÍNEA';$('#connect').hidden=true;$('#disconnect').hidden=false;$('#mute').hidden=false;$('#textrow').hidden=false;
  message('TE ESCUCHO...');trackVoice();
 }catch(e){error(e?.message||'Error de inicio');await disconnect();message('NO SE PUDO CONECTAR. REVISÁ LA CONFIGURACIÓN.')}finally{$('#connect').disabled=false}
}
async function disconnect(){sessionGeneration++;active=false;clearTimeout(playbackTimer);cancelAnimationFrame(animFrame);stopPlayback();await stopMicrophone();try{session?.close()}catch{}session=null;if(voiceFxOsc){try{voiceFxOsc.stop();voiceFxOsc.disconnect()}catch{}voiceFxOsc=null}if(outCtx){await outCtx.close().catch(()=>{});outCtx=null}voiceAnalyser=null;robotDry=robotWet=robotModGain=robotModDepth=robotEcho=null;muted=false;document.body.classList.remove('connected');$('#desktop-connection').textContent='LISTO PARA CONECTAR';$('#connection').textContent='LISTO PARA CONECTAR';$('#connect').hidden=false;$('#disconnect').hidden=true;$('#mute').hidden=true;$('#textrow').hidden=true;$('#mute').textContent='MICRÓFONO: ACTIVADO';}
$('#connect').onclick=connect;$('#disconnect').onclick=async()=>{await disconnect();message('ACERCATE AL TERMINAL. TENEMOS QUE HABLAR.');reply.textContent='> SOY JOTAPE. ¿CÓMO ANDAMOS?';clearError()};
$('#mute').onclick=()=>{muted=!muted;$('#mute').textContent=muted?'MICRÓFONO: SILENCIADO':'MICRÓFONO: ACTIVADO';if(muted){try{session?.sendRealtimeInput({audioStreamEnd:true})}catch{}}};
$('#send').onclick=()=>{const text=$('#text').value.trim();if(!text||!session)return;$('#text').value='';reply.textContent='> '+text;session.sendClientContent({turns:[{role:'user',parts:[{text}]}],turnComplete:true})};
$('#text').addEventListener('keydown',e=>{if(e.key==='Enter')$('#send').click()});
(async()=>{try{const r=await fetch('/api/status');const s=await r.json();$('#connection').textContent=s.configured?'LISTO PARA CONECTAR':'CONFIGURACIÓN INCOMPLETA';$('#desktop-connection').textContent=$('#connection').textContent}catch{$('#connection').textContent='SERVIDOR NO DISPONIBLE';$('#desktop-connection').textContent='SERVIDOR NO DISPONIBLE'}})();
window.addEventListener('beforeunload',()=>{try{session?.close()}catch{}});
