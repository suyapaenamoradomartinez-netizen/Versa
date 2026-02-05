/* =========================
   ESTADO
========================= */
let poemas = JSON.parse(localStorage.getItem('poemas')) || [];
let editandoId = null; // si no es null, estamos editando un borrador
let likesMios = JSON.parse(localStorage.getItem('likesMios')) || []; // ids de poemas a los que di fresa
let ultimaSeccion = 'feed';

let ajustes = {
  sonido: true,
  lluvia: true,
  oscuro: false,
  perfilPrivado: false
};

let sesionActiva = JSON.parse(localStorage.getItem('sesionActiva') || 'true'); // por defecto, sesión abierta

const sonido = document.getElementById("sonidoTecla");
const area = document.getElementById("areaEscritura");

/* =========================
   CARGA INICIAL
========================= */
window.onload = () => {
  cargarAjustes();
  if (sonido) { sonido.volume = 0.22; sonido.playbackRate = 0.92; }
  cargarPerfil();
  aplicarPrivacidadUI();
  mostrarSeccion('feed');
};

/* =========================
   SONIDO + CONTADOR + ATAJOS
========================= */
if (area) {
  area.addEventListener("input", async () => {
    try {
      if (sonido && ajustes.sonido) {
        sonido.currentTime = 0;
        sonido.playbackRate = 0.9 + Math.random()*0.12;
        await sonido.play();
      }
    } catch(e) {}
    const c = document.getElementById('contador');
    if (c) c.textContent = contarPalabras(area.innerHTML) + ' palabras';
  });

  area.addEventListener('keydown', e=>{
    if (e.ctrlKey && e.key.toLowerCase()==='b') { document.execCommand('bold'); e.preventDefault(); }
    if (e.ctrlKey && e.key.toLowerCase()==='i') { document.execCommand('italic'); e.preventDefault(); }
  });
}

/* =========================
   MENÚ LATERAL
========================= */
function toggleMenu() {
  const nav = document.getElementById("miSidebar");
  const btn = document.getElementById("boton-fresa-menu");
  if (!nav || !btn) return;
  const abierto = nav.style.width === "280px";
  nav.style.width = abierto ? "0" : "280px";
  btn.setAttribute('aria-expanded', String(!abierto));
}
document.getElementById('boton-fresa-menu')?.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
});

/* =========================
   EDITOR
========================= */
function abrirEditor() {
  editandoId = null;
  document.getElementById("tituloPoema").value = "";
  document.getElementById("areaEscritura").innerHTML = "";
  document.getElementById("colorSombraPoema").value = "#ffc2d1";
  document.getElementById("modalEditor").style.display = "flex";
  toggleMenu();
}
function cerrarEditor() { document.getElementById("modalEditor").style.display = "none"; }

document.addEventListener('keydown', e => { if (e.key === 'Escape') { cerrarModalPerfil(); cerrarEditor(); cerrarModalLogin(); }});
document.getElementById('modalPerfil')?.addEventListener('click', (e)=>{ if (e.target.id === 'modalPerfil') cerrarModalPerfil(); });
document.getElementById('modalEditor')?.addEventListener('click', (e)=>{ if (e.target.id === 'modalEditor') cerrarEditor(); });

/* =========================
   NAVEGACIÓN SECCIONES
========================= */
function mostrarSeccion(id) {
  const secciones = ['feed', 'favoritos', 'seguidos', 'borradores', 'archivados', 'perfil', 'config'];

  secciones.forEach(s => {
    const el = document.getElementById('seccion-' + s);
    if (el) el.style.display = (s === id) ? 'block' : 'none';
  });

  const header = document.querySelector('.header-principal');
  if (header) header.style.display = (id === 'borradores' || id === 'archivados') ? 'none' : '';

  const tabs = document.getElementById('navegacion-tabs');
  if (tabs) {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active'); b.setAttribute('aria-selected','false');
    });
    if (['feed', 'favoritos', 'seguidos'].includes(id)) {
      tabs.style.display = 'flex';
      const btn = document.getElementById('btn-' + id);
      if (btn) { btn.classList.add('active'); btn.setAttribute('aria-selected','true'); }
    } else {
      tabs.style.display = 'none';
    }
  }

  marcarItemActivo(id);

  ultimaSeccion = id;
  if (id === 'perfil') renderPerfilPoemas();
  else if (id === 'config') precargarAjustesEnUI();
  else renderizarPoemas(id);

  const nav = document.getElementById("miSidebar");
  if (nav) nav.style.width = "0";
  document.getElementById("boton-fresa-menu")?.setAttribute('aria-expanded', 'false');
}
function marcarItemActivo(id) {
  document.querySelectorAll('.barra-lateral a').forEach(a=>a.classList.remove('activo'));
  const mapa = {
    feed:'Explorar Feed',
    favoritos:'Favoritos',
    seguidos:'Seguidos',
    borradores:'Borradores',
    archivados:'Archivados',
    perfil:'Mi Perfil',
    config:'Configuración'
  };
  const link = [...document.querySelectorAll('.barra-lateral a')].find(a=> a.textContent.includes(mapa[id]));
  link?.classList.add('activo');
}

