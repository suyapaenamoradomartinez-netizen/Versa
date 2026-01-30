import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, increment, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuración de Firebase de Emely
const firebaseConfig = {
  apiKey: "AIzaSyBsYiC08WUFzHjjKrlqbefRaBTmR_LUn4o",
  authDomain: "versa-625d6.firebaseapp.com",
  projectId: "versa-625d6",
  storageBucket: "versa-625d6.firebasestorage.app",
  messagingSenderId: "276866889012",
  appId: "1:276866889012:web:b256bdfb5cc09e3433a161",
  measurementId: "G-JM2CX4G493"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let ajustes = JSON.parse(localStorage.getItem('ajustes_versa')) || { sonido: true, oscuro: false };

// --- USUARIOS ---
window.registrarUsuario = async () => {
  const e = document.getElementById('login-usuario').value;
  const p = document.getElementById('login-pass').value;
  try { await createUserWithEmailAndPassword(auth, e, p); toast("¡Bienvenida a Versa! ✨"); cerrarModalLogin(); } 
  catch (err) { toast("Error: El correo ya existe"); }
};

window.iniciarSesion = async () => {
  const e = document.getElementById('login-usuario').value;
  const p = document.getElementById('login-pass').value;
  try { await signInWithEmailAndPassword(auth, e, p); toast("Sesión iniciada ✨"); cerrarModalLogin(); } 
  catch (err) { toast("Datos incorrectos"); }
};

window.accionSesion = () => {
  if(auth.currentUser) { signOut(auth); toast("Vuelve pronto 🌙"); } 
  else { document.getElementById('modalLogin').style.display = 'flex'; }
};

onAuthStateChanged(auth, (user) => {
  document.getElementById('btn-sesion').textContent = user ? "Cerrar Sesión" : "Iniciar Sesión";
  if(user) document.getElementById('perf-nombre').textContent = user.email.split('@')[0];
  escucharPoemas();
});

// --- POEMAS Y RED SOCIAL ---
window.publicar = async () => {
  const t = document.getElementById('tituloPoema').value;
  const c = document.getElementById('areaEscritura').innerHTML;
  const s = document.getElementById('colorSombraPoema').value;
  
  if(!auth.currentUser) return toast("Debes iniciar sesión");
  
  await addDoc(collection(db, "poemas"), {
    titulo: t || "Sin título", contenido: c, sombra: s,
    autor: auth.currentUser.email.split('@')[0], fecha: Date.now(), fresas: 0
  });
  cerrarEditor(); toast("Versos publicados ✨");
  document.getElementById('tituloPoema').value = "";
  document.getElementById('areaEscritura').innerHTML = "";
};

function escucharPoemas() {
  const q = query(collection(db, "poemas"), orderBy("fecha", "desc"));
  onSnapshot(q, (snap) => {
    const grid = document.getElementById('grid-dinamico');
    if(!grid) return;
    grid.innerHTML = "";
    snap.forEach(docSnap => {
      const p = docSnap.data();
      const card = document.createElement('div');
      card.className = "tarjeta-nota";
      card.style.boxShadow = `8px 8px 0px ${p.sombra || 'var(--rosa)'}`;
      card.innerHTML = `
        <h3 class="times">${p.titulo}</h3>
        <div style="font-size:0.95rem;">${p.contenido}</div>
        <p style="font-style:italic; font-size:0.8rem; margin-top:15px;">— ${p.autor}</p>
        <button onclick="darFresa('${docSnap.id}')" style="background:none; border:1px solid var(--rosa); border-radius:20px; cursor:pointer; margin-top:10px;">🍓 ${p.fresas || 0}</button>
      `;
      grid.appendChild(card);
    });
  });
}

window.darFresa = async (id) => {
  const ref = doc(db, "poemas", id);
  await updateDoc(ref, { fresas: increment(1) });
  lluviaFresas();
};

// --- EFECTOS Y NAVEGACIÓN ---
document.getElementById('areaEscritura')?.addEventListener('input', () => {
  if(ajustes.sonido) {
    const s = document.getElementById('sonidoTecla');
    s.currentTime = 0; s.play();
  }
});

function lluviaFresas() {
  for(let i=0; i<8; i++){
    const f = document.createElement('div'); f.className = "fresa-caida"; f.textContent = "🍓";
    f.style.left = Math.random()*100+"vw"; f.style.animationDuration = (Math.random()+1.5)+"s";
    document.body.appendChild(f); setTimeout(()=>f.remove(), 2500);
  }
}

window.toggleMenu = () => {
  const s = document.getElementById('miSidebar');
  s.style.width = s.style.width === "280px" ? "0" : "280px";
};
window.mostrarSeccion = (id) => {
  document.querySelectorAll('main, section').forEach(s => s.style.display = 'none');
  document.getElementById('seccion-' + id).style.display = 'block';
  toggleMenu();
};
window.guardarAjustes = () => {
  ajustes.oscuro = document.getElementById('cfg-oscuro').checked;
  ajustes.sonido = document.getElementById('cfg-sonido').checked;
  document.body.setAttribute('data-theme', ajustes.oscuro ? 'dark' : 'light');
  localStorage.setItem('ajustes_versa', JSON.stringify(ajustes));
};
window.cerrarModalLogin = () => document.getElementById('modalLogin').style.display = 'none';
window.abrirEditor = () => document.getElementById('modalEditor').style.display = 'flex';
window.cerrarEditor = () => document.getElementById('modalEditor').style.display = 'none';
function toast(m) { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2000); }

window.onload = () => {
  document.body.setAttribute('data-theme', ajustes.oscuro ? 'dark' : 'light');
  document.getElementById('cfg-oscuro').checked = ajustes.oscuro;
  document.getElementById('cfg-sonido').checked = ajustes.sonido;
};