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

// Initialize the model
async function initModel() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log("Model loaded successfully");
    } catch (error) {
        console.error("Error loading model:", error);
    }
}

// Predict using the model
async function predict(source) {
    if (!model) {
        await initModel();
    }

    // prediction can take in an image, video or canvas html element
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
        alert("Could not access webcam. Please check permissions.");
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
    themeToggle.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
});

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = 'Light Mode';
}

initModel();
