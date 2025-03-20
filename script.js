// تنظیمات اولیه Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth * 0.8 / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth * 0.8, window.innerHeight);
document.getElementById('scene').appendChild(renderer.domElement);

// افزودن نور به صحنه
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 1).normalize();
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040)); // نور محیطی برای روشنایی بهتر

// کنترل‌های زوم و چرخش
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.minDistance = 1;
controls.maxDistance = 100;

// لودر فایل‌های GLTF/GLB
const loader = new THREE.GLTFLoader();
let currentModel = null;

// تابع بارگذاری مدل
function loadModel(file) {
    if (currentModel) {
        scene.remove(currentModel);
    }
    loader.load(`models/${file}`, (gltf) => {
        currentModel = gltf.scene;
        scene.add(currentModel);
        
        // تنظیم دوربین برای نمایش کامل مدل
        fitCameraToModel(currentModel);
    }, undefined, (error) => {
        console.error('خطا در بارگذاری مدل:', error);
    });
}

// تابع برای تنظیم خودکار دوربین روی مدل
function fitCameraToModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());
    
    model.position.x = -center.x;
    model.position.y = -center.y;
    model.position.z = -center.z;
    
    camera.position.set(0, 0, size * 2);
    camera.lookAt(0, 0, 0);
    controls.update();
}

// تابع بارگذاری مدل از فایل آپلود شده
function loadUploadedModel(file) {
    if (currentModel) {
        scene.remove(currentModel);
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const fileURL = event.target.result;
        
        loader.load(fileURL, (gltf) => {
            currentModel = gltf.scene;
            scene.add(currentModel);
            
            // تنظیم دوربین برای نمایش کامل مدل
            fitCameraToModel(currentModel);
            
            // اضافه کردن نام فایل به لیست فایل‌های نمایش داده شده
            const fileName = file.name;
            addUploadedFileToList(fileName);
        }, 
        (xhr) => {
            const loadingPercentage = Math.round((xhr.loaded / xhr.total) * 100);
            console.log(`درحال بارگذاری: ${loadingPercentage}%`);
        }, 
        (error) => {
            console.error('خطا در بارگذاری مدل:', error);
            alert('خطا در بارگذاری مدل: ' + error.message);
        });
    };
    
    reader.readAsDataURL(file);
}

// اضافه کردن فایل آپلود شده به لیست
function addUploadedFileToList(fileName) {
    const fileListDiv = document.getElementById('file-list');
    
    // بررسی آیا این فایل قبلاً اضافه شده است
    const existingFile = Array.from(fileListDiv.querySelectorAll('p')).find(p => p.textContent === fileName);
    if (existingFile) {
        // اگر قبلاً آپلود شده، فقط استایل آن را تغییر می‌دهیم
        existingFile.className = 'uploaded-file';
        return;
    }
    
    const p = document.createElement('p');
    p.textContent = fileName;
    p.className = 'uploaded-file';
    p.title = 'فایل آپلود شده توسط شما';
    
    // اضافه کردن به بالای لیست
    if (fileListDiv.firstChild) {
        fileListDiv.insertBefore(p, fileListDiv.firstChild);
    } else {
        fileListDiv.appendChild(p);
    }
}

// بارگذاری لیست فایل‌ها
const fileListDiv = document.getElementById('file-list');
fetch('models/files.json')
    .then(response => response.json())
    .then(files => {
        files.forEach(file => {
            const p = document.createElement('p');
            p.textContent = file;
            p.addEventListener('click', () => loadModel(file));
            fileListDiv.appendChild(p);
        });
    })
    .catch(error => {
        console.error('خطا در بارگذاری لیست فایل‌ها:', error);
        // در صورت خطا، ادامه می‌دهیم تا حداقل بخش آپلود فایل کار کند
    });

// اضافه کردن مدیریت رویداد برای آپلود فایل
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('model-upload');
    
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.name.endsWith('.gltf') || file.name.endsWith('.glb')) {
                loadUploadedModel(file);
            } else {
                alert('لطفاً فقط فایل‌های با پسوند .gltf یا .glb انتخاب کنید.');
            }
        }
    });
});

// کنترل‌های نور
document.getElementById('light-x').addEventListener('input', (e) => {
    light.position.x = e.target.value;
});
document.getElementById('light-y').addEventListener('input', (e) => {
    light.position.y = e.target.value;
});
document.getElementById('light-z').addEventListener('input', (e) => {
    light.position.z = e.target.value;
});
document.getElementById('light-color').addEventListener('input', (e) => {
    light.color.set(e.target.value);
});

// حلقه انیمیشن برای رندر مداوم
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// تنظیم اندازه رندرر با تغییر اندازه پنجره
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth * 0.8 / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight);
});