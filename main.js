// Teachable Machine Model URL
const URL = "https://teachablemachine.withgoogle.com/models/ay6JupUUH/";

let model, webcam, maxPredictions;
let isWebcamRunning = false;

// DOM Elements
const useUploadBtn = document.getElementById('use-upload-btn');
const useWebcamBtn = document.getElementById('use-webcam-btn');
const uploadModeContainer = document.getElementById('upload-mode-container');
const webcamModeContainer = document.getElementById('webcam-mode-container');

const uploadArea = document.getElementById('upload-area');
const imageUpload = document.getElementById('image-upload');
const imagePreview = document.getElementById('image-preview');
const uploadPlaceholder = document.querySelector('.upload-placeholder');
const startWebcamBtn = document.getElementById('start-webcam-btn');
const webcamContainer = document.getElementById('webcam-container');

const loadingContainer = document.getElementById('loading-container');
const resultContainer = document.getElementById('result-container');
const labelContainer = document.getElementById('label-container');
const themeToggle = document.getElementById('theme-toggle');

const generateLottoBtn = document.getElementById('generate-lotto-btn');
const lottoNumbersContainer = document.getElementById('lotto-numbers');

// Legal Modals
const legalModal = document.getElementById('legal-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close-modal');
const privacyLink = document.getElementById('privacy-link');
const termsLink = document.getElementById('terms-link');

const legalContent = {
    privacy: `
        <h2>개인정보처리방침</h2>
        <p>본 서비스는 사용자의 이미지를 서버에 저장하지 않습니다. 모든 분석은 웹브라우저 내에서 인공지능 모델을 통해 실시간으로 수행됩니다.</p>
        <p>분석에 사용된 사진은 브라우저 세션이 종료되거나 페이지를 새로고침하면 즉시 삭제됩니다.</p>
    `,
    terms: `
        <h2>이용약관</h2>
        <p>본 서비스는 엔터테인먼트 목적으로만 제공됩니다. 로또 번호 생성 결과나 AI 분석 결과에 대해 어떠한 법적 책임도 지지 않습니다.</p>
        <p>사용자는 본 서비스를 불법적인 목적으로 이용할 수 없으며, 서비스 이용 시 발생하는 결과에 대한 책임은 사용자 본인에게 있습니다.</p>
    `
};

privacyLink.addEventListener('click', (e) => {
    e.preventDefault();
    modalBody.innerHTML = legalContent.privacy;
    legalModal.classList.remove('hidden');
});

termsLink.addEventListener('click', (e) => {
    e.preventDefault();
    modalBody.innerHTML = legalContent.terms;
    legalModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    legalModal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
    if (e.target === legalModal) {
        legalModal.classList.add('hidden');
    }
});

// Smooth Scrolling for Nav Links
document.querySelectorAll('.nav-menu a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        document.querySelector(targetId).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Lotto Generation logic
generateLottoBtn.addEventListener('click', () => {
    lottoNumbersContainer.innerHTML = '';
    const numbers = new Set();
    while (numbers.size < 5) {
        const randomNumber = Math.floor(Math.random() * 45) + 1;
        numbers.add(randomNumber);
    }

    const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);

    sortedNumbers.forEach((number, index) => {
        setTimeout(() => {
            const numberDiv = document.createElement('div');
            numberDiv.classList.add('lotto-number');
            numberDiv.textContent = number;
            lottoNumbersContainer.appendChild(numberDiv);
        }, index * 100);
    });
});

// Initialize the model
async function initModel() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
    } catch (error) {
        console.error("Error loading model:", error);
    }
}

// Predict using the model
async function predict(source) {
    if (!model) {
        await initModel();
    }

    const prediction = await model.predict(source);
    
    labelContainer.innerHTML = '';
    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probability = (prediction[i].probability * 100).toFixed(0);
        
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
            <div class="label-info">
                <span>${className}</span>
                <span>${probability}%</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${probability}%"></div>
            </div>
        `;
        labelContainer.appendChild(resultItem);
    }

    resultContainer.style.display = 'block';
}

// Webcam Logic
async function startWebcam() {
    if (!model) await initModel();
    
    startWebcamBtn.style.display = 'none';
    loadingContainer.style.display = 'block';

    const flip = true;
    webcam = new tmImage.Webcam(300, 300, flip);
    
    try {
        await webcam.setup();
        await webcam.play();
        isWebcamRunning = true;
        
        loadingContainer.style.display = 'none';
        webcamContainer.innerHTML = '';
        webcamContainer.appendChild(webcam.canvas);
        
        window.requestAnimationFrame(loop);
    } catch (error) {
        console.error("Webcam error:", error);
        alert("Webcam access denied.");
        startWebcamBtn.style.display = 'block';
        loadingContainer.style.display = 'none';
    }
}

async function loop() {
    if (!isWebcamRunning) return;
    webcam.update();
    await predict(webcam.canvas);
    window.requestAnimationFrame(loop);
}

function stopWebcam() {
    isWebcamRunning = false;
    if (webcam) {
        webcam.stop();
    }
    webcamContainer.innerHTML = '';
    startWebcamBtn.style.display = 'block';
}

// Image Upload Logic
function handleImage(file) {
    if (!file || !file.type.startsWith('image/')) return;

    loadingContainer.style.display = 'block';
    resultContainer.style.display = 'none';

    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
        uploadPlaceholder.style.display = 'none';
        
        imagePreview.onload = async () => {
            loadingContainer.style.display = 'none';
            await predict(imagePreview);
        };
    };
    reader.readAsDataURL(file);
}

// Mode Switching
useUploadBtn.addEventListener('click', () => {
    useUploadBtn.classList.add('active');
    useWebcamBtn.classList.remove('active');
    uploadModeContainer.style.display = 'block';
    webcamModeContainer.style.display = 'none';
    resultContainer.style.display = 'none';
    stopWebcam();
});

useWebcamBtn.addEventListener('click', () => {
    useWebcamBtn.classList.add('active');
    useUploadBtn.classList.remove('active');
    webcamModeContainer.style.display = 'flex';
    uploadModeContainer.style.display = 'none';
    resultContainer.style.display = 'none';
});

// Event Listeners
uploadArea.addEventListener('click', () => imageUpload.click());
imageUpload.addEventListener('change', (e) => handleImage(e.target.files[0]));
startWebcamBtn.addEventListener('click', startWebcam);

// Drag and Drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--accent-color)';
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'var(--border-color)';
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border-color)';
    handleImage(e.dataTransfer.files[0]);
});

// Theme Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDarkMode ? '라이트 모드' : '다크 모드';
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
});

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '라이트 모드';
}

initModel();
