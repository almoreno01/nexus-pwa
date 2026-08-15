(function(){
  const HOME_CHART_CURRENCIES=[["USA","USD"],["EUR","EUR"],["MXC","MEX"],["CAD","CAD"],["REAL","REAL"]];
  if(!state.homeChartCurrency)state.homeChartCurrency="USA";

  route=function(view,docId,push=true){
    const previousView=state.view;
    const doc=docId?docs.find(d=>d.id===docId):null;
    state.view=view;
    state.current=doc||null;
    if(view!=="result")state.rows=view==="query"?state.rows:null;
    if(push){
      const payload={nexus:true,view,docId:doc?.id||null};
      const replaceFromMenu=previousView==="menu"&&["edit","general","individual","query","delete-confirm"].includes(view);
      if(replaceFromMenu)history.replaceState(payload,"",location.href);
      else history.pushState(payload,"",location.href);
    }
    render();
  };

  function chartRows(code){
    const rows=[];
    const showDocument=docs.length>1;
    docs.forEach(doc=>{
      const summary=state.summary[doc.id];
      (summary?.sheetNames||[]).forEach(sheet=>{
        rows.push({
          label:showDocument?doc.name+" · "+sheet:sheet,
          value:Number(summary?.workers?.[sheet]?.totals?.[code]||0)
        });
      });
    });
    return rows;
  }

  function chartHtml(){
    const code=state.homeChartCurrency||"USA";
    const rows=chartRows(code);
    const isLoading=docs.some(doc=>state.loading[doc.id]);
    const max=Math.max(1,...rows.map(row=>Math.abs(row.value)));
    const options=HOME_CHART_CURRENCIES.map(([value,label])=>'<option value="'+value+'" '+(value===code?'selected':'')+'>'+label+'</option>').join("");
    let body="";
    if(!rows.length){
      body='<div class="home-chart-empty">'+(isLoading?'Actualizando gráfico…':'No hay hojas activas para graficar.')+'</div>';
    }else{
      body='<div class="home-bars">'+rows.map(row=>{
        const pct=Math.max(0,Math.min(100,(Math.abs(row.value)/max)*100));
        return '<div class="home-bar-row"><div class="home-bar-label" title="'+esc(row.label)+'">'+esc(row.label)+'</div><div class="home-bar-track"><div class="home-bar-fill" style="--bar-width:'+pct.toFixed(2)+'%"></div></div><div class="home-bar-value">'+money(row.value)+'</div></div>';
      }).join("")+'</div>';
    }
    return '<section class="home-chart-card" id="homeCurrencyChart"><div class="home-chart-head"><div><h2>Comparación por hoja</h2><p>Cantidad de la moneda seleccionada en cada hoja</p></div><label class="home-chart-selector"><span>Moneda</span><select id="homeChartCurrency">'+options+'</select></label></div>'+body+'</section>';
  }

  function enhanceHome(){
    if(state.view!=="home")return;
    document.querySelectorAll('.doc-card .card-foot span').forEach(span=>{
      if(span.textContent.trim()==="Totales del documento")span.remove();
    });
    const main=document.querySelector('main.main');
    if(!main||!docs.length)return;
    document.getElementById('homeCurrencyChart')?.remove();
    main.insertAdjacentHTML('beforeend',chartHtml());
  }

  const baseRender=render;
  render=function(){
    baseRender();
    enhanceHome();
  };

  document.addEventListener('change',e=>{
    if(e.target.id!=="homeChartCurrency")return;
    state.homeChartCurrency=e.target.value;
    render();
  });

  enhanceHome();
})();