/* =========================
   PERFIL (LOCALSTORAGE)
========================= */
function guardarPerfil() {
  const perfil = {
    nombre: document.getElementById("edit-nombre").value,
    usuario: document.getElementById("edit-usuario").value,
    bio: document.getElementById("edit-bio").value,
    fotoPerfil: document.getElementById("img-perfil").src,
    fotoPortada: document.getElementById("img-portada").src
  };
  localStorage.setItem('perfilEmely', JSON.stringify(perfil));
  aplicarCambiosPerfil(perfil);
  cerrarModalPerfil();
  toast('Perfil guardado ✨');
}
function cargarPerfil() {
  const p = JSON.parse(localStorage.getItem('perfilEmely'));
  if (p) { aplicarCambiosPerfil(p); }
  else {
    document.getElementById("img-perfil").src = "https://www.w3schools.com/howto/img_avatar2.png";
    document.getElementById("img-portada").src = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000";
    document.getElementById("perf-nombre").innerText = "Tu Nombre";
  }
}
function aplicarCambiosPerfil(p) {
  document.getElementById("perf-nombre").innerText = p.nombre || "Sin Nombre";
  document.getElementById("perf-usuario").innerText = "@" + (p.usuario || "usuario");
  document.getElementById("perf-bio").innerText = p.bio || "...";
  if (p.fotoPerfil) document.getElementById("img-perfil").src = p.fotoPerfil;
  if (p.fotoPortada) document.getElementById("img-portada").src = p.fotoPortada;

  document.getElementById("edit-nombre").value = p.nombre || "";
  document.getElementById("edit-usuario").value = p.usuario || "";
  document.getElementById("edit-bio").value = p.bio || "";
}
function previsualizar(input, idDestino) {
  if (input.files && input.files[0]) {
    const lector = new FileReader();
    lector.onload = e => document.getElementById(idDestino).src = e.target.result;
    lector.readAsDataURL(input.files[0]);
  }
}
function abrirModalPerfil() { document.getElementById("modalPerfil").style.display = "flex"; }
function cerrarModalPerfil() { document.getElementById("modalPerfil").style.display = "none"; }

/* =========================
   AJUSTES (CONFIGURACIÓN)
========================= */
function cargarAjustes(){
  try {
    const guard = JSON.parse(localStorage.getItem('ajustesEmely'));
    if (guard) ajustes = { ...ajustes, ...guard };
  } catch {}
  aplicarTemaOscuro(ajustes.oscuro);
  aplicarPrivacidadUI();
}
function guardarAjustes(){
  const chkSonido = document.getElementById('cfg-sonido');
  const chkLluvia = document.getElementById('cfg-lluvia');
  const chkOscuro = document.getElementById('cfg-oscuro');
  const chkPriv = document.getElementById('cfg-perfil-privado');

  ajustes.sonido = !!chkSonido?.checked;
  ajustes.lluvia = !!chkLluvia?.checked;
  ajustes.oscuro = !!chkOscuro?.checked;
  ajustes.perfilPrivado = !!chkPriv?.checked;

  localStorage.setItem('ajustesEmely', JSON.stringify(ajustes));
  aplicarTemaOscuro(ajustes.oscuro);
  aplicarPrivacidadUI();
  toast('Ajustes guardados ✨');
}
function precargarAjustesEnUI(){
  const elSon = document.getElementById('cfg-sonido');
  const elLluv = document.getElementById('cfg-lluvia');
  const elOsc = document.getElementById('cfg-oscuro');
  const elPriv = document.getElementById('cfg-perfil-privado');
  if (elSon) elSon.checked = !!ajustes.sonido;
  if (elLluv) elLluv.checked = !!ajustes.lluvia;
  if (elOsc) elOsc.checked = !!ajustes.oscuro;
  if (elPriv) elPriv.checked = !!ajustes.perfilPrivado;
  const btn = document.getElementById('btn-sesion');
  if (btn) btn.textContent = sesionActiva ? 'Cerrar sesión' : 'Iniciar sesión';
}
function aplicarTemaOscuro(activar){
  if (activar) document.body.setAttribute('data-theme', 'dark');
  else document.body.removeAttribute('data-theme');
}
function aplicarPrivacidadUI(){
  const badge = document.getElementById('badge-privado');
  if (badge) badge.style.display = ajustes.perfilPrivado ? 'inline-block' : 'none';
}
function togglePrivacidad(){
  const panel = document.getElementById('panel-priv');
  const arrow = document.getElementById('arrow-priv');
  const visible = panel.style.display !== 'none';
  panel.style.display = visible ? 'none' : 'block';
  arrow.textContent = visible ? '▸' : '▾';
}
function cambiarContrasena(){
  toast('La opción de cambiar contraseña estará disponible cuando publiques la web 🔒');
}

