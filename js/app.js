// ===========================
// App Main Controller
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase & modules
    initFirebase();
    initWaterQuality();
    initFishRecognition();
    initVideoStream();

    // Setup navigation
    setupNavigation();

    // Start clock
    startClock();

    // Create background particles
    createParticles();

    // Quick nav buttons from overview
    setupQuickNav();
});

// --- Navigation ---
function setupNavigation() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const overlay = document.getElementById('sidebarOverlay');
    const navItems = document.querySelectorAll('.nav-item');
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');

    // Sidebar toggle (mobile)
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    // Navigation click handlers
    function navigateTo(sectionId) {
        // Update active section
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`section-${sectionId}`);
        if (target) {
            target.classList.add('active');
            // Re-trigger animation
            target.style.animation = 'none';
            target.offsetHeight; // force reflow
            target.style.animation = '';
        }

        // Update sidebar active
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionId);
        });

        // Update bottom nav active
        bottomNavItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionId);
        });

        // Close sidebar on mobile
        sidebar.classList.remove('open');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => navigateTo(item.dataset.section));
    });

    bottomNavItems.forEach(item => {
        item.addEventListener('click', () => navigateTo(item.dataset.section));
    });

    // Expose for external use
    window.navigateTo = navigateTo;
}

// --- Quick Nav from Overview ---
function setupQuickNav() {
    const btnGoToVideo = document.getElementById('btnGoToVideo');
    const btnGoToFish = document.getElementById('btnGoToFish');

    if (btnGoToVideo) {
        btnGoToVideo.addEventListener('click', () => window.navigateTo('video-stream'));
    }
    if (btnGoToFish) {
        btnGoToFish.addEventListener('click', () => window.navigateTo('fish-recognition'));
    }
}

// --- Real-time Clock ---
function startClock() {
    function updateClock() {
        const now = new Date();
        const dateEl = document.querySelector('.datetime .date');
        const timeEl = document.querySelector('.datetime .time');

        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        }
        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    updateClock();
    setInterval(updateClock, 1000);
}

// --- Background Particles ---
function createParticles() {
    const container = document.getElementById('bgParticles');
    if (!container) return;

    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = (Math.random() * 100 + 100) + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 15) + 's';

        // Randomize color between accent-primary and accent-secondary
        particle.style.background = Math.random() > 0.5 ?
            'rgba(0, 212, 170, 0.15)' :
            'rgba(0, 153, 255, 0.12)';

        container.appendChild(particle);
    }
}

// --- Chart Range Buttons ---
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('chart-btn')) {
        document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        // In a real app, this would fetch historical data for the selected range
        console.log('Chart range:', e.target.dataset.range);
    }
});
