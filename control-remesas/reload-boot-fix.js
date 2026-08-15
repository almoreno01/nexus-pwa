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

  // En una recarga real no mostramos datos guardados mientras se calcula de nuevo.
  state.summary={};
  state.loading={};

  const baseCurrencyHtml=currencyHtml;
  currencyHtml=function(doc){
    if(window.__nexusReloadRefreshStarted&&!window.__nexusReloadRefreshComplete){
      return CURRENCIES.map(([,label],i)=>{
        const cls=i===4?"currency-box wide":"currency-box";
        return '<div class="'+cls+'"><div class="currency-label">'+label+'</div><div class="currency-value loading">Actualizando…</div></div>';
      }).join("");
    }
    return baseCurrencyHtml(doc);
  };

  async function run(){
    try{
      if(typeof window.refreshAllDocuments==="function")await window.refreshAllDocuments();
    }finally{
      window.__nexusReloadRefreshComplete=true;
      render();
    }
  }

  run();
})();
