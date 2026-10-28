import {PDFDocument, rgb, degrees} from 'pdf-lib';
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
export async function annotatePdf(entry,state){
 const original=await PDFDocument.load(entry.bytes),pdf=await PDFDocument.create();
 const pages=await pdf.copyPages(original,state.pages.map(p=>p.original));const font=state.pages.some(p=>p.annotations.length)?await fontFor(pdf):null;
 pages.forEach((page,i)=>{
  const spec=state.pages[i];pdf.addPage(page);page.setRotation(degrees((page.getRotation().angle+spec.rotation)%360));
  const {width,height}=page.getSize();
  for(const note of spec.annotations){const color=note.color.replace('#','');const c=rgb(parseInt(color.slice(0,2),16)/255,parseInt(color.slice(2,4),16)/255,parseInt(color.slice(4,6),16)/255);
   page.drawText(clean(note.text),{x:width*note.x/100,y:height*(1-note.y/100)-note.size,size:note.size,font,color:c,maxWidth:width*(1-note.x/100)-10,lineHeight:note.size*1.3});
  }
 });return pdf.save();
}
