import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBsYiC08WUFzHjjKrlqbefRaBTmR_LUn4o",
    authDomain: "versa-625d6.firebaseapp.com",
    projectId: "versa-625d6",
    storageBucket: "versa-625d6.firebasestorage.app",
    messagingSenderId: "276866889012",
    appId: "1:276866889012:web:b256bdfb5cc09e3433a161"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let ajustes = JSON.parse(localStorage.getItem('ajustes_versa')) || { sonido: true, oscuro: false };

// Herramientas de texto
window.formato = (comando, valor = null) => {
    document.execCommand(comando, false, valor);
};

// Sonido al escribir
document.getElementById('areaEscritura').addEventListener('keydown', () => {
    if(ajustes.sonido) {
        const s = document.getElementById('sonidoTecla');
        s.currentTime = 0; s.play();
    }
});

window.toggleMenu = () => {
    const s = document.getElementById('miSidebar');
    s.style.width = s.style.width === "280px" ? "0" : "280px";
};

window.abrirEditor = () => document.getElementById('modalEditor').style.display = 'flex';
window.cerrarEditor = () => document.getElementById('modalEditor').style.display = 'none';

window.publicar = async () => {
    const t = document.getElementById('tituloPoema').value;
    const c = document.getElementById('areaEscritura').innerHTML;
    const s = document.getElementById('colorSombraPoema').value;
    if (!auth.currentUser) return alert("Inicia sesión primero");
    await addDoc(collection(db, "poemas"), { titulo: t, contenido: c, sombra: s, autor: auth.currentUser.email, fecha: Date.now() });
    cerrarEditor();
    alert("Publicado ✨");
};