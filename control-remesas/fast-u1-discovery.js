(function(){
  const slowDiscovery=window.discoverWorkbookSheets;
  const EXTRA_KNOWN_SHEETS=[
    "ROLY","ELIECER","SAMI","ERIC","PAPE","ANA BEATRIZ","MALCOLM","JAVIER-USA","JAVIER-PAISES"
  ];

  function normalize(v){
    return String(v||"").replace(/^\uFEFF/,"").replace(/[\u200B-\u200D\u2060]/g,"").trim().toLocaleUpperCase("es-MX");
  }

  function stripCopyPrefix(v){
    let s=normalize(v);
    while(s.startsWith("COPIA DE "))s=s.slice(9).trim();
    return s;
  }

  function markerMatchesSheet(marker,sheet){
    const a=normalize(marker),b=normalize(sheet);
    return a===b || (a && a===stripCopyPrefix(b));
  }

  function timeoutFetch(url,timeoutMs){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    return fetch(url,{cache:"no-store",signal:controller.signal}).finally(()=>clearTimeout(timer));
  }

  async function probeSheet(doc,sheet){
    const id=extractId(doc.url);
    if(!id)return {name:sheet,exists:false,enabled:false};
    const url="https://docs.google.com/spreadsheets/d/"+encodeURIComponent(id)+
      "/gviz/tq?tqx=out:csv&headers=0&range=A1:U1&sheet="+encodeURIComponent(sheet)+"&_="+Date.now();
    try{
      const r=await timeoutFetch(url,7000);
      if(!r.ok)return {name:sheet,exists:false,enabled:false};
      const text=await r.text();
      if(/<!doctype html|<html/i.test(text)||/sign in|iniciar sesi[oó]n|request access|solicitar acceso/i.test(text)){
        throw new Error("El documento no tiene acceso mediante vínculo");
      }
      const rows=parseCSV(text);
      const row=rows&&rows[0]?rows[0]:[];
      const marker=row[0]||"";
      if(!markerMatchesSheet(marker,sheet))return {name:sheet,exists:false,enabled:false};
      return {name:sheet,exists:true,enabled:checkboxValueIsChecked(row[20])};
    }catch(e){
      if(e&&e.name==="AbortError")return {name:sheet,exists:false,enabled:false};
      throw e;
    }
  }

  async function firstSheetMarker(doc){
    const id=extractId(doc.url);if(!id)return "";
    const url="https://docs.google.com/spreadsheets/d/"+encodeURIComponent(id)+
      "/gviz/tq?tqx=out:csv&headers=0&range=A1:A1&_="+Date.now();
    try{
      const r=await timeoutFetch(url,7000);if(!r.ok)return "";
      const rows=parseCSV(await r.text());return rows&&rows[0]?String(rows[0][0]||"").trim():"";
    }catch(e){return "";}
  }

  function candidateSheetNames(){
    const set=new Set([...(typeof ALL_SHEETS!=="undefined"?ALL_SHEETS:[]),...EXTRA_KNOWN_SHEETS]);
    try{
      Object.values(state.summary||{}).forEach(summary=>{
        (summary?.sheetNames||[]).forEach(name=>set.add(name));
      });
    }catch(e){}
    return [...set].filter(Boolean);
  }

  discoverWorkbookSheets=async function(doc){
    const candidates=candidateSheetNames();
    const first=await firstSheetMarker(doc);
    if(first&&!candidates.some(name=>normalize(name)===normalize(first)))candidates.unshift(first);

    const result=new Array(candidates.length);
    let cursor=0;
    const concurrency=Math.min(10,candidates.length||1);
    async function worker(){
      while(true){
        const index=cursor++;
        if(index>=candidates.length)return;
        result[index]=await probeSheet(doc,candidates[index]);
      }
    }
    await Promise.all(Array.from({length:concurrency},worker));

    const existing=result.filter(item=>item&&item.exists);
    if(existing.length)return existing;

    // Solo si el documento usa nombres de pestaña totalmente nuevos hacemos el
    // descubrimiento XLSX completo como respaldo.
    if(typeof slowDiscovery==="function")return slowDiscovery(doc);
    return [];
  };
})();
