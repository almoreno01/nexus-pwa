const NEXUS_LOGO='<img class="nexus-app-logo" src="./app-icon.svg" alt="Estadísticas Nexus">';

homeHtml=function(){
  const cards=docs.length?'<div class="docs-grid">'+docs.map(doc=>{
    const summary=state.summary[doc.id];
    return '<article class="doc-card" data-open="'+esc(doc.id)+'"><div class="doc-top"><div class="doc-title-wrap"><h3 class="doc-title">'+esc(doc.name)+'</h3><div class="doc-kicker"><span class="dot"></span><span>Resumen general</span></div></div></div><div class="currency-grid">'+currencyHtml(doc)+'</div><div class="card-foot"><span class="'+(summary?.error?'status-error':'status-ok')+'">'+(state.loading[doc.id]?'Actualizando totales…':summary?.error?'No se pudo leer el documento':'Totales del documento')+'</span><span>•••</span></div></article>';
  }).join("")+'</div>':'<div class="empty"><div class="empty-icon">∑</div><h2>Aún no hay documentos</h2><p>Agrega tu primer Google Spreadsheet para comenzar a consultar estadísticas y ver los acumulados mensuales por moneda.</p><button class="btn btn-add" id="emptyAddBtn"><span class="add-icon">+</span><span class="add-label">Agregar documento</span></button></div>';
  return '<div class="app-shell"><header class="hero"><div class="hero-inner"><div class="brand"><div class="brand-mark brand-mark-logo">'+NEXUS_LOGO+'</div><div class="brand-copy"><h1>Estadísticas Nexus</h1><p>Resumen y consulta de operaciones</p></div></div><button class="btn btn-add" id="addBtn"><span class="add-icon">+</span><span class="add-label">Agregar documento</span></button></div></header><main class="main"><div class="section-head"><div><h2 class="section-title">Documentos</h2></div></div>'+cards+'</main></div>';
};

addModalHtml=function(){
  return '<div class="modal-bg" id="modalBg"><div class="modal-card"><div class="modal-head"><h2>Agregar documento</h2><button class="btn-icon" data-close>×</button></div><div class="field"><label>Nombre</label><input id="docName" placeholder="Nombre"></div><div class="field"><label>Enlace de Google Sheets</label><input id="docUrl" placeholder="Pega aquí el enlace de Google Sheets"></div><div class="modal-actions"><button class="btn btn-soft" data-close>Cancelar</button><button class="btn btn-blue" id="saveBtn">Guardar</button></div></div></div>';
};

pageHeader=function(subtitle){
  const d=state.current;
  return '<header class="detail-hero"><div class="detail-inner"><div class="back" id="backBtn">← Atrás</div><div class="detail-title"><div class="brand-mark brand-mark-logo">'+NEXUS_LOGO+'</div><div><h1>'+esc(d?.name||"")+'</h1><p>'+esc(subtitle)+'</p></div></div></div></header>';
};

function openAddImmediately(e){
  const target=e.target.closest&&e.target.closest('#addBtn,#emptyAddBtn');
  if(!target||state.view==='add')return;
  e.preventDefault();
  e.stopImmediatePropagation();
  route('add',null,true);
}

document.addEventListener('pointerdown',openAddImmediately,true);
document.addEventListener('touchstart',openAddImmediately,{capture:true,passive:false});

render();
