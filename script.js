let errorLog = []; // Array para almacenar los errores
let groups = {};   // Almacenar los grupos (group-title) y sus EXTINF

// Función para cargar el archivo M3U desde una URL
function fetchM3UData(url) {

    return fetch('https://corsproxy.io/?' + url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`No se pudo cargar el archivo M3U desde la URL: ${url}`);
            }
            return response.text();  // Devolver el contenido del archivo M3U
        })
        .then(parseM3U)
        .catch(error => {
            errorLog.push(error.message);
            throw error;  // Volver a lanzar el error
        });
}

// Función para analizar el contenido del archivo M3U
function parseM3U(data) {
    const lines = data.split("\n");   // Dividir el contenido por líneas
    let currentGroup = null;
    let currentExtinf = null;

    groups = {};  // Limpiar grupos anteriores

    lines.forEach(line => {
        line = line.trim();
        
        // Procesar las líneas #EXTINF
        if (line.startsWith("#EXTINF")) {
            currentExtinf = parseExtinf(line);   // Extraer la información de #EXTINF
            currentGroup = currentExtinf.groupTitle;
            if (!groups[currentGroup]) {
                groups[currentGroup] = [];
            }
        } else if (line && (line.startsWith("http") || line.startsWith("acestream"))) {
            // Asignar la URL a la entrada actual de EXTINF
            if (currentExtinf) {
                currentExtinf.url = line;
                groups[currentGroup].push(currentExtinf);  // Añadir al grupo
                currentExtinf = null;
            }
        }
    });

    return groups;
}

// Función para extraer los atributos del #EXTINF
function parseExtinf(line) {
    const tvgIdMatch = line.match(/tvg-id="([^"]+)"/);
    const tvgNameMatch = line.match(/tvg-name="([^"]+)"/);
    const tvgLogoMatch = line.match(/tvg-logo="([^"]+)"/);
    const groupTitleMatch = line.match(/group-title="([^"]+)"/);
    const titleMatch = line.match(/,(.*)$/);

    return {
        tvgId: tvgIdMatch ? tvgIdMatch[1] : null,
        tvgName: tvgNameMatch ? tvgNameMatch[1] : null,
        tvgLogo: tvgLogoMatch ? tvgLogoMatch[1] : null,
        groupTitle: groupTitleMatch ? groupTitleMatch[1] : "Sin grupo",
        title: titleMatch ? titleMatch[1] : "Sin título",
        url: null  // La URL será asignada después
    };
}

// Función para crear los carruseles dinámicamente
function createCarousels(groups) {
    const carouselContainer = document.getElementById('carousel-container');
    carouselContainer.innerHTML = ''; // Limpiar carruseles anteriores

    // Obtener la cantidad de grupos distintos
    const groupTitles = Object.keys(groups);
    
    // Si solo hay un grupo, dividir las tarjetas en 5 carruseles
    if (groupTitles.length === 1) {
        const group = groups[groupTitles[0]];
        const perCarousel = Math.ceil(group.length / 5);  // Dividir las tarjetas en 5 carruseles
        
        for (let i = 0; i < 5; i++) {
            const start = i * perCarousel;
            const end = start + perCarousel;
            const carouselItems = group.slice(start, end);  // Fragmento de canales
            if (carouselItems.length > 0) {
                createCarousel(carouselItems, `Grupo ${i + 1}`);
            }
        }
    } else {
        // Crear un carrusel para cada group-title
        groupTitles.forEach(groupTitle => {
            const groupItems = groups[groupTitle];
            createCarousel(groupItems, groupTitle);
        });
    }
}

// Función para crear un carrusel con las tarjetas correspondientes
function createCarousel(items, title) {
    const carouselContainer = document.getElementById('carousel-container');
    
    // Crear el título del carrusel
    const carouselTitle = document.createElement('h2');
    carouselTitle.textContent = title;
    carouselContainer.appendChild(carouselTitle);

    // Crear el contenedor del carrusel
    const carousel = document.createElement('div');
    carousel.classList.add('carousel');

    items.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('card');

        const img = document.createElement('img');
        img.src = item.tvgLogo || 'default-logo.png';  // Logo o imagen por defecto
        img.alt = item.title;

        // Contenedor para título
        const titleContainer = document.createElement('div'); // Crear un contenedor para el título

        const tvgNameElement = document.createElement('p');
        tvgNameElement.textContent = item.tvgName || ""; // Mostrar tvg-name

        const tvgIdElement = document.createElement('p');
        tvgIdElement.textContent = item.tvgId || ""; // Mostrar tvg-id si no hay tvg-name

        titleContainer.appendChild(tvgNameElement);
        titleContainer.appendChild(tvgIdElement);

        card.appendChild(img);
        card.appendChild(titleContainer);
        card.addEventListener('click', () => playVideo(item.url));  // Enlace al video

        carousel.appendChild(card);
    });

    carouselContainer.appendChild(carousel);  // Añadir el carrusel al contenedor
}

// Función para reproducir el video
function playVideo(url) {
    try {
			// Intentar abrir el video en un reproductor
			window.open(url, '_blank');
		} catch (error) {
			// Mostrar un mensaje de error si falla
			alert('No se pudo abrir el reproductor de video.');
	}
}

// Evento para manejar el clic en el botón de carga
document.getElementById('load-button').addEventListener('click', async () => {
    const urlInput = document.getElementById('url-input');
    const url = urlInput.value.trim();
    
    if (!url) {
        alert("Por favor, introduce una URL válida.");
        return;
    }

    // Mostrar el modal de carga
    const loadingModal = document.getElementById('loading-modal');
    loadingModal.classList.remove('hidden');
    
    try {
        document.getElementById('carousel-container').innerHTML = ''; // Limpiar carruseles anteriores
        await fetchM3UData(url); // Cargar datos
        createCarousels(groups); // Crear los carruseles
    } catch (error) {
        document.getElementById('error-log-modal').style.display = 'block'; // Mostrar el modal de errores
        document.getElementById('error-log').textContent = error.message;
    } finally {
        loadingModal.classList.add('hidden'); // Ocultar modal de carga
    }
});

// Evento para cerrar el modal de errores
document.querySelector('#error-log-modal .close').addEventListener('click', () => {
    document.getElementById('error-log-modal').style.display = 'none';
});

// Evento para mostrar el log de errores
document.getElementById('error-log-button').addEventListener('click', () => {
    alert(errorLog.join("\n") || "No hay errores registrados."); // Mostrar errores
});