/* Sesión */
function accionSesion(){
  if (sesionActiva) cerrarSesion();
  else abrirModalLogin();
}
function cerrarSesion(){
  sesionActiva = false;
  localStorage.setItem('sesionActiva', 'false');
  const btn = document.getElementById('btn-sesion');
  if (btn) btn.textContent = 'Iniciar sesión';
  toast('Cerraste sesión 🌙');
}
function abrirModalLogin(){
  document.getElementById('modalLogin').style.display = 'flex';
}
function cerrarModalLogin(){
  document.getElementById('modalLogin').style.display = 'none';
}
function iniciarSesion(){
  const u = (document.getElementById('login-usuario').value || '').trim();
  const p = (document.getElementById('login-pass').value || '').trim();
  if (!u || !p){ toast('Completa usuario y contraseña'); return; }
  sesionActiva = true;
  localStorage.setItem('sesionActiva', 'true');
  localStorage.setItem('usuarioSesion', u);
  const btn = document.getElementById('btn-sesion');
  if (btn) btn.textContent = 'Cerrar sesión';
  cerrarModalLogin();
  toast('Sesión iniciada ✨');
}

/* =========================
   SANITIZAR CONTENIDO
========================= */
function sanitize(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  temp.querySelectorAll('script, style, iframe, object, embed, link').forEach(n=>n.remove());
  temp.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(attr => {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
      if (attr.name === 'style' && /expression|url\(/i.test(attr.value)) el.removeAttribute('style');
    });
  });
  return temp.innerHTML;
}

/* =========================
   PUBLICAR / GUARDAR
========================= */
function publicar(estado) {
  const titulo = document.getElementById("tituloPoema").value.trim();
  const contenido = sanitize(document.getElementById("areaEscritura").innerHTML);

  if (!titulo || !contenido.replace(/<[^>]*>/g,'').trim()) {
    alert("Escribe algo...");
    return;
  }

  if (editandoId) {
    const p = poemas.find(x => x.id === editandoId);
    if (p) {
      p.titulo = titulo;
      p.contenido = contenido;
      p.autor = document.getElementById("perf-nombre").innerText;
      p.usuario = document.getElementById("perf-usuario").innerText;
      p.estado = estado;
    }
  } else {
    poemas.push({
      id: Date.now(),
      titulo,
      contenido,
      autor: document.getElementById("perf-nombre").innerText,
      usuario: document.getElementById("perf-usuario").innerText,
      estado,
      favorito: false,
      fresas: 0,
      siguiendo: false
    });
  }

  guardarTodo();
  document.getElementById("tituloPoema").value = "";
  document.getElementById("areaEscritura").innerHTML = "";
  editandoId = null;

  cerrarEditor();
  mostrarSeccion(estado);
  toast(estado === 'feed' ? 'Publicado ✨' : 'Borrador guardado ✨');
}

