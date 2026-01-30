import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, increment, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBsYiC08WUFzHjjKrlqbefRaBTmR_LUn4o",
  authDomain: "versa-625d6.firebaseapp.com",
  projectId: "versa-625d6",
  storageBucket: "versa-625d6.firebasestorage.app",
  messagingSenderId: "276866889012",
  appId: "1:276866889012:web:b256bdfb5cc09e3433a161",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let ajustes = JSON.parse(localStorage.getItem('ajustes_versa')) || { sonido: true, oscuro: false };

// --- GESTIÓN DE USUARIO (AUTH) ---
window.registrarUsuario = async () => {
  const email = document.getElementById('login-usuario').value;
  const pass = document.getElementById('login-pass').value;
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    toast("¡Bienvenida a la red, Emely! ✨");
    cerrarModalLogin();
  } catch (err) { toast("Error: El correo ya existe o es inválido"); }
};

window.iniciarSesion = async () => {
  const email = document.getElementById('login-usuario').value;
  const pass = document.getElementById('login-pass').value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    toast("Sesión iniciada ✨");
    cerrarModalLogin();
  } catch (err) { toast("Correo o contraseña incorrectos"); }
};

window.accionSesion = () => {
  if (auth.currentUser) {
    signOut(auth);
    toast("Has salido de Versa 🌙");
  } else {
    document.getElementById('modalLogin').style.display = 'flex';
  }
};

onAuthStateChanged(auth, (user) => {
  const btnSesion = document.getElementById('btn-sesion');
  if (btnSesion) btnSesion.textContent = user ? "Cerrar Sesión" : "Iniciar Sesión";
  escucharPoemas(); // Siempre escuchamos los poemas de la nube
});

// --- RED SOCIAL (FIRESTORE) ---
window.publicar = async () => {
  const titulo = document.getElementById('tituloPoema').value;
  const contenido = document.getElementById('areaEscritura').innerHTML;
  const sombraColor = document.getElementById('colorSombraPoema').value;

  if (!auth.currentUser) return toast("Debes iniciar sesión para publicar");
  if (!titulo || contenido.length < 10) return toast("Escribe un poco más...");

  try {
    await addDoc(collection(db, "poemas"), {
      titulo: titulo,
      contenido: contenido,
      sombra: sombraColor,
      autor: auth.currentUser.email.split('@')[0],
      fecha: Date.now(),
      fresas: 0
    });
    cerrarEditor();
    toast("Tus versos ya son públicos ✨");
    // Limpiar editor
    document.getElementById('tituloPoema').value = "";
    document.getElementById('areaEscritura').innerHTML = "";
  } catch (e) { toast("Error al conectar con la red"); }
};

function escucharPoemas() {
  const q = query(collection(db, "poemas"), orderBy("fecha", "desc"));
  onSnapshot(q, (snap) => {
    const cont = document.getElementById('seccion-feed');
    if (!cont) return;
    cont.innerHTML = "";
    snap.forEach(docSnap => {
      const p = docSnap.data();
      const card = document.createElement('div');
      card.className = "poema-card";
      // Aplicamos la sombra personalizada que viene desde Firebase
      card.style.boxShadow = `12px 12px 0px ${p.sombra || 'var(--rosa)'}`;
      card.innerHTML = `
        <h3 class="times titulo">${p.titulo}</h3>
        <div class="contenido">${p.contenido}</div>
        <p class="cita">— ${p.autor}</p>
        <div style="margin-top:15px">
           <button onclick="darFresa('${docSnap.id}')" style="background:var(--rosa-claro); border:1px solid var(--rosa); border-radius:20px; cursor:pointer; padding:5px 12px">🍓 ${p.fresas || 0}</button>
        </div>
      `;
      cont.appendChild(card);
    });
  });
}

window.darFresa = async (id) => {
  const ref = doc(db, "poemas", id);
  try {
    await updateDoc(ref, { fresas: increment(1) });
    lluviaFresas();
  } catch (e) { toast("Inicia sesión para dar fresas"); }
};

// --- EFECTOS Y SONIDO ---
document.getElementById('areaEscritura').addEventListener('input', () => {
  if (ajustes.sonido) {
    const audio = document.getElementById('sonidoTecla');
    audio.currentTime = 0;
    audio.playbackRate = 0.8 + Math.random() * 0.4;
    audio.play();
  }
});

function lluviaFresas() {
  for (let i = 0; i < 12; i++) {
    const f = document.createElement('div');
    f.className = "fresa-caida";
    f.textContent = "🍓";
    f.style.left = Math.random() * 100 + "vw";
    f.style.animationDuration = (Math.random() * 1.5 + 1) + "s";
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 2500);
  }
}

// --- NAVEGACIÓN Y AJUSTES ---
window.toggleMenu = () => {
  const s = document.getElementById('miSidebar');
  s.style.width = s.style.width === "280px" ? "0" : "280px";
};

window.mostrarSeccion = (id) => {
  document.querySelectorAll('main, section').forEach(s => s.style.display = 'none');
  const target = document.getElementById('seccion-' + id);
  if (target) target.style.display = 'block';
  if (window.innerWidth < 700) toggleMenu();
};

window.guardarAjustes = () => {
  ajustes.oscuro = document.getElementById('cfg-oscuro').checked;
  ajustes.sonido = document.getElementById('cfg-sonido').checked;
  document.body.setAttribute('data-theme', ajustes.oscuro ? 'dark' : 'light');
  localStorage.setItem('ajustes_versa', JSON.stringify(ajustes));
};

window.cerrarModalLogin = () => document.getElementById('modalLogin').style.display = 'none';
window.abrirEditor = () => { document.getElementById('modalEditor').style.display = 'flex'; };
window.cerrarEditor = () => document.getElementById('modalEditor').style.display = 'none';

function toast(m) {
  const t = document.getElementById('toast');
  t.textContent = m; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

window.onload = () => {
  document.body.setAttribute('data-theme', ajustes.oscuro ? 'dark' : 'light');
  document.getElementById('cfg-oscuro').checked = ajustes.oscuro;
  document.getElementById('cfg-sonido').checked = ajustes.sonido;
  mostrarSeccion('feed');
}; 