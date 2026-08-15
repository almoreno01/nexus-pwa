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
  if(doc&&(view==="general"||view==="individual")&&!state.summary[doc.id]&&!state.loading[doc.id])loadSummary(doc);
};

render=function(){
  const app=document.getElementById("app");
  if(["home","add","menu","edit","delete-confirm"].includes(state.view))app.innerHTML=homeHtml()+overlayHtml();
  else if(state.view==="general"||state.view==="individual")app.innerHTML=statsPageHtml(state.view);
  else app.innerHTML=queryPageHtml();
};

homeHtml=function(){
  const cards=docs.length?'<div class="docs-grid">'+docs.map(doc=>{
    const summary=state.summary[doc.id];
    return '<article class="doc-card" data-open="'+esc(doc.id)+'"><div class="doc-top"><div class="doc-title-wrap"><h3 class="doc-title">'+esc(doc.name)+'</h3><div class="doc-kicker"><span class="dot"></span><span>Resumen general</span></div></div></div><div class="currency-grid">'+currencyHtml(doc)+'</div><div class="card-foot"><span class="'+(summary?.error?'status-error':'status-ok')+'">'+(state.loading[doc.id]?'Actualizando totales…':summary?.error?'No se pudo leer el documento':'Totales del documento')+'</span><span>•••</span></div></article>';
  }).join("")+'</div>':'<div class="empty"><div class="empty-icon">∑</div><h2>Aún no hay documentos</h2><p>Agrega tu primer Google Spreadsheet para comenzar a consultar estadísticas y ver los acumulados mensuales por moneda.</p><button class="btn btn-add" id="emptyAddBtn"><span class="add-icon">+</span><span class="add-label">Agregar documento</span></button></div>';
  return '<div class="app-shell"><header class="hero"><div class="hero-inner"><div class="brand"><div class="brand-mark">N</div><div class="brand-copy"><h1>Estadísticas Nexus</h1><p>Resumen y consulta de operaciones</p></div></div><button class="btn btn-add" id="addBtn"><span class="add-icon">+</span><span class="add-label">Agregar documento</span></button></div></header><main class="main"><div class="section-head"><div><h2 class="section-title">Documentos</h2></div></div>'+cards+'</main></div>';
};

addModalHtml=function(){
  return '<div class="modal-bg" id="modalBg"><div class="modal-card"><div class="modal-head"><h2>Agregar documento</h2><button class="btn-icon" data-close>×</button></div><div class="field"><label>Nombre</label><input id="docName" placeholder="Ej. Reporte mensual"></div><div class="field"><label>Enlace de Google Sheets</label><input id="docUrl" placeholder="Pega aquí el enlace de Google Sheets"></div><div class="note">El documento se guardará solamente en este dispositivo.</div><div class="modal-actions"><button class="btn btn-soft" data-close>Cancelar</button><button class="btn btn-blue" id="saveBtn">Guardar</button></div></div></div>';
};

function deleteConfirmHtml(){
  const d=state.current;
  if(!d)return "";
  return '<div class="modal-bg" id="deleteConfirmBg"><div class="modal-card delete-confirm-card"><div class="delete-confirm-icon">⌫</div><h2>Eliminar documento</h2><p>¿Seguro que quieres eliminar <strong>'+esc(d.name)+'</strong> de este dispositivo?</p><div class="modal-actions"><button class="btn btn-soft" data-close>Cancelar</button><button class="btn btn-danger" id="confirmDeleteBtn">Eliminar</button></div></div></div>';
}

overlayHtml=function(){
  if(state.view==="add")return addModalHtml();
  if(state.view==="menu")return menuHtml();
  if(state.view==="edit")return editModalHtml();
  if(state.view==="delete-confirm")return deleteConfirmHtml();
  return "";
};

generalStatsHtml=function(s){
  const days=s.daysInMonth||0;
  return '<div class="stats-card"><div class="stat-currency-grid">'+CURRENCIES.map(([code,label])=>{
    const total=s.totals[code]||0,avg=days?total/days:0;
    return '<div class="stat-currency"><h3>'+label+'</h3><div class="stat-main">'+money(total)+'</div><div class="stat-sub">Promedio diario: '+money(avg)+'</div></div>';
  }).join("")+'</div></div>';
};

individualStatsHtml=function(s){
  const days=s.daysInMonth||0,headers=CURRENCIES.map(([,label])=>'<th>'+label+'</th>').join("");
  const rows=(s.sheetNames||[]).map(name=>{
    const w=s.workers[name];
    if(!w)return "";
    const cells=CURRENCIES.map(([code])=>{
      const total=w.totals[code]||0,avg=days?total/days:0;
      return '<td><div class="ind-total">'+money(total)+'</div><div class="ind-avg">Prom. diario '+money(avg)+'</div></td>';
    }).join("");
    return '<tr><td class="worker-name">'+esc(name)+'</td>'+cells+'</tr>';
  }).join("");
  return '<div class="stats-card"><div class="table-wrap"><table><thead><tr><th>Hoja</th>'+headers+'</tr></thead><tbody>'+rows+'</tbody></table></div></div>';
};

document.addEventListener("click",function(e){
  const t=e.target;
  if(t.id==="backBtn"){
    e.preventDefault();
    e.stopImmediatePropagation();
    goHomeReplace();
    return;
  }
  const del=t.closest('[data-action="delete"]');
  if(del){
    e.preventDefault();
    e.stopImmediatePropagation();
    const d=state.current;
    if(d)route("delete-confirm",d.id,true);
    return;
  }
  if(t.id==="confirmDeleteBtn"){
    e.preventDefault();
    e.stopImmediatePropagation();
    const d=state.current;
    if(!d){goHomeReplace();return;}
    docs=docs.filter(x=>x.id!==d.id);
    delete state.summary[d.id];
    delete state.loading[d.id];
    delete state.filters[d.id];
    save();
    goHomeReplace();
    return;
  }
},true);

render();
