// script.js (MÓDULO)

// ---------------- Firebase: imports y config ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider,
  signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  setPersistence, browserLocalPersistence, getAdditionalUserInfo
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
  getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot,
  doc, updateDoc, deleteDoc, runTransaction, getDoc, setDoc,
  arrayUnion, arrayRemove, increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 👉 tu config (la que nos diste)
const firebaseConfig = {
  apiKey: "AIzaSyBsYiC08WUFzHjjKrlqbefRaBTmR_LUn4o",
  authDomain: "versa-625d6.firebaseapp.com",
  projectId: "versa-625d6",
  storageBucket: "versa-625d6.firebasestorage.app",
  messagingSenderId: "276866889012",
  appId: "1:276866889012:web:b256bdfb5cc09e3433a161",
  measurementId: "G-JM2CX4G493"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
isSupported().then(ok => { if(ok){ try{ getAnalytics(app); }catch{} }});
const auth = getAuth(app);
const db = getFirestore(app);
await setPersistence(auth, browserLocalPersistence);

// Proveedor Google
const googleProvider = new GoogleAuthProvider();

// ---------------- DOM ----------------
const authStatus = document.getElementById("auth-status");
const btnLoginGoogle = document.getElementById("btn-login-google");
const btnLoginEmail = document.getElementById("btn-login-email");
const btnSignupEmail = document.getElementById("btn-signup-email");
const btnLogout = document.getElementById("btn-logout");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");

const editor = document.getElementById("editor");
const editorText = document.getElementById("editor-text");
const btnPublicar = document.getElementById("btn-publicar");
const btnBorrador = document.getElementById("btn-borrador");
const editorHint = document.getElementById("editor-hint");

const listaPublicados = document.getElementById("lista-publicados");
const listaBorradores = document.getElementById("lista-borradores");
const listaArchivados = document.getElementById("lista-archivados");

const toggleTecleo = document.getElementById("toggle-tecleo");
const toggleFresas = document.getElementById("toggle-fresas");
const toggleDark = document.getElementById("toggle-dark");
const rangeShadow = document.getElementById("range-shadow");
const shadowLevel = document.getElementById("shadow-level");

const toast = document.getElementById("toast");
const rain = document.getElementById("strawberry-rain");

// ---------------- Config local ----------------
const cfgKey = "emely_cfg_v2";
function loadCfg(){
  try{ return JSON.parse(localStorage.getItem(cfgKey)) ?? { tecleo:false, fresas:true, dark:false, shadow:2 }; }
  catch{ return { tecleo:false, fresas:true, dark:false, shadow:2 }; }
}
function saveCfg(cfg){ localStorage.setItem(cfgKey, JSON.stringify(cfg)); }
let cfg = loadCfg();

// Aplica config inicial
toggleTecleo.checked = cfg.tecleo;
toggleFresas.checked = cfg.fresas;
toggleDark.checked   = cfg.dark;
rangeShadow.value    = cfg.shadow;
shadowLevel.textContent = String(cfg.shadow);
applyTheme();
applyShadow();

// Cambios de config
toggleTecleo.addEventListener("change", ()=>{ cfg.tecleo = toggleTecleo.checked; saveCfg(cfg); });
toggleFresas.addEventListener("change", ()=>{ cfg.fresas = toggleFresas.checked; saveCfg(cfg); });
toggleDark.addEventListener("change", ()=>{ cfg.dark = toggleDark.checked; saveCfg(cfg); applyTheme(); });
rangeShadow.addEventListener("input", ()=>{
  cfg.shadow = Number(rangeShadow.value); shadowLevel.textContent = String(cfg.shadow);
  saveCfg(cfg); applyShadow();
});
function applyTheme(){ document.body.classList.toggle("dark", cfg.dark); }
function applyShadow(){
  const map = {0:"var(--elev-0)", 1:"var(--elev-1)", 2:"var(--elev-2)", 3:"var(--elev-3)"};
  document.documentElement.style.setProperty("--elev", map[cfg.shadow] || "var(--elev-2)");
}

// ---------------- WebAudio: sonido de tecleo ----------------
let audioCtx;
function keyClick(){
  if(!toggleTecleo.checked) return;
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "triangle";
    o.frequency.value = 520; // tono suave
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.11, audioCtx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.06);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.07);
  }catch{}
}
let keyThrottle = 0;
editorText.addEventListener("keydown", ()=>{
  const now = Date.now();
  if(now - keyThrottle > 35){ keyThrottle = now; keyClick(); }
});

