// Estadísticas Nexus: actualización al abrir, añadir documento y hacer pull-to-refresh.
route=function(view,docId,push=true){
  const previousView=state.view;
  const doc=docId?docs.find(d=>d.id===docId):null;
  state.view=view;
  state.current=doc||null;
  if(view!=="result")state.rows=view==="query"?state.rows:null;
  if(push){
    const payload={nexus:true,view,docId:doc?.id||null};
    const replaceFromMenu=previousView==="menu"&&["edit","general","individual","query","delete-confirm"].includes(view);
    const replaceQueryResult=previousView==="query"&&view==="result";
    if(replaceFromMenu||replaceQueryResult)history.replaceState(payload,"",location.href);
    else history.pushState(payload,"",location.href);
  }
  render();
};

applyHistory=function(h){
  const view=h?.nexus?h.view:"home";
  const doc=h?.docId?docs.find(d=>d.id===h.docId):null;
  state.view=doc||["home","add"].includes(view)?view:"home";
  state.current=doc||null;
  if(state.view!=="result")state.rows=state.view==="query"?state.rows:null;
  render();
};

async function spreadsheetIsPublic(url){
  const id=extractId(url);
  if(!id)return false;
  try{
    const endpoint="https://docs.google.com/spreadsheets/d/"+encodeURIComponent(id)+"/gviz/tq?tqx=out:json&headers=0&range=A1:A1";
    const r=await fetch(endpoint,{cache:"no-store"});
    if(!r.ok)return false;
    const text=await r.text();
    if(/<!doctype html|<html/i.test(text)||/sign in|iniciar sesi[oó]n|request access|solicitar acceso/i.test(text))return false;
    const start=text.indexOf("{"),end=text.lastIndexOf("}");
    if(start<0||end<=start)return false;
    const payload=JSON.parse(text.slice(start,end+1));
    return !payload.status||payload.status==="ok";
  }catch(e){
    return false;
  }
}

function showPublicAccessWarning(){
  document.getElementById("publicAccessWarning")?.remove();
  const bg=document.createElement("div");
  bg.className="modal-bg";
  bg.id="publicAccessWarning";
  bg.innerHTML='<div class="modal-card access-warning-card"><div class="access-warning-icon">!</div><h2>No se puede leer el documento</h2><p>Para agregar este Google Sheet, activa el acceso <strong>Cualquier persona con el vínculo</strong> con permiso de <strong>Lector</strong>.</p><p class="access-warning-steps">Google Sheets → Compartir → Acceso general → Cualquier persona con el vínculo → Lector.</p><div class="modal-actions"><button class="btn btn-blue" id="closePublicAccessWarning">Entendido</button></div></div>';
  document.body.appendChild(bg);
}
document.addEventListener("click",e=>{
  if(e.target.id==="closePublicAccessWarning"||e.target.id==="publicAccessWarning"){
    document.getElementById("publicAccessWarning")?.remove();
  }
},true);

async function refreshDocument(doc){
  if(!doc||state.loading[doc.id])return;
  delete state.summary[doc.id];
  await loadSummary(doc);
}

let refreshAllRunning=false;
async function refreshAllDocuments(){
  if(refreshAllRunning)return;
  refreshAllRunning=true;
  try{
    for(const doc of docs){
      if(state.loading[doc.id])continue;
      delete state.summary[doc.id];
      await loadSummary(doc);
    }
  }finally{
    refreshAllRunning=false;
    render();
  }
}

document.addEventListener("click",async function(e){
  const t=e.target;

  if(t.id==="saveBtn"){
    e.preventDefault();
    e.stopImmediatePropagation();
    const name=capName(document.getElementById("docName")?.value||"");
    const url=(document.getElementById("docUrl")?.value||"").trim();
    if(!name||!extractId(url)){
      alert("Escribe un nombre y un enlace válido de Google Sheets.");
      return;
    }
    const btn=document.getElementById("saveBtn");
    if(btn){
      btn.disabled=true;
      btn.textContent="Comprobando…";
    }
    const canRead=await spreadsheetIsPublic(url);
    if(!canRead){
      if(btn){
        btn.disabled=false;
        btn.textContent="Guardar";
      }
      showPublicAccessWarning();
      return;
    }
    const doc={id:"d"+Date.now(),name,url};
    docs.push(doc);
    save();
    delete state.summary[doc.id];
    goHomeReplace();
    setTimeout(()=>refreshDocument(doc),0);
    return;
  }

  if(t.id==="saveEditBtn"){
    e.preventDefault();
    e.stopImmediatePropagation();
    const name=capName(document.getElementById("editName")?.value||"");
    const url=(document.getElementById("editUrl")?.value||"").trim();
    if(!name||!extractId(url)){
      alert("Escribe un nombre y un enlace válido de Google Sheets.");
      return;
    }
    const d=docs.find(x=>x.id===state.current?.id);
    if(d){
      d.name=name;
      d.url=url;
      save();
    }
    goHomeReplace();
  }
},true);

let wasHidden=false;
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="hidden"){
    wasHidden=true;
  }else if(wasHidden){
    wasHidden=false;
    refreshAllDocuments();
  }
});

let pullStartY=null;
let pullDistance=0;
document.addEventListener("touchstart",e=>{
  if(state.view!=="home"||window.scrollY>0||e.touches.length!==1)return;
  if(e.target.closest("button,input,select,.modal-bg,.bottom-sheet"))return;
  pullStartY=e.touches[0].clientY;
  pullDistance=0;
},{passive:true});
document.addEventListener("touchmove",e=>{
  if(pullStartY===null||e.touches.length!==1)return;
  pullDistance=Math.max(0,e.touches[0].clientY-pullStartY);
},{passive:true});
document.addEventListener("touchend",()=>{
  if(pullStartY!==null&&pullDistance>=85){
    refreshAllDocuments();
  }
  pullStartY=null;
  pullDistance=0;
},{passive:true});