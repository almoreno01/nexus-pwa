const NEXUS_SHEET_CANDIDATES=[...new Set(ALL_SHEETS)];
const NEXUS_SUMMARY_CACHE_KEY="estadisticas_nexus_summary_v1";
try{
  const cached=JSON.parse(localStorage.getItem(NEXUS_SUMMARY_CACHE_KEY)||"{}");
  if(cached&&typeof cached==="object"&&!Array.isArray(cached))state.summary=cached;
}catch(e){}
function saveSummaryCache(){
  try{localStorage.setItem(NEXUS_SUMMARY_CACHE_KEY,JSON.stringify(state.summary||{}));}catch(e){}
}
function normalizeSheetName(v){return String(v||"").replace(/^\uFEFF/,"").replace(/[\u200B-\u200D\u2060]/g,"").trim().toLocaleUpperCase("es-MX");}
function sameSheetName(a,b){return normalizeSheetName(a)===normalizeSheetName(b);}
function markerMatchesRequestedSheet(marker,sheet){return sameSheetName(marker,sheet);}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function fetchVerifiedSheetRows(doc,sheet){let lastError=null;for(let attempt=0;attempt<3;attempt++){try{const rows=await fetchSheetRows(doc,sheet);const marker=rows&&rows[0]?rows[0][0]:"";if(!markerMatchesRequestedSheet(marker,sheet))throw new Error("La hoja solicitada no coincide con la hoja devuelta");return rows;}catch(e){lastError=e;if(attempt<2)await sleep(180*(attempt+1));}}throw lastError||new Error("No se pudo leer la hoja");}
function firstDateInRows(rows){for(const row of rows){const d=parseDateDMY(row[0]);if(d)return d;}return null;}
function monthDaysFromDate(d){return d?new Date(d.getFullYear(),d.getMonth()+1,0).getDate():0;}
async function fetchGvizJson(doc,sheet,range){
  const id=extractId(doc.url);
  if(!id)throw new Error("Enlace no válido");
  const url="https://docs.google.com/spreadsheets/d/"+encodeURIComponent(id)+"/gviz/tq?tqx=out:json&headers=0&range="+encodeURIComponent(range)+"&sheet="+encodeURIComponent(sheet);
  const r=await fetch(url,{cache:"no-store"});
  if(!r.ok)throw new Error("Google respondió "+r.status);
  const text=await r.text();
  if(/<!doctype html|<html/i.test(text)||/sign in|iniciar sesi[oó]n/i.test(text))throw new Error("El documento no tiene acceso por enlace");
  const start=text.indexOf("{"),end=text.lastIndexOf("}");
  if(start<0||end<=start)throw new Error("Respuesta de Google no válida");
  return JSON.parse(text.slice(start,end+1));
}
function checkboxIsChecked(payload){
  const cell=payload?.table?.rows?.[0]?.c?.[0];
  const values=[cell?.v,cell?.f].filter(v=>v!==undefined&&v!==null);
  return values.some(v=>{
    if(v===true||v===1)return true;
    const s=String(v).trim().toLocaleUpperCase("es-MX");
    return s==="TRUE"||s==="VERDADERO"||s==="1"||s==="SI"||s==="SÍ";
  });
}
async function inspectSheetActivation(doc,sheet){
  try{
    if(typeof probeRequestedSheet==="function"){
      const exists=await probeRequestedSheet(doc,sheet);
      if(!exists)return {exists:false,enabled:false};
    }
    const payload=await fetchGvizJson(doc,sheet,"U1:U1");
    if(payload.status&&payload.status!=="ok")return {exists:false,enabled:false};
    return {exists:true,enabled:checkboxIsChecked(payload)};
  }catch(e){
    return {exists:false,enabled:false,error:e};
  }
}
function defaultFilter(docId){
  const summary=state.summary[docId],actual=summary?.sheetNames||[];
  if(!state.filters[docId])state.filters[docId]={sheet:actual[0]||"",from:"2026-07-01",to:"2026-07-04",currency:"USA"};
  const f=state.filters[docId];
  if(actual.length&&!actual.includes(f.sheet))f.sheet=actual[0];
  if(!actual.length)f.sheet="";
  return f;
}
function generalStatsHtml(s){const days=s.daysInMonth||0;return '<div class="stats-card"><div class="stat-currency-grid">'+CURRENCIES.map(([code,label])=>{const total=s.totals[code]||0,avg=days?total/days:0;return '<div class="stat-currency"><h3>'+label+'</h3><div class="stat-main">'+money(total)+'</div><div class="stat-sub">Promedio diario: '+money(avg)+'</div></div>';}).join("")+'</div></div>';}
function individualStatsHtml(s){const days=s.daysInMonth||0,headers=CURRENCIES.map(([,label])=>'<th>'+label+'</th>').join("");const rows=(s.sheetNames||[]).map(name=>{const w=s.workers[name];if(!w)return "";const cells=CURRENCIES.map(([code])=>{const total=w.totals[code]||0,avg=days?total/days:0;return '<td><div class="ind-total">'+money(total)+'</div><div class="ind-avg">Prom. diario '+money(avg)+'</div></td>';}).join("");return '<tr><td class="worker-name">'+esc(name)+'</td>'+cells+'</tr>';}).join("");return '<div class="stats-card"><div class="table-wrap"><table><thead><tr><th>Hoja</th>'+headers+'</tr></thead><tbody>'+rows+'</tbody></table></div></div>';}
function queryPageHtml(){
  const d=state.current;if(!d)return homeHtml();
  const f=defaultFilter(d.id),summary=state.summary[d.id],sheetNames=summary?.sheetNames||[];
  const sheetOptions=sheetNames.length?sheetNames.map(s=>'<option '+(s===f.sheet?'selected':'')+'>'+esc(s)+'</option>').join(""):'<option value="">Sin hojas activas</option>';
  let result="";
  if(state.view==="result"&&state.rows){
    const r=state.rows,label=r.currency==="USA"?"USD":r.currency,trs=r.items.length?r.items.map(x=>'<tr><td>'+esc(x.date)+'</td><td>'+esc(x.currency==="USA"?'USD':x.currency)+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.name)+'</td></tr>').join(""):'<tr><td colspan="4">Sin resultados.</td></tr>';
    result='<div class="result-bg" id="resultBg"><div class="result-card"><div class="result-head"><div><h2>Resultado del filtro</h2><div class="result-sub">'+esc(r.sheet)+' · '+esc(r.from)+' → '+esc(r.to)+'</div></div><button class="btn-icon" id="closeResult">×</button></div><div class="metrics"><div class="metric"><span>OPERACIONES</span><strong>'+r.count+'</strong></div><div class="metric"><span>TOTAL COLUMNA C</span><strong>'+money(r.total)+'</strong></div><div class="metric"><span>MONEDA</span><strong>'+esc(label)+'</strong></div></div><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Moneda</th><th>Monto (C)</th><th>Nombre</th></tr></thead><tbody>'+trs+'</tbody></table></div></div></div>';
  }
  return '<div class="app-shell">'+pageHeader('Consulta detallada del documento')+'<main class="main"><div class="filters-card"><div class="filters"><div class="field wide"><label>Hoja</label><select id="sheet" '+(sheetNames.length?'':'disabled')+'>'+sheetOptions+'</select></div><div class="field"><label>Fecha inicial</label><input id="from" type="date" value="'+esc(f.from)+'"></div><div class="field"><label>Fecha final</label><input id="to" type="date" value="'+esc(f.to)+'"></div><div class="field"><label>Moneda</label><select id="currency">'+CURRENCIES.map(([code,label])=>'<option value="'+code+'" '+(code===f.currency?'selected':'')+'>'+label+'</option>').join("")+'</select></div><button class="btn btn-blue filter-action" id="filterBtn" '+(sheetNames.length?'':'disabled')+'>Filtrar</button></div></div></main>'+result+'</div>';
}
async function loadSummary(doc){
  if(state.loading[doc.id])return;
  state.loading[doc.id]=true;
  render();
  const totals={USA:0,EUR:0,MXC:0,CAD:0,REAL:0},workers={},sheetNames=[];
  let monthDate=null,realSheetCount=0;
  for(const sheet of NEXUS_SHEET_CANDIDATES){
    const status=await inspectSheetActivation(doc,sheet);
    if(!status.exists)continue;
    realSheetCount++;
    if(!status.enabled)continue;
    try{
      const rows=await fetchVerifiedSheetRows(doc,sheet),wt={USA:0,EUR:0,MXC:0,CAD:0,REAL:0};
      sheetNames.push(sheet);
      if(!monthDate)monthDate=firstDateInRows(rows);
      for(const row of rows){
        const code=String(row[1]||"").trim().toUpperCase(),raw=row[2];
        if(!Object.prototype.hasOwnProperty.call(totals,code))continue;
        if(raw==null||String(raw).trim()==="")continue;
        const amount=parseAmount(raw);
        totals[code]+=amount;
        wt[code]+=amount;
      }
      workers[sheet]={totals:wt};
    }catch(e){}
  }
  Object.keys(totals).forEach(k=>totals[k]=Math.round((totals[k]+Number.EPSILON)*100)/100);
  Object.values(workers).forEach(w=>Object.keys(w.totals).forEach(k=>w.totals[k]=Math.round((w.totals[k]+Number.EPSILON)*100)/100));
  const daysInMonth=monthDaysFromDate(monthDate);
  state.summary[doc.id]={totals,workers,sheetNames,daysInMonth,month:monthDate?monthDate.getMonth()+1:null,year:monthDate?monthDate.getFullYear():null,error:realSheetCount===0};
  state.loading[doc.id]=false;
  saveSummaryCache();
  const f=defaultFilter(doc.id);
  if(sheetNames.length&&!sheetNames.includes(f.sheet))f.sheet=sheetNames[0];
  render();
}
async function loadAllSummaries(){for(const doc of docs)await loadSummary(doc);}