// Función para leer archivo M3U desde una URL
async function fetchM3U(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        return text;
    } catch (error) {
        console.error('Error al cargar el archivo M3U:', error);
    }
}

// Procesar el archivo M3U para obtener los EXTINF, logos y generar las tarjetas
function processM3U(data) {
    const lines = data.split('\n');
    let extinfData = [];

    // Leer las líneas del archivo y extraer los EXTINF, logos y la URL
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
            const extinfLine = lines[i];

            // Extraer el título y el logo si existe
            const titleMatch = extinfLine.match(/,([^\n]+)/); // Extrae el título después de la coma
            const title = titleMatch ? titleMatch[1].trim() : 'Sin título';

            const logoMatch = extinfLine.match(/tvg-logo="([^"]+)"/); // Extrae el logo si está disponible
            const logoUrl = logoMatch ? logoMatch[1] : 'https://via.placeholder.com/300x169'; // Placeholder si no hay logo

            const videoUrl = lines[i + 1] ? lines[i + 1].trim() : ''; // URL del video

            extinfData.push({ title, logoUrl, videoUrl });
        }
    }
    return extinfData;
}

// Generar tarjetas y asignarlas a los carruseles
function populateCarousel(carouselId, videos) {
    const carousel = document.getElementById(carouselId);
    videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Imagen desde el logo (o un placeholder si no hay logo)
        const img = document.createElement('img');
        img.src = video.logoUrl;
        card.appendChild(img);
        
        // Título del video
        const title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = video.title;
        card.appendChild(title);

        // Añadir evento de clic para abrir el video
        card.addEventListener('click', () => {
            if (video.videoUrl) {
                try {
                    // Intentar abrir el video en un reproductor
                    window.open(video.videoUrl, '_blank');
                } catch (error) {
                    // Mostrar un mensaje de error si falla
                    alert('No se pudo abrir el reproductor de video.');
                }
            } else {
                // Si no hay video, mostrar un mensaje de error
                alert('Este video no está disponible.');
            }
        });

        carousel.appendChild(card);
    });
}

// Cargar archivo M3U y generar los carruseles
async function loadM3U() {
    const m3uUrl = 'URL_DE_TU_ARCHIVO_M3U'; // Reemplaza con la URL real
    const m3uData = await fetchM3U(m3uUrl);
    const videos = processM3U(m3uData);

    // Distribuir los videos en los carruseles
    const chunkSize = Math.ceil(videos.length / 4);
    populateCarousel('carousel1', videos.slice(0, chunkSize));
    populateCarousel('carousel2', videos.slice(chunkSize, 2 * chunkSize));
    populateCarousel('carousel3', videos.slice(2 * chunkSize, 3 * chunkSize));
    populateCarousel('carousel4', videos.slice(3 * chunkSize));
}

// Iniciar la carga del archivo M3U
loadM3U();