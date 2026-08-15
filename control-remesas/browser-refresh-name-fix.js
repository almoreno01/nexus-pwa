(function(){
  capName=function(v){
    return String(v||"").trim();
  };

  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
    if(Array.isArray(saved)){
      docs=saved.map(d=>({...d,name:String(d?.name||"").trim()}));
    }
  }catch(e){}

  addModalHtml=function(){
    return '<div class="modal-bg" id="modalBg"><div class="modal-card"><div class="modal-head"><h2>Agregar documento</h2><button class="btn-icon" data-close>×</button></div><div class="field"><label>Nombre</label><input id="docName" placeholder="Nombre" autocapitalize="sentences"></div><div class="field"><label>Enlace de Google Sheets</label><input id="docUrl" placeholder="Pega aquí el enlace de Google Sheets"></div><div class="modal-actions"><button class="btn btn-soft" data-close>Cancelar</button><button class="btn btn-blue" id="saveBtn">Guardar</button></div></div></div>';
  };

  editModalHtml=function(){
    const d=state.current;
    return '<div class="modal-bg" id="modalBg"><div class="modal-card"><div class="modal-head"><h2>Editar documento</h2><button class="btn-icon" data-close>×</button></div><div class="field"><label>Nombre</label><input id="editName" value="'+esc(d?.name||"")+'" autocapitalize="sentences"></div><div class="field"><label>Enlace de Google Sheets</label><input id="editUrl" value="'+esc(d?.url||"")+'"></div><div class="modal-actions"><button class="btn btn-soft" data-close>Cancelar</button><button class="btn btn-blue" id="saveEditBtn">Guardar cambios</button></div></div></div>';
  };

  function isBrowserReload(){
    try{
      const nav=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];
      if(nav&&nav.type==="reload")return true;
      return !!(performance.navigation&&performance.navigation.type===1);
    }catch(e){
      return false;
    }
  }

  loadAllSummaries=async function(){};

  async function refreshOnReload(){
    if(!isBrowserReload()||window.__nexusReloadRefreshStarted)return;
    window.__nexusReloadRefreshStarted=true;
    if(typeof window.refreshAllDocuments!=="function")return;
    await window.refreshAllDocuments();
  }

  setTimeout(refreshOnReload,0);
  render();
})();
