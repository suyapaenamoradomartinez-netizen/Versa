// Firebase
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

// Config
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

// ======= DOM
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebar = document.getElementById("sidebar");
const menuButtons = document.querySelectorAll(".menu .item");
const sections = {
  feed: document.getElementById("sec-feed"),
  editor: document.getElementById("sec-editor"),
  profile: document.getElementById("sec-profile"),
  drafts: document.getElementById("sec-drafts"),
  archived: document.getElementById("sec-archived"),
  notifs: document.getElementById("sec-notifs"),
  config: document.getElementById("sec-config"),
};

const feedList = document.getElementById("feed-list");
const listaBorradores = document.getElementById("lista-borradores");
const listaArchivados = document.getElementById("lista-archivados");
const notifList = document.getElementById("notif-list");
const notifBadge = document.getElementById("notif-badge");

// Perfil + Auth en Perfil
const authBox = document.getElementById("auth-box");
const profileBox = document.getElementById("profile-box");
const authStatus = document.getElementById("auth-status");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const btnLoginEmail = document.getElementById("btn-login-email");
const btnSignupEmail = document.getElementById("btn-signup-email");
const btnLoginGoogle = document.getElementById("btn-login-google");
const btnLogout = document.getElementById("btn-logout");

const pName = document.getElementById("p-name");
const pHandle = document.getElementById("p-handle");
const pSignature = document.getElementById("p-signature");
const pBio = document.getElementById("p-bio");
const btnSaveProfile = document.getElementById("btn-save-profile");

// Editor
const titleInput = document.getElementById("title-input");
const editorText = document.getElementById("editor-text");
const shadowColor = document.getElementById("shadow-color");
const wordCountEl = document.getElementById("word-count");
const tBold = document.getElementById("t-bold");
const tFont = document.getElementById("t-font");
const btnPublicar = document.getElementById("btn-publicar");
const btnBorrador = document.getElementById("btn-borrador");
const editorHint = document.getElementById("editor-hint");

// Config
const toggleTecleo = document.getElementById("toggle-tecleo");
const toggleFresas = document.getElementById("toggle-fresas");
const toggleDark = document.getElementById("toggle-dark");

// Toast & Rain
const toast = document.getElementById("toast");
const rain = document.getElementById("strawberry-rain");

// ======= Config local
const cfgKey = "versa_cfg_v2";
function loadCfg(){
  try{ return JSON.parse(localStorage.getItem(cfgKey)) ?? { tecleo:false, fresas:true, dark:false, shadow:"#f7c9d4" }; }
  catch{ return { tecleo:false, fresas:true, dark:false, shadow:"#f7c9d4" }; }
}
function saveCfg(c){ localStorage.setItem(cfgKey, JSON.stringify(c)); }
let cfg = loadCfg();
toggleTecleo.checked = cfg.tecleo;
toggleFresas.checked = cfg.fresas;
toggleDark.checked   = cfg.dark;
shadowColor.value    = cfg.shadow;
applyTheme(); setShadowColor(cfg.shadow);

// ======= UI helpers
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
function strawberryPop(x,y){
  if(!cfg.fresas) return;
  const el = document.createElement("div");
  el.className = "pop";
  el.style.left = x+"px"; el.style.top = y+"px";
  el.textContent = "🍓";
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 650);
}
function escapeHtml(str){
  return (str ?? "").replace(/[&<>"']/g, s => (
    { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[s]
  ));
}
function applyTheme(){ document.body.classList.toggle("dark", cfg.dark); }
function setShadowColor(hex){ document.documentElement.style.setProperty("--shadow-color", hex || "#f7c9d4"); }

// ======= Sidebar toggle (solo con la fresa)
sidebarToggle.addEventListener("click", ()=>{
  sidebar.classList.toggle("open");
  const glow = sidebarToggle.querySelector(".glow-strawberry");
  glow.style.filter = "drop-shadow(0 0 10px rgba(255,105,180,.9))";
  setTimeout(()=> glow.style.filter = "drop-shadow(0 0 6px rgba(255,105,180,.6))", 450);
});

// Navegación
menuButtons.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    menuButtons.forEach(b=> b.classList.remove("active"));
    btn.classList.add("active");
    const sec = btn.getAttribute("data-section");
    Object.entries(sections).forEach(([k,el])=> el.classList.toggle("visible", k===sec));
    // cierra sidebar para evitar “amontonado”
    sidebar.classList.remove("open");

    // Si entras a notifs, marcamos como leídas
    if(sec==="notifs"){ markNotificationsRead(); }
  });
});

