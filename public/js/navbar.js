function renderNavbar() {
    const token = localStorage.getItem('token');
    const navbarContainer = document.getElementById('main-nav');
    
    if (!navbarContainer) return;

    let links = '';

    if (token) {
        // Opciones para usuarios LOGUEADOS
        links = `
            <li class="nav-item"><a class="nav-link" href="explorar.html">Explorar</a></li>
            <li class="nav-item"><a class="nav-link" href="dashboard.html">Mis Inmuebles</a></li>
            <li class="nav-item"><a class="nav-link" href="publicar.html">Publicar</a></li>
            <li class="nav-item"><a class="nav-link" href="perfil.html">Mi Perfil</a></li>
            <li class="nav-item">
                <button class="btn btn-outline-danger btn-sm ms-lg-3 mt-2 mt-lg-0" onclick="logout()">Cerrar Sesión</button>
            </li>
        `;
    } else {
        // Opciones para visitantes (NO LOGUEADOS)
        links = `
            <li class="nav-item"><a class="nav-link" href="explorar.html">Explorar</a></li>
            <li class="nav-item"><a class="nav-link" href="index.html">Iniciar Sesión</a></li>
            <li class="nav-item">
                <a class="btn btn-light btn-sm ms-lg-3 mt-2 mt-lg-0" href="registro.html">Registrarme</a>
            </li>
        `;
    }

    navbarContainer.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow mb-4">
            <div class="container">
                <a class="navbar-brand fw-bold" href="explorar.html">🏠 AgendaTuHogar</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav ms-auto align-items-center">
                        ${links}
                    </ul>
                </div>
            </div>
        </nav>
    `;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'index.html';
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', renderNavbar);