// ===========================
// Firebase Configuration
// ===========================

// TODO: Thay thế bằng cấu hình Firebase thực tế của bạn
const firebaseConfig = {
    apiKey: "AIzaSyBjDZcW1pzDWIleWgveRknuO5zm5bcHVjM",
    authDomain: "luanvan-10e5a.firebaseapp.com",
    databaseURL: "https://luanvan-10e5a-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "luanvan-10e5a",
    storageBucket: "luanvan-10e5a.firebasestorage.app",
    messagingSenderId: "986965627732",
    appId: "1:986965627732:web:9599b08dbefcc4e68beec1",
    measurementId: "G-VCQ1XLPCY1"
};

// Initialize Firebase
let firebaseApp = null;
let database = null;
let isFirebaseConnected = false;

function initFirebase() {
    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        database = firebase.database();

        let hasConnected = false;

        const connectedRef = database.ref('.info/connected');
        connectedRef.on('value', (snap) => {
            isFirebaseConnected = snap.val() === true;
            updateConnectionStatus(isFirebaseConnected);
            if (isFirebaseConnected) {
                hasConnected = true;
                console.log('🔗 Firebase Connected - Kích hoạt luồng dữ liệu...');
                // Gọi Demo ngay tại đây để đảm bảo web có dữ liệu ngay lập tức
                useDemoData(); 
            }
        });

        // Nếu sau 3 giây không thấy tín hiệu từ Firebase, vẫn ép chạy Demo
        setTimeout(() => {
            if (!hasConnected) {
                console.log('⏳ Timeout: Chuyển sang chế độ Offline Demo...');
                updateConnectionStatus(false);
                useDemoData();
            }
        }, 3000);

        console.log('✅ Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        updateConnectionStatus(false);
        useDemoData();
        return false;
    }
}

function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    const statusText = statusEl.querySelector('.status-text');

    if (connected) {
        statusEl.className = 'connection-status connected';
        statusText.textContent = 'Đã kết nối';
    } else {
        statusEl.className = 'connection-status disconnected';
        statusText.textContent = 'Mất kết nối';
    }
}

// Demo data for development/testing
function useDemoData() {
    console.log('🚀 Khởi động chế độ demo cho Cá Tra...');

    // Danh sách hành vi Cá Tra để demo Classification
    const fishBehaviors = [
        { species: "Cá Tra", status: "Bình thường", confidence: 98.5, count: 15 },
        { species: "Cá Tra", status: "Đang đói (Bơi nhanh)", confidence: 94.2, count: 18 },
        { species: "Cá Tra", status: "Tập trung cụm (Cạnh tranh mồi)", confidence: 91.8, count: 22 },
        { species: "Cá Tra", status: "Nghỉ ngơi (Tầng đáy)", confidence: 89.5, count: 12 },
        { species: "Cá Tra", status: "Phản ứng lạ (Cần kiểm tra)", confidence: 85.0, count: 14 }
    ];

    setInterval(() => {
        // 1. Giả lập dữ liệu môi trường (Water Quality)
        const demoWater = {
            temperature: +(27 + Math.random() * 3).toFixed(1),
            ph: +(7.0 + (Math.random() - 0.5) * 0.5).toFixed(1),
            dissolved_oxygen: +(5.5 + (Math.random() - 0.5) * 2).toFixed(1),
            turbidity: Math.floor(15 + Math.random() * 10),
            ammonia: +(0.01 + Math.random() * 0.02).toFixed(3),
            tds: Math.floor(340 + Math.random() * 40),
            status: "Tốt",
            last_updated: new Date().toISOString()
        };

        // 2. Giả lập nhận dạng hành vi Cá Tra
        const randomBehavior = fishBehaviors[Math.floor(Math.random() * fishBehaviors.length)];
        const demoFish = {
            species: `${randomBehavior.species} - ${randomBehavior.status}`,
            confidence: +(randomBehavior.confidence + (Math.random() - 0.5) * 2).toFixed(1),
            count: randomBehavior.count + Math.floor(Math.random() * 5),
            timestamp: new Date().toISOString(),
            image_url: "" // Có thể để trống hoặc dùng link ảnh mẫu
        };

        // Đẩy dữ liệu lên UI
        updateWaterQualityUI(demoWater);
        updateLatestRecognition(demoFish);

        // ĐẨY DỮ LIỆU LÊN FIREBASE (Nếu đã kết nối)
        if (isFirebaseConnected && database) {
            database.ref('water_quality').set(demoWater);
            database.ref('fish_recognition/latest').set(demoFish);

            // Lưu lịch sử (History)
            const historyRef = database.ref('fish_recognition/history');
            const newHistoryEntry = historyRef.push();
            newHistoryEntry.set(demoFish);
        }

        console.log(`📊 Đã cập nhật dữ liệu: ${demoFish.species}`);
    }, 5000); // Cập nhật mỗi 5 giây
}

function startDemoSimulation(baseData) {
    setInterval(() => {
        const simData = { ...baseData };
        simData.temperature = +(baseData.temperature + (Math.random() - 0.5) * 1.5).toFixed(1);
        simData.ph = +(baseData.ph + (Math.random() - 0.5) * 0.3).toFixed(1);
        simData.dissolved_oxygen = +(baseData.dissolved_oxygen + (Math.random() - 0.5) * 1).toFixed(1);
        simData.turbidity = +(baseData.turbidity + (Math.random() - 0.5) * 5).toFixed(0);
        simData.ammonia = +(baseData.ammonia + (Math.random() - 0.5) * 0.01).toFixed(3);
        simData.tds = +(baseData.tds + (Math.random() - 0.5) * 20).toFixed(0);
        simData.last_updated = new Date().toISOString();

        // Determine status based on values
        if (simData.ph < 6.5 || simData.ph > 8.5 || simData.ammonia > 0.05) {
            simData.status = "Cảnh báo";
        } else if (simData.ph < 6 || simData.ph > 9 || simData.ammonia > 0.1) {
            simData.status = "Nguy hiểm";
        } else {
            simData.status = "Tốt";
        }

        if (typeof updateWaterQualityUI === 'function') {
            updateWaterQualityUI(simData);
        }
    }, 5000);
}