// ======= Editor: sombra, fuente, alineación, contador y sonido
tFont.addEventListener("change", ()=>{ editorText.style.fontFamily = tFont.value + ", serif"; });
document.querySelectorAll(".toolbar [data-align]").forEach(b=>{
  b.addEventListener("click", ()=>{ editorText.style.textAlign = b.getAttribute("data-align"); });
});
shadowColor.addEventListener("input", ()=>{ cfg.shadow = shadowColor.value; saveCfg(cfg); setShadowColor(cfg.shadow); });
editorText.addEventListener("input", ()=>{
  const words = (editorText.value.trim().match(/\S+/g) || []).length;
  wordCountEl.textContent = `${words} palabra${words===1?"":"s"}`;
});

// Máquina de escribir (suave)
let audioCtx;
function typewriterClick(){
  if(!toggleTecleo.checked) return;
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain(), n = audioCtx.createBufferSource();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate*0.03, audioCtx.sampleRate), d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++){ d[i] = (Math.random()*2-1)*Math.pow(1-i/d.length,3)*0.6; }
    n.buffer = buf; n.connect(g);
    o.type = "square"; o.frequency.value = 900 + Math.random()*120;
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.07);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); n.start(); o.stop(audioCtx.currentTime + 0.08); n.stop(audioCtx.currentTime + 0.08);
  }catch{}
}
let keyThrottle=0;
editorText.addEventListener("keydown", ()=>{
  const now = Date.now(); if(now - keyThrottle > 40){ keyThrottle = now; typewriterClick(); }
});
tBold.addEventListener("click", ()=>{ /* textarea: simulamos negrita si lo deseas después */ });

// ======= Config toggles
toggleTecleo.addEventListener("change", ()=>{ cfg.tecleo = toggleTecleo.checked; saveCfg(cfg); });
toggleFresas.addEventListener("change", ()=>{ cfg.fresas = toggleFresas.checked; saveCfg(cfg); });
toggleDark.addEventListener("change", ()=>{ cfg.dark   = toggleDark.checked; saveCfg(cfg); applyTheme(); });

// ======= Estado
let currentUser=null;
let unsubDrafts=null, unsubArchived=null, unsubFeed=null, unsubNotifCount=null, unsubNotifs=null;
let followingSet = new Set();

onAuthStateChanged(auth, async (user)=>{
  currentUser = user || null;

  authStatus.textContent = user ? `Conectada como ${user.displayName || user.email}` : "Desconectada";
  authBox.classList.toggle("hidden", !!user);
  profileBox.classList.toggle("hidden", !user);

  // Cargar/guardar perfil
  await loadProfile();

  // Following para feed futuro
  await loadFollowing();

  // Suscripciones
  subscribeDrafts();
  subscribeArchived();
  subscribeFeed(false); // por ahora feed oculto (solo título/eslogan)
  subscribeNotifBadge();
});

// ======= Auth en perfil
btnLoginEmail.addEventListener("click", async ()=>{
  const email = (emailInput.value||"").trim(), pass = passInput.value||"";
  if(!email || !pass) return showToast("Completa email y contraseña", "err");
  try{ await signInWithEmailAndPassword(auth,email,pass); strawberryRain(); }
  catch(e){ showToast(e?.message || "Error al iniciar sesión", "err"); }
});
btnSignupEmail.addEventListener("click", async ()=>{
  const email = (emailInput.value||"").trim(), pass = passInput.value||"";
  if(!email || !pass) return showToast("Completa email y contraseña", "err");
  try{
    const res = await createUserWithEmailAndPassword(auth,email,pass);
    // crea documento de usuario básico
    await setDoc(doc(db,"users", res.user.uid), { name:"", handle: email.split("@")[0], signature:"— "+email.split("@")[0], createdAt: serverTimestamp() }, {merge:true});
    strawberryRain(); showToast("Cuenta creada 🍓");
  }catch(e){ showToast(e?.message || "No se pudo crear", "err"); }
});
btnLoginGoogle.addEventListener("click", async ()=>{
  try{
    const res = await signInWithPopup(auth, new GoogleAuthProvider());
    const info = getAdditionalUserInfo(res);
    if(info?.isNewUser){
      await setDoc(doc(db,"users", res.user.uid), { name: res.user.displayName || "", handle: (res.user.email||"").split("@")[0], signature:"— "+((res.user.displayName||"") || (res.user.email||"").split("@")[0]) }, {merge:true});
    }
    strawberryRain(); showToast("¡Bienvenida! 🍓");
  }catch(e){ showToast("No se pudo iniciar con Google", "err"); }
});
btnLogout.addEventListener("click", async ()=>{ try{ await signOut(auth); }catch(e){ showToast("Error al salir", "err"); } });

