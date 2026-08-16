(function(){
  // Para estadísticas y consultas solo se necesitan A:D. Limitar el rango evita
  // descargar las 29 columnas completas de cada hoja activa.
  fetchSheetRows=async function(doc,sheet){
    const id=extractId(doc.url);
    if(!id)throw new Error("Enlace no válido");
    const url="https://docs.google.com/spreadsheets/d/"+encodeURIComponent(id)+
      "/gviz/tq?tqx=out:csv&sheet="+encodeURIComponent(sheet)+"&range=A:D&_="+Date.now();
    const r=await fetch(url,{cache:"no-store"});
    if(!r.ok)throw new Error("Google respondió "+r.status);
    const text=await r.text();
    if(/<!doctype html|<html/i.test(text)||/sign in|iniciar sesi[oó]n|request access|solicitar acceso/i.test(text)){
      throw new Error("El documento no tiene acceso por enlace");
    }
    return parseCSV(text);
  };

  function lockButton(doc){
    const locked=!!doc.locked;
    return '<button class="doc-lock '+(locked?'is-locked':'is-unlocked')+'" data-doc-lock="'+esc(doc.id)+'" type="button" aria-pressed="'+(locked?'true':'false')+'" title="'+(locked?'Desbloquear documento':'Bloquear documento')+'" aria-label="'+(locked?'Desbloquear documento':'Bloquear documento')+'">'+(locked?'🔒':'🔓')+'</button>';
  }

  homeHtml=function(){
    const cards=docs.length?'<div class="docs-grid">'+docs.map(doc=>{
      const summary=state.summary[doc.id];
      return '<article class="doc-card '+(doc.locked?'doc-card-locked':'')+'" data-open="'+esc(doc.id)+'">'+lockButton(doc)+'<div class="doc-top"><div class="doc-title-wrap"><h3 class="doc-title">'+esc(doc.name)+'</h3><div class="doc-kicker"><span class="dot"></span><span>Resumen general</span></div></div></div><div class="currency-grid">'+currencyHtml(doc)+'</div><div class="card-foot"><span class="'+(summary?.error?'status-error':'status-ok')+'">'+(state.loading[doc.id]?'Actualizando totales…':summary?.error?'No se pudo leer el documento':'Totales del documento')+'</span><span>•••</span></div></article>';
    }).join("")+'</div>':'<div class="empty"><div class="empty-icon">∑</div><h2>Aún no hay documentos</h2><p>Agrega tu primer Google Spreadsheet para comenzar a consultar estadísticas y ver los acumulados mensuales por moneda.</p><button class="btn btn-add" id="emptyAddBtn"><span class="add-icon">+</span><span class="add-label">Agregar documento</span></button></div>';
    return '<div class="app-shell"><header class="hero"><div class="hero-inner"><div class="brand"><div class="brand-mark brand-mark-logo">'+NEXUS_LOGO+'</div><div class="brand-copy"><h1>Nexus Stats</h1><p>Resumen y consulta de operaciones</p></div></div><button class="btn btn-add" id="addBtn"><span class="add-icon">+</span><span class="add-label">Agregar documento</span></button></div></header><main class="main"><div class="section-head"><div><h2 class="section-title">Documentos</h2></div></div>'+cards+'</main></div>';
  };

  function toggleDocumentLock(id){
    const doc=docs.find(d=>d.id===id);
    if(!doc)return;
    doc.locked=!doc.locked;
    save();
    render();
  }

  document.addEventListener('click',function(e){
    const btn=e.target.closest?.('[data-doc-lock]');
    if(!btn)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    toggleDocumentLock(btn.dataset.docLock);
  },true);

  const style=document.createElement('style');
  style.id='nexus-document-lock-style';
  style.textContent=`
    .doc-card{position:relative}
    .doc-title-wrap{padding-right:46px}
    .doc-lock{position:absolute;right:18px;top:18px;z-index:5;width:36px;height:36px;border:1px solid #dbe4f0;border-radius:12px;background:#f8fafc;display:grid;place-items:center;font-size:17px;line-height:1;cursor:pointer;box-shadow:0 4px 14px rgba(15,23,42,.07);transition:.16s ease;touch-action:manipulation}
    .doc-lock:hover{transform:translateY(-1px);background:#fff}
    .doc-lock.is-locked{background:#eef2ff;border-color:#c7d2fe}
    .doc-card-locked .dot{background:#64748b!important}
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  render();
})();
