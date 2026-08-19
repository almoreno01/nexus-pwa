'use strict';

(function(){
  const originalBind = bind;

  // 1) Tocar cualquier parte del documento abre directamente Consulta.
  openDoc = function(id){
    const d = docs.find(x=>x.id===id);
    if(!d) return;
    state.current = d;
    state.view = 'query';
    state.query = null;
    render();
  };

  // 2) El panel de los tres puntos solo contiene Editar y Eliminar.
  menuHtml = function(){
    const d = state.current;
    return `<div class="sheet-bg" id="docMenuBackdrop"><div class="bottom-sheet"><div class="sheet-handle"></div><div class="sheet-title"><h3>${esc(d.name)}</h3><p>Selecciona una opción</p></div><button class="sheet-option" data-action="edit"><span class="sheet-icon">✎</span><span><strong>Editar</strong><span>Cambiar nombre o enlace</span></span></button><button class="sheet-option danger" data-action="delete"><span class="sheet-icon">⌫</span><span><strong>Eliminar</strong><span>Quitar este documento</span></span></button></div></div>`;
  };

  // 3) La consulta no muestra ni columnas ni resúmenes de cantidad de operaciones.
  queryHtml = function(){
    const d = state.current, f = defaultFilter(d.id), q = state.query;
    let result = '';

    if(state.loading){
      result = '<div class="loading-block">Validando hojas activas y procesando únicamente esas hojas…</div>';
    }else if(q){
      const cols = q.currencies.length ? q.currencies : ['—'];
      const head = cols.map(c=>`<th>${esc(c)}</th>`).join('');
      const body = q.rows.map(r=>`<tr><td class="worker-name">${esc(r.sheet)}${r.error?`<div class="status-error">${esc(r.error)}</div>`:''}</td>${cols.map(c=>`<td>${c==='—'?'—':fmt(r.totals?.[c]||0)}</td>`).join('')}</tr>`).join('');
      const total = cols.map(c=>`<td>${c==='—'?'—':fmt(q.totals?.[c]||0)}</td>`).join('');
      result = `<div class="table-wrap"><table><thead><tr><th>Hoja</th>${head}</tr></thead><tbody>${body}<tr class="query-total-row"><td>TOTAL</td>${total}</tr></tbody></table></div>`;
    }

    return `<div class="app-shell"><header class="detail-hero"><div class="detail-inner"><div class="back" id="backHome">← Volver</div><div class="detail-title"><div><h1>${esc(d.name)}</h1><p>Consulta consolidada</p></div></div></div></header><main class="main"><section class="filters-card query-only-card"><div class="query-date-grid"><div class="field"><label>Fecha inicial</label><input type="date" id="from" value="${esc(f.from)}"></div><div class="field"><label>Fecha final</label><input type="date" id="to" value="${esc(f.to)}"></div><button class="btn btn-blue filter-action" id="queryBtn" ${state.loading?'disabled':''}>${state.loading?'Procesando…':'Consultar'}</button></div>${result}</section></main></div>`;
  };

  function closeDocMenu(fromHistory){
    if(state.view !== 'menu') return;

    // Si el panel creó una entrada de historial, al tocar fuera la retiramos
    // correctamente para que no quede un "Atrás" fantasma.
    if(!fromHistory && history.state && history.state.nexusConsultaOverlay === 'menu'){
      history.back();
      return;
    }

    state.view = 'home';
    state.current = null;
    state.query = null;
    render();
  }

  bind = function(){
    originalBind();

    // Los tres puntos son una zona independiente de la tarjeta.
    document.querySelectorAll('.doc-card .card-foot span:last-child').forEach(dot=>{
      dot.setAttribute('role','button');
      dot.setAttribute('aria-label','Opciones del documento');
      dot.style.cursor = 'pointer';
      dot.style.padding = '8px';
      dot.style.margin = '-8px';
      dot.onclick = function(e){
        e.preventDefault();
        e.stopPropagation();
        const card = dot.closest('[data-open]');
        const d = card ? docs.find(x=>x.id===card.dataset.open) : null;
        if(!d) return;
        state.current = d;
        state.view = 'menu';
        state.query = null;
        history.pushState({nexusConsultaOverlay:'menu'},'',location.href);
        render();
      };
    });

    // Tocar solamente el fondo oscuro, fuera del panel, lo cierra.
    const backdrop = document.getElementById('docMenuBackdrop');
    if(backdrop){
      backdrop.addEventListener('click',function(e){
        if(e.target === backdrop) closeDocMenu(false);
      });
    }
  };

  // El botón/gesto Atrás del navegador cierra primero el panel.
  window.addEventListener('popstate',()=>{
    if(state.view === 'menu') closeDocMenu(true);
  });

  // Re-render para aplicar los cambios sobre la pantalla ya creada por app.js.
  render();
})();
