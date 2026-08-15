async function probeRequestedSheet(doc,sheet){
  const id=extractId(doc.url);
  if(!id)throw new Error("Enlace no válido");
  const url="https://docs.google.com/spreadsheets/d/"+encodeURIComponent(id)+"/gviz/tq?tqx=out:json&headers=0&range=A1:A1&sheet="+encodeURIComponent(sheet);
  const r=await fetch(url,{cache:"no-store"});
  if(!r.ok)throw new Error("Google respondió "+r.status);
  const text=await r.text();
  if(/<!doctype html|<html/i.test(text)||/sign in|iniciar sesi[oó]n/i.test(text))throw new Error("El documento no tiene acceso por enlace");
  const start=text.indexOf("{"),end=text.lastIndexOf("}");
  if(start<0||end<=start)throw new Error("Respuesta de Google no válida");
  const payload=JSON.parse(text.slice(start,end+1));
  if(payload.status&&payload.status!=="ok")throw new Error("La hoja no existe en este documento");
  const values=[];
  const cell=payload&&payload.table&&payload.table.rows&&payload.table.rows[0]&&payload.table.rows[0].c&&payload.table.rows[0].c[0];
  if(cell){values.push(cell.v);values.push(cell.f);}
  const col=payload&&payload.table&&payload.table.cols&&payload.table.cols[0];
  if(col)values.push(col.label);
  return values.some(v=>typeof markerMatchesRequestedSheet==="function"?markerMatchesRequestedSheet(v,sheet):sameSheetName(v,sheet));
}

async function fetchVerifiedSheetRows(doc,sheet){
  let lastError=null;
  for(let attempt=0;attempt<3;attempt++){
    try{
      const exists=await probeRequestedSheet(doc,sheet);
      if(!exists)throw new Error("La hoja solicitada no coincide con la hoja devuelta");
      return await fetchSheetRows(doc,sheet);
    }catch(e){
      lastError=e;
      if(attempt<2)await sleep(180*(attempt+1));
    }
  }
  throw lastError||new Error("No se pudo leer la hoja");
}
