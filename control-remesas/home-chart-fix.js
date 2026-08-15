(function(){
  const HOME_CHART_CURRENCIES=[["USA","USD"],["EUR","EUR"],["MXC","MEX"],["CAD","CAD"],["REAL","REAL"]];
  if(!state.homeChartCurrency)state.homeChartCurrency="USA";
  route=function(view,docId,push=true){
    const previousView=state.view;
    const doc=docId?docs.find(d=>d.id===docId):null;
    state.view=view;state.current=doc||null;
    if(view!=="result")state.rows=view==="query"?state.rows:null;
    if(push){
      const payload={nexus:true,view,docId:doc?.id||null};
      const replaceFromMenu=previousView==="menu"&&["edit","general","individual","query","delete-confirm"].includes(view);
      if(replaceFromMenu)history.replaceState(payload,"",location.href);else history.pushState(payload,"",location.href);
    }
    render();
  };
  function chartRows(code){
    return docs.map(doc=>({label:doc.name,value:Number(state.summary[doc.id]?.totals?.[code]||0)}));
  }
  function chartHtml(){
    const code=state.homeChartCurrency||"USA",rows=chartRows(code),isLoading=docs.some(doc=>state.loading[doc.id]),max=Math.max(1,...rows.map(row=>Math.abs(row.value)));
    const options=HOME_CHART_CURRENCIES.map(([value,label])=>'<option value="'+value+'" '+(value===code?'selected':'')+'>'+label+'</option>').join("");
    const body=!rows.length?'<div class="home-chart-empty">'+(isLoading?'Actualizando gráfico…':'No hay documentos para graficar.')+'</div>':'<div class="home-bars">'+rows.map(row=>{const pct=Math.max(0,Math.min(100,(Math.abs(row.value)/max)*100));return '<div class="home-bar-row"><div class="home-bar-label" title="'+esc(row.label)+'">'+esc(row.label)+'</div><div class="home-bar-track"><div class="home-bar-fill" style="--bar-width:'+pct.toFixed(2)+'%"></div></div><div class="home-bar-value">'+money(row.value)+'</div></div>';}).join("")+'</div>';
    return '<section class="home-chart-card" id="homeCurrencyChart"><div class="home-chart-head"><div><h2>Comparación por documento</h2><p>Cantidad de la moneda seleccionada en cada documento</p></div><label class="home-chart-selector"><span>Moneda</span><select id="homeChartCurrency">'+options+'</select></label></div>'+body+'</section>';
  }
  function makeLogoRefreshControl(){
    const logo=document.querySelector('.hero .brand-mark-logo');
    if(!logo)return;
    logo.id='refreshAllBtn';
    logo.classList.add('logo-refresh-control');
    logo.classList.toggle('is-refreshing',!!window.nexusManualRefreshing);
    logo.setAttribute('role','button');
    logo.setAttribute('tabindex','0');
    logo.setAttribute('title',window.nexusManualRefreshing?'Actualizando…':'Actualizar todo');
    logo.setAttribute('aria-label',window.nexusManualRefreshing?'Actualizando…':'Actualizar todo');
  }
  function enhanceHome(){
    if(state.view!=="home")return;
    document.querySelectorAll('.doc-card .card-foot span').forEach(span=>{if(span.textContent.trim()==="Totales del documento")span.remove();});
    document.getElementById('refreshAllBtn')?.closest?.('.btn-refresh')?.remove();
    makeLogoRefreshControl();
    const main=document.querySelector('main.main');if(!main||!docs.length)return;
    document.getElementById('homeCurrencyChart')?.remove();main.insertAdjacentHTML('beforeend',chartHtml());
  }
  const baseRender=render;render=function(){baseRender();enhanceHome();};
  document.addEventListener('change',e=>{if(e.target.id!=="homeChartCurrency")return;state.homeChartCurrency=e.target.value;render();});
  document.addEventListener('keydown',e=>{
    if(e.target.id!=="refreshAllBtn"||!(e.key==='Enter'||e.key===' '))return;
    e.preventDefault();
    e.target.click();
  });
  enhanceHome();
})();