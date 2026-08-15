// Estadísticas Nexus: las estadísticas solo se recalculan al cargar/recargar la PWA.
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
};

applyHistory=function(h){
  const view=h?.nexus?h.view:"home";
  const doc=h?.docId?docs.find(d=>d.id===h.docId):null;
  state.view=doc||["home","add"].includes(view)?view:"home";
  state.current=doc||null;
  if(state.view!=="result")state.rows=state.view==="query"?state.rows:null;
  render();
};

document.addEventListener("click",function(e){
  const t=e.target;

  if(t.id==="saveBtn"){
    e.preventDefault();
    e.stopImmediatePropagation();
    const name=capName(document.getElementById("docName")?.value||"");
    const url=(document.getElementById("docUrl")?.value||"").trim();
    if(!name||!extractId(url)){
      alert("Escribe un nombre y un enlace válido de Google Sheets.");
      return;
    }
    const doc={id:"d"+Date.now(),name,url};
    docs.push(doc);
    save();
    state.summary[doc.id]=undefined;
    goHomeReplace();
    return;
  }

  if(t.id==="saveEditBtn"){
    e.preventDefault();
    e.stopImmediatePropagation();
    const name=capName(document.getElementById("editName")?.value||"");
    const url=(document.getElementById("editUrl")?.value||"").trim();
    if(!name||!extractId(url)){
      alert("Escribe un nombre y un enlace válido de Google Sheets.");
      return;
    }
    const d=docs.find(x=>x.id===state.current?.id);
    if(d){
      d.name=name;
      d.url=url;
      save();
    }
    goHomeReplace();
  }
},true);