/* =========================
   RENDERIZAR POEMAS
========================= */
function renderizarPoemas(filtro) {
  const cont = document.getElementById('seccion-' + filtro);
  if (!cont) return;
  cont.innerHTML = "";

  let target = cont;
  if (filtro === 'borradores' || filtro === 'archivados') {
    const titulo = filtro === 'borradores' ? 'Borradores' : 'Archivados';
    const subtitulo = filtro === 'borradores' ? 'Versos en espera' : 'Textos en descanso';
    cont.innerHTML = `
      <div class="titulo-seccion">
        <h2 class="times">${titulo}</h2>
        <p class="sub">${subtitulo}</p>
      </div>
      <div class="grid-poemas" id="grid-${filtro}"></div>
    `;
    target = cont.querySelector(`#grid-${filtro}`);
  }

  const lista = poemas.filter(p => {
    if (filtro === 'favoritos') return p.favorito;
    if (filtro === 'seguidos') return p.siguiendo;
    return p.estado === filtro;
  });

  if (lista.length === 0) {
    if (filtro === 'borradores' || filtro === 'archivados') {
      target.innerHTML = `<p style="text-align:center;opacity:.8;">No hay ${filtro} aún.</p>`;
    } else {
      cont.innerHTML = `<p style="text-align:center;opacity:.8;">Aún no hay poemas aquí.</p>`;
    }
    return;
  }

  lista.forEach(p => {
    if (filtro === 'borradores' || filtro === 'archivados') {
      const div = document.createElement('div');
      div.className = "tarjeta-nota";
      div.setAttribute('data-estado', filtro === 'borradores' ? 'Borrador' : 'Archivado');
      div.setAttribute('role','group');
      div.innerHTML = `
        <h3>${p.titulo}</h3>
        <div>${p.contenido.replace(/<[^>]*>?/gm, '').slice(0, 120)}...</div>
        <div class="nota-actions">
          ${
            filtro === 'borradores'
              ? `<button class="nota-btn" onclick="editarBorrador(${p.id})">✍️ Editar</button>
                 <button class="nota-btn" onclick="eliminarPoema(${p.id})">🗑️ Eliminar</button>`
              : `<button class="nota-btn" onclick="restaurarPoema(${p.id})">📤 Publicar de nuevo</button>
                 <button class="nota-btn" onclick="eliminarPoema(${p.id})">🗑️ Eliminar</button>`
          }
        </div>
      `;
      target.appendChild(div);
    } else {
      const liked = likesMios.includes(p.id);
      const div = document.createElement('div');
      div.className = "poema-card";
      const sombra = p.sombra || '#ffc2d1';
      div.style.boxShadow = `12px 12px 0px ${sombra}, 0 14px 40px rgba(90,69,61,.12)`;
      div.innerHTML = `
        <h3 class="titulo">${p.titulo}</h3>
        <div style="margin:16px 0;line-height:1.75;">${p.contenido}</div>
        <p class="cita">— ${p.autor}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn-poema ${liked ? 'liked' : ''}" onclick="votar(${p.id})" title="${liked ? 'Quitar fresa' : 'Dar fresa'}">
            🍓 ${p.fresas}
          </button>
          <button class="btn-poema" onclick="fav(${p.id})">${p.favorito ? '⭐' : '☆'}</button>
          <button class="btn-poema" onclick="seguir(${p.id})">${p.siguiendo ? 'Siguiendo' : 'Seguir'}</button>
        </div>
        <div class="poema-actions">
          <button class="action-btn" onclick="archivarPoema(${p.id})">📦 Archivar</button>
          <button class="action-btn" onclick="eliminarPoema(${p.id})">🗑️ Eliminar</button>
        </div>
      `;
      target.appendChild(div);
    }
  });
}

/* RENDER EN PERFIL */
function renderPerfilPoemas(){
  const lista = poemas.filter(p => p.estado === 'feed' && p.autor === document.getElementById("perf-nombre").innerText);
  const cont = document.getElementById('perfil-poemas-lista');
  if (!cont) return;

  cont.innerHTML = "";
  if (ajustes.perfilPrivado){
    cont.innerHTML = `<p style="opacity:.85;">🔒 Tu perfil es privado. Solo tú lo ves aquí.</p>`;
    return;
  }

  if (lista.length === 0) {
    cont.innerHTML = `<p style="opacity:.8;">Aún no hay publicaciones.</p>`;
    return;
  }
  lista.forEach(p=>{
    const row = document.createElement('div');
    row.className = 'perfil-entry';
    row.innerHTML = `
      <span class="titulo">${p.titulo}</span>
      <div class="acciones">
        <button class="nota-btn" onclick="archivarPoema(${p.id})">📦 Archivar</button>
        <button class="nota-btn" onclick="eliminarPoema(${p.id})">🗑️ Eliminar</button>
      </div>
    `;
    cont.appendChild(row);
  });
}