// ======= Perfil
async function loadProfile(){
  if(!currentUser){ pName.value=""; pHandle.value=""; pSignature.value=""; pBio.value=""; return; }
  const snap = await getDoc(doc(db,"users", currentUser.uid));
  const data = snap.exists()? snap.data() : {};
  pName.value = data.name || currentUser.displayName || "";
  pHandle.value = data.handle || (currentUser.email?.split("@")[0] || "");
  pSignature.value = data.signature || "— " + (pName.value || "Anónimo");
  pBio.value = data.bio || "";
}
btnSaveProfile.addEventListener("click", async ()=>{
  if(!currentUser) return;
  await setDoc(doc(db,"users", currentUser.uid), {
    name:(pName.value||"").trim(),
    handle:(pHandle.value||"").trim(),
    signature:(pSignature.value||"").trim(),
    bio:(pBio.value||"").trim(),
    updatedAt: serverTimestamp()
  }, {merge:true});
  showToast("Perfil actualizado ✨");
});

// ======= Following
async function loadFollowing(){
  followingSet.clear();
  if(!currentUser) return;
  const q = await getDocs(collection(db,"users", currentUser.uid, "following"));
  q.forEach(d=> followingSet.add(d.id));
}
async function toggleFollow(authorId){
  if(!currentUser) return showToast("Inicia sesión para seguir", "err");
  if(authorId===currentUser.uid) return;
  const ref = doc(db,"users", currentUser.uid, "following", authorId);
  const snap = await getDoc(ref);
  if(snap.exists()){
    await deleteDoc(ref);
    followingSet.delete(authorId);
    showToast("Dejaste de seguir");
  }else{
    await setDoc(ref, { createdAt: serverTimestamp() });
    followingSet.add(authorId);
    strawberryRain();
    await pushNotification(authorId, {
      type:"follow", fromUid: currentUser.uid, fromName: await myDisplayName(), createdAt: serverTimestamp(), read:false
    });
    showToast("Ahora sigues a esta persona 🍓");
  }
}

// ======= Suscripciones (Borradores / Archivados / Feed)
function subscribeDrafts(){
  if(unsubDrafts){ unsubDrafts(); unsubDrafts=null; }
  if(!currentUser){
    listaBorradores.innerHTML = `<div class="card">Inicia sesión para ver borradores</div>`; return;
  }
  unsubDrafts = onSnapshot(
    query(collection(db,"posts"), where("authorId","==", currentUser.uid), where("status","==","borrador"), orderBy("createdAt","desc")),
    (snap)=> renderPostList(listaBorradores, snap.docs, "borradores")
  );
}
function subscribeArchived(){
  if(unsubArchived){ unsubArchived(); unsubArchived=null; }
  if(!currentUser){
    listaArchivados.innerHTML = `<div class="card">Inicia sesión para ver archivados</div>`; return;
  }
  unsubArchived = onSnapshot(
    query(collection(db,"posts"), where("authorId","==", currentUser.uid), where("status","==","archivado"), orderBy("createdAt","desc")),
    (snap)=> renderPostList(listaArchivados, snap.docs, "archivados")
  );
}
function subscribeFeed(show=false){
  if(unsubFeed){ unsubFeed(); unsubFeed=null; }
  const list = document.getElementById("feed-list");
  list.classList.toggle("hidden", !show); // por pedido: oculto
  // Si luego quieres el feed visible, cambia show=true y listo
  unsubFeed = onSnapshot(
    query(collection(db,"posts"), where("status","==","publicado"), orderBy("publishedAt","desc"), limit(50)),
    (snap)=> { if(show) renderPostList(list, snap.docs, "feed"); }
  );
}