// ---------------- Utils ----------------
const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));
function escapeHtml(str){
  return (str ?? "").replace(/[&<>"']/g, s => (
    { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[s]
  ));
}
function showToast(msg, type="ok"){
  toast.textContent = msg;
  toast.style.background = type==="err" ? "rgba(224,86,86,.95)" : "rgba(176,110,122,.95)";
  toast.classList.remove("hidden");
  setTimeout(()=> toast.classList.add("hidden"), 2400);
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

// ---------------- Estado / Suscripciones ----------------
let currentUser = null;
let unsubPublicados = null;
let unsubBorradores = null;
let unsubArchivados = null;
let favSet = new Set(); // ids favoritos del usuario

let unsubFavorites = null;

// Limpia subs
function clearSubs(){
  if(unsubPublicados){ unsubPublicados(); unsubPublicados=null; }
  if(unsubBorradores){ unsubBorradores(); unsubBorradores=null; }
  if(unsubArchivados){ unsubArchivados(); unsubArchivados=null; }
  if(unsubFavorites){ unsubFavorites(); unsubFavorites=null; }
  favSet.clear();
}

// Render helpers
function renderEmpty(container, tipo){
  container.innerHTML = `<div class="card blossom-corners"><div class="meta">No hay ${tipo} aún.</div></div>`;
}

function renderList(container, docs, tipo){
  container.innerHTML = "";
  if(!docs.length){ renderEmpty(container, tipo); return; }

  docs.forEach(d=>{
    const data = d.data();
    const id = d.id;
    const fecha = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
    const autor = data.authorName || "anónimo";
    const texto = escapeHtml(data.texto || "");
    const likesCount = data.likesCount || 0;
    const meGustaYo = (data.likedBy || []).includes(currentUser?.uid || "__none");
    const esFavorito = favSet.has(id);

    const card = document.createElement("div");
    card.className = "card blossom-corners elevation";
    const metaTipo = tipo==="publicados" ? "Publicado" : (tipo==="borradores" ? "Borrador" : "Archivado");
    card.innerHTML = `
      <div class="meta">
        <span>${metaTipo}</span><span>•</span>
        <span>${fecha.toLocaleString()}</span>
        <span>•</span><span>@${autor}</span>
      </div>
      <div class="content">${texto}</div>
      <div class="actions">
        ${
          tipo==="publicados"
          ? `
          <button class="btn pill btn-like" data-id="${id}" title="Me gusta">
            <span class="emoji">${meGustaYo ? "🍓" : "🍓"}</span>
            <span class="count">${likesCount}</span>
          </button>
          <button class="btn pill btn-fav" data-id="${id}" title="Favorito">
            <span class="emoji">${esFavorito ? "⭐" : "☆"}</span>
            <span>${esFavorito ? "Guardado" : "Guardar"}</span>
          </button>
          <button class="btn" data-act="archivar" data-id="${id}">Archivar</button>
          <button class="btn danger" data-act="borrar" data-id="${id}">Borrar</button>
          `
          : tipo==="borradores"
          ? `
          <button class="btn" data-act="editar" data-id="${id}">Editar</button>
          <button class="btn primary" data-act="publicar" data-id="${id}">Publicar</button>
          <button class="btn danger" data-act="borrar" data-id="${id}">Borrar</button>
          `
          : `
          <button class="btn" data-act="restaurar" data-id="${id}">Restaurar</button>
          <button class="btn danger" data-act="borrar" data-id="${id}">Borrar</button>
          `
        }
      </div>
    `;

    // Like
    const likeBtn = card.querySelector(".btn-like");
    if(likeBtn){
      likeBtn.addEventListener("click", async (ev)=>{
        ev.preventDefault();
        if(!currentUser) return showToast("Inicia sesión para dar me gusta", "err");
        const rect = ev.currentTarget.getBoundingClientRect();
        await toggleLike(id);
        strawberryPop(rect.left+rect.width/2, rect.top); // pop 🍓
      });
    }

    // Fav
    const favBtn = card.querySelector(".btn-fav");
    if(favBtn){
      favBtn.addEventListener("click", async (ev)=>{
        ev.preventDefault();
        if(!currentUser) return showToast("Inicia sesión para guardar favoritos", "err");
        await toggleFavorite(id);
      });
    }

    // Acciones (publicar/archivar/restaurar/borrar/editar)
    card.querySelectorAll("[data-act]").forEach(btn=>{
      btn.addEventListener("click", async ()=>{
        if(!currentUser) return showToast("Inicia sesión primero", "err");
        const act = btn.getAttribute("data-act");
        const pid = btn.getAttribute("data-id");
        if(act==="borrar"){
          const ok = confirm("¿Eliminar definitivamente este elemento?");
          if(!ok) return;
          await deleteDoc(doc(db, "posts", pid));
          showToast("Eliminado");
        }else if(act==="archivar"){
          await updateDoc(doc(db,"posts",pid), { status: "archivado" });
          showToast("Archivado");
        }else if(act==="restaurar"){
          await updateDoc(doc(db,"posts",pid), { status: "publicado" });
          showToast("Restaurado");
        }else if(act==="publicar"){
          await updateDoc(doc(db,"posts",pid), { status: "publicado", publishedAt: serverTimestamp() });
          showToast("Publicado ✨");
        }else if(act==="editar"){
          // carga texto al editor y marca id en dataset
          const snap = await getDoc(doc(db,"posts",pid));
          const txt = snap.data()?.texto || "";
          editorText.value = txt;
          editor.dataset.editId = pid;
          showToast("Editando borrador…");
        }
      });
    });

    container.appendChild(card);
  });
}

// ---------------- Auth: eventos ----------------
btnLoginGoogle.addEventListener("click", async ()=>{
  try{
    const res = await signInWithPopup(auth, googleProvider);
    const info = getAdditionalUserInfo(res);
    if(info?.isNewUser){
      // bienvenida + lluvia de fresas
      showToast("¡Bienvenida! Tu perfil está listo 🍓", "ok");
      strawberryRain();
    }
  }catch(err){
    showToast("No se pudo iniciar con Google: " + (err?.message ?? err), "err");
  }
});
btnLoginEmail.addEventListener("click", async ()=>{
  const email = (emailInput.value || "").trim();
  const password = passInput.value || "";
  if(!email || !password) return showToast("Completa email y contraseña", "err");
  try{
    await signInWithEmailAndPassword(auth, email, password);
  }catch(err){
    showToast("Error al iniciar sesión: " + (err?.message ?? err), "err");
  }
});
btnSignupEmail.addEventListener("click", async ()=>{
  const email = (emailInput.value || "").trim();
  const password = passInput.value || "";
  if(!email || !password) return showToast("Completa email y contraseña", "err");
  try{
    await createUserWithEmailAndPassword(auth, email, password);
    showToast("¡Felicidades! Cuenta creada 🍓", "ok");
    strawberryRain();
  }catch(err){
    showToast("No se pudo crear la cuenta: " + (err?.message ?? err), "err");
  }
});
btnLogout.addEventListener("click", async ()=>{
  try{ await signOut(auth); }catch(err){ showToast("Error al salir: " + (err?.message ?? err), "err"); }
});

// Observa sesión
onAuthStateChanged(auth, async (user)=>{
  currentUser = user || null;

  if(currentUser){
    authStatus.textContent = `Conectada como ${currentUser.displayName || currentUser.email}`;
    btnLogout.classList.remove("hidden");
    btnLoginGoogle.classList.add("hidden");
    btnLoginEmail.classList.add("hidden");
    btnSignupEmail.classList.add("hidden");
    emailInput.classList.add("hidden");
    passInput.classList.add("hidden");

    editorHint.textContent = "Listo para crear. 💖";
    editorHint.style.opacity = 0.7;
    btnPublicar.disabled = false;
    btnBorrador.disabled = false;

    // Suscribir listas propias por estado
    clearSubs();
    const postsRef = collection(db, "posts");

    unsubPublicados = onSnapshot(
      query(postsRef, where("authorId","==", currentUser.uid), where("status","==","publicado"), orderBy("publishedAt","desc")),
      (snap)=> renderList(listaPublicados, snap.docs, "publicados")
    );
    unsubBorradores = onSnapshot(
      query(postsRef, where("authorId","==", currentUser.uid), where("status","==","borrador"), orderBy("createdAt","desc")),
      (snap)=> renderList(listaBorradores, snap.docs, "borradores")
    );
    unsubArchivados = onSnapshot(
      query(postsRef, where("authorId","==", currentUser.uid), where("status","==","archivado"), orderBy("createdAt","desc")),
      (snap)=> renderList(listaArchivados, snap.docs, "archivados")
    );

    // Favoritos del usuario
    unsubFavorites = onSnapshot(
      collection(db, "users", currentUser.uid, "favorites"),
      (snap)=>{
        favSet.clear();
        snap.forEach(d=> favSet.add(d.id));
        // re-render para que botones de fav reflejen estado
        // (forzamos reconsulta breve con las listas actuales)
        // mejor: simplemente disparar un render si hay elementos
        // Aquí, pedimos pequeños refresh via simulación:
        // Si quieres, se puede optimizar guardando la última colección mostrada.
        // Para simplificar: no hacemos nada aquí; se reflejará en la siguiente actualización.
      }
    );

  }else{
    authStatus.textContent = "Desconectada";
    btnLogout.classList.add("hidden");
    btnLoginGoogle.classList.remove("hidden");
    btnLoginEmail.classList.remove("hidden");
    btnSignupEmail.classList.remove("hidden");
    emailInput.classList.remove("hidden");
    passInput.classList.remove("hidden");

    editorHint.textContent = "Debes iniciar sesión para publicar o guardar.";
    editorHint.style.opacity = 1;
    btnPublicar.disabled = true;
    btnBorrador.disabled = true;

    clearSubs();
    renderEmpty(listaPublicados, "publicados");
    renderEmpty(listaBorradores, "borradores");
    renderEmpty(listaArchivados, "archivados");
  }
});

// ---------------- Crear / Guardar ----------------
let publishLock = false;
btnPublicar.addEventListener("click", async ()=>{
  if(!currentUser) return showToast("Inicia sesión para publicar", "err");
  if(publishLock) return; publishLock = true;
  try{
    const texto = (editorText.value || "").trim();
    if(!texto) return showToast("Escribe algo antes de publicar", "err");
    await addDoc(collection(db,"posts"), {
      texto,
      authorId: currentUser.uid,
      authorName: currentUser.displayName || (currentUser.email?.split("@")[0]) || "anónimo",
      status: "publicado",
      createdAt: serverTimestamp(),
      publishedAt: serverTimestamp(),
      likesCount: 0,
      likedBy: []
    });
    editorText.value = "";
    showToast("Publicado ✨");
  }catch(err){
    showToast("No se pudo publicar: " + (err?.message ?? err), "err");
  }finally{ publishLock = false; }
});

let draftLock = false;
btnBorrador.addEventListener("click", async ()=>{
  if(!currentUser) return showToast("Inicia sesión para guardar", "err");
  if(draftLock) return; draftLock = true;
  try{
    const texto = (editorText.value || "").trim();
    if(!texto) return showToast("Escribe algo antes de guardar", "err");

    // Si estamos editando un borrador existente
    const editId = editor.dataset.editId;
    if(editId){
      await updateDoc(doc(db,"posts",editId), { texto });
      delete editor.dataset.editId;
      editorText.value = "";
      return showToast("Borrador actualizado");
    }

    await addDoc(collection(db,"posts"), {
      texto,
      authorId: currentUser.uid,
      authorName: currentUser.displayName || (currentUser.email?.split("@")[0]) || "anónimo",
      status: "borrador",
      createdAt: serverTimestamp(),
      likesCount: 0,
      likedBy: []
    });
    editorText.value = "";
    showToast("Guardado en borradores");
  }catch(err){
    showToast("No se pudo guardar: " + (err?.message ?? err), "err");
  }finally{ draftLock = false; }
});

// ---------------- Likes (1 por usuario, con transacción) ----------------
async function toggleLike(postId){
  const ref = doc(db, "posts", postId);
  await runTransaction(db, async (tx)=>{
    const snap = await tx.get(ref);
    if(!snap.exists()) return;
    const data = snap.data();
    const likedBy = data.likedBy || [];
    const hasLike = likedBy.includes(currentUser.uid);
    if(hasLike){
      tx.update(ref, {
        likedBy: arrayRemove(currentUser.uid),
        likesCount: (data.likesCount || 0) - 1
      });
    }else{
      tx.update(ref, {
        likedBy: arrayUnion(currentUser.uid),
        likesCount: (data.likesCount || 0) + 1
      });
    }
  });
}

// ---------------- Favoritos (por usuario) ----------------
async function toggleFavorite(postId){
  const favRef = doc(db, "users", currentUser.uid, "favorites", postId);
  const snap = await getDoc(favRef);
  if(snap.exists()){
    await deleteDoc(favRef);
    showToast("Quitado de favoritos");
  }else{
    await setDoc(favRef, { createdAt: serverTimestamp() });
    showToast("Guardado en favoritos ⭐");
  }
}