/* Abrir editor precargado para un borrador */
function editarBorrador(id){
  const p = poemas.find(x => x.id === id);
  if (!p) return;

  editandoId = p.id;
  document.getElementById("tituloPoema").value = p.titulo;
  document.getElementById("areaEscritura").innerHTML = p.contenido;
  document.getElementById("modalEditor").style.display = "flex";
}

/* =========================
   INTERACCIONES
========================= */
// Toggle de fresa: siempre 🍓, permite quitar mi fresa y nunca duplica
function votar(id) {
  const yaLikee = likesMios.includes(id);
  const p = poemas.find(x => x.id === id);
  if (!p) return;

  if (yaLikee) {
    p.fresas = Math.max(0, (p.fresas || 0) - 1);
    likesMios = likesMios.filter(x => x !== id);
    localStorage.setItem('likesMios', JSON.stringify(likesMios));
    guardarTodo();
    toast('Quitaste tu fresa 🍓');
  } else {
    p.fresas = (p.fresas || 0) + 1;
    likesMios.push(id);
    localStorage.setItem('likesMios', JSON.stringify(likesMios));
    guardarTodo();
    toast('Gracias por la fresa 🍓');
  }
}
function fav(id) {
  const p = poemas.find(x => x.id === id);
  if (!p) return;
  p.favorito = !p.favorito;
  guardarTodo();
}
function seguir(id) {
  const p = poemas.find(x => x.id === id);
  if (!p) return;
  const antes = p.siguiendo;
  p.siguiendo = !p.siguiendo;
  if (!antes && p.siguiendo && ajustes.lluvia) lluviaDeFresas();
  guardarTodo();
}

/* Archivar / Restaurar / Eliminar */
function archivarPoema(id){
  const p = poemas.find(x => x.id === id);
  if (!p) return;
  p.estado = 'archivados';
  guardarTodo();
  toast('Archivado 📦');
}
function restaurarPoema(id){
  const p = poemas.find(x => x.id === id);
  if (!p) return;
  p.estado = 'feed';
  guardarTodo();
  toast('Publicado de nuevo 📤');
}
function eliminarPoema(id){
  if (!confirm('¿Eliminar este poema? Esta acción no se puede deshacer.')) return;
  poemas = poemas.filter(x => x.id !== id);
  likesMios = likesMios.filter(x => x !== id); // limpiar mi fresa si la tenía
  localStorage.setItem('likesMios', JSON.stringify(likesMios));
  guardarTodo();
  toast('Eliminado 🗑️');
}

function guardarTodo() {
  localStorage.setItem('poemas', JSON.stringify(poemas));
  if (ultimaSeccion === 'perfil') renderPerfilPoemas();
  else if (ultimaSeccion === 'config') precargarAjustesEnUI();
  else renderizarPoemas(ultimaSeccion);
}

/* =========================
   EFECTO FRESAS 🍓
========================= */
function lluviaDeFresas() {
  if (!ajustes.lluvia) return;
  for (let i = 0; i < 15; i++) {
    const f = document.createElement("div");
    f.className = "fresa-caida";
    f.innerText = "🍓";
    f.style.left = Math.random() * 100 + "vw";
    f.style.animationDuration = (Math.random() * 2 + 1) + "s";
    document.getElementById("contenedor-lluvia").appendChild(f);
    setTimeout(() => f.remove(), 3000);
  }
}

/* =========================
   CONTADOR DE PALABRAS
========================= */
function contarPalabras(html){
  const text = html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  return text ? text.split(' ').length : 0;
}

/* =========================
   TOAST
========================= */
function toast(msg='Guardado ✨'){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=> t.classList.remove('show'), 1600);
}

/* Exponer funciones al global para los onclick del HTML */
window.abrirEditor = abrirEditor;
window.cerrarEditor = cerrarEditor;
window.mostrarSeccion = mostrarSeccion;
window.toggleMenu = toggleMenu;
window.guardarPerfil = guardarPerfil;
window.previsualizar = previsualizar;
window.togglePrivacidad = togglePrivacidad;
window.cambiarContrasena = cambiarContrasena;
window.accionSesion = accionSesion;
window.iniciarSesion = iniciarSesion;
window.cerrarModalLogin = cerrarModalLogin;
window.publicar = publicar;
window.votar = votar;
window.fav = fav;
window.seguir = seguir;
window.archivarPoema = archivarPoema;
window.restaurarPoema = restaurarPoema;
window.eliminarPoema = eliminarPoema;
window.editarBorrador = editarBorrador;
window.guardarAjustes = guardarAjustes;