// ===========================
// Fish Recognition Module
// ===========================

function initFishRecognition() {
    if (database) {
        // Listen for latest recognition
        const latestRef = database.ref('fish_recognition/latest');
        latestRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                updateLatestRecognition(data);
            }
        });

        // Listen for history
        const historyRef = database.ref('fish_recognition/history');
        historyRef.orderByChild('timestamp').limitToLast(20).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const historyArr = Object.values(data).reverse();
                updateRecognitionHistory(historyArr);
            }
        });
    }
}

function updateFishRecognitionUI(data) {
    if (data.latest) {
        updateLatestRecognition(data.latest);
    }
    if (data.history) {
        const historyArr = Array.isArray(data.history) ? data.history : Object.values(data.history);
        updateRecognitionHistory(historyArr);
    }
}

function updateLatestRecognition(data) {
    // Update species
    const speciesEl = document.getElementById('fishSpecies');
    if (speciesEl) {
        speciesEl.textContent = data.species || '--';
    }

    // Update confidence
    const confidenceFill = document.getElementById('confidenceFill');
    const confidenceText = document.getElementById('confidenceText');
    if (confidenceFill && confidenceText) {
        const conf = data.confidence || 0;
        confidenceFill.style.width = conf + '%';
        confidenceText.textContent = conf.toFixed(1) + '%';

        // Color based on confidence
        if (conf >= 90) {
            confidenceFill.style.background = 'linear-gradient(90deg, #00d4aa, #0099ff)';
        } else if (conf >= 70) {
            confidenceFill.style.background = 'linear-gradient(90deg, #ffb347, #ff9500)';
        } else {
            confidenceFill.style.background = 'linear-gradient(90deg, #ff5757, #ff2d2d)';
        }
    }

    // Update count
    const countEl = document.getElementById('fishCount');
    if (countEl) {
        countEl.textContent = data.count !== undefined ? data.count : '--';
    }

    // Update timestamp
    const timeEl = document.getElementById('recognitionTime');
    if (timeEl && data.timestamp) {
        const date = new Date(data.timestamp);
        timeEl.textContent = date.toLocaleString('vi-VN');
    }

    // Update image
    const imageContainer = document.getElementById('recognitionImage');
    if (imageContainer && data.image_url) {
        imageContainer.innerHTML = `<img src="${data.image_url}" alt="Nhận dạng cá" onerror="this.parentElement.innerHTML='<div class=\\'fish-placeholder\\'><p>Không tải được ảnh</p></div>'">`;
    }

    // Update mini panel on overview
    updateFishMini(data);
}

function updateFishMini(data) {
    const miniPanel = document.getElementById('fishLatestMini');
    if (!miniPanel) return;

    miniPanel.innerHTML = `
        <div class="fish-mini-content" style="width:100%; padding: 8px 0;">
            <div style="display:flex; align-items:center; gap:16px; margin-bottom:12px;">
                ${data.image_url ?
            `<img src="${data.image_url}" alt="${data.species}" style="width:60px;height:60px;border-radius:10px;object-fit:cover;border:1px solid rgba(0,212,170,0.2);">` :
            `<div style="width:60px;height:60px;border-radius:10px;background:rgba(0,212,170,0.1);display:flex;align-items:center;justify-content:center;font-size:1.8rem;">🐟</div>`
        }
                <div>
                    <div style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-bottom:2px;">${data.species || '--'}</div>
                    <div style="font-size:0.78rem;color:var(--text-secondary);">Số lượng: <strong style="color:var(--accent-primary)">${data.count || 0}</strong></div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;">
                    <div style="width:${data.confidence || 0}%;height:100%;background:var(--accent-gradient);border-radius:3px;transition:width 1s;"></div>
                </div>
                <span style="font-size:0.78rem;font-family:'JetBrains Mono',monospace;color:var(--accent-primary);font-weight:600;">${(data.confidence || 0).toFixed(1)}%</span>
            </div>
        </div>
    `;
}

function updateRecognitionHistory(historyArr) {
    const tbody = document.getElementById('historyBody');
    if (!tbody) return;

    if (!historyArr || historyArr.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="4">Chưa có dữ liệu lịch sử</td></tr>';
        return;
    }

    tbody.innerHTML = historyArr.map(item => {
        const date = item.timestamp ? new Date(item.timestamp) : null;
        const timeStr = date ? date.toLocaleString('vi-VN') : '--';
        const conf = item.confidence || 0;

        let confColor = 'var(--accent-primary)';
        if (conf < 70) confColor = 'var(--accent-danger)';
        else if (conf < 90) confColor = 'var(--accent-warning)';

        return `
            <tr>
                <td style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;color:var(--text-secondary);">${timeStr}</td>
                <td style="font-weight:600;">${item.species || '--'}</td>
                <td>
                    <span style="color:${confColor};font-weight:600;font-family:'JetBrains Mono',monospace;">
                        ${conf.toFixed(1)}%
                    </span>
                </td>
                <td style="font-weight:600;">${item.count || '--'}</td>
            </tr>
        `;
    }).join('');
}
