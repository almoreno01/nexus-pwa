(function(){
  const previousLoadAllSummaries=loadAllSummaries;
  loadAllSummaries=async function(){};

  function isBrowserReload(){
    try{
      const nav=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];
      if(nav&&nav.type==="reload")return true;
      return !!(performance.navigation&&performance.navigation.type===1);
    }catch(e){return false;}
  }

  async function runReloadRefreshOnce(){
    if(!isBrowserReload()||window.__nexusReloadRefreshStarted)return;
    window.__nexusReloadRefreshStarted=true;
    if(typeof window.refreshAllDocuments!=="function")return;
    await window.refreshAllDocuments();
  }

  setTimeout(runReloadRefreshOnce,0);
})();
