(function(){
  function timeoutFetch(url, options, timeoutMs){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(), timeoutMs);
    return fetch(url,{...(options||{}),signal:controller.signal}).catch(err=>{
      if(err&&err.name==="AbortError")throw new Error("El documento tardó demasiado en responder");
      throw err;
    }).finally(()=>clearTimeout(timer));
  }

  async function readSheetU1(doc,sheet){
    const id=extractId(doc.url);
    if(!id)throw new Error("Enlace no válido");
    const url="https://docs.google.com/spreadsheets/d/"+encodeURIComponent(id)+
      "/gviz/tq?tqx=out:csv&headers=0&range=U1:U1&sheet="+encodeURIComponent(sheet)+
      "&_="+Date.now();
    const r=await timeoutFetch(url,{cache:"no-store"},10000);
    if(!r.ok)throw new Error("No se pudo comprobar U1 de "+sheet);
    const type=(r.headers.get("content-type")||"").toLowerCase();
    const text=await r.text();
    if(type.includes("text/html")||/<!doctype html|<html/i.test(text)||/sign in|iniciar sesi[oó]n|request access|solicitar acceso/i.test(text)){
      throw new Error("El documento no tiene acceso mediante vínculo");
    }
    const rows=parseCSV(text);
    return checkboxValueIsChecked(rows&&rows[0]?rows[0][0]:"");
  }

  discoverWorkbookSheets=async function(doc){
    const id=extractId(doc.url);
    if(!id)throw new Error("Enlace no válido");
    if(!window.XLSX)throw new Error("No se pudo cargar el lector de Google Sheets");

    const exportUrl="https://docs.google.com/spreadsheets/d/"+encodeURIComponent(id)+"/export?format=xlsx&_="+Date.now();
    const response=await timeoutFetch(exportUrl,{cache:"no-store"},25000);
    if(!response.ok)throw new Error("No se pudo leer la estructura del documento");
    const type=(response.headers.get("content-type")||"").toLowerCase();
    if(type.includes("text/html"))throw new Error("El documento no tiene acceso mediante vínculo");

    const data=await response.arrayBuffer();
    let workbook;
    try{
      workbook=XLSX.read(data,{bookSheets:true,bookProps:false});
    }catch(e){
      throw new Error("No se pudo leer la lista de hojas del documento");
    }

    const names=Array.isArray(workbook.SheetNames)?workbook.SheetNames:[];
    const result=new Array(names.length);
    let cursor=0;
    let failed=0;
    let firstError=null;
    const concurrency=Math.min(6,names.length||1);

    async function worker(){
      while(true){
        const index=cursor++;
        if(index>=names.length)return;
        const name=names[index];
        try{
          result[index]={name,enabled:await readSheetU1(doc,name)};
        }catch(e){
          failed++;
          if(!firstError)firstError=e;
          result[index]={name,enabled:false};
        }
      }
    }

    await Promise.all(Array.from({length:concurrency},worker));
    if(names.length&&failed===names.length){
      throw firstError||new Error("No se pudieron comprobar las hojas del documento");
    }
    return result;
  };
})();