// ======= Render posts
function truncateText(text, maxChars=520){
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
    const title = data.title || "Verso sin título";
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
      <div class="meta"><span>${date.toLocaleDateString("es-ES",{ day:"2-digit", month:"long" })}</span> • <span>@${author}</span></div>
      <div class="title">${escapeHtml(title)}</div>
      <div class="content">${escapeHtml(truncated? short : body)}</div>
      <div class="signature">${escapeHtml(signature)}</div>
      <div class="actions">
        ${ contexto!=="borradores" ? `
          <button class="pill-btn btn-like" data-id="${id}">🍓 <span class="count">${likesCount}</span></button>
          ${ currentUser && currentUser.uid!==authorId ? `<button class="pill-btn btn-follow" data-aid="${authorId}">${"Seguir"}</button>` : ``}
          <button class="pill-btn btn-fav" data-id="${id}">☆ Guardar</button>
        ` : ``}
        ${ currentUser && currentUser.uid===authorId ? actionButtons(contexto, id) : ``}
        ${ truncated ? `<button class="btn outline btn-more">Leer más…</button>` : ``}
      </div>
    `;

    // Leer más
    const btnMore = card.querySelector(".btn-more");
    if(btnMore){ btnMore.addEventListener("click", ()=>{ card.querySelector(".content").textContent = body; btnMore.remove(); }); }

    // Like
    const likeBtn = card.querySelector(".btn-like");
    if(likeBtn){
      likeBtn.addEventListener("click", async (ev)=>{
        if(!currentUser) return showToast("Inicia sesión para dar me gusta", "err");
        const before = await toggleLike(id);
        // notif si es nuevo like y no es tuyo
        if(before===false && authorId!==currentUser.uid){
          await pushNotification(authorId, { type:"like", postId:id, fromUid: currentUser.uid, fromName: await myDisplayName(), createdAt: serverTimestamp(), read:false });
        }
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
        if(snap.exists()){
          await deleteDoc(favRef); favBtn.textContent="☆ Guardar";
        }else{
          await setDoc(favRef, { createdAt: serverTimestamp() }); favBtn.textContent="⭐ Guardado";
          if(authorId!==currentUser.uid){
            await pushNotification(authorId, { type:"favorite", postId:id, fromUid: currentUser.uid, fromName: await myDisplayName(), createdAt: serverTimestamp(), read:false });
          }
        }
      });
    }

    // Acciones de autor
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
          await updateDoc(doc(db,"posts",pid), { status:"publicado", publishedAt: serverTimestamp() }); showToast("Restaurado");
        }else if(act==="publicar"){
          await updateDoc(doc(db,"posts",pid), { status:"publicado", publishedAt: serverTimestamp() }); showToast("Publicado");
        }else if(act==="editar"){
          const snap = await getDoc(doc(db,"posts",pid)); const dt = snap.data();
          currentEditingId = pid;
          titleInput.value = dt.title || "";
          editorText.value = dt.texto || "";
          menuOpen("editor");
          showToast("Editando borrador…");
        }
      });
    });

    container.appendChild(card);
  });
}
function actionButtons(ctx, id){
  if(ctx==="feed") return `<button class="btn" data-act="archivar" data-id="${id}">Archivar</button><button class="btn danger" data-act="borrar" data-id="${id}">Borrar</button>`;
  if(ctx==="borradores") return `<button class="btn" data-act="editar" data-id="${id}">Editar</button><button class="btn primary" data-act="publicar" data-id="${id}">Publicar</button><button class="btn danger" data-act="borrar" data-id="${id}">Borrar</button>`;
  if(ctx==="archivados") return `<button class="btn" data-act="restaurar" data-id="${id}">Restaurar</button><button class="btn danger" data-act="borrar" data-id="${id}">Borrar</button>`;
  return "";
}

// ======= Crear/Guardar
let currentEditingId=null;
btnPublicar.addEventListener("click", async ()=>{
  if(!currentUser) return showToast("Inicia sesión para publicar", "err");
  const title = (titleInput.value||"").trim() || "Verso sin título";
  const texto = (editorText.value||"").trim();
  if(!texto) return showToast("Escribe algo", "err");

  const prof = await getDoc(doc(db,"users", currentUser.uid)); const pd = prof.exists()? prof.data():{};
  const authorName = pd.handle || currentUser.displayName || (currentUser.email?.split("@")[0]) || "anónimo";
  const signature = pd.signature || ("— " + authorName);

  if(currentEditingId){
    await updateDoc(doc(db,"posts",currentEditingId), { title, texto, signature });
    await updateDoc(doc(db,"posts",currentEditingId), { status:"publicado", publishedAt: serverTimestamp() });
    currentEditingId=null;
  }else{
    await addDoc(collection(db,"posts"), {
      title, texto, signature,
      authorId: currentUser.uid, authorName,
      status:"publicado", createdAt: serverTimestamp(), publishedAt: serverTimestamp(),
      likesCount:0, likedBy:[]
    });
  }
  titleInput.value=""; editorText.value="";
  showToast("Publicado ✨");
  menuOpen("feed");
});
btnBorrador.addEventListener("click", async ()=>{
  if(!currentUser) return showToast("Inicia sesión para guardar", "err");
  const title = (titleInput.value||"").trim() || "Verso sin título";
  const texto = (editorText.value||"").trim();
  if(!texto) return showToast("Escribe algo", "err");

  const prof = await getDoc(doc(db,"users", currentUser.uid)); const pd = prof.exists()? prof.data():{};
  const authorName = pd.handle || currentUser.displayName || (currentUser.email?.split("@")[0]) || "anónimo";
  const signature = pd.signature || ("— " + authorName);

  if(currentEditingId){
    await updateDoc(doc(db,"posts",currentEditingId), { title, texto, signature });
    currentEditingId=null; showToast("Borrador actualizado");
  }else{
    await addDoc(collection(db,"posts"), {
      title, texto, signature, authorId: currentUser.uid, authorName,
      status:"borrador", createdAt: serverTimestamp(), likesCount:0, likedBy:[]
    });
    showToast("Guardado en borradores");
  }
  titleInput.value=""; editorText.value="";
});

// ======= Likes (retorna si fue like añadido (true) o removido (false))
async function toggleLike(postId){
  if(!currentUser) return false;
  const ref = doc(db,"posts",postId);
  let added=false;
  await runTransaction(db, async (tx)=>{
    const snap = await tx.get(ref); if(!snap.exists()) return;
    const d = snap.data(); const likedBy = d.likedBy || []; const lc = d.likesCount || 0;
    const has = likedBy.includes(currentUser.uid);
    if(has){
      tx.update(ref, { likedBy: likedBy.filter(x=>x!==currentUser.uid), likesCount: Math.max(0, lc-1) });
      added=false;
    }else{
      tx.update(ref, { likedBy: [...likedBy, currentUser.uid], likesCount: lc+1 });
      added=true;
    }
  });
  return added;
}

// ======= Notificaciones
function subscribeNotifBadge(){
  if(unsubNotifCount){ unsubNotifCount(); unsubNotifCount=null; }
  if(!currentUser){ notifBadge.classList.add("hidden"); return; }
  unsubNotifCount = onSnapshot(
    query(collection(db,"users", currentUser.uid, "notifications"), where("read","==", false)),
    (snap)=> { notifBadge.classList.toggle("hidden", snap.empty); }
  );
  // Lista completa
  if(unsubNotifs){ unsubNotifs(); unsubNotifs=null; }
  unsubNotifs = onSnapshot(
    query(collection(db,"users", currentUser.uid, "notifications"), orderBy("createdAt","desc"), limit(50)),
    (snap)=>{
      notifList.innerHTML = "";
      if(snap.empty){ notifList.innerHTML = `<div class="card">Sin notificaciones</div>`; return; }
      snap.forEach(d=>{
        const n = d.data();
        const txt = n.type==="like" ? `A alguien le gustó tu poema`
                  : n.type==="favorite" ? `Guardaron tu poema en favoritos`
                  : n.type==="follow" ? `${n.fromName || "Alguien"} empezó a seguirte`
                  : `Notificación`;
        const card = document.createElement("div");
        card.className="card blossom-corners elevation";
        card.innerHTML = `<div class="meta">${new Date(n.createdAt?.toDate?.()||Date.now()).toLocaleString()}</div><div>${txt}</div>`;
        notifList.appendChild(card);
      });
    }
  );
}
async function markNotificationsRead(){
  if(!currentUser) return;
  const q = await getDocs(query(collection(db,"users", currentUser.uid, "notifications"), where("read","==", false), limit(30)));
  const ops = q.docs.map(d=> updateDoc(doc(db,"users", currentUser.uid, "notifications", d.id), { read:true }));
  await Promise.allSettled(ops);
}
async function pushNotification(userId, payload){
  try{
    await addDoc(collection(db,"users", userId, "notifications"), payload);
  }catch{}
}
async function myDisplayName(){
  if(!currentUser) return "Alguien";
  const s = await getDoc(doc(db,"users", currentUser.uid));
  if(s.exists() && s.data().handle) return s.data().handle;
  return currentUser.displayName || (currentUser.email?.split("@")[0]) || "Alguien";
}

// ======= Helper navegación
function menuOpen(sec){
  menuButtons.forEach(b=> b.classList.toggle("active", b.getAttribute("data-section")===sec));
  Object.entries(sections).forEach(([k,el])=> el.classList.toggle("visible", k===sec));
  sidebar.classList.remove("open");
}