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

// Procesar el archivo M3U para obtener los EXTINF, logos, group-title y la URL del video
function processM3U(data) {
    const lines = data.split('\n');
    let extinfData = [];

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
            const extinfLine = lines[i];

            // Extraer el título, logo y group-title si existen
            const titleMatch = extinfLine.match(/,([^\n]+)/);
            const title = titleMatch ? titleMatch[1].trim() : 'Sin título';

            const logoMatch = extinfLine.match(/tvg-logo="([^"]+)"/);
            const logoUrl = logoMatch ? logoMatch[1] : 'https://via.placeholder.com/300x169';

            const groupMatch = extinfLine.match(/group-title="([^"]+)"/);
            const groupTitle = groupMatch ? groupMatch[1].trim() : 'Sin grupo';

            const videoUrl = lines[i + 1] ? lines[i + 1].trim() : '';

            extinfData.push({ title, logoUrl, groupTitle, videoUrl });
        }
    }
    return extinfData;
}

// Generar tarjetas y asignarlas a los carruseles
function populateCarousel(carouselId, videos) {
    const carousel = document.createElement('div');
    carousel.className = 'carousel';
    carousel.id = carouselId;

    videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const img = document.createElement('img');
        img.src = video.logoUrl;
        card.appendChild(img);
        
        const title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = video.title;
        card.appendChild(title);

        // Evento click para abrir el video
        card.addEventListener('click', () => {
            if (video.videoUrl) {
                try {
                    window.open(video.videoUrl, '_blank');
                } catch (error) {
                    alert('No se pudo abrir el reproductor de video.');
                }
            } else {
                alert('Este video no está disponible.');
            }
        });

        carousel.appendChild(card);
    });

    return carousel;
}

// Crear carruseles según los group-title
function createCarousels(videos) {
    const carouselContainer = document.getElementById('carousel-container');
    carouselContainer.innerHTML = ''; // Limpiar carruseles anteriores

    // Agrupar videos por group-title
    const groups = videos.reduce((acc, video) => {
        (acc[video.groupTitle] = acc[video.groupTitle] || []).push(video);
        return acc;
    }, {});

    const groupTitles = Object.keys(groups);

    if (groupTitles.length === 1) {
        // Si solo hay un group-title, dividir las tarjetas en 5 carruseles
        const videosToDistribute = groups[groupTitles[0]];
        const numCarruseles = 5;
        const numVideos = videosToDistribute.length;
        const videosPerCarousel = Math.ceil(numVideos / numCarruseles);

        for (let i = 0; i < numCarruseles; i++) {
            const groupHeader = document.createElement('h2');
            groupHeader.textContent = `Carrusel ${i + 1}`;
            carouselContainer.appendChild(groupHeader);

            // Obtener las tarjetas para este carrusel
            const videosForThisCarousel = videosToDistribute.slice(i * videosPerCarousel, (i + 1) * videosPerCarousel);
            const carousel = populateCarousel(`carousel${i + 1}`, videosForThisCarousel);
            carouselContainer.appendChild(carousel);
        }
    } else {
        // Si hay más de un group-title, crear un carrusel por cada group-title
        groupTitles.forEach((groupTitle, index) => {
            // Crear título del grupo
            const groupHeader = document.createElement('h2');
            groupHeader.textContent = groupTitle;
            carouselContainer.appendChild(groupHeader);

            // Crear carrusel con videos del grupo
            const carousel = populateCarousel(`carousel${index + 1}`, groups[groupTitle]);
            carouselContainer.appendChild(carousel);
        });
    }
}

// Mostrar u ocultar el loading
function toggleLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
        loading.classList.add('loading');
    } else {
        loading.classList.remove('loading');
        loading.classList.add('hidden');
    }
}

// Función para cargar el archivo M3U desde la URL ingresada
async function loadM3U() {
    const m3uUrl = document.getElementById('m3u-url').value;
    if (!m3uUrl) {
        alert('Por favor, introduce una URL válida.');
        return;
    }

    toggleLoading(true);  // Mostrar el loading

    const m3uData = await fetchM3U(m3uUrl);
    if (m3uData) {
        const videos = processM3U(m3uData);
        createCarousels(videos);
    }

    toggleLoading(false); // Ocultar el loading
}

// Añadir evento click al botón
document.getElementById('load-button').addEventListener('click', loadM3U);
