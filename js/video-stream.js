// ===========================
// Video Stream Module
// ===========================

let currentStreamUrl = '';
let streamElement = null;
let isStreaming = false;

function initVideoStream() {
    if (database) {
        const streamRef = database.ref('video_stream');
        streamRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                updateStreamConfig(data);
            }
        });
    }

    // Button handlers
    const btnRefresh = document.getElementById('btnRefreshStream');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', refreshStream);
    }

    const btnFullscreen = document.getElementById('btnFullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', toggleFullscreen);
    }

    const btnCapture = document.getElementById('btnCapture');
    if (btnCapture) {
        btnCapture.addEventListener('click', captureFrame);
    }
}

function updateStreamConfig(config) {
    if (config.url && config.url !== currentStreamUrl) {
        currentStreamUrl = config.url;
        startStream(config.url, config.type || 'mjpeg');
    }

    // Update status
    const statusEl = document.getElementById('streamStatus');
    if (statusEl) {
        const dot = statusEl.querySelector('.status-dot');
        const isActive = config.status === 'active';

        if (isActive) {
            dot.className = 'status-dot online';
            statusEl.innerHTML = `<span class="status-dot online"></span> Online`;
        } else {
            dot.className = 'status-dot offline';
            statusEl.innerHTML = `<span class="status-dot offline"></span> Offline`;
        }
    }
}

function startStream(url, type) {
    const container = document.getElementById('videoContainer');
    const containerMini = document.getElementById('videoContainerMini');
    if (!container) return;

    // Hide placeholder
    const placeholder = document.getElementById('videoPlaceholder');
    if (placeholder) placeholder.style.display = 'none';

    // Remove old stream element
    if (streamElement) {
        streamElement.remove();
    }

    if (type === 'mjpeg' || type === 'image') {
        // MJPEG stream – use <img> tag
        streamElement = document.createElement('img');
        streamElement.src = url;
        streamElement.alt = 'Video Stream';
        streamElement.style.cssText = 'width:100%;height:100%;object-fit:contain;';
        streamElement.onerror = () => {
            console.warn('Stream error, retrying...');
            setTimeout(() => { streamElement.src = url + '?t=' + Date.now(); }, 3000);
        };
        streamElement.onload = () => {
            isStreaming = true;
            container.classList.add('streaming');
        };
    } else if (type === 'hls' || type === 'video') {
        // HLS / MP4 stream – use <video> tag
        streamElement = document.createElement('video');
        streamElement.src = url;
        streamElement.autoplay = true;
        streamElement.muted = true;
        streamElement.playsInline = true;
        streamElement.loop = true;
        streamElement.style.cssText = 'width:100%;height:100%;object-fit:contain;';
        streamElement.onplay = () => {
            isStreaming = true;
            container.classList.add('streaming');
        };
    } else {
        // Default: try as img (MJPEG)
        streamElement = document.createElement('img');
        streamElement.src = url;
        streamElement.alt = 'Video Stream';
        streamElement.style.cssText = 'width:100%;height:100%;object-fit:contain;';
    }

    container.insertBefore(streamElement, container.querySelector('.video-overlay'));

    // Also update mini container
    if (containerMini) {
        const miniClone = streamElement.cloneNode(true);
        containerMini.innerHTML = '';
        containerMini.appendChild(miniClone);
    }

    console.log(`📹 Stream started: ${type} → ${url}`);
}

function refreshStream() {
    if (currentStreamUrl) {
        if (streamElement && streamElement.tagName === 'IMG') {
            streamElement.src = currentStreamUrl + '?t=' + Date.now();
        } else if (streamElement && streamElement.tagName === 'VIDEO') {
            streamElement.load();
            streamElement.play();
        }
    }
}

function toggleFullscreen() {
    const container = document.getElementById('videoContainer');
    if (!container) return;

    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.warn('Fullscreen error:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

function captureFrame() {
    if (!streamElement) {
        console.warn('No stream to capture');
        return;
    }

    try {
        const canvas = document.createElement('canvas');

        if (streamElement.tagName === 'VIDEO') {
            canvas.width = streamElement.videoWidth;
            canvas.height = streamElement.videoHeight;
        } else {
            canvas.width = streamElement.naturalWidth || 640;
            canvas.height = streamElement.naturalHeight || 480;
        }

        const ctx = canvas.getContext('2d');
        ctx.drawImage(streamElement, 0, 0);

        const link = document.createElement('a');
        link.download = `capture_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        console.log('📸 Frame captured');
    } catch (err) {
        console.warn('Capture failed (CORS):', err);
    }
}

// Update detection overlay info from Firebase
function updateDetectionOverlay(info) {
    const detectionEl = document.getElementById('detectionInfo');
    if (detectionEl && info) {
        detectionEl.textContent = info;
    }
}
