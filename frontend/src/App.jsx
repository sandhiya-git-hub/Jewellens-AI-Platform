import { useState, useEffect, useRef, useCallback } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Jost:wght@300;400;500;600&family=Pinyon+Script&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --gold:#B8870C; --gold-lt:#D4A84B; --gold-pale:#F3E7C8; --gold-dark:#8B6509;
    --onyx:#0D0D0D; --charcoal:#1C1C1C; --graphite:#383838; --smoke:#6A6A6A;
    --ivory:#FAF8F3; --cream:#EDE8DC; --pearl:#FDFCF9; --linen:#F5F0E8;
    --error:#B94040; --success:#2A6B45;
    --r:4px; --r-md:8px; --r-lg:12px;
    --shadow:0 4px 24px rgba(0,0,0,.08);
    --shadow-g:0 6px 28px rgba(184,134,11,.18);
    --shadow-card:0 2px 16px rgba(0,0,0,.06);
  }
  html { font-size:16px; scroll-behavior:smooth; }
  body { background:var(--ivory); color:var(--charcoal); font-family:'Jost',sans-serif; min-height:100vh; overflow-x:hidden; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:var(--cream); }
  ::-webkit-scrollbar-thumb { background:var(--gold-lt); border-radius:2px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes slideIn { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
  @keyframes growIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
  @keyframes chatDot { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 12px rgba(184,134,11,.3)} 50%{box-shadow:0 0 28px rgba(184,134,11,.6)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  .fade-up { animation:fadeUp .5s ease both; }
  .grow-in { animation:growIn .4s ease both; }
  .slide-in { animation:slideIn .4s ease both; }
  .fade-in { animation:fadeIn .5s ease both; }
  input,textarea,select { font-family:'Jost',sans-serif; font-size:14px; }
  button { font-family:'Jost',sans-serif; }
  .jewelry-card { background:var(--pearl); border-radius:var(--r-lg); overflow:hidden; border:1px solid var(--cream); transition:all .3s ease; cursor:pointer; box-shadow:var(--shadow-card); }
  .jewelry-card:hover { transform:translateY(-4px); box-shadow:var(--shadow-g); border-color:rgba(184,134,11,.3); }
  .jewelry-card img { width:100%; height:240px; object-fit:cover; transition:transform .6s ease; display:block; }
  .jewelry-card:hover img { transform:scale(1.05); }
  .tab-btn { background:none; border:none; padding:10px 22px; font-size:11px; font-weight:500; letter-spacing:2px; text-transform:uppercase; cursor:pointer; color:var(--smoke); border-bottom:1.5px solid transparent; transition:all .2s; }
  .tab-btn.active { color:var(--gold); border-bottom-color:var(--gold); }
  .typing-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--gold); animation:chatDot 1.2s ease-in-out infinite; margin:0 2px; }
  .typing-dot:nth-child(2) { animation-delay:.2s }
  .typing-dot:nth-child(3) { animation-delay:.4s }
  .skeleton { background:linear-gradient(90deg,var(--cream) 25%,var(--linen) 50%,var(--cream) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:var(--r-md); }
`;

function injectStyles() {
  if (document.getElementById("tanishq-styles")) return;
  const el = document.createElement("style");
  el.id = "tanishq-styles";
  el.textContent = STYLES;
  document.head.appendChild(el);
}

const API = "http://localhost:8000";

function Icon({ name, size=16, color="currentColor" }) {
  const p = { fill:"none", stroke:color, strokeWidth:"1.5", strokeLinecap:"round", strokeLinejoin:"round" };
  if (name==="heart") return <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
  if (name==="heartFill") return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
  if (name==="cart") return <svg width={size} height={size} viewBox="0 0 24 24" {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
  if (name==="search") return <svg width={size} height={size} viewBox="0 0 24 24" {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
  if (name==="mic") return <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
  if (name==="stop") return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
  if (name==="upload") return <svg width={size} height={size} viewBox="0 0 24 24" {...p}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;
  if (name==="star") return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
  if (name==="check") return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
  if (name==="arrowLeft") return <svg width={size} height={size} viewBox="0 0 24 24" {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
  if (name==="x") return <svg width={size} height={size} viewBox="0 0 24 24" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
  if (name==="eye") return <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
  if (name==="minus") return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
  if (name==="plus") return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
  if (name==="gem") return <svg width={size} height={size} viewBox="0 0 24 24" {...p}><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="2"/><path d="M22 8.5 12 15 2 8.5"/></svg>;
  if (name==="send") return <svg width={size} height={size} viewBox="0 0 24 24" {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
  if (name==="chat") return <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
  if (name==="phone") return <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
  if (name==="mail") return <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
  if (name==="user") return <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  if (name==="map") return <svg width={size} height={size} viewBox="0 0 24 24" {...p}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;
  return null;
}

const RING_NAMES = ["Lumiere Solitaire Ring","Florette Gold Band","Eclat Emerald Cluster","Rosette Heart Ring","Marigold Temple Ring","Celestial Platinum Ring","Sapphire Halo Ring","Eternite Diamond Band","Meenakari Enamel Ring","Jadau Bridal Ring","Pearl Blossom Ring","Filigree Gold Ring","Ruby Cluster Band","Pave Diamond Ring","Twisted Gold Band","Vintage Sapphire Ring","Leaf Motif Gold Ring","Diamond Cocktail Ring","Antique Gold Ring","Emerald Marquise Ring","Rope Twist Band","Oval Ruby Solitaire","Trilogy Diamond Ring","Kundan Floral Ring","Polished Gold Band","Enamel Jadau Ring","Diamond Heart Ring","Granule Gold Ring","Marquise Diamond Ring","Sapphire Cluster Ring","Baguette Diamond Ring","Chevron Gold Band","Baroque Pearl Ring","Florentine Motif Ring","Channel Set Diamond Ring","Bezel Solitaire Ring","Princess Cut Solitaire","Cushion Halo Ring","Eternity Diamond Ring","Floral Pave Ring","Tapered Diamond Ring"];
const NECKLACE_NAMES = ["Lumiere Pendant Necklace","Diamond Solitaire Chain","Kundan Polki Temple Necklace","Layered Gold Leaf Necklace","Pearl Mangalsutra","Rose Gold Bar Pendant","Antique Jadau Necklace","Ruby Temple Necklace","Emerald Drop Necklace","Heritage Bridal Necklace","Baguette Diamond Necklace","Gold Charm Chain","Sapphire Pendant Chain","Collar Gold Necklace","Ruby Diamond Necklace","Pearl Cluster Pendant","Serpentine Gold Chain","Peacock Emerald Necklace","Enamel Floral Pendant","Locket Gold Necklace","Diamond Infinity Necklace","Kundan Layered Necklace","Temple Gold Pendant","Rose Gold Teardrop Necklace","Amethyst Gold Pendant","Diamond Tennis Necklace","Traditional Haar Necklace","Gold Mesh Chain","Polki Bridal Necklace","Diamond Station Necklace","Riviere Diamond Necklace","Cascade Drop Pendant","Wheat Chain Necklace","Geometric Gold Pendant","Onyx Gold Collar","Floral Diamond Necklace","Vintage Pearl Choker","Byzantine Gold Chain","Emerald Peacock Pendant","Classic Tennis Necklace"];
const MATERIALS_LIST = ["22K Gold","18K Diamond","18K Rose Gold","Platinum","18K Ruby & Gold","18K Emerald & Gold","Pearl & Gold","Kundan Polki","18K Sapphire & Gold","Polki Diamond","22K Gold","18K Diamond","18K Gold","18K Rose Gold","18K Ruby & Diamond","18K Diamond","18K Emerald & Gold","22K Gold","Kundan & Gold","Pearl & Gold","Platinum & Diamond","18K Sapphire & Gold"];
const STYLES_LIST = ["Traditional","Contemporary","Bridal","Heritage","Fusion","Modern","Ethnic","Minimalist","Ornate","Romantic","Traditional","Contemporary","Ethnic","Modern","Bridal","Heritage","Fusion","Traditional","Contemporary","Minimalist"];
const DESC_RING = ["A breathtaking centrepiece stone held in a four-claw setting, crafted to catch every ray of light with extraordinary brilliance.","Delicate gold petals surround a lustrous gem in this timeless floral interpretation, perfect for everyday elegance.","A vivid emerald cluster framed by a micro-pave halo on a slender 18K band, radiating verdant luxury.","Rose-tinted gold wraps into an elegant heart silhouette, set with brilliant-cut diamonds of exceptional clarity.","Inspired by temple art, intricate gold wirework encircles a rich ruby centrepiece of deep Burmese hue.","Clean platinum lines focus all attention on a single extraordinary diamond in a modern four-claw setting.","A sapphire of exceptional colour sits encircled by a sparkling diamond halo on a refined platinum band.","A continuous row of matched round brilliants set in refined yellow gold, celebrating eternal devotion.","Luminous enamel work in the traditional Meenakari tradition adorns this heirloom-quality piece.","Hand-set Kundan stones in 24K gold foil, finished with natural back-set gems in the royal Jadau tradition.","A lustrous baroque pearl elevated by delicate gold wirework, a rare meeting of nature and craftsmanship.","Gossamer-thin gold threads interweave in an intricate filigree pattern, centuries of artistry on one finger."];
const DESC_NECKLACE = ["A central gold flower pendant suspends from a finely handcrafted chain, evoking timeless garden freshness.","A single diamond of exceptional clarity held by the finest gold prongs on a delicate handcrafted chain.","Inspired by Mughal grandeur, Kundan Polki stones are set by master craftsmen in 22K gold with enamel reverse.","Overlapping gold leaf motifs create a natural cascading effect of botanical elegance on this layered necklace.","Sacred black beads interspersed with gold discs, a timeless symbol of marital devotion and grace.","A minimalist rose gold bar pendant with a subtle satin finish, effortlessly wearable and endlessly sophisticated.","Elaborate Jadau craftsmanship with uncut diamonds set in 22K gold with intricate enamel reverse detailing.","Rich rubies in stylised floral clusters reference the sacred geometry of South Indian temple architecture.","Colombian-tone emerald drops set in 18K gold, inspired by the lush colours of the natural world.","A refined serpentine chain with precision-set diamond stations, pure contemporary elegance for modern royalty.","A cascade of baguette diamonds in an art deco arrangement, capturing the glamour of a golden era.","Handcrafted in pure gold with intricate charm detailing, this piece is a daily reminder of life's beauty."];

function _num(fname) { const m=fname.match(/\d+/); return m?parseInt(m[0]):1; }

function generateItemMeta(fname, category, idx) {
  const n=_num(fname), isRing=category==="rings";
  const names=isRing?RING_NAMES:NECKLACE_NAMES, descs=isRing?DESC_RING:DESC_NECKLACE;
  const base=isRing?18000:22000, bands=[0,4800,11500,24000,44000,72000,108000,148000], i=idx%1000;
  return { name:names[i%names.length], material:MATERIALS_LIST[i%MATERIALS_LIST.length], style:STYLES_LIST[i%STYLES_LIST.length], price:base+bands[n%bands.length]+(n*1327+n*n*37)%8000, description:descs[i%descs.length], hallmark:"BIS 916 Certified", collection:isRing?"Eternal Collection":"Heritage Collection", purity:isRing?(i%3===0?"Platinum 950":i%3===1?"22K Gold":"18K Gold"):(i%2===0?"22K Gold":"18K Gold") };
}

const DATASET_RING_FILES = [1,2,3,4,5,6,7,8,9,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,187,188,189,190,191,192,193].map(n=>`ring_${String(n).padStart(3,"0")}.jpg`);
const DATASET_NECKLACE_FILES = Array.from({length:301},(_,i)=>`necklace_${i+1}.jpg`);

function makeItem(category, fname, idx) {
  const meta=generateItemMeta(fname,category,idx);
  return { id:fname, category, fileName:fname, imageUrl:`${API}/images/Tanishq/${category}/${fname}`, image_url:`/images/Tanishq/${category}/${fname}`, ...meta };
}

async function searchJewelry(query, imageFile) {
  try {
    const fd=new FormData();
    if(imageFile) fd.append("image",imageFile);
    if(query) fd.append("query",query);
    fd.append("top_n","6");
    const res=await fetch(`${API}/api/search`,{method:"POST",body:fd});
    if(!res.ok) throw new Error();
    const data=await res.json();
    return {fromBackend:true,...data};
  } catch { return clientSearch(query); }
}

function clientSearch(query) {
  const q=(query||"").toLowerCase();
  const isRing=/\bring\b|band|solitaire|engagement|wedding ring|\bfinger/.test(q);
  const isNecklace=/necklace|chain|pendant|mangalsutra|haar|locket|choker/.test(q);
  if(!isRing&&!isNecklace) return {fromBackend:false,results:[],refinement:{Category:"unknown",Color:"Any",Style:"Any",Gemstone:null,Query:query},noMatch:true};
  const cat=isRing?"rings":"necklaces";
  const pool=cat==="rings"?DATASET_RING_FILES.slice(0,50).map((f,i)=>makeItem("rings",f,i)):DATASET_NECKLACE_FILES.slice(0,50).map((f,i)=>makeItem("necklaces",f,i));
  const keywords=q.split(/\s+/).filter(w=>w.length>2);
  const scored=pool.map(j=>{const text=`${j.name} ${j.material} ${j.style} ${j.category}`.toLowerCase();const score=keywords.reduce((s,k)=>s+(text.includes(k)?1:0),0);return{...j,score};}).sort((a,b)=>b.score-a.score).slice(0,6);
  return {fromBackend:false,results:scored.map((j,idx)=>({id:j.id,category:j.category,name:j.name,description:j.description,image_url:j.image_url,price:j.price,material:j.material,style:j.style,similarity:Math.round(65+(idx*5))})),refinement:{Category:cat,Color:scored[0]?.material||"gold",Style:scored[0]?.style||"traditional",Gemstone:null,Query:query},noMatch:scored.length===0};
}

function normaliseResult(r, idx) {
  const rawCat=(r.category||"").toLowerCase();
  const cat=rawCat.includes("ring")?"rings":rawCat.includes("necklace")?"necklaces":"rings";
  const fname=r.image_url?r.image_url.split("/").pop():`${cat}_${idx+1}.jpg`;
  const fallback=generateItemMeta(fname,cat,idx);
  return {id:r.id||fname,category:cat,name:r.name||fallback.name,description:r.description||fallback.description,material:r.material||fallback.material,style:r.style||fallback.style,price:r.price||fallback.price,hallmark:fallback.hallmark,collection:fallback.collection,purity:fallback.purity,fileName:fname,imageUrl:r.image_url?`${API}${r.image_url}`:null,image_url:r.image_url||null,similarity:r.similarity||0};
}

function Spinner({size=20}) { return <div style={{width:size,height:size,border:`2px solid var(--cream)`,borderTop:`2px solid var(--gold)`,borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block",flexShrink:0}}/>; }
function GoldLine({my=32}) { return <div style={{width:56,height:1,background:"linear-gradient(to right,transparent,var(--gold),transparent)",margin:`${my}px auto`}}/>; }
function Tag({children}) { return <span style={{display:"inline-block",fontSize:9,fontWeight:600,letterSpacing:"1.8px",textTransform:"uppercase",background:"rgba(184,134,11,.1)",color:"var(--gold-dark)",padding:"3px 8px",borderRadius:2}}>{children}</span>; }

function Btn({children,onClick,variant="primary",fullWidth=false,disabled=false,style={}}) {
  const base={display:"inline-flex",alignItems:"center",gap:8,padding:"11px 24px",borderRadius:"var(--r)",fontFamily:"'Jost',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",cursor:disabled?"not-allowed":"pointer",transition:"all .25s",border:"1.5px solid transparent",opacity:disabled?.6:1,...style};
  const vs={primary:{background:"var(--charcoal)",color:"var(--gold-pale)",borderColor:"var(--charcoal)"},outline:{background:"transparent",color:"var(--gold)",borderColor:"var(--gold-lt)"},ghost:{background:"transparent",color:"var(--smoke)",borderColor:"var(--cream)"}};
  return <button disabled={disabled} onClick={onClick} style={{...base,...vs[variant],width:fullWidth?"100%":"auto"}} onMouseEnter={e=>{if(!disabled){if(variant==="primary"){e.currentTarget.style.background="var(--gold)";e.currentTarget.style.borderColor="var(--gold)";}else if(variant==="outline"){e.currentTarget.style.background="rgba(184,134,11,.06)";}else{e.currentTarget.style.color="var(--charcoal)";e.currentTarget.style.borderColor="var(--graphite)";}}} } onMouseLeave={e=>{if(!disabled){if(variant==="primary"){e.currentTarget.style.background="var(--charcoal)";e.currentTarget.style.borderColor="var(--charcoal)";}else if(variant==="outline"){e.currentTarget.style.background="transparent";}else{e.currentTarget.style.color="var(--smoke)";e.currentTarget.style.borderColor="var(--cream)";}}} }>{children}</button>;
}

function Toast({msg,type="success",onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[onClose]);
  return <div style={{position:"fixed",bottom:88,left:"50%",transform:"translateX(-50%)",background:type==="error"?"var(--error)":"var(--charcoal)",color:"var(--gold-pale)",padding:"12px 22px",borderRadius:"var(--r-md)",fontSize:12,fontWeight:500,letterSpacing:".5px",zIndex:1000,boxShadow:"0 8px 32px rgba(0,0,0,.28)",animation:"fadeUp .3s ease both",display:"flex",alignItems:"center",gap:10,whiteSpace:"nowrap"}}><Icon name={type==="error"?"x":"check"} size={13} color="currentColor"/>{msg}</div>;
}

function Navbar({page,setPage,user,cartCount,wishCount}) {
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{const fn=()=>setScrolled(window.scrollY>12);window.addEventListener("scroll",fn);return()=>window.removeEventListener("scroll",fn);},[]);
  return (
    <header style={{position:"sticky",top:0,zIndex:800,background:scrolled?"rgba(253,252,249,.97)":"var(--pearl)",borderBottom:"1px solid var(--cream)",backdropFilter:"blur(10px)",transition:"all .3s"}}>
      <div style={{maxWidth:1280,margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
        <button onClick={()=>setPage("home")} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"var(--charcoal)",letterSpacing:"2px",lineHeight:1}}>Tanishq</div>
          <div style={{fontSize:7,letterSpacing:"4px",color:"var(--gold)",textTransform:"uppercase",fontWeight:600}}>AI Platform</div>
        </button>
        <nav style={{display:"flex",gap:4}}>
          {[["home","Home"],["search","AI Search"],["shop","Collection"],["developer","Team"],["support","Support"]].map(([p,l])=>(
            <button key={p} onClick={()=>setPage(p)} style={{background:"none",border:"none",cursor:"pointer",padding:"8px 12px",fontSize:10,fontWeight:500,letterSpacing:"1.5px",textTransform:"uppercase",color:page===p?"var(--gold)":"var(--smoke)",transition:"color .2s",borderBottom:page===p?"1.5px solid var(--gold)":"1.5px solid transparent"}}>{l}</button>
          ))}
        </nav>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          {user?<button onClick={()=>setPage("profile")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:6,padding:"6px 10px",color:"var(--smoke)",fontSize:10,letterSpacing:"1px",textTransform:"uppercase"}}><Icon name="user" size={14}/>{user.name?.split(" ")[0]}</button>:<button onClick={()=>setPage("auth")} style={{background:"none",border:"none",cursor:"pointer",padding:"6px 10px",color:"var(--smoke)",fontSize:10,letterSpacing:"1px",textTransform:"uppercase",display:"flex",alignItems:"center",gap:5}}><Icon name="user" size={14}/>Sign In</button>}
          <button onClick={()=>setPage("wishlist")} style={{background:"none",border:"none",cursor:"pointer",padding:"6px 10px",position:"relative",color:"var(--smoke)"}}><Icon name="heart" size={17}/>{wishCount>0&&<span style={{position:"absolute",top:2,right:4,background:"var(--error)",color:"#fff",fontSize:8,fontWeight:700,borderRadius:"50%",width:14,height:14,display:"flex",alignItems:"center",justifyContent:"center"}}>{wishCount}</span>}</button>
          <button onClick={()=>setPage("cart")} style={{background:"var(--charcoal)",border:"none",borderRadius:"var(--r)",cursor:"pointer",padding:"7px 14px",display:"flex",alignItems:"center",gap:7,color:"var(--gold-pale)",fontSize:10,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase"}}><Icon name="cart" size={14} color="var(--gold-lt)"/>Cart{cartCount>0&&<span style={{background:"var(--gold)",color:"#fff",fontSize:9,fontWeight:700,borderRadius:10,padding:"1px 5px",marginLeft:2}}>{cartCount}</span>}</button>
        </div>
      </div>
    </header>
  );
}

function ProductCard({item,onAddToCart,onAddToWishlist,user,setPage,onSelect}) {
  const [wishlisted,setWishlisted]=useState(false);
  const [imgError,setImgError]=useState(false);
  const [hov,setHov]=useState(false);
  const handleWish=(e)=>{e.stopPropagation();if(!user){setPage("auth");return;}onAddToWishlist(item);setWishlisted(true);};
  const handleCart=(e)=>{e.stopPropagation();if(!user){setPage("auth");return;}onAddToCart(item);};
  return (
    <div className="jewelry-card grow-in" onClick={()=>onSelect&&onSelect(item)}>
      <div style={{position:"relative",overflow:"hidden"}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
        {!imgError?<img src={item.imageUrl} alt={item.name} style={{width:"100%",height:240,objectFit:"cover",display:"block"}} onError={()=>setImgError(true)}/>:<div style={{width:"100%",height:240,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--linen)"}}><Icon name="gem" size={36} color="var(--cream)"/></div>}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.4) 0%,transparent 50%)",opacity:hov?1:0,transition:"opacity .3s",display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:14}}>
          <button style={{background:"rgba(250,248,243,.96)",border:"none",borderRadius:"var(--r)",padding:"7px 16px",fontSize:10,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",cursor:"pointer",display:"flex",alignItems:"center",gap:6,color:"var(--charcoal)"}} onClick={e=>{e.stopPropagation();onSelect&&onSelect(item);}}><Icon name="eye" size={13} color="var(--charcoal)"/>Quick View</button>
        </div>
        <button onClick={handleWish} style={{position:"absolute",top:10,right:10,background:"rgba(255,255,255,.92)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.12)"}}><Icon name={wishlisted?"heartFill":"heart"} size={14} color={wishlisted?"var(--error)":"var(--smoke)"}/></button>
        <div style={{position:"absolute",top:10,left:10}}><Tag>{item.category==="rings"?"Ring":"Necklace"}</Tag></div>
      </div>
      <div style={{padding:"15px 16px 18px"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:500,color:"var(--charcoal)",marginBottom:3,lineHeight:1.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</div>
        <div style={{fontSize:11,color:"var(--smoke)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:11}}>{item.material}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,color:"var(--gold)",fontWeight:500}}>&#8377;{item.price.toLocaleString("en-IN")}</div>
          <button onClick={handleCart} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 13px",background:"var(--charcoal)",border:"none",borderRadius:"var(--r)",cursor:"pointer",color:"var(--gold-pale)",fontSize:10,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase",transition:"background .2s"}} onMouseEnter={e=>e.currentTarget.style.background="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.background="var(--charcoal)"}><Icon name="cart" size={12} color="currentColor"/>Add</button>
        </div>
      </div>
    </div>
  );
}

function DetailPage({item,onBack,onAddToCart,onAddToWishlist,user,setPage}) {
  const [wishlisted,setWishlisted]=useState(false);
  const [added,setAdded]=useState(false);
  const [imgError,setImgError]=useState(false);
  const meta=generateItemMeta(item.fileName||item.id,item.category,0);
  const name=item.name||meta.name,material=item.material||meta.material,style=item.style||meta.style;
  const price=item.price||meta.price,desc=item.description||meta.description;
  const hallmark=item.hallmark||meta.hallmark,collection=item.collection||meta.collection,purity=item.purity||meta.purity;
  const catLabel=item.category==="rings"?"Ring":"Necklace";
  const handleCart=()=>{if(!user){setPage("auth");return;}onAddToCart({...item,name,material,style,price,description:desc});setAdded(true);setTimeout(()=>setAdded(false),2500);};
  const handleWish=()=>{if(!user){setPage("auth");return;}onAddToWishlist({...item,name,material,style,price,description:desc});setWishlisted(true);};
  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:"40px 24px 80px"}} className="fade-in">
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",cursor:"pointer",color:"var(--smoke)",fontSize:11,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:36,padding:0,transition:"color .2s"}} onMouseEnter={e=>e.currentTarget.style.color="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.color="var(--smoke)"}><Icon name="arrowLeft" size={13} color="currentColor"/>Back to Collection</button>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"start"}}>
        <div>
          <div style={{borderRadius:"var(--r-lg)",overflow:"hidden",background:"var(--linen)",aspectRatio:"1"}}>
            {!imgError?<img src={item.imageUrl} alt={name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={()=>setImgError(true)}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="gem" size={40} color="var(--cream)"/></div>}
          </div>
          {item.similarity>0&&<div style={{marginTop:12,display:"flex",alignItems:"center",gap:8}}><div style={{height:3,flex:1,background:"var(--cream)",borderRadius:2}}><div style={{height:"100%",width:`${item.similarity}%`,background:"linear-gradient(to right,var(--gold-lt),var(--gold))",borderRadius:2}}/></div><span style={{fontSize:11,color:"var(--smoke)",flexShrink:0}}>{Math.round(item.similarity)}% Match</span></div>}
        </div>
        <div>
          <div style={{marginBottom:6}}><Tag>{catLabel}</Tag></div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:400,color:"var(--charcoal)",lineHeight:1.2,margin:"10px 0 6px"}}>{name}</h1>
          <p style={{fontSize:11,color:"var(--smoke)",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:16}}>{collection}</p>
          <GoldLine my={20}/>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:"var(--gold)",fontWeight:500,marginBottom:24}}>&#8377;{price.toLocaleString("en-IN")}<span style={{fontSize:12,color:"var(--smoke)",fontFamily:"'Jost',sans-serif",fontWeight:400,marginLeft:10}}>Incl. taxes</span></div>
          <p style={{fontSize:14,lineHeight:1.9,color:"var(--graphite)",marginBottom:28}}>{desc}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,border:"1px solid var(--cream)",borderRadius:"var(--r-md)",overflow:"hidden",marginBottom:28}}>
            {[["Material",material],["Purity",purity],["Style",style],["Hallmark",hallmark]].map(([label,value],i)=>(
              <div key={label} style={{padding:"14px 16px",borderRight:i%2===0?"1px solid var(--cream)":"none",borderBottom:i<2?"1px solid var(--cream)":"none"}}>
                <div style={{fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--smoke)",marginBottom:4}}>{label}</div>
                <div style={{fontSize:13,fontWeight:500,color:"var(--charcoal)"}}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:28}}>{[1,2,3,4,5].map(s=><Icon key={s} name="star" size={13} color="var(--gold)"/>)}<span style={{fontSize:12,color:"var(--smoke)",marginLeft:4}}>4.8 · 124 reviews</span></div>
          <div style={{display:"flex",gap:12,marginBottom:20}}>
            <Btn fullWidth onClick={handleCart} variant={added?"outline":"primary"}>{added?<><Icon name="check" size={14} color="currentColor"/>Added to Cart</>:<><Icon name="cart" size={14} color="#fff"/>Add to Cart</>}</Btn>
            <button onClick={handleWish} style={{width:44,height:44,background:"var(--pearl)",border:"1px solid var(--cream)",borderRadius:"var(--r)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold-lt)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--cream)"}><Icon name={wishlisted?"heartFill":"heart"} size={17} color={wishlisted?"var(--error)":"var(--smoke)"}/></button>
          </div>
          <div style={{display:"flex",gap:0,paddingTop:20,borderTop:"1px solid var(--cream)"}}>
            {[["Free Shipping","On all orders"],["30-Day Returns","Hassle-free"],["BIS Certified","Authentic"]].map(([title,sub],i)=>(
              <div key={title} style={{flex:1,paddingLeft:i>0?16:0,borderLeft:i>0?"1px solid var(--cream)":"none"}}>
                <div style={{fontSize:11,fontWeight:600,color:"var(--charcoal)",marginBottom:2}}>{title}</div>
                <div style={{fontSize:10,color:"var(--smoke)"}}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function JewelModel({side="left"}) {
  return (
    <div style={{position:"absolute",top:"50%",transform:`translateY(-50%)${side==="right"?" scaleX(-1)":""}`,left:side==="right"?"auto":0,right:side==="right"?0:"auto",width:180,opacity:.1,pointerEvents:"none"}}>
      <svg viewBox="0 0 120 320" fill="none" style={{width:"100%",height:"auto"}}>
        <ellipse cx="60" cy="40" rx="22" ry="26" fill="#D4A84B"/>
        <path d="M38 66 Q30 90 28 130 Q26 170 30 200 Q38 240 46 270 Q52 285 60 290 Q68 285 74 270 Q82 240 90 200 Q94 170 92 130 Q90 90 82 66 Q72 80 60 82 Q48 80 38 66Z" fill="#D4A84B"/>
        <path d="M28 130 Q14 140 10 180 Q8 200 20 210 Q28 215 32 200" fill="#D4A84B"/>
        <path d="M92 130 Q106 140 110 180 Q112 200 100 210 Q92 215 88 200" fill="#D4A84B"/>
        <path d="M46 270 Q44 290 50 310 Q54 318 58 320" stroke="#D4A84B" strokeWidth="8" strokeLinecap="round"/>
        <path d="M74 270 Q76 290 70 310 Q66 318 62 320" stroke="#D4A84B" strokeWidth="8" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function HomePage({setPage}) {
  return (
    <div>
      <div style={{background:"linear-gradient(135deg,#0A0A0A 0%,#1C1C1C 55%,#0E0B04 100%)",padding:"120px 40px 100px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(ellipse at 25% 50%,rgba(184,134,11,.09) 0%,transparent 55%),radial-gradient(ellipse at 75% 30%,rgba(212,168,83,.06) 0%,transparent 50%)"}}/>
        <JewelModel side="left"/><JewelModel side="right"/>
        <div style={{position:"relative",maxWidth:680,margin:"0 auto"}} className="fade-up">
          <div style={{fontFamily:"'Pinyon Script',cursive",fontSize:22,color:"rgba(212,168,83,.7)",marginBottom:12,letterSpacing:"2px"}}>Crafted with Devotion</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:"clamp(32px,5vw,62px)",color:"var(--ivory)",lineHeight:1.12,marginBottom:24}}>Discover Your Perfect<br/><em style={{color:"var(--gold-lt)",fontStyle:"italic"}}>Tanishq Jewel</em></h1>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontSize:18,color:"#8A7A60",lineHeight:1.9,marginBottom:44}}>Describe your vision, upload a sketch, or speak your dream —<br/>our AI finds the exact match from the Tanishq collection.</p>
          <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
            <Btn onClick={()=>setPage("search")} style={{fontSize:11,letterSpacing:"2px",padding:"13px 32px"}}>AI Jewellery Search</Btn>
            <Btn onClick={()=>setPage("shop")} variant="outline" style={{borderColor:"rgba(212,168,83,.5)",color:"var(--gold-lt)",fontSize:11,letterSpacing:"2px",padding:"13px 32px"}}>Browse Collection</Btn>
          </div>
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:1,background:"linear-gradient(to right,transparent,rgba(184,134,11,.3),transparent)"}}/>
      </div>
      <div style={{background:"var(--charcoal)",padding:"28px 40px"}}>
        <div style={{maxWidth:1000,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0}}>
          {[["490+","Unique Designs"],["100%","BIS Certified"],["30-Day","Easy Returns"],["2M+","Happy Customers"]].map(([val,label],i)=>(
            <div key={label} style={{textAlign:"center",paddingLeft:i>0?24:0,borderLeft:i>0?"1px solid rgba(184,134,11,.15)":"none"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:"var(--gold-lt)",fontWeight:500}}>{val}</div>
              <div style={{fontSize:10,letterSpacing:"1.5px",color:"rgba(250,248,243,.4)",textTransform:"uppercase",marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"72px 24px 0"}}>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",textAlign:"center",fontSize:34,fontWeight:400,color:"var(--charcoal)"}}>Shop by Category</h2>
        <GoldLine/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,maxWidth:620,margin:"32px auto 0"}}>
          {[{id:"necklaces",label:"Necklaces",desc:"Pendants, chains & heritage sets"},{id:"rings",label:"Rings",desc:"Solitaires, bands & cocktail rings"}].map(c=>(
            <button key={c.id} onClick={()=>setPage("shop")} style={{background:"var(--pearl)",border:"1px solid var(--cream)",borderRadius:"var(--r-lg)",padding:"44px 24px",cursor:"pointer",textAlign:"center",transition:"all .3s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.borderColor="rgba(184,134,11,.3)";e.currentTarget.style.boxShadow="var(--shadow-g)";}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor="var(--cream)";e.currentTarget.style.boxShadow="";}}>
              <div style={{width:32,height:1,background:"linear-gradient(to right,transparent,var(--gold),transparent)",margin:"0 auto 20px"}}/>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"var(--charcoal)",marginBottom:8}}>{c.label}</div>
              <div style={{fontSize:12,color:"var(--smoke)"}}>{c.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{maxWidth:1200,margin:"72px auto 0",padding:"0 24px 80px"}}>
        <GoldLine/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:0}}>
          {[["Zero Hallucination","Only real items from the Tanishq catalogue are ever returned. The AI never invents jewellery."],["Strict Category Match","Search necklaces and get only necklaces. No cross-category results under any condition."],["Multimodal AI Search","Text, reference photos, hand-drawn sketches, and voice — all understood with precision."]].map(([title,desc],i)=>(
            <div key={title} style={{textAlign:"center",padding:"36px 28px",borderRight:i<2?"1px solid var(--cream)":"none"}}>
              <div style={{width:28,height:1,background:"linear-gradient(to right,transparent,var(--gold),transparent)",margin:"0 auto 22px"}}/>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,marginBottom:12,color:"var(--charcoal)"}}>{title}</div>
              <div style={{fontSize:13,color:"var(--smoke)",lineHeight:1.9}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchPage({addToCart,addToWishlist,user,setPage}) {
  const [mode,setMode]=useState("text");
  const [query,setQuery]=useState("");
  const [imageFile,setImageFile]=useState(null);
  const [imagePreview,setImagePreview]=useState(null);
  const [loading,setLoading]=useState(false);
  const [loadingStep,setLoadingStep]=useState("");
  const [result,setResult]=useState(null);
  const [error,setError]=useState(null);
  const [recording,setRecording]=useState(false);
  const [voiceStatus,setVoiceStatus]=useState("");
  const [selectedItem,setSelectedItem]=useState(null);
  const fileRef=useRef();
  const mediaRef=useRef();
  const chunksRef=useRef([]);
  const STEPS=["Analysing query...","Detecting jewellery type...","Semantic matching...","Ranking results..."];

  const doSearch=useCallback(async()=>{
    if(!query.trim()&&!imageFile){setError("Please enter a description or upload an image.");return;}
    setLoading(true);setError(null);setResult(null);
    let si=0;const ticker=setInterval(()=>setLoadingStep(STEPS[si++%STEPS.length]),1100);
    try{const data=await searchJewelry(query,imageFile);setResult(data);}
    catch{setResult(clientSearch(query||"jewelry"));}
    finally{clearInterval(ticker);setLoading(false);setLoadingStep("");}
  },[query,imageFile]);

  const startVoice=async()=>{
    try{
      setVoiceStatus("");
      if(window.SpeechRecognition||window.webkitSpeechRecognition){
        const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
        const recognition=new SR();
        recognition.lang="en-IN";recognition.continuous=false;recognition.interimResults=true;
        recognition.onstart=()=>{setRecording(true);setVoiceStatus("Listening... Speak now.");};
        recognition.onresult=(event)=>{const t=Array.from(event.results).map(r=>r[0].transcript).join("");setQuery(t);setVoiceStatus(`Hearing: "${t}"`);};
        recognition.onerror=(e)=>{setVoiceStatus(`Error: ${e.error}. Please type.`);setRecording(false);};
        recognition.onend=()=>setRecording(false);
        recognition.start();
        mediaRef.current={stop:()=>recognition.stop()};
      } else {
        const stream=await navigator.mediaDevices.getUserMedia({audio:true});
        const rec=new MediaRecorder(stream);
        chunksRef.current=[];
        rec.ondataavailable=e=>chunksRef.current.push(e.data);
        rec.onstop=async()=>{
          stream.getTracks().forEach(t=>t.stop());
          const blob=new Blob(chunksRef.current,{type:"audio/wav"});
          setVoiceStatus("Transcribing...");
          try{const fd=new FormData();fd.append("audio",blob,"recording.wav");const res=await fetch(`${API}/api/transcribe`,{method:"POST",body:fd});if(res.ok){const data=await res.json();if(data.success&&data.text){setQuery(data.text);setVoiceStatus(`Recognised: "${data.text}"`);}else setVoiceStatus("Could not transcribe. Please type.");}else setVoiceStatus("Transcription unavailable.");}catch{setVoiceStatus("Transcription failed.");}
          setRecording(false);
        };
        rec.start();setRecording(true);setVoiceStatus("Recording... Click Stop when done.");
        mediaRef.current=rec;
      }
    }catch{setError("Microphone access denied.");}
  };

  const stopVoice=()=>{try{mediaRef.current?.stop();}catch{}setRecording(false);};
  const handleFile=(file)=>{if(!file)return;setImageFile(file);setImagePreview(URL.createObjectURL(file));};
  const resultItems=(result?.results||[]).map((r,idx)=>normaliseResult(r,idx)).filter(r=>r.imageUrl);

  if(selectedItem) return <DetailPage item={selectedItem} onBack={()=>setSelectedItem(null)} onAddToCart={addToCart} onAddToWishlist={addToWishlist} user={user} setPage={setPage}/>;

  return (
    <div style={{background:"var(--ivory)",minHeight:"100vh"}}>
      <div style={{background:"linear-gradient(135deg,#0D0D0D 0%,#1C1C1C 60%,#140F05 100%)",padding:"52px 40px 44px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(ellipse at 30% 50%,rgba(184,134,11,.07) 0%,transparent 55%)"}}/>
        <JewelModel side="left"/><JewelModel side="right"/>
        <div style={{position:"relative"}}>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:300,color:"var(--ivory)",marginBottom:10}}>AI-Powered Jewellery Search</h2>
          <p style={{color:"#8A7A60",fontSize:13,fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif"}}>Describe · Upload · Sketch · Speak — our AI finds the perfect match</p>
        </div>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"52px 24px"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:40}}>
          {[["text","Text / Voice"],["image","Image / Sketch"]].map(([m,label])=>(
            <button key={m} onClick={()=>setMode(m)} style={{padding:"11px 28px",border:"1px solid var(--gold-lt)",cursor:"pointer",background:mode===m?"var(--charcoal)":"transparent",color:mode===m?"var(--gold-pale)":"var(--gold)",fontFamily:"'Jost',sans-serif",fontSize:10,letterSpacing:"2px",textTransform:"uppercase",borderRadius:m==="text"?"var(--r) 0 0 var(--r)":"0 var(--r) var(--r) 0",transition:"all .2s"}}>{label}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:36,marginBottom:32}}>
          <div>
            {mode==="text"?(
              <>
                <label style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"var(--smoke)",display:"block",marginBottom:10}}>Describe your dream jewel</label>
                <textarea value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),doSearch())} placeholder="e.g. gold floral pendant necklace with temple design..." rows={5} style={{width:"100%",padding:"18px 20px",resize:"none",fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontStyle:"italic",border:"1px solid var(--cream)",borderRadius:"var(--r-md)",background:"var(--pearl)",color:"var(--charcoal)",outline:"none",transition:"border .2s",lineHeight:1.7}} onFocus={e=>e.target.style.border="1px solid var(--gold-lt)"} onBlur={e=>e.target.style.border="1px solid var(--cream)"}/>
                <div style={{marginTop:14}}>
                  <button onClick={recording?stopVoice:startVoice} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"9px 18px",borderRadius:"var(--r)",background:"var(--pearl)",border:recording?"1.5px solid var(--error)":"1.5px solid var(--cream)",color:recording?"var(--error)":"var(--smoke)",fontSize:11,fontWeight:500,letterSpacing:"1px",textTransform:"uppercase",transition:"all .2s",animation:recording?"glow 1.5s ease-in-out infinite":"none"}}>
                    {recording?<><Icon name="stop" size={12} color="var(--error)"/>Stop Recording</>:<><Icon name="mic" size={14} color="var(--smoke)"/>Voice Search</>}
                    {recording&&<span style={{width:7,height:7,borderRadius:"50%",background:"var(--error)",animation:"pulse 1s ease infinite",display:"inline-block"}}/>}
                  </button>
                  {voiceStatus&&<div style={{marginTop:10,padding:"12px 16px",background:"var(--linen)",border:"1px solid var(--cream)",borderLeft:"3px solid var(--gold)",borderRadius:"var(--r)",fontSize:13,color:"var(--graphite)",lineHeight:1.6}}><div style={{fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--gold)",marginBottom:4}}>Voice Status</div>{voiceStatus}{query&&<div style={{marginTop:6,fontSize:12,color:"var(--smoke)"}}>Query: <strong style={{color:"var(--charcoal)"}}>"{query}"</strong></div>}</div>}
                </div>
                <div style={{marginTop:14}}>
                  <div style={{fontSize:10,color:"var(--smoke)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Try:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {["gold necklace","solitaire diamond ring","kundan necklace","diamond ring"].map(ex=><button key={ex} onClick={()=>setQuery(ex)} style={{padding:"4px 12px",border:"1px solid var(--cream)",borderRadius:20,background:"var(--pearl)",color:"var(--smoke)",fontSize:11,cursor:"pointer",letterSpacing:".3px",transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold-lt)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--cream)"}>{ex}</button>)}
                  </div>
                </div>
              </>
            ):(
              <>
                <label style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"var(--smoke)",display:"block",marginBottom:10}}>Upload jewellery image or sketch</label>
                <div onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files?.[0]);}} style={{border:"1.5px dashed var(--cream)",borderRadius:"var(--r-lg)",padding:"52px 24px",textAlign:"center",cursor:"pointer",background:"var(--pearl)",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold-lt)";e.currentTarget.style.background="var(--linen)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--cream)";e.currentTarget.style.background="var(--pearl)";}}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Icon name="upload" size={28} color="var(--smoke)"/></div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"var(--charcoal)",marginBottom:6}}>Drop image or click to browse</div>
                  <div style={{fontSize:12,color:"var(--smoke)"}}>Jewellery photos, sketches, handwritten notes</div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files?.[0])}/>
                <p style={{fontSize:11,color:"var(--smoke)",marginTop:12,lineHeight:1.7}}>Upload a dataset jewellery image or any ring/necklace photo. The AI detects the category and finds similar items from the collection.</p>
              </>
            )}
          </div>
          <div>
            <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"var(--smoke)",marginBottom:10}}>Preview</div>
            <div style={{height:280,borderRadius:"var(--r-lg)",background:"var(--linen)",border:"1px solid var(--cream)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
              {imagePreview?<img src={imagePreview} alt="Preview" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<div style={{textAlign:"center",opacity:.3}}><Icon name="gem" size={36} color="var(--cream)"/><div style={{fontSize:12,marginTop:10,color:"var(--smoke)"}}>Preview appears here</div></div>}
            </div>
            {imagePreview&&<button onClick={()=>{setImageFile(null);setImagePreview(null);}} style={{marginTop:8,background:"none",border:"none",cursor:"pointer",color:"var(--smoke)",fontSize:11,display:"flex",alignItems:"center",gap:5}}><Icon name="x" size={11} color="var(--smoke)"/>Clear image</button>}
          </div>
        </div>
        {error&&<div style={{background:"#FFF5F5",border:"1px solid rgba(185,64,64,.2)",borderRadius:"var(--r)",padding:"12px 16px",marginBottom:24,color:"var(--error)",fontSize:13}}>{error}</div>}
        <div style={{display:"flex",justifyContent:"center",marginBottom:52}}>
          <Btn onClick={doSearch} disabled={loading} style={{fontSize:11,letterSpacing:"2px",padding:"13px 44px"}}>{loading?<><Spinner size={14}/>{loadingStep||"Searching..."}</>:<><Icon name="search" size={14} color="#fff"/>Search Now</>}</Btn>
        </div>
        {result&&(
          <div className="fade-up">
            {result.refinement&&(
              <div style={{background:"var(--pearl)",border:"1px solid var(--cream)",borderLeft:"3px solid var(--gold)",borderRadius:"var(--r-md)",padding:"20px 24px",marginBottom:32}}>
                <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"var(--gold)",marginBottom:14}}>AI Understanding</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
                  {[["Category",result.refinement.Category],["Material",result.refinement.Color],["Style",result.refinement.Style],["Gemstone",result.refinement.Gemstone||"None"]].map(([l,v])=>(
                    <div key={l} style={{textAlign:"center"}}><div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:"var(--smoke)",marginBottom:5}}>{l}</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"var(--charcoal)",textTransform:"capitalize"}}>{v||"Any"}</div></div>
                  ))}
                </div>
                {result.refinement.Query&&<div style={{marginTop:16,padding:"10px 14px",background:"var(--linen)",borderRadius:"var(--r)",fontStyle:"italic",color:"var(--charcoal)",fontSize:14,fontFamily:"'Cormorant Garamond',serif"}}>{result.refinement.Query}</div>}
              </div>
            )}
            <GoldLine/>
            {resultItems.length>0?(
              <>
                <div style={{textAlign:"center",marginBottom:32}}>
                  <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:400,color:"var(--charcoal)"}}>Perfect Matches</h3>
                  <p style={{color:"var(--smoke)",fontSize:12,marginTop:8}}>{resultItems.length} results — exact category matches only · Click any item to view details</p>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24}}>
                  {resultItems.map(item=><ProductCard key={item.id} item={item} onAddToCart={addToCart} onAddToWishlist={addToWishlist} user={user} setPage={setPage} onSelect={setSelectedItem}/>)}
                </div>
              </>
            ):(
              <div style={{textAlign:"center",padding:"64px 20px",background:"var(--pearl)",borderRadius:"var(--r-lg)",border:"1px solid var(--cream)"}}>
                <div style={{width:40,height:1,background:"linear-gradient(to right,transparent,var(--gold),transparent)",margin:"0 auto 28px"}}/>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:"var(--charcoal)",marginBottom:12}}>No similar jewellery found in the current collection.</p>
                <p style={{color:"var(--smoke)",fontSize:13,marginBottom:28}}>Please specify "ring" or "necklace" in your query, or try uploading a clearer image.</p>
                <Btn onClick={()=>setPage("shop")} variant="outline">Browse Full Collection</Btn>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ShopPage({addToCart,addToWishlist,user,setPage}) {
  const [cat,setCat]=useState("all");
  const [sort,setSort]=useState("default");
  const [allItems,setAllItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selectedItem,setSelectedItem]=useState(null);

  function buildClientCatalog(){
    return [...DATASET_RING_FILES.map((f,i)=>makeItem("rings",f,i)),...DATASET_NECKLACE_FILES.map((f,i)=>makeItem("necklaces",f,i))];
  }

  useEffect(()=>{
    setLoading(true);
    fetch(`${API}/api/catalog`)
      .then(r=>{if(!r.ok)throw new Error();return r.json();})
      .then(data=>{
        if(!data.items||data.items.length===0)throw new Error();
        setAllItems(data.items.map((item,idx)=>{
          const meta=generateItemMeta(item.id,item.category,idx);
          return {id:item.id,category:item.category,name:item.name||meta.name,material:item.material||meta.material,style:item.style||meta.style,price:item.price||meta.price,description:meta.description,hallmark:meta.hallmark,collection:meta.collection,purity:meta.purity,fileName:item.id,imageUrl:`${API}${item.image_url}`,image_url:item.image_url};
        }));
      })
      .catch(()=>setAllItems(buildClientCatalog()))
      .finally(()=>setLoading(false));
  },[]);

  if(selectedItem) return <DetailPage item={selectedItem} onBack={()=>setSelectedItem(null)} onAddToCart={addToCart} onAddToWishlist={addToWishlist} user={user} setPage={setPage}/>;

  const sortFn=items=>items.slice().sort((a,b)=>sort==="price-asc"?a.price-b.price:sort==="price-desc"?b.price-a.price:0);
  const necklaces=sortFn(allItems.filter(j=>j.category==="necklaces"));
  const rings=sortFn(allItems.filter(j=>j.category==="rings"));
  const filtered=sortFn(cat==="all"?allItems:allItems.filter(j=>j.category===cat));
  const counts={all:allItems.length,necklaces:necklaces.length,rings:rings.length};

  return (
    <div style={{maxWidth:1320,margin:"0 auto",padding:"52px 24px 80px"}}>
      <div style={{textAlign:"center",marginBottom:44}}>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:400,color:"var(--charcoal)"}}>The Tanishq Collection</h2>
        <GoldLine/>
        {!loading&&<p style={{color:"var(--smoke)",fontSize:12,letterSpacing:".5px"}}>{counts.all} pieces — {counts.necklaces} Necklaces · {counts.rings} Rings</p>}
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",marginBottom:36}}>
        <div style={{display:"flex",gap:6}}>
          {[["all","All"],["necklaces","Necklaces"],["rings","Rings"]].map(([c,label])=>(
            <button key={c} onClick={()=>setCat(c)} style={{padding:"7px 18px",border:"1px solid var(--cream)",borderRadius:24,cursor:"pointer",fontSize:11,letterSpacing:".5px",background:cat===c?"var(--charcoal)":"var(--pearl)",color:cat===c?"var(--gold-pale)":"var(--smoke)",transition:"all .2s"}}>{label} ({counts[c]||0})</button>
          ))}
        </div>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{padding:"7px 14px",border:"1px solid var(--cream)",borderRadius:"var(--r)",background:"var(--pearl)",color:"var(--smoke)",fontSize:11,outline:"none",cursor:"pointer"}}>
          <option value="default">Sort: Default</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>
      {loading?(
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20}}>
          {Array.from({length:8}).map((_,i)=>(
            <div key={i} style={{borderRadius:"var(--r-lg)",overflow:"hidden",border:"1px solid var(--cream)"}}>
              <div className="skeleton" style={{height:240,width:"100%"}}/>
              <div style={{padding:16}}><div className="skeleton" style={{height:14,width:"80%",marginBottom:8}}/><div className="skeleton" style={{height:10,width:"50%",marginBottom:12}}/><div className="skeleton" style={{height:16,width:"40%"}}/></div>
            </div>
          ))}
        </div>
      ):cat==="all"?(
        <>
          <div style={{marginBottom:52}}>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:28}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"var(--charcoal)"}}>Necklaces</div>
              <div style={{height:1,flex:1,background:"var(--cream)"}}/>
              <div style={{fontSize:11,color:"var(--smoke)",letterSpacing:"1px"}}>{counts.necklaces} pieces</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20}}>{necklaces.map(item=><ProductCard key={item.id} item={item} onAddToCart={addToCart} onAddToWishlist={addToWishlist} user={user} setPage={setPage} onSelect={setSelectedItem}/>)}</div>
          </div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:28}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"var(--charcoal)"}}>Rings</div>
              <div style={{height:1,flex:1,background:"var(--cream)"}}/>
              <div style={{fontSize:11,color:"var(--smoke)",letterSpacing:"1px"}}>{counts.rings} pieces</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20}}>{rings.map(item=><ProductCard key={item.id} item={item} onAddToCart={addToCart} onAddToWishlist={addToWishlist} user={user} setPage={setPage} onSelect={setSelectedItem}/>)}</div>
          </div>
        </>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20}}>{filtered.map(item=><ProductCard key={item.id} item={item} onAddToCart={addToCart} onAddToWishlist={addToWishlist} user={user} setPage={setPage} onSelect={setSelectedItem}/>)}</div>
      )}
    </div>
  );
}

function CartPage({cart,removeFromCart,updateQty,placeOrder,setPage}) {
  const subtotal=cart.reduce((s,{item,qty})=>s+item.price*qty,0);
  const tax=Math.round(subtotal*.03),total=subtotal+tax;
  if(!cart.length) return <div style={{textAlign:"center",padding:"80px 24px"}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:"var(--charcoal)",marginBottom:12}}>Your Cart is Empty</div><GoldLine/><p style={{color:"var(--smoke)",fontSize:13,marginBottom:28}}>Discover our exclusive collection and add your favourites.</p><Btn onClick={()=>setPage("shop")}>Browse Collection</Btn></div>;
  return (
    <div style={{maxWidth:1000,margin:"0 auto",padding:"52px 24px 80px"}}>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:400,color:"var(--charcoal)",marginBottom:36}}>Your Cart</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:40,alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {cart.map(({item,qty})=>(
            <div key={item.id} style={{display:"flex",gap:16,padding:20,background:"var(--pearl)",borderRadius:"var(--r-lg)",border:"1px solid var(--cream)"}}>
              <div style={{width:90,height:90,borderRadius:"var(--r-md)",overflow:"hidden",flexShrink:0,background:"var(--linen)"}}><img src={item.imageUrl} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"var(--charcoal)",marginBottom:2}}>{item.name}</div>
                <div style={{fontSize:11,color:"var(--smoke)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:10}}>{item.material}</div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",border:"1px solid var(--cream)",borderRadius:"var(--r)",overflow:"hidden"}}>
                    <button onClick={()=>updateQty(item.id,qty-1)} style={{width:30,height:30,border:"none",background:"var(--pearl)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="minus" size={12} color="var(--smoke)"/></button>
                    <span style={{width:32,textAlign:"center",fontSize:13,fontWeight:500}}>{qty}</span>
                    <button onClick={()=>updateQty(item.id,qty+1)} style={{width:30,height:30,border:"none",background:"var(--pearl)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="plus" size={12} color="var(--smoke)"/></button>
                  </div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"var(--gold)"}}>&#8377;{(item.price*qty).toLocaleString("en-IN")}</div>
                </div>
              </div>
              <button onClick={()=>removeFromCart(item.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--smoke)",flexShrink:0,padding:4,alignSelf:"flex-start"}}><Icon name="x" size={14}/></button>
            </div>
          ))}
        </div>
        <div style={{background:"var(--pearl)",border:"1px solid var(--cream)",borderRadius:"var(--r-lg)",padding:28,position:"sticky",top:80}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--charcoal)",marginBottom:24}}>Order Summary</div>
          {[["Subtotal",`₹${subtotal.toLocaleString("en-IN")}`],["GST (3%)","₹"+tax.toLocaleString("en-IN")],["Shipping","Free"]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:12,fontSize:13,color:"var(--graphite)"}}><span>{l}</span><span>{v}</span></div>
          ))}
          <div style={{height:1,background:"var(--cream)",margin:"16px 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:24}}>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"var(--charcoal)",fontWeight:500}}>Total</span>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--gold)"}}>&#8377;{total.toLocaleString("en-IN")}</span>
          </div>
          <Btn fullWidth onClick={placeOrder}>Place Order</Btn>
          <p style={{fontSize:11,color:"var(--smoke)",textAlign:"center",marginTop:14,lineHeight:1.6}}>BIS certified · Authentic hallmarked · Secure checkout</p>
        </div>
      </div>
    </div>
  );
}

function WishlistPage({wishlist,removeFromWishlist,addToCart,setPage}) {
  if(!wishlist.length) return <div style={{textAlign:"center",padding:"80px 24px"}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:"var(--charcoal)",marginBottom:12}}>Your Wishlist is Empty</div><GoldLine/><p style={{color:"var(--smoke)",fontSize:13,marginBottom:28}}>Save your favourite pieces for later.</p><Btn onClick={()=>setPage("shop")}>Browse Collection</Btn></div>;
  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"52px 24px 80px"}}>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:400,color:"var(--charcoal)",marginBottom:36}}>Saved Pieces</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20}}>
        {wishlist.map(item=>(
          <div key={item.id} className="jewelry-card grow-in">
            <div style={{position:"relative",overflow:"hidden"}}>
              <img src={item.imageUrl} alt={item.name} style={{width:"100%",height:220,objectFit:"cover",display:"block"}} onError={e=>{e.target.style.display="none";}}/>
              <button onClick={()=>removeFromWishlist(item.id)} style={{position:"absolute",top:8,right:8,background:"rgba(255,255,255,.9)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="x" size={12} color="var(--smoke)"/></button>
            </div>
            <div style={{padding:"14px 16px 16px"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"var(--charcoal)",marginBottom:4}}>{item.name}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"var(--gold)",marginBottom:12}}>&#8377;{item.price.toLocaleString("en-IN")}</div>
              <Btn fullWidth onClick={()=>addToCart(item)} style={{fontSize:10}}><Icon name="cart" size={12} color="#fff"/>Move to Cart</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersPage({orders}) {
  if(!orders.length) return <div style={{textAlign:"center",padding:"80px 24px"}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:"var(--charcoal)",marginBottom:12}}>No Orders Yet</div><GoldLine/><p style={{color:"var(--smoke)",fontSize:13}}>Your order history will appear here after placing an order.</p></div>;
  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"52px 24px 80px"}}>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:400,color:"var(--charcoal)",marginBottom:36}}>Your Orders</h2>
      <div style={{display:"flex",flexDirection:"column",gap:20}}>
        {orders.map(order=>(
          <div key={order.id} style={{background:"var(--pearl)",border:"1px solid var(--cream)",borderRadius:"var(--r-lg)",padding:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontSize:11,color:"var(--smoke)",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:4}}>Order</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--charcoal)"}}>#{order.id}</div>
                <div style={{fontSize:12,color:"var(--smoke)",marginTop:2}}>{order.date}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <span style={{background:"rgba(42,107,69,.1)",color:"var(--success)",fontSize:10,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",padding:"4px 12px",borderRadius:20}}>Placed</span>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--gold)",marginTop:8}}>&#8377;{order.total.toLocaleString("en-IN")}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {order.items.map(({item,qty})=>(
                <div key={item.id} style={{display:"flex",gap:10,padding:12,background:"var(--linen)",borderRadius:"var(--r-md)",flex:"1 0 280px"}}>
                  <div style={{width:52,height:52,borderRadius:"var(--r)",overflow:"hidden",flexShrink:0,background:"var(--cream)"}}><img src={item.imageUrl} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/></div>
                  <div><div style={{fontSize:13,color:"var(--charcoal)",fontWeight:500}}>{item.name}</div><div style={{fontSize:11,color:"var(--smoke)"}}>Qty: {qty} · &#8377;{(item.price*qty).toLocaleString("en-IN")}</div></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthPage({onLogin,setPage}) {
  const [tab,setTab]=useState("login");
  const [form,setForm]=useState({name:"",email:"",password:""});
  const [err,setErr]=useState("");
  const set=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  const submit=()=>{if(!form.email||!form.password){setErr("Please fill all fields.");return;}if(tab==="signup"&&!form.name){setErr("Please enter your name.");return;}onLogin({name:form.name||form.email.split("@")[0],email:form.email,phone:"",address:""});setPage("home");};
  return (
    <div style={{maxWidth:420,margin:"80px auto",padding:"0 24px"}}>
      <div style={{background:"var(--pearl)",border:"1px solid var(--cream)",borderRadius:"var(--r-lg)",padding:44}}>
        <div style={{textAlign:"center",marginBottom:32}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:"var(--charcoal)",marginBottom:4}}>Welcome to Tanishq</div><GoldLine my={16}/></div>
        <div style={{display:"flex",marginBottom:28,borderBottom:"1px solid var(--cream)"}}>{[["login","Sign In"],["signup","Register"]].map(([t,l])=><button key={t} onClick={()=>setTab(t)} className={`tab-btn${tab===t?" active":""}`} style={{flex:1,textAlign:"center"}}>{l}</button>)}</div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {tab==="signup"&&<div><label style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--smoke)",display:"block",marginBottom:6}}>Full Name</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Your name" style={{width:"100%",padding:"11px 14px",border:"1px solid var(--cream)",borderRadius:"var(--r)",background:"var(--ivory)",outline:"none",fontSize:14}} onFocus={e=>e.target.style.border="1px solid var(--gold-lt)"} onBlur={e=>e.target.style.border="1px solid var(--cream)"}/></div>}
          <div><label style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--smoke)",display:"block",marginBottom:6}}>Email</label><input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="your@email.com" type="email" style={{width:"100%",padding:"11px 14px",border:"1px solid var(--cream)",borderRadius:"var(--r)",background:"var(--ivory)",outline:"none",fontSize:14}} onFocus={e=>e.target.style.border="1px solid var(--gold-lt)"} onBlur={e=>e.target.style.border="1px solid var(--cream)"}></input></div>
          <div><label style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--smoke)",display:"block",marginBottom:6}}>Password</label><input value={form.password} onChange={e=>set("password",e.target.value)} placeholder="........" type="password" style={{width:"100%",padding:"11px 14px",border:"1px solid var(--cream)",borderRadius:"var(--r)",background:"var(--ivory)",outline:"none",fontSize:14}} onFocus={e=>e.target.style.border="1px solid var(--gold-lt)"} onBlur={e=>e.target.style.border="1px solid var(--cream)"} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
          {err&&<div style={{fontSize:12,color:"var(--error)",padding:"8px 12px",background:"#FFF5F5",borderRadius:"var(--r)"}}>{err}</div>}
          <Btn fullWidth onClick={submit} style={{marginTop:8}}>{tab==="login"?"Sign In":"Create Account"}</Btn>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({user,updateUser,onLogout}) {
  const [form,setForm]=useState({name:user?.name||"",email:user?.email||"",phone:user?.phone||"",address:user?.address||""});
  const [saved,setSaved]=useState(false);
  const set=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  const save=()=>{updateUser(form);setSaved(true);setTimeout(()=>setSaved(false),2500);};
  return (
    <div style={{maxWidth:580,margin:"52px auto",padding:24}}>
      <div style={{background:"var(--pearl)",border:"1px solid var(--cream)",borderRadius:"var(--r-lg)",padding:40}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,background:"var(--gold-pale)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,border:"1px solid var(--gold-lt)",color:"var(--gold-dark)"}}>{user?.name?.[0]?.toUpperCase()||"U"}</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"var(--charcoal)"}}>{user?.name}</div>
          <div style={{fontSize:13,color:"var(--smoke)"}}>{user?.email}</div>
        </div>
        <GoldLine/>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {[["name","Full Name","text"],["email","Email","email"],["phone","Phone","tel"],["address","Address","text"]].map(([k,l,t])=>(
            <div key={k}><label style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--smoke)",display:"block",marginBottom:6}}>{l}</label><input value={form[k]} onChange={e=>set(k,e.target.value)} type={t} style={{width:"100%",padding:"11px 14px",border:"1px solid var(--cream)",borderRadius:"var(--r)",background:"var(--ivory)",outline:"none",fontSize:14}} onFocus={e=>e.target.style.border="1px solid var(--gold-lt)"} onBlur={e=>e.target.style.border="1px solid var(--cream)"}/></div>
          ))}
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <Btn fullWidth onClick={save} variant={saved?"outline":"primary"}>{saved?<><Icon name="check" size={13} color="currentColor"/>Saved</>:"Save Changes"}</Btn>
            <Btn onClick={onLogout} variant="ghost">Sign Out</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

const TEAM = [
  {name:"Arjun Sharma",role:"Lead AI Engineer",contact:"arjun.sharma@tanishqai.in",desc:"Architected the FAISS retrieval system and CLIP-based visual search pipeline. Expert in vector embeddings and multimodal AI.",skills:["FAISS","CLIP","Python","FastAPI"]},
  {name:"Priya Krishnan",role:"Frontend Developer",contact:"priya.krishnan@tanishqai.in",desc:"Designed and built the entire React frontend with a focus on luxury UX and performance optimisation.",skills:["React","JavaScript","CSS","UX Design"]},
  {name:"Rahul Mehta",role:"Backend Engineer",contact:"rahul.mehta@tanishqai.in",desc:"Developed the FastAPI backend, image path resolution system and catalog API endpoints.",skills:["FastAPI","Python","REST APIs","Docker"]},
  {name:"Sneha Patel",role:"Data Scientist",contact:"sneha.patel@tanishqai.in",desc:"Curated the jewellery dataset, built the labelling pipeline, and generated AI descriptions for all 490+ items.",skills:["Python","Pandas","Gemini AI","Data Pipeline"]},
  {name:"Vikram Nair",role:"ML Operations",contact:"vikram.nair@tanishqai.in",desc:"Manages model deployment, index rebuilding, and system monitoring for the production AI platform.",skills:["MLOps","Docker","Linux","Monitoring"]},
];

function DeveloperPage() {
  return (
    <div>
      <div style={{background:"linear-gradient(135deg,#0D0D0D 0%,#1C1C1C 100%)",padding:"72px 40px 64px",textAlign:"center"}}>
        <div style={{fontFamily:"'Pinyon Script',cursive",fontSize:20,color:"rgba(212,168,83,.6)",marginBottom:10}}>The Minds Behind</div>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:300,color:"var(--ivory)",marginBottom:16}}>Development Team</h2>
        <p style={{color:"#8A7A60",fontSize:14,fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif"}}>Tanishq AI Platform · Jewellery Intelligence Platform v2.1</p>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"72px 24px 80px"}}>
        <div style={{background:"var(--pearl)",border:"1px solid var(--cream)",borderLeft:"3px solid var(--gold)",borderRadius:"var(--r-lg)",padding:"32px 36px",marginBottom:56}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:"var(--charcoal)",marginBottom:16}}>About the Project</div>
          <p style={{fontSize:14,lineHeight:1.9,color:"var(--graphite)",marginBottom:16}}>The Tanishq AI Platform is an advanced multimodal jewellery discovery system combining CLIP visual embeddings, FAISS vector search, and Gemini AI to help customers find their perfect piece from the Tanishq catalogue.</p>
          <p style={{fontSize:14,lineHeight:1.9,color:"var(--graphite)"}}>The system supports text search, voice input, image upload, and sketch-based retrieval with strict category enforcement. Zero hallucination is guaranteed: only real dataset images are ever returned.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginTop:24}}>
            {[["490+","Jewellery Items"],["CLIP ViT-B/32","Visual Embeddings"],["Gemini 2.5","Language AI"],["FAISS","Vector Search"]].map(([val,label])=>(
              <div key={label} style={{textAlign:"center",padding:"16px 12px",background:"var(--linen)",borderRadius:"var(--r-md)"}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"var(--gold)",marginBottom:4}}>{val}</div>
                <div style={{fontSize:10,color:"var(--smoke)",letterSpacing:"1px",textTransform:"uppercase"}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:400,color:"var(--charcoal)",textAlign:"center",marginBottom:8}}>Meet the Team</h3>
        <GoldLine my={24}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24}}>
          {TEAM.map(member=>(
            <div key={member.name} style={{background:"var(--pearl)",border:"1px solid var(--cream)",borderRadius:"var(--r-lg)",padding:28,transition:"all .3s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="var(--shadow-g)";e.currentTarget.style.borderColor="rgba(184,134,11,.25)";}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor="var(--cream)";}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:"var(--gold-pale)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,border:"1.5px solid rgba(184,134,11,.2)"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:"var(--gold-dark)"}}>{member.name[0]}</span></div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"var(--charcoal)",marginBottom:2}}>{member.name}</div>
              <div style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--gold)",marginBottom:12}}>{member.role}</div>
              <p style={{fontSize:13,lineHeight:1.8,color:"var(--smoke)",marginBottom:16}}>{member.desc}</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>{member.skills.map(s=><span key={s} style={{fontSize:10,padding:"2px 8px",background:"var(--linen)",border:"1px solid var(--cream)",borderRadius:12,color:"var(--graphite)",letterSpacing:".3px"}}>{s}</span>)}</div>
              <a href={`mailto:${member.contact}`} style={{display:"flex",alignItems:"center",gap:6,color:"var(--smoke)",fontSize:11,textDecoration:"none"}} onMouseEnter={e=>e.currentTarget.style.color="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.color="var(--smoke)"}><Icon name="mail" size={12} color="currentColor"/>{member.contact}</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FAQ({question,answer}) {
  const [open,setOpen]=useState(false);
  return (
    <div style={{borderBottom:"1px solid var(--cream)",padding:"18px 0"}}>
      <button onClick={()=>setOpen(p=>!p)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,textAlign:"left"}}>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"var(--charcoal)",fontWeight:400}}>{question}</span>
        <Icon name={open?"minus":"plus"} size={14} color="var(--gold)"/>
      </button>
      {open&&<p style={{fontSize:13,lineHeight:1.9,color:"var(--smoke)",marginTop:10}}>{answer}</p>}
    </div>
  );
}

function SupportPage() {
  const [form,setForm]=useState({name:"",email:"",issue:"",message:""});
  const [submitted,setSubmitted]=useState(false);
  const set=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  const submit=()=>{if(!form.name||!form.message)return;setSubmitted(true);};
  return (
    <div>
      <div style={{background:"linear-gradient(135deg,#0D0D0D 0%,#1C1C1C 100%)",padding:"72px 40px 64px",textAlign:"center"}}>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:300,color:"var(--ivory)",marginBottom:16}}>Customer Support</h2>
        <p style={{color:"#8A7A60",fontSize:14,fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif"}}>We are here to assist you with every jewellery query</p>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"72px 24px 80px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24,marginBottom:64}}>
          {[{icon:"phone",title:"Call Us",sub:"Quick Support",value:"1800-266-0123",note:"Mon-Sat, 10AM-7PM IST",action:"tel:18002660123",actionLabel:"Call Now"},{icon:"mail",title:"Email Us",sub:"Response within 24 hrs",value:"care@tanishq.co.in",note:"Available 7 days a week",action:"mailto:care@tanishq.co.in",actionLabel:"Send Email"},{icon:"map",title:"Visit a Store",sub:"In-person experience",value:"Find Nearest Store",note:"1000+ stores across India",action:"https://www.tanishq.co.in/store-locator",actionLabel:"Find Store"}].map(item=>(
            <div key={item.title} style={{background:"var(--pearl)",border:"1px solid var(--cream)",borderRadius:"var(--r-lg)",padding:32,textAlign:"center",transition:"all .3s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow="var(--shadow-g)";e.currentTarget.style.borderColor="rgba(184,134,11,.25)";}} onMouseLeave={e=>{e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor="var(--cream)";}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:"var(--gold-pale)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",border:"1.5px solid rgba(184,134,11,.2)"}}><Icon name={item.icon} size={22} color="var(--gold-dark)"/></div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--charcoal)",marginBottom:4}}>{item.title}</div>
              <div style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--gold)",marginBottom:12}}>{item.sub}</div>
              <div style={{fontSize:14,fontWeight:500,color:"var(--charcoal)",marginBottom:4}}>{item.value}</div>
              <div style={{fontSize:12,color:"var(--smoke)",marginBottom:20}}>{item.note}</div>
              <a href={item.action} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 20px",background:"var(--charcoal)",color:"var(--gold-pale)",borderRadius:"var(--r)",fontSize:10,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",textDecoration:"none",transition:"background .2s"}} onMouseEnter={e=>e.currentTarget.style.background="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.background="var(--charcoal)"}>{item.actionLabel}</a>
            </div>
          ))}
        </div>
        <div style={{background:"linear-gradient(135deg,var(--charcoal) 0%,#2A1F0A 100%)",borderRadius:"var(--r-lg)",padding:"32px 40px",marginBottom:56,display:"flex",alignItems:"center",justifyContent:"space-between",gap:24,flexWrap:"wrap"}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:"var(--ivory)",marginBottom:8}}>Need Immediate Help?</div>
            <p style={{color:"#8A7A60",fontSize:13}}>Our jewellery concierge team is ready to assist you right now</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:"var(--gold-lt)"}}>1800-266-0123</div>
              <div style={{fontSize:11,color:"rgba(250,248,243,.4)",letterSpacing:"1px"}}>Toll Free · Mon-Sat 10AM-7PM</div>
            </div>
            <a href="tel:18002660123" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 24px",background:"var(--gold)",color:"var(--onyx)",borderRadius:"var(--r)",fontSize:11,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",textDecoration:"none"}}><Icon name="phone" size={14} color="var(--onyx)"/>Call Now</a>
          </div>
        </div>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:400,color:"var(--charcoal)",textAlign:"center",marginBottom:8}}>Send Us a Message</h3>
          <GoldLine my={20}/>
          {submitted?(
            <div style={{textAlign:"center",padding:"48px",background:"var(--pearl)",border:"1px solid var(--cream)",borderRadius:"var(--r-lg)"}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:"rgba(42,107,69,.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Icon name="check" size={22} color="var(--success)"/></div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"var(--charcoal)",marginBottom:8}}>Message Received</div>
              <p style={{color:"var(--smoke)",fontSize:13}}>Our team will respond to your query within 24 hours.</p>
            </div>
          ):(
            <div style={{background:"var(--pearl)",border:"1px solid var(--cream)",borderRadius:"var(--r-lg)",padding:40}}>
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                {[["name","Your Name","text"],["email","Email Address","email"]].map(([k,l,t])=>(
                  <div key={k}><label style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--smoke)",display:"block",marginBottom:6}}>{l}</label><input value={form[k]} onChange={e=>set(k,e.target.value)} type={t} style={{width:"100%",padding:"11px 14px",border:"1px solid var(--cream)",borderRadius:"var(--r)",background:"var(--ivory)",outline:"none",fontSize:14}} onFocus={e=>e.target.style.border="1px solid var(--gold-lt)"} onBlur={e=>e.target.style.border="1px solid var(--cream)"}/></div>
                ))}
                <div><label style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--smoke)",display:"block",marginBottom:6}}>Issue Type</label><select value={form.issue} onChange={e=>set("issue",e.target.value)} style={{width:"100%",padding:"11px 14px",border:"1px solid var(--cream)",borderRadius:"var(--r)",background:"var(--ivory)",outline:"none",fontSize:14,color:"var(--charcoal)"}}><option value="">Select issue type</option><option>Order Status</option><option>Product Quality</option><option>Return / Exchange</option><option>AI Search Help</option><option>Other</option></select></div>
                <div><label style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--smoke)",display:"block",marginBottom:6}}>Your Message</label><textarea value={form.message} onChange={e=>set("message",e.target.value)} rows={5} placeholder="Describe your query in detail..." style={{width:"100%",padding:"11px 14px",border:"1px solid var(--cream)",borderRadius:"var(--r)",background:"var(--ivory)",outline:"none",fontSize:14,resize:"vertical",fontFamily:"'Jost',sans-serif"}} onFocus={e=>e.target.style.border="1px solid var(--gold-lt)"} onBlur={e=>e.target.style.border="1px solid var(--cream)"}/></div>
                <Btn fullWidth onClick={submit} style={{marginTop:8}}><Icon name="send" size={14} color="#fff"/>Send Message</Btn>
              </div>
            </div>
          )}
        </div>
        <div style={{maxWidth:720,margin:"60px auto 0"}}>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:400,color:"var(--charcoal)",textAlign:"center",marginBottom:8}}>Frequently Asked Questions</h3>
          <GoldLine my={20}/>
          {[["How does the AI search work?","Our AI uses CLIP visual embeddings to understand your text description, image upload, or voice query and finds the most visually and semantically similar jewellery from the Tanishq dataset."],["Why does the search only show rings or necklaces?","The system enforces strict category matching. If you search for a ring, only rings are returned. This prevents cross-category errors and ensures accurate results."],["What if I upload an image and get no results?","Ensure the image clearly shows a ring or necklace. The AI must detect the category. If no close match exists, the system displays the no-match message."],["Are all products BIS certified?","Yes. All Tanishq jewellery is BIS hallmarked and certified for purity and quality."],["What is your return policy?","We offer a 30-day hassle-free return policy on all purchases. Contact us at care@tanishq.co.in or call 1800-266-0123 to initiate a return."]].map(([q,a],i)=><FAQ key={i} question={q} answer={a}/>)}
        </div>
      </div>
    </div>
  );
}

function ChatBot() {
  const [open,setOpen]=useState(false);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [messages,setMessages]=useState([{role:"assistant",text:"Hello, I am Priya, your Tanishq jewellery concierge. How may I assist you today?"}]);
  const endRef=useRef();
  const quickReplies=["Show necklaces","Diamond rings","Bridal jewellery","Price range"];
  const send=async()=>{
    if(!input.trim()||loading)return;
    const userMsg=input.trim();setInput("");
    setMessages(p=>[...p,{role:"user",text:userMsg}]);
    setLoading(true);
    await new Promise(r=>setTimeout(r,900));
    const q=userMsg.toLowerCase();
    let response="I can help you find the perfect Tanishq piece. Please visit our AI Search to find jewellery by description, image, or voice.";
    if(q.includes("necklace"))response="Our necklace collection features exquisite gold pendants, diamond chains, and heritage Kundan sets. Browse the Collection page to explore all 300+ designs.";
    else if(q.includes("ring"))response="Our ring collection includes solitaires, diamond eternity bands, and traditional gold designs. Use AI Search to find your perfect ring.";
    else if(q.includes("price")||q.includes("cost"))response="Our jewellery ranges from Rs.18,000 for elegant gold bands to over Rs.1,50,000 for premium diamond pieces. All prices include taxes.";
    else if(q.includes("bridal")||q.includes("wedding"))response="We have a dedicated bridal collection with heritage Kundan sets, Polki necklaces, and matching ring sets. Search 'bridal necklace' in AI Search.";
    else if(q.includes("support")||q.includes("help"))response="For immediate assistance, please call 1800-266-0123 (Mon-Sat, 10AM-7PM) or visit our Support page.";
    setMessages(p=>[...p,{role:"assistant",text:response}]);
    setLoading(false);
  };
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages,loading]);
  return (
    <>
      <button onClick={()=>setOpen(p=>!p)} style={{position:"fixed",bottom:24,right:24,width:52,height:52,background:"var(--charcoal)",border:"none",borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 28px rgba(0,0,0,.3)",zIndex:900,transition:"transform .2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.08)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}><Icon name="chat" size={22} color="var(--gold-lt)"/></button>
      {open&&(
        <div style={{position:"fixed",bottom:88,right:24,width:340,height:480,background:"var(--pearl)",borderRadius:"var(--r-lg)",boxShadow:"0 16px 52px rgba(0,0,0,.22)",zIndex:890,display:"flex",flexDirection:"column",border:"1px solid var(--cream)",animation:"slideIn .3s ease both"}}>
          <div style={{background:"linear-gradient(135deg,var(--charcoal),#2A1F0A)",padding:"16px 20px",borderRadius:"var(--r-lg) var(--r-lg) 0 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:34,height:34,background:"var(--gold-pale)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"var(--gold-dark)",fontWeight:600}}>P</div>
              <div><div style={{color:"var(--ivory)",fontSize:13,fontWeight:600,letterSpacing:".5px"}}>Priya · Tanishq AI</div><div style={{color:"var(--gold-lt)",fontSize:10,letterSpacing:".5px"}}>Online · Here to help</div></div>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",cursor:"pointer"}}><Icon name="x" size={14} color="rgba(255,255,255,.5)"/></button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"14px",display:"flex",flexDirection:"column",gap:10}}>
            {messages.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}><div style={{maxWidth:"84%",padding:"10px 14px",fontSize:13,lineHeight:1.65,background:m.role==="user"?"var(--gold)":"var(--linen)",color:m.role==="user"?"#fff":"var(--charcoal)",borderRadius:m.role==="user"?"12px 3px 12px 12px":"3px 12px 12px 12px"}}>{m.text}</div></div>)}
            {loading&&<div style={{display:"flex",gap:4,padding:"8px 14px"}}><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></div>}
            <div ref={endRef}/>
          </div>
          <div style={{padding:"8px 12px",borderTop:"1px solid var(--cream)",display:"flex",gap:6,flexWrap:"wrap"}}>
            {quickReplies.map(q=><button key={q} onClick={()=>setInput(q)} style={{padding:"4px 10px",border:"1px solid var(--cream)",borderRadius:20,background:"transparent",color:"var(--gold-dark)",fontSize:10,cursor:"pointer",letterSpacing:".3px"}}>{q}</button>)}
          </div>
          <div style={{padding:"10px",borderTop:"1px solid var(--cream)",display:"flex",gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask me anything..." style={{flex:1,padding:"9px 14px",border:"1px solid var(--cream)",borderRadius:"var(--r-md)",fontSize:12,outline:"none",background:"var(--ivory)"}} onFocus={e=>e.target.style.border="1px solid var(--gold-lt)"} onBlur={e=>e.target.style.border="1px solid var(--cream)"}/>
            <button onClick={send} disabled={loading} style={{width:36,height:36,background:"var(--gold)",border:"none",borderRadius:"var(--r-md)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="send" size={14} color="#fff"/></button>
          </div>
        </div>
      )}
    </>
  );
}

function Footer({setPage}) {
  return (
    <footer style={{background:"var(--onyx)",color:"#6A6A6A",padding:"56px 40px 36px",borderTop:"1px solid rgba(184,134,11,.12)"}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr",gap:40,marginBottom:48}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"var(--gold-pale)",marginBottom:4,letterSpacing:"1px"}}>Tanishq</div>
            <div style={{fontSize:9,color:"var(--gold)",letterSpacing:"3px",marginBottom:16,textTransform:"uppercase"}}>AI Jewellery Platform</div>
            <p style={{fontSize:12,lineHeight:1.9,color:"#5A5A5A"}}>BIS certified jewellery. Zero hallucination AI retrieval. India's most trusted jewellery brand since 1994.</p>
          </div>
          <div>
            <div style={{fontSize:9,letterSpacing:"2.5px",textTransform:"uppercase",color:"var(--gold)",marginBottom:16}}>Collections</div>
            {["Necklaces","Rings"].map(c=><button key={c} onClick={()=>setPage("shop")} style={{display:"block",background:"none",border:"none",cursor:"pointer",color:"#5A5A5A",fontSize:12,padding:"4px 0",textAlign:"left",letterSpacing:".3px",transition:"color .2s"}} onMouseEnter={e=>e.currentTarget.style.color="var(--gold-lt)"} onMouseLeave={e=>e.currentTarget.style.color="#5A5A5A"}>{c}</button>)}
          </div>
          <div>
            <div style={{fontSize:9,letterSpacing:"2.5px",textTransform:"uppercase",color:"var(--gold)",marginBottom:16}}>Support</div>
            <div style={{fontSize:12,lineHeight:2.4,color:"#5A5A5A"}}>
              <button onClick={()=>setPage("support")} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:"var(--gold-lt)",fontSize:13,fontWeight:500,padding:"0 0 6px",letterSpacing:".3px"}}><Icon name="phone" size={12} color="var(--gold-lt)"/>1800-266-0123</button>
              <div>Mon-Sat, 10AM-7PM IST</div>
              <div>care@tanishq.co.in</div>
            </div>
          </div>
          <div>
            <div style={{fontSize:9,letterSpacing:"2.5px",textTransform:"uppercase",color:"var(--gold)",marginBottom:16}}>Navigate</div>
            {[["AI Search","search"],["Browse Collection","shop"],["Our Team","developer"],["Support","support"],["My Orders","orders"]].map(([l,p])=><button key={l} onClick={()=>setPage(p)} style={{display:"block",background:"none",border:"none",cursor:"pointer",color:"#5A5A5A",fontSize:12,padding:"4px 0",textAlign:"left",letterSpacing:".3px",transition:"color .2s"}} onMouseEnter={e=>e.currentTarget.style.color="var(--gold-lt)"} onMouseLeave={e=>e.currentTarget.style.color="#5A5A5A"}>{l}</button>)}
          </div>
        </div>
        <div style={{borderTop:"1px solid rgba(184,134,11,.08)",paddingTop:24,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,flexWrap:"wrap",gap:8,letterSpacing:".3px"}}>
          <span style={{color:"#4A4A4A"}}>© 2026 Tanishq AI Platform · All Rights Reserved · BIS Certified</span>
          <span style={{color:"rgba(184,134,11,.4)"}}>Crafted with AI · Built by Navigate Labs</span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  useEffect(()=>injectStyles(),[]);
  const [page,setPage]=useState("home");
  const [user,setUser]=useState(null);
  const [cart,setCart]=useState([]);
  const [wishlist,setWishlist]=useState([]);
  const [orders,setOrders]=useState([]);
  const [toast,setToast]=useState(null);
  const showToast=(msg,type="success")=>setToast({msg,type});
  const addToCart=(item)=>{setCart(prev=>{const ex=prev.find(c=>c.item.id===item.id);if(ex)return prev.map(c=>c.item.id===item.id?{...c,qty:c.qty+1}:c);return[...prev,{item,qty:1}];});showToast(`${item.name} added to cart`);};
  const removeFromCart=(id)=>setCart(prev=>prev.filter(c=>c.item.id!==id));
  const updateQty=(id,qty)=>{if(qty<1){removeFromCart(id);return;}setCart(prev=>prev.map(c=>c.item.id===id?{...c,qty}:c));};
  const addToWishlist=(item)=>{if(wishlist.find(w=>w.id===item.id)){showToast("Already in wishlist","error");return;}setWishlist(prev=>[...prev,item]);showToast(`${item.name} saved to wishlist`);};
  const removeFromWishlist=(id)=>setWishlist(prev=>prev.filter(w=>w.id!==id));
  const placeOrder=()=>{
    if(!cart.length)return;
    const total=Math.round(cart.reduce((s,{item,qty})=>s+item.price*qty,0)*1.03);
    const order={id:`TQ${Date.now().toString().slice(-6)}`,date:new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),status:"placed",items:[...cart],total};
    setOrders(prev=>[order,...prev]);setCart([]);showToast(`Order #${order.id} placed successfully`);setPage("orders");
  };
  const shared={addToCart,addToWishlist,user,setPage};
  const pages={
    home:<HomePage setPage={setPage}/>,
    search:<SearchPage {...shared}/>,
    shop:<ShopPage {...shared}/>,
    cart:<CartPage cart={cart} removeFromCart={removeFromCart} updateQty={updateQty} placeOrder={placeOrder} setPage={setPage}/>,
    wishlist:<WishlistPage wishlist={wishlist} removeFromWishlist={removeFromWishlist} addToCart={addToCart} setPage={setPage}/>,
    orders:<OrdersPage orders={orders}/>,
    profile:<ProfilePage user={user} updateUser={u=>setUser(prev=>({...prev,...u}))} onLogout={()=>{setUser(null);setPage("home");}}/>,
    auth:<AuthPage onLogin={setUser} setPage={setPage}/>,
    developer:<DeveloperPage/>,
    support:<SupportPage/>,
  };
  return (
    <div>
      <Navbar page={page} setPage={setPage} user={user} cartCount={cart.length} wishCount={wishlist.length} onLogout={()=>{setUser(null);setPage("home");}}/>
      <main style={{minHeight:"65vh"}}>{pages[page]||pages.home}</main>
      <Footer setPage={setPage}/>
      <ChatBot/>
      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}
