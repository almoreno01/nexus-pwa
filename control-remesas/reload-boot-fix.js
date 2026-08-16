(function(){
  function isBrowserReload(){
    let reload=false;
    try{
      const nav=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];
      if(nav&&nav.type==="reload")reload=true;
      else if(performance.navigation&&performance.navigation.type===1)reload=true;
    }catch(e){}
    try{
      const key="nexus_page_loaded_in_this_tab";
      const alreadyLoaded=sessionStorage.getItem(key)==="1";
      sessionStorage.setItem(key,"1");
      if(alreadyLoaded)reload=true;
    }catch(e){}
    return reload;
  }

  if(!isBrowserReload()||window.__nexusReloadRefreshStarted)return;

  window.__nexusReloadRefreshStarted=true;
  window.__nexusReloadRefreshComplete=false;
  window.__nexusReloadRefreshRunning=false;

  // En una recarga real conservamos únicamente los resúmenes de documentos
  // bloqueados. Los demás se recalculan desde cero.
  const preserved={};
  try{
    docs.forEach(doc=>{
      if(doc?.locked&&state.summary?.[doc.id])preserved[doc.id]=state.summary[doc.id];
    });
  }catch(e){}
  state.summary=preserved;
  state.loading={};

  const baseCurrencyHtml=currencyHtml;
  currencyHtml=function(doc){
    if(doc?.locked)return baseCurrencyHtml(doc);
    if(window.__nexusReloadRefreshStarted&&!window.__nexusReloadRefreshComplete){
      return CURRENCIES.map(([,label],i)=>{
        const cls=i===4?"currency-box wide":"currency-box";
        return '<div class="'+cls+'"><div class="currency-label">'+label+'</div><div class="currency-value loading">Actualizando…</div></div>';
      }).join("");
    }
    return baseCurrencyHtml(doc);
  };

  window.__nexusRunReloadRefresh=async function(){
    if(window.__nexusReloadRefreshRunning||window.__nexusReloadRefreshComplete)return;
    if(typeof window.refreshAllDocuments!=="function")return;
    window.__nexusReloadRefreshRunning=true;
    try{
      await window.refreshAllDocuments();
    }finally{
      window.__nexusReloadRefreshRunning=false;
      window.__nexusReloadRefreshComplete=true;
      render();
    }
  };
})();
