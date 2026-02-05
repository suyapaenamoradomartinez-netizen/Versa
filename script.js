let poemas = JSON.parse(localStorage.getItem('poemas')) || [];
let likesMios = JSON.parse(localStorage.getItem('likesMios')) || [];
let ajustes = JSON.parse(localStorage.getItem('ajustesEmely')) || { sonido: true, lluvia: true, oscuro: false };
let ultimaSeccion = 'feed';

const sonido = document.getElementById("sonidoTecla");
const area = document.getElementById("areaEscritura");

window.onload = () => {
  aplicarTemaOscuro(ajustes.oscuro);
  cargarPerfil();
  mostrarSeccion('feed');
};

/* --- SONIDO MÁQUINA --- */
if (area) {
  area.addEventListener("keydown", () => {
    if (ajustes.sonido && sonido) {
      let s = sonido.cloneNode();
      s.volume = 0.12;
      s.play();
    }
  });
}

/* --- NAVEGACIÓN --- */
function toggleMenu() {
  const nav = document.getElementById("miSidebar");
  nav.style.width = nav.style.width === "280px" ? "0" : "280px";
}

function mostrarSeccion(id) {
  const secciones = ['feed', 'favoritos', 'borradores', 'archivados', 'perfil', 'config'];
  secciones.forEach(s => {
    const el = document.getElementById('seccion-' + s);
    if (el) el.style.display = (s === id) ? 'block' : 'none';
  });
  
  const header = document.querySelector('.header-principal');
  header.style.display = (id === 'borradores' || id === 'archivados') ? 'none' : 'block';
  
  ultimaSeccion = id;
  renderizarPoemas(id);
  const nav = document.getElementById("miSidebar");
  nav.style.width = "0";
}

/* --- EDITOR --- */
function abrirEditor() { document.getElementById("modalEditor").style.display = "flex"; toggleMenu(); }
function cerrarEditor() { document.getElementById("modalEditor").style.display = "none"; }

function publicar(estado) {
  const titulo = document.getElementById("tituloPoema").value;
  const contenido = document.getElementById("areaEscritura").innerHTML;
  if (!titulo || !contenido) return toast("Escribe algo...");

  poemas.push({ id: Date.now(), titulo, contenido, estado, favorito: false, fresas: 0 });
  localStorage.setItem('poemas', JSON.stringify(poemas));
  
  document.getElementById("tituloPoema").value = "";
  document.getElementById("areaEscritura").innerHTML = "";
  cerrarEditor();
  mostrarSeccion(estado);
  toast("¡Guardado! ✨");
}

/* --- RENDER --- */
function renderizarPoemas(filtro) {
  const cont = document.getElementById('seccion-' + filtro);
  if (!cont || filtro === 'perfil' || filtro === 'config') return;
  cont.innerHTML = `<h2 class="times" style="text-align:center">${filtro.toUpperCase()}</h2>`;

  const lista = poemas.filter(p => {
    if (filtro === 'favoritos') return p.favorito;
    return p.estado === filtro;
  });

  lista.forEach(p => {
    const div = document.createElement('div');
    div.className = "poema-card";
    div.innerHTML = `
      <h3 class="times">${p.titulo}</h3>
      <div style="margin:20px 0">${p.contenido}</div>
      <button class="btn-poema ${likesMios.includes(p.id)?'liked':''}" onclick="votar(${p.id})">🍓 ${p.fresas}</button>
      <button class="btn-poema" onclick="fav(${p.id})">${p.favorito?'⭐':'☆'}</button>
      <button class="btn-poema" onclick="eliminar(${p.id})">🗑️</button>
    `;
    cont.appendChild(div);
  });
}

/* --- PERFIL --- */
function abrirModalPerfil() { document.getElementById("modalPerfil").style.display = "flex"; }
function cerrarModalPerfil() { document.getElementById("modalPerfil").style.display = "none"; }

function guardarPerfil() {
  const p = {
    nombre: document.getElementById("edit-nombre").value,
    usuario: document.getElementById("edit-usuario").value,
    bio: document.getElementById("edit-bio").value
  };
  localStorage.setItem('perfilEmely', JSON.stringify(p));
  cargarPerfil();
  cerrarModalPerfil();
  toast("Perfil actualizado ✨");
}

function cargarPerfil() {
  const p = JSON.parse(localStorage.getItem('perfilEmely'));
  if (p) {
    document.getElementById("perf-nombre").innerText = p.nombre;
    document.getElementById("perf-usuario").innerText = "@" + p.usuario;
    document.getElementById("perf-bio").innerText = p.bio;
  }
}

/* --- AJUSTES --- */
function guardarAjustes() {
  ajustes.sonido = document.getElementById('cfg-sonido').checked;
  ajustes.lluvia = document.getElementById('cfg-lluvia').checked;
  ajustes.oscuro = document.getElementById('cfg-oscuro').checked;
  localStorage.setItem('ajustesEmely', JSON.stringify(ajustes));
  aplicarTemaOscuro(ajustes.oscuro);
  toast("Ajustes guardados ✨");
}

function aplicarTemaOscuro(v) {
  v ? document.body.setAttribute('data-theme', 'dark') : document.body.removeAttribute('data-theme');
}

function votar(id) {
  const p = poemas.find(x => x.id === id);
  if (!likesMios.includes(id)) {
    p.fresas++;
    likesMios.push(id);
    if (ajustes.lluvia) lluvia();
  } else {
    p.fresas--;
    likesMios = likesMios.filter(x => x !== id);
  }
  localStorage.setItem('poemas', JSON.stringify(poemas));
  localStorage.setItem('likesMios', JSON.stringify(likesMios));
  renderizarPoemas(ultimaSeccion);
}

function fav(id) {
  const p = poemas.find(x => x.id === id);
  p.favorito = !p.favorito;
  localStorage.setItem('poemas', JSON.stringify(poemas));
  renderizarPoemas(ultimaSeccion);
}

function eliminar(id) {
  poemas = poemas.filter(x => x.id !== id);
  localStorage.setItem('poemas', JSON.stringify(poemas));
  renderizarPoemas(ultimaSeccion);
}

function lluvia() {
  for (let i=0; i<15; i++) {
    const f = document.createElement("div");
    f.className = "fresa-caida"; f.innerText = "🍓";
    f.style.left = Math.random() * 100 + "vw";
    f.style.animationDuration = (Math.random()*2+1)+"s";
    document.getElementById("contenedor-lluvia").appendChild(f);
    setTimeout(() => f.remove(), 3000);
  }
}

function toast(m) {
  const t = document.getElementById('toast');
  t.innerText = m; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}