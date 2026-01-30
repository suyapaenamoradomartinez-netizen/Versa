// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider,
  signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  setPersistence, browserLocalPersistence, getAdditionalUserInfo
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
  getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot,
  doc, updateDoc, deleteDoc, runTransaction, getDoc, setDoc, getDocs, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Tu config (la que ya me diste)
const firebaseConfig = {
  apiKey: "AIzaSyBsYiC08WUFzHjjKrlqbefRaBTmR_LUn4o",
  authDomain: "versa-625d6.firebaseapp.com",
  projectId: "versa-625d6",
  storageBucket: "versa-625d6.firebasestorage.app",
  messagingSenderId: "276866889012",
  appId: "1:276866889012:web:b256bdfb5cc09e3433a161",
  measurementId: "G-JM2CX4G493"
};

// Init
const app = initializeApp(firebaseConfig);
isSupported().then(ok => { if(ok){ try{ getAnalytics(app); }catch{} }});
const auth = getAuth(app);
const db = getFirestore(app);
await setPersistence(auth, browserLocalPersistence);
const googleProvider = new GoogleAuthProvider();

// ======= DOM =======
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const menuButtons = document.querySelectorAll(".menu .item");
const contentSections = {
  feed: document.getElementById("sec-feed"),
  editor: document.getElementById("sec-editor"),
  profile: document.getElementById("sec-profile"),
  drafts: document.getElementById("sec-drafts"),
  archived: document.getElementById("sec-archived"),
  config: document.getElementById("sec-config"),
};

const feedList = document.getElementById("feed-list");
const listaBorradores = document.getElementById("lista-borradores");
const listaArchivados = document.getElementById("lista-archivados");

const authStatus = document.getElementById("auth-status");
const miniStatus = document.getElementById("auth-mini-status");
const btnLoginGoogle = document.getElementById("btn-login-google");
const btnLoginEmail = document.getElementById("btn-login-email");
const btnLoginEmailMini = document.getElementById("btn-login-email-mini");
const btnSignupEmail = document.getElementById("btn-signup-email");
const btnLogout = document.getElementById("btn-logout");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");

const editorText = document.getElementById("editor-text");
const editorPaper = document.getElementById("editor-paper");
const editorHint = document.getElementById("editor-hint");
const btnPublicar = document.getElementById("btn-publicar");
const btnBorrador = document.getElementById("btn-borrador");
const tBold = document.getElementById("t-bold");
const tFont = document.getElementById("t-font");
const shadowColor = document.getElementById("shadow-color");
const wordCountEl = document.getElementById("word-count");

const pName = document.getElementById("p-name");
const pHandle = document.getElementById("p-handle");
const pSignature = document.getElementById("p-signature");
const pBio = document.getElementById("p-bio");
const btnSaveProfile = document.getElementById("btn-save-profile");

const toggleTecleo = document.getElementById("toggle-tecleo");
const toggleFresas = document.getElementById("toggle-fresas");
const toggleDark = document.getElementById("toggle-dark");
const toggleCompact = document.getElementById("toggle-compact");

const toast = document.getElementById("toast");
const rain = document.getElementById("strawberry-rain");

// ======= CONFIG LOCAL =======
const cfgKey = "versa_cfg_v1";
function loadCfg(){
  try{ return JSON.parse(localStorage.getItem(cfgKey)) ?? { tecleo:false, fresas:true, dark:false, compact:false, shadow:"#f7c9d4" }; }
  catch{ return { tecleo:false, fresas:true, dark:false, compact:false, shadow:"#f7c9d4" }; }
}
function saveCfg(c){ localStorage.setItem(cfgKey, JSON.stringify(c)); }
let cfg = loadCfg();

toggleTecleo.checked = cfg.tecleo;
toggleFresas.checked = cfg.fresas;
toggleDark.checked   = cfg.dark;
toggleCompact.checked= cfg.compact;
shadowColor.value    = cfg.shadow;
applyTheme();
applyCompact();
setShadowColor(cfg.shadow);

// ======= UTILS =======
function showToast(msg, type="ok"){
  toast.textContent = msg;
  toast.style.background = type==="err" ? "rgba(224,86,86,.95)" : "rgba(176,110,122,.95)";
  toast.classList.remove("hidden");
  setTimeout(()=> toast.classList.add("hidden"), 2400);
}
function strawberryRain(){
  if(!cfg.fresas) return;
  const count = 40;
  for(let i=0;i<count;i++){
    const s = document.createElement("div");
    s.className = "strawberry";
    s.textContent = "🍓";
    s.style.left = Math.random()*100 + "vw";
    s.style.animationDelay = (Math.random()*0.8)+"s";
    s.style.fontSize = (24 + Math.random()*10) + "px";
    rain.appendChild(s);
    setTimeout(()=> s.remove(), 3600);
  }
}
function escapeHtml(str){
  return (str ?? "").replace(/[&<>"']/g, s => (
    { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[s]
  ));
}
function applyTheme(){ document.body.classList.toggle("dark", cfg.dark); }
function applyCompact(){
  sidebar.classList.toggle("compact", cfg.compact);
  sidebar.classList.add("elevation");
}
function setShadowColor(hex){
  document.documentElement.style.setProperty("--shadow-color", hex || "#f7c9d4");
}

// ======= SONIDO MÁQUINA DE ESCRIBIR =======
let audioCtx;
function typewriterClick(){
  if(!toggleTecleo.checked) return;
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const noise = audioCtx.createBufferSource();
    // pequeño "click" + ruido corto para sensación mecánica
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate*0.03, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for(let i=0;i<data.length;i++){ data[i] = (Math.random()*2-1)*Math.pow(1-i/data.length,3)*0.6; }
    noise.buffer = buf; noise.connect(g);

    o.type = "square";
    o.frequency.value = 900 + Math.random()*120; // variación
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.07);

    o.connect(g); g.connect(audioCtx.destination);
    o.start(); noise.start();
    o.stop(audioCtx.currentTime + 0.08);
    noise.stop(audioCtx.currentTime + 0.08);
  }catch{}
}
let keyThrottle=0;
editorText.addEventListener("keydown", ()=>{
  const now = Date.now();
  if(now - keyThrottle > 40){ keyThrottle = now; typewriterClick(); }
});

// ======= SIDEBAR =======
sidebarToggle.addEventListener("click", ()=>{
  cfg.compact = !cfg.compact;
  saveCfg(cfg);
  applyCompact();
  // brillo de fresa al abrir
  sidebarToggle.querySelector(".glow-strawberry").style.filter = "drop-shadow(0 0 10px rgba(255,105,180,.9))";
  setTimeout(()=> sidebarToggle.querySelector(".glow-strawberry").style.filter = "drop-shadow(0 0 6px rgba(255,105,180,.6))", 500);
});

// Navegación
menuButtons.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    menuButtons.forEach(b=> b.classList.remove("active"));
    btn.classList.add("active");
    const sec = btn.getAttribute("data-section");
    Object.values(contentSections).forEach(s=> s.classList.remove("visible"));
    contentSections[sec].classList.add("visible");
    // al abrir por fresa (logo-btn) también
  });
});

// ======= TOOLBAR EDITOR =======
tBold.addEventListener("click", ()=>{
  document.execCommand?.("bold"); // por si usas contenteditable en el futuro
  // para textarea: alternamos ** ** ; aquí mantenemos simple
});
tFont.addEventListener("change", ()=>{
  editorText.style.fontFamily = tFont.value + ", serif";
});
document.querySelectorAll(".toolbar [data-align]").forEach(b=>{
  b.addEventListener("click", ()=>{
    const a = b.getAttribute("data-align");
    editorText.style.textAlign = a;
  });
});
shadowColor.addEventListener("input", ()=>{
  cfg.shadow = shadowColor.value; saveCfg(cfg); setShadowColor(cfg.shadow);
});

// Contador palabras
editorText.addEventListener("input", ()=>{
  const words = (editorText.value.trim().match(/\S+/g) || []).length;
  wordCountEl.textContent = `${words} palabra${words===1?"":"s"}`;
});

// ======= CONFIG =======
toggleTecleo.addEventListener("change", ()=>{ cfg.tecleo = toggleTecleo.checked; saveCfg(cfg); });
toggleFresas.addEventListener("change", ()=>{ cfg.fresas = toggleFresas.checked; saveCfg(cfg); });
toggleDark.addEventListener("change", ()=>{ cfg.dark   = toggleDark.checked; saveCfg(cfg); applyTheme(); });
toggleCompact.addEventListener("change", ()=>{ cfg.compact= toggleCompact.checked; saveCfg(cfg); applyCompact(); });

// ======= AUTH =======
btnLoginGoogle.addEventListener("click", async ()=>{
  try{
    const res = await signInWithPopup(auth, googleProvider);
    const info = getAdditionalUserInfo(res);
    if(info?.isNewUser){ strawberryRain(); showToast("¡Bienvenida! 🍓"); }
  }catch(e){ showToast("No se pudo iniciar con Google: " + (e?.message ?? e), "err"); }
});
btnLoginEmail?.addEventListener("click", async ()=>{
  const email = (emailInput.value||"").trim(); const password = passInput.value||"";
  if(!email || !password) return showToast("Completa email y contraseña", "err");
  try{ await signInWithEmailAndPassword(auth,email,password); }catch(e){ showToast(e?.message || "Error", "err"); }
});
btnLoginEmailMini?.addEventListener("click", ()=>{
  // Atajo: enfoca controles de arriba
  emailInput?.scrollIntoView({behavior:"smooth", block:"center"});
  emailInput?.focus();
});
btnSignupEmail?.addEventListener("click", async ()=>{
  const email = (emailInput.value||"").trim(); const password = passInput.value||"";
  if(!email || !password) return showToast("Completa email y contraseña", "err");
  try{ await createUserWithEmailAndPassword(auth,email,password); strawberryRain(); showToast("Cuenta creada 🍓"); }
  catch(e){ showToast(e?.message || "No se pudo crear", "err"); }
});
btnLogout.addEventListener("click", async ()=>{ try{ await signOut(auth);}catch(e){ showToast("Error al salir", "err"); } });

let currentUser=null;
let unsubFeed=null, unsubDrafts=null, unsubArchived=null;
let followingSet=new Set(); // ids que sigo

function clearSubs(){ if(unsubFeed){unsubFeed();unsubFeed=null;} if(unsubDrafts){unsubDrafts();unsubDrafts=null;} if(unsubArchived){unsubArchived();unsubArchived=null;} }

onAuthStateChanged(auth, async (user)=>{
  currentUser = user || null;
  if(user){
    const name = user.displayName || user.email?.split("@")[0] || "anónimo";
    authStatus.textContent = `Conectada como ${name}`;
    miniStatus.textContent = name;
    btnLogout.classList.remove("hidden");
  }else{
    authStatus.textContent = "Desconectada";
    miniStatus.textContent = "Desconectada";
    btnLogout.classList.add("hidden");
  }

  // Habilitar/deshabilitar editor
  const canEdit = !!currentUser;
  btnPublicar.disabled = !canEdit;
  btnBorrador.disabled = !canEdit;
  editorHint.textContent = canEdit ? "Listo para crear 💖" : "Debes iniciar sesión para publicar o guardar.";

  // Cargar perfil
  await loadProfile();

  // Suscripciones
  await loadFollowing(); // llena followingSet
  subscribeLists();
});

// ======= PERFIL =======
async function loadProfile(){
  if(!currentUser){ pName.value=""; pHandle.value=""; pSignature.value=""; pBio.value=""; return; }
  const snap = await getDoc(doc(db,"users", currentUser.uid));
  const data = snap.exists() ? snap.data() : {};
  pName.value = data.name || (currentUser.displayName || "");
  pHandle.value = data.handle || (currentUser.email?.split("@")[0] || "");
  pSignature.value = data.signature || "— " + (pName.value || "Anónimo");
  pBio.value = data.bio || "";
}
btnSaveProfile.addEventListener("click", async ()=>{
  if(!currentUser) return showToast("Inicia sesión", "err");
  const payload = {
    name:(pName.value||"").trim(),
    handle:(pHandle.value||"").trim(),
    signature:(pSignature.value||"").trim(),
    bio:(pBio.value||"").trim(),
    updatedAt: serverTimestamp()
  };
  await setDoc(doc(db,"users", currentUser.uid), payload, { merge:true });
  showToast("Perfil actualizado ✨");
});

// ======= FOLLOW =======
async function loadFollowing(){
  followingSet.clear();
  if(!currentUser) return;
  const q = await getDocs(collection(db, "users", currentUser.uid, "following"));
  q.forEach(d=> followingSet.add(d.id));
}
async function toggleFollow(authorId){
  if(!currentUser) return showToast("Inicia sesión para seguir", "err");
  if(authorId===currentUser.uid) return; // no te sigues a ti
  const ref = doc(db,"users",currentUser.uid,"following",authorId);
  const snap = await getDoc(ref);
  if(snap.exists()){
    await deleteDoc(ref);
    followingSet.delete(authorId);
    showToast("Dejaste de seguir");
  }else{
    await setDoc(ref, { createdAt: serverTimestamp() });
    followingSet.add(authorId);
    strawberryRain(); // lluvia de fresas al seguir
    showToast("Ahora sigues a esta persona 🍓");
  }
  subscribeLists(); // refresca feed
}

// ======= POSTS =======
function subscribeLists(){
  clearSubs();
  // FEED: traemos últimos 60 publicados (simple) y filtramos por following + yo
  unsubFeed = onSnapshot(
    query(collection(db,"posts"), where("status","==","publicado"), orderBy("publishedAt","desc"), limit(60)),
    (snap)=> {
      const docs = snap.docs.filter(d=>{
        const a = d.data().authorId;
        return currentUser ? (a===currentUser.uid || followingSet.has(a)) : true; // si no hay sesión, muestra todo
      });
      renderPostList(feedList, docs, "feed");
    }
  );

  if(currentUser){
    unsubDrafts = onSnapshot(
      query(collection(db,"posts"), where("authorId","==",currentUser.uid), where("status","==","borrador"), orderBy("createdAt","desc")),
      (snap)=> renderPostList(listaBorradores, snap.docs, "borradores")
    );
    unsubArchived = onSnapshot(
      query(collection(db,"posts"), where("authorId","==",currentUser.uid), where("status","==","archivado"), orderBy("createdAt","desc")),
      (snap)=> renderPostList(listaArchivados, snap.docs, "archivados")
    );
  }else{
    listaBorradores.innerHTML = `<div class="card">Inicia sesión para ver borradores</div>`;
    listaArchivados.innerHTML = `<div class="card">Inicia sesión para ver archivados</div>`;
  }
}

function truncateText(text, maxChars=420){
  if(text.length<=maxChars) return { short:text, truncated:false };
  const cut = text.slice(0, maxChars);
  const last = Math.max(cut.lastIndexOf(" "), cut.lastIndexOf("\n"));
  const short = (last>320? cut.slice(0,last) : cut) + "…";
  return { short, truncated:true };
}

function renderPostList(container, docs, contexto){
  container.innerHTML = "";
  if(!docs.length){
    container.innerHTML = `<div class="card blossom-corners"><div class="meta">No hay elementos aún.</div></div>`;
    return;
  }
  docs.forEach(d=>{
    const data = d.data();
    const id = d.id;
    const title = data.title || "Sin título";
    const body = data.texto || "";
    const author = data.authorName || "anónimo";
    const authorId = data.authorId;
    const signature = data.signature || ("— " + author);
    const date = (data.publishedAt || data.createdAt)?.toDate?.() || new Date();
    const likesCount = data.likesCount || 0;
    const likedBy = data.likedBy || [];
    const iLike = currentUser ? likedBy.includes(currentUser.uid) : false;

    const { short, truncated } = truncateText(body, 520);

    const card = document.createElement("div");
    card.className = "card blossom-corners elevation";
    card.innerHTML = `
      <div class="meta"><span>${date.toLocaleDateString("es-ES", { day:"2-digit", month:"long" })}</span> • <span>@${author}</span></div>
      <div class="title">${escapeHtml(title)}</div>
      <div class="content">${escapeHtml(truncated? short : body)}</div>
      <div class="signature">${escapeHtml(signature)}</div>
      <div class="actions">
        ${ contexto==="feed" ? `
          <button class="pill-btn btn-like" data-id="${id}" title="Me gusta">
            🍓 <span class="count">${likesCount}</span>
          </button>
          ${ currentUser && currentUser.uid!==authorId ? `
            <button class="pill-btn btn-follow" data-aid="${authorId}">
              ${ followingSet.has(authorId) ? "Siguiendo" : "Seguir" }
            </button>
          ` : ``}
          <button class="pill-btn btn-fav" data-id="${id}">☆ Guardar</button>
          ${ currentUser && currentUser.uid===authorId ? `
            <button class="btn" data-act="archivar" data-id="${id}">Archivar</button>
            <button class="btn danger" data-act="borrar" data-id="${id}">Borrar</button>
          `:``}
        `: contexto==="borradores" ? `
          <button class="btn" data-act="editar" data-id="${id}">Editar</button>
          <button class="btn primary" data-act="publicar" data-id="${id}">Publicar</button>
          <button class="btn danger" data-act="borrar" data-id="${id}">Borrar</button>
        ` : `
          <button class="btn" data-act="restaurar" data-id="${id}">Restaurar</button>
          <button class="btn danger" data-act="borrar" data-id="${id}">Borrar</button>
        `}
        ${ truncated ? `<button class="btn outline btn-more">Leer más…</button>` : ``}
      </div>
    `;

    // Leer más
    const btnMore = card.querySelector(".btn-more");
    if(btnMore){
      btnMore.addEventListener("click", ()=>{
        const content = card.querySelector(".content");
        content.textContent = body; // completo
        btnMore.remove();
      });
    }

    // Like
    const likeBtn = card.querySelector(".btn-like");
    if(likeBtn){
      likeBtn.addEventListener("click", async (ev)=>{
        if(!currentUser) return showToast("Inicia sesión para dar me gusta", "err");
        await toggleLike(id);
        // pop brillante
        const r = ev.currentTarget.getBoundingClientRect();
        strawberryPop(r.left + r.width/2, r.top);
      });
    }

    // Follow
    const followBtn = card.querySelector(".btn-follow");
    if(followBtn){
      followBtn.addEventListener("click", async ()=>{
        await toggleFollow(authorId);
      });
    }

    // Fav
    const favBtn = card.querySelector(".btn-fav");
    if(favBtn){
      favBtn.addEventListener("click", async ()=>{
        if(!currentUser) return showToast("Inicia sesión para guardar", "err");
        const favRef = doc(db,"users", currentUser.uid, "favorites", id);
        const snap = await getDoc(favRef);
        if(snap.exists()){ await deleteDoc(favRef); favBtn.textContent="☆ Guardar"; showToast("Quitado de favoritos"); }
        else { await setDoc(favRef,{ createdAt: serverTimestamp() }); favBtn.textContent="⭐ Guardado"; showToast("Guardado en favoritos"); }
      });
    }

    // Acciones estado
    card.querySelectorAll("[data-act]").forEach(btn=>{
      btn.addEventListener("click", async ()=>{
        if(!currentUser) return showToast("Inicia sesión", "err");
        const act = btn.getAttribute("data-act");
        const pid = btn.getAttribute("data-id");
        if(act==="borrar"){
          if(!confirm("¿Eliminar definitivamente?")) return;
          await deleteDoc(doc(db,"posts",pid)); showToast("Eliminado");
        }else if(act==="archivar"){
          await updateDoc(doc(db,"posts",pid), { status:"archivado" }); showToast("Archivado");
        }else if(act==="restaurar"){
          await updateDoc(doc(db,"posts",pid), { status:"publicado" }); showToast("Restaurado");
        }else if(act==="publicar"){
          await updateDoc(doc(db,"posts",pid), { status:"publicado", publishedAt: serverTimestamp() }); showToast("Publicado");
