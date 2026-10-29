import {PDFDocument, rgb, degrees, PDFTextField, PDFCheckBox, PDFDropdown, PDFOptionList} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as pdfjs from 'pdfjs-dist';
import JSZip from 'jszip';
import {extractRawText} from 'mammoth/mammoth.browser.js';
import {Document, Packer, Paragraph, TextRun} from 'docx';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('./pdf.worker.min.mjs',import.meta.url).href;
export {pdfjs};
export const MAX_PAGES=300;
export const extension=name=>name.split('.').pop().toLowerCase();
const clean=text=>text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
let fontBytes;
async function fontFor(pdf){pdf.registerFontkit(fontkit);fontBytes??=fetch(new URL('./document-font.ttf',import.meta.url)).then(r=>{if(!r.ok)throw Error('La police du document n’a pas pu être chargée. Réessayez.');return r.arrayBuffer()});return pdf.embedFont(await fontBytes,{subset:true})}
export async function openPdf(bytes){
 const task=pdfjs.getDocument({data:bytes.slice(),isEvalSupported:false,useSystemFonts:true});
 task.onPassword=()=>{task.destroy();};
 try {const doc=await task.promise;if(doc.numPages>MAX_PAGES){await doc.destroy();throw Error(`Limite : ${MAX_PAGES} pages par opération.`)}return doc;}
 catch(error){if(/password|destroyed/i.test(error.message))throw Error('Ce PDF est protégé par un mot de passe. Utilisez une copie déverrouillée.');throw error;}
}
export async function inspectFile(file){
 const ext=extension(file.name),bytes=new Uint8Array(await file.arrayBuffer());
 const entry={file,name:file.name,size:file.size,ext,bytes,pages:null};
 if(ext==='pdf'){
  try{const pdf=await PDFDocument.load(bytes);entry.pages=pdf.getPageCount();if(entry.pages>MAX_PAGES)throw Error(`Limite : ${MAX_PAGES} pages par PDF.`);}
  catch(error){if(/encrypt/i.test(error.message))throw Error('PDF protégé : importez une copie sans mot de passe.');throw Error(error.message.startsWith('Limite')?error.message:'Ce fichier n’est pas un PDF lisible ou il est endommagé.');}
 }else if(ext==='docx'){
  try{const zip=await JSZip.loadAsync(bytes);let size=0;Object.values(zip.files).forEach(x=>{size+=x._data?.uncompressedSize||0});if(size>100*1024*1024)throw Error('large');if(!zip.file('word/document.xml'))throw Error('invalid');}
  catch{throw Error('Document DOCX invalide, endommagé ou trop volumineux une fois décompressé.');}
 }else if(['png','jpg','jpeg'].includes(ext)){
  let image;try{image=await createImageBitmap(file);}catch{throw Error('Cette image ne peut pas être lue. Utilisez un fichier JPG ou PNG valide.');}if(image.width*image.height>40_000_000){image.close();throw Error('Image trop grande : 40 millions de pixels maximum.');}image.close();
 }else if(ext!=='txt')throw Error('Format non pris en charge.');
 return entry;
}
export async function extractText(entry,onProgress=()=>{}){
 if(entry.ext==='txt')return clean(new TextDecoder().decode(entry.bytes));
 if(entry.ext==='docx'){const result=await extractRawText({arrayBuffer:entry.bytes.slice().buffer});return clean(result.value);}
 if(entry.ext!=='pdf')throw Error('Choisissez un PDF, un DOCX ou un TXT pour extraire le texte.');
 const pdf=await openPdf(entry.bytes);const sections=[];
 try{for(let i=1;i<=pdf.numPages;i++){
  const page=await pdf.getPage(i);const content=await page.getTextContent();let text='',lastY=null;
  for(const item of content.items){if(!('str'in item))continue;const y=item.transform?.[5];if(lastY!==null&&Math.abs(y-lastY)>3&&!text.endsWith('\n'))text+='\n';text+=item.str+(item.hasEOL?'\n':' ');lastY=y;}
  sections.push(text.trim());page.cleanup();onProgress(Math.round(i/pdf.numPages*100));
 }return clean(sections.join('\n\n'));}finally{await pdf.destroy();}
}
export async function mergePdfs(entries,onProgress=()=>{}){
 const result=await PDFDocument.create();let total=0;
 for(let i=0;i<entries.length;i++){const pdf=await PDFDocument.load(entries[i].bytes);total+=pdf.getPageCount();if(total>MAX_PAGES)throw Error(`La fusion est limitée à ${MAX_PAGES} pages.`);const pages=await result.copyPages(pdf,pdf.getPageIndices());pages.forEach(p=>result.addPage(p));onProgress((i+1)/entries.length*100);}
 return result.save();
}
export async function imagesToPdf(entries,onProgress=()=>{}){
 const pdf=await PDFDocument.create();
 for(let i=0;i<entries.length;i++){
  const e=entries[i];const image=e.ext==='png'?await pdf.embedPng(e.bytes):await pdf.embedJpg(e.bytes);
  const landscape=image.width>image.height;const width=landscape?841.89:595.28,height=landscape?595.28:841.89;
  const scale=Math.min((width-48)/image.width,(height-48)/image.height);const w=image.width*scale,h=image.height*scale;
  pdf.addPage([width,height]).drawImage(image,{x:(width-w)/2,y:(height-h)/2,width:w,height:h});onProgress((i+1)/entries.length*100);
 }return pdf.save();
}
export async function textToPdf(text){
 if(text.length>500000)throw Error('Le texte est limité à 500 000 caractères.');
 const pdf=await PDFDocument.create(),font=await fontFor(pdf);const size=11,lineHeight=17,width=595.28,height=841.89,margin=48,maxWidth=width-2*margin;
 let page=pdf.addPage([width,height]),y=height-margin;
 const draw=line=>{if(y<margin){if(pdf.getPageCount()>=MAX_PAGES)throw Error('Le document dépasse 300 pages.');page=pdf.addPage([width,height]);y=height-margin;}if(line)page.drawText(line,{x:margin,y,font,size,color:rgb(.13,.16,.22)});y-=lineHeight;};
 for(const paragraph of clean(text).replace(/\t/g,'    ').split(/\r?\n/)){
  if(!paragraph){draw('');continue;}
  let line='';
  for(const word of paragraph.split(' ')){
   const candidate=line?line+' '+word:word;
   if(font.widthOfTextAtSize(candidate,size)<=maxWidth){line=candidate;continue;}
   if(line){draw(line);line='';}
   for(const char of word){if(font.widthOfTextAtSize(line+char,size)>maxWidth){draw(line);line='';}line+=char;}
  }draw(line);
 }return pdf.save();
}
export async function textToDocx(text){
 if(text.length>500000)throw Error('Le texte est limité à 500 000 caractères.');
 return Packer.toBlob(new Document({sections:[{children:clean(text).split(/\r?\n/).map(line=>new Paragraph({children:[new TextRun(line)]}))}]}));
}
export async function pdfToImages(entry,onProgress=()=>{}){
 const pdf=await openPdf(entry.bytes),zip=new JSZip();
 try{if(pdf.numPages>150)throw Error('L’export en images est limité à 150 pages.');
  for(let i=1;i<=pdf.numPages;i++){
   const page=await pdf.getPage(i),base=page.getViewport({scale:1}),scale=Math.min(1.6,2200/Math.max(base.width,base.height));const viewport=page.getViewport({scale});
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
   await page.render({canvasContext:canvas.getContext('2d'),viewport,background:'white'}).promise;
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Impossible de créer cette image.');
   zip.file(`page-${String(i).padStart(3,'0')}.png`,await blob.arrayBuffer());canvas.width=canvas.height=0;page.cleanup();onProgress(i/pdf.numPages*90);
  }return zip.generateAsync({type:'blob'});
 }finally{await pdf.destroy();}
}
// Text corrections flatten only the affected page, preserving its appearance while
// excluding its original content stream from the output (unlike a white overlay).
export async function rasterPage(entry,index,{quality=1,maxDimension=2600,type='image/png'}={}){
 const source=await openPdf(entry.bytes);
 try{const page=await source.getPage(index+1),base=page.getViewport({scale:1,rotation:0}),viewport=page.getViewport({scale:Math.min(2,maxDimension/Math.max(base.width,base.height)),rotation:0});
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
 await page.render({canvasContext:canvas.getContext('2d'),viewport,background:'white'}).promise;
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,type,quality));if(!blob)throw Error('Rendu de page indisponible.');
 const bytes=new Uint8Array(await blob.arrayBuffer());canvas.width=canvas.height=0;return {bytes,width:base.width,height:base.height};
 }finally{await source.destroy();}
}
const pdfColor=hex=>{const c=hex.replace('#','');return rgb(parseInt(c.slice(0,2),16)/255,parseInt(c.slice(2,4),16)/255,parseInt(c.slice(4,6),16)/255)};
export async function annotatePdf(entry,state){
 const original=await PDFDocument.load(entry.bytes),pdf=await PDFDocument.create();
 const font=state.pages.some(p=>p.annotations.some(n=>n.text?.trim()))?await fontFor(pdf):null;
 for(const spec of state.pages){
  const corrections=spec.annotations.filter(n=>n.kind==='replace'||n.kind==='redact');let page;
  if(corrections.length){
   const source=original.getPage(spec.original),media=source.getMediaBox(),crop=source.getCropBox();
   const raster=await rasterPage(entry,spec.original);const image=await pdf.embedPng(raster.bytes);
   page=pdf.addPage([media.width,media.height]);page.setMediaBox(media.x,media.y,media.width,media.height);page.setCropBox(crop.x,crop.y,crop.width,crop.height);page.setRotation(source.getRotation());
   page.drawImage(image,{x:crop.x,y:crop.y,width:crop.width,height:crop.height});
   for(const note of corrections){const [x,y,w,h]=note.rect;page.drawRectangle({x,y,width:w,height:h,color:pdfColor(note.kind==='redact'?'#000000':note.background||'#ffffff')});}
  }else{[page]=await pdf.copyPages(original,[spec.original]);pdf.addPage(page);}
  page.setRotation(degrees((page.getRotation().angle+spec.rotation)%360));
  const {x:cropX,y:cropY,width,height}=page.getCropBox();
  for(const note of spec.annotations){if(!note.text?.trim()||note.kind==='redact')continue;
   const pos=note.kind==='replace'?{x:note.baseline[0],y:note.baseline[1]}:{x:cropX+width*note.x/100,y:cropY+height*(1-note.y/100)-note.size};
   const fittedSize=note.kind==='replace'?Math.min(note.size,note.rect[2]/Math.max(1,font.widthOfTextAtSize(clean(note.text),1))):note.size;if(fittedSize<5)throw Error('La correction est trop longue pour cette zone. Raccourcissez le texte.');
   page.drawText(clean(note.text),{...pos,size:fittedSize,font,color:pdfColor(note.color),maxWidth:note.kind==='replace'?note.rect[2]:width*(1-note.x/100)-10,lineHeight:note.size*1.3});
  }
 }return pdf.save();
}
export async function textRegions(entry,index){
 const pdf=await openPdf(entry.bytes);try{const page=await pdf.getPage(index+1),content=await page.getTextContent();
 return content.items.filter(i=>i.str?.trim()&&Math.abs(i.transform[1])<.1&&Math.abs(i.transform[2])<.1).map(i=>{const size=Math.hypot(i.transform[2],i.transform[3]);const ascent=content.styles[i.fontName]?.ascent??.8;return {text:i.str,rect:[i.transform[4]-.5,i.transform[5]-(1-ascent)*size-1,i.width+1,size+2],baseline:[i.transform[4],i.transform[5]],size};});
 }finally{await pdf.destroy();}
}
export function parsePageRange(value,total){
 if(!value.trim())return Array.from({length:total},(_,i)=>i);const result=[];
 for(const part of value.split(',')){const m=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!m)throw Error('Pages invalides. Exemple : 1-3, 5, 8.');const a=Number(m[1]),b=Number(m[2]||m[1]);if(a<1||b<a||b>total)throw Error('La sélection dépasse le document ou contient un intervalle inversé.');for(let i=a;i<=b;i++)if(!result.includes(i-1))result.push(i-1);}
 return result;
}
export async function selectPdfPages(entry,indices){const src=await PDFDocument.load(entry.bytes),out=await PDFDocument.create();if(!indices.length)throw Error('Conservez au moins une page.');for(const p of await out.copyPages(src,indices))out.addPage(p);return out.save();}
export async function splitPdf(entry,indices){const zip=new JSZip();for(const i of indices)zip.file(`page-${String(i+1).padStart(3,'0')}.pdf`,await selectPdfPages(entry,[i]));return zip.generateAsync({type:'blob'});}
export async function stampPdf(entry,options){
 const pdf=await PDFDocument.load(entry.bytes),font=await fontFor(pdf);const indices=options.indices||pdf.getPageIndices();
 indices.forEach((i,n)=>{const page=pdf.getPage(i),{x,y,width,height}=page.getCropBox();
 if(options.watermark){const size=options.fontSize||30,text=options.watermark;page.drawText(text,{x:x+Math.max(10,(width-font.widthOfTextAtSize(text,size))/2),y:y+height/2,font,size,color:pdfColor(options.color||'#888888'),opacity:.25,rotate:degrees(30)});}
 if(options.number){const text=`${n+1} / ${indices.length}`,size=10;page.drawText(text,{x:x+(width-font.widthOfTextAtSize(text,size))/2,y:y+18,font,size,color:rgb(.25,.25,.25)});}
 });return pdf.save();
}
export async function cropPdf(entry,margin,indices){const pdf=await PDFDocument.load(entry.bytes);for(const i of indices){const p=pdf.getPage(i),c=p.getCropBox();if(margin*2>=Math.min(c.width,c.height))throw Error('Les marges dépassent les dimensions de la page.');p.setCropBox(c.x+margin,c.y+margin,c.width-margin*2,c.height-margin*2);}return pdf.save();}
export async function compressPdf(entry,quality,onProgress=()=>{}){
 const original=await PDFDocument.load(entry.bytes),pdf=await PDFDocument.create();if(original.getPageCount()>80)throw Error('Compression limitée à 80 pages.');
 for(let i=0;i<original.getPageCount();i++){const src=original.getPage(i),r=await rasterPage(entry,i,{quality,maxDimension:quality>.65?2200:1500,type:'image/jpeg'});const img=await pdf.embedJpg(r.bytes),c=src.getCropBox(),p=pdf.addPage([c.width,c.height]);p.drawImage(img,{x:0,y:0,width:c.width,height:c.height});p.setRotation(src.getRotation());onProgress((i+1)/original.getPageCount()*100);}return pdf.save();
}
export async function signPdf(entry,png,{page:pageIndex,x,y,width}){const pdf=await PDFDocument.load(entry.bytes),image=await pdf.embedPng(png),p=pdf.getPage(pageIndex),c=p.getCropBox(),w=c.width*width/100,h=w*image.height/image.width;p.drawImage(image,{x:c.x+c.width*x/100,y:c.y+c.height*(1-y/100)-h,width:w,height:h});return pdf.save();}
export async function formFields(entry){const pdf=await PDFDocument.load(entry.bytes);return pdf.getForm().getFields().map(f=>({name:f.getName(),type:f instanceof PDFTextField?'PDFTextField':f instanceof PDFCheckBox?'PDFCheckBox':f instanceof PDFDropdown?'PDFDropdown':f instanceof PDFOptionList?'PDFOptionList':'Autre',value:typeof f.getText==='function'?f.getText()||'':typeof f.isChecked==='function'?f.isChecked():typeof f.getSelected==='function'?f.getSelected().join(', '):'',options:typeof f.getOptions==='function'?f.getOptions():[]}));}
export async function fillForm(entry,values){const pdf=await PDFDocument.load(entry.bytes),form=pdf.getForm();for(const [name,value]of Object.entries(values)){const f=form.getField(name);if(typeof f.setText==='function')f.setText(String(value));else if(typeof f.check==='function'){value?f.check():f.uncheck();}else if(typeof f.select==='function'&&value)f.select(String(value));}form.updateFieldAppearances(await fontFor(pdf));return pdf.save();}
export async function inspectPdf(entry){const pdf=await PDFDocument.load(entry.bytes);return {name:entry.name,size:entry.size,pages:pdf.getPageCount(),title:pdf.getTitle()||'',author:pdf.getAuthor()||'',subject:pdf.getSubject()||'',keywords:pdf.getKeywords()||'',forms:pdf.getForm().getFields().length,dimensions:pdf.getPages().map((p,i)=>({page:i+1,...p.getCropBox(),rotation:p.getRotation().angle}))};}
export async function cleanMetadata(entry){const src=await PDFDocument.load(entry.bytes),out=await PDFDocument.create();for(const p of await out.copyPages(src,src.getPageIndices()))out.addPage(p);out.setTitle('');out.setAuthor('');out.setSubject('');out.setKeywords([]);out.setCreator('DocFlow');out.setProducer('DocFlow');return out.save();}
