// تنظیمات اولیه Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth * 0.8 / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth * 0.8, window.innerHeight);
document.getElementById('scene').appendChild(renderer.domElement);

// تعریف متغیرهای نور
let currentLight;
let ambientLight;
let hemisphereLight;

// تنظیم نورهای پایه
function setupLights() {
    // حذف نورهای قبلی
    if (currentLight) scene.remove(currentLight);
    if (ambientLight) scene.remove(ambientLight);
    if (hemisphereLight) scene.remove(hemisphereLight);
    
    // تنظیم نور محیطی ملایم برای همه حالت‌ها
    ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    // تنظیم نور بر اساس نوع انتخاب شده
    const lightType = document.getElementById('light-type').value;
    const intensity = parseFloat(document.getElementById('light-intensity').value);
    const color = document.getElementById('light-color').value;
    
    switch (lightType) {
        case 'directional':
            currentLight = new THREE.DirectionalLight(color, intensity);
            currentLight.position.set(
                parseFloat(document.getElementById('light-x').value),
                parseFloat(document.getElementById('light-y').value),
                parseFloat(document.getElementById('light-z').value)
            );
            document.getElementById('position-controls').style.display = 'block';
            document.getElementById('spot-controls').style.display = 'none';
            break;
            
        case 'point':
            currentLight = new THREE.PointLight(color, intensity);
            currentLight.position.set(
                parseFloat(document.getElementById('light-x').value),
                parseFloat(document.getElementById('light-y').value),
                parseFloat(document.getElementById('light-z').value)
            );
            document.getElementById('position-controls').style.display = 'block';
            document.getElementById('spot-controls').style.display = 'none';
            break;
            
        case 'spot':
            currentLight = new THREE.SpotLight(color, intensity);
            currentLight.position.set(
                parseFloat(document.getElementById('light-x').value),
                parseFloat(document.getElementById('light-y').value),
                parseFloat(document.getElementById('light-z').value)
            );
            currentLight.angle = Math.PI * parseFloat(document.getElementById('light-angle').value) / 180;
            currentLight.penumbra = parseFloat(document.getElementById('light-penumbra').value);
            currentLight.target.position.set(0, 0, 0);
            scene.add(currentLight.target);
            document.getElementById('position-controls').style.display = 'block';
            document.getElementById('spot-controls').style.display = 'block';
            break;
            
        case 'ambient':
            currentLight = new THREE.AmbientLight(color, intensity);
            document.getElementById('position-controls').style.display = 'none';
            document.getElementById('spot-controls').style.display = 'none';
            break;
            
        case 'hemisphere':
            // نور نیم‌کره‌ای: رنگ آسمان و زمین
            currentLight = new THREE.HemisphereLight(color, '#444444', intensity);
            document.getElementById('position-controls').style.display = 'none';
            document.getElementById('spot-controls').style.display = 'none';
            break;
    }
    
    scene.add(currentLight);
}

// تبدیل دما به رنگ (کلوین به RGB)
function kelvinToRGB(kelvin) {
    let temp = kelvin / 100;
    let r, g, b;
    
    // الگوریتم تبدیل دمای رنگ به RGB
    if (temp <= 66) {
        r = 255;
        g = 99.4708025861 * Math.log(temp) - 161.1195681661;
        if (temp <= 19) {
            b = 0;
        } else {
            b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
        }
    } else {
        r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
        g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
        b = 255;
    }
    
    // اطمینان از محدوده صحیح
    r = Math.min(255, Math.max(0, Math.round(r)));
    g = Math.min(255, Math.max(0, Math.round(g)));
    b = Math.min(255, Math.max(0, Math.round(b)));
    
    // تبدیل به رنگ هگز
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// نمایش توصیف دما
function updateTemperatureDisplay(kelvin) {
    let description;
    if (kelvin <= 2700) description = "بسیار گرم";
    else if (kelvin <= 3500) description = "گرم";
    else if (kelvin <= 5000) description = "خنثی مایل به گرم";
    else if (kelvin <= 6500) description = "خنثی";
    else if (kelvin <= 8000) description = "خنثی مایل به سرد";
    else description = "سرد";
    
    document.getElementById('temp-display').textContent = `${kelvin}K (${description})`;
}

// کنترل‌های زوم و چرخش
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.minDistance = 1;
controls.maxDistance = 100;

// لودر فایل‌های GLTF/GLB با قابلیت پشتیبانی بهتر از GLB
const loader = new THREE.GLTFLoader();
let currentModel = null;

// تابع بارگذاری مدل با پشتیبانی بهتر برای GLB
function loadModel(file) {
    if (currentModel) {
        scene.remove(currentModel);
    }
    
    // نمایش لودینگ یا وضعیت بارگذاری
    console.log(`در حال بارگذاری مدل: ${file}`);
    
    loader.load(`models/${file}`, (gltf) => {
        currentModel = gltf.scene;
        
        // بهینه‌سازی مدل و اعمال مقیاس مناسب
        optimizeModel(currentModel, file.endsWith('.glb'));
        
        scene.add(currentModel);
        
        // تنظیم دوربین برای نمایش کامل مدل
        fitCameraToModel(currentModel);
    }, 
    (xhr) => {
        // نمایش پیشرفت بارگذاری
        const loadingPercentage = Math.round((xhr.loaded / xhr.total) * 100);
        console.log(`بارگذاری: ${loadingPercentage}%`);
    },
    (error) => {
        console.error('خطا در بارگذاری مدل:', error);
        alert(`خطا در بارگذاری مدل ${file}: ${error.message}`);
    });
}

// بهینه‌سازی مدل با توجه به نوع فایل
function optimizeModel(model, isGLB) {
    // تنظیمات مخصوص برای فایل‌های GLB
    if (isGLB) {
        // تنظیم مقیاس مناسب برای GLB
        // برخی فایل‌های GLB ممکن است مقیاس بسیار بزرگ یا کوچک داشته باشند
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        
        // اگر اندازه مدل بسیار بزرگ یا بسیار کوچک است، آن را مقیاس‌بندی می‌کنیم
        const maxDimension = Math.max(size.x, size.y, size.z);
        if (maxDimension > 100 || maxDimension < 0.1) {
            const scale = 10 / maxDimension;
            model.scale.set(scale, scale, scale);
        }
        
        // فعال کردن سایه‌ها برای مواد موجود در مدل
        model.traverse(function(node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                
                // بهبود مواد برای نمایش بهتر
                if (node.material) {
                    // افزایش کیفیت بازتاب نور برای مواد
                    if (Array.isArray(node.material)) {
                        node.material.forEach(mat => {
                            mat.roughness = Math.min(mat.roughness || 0.7, 0.7);
                            mat.metalness = Math.max(mat.metalness || 0.3, 0.3);
                        });
                    } else {
                        node.material.roughness = Math.min(node.material.roughness || 0.7, 0.7);
                        node.material.metalness = Math.max(node.material.metalness || 0.3, 0.3);
                    }
                }
            }
        });
    }
}

// تابع بارگذاری مدل از فایل آپلود شده با پشتیبانی بهتر از GLB
function loadUploadedModel(file) {
    if (currentModel) {
        scene.remove(currentModel);
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const fileURL = event.target.result;
        const isGLB = file.name.toLowerCase().endsWith('.glb');
        
        // لاگ برای اطلاعات بیشتر از فایل آپلود شده
        console.log(`بارگذاری فایل آپلود شده: ${file.name}, اندازه: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        
        loader.load(fileURL, (gltf) => {
            currentModel = gltf.scene;
            
            // بهینه‌سازی مدل آپلود شده
            optimizeModel(currentModel, isGLB);
            
            scene.add(currentModel);
            
            // تنظیم دوربین برای نمایش کامل مدل
            fitCameraToModel(currentModel);
            
            // اضافه کردن نام فایل به لیست فایل‌های نمایش داده شده
            addUploadedFileToList(file.name);
        }, 
        (xhr) => {
            const loadingPercentage = Math.round((xhr.loaded / xhr.total) * 100);
            console.log(`درحال بارگذاری: ${loadingPercentage}%`);
        }, 
        (error) => {
            console.error('خطا در بارگذاری مدل:', error);
            
            // نمایش خطای دقیق‌تر برای فایل‌های GLB
            if (isGLB) {
                alert(`خطا در بارگذاری فایل GLB: ${error.message}\nاطمینان حاصل کنید که فایل GLB معتبر است و به درستی صادر شده است.`);
            } else {
                alert('خطا در بارگذاری مدل: ' + error.message);
            }
        });
    };
    
    // برای فایل‌های GLB از ArrayBuffer استفاده می‌کنیم برای دقت بیشتر
    if (file.name.toLowerCase().endsWith('.glb')) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsDataURL(file);
    }
}

// بهبود تابع تنظیم دوربین برای نمایش بهتر مدل‌ها
function fitCameraToModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // برای فایل‌های با مقیاس بزرگ یا کوچک، تنظیم منطقی‌تر
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2));
    
    // حداقل و حداکثر فاصله دوربین
    cameraDistance = Math.max(1.5, Math.min(cameraDistance, 100));
    
    // انتقال مدل به مرکز صحنه
    model.position.x = -center.x;
    model.position.y = -center.y;
    model.position.z = -center.z;
    
    // تنظیم موقعیت دوربین
    const direction = new THREE.Vector3(1, 1, 1).normalize();
    camera.position.copy(direction.multiplyScalar(cameraDistance));
    camera.lookAt(0, 0, 0);
    
    // تنظیم کنترل‌ها
    controls.target.set(0, 0, 0);
    controls.minDistance = cameraDistance * 0.1;
    controls.maxDistance = cameraDistance * 5;
    controls.update();
    
    // فعال‌سازی سایه‌ها برای رندرر
    renderer.shadowMap.enabled = true;
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
    
    // تنظیم اولیه نورها
    setupLights();
    
    // کنترل‌های نور
    document.getElementById('light-type').addEventListener('change', setupLights);
    document.getElementById('light-intensity').addEventListener('input', setupLights);
    
    // کنترل‌های موقعیت نور
    document.getElementById('light-x').addEventListener('input', setupLights);
    document.getElementById('light-y').addEventListener('input', setupLights);
    document.getElementById('light-z').addEventListener('input', setupLights);
    
    // کنترل‌های اسپات
    document.getElementById('light-angle').addEventListener('input', setupLights);
    document.getElementById('light-penumbra').addEventListener('input', setupLights);
    
    // کنترل رنگ نور
    document.getElementById('light-color').addEventListener('input', setupLights);
    
    // کنترل دمای رنگ
    document.getElementById('light-temperature').addEventListener('input', function(e) {
        const temperature = parseInt(e.target.value);
        const rgbColor = kelvinToRGB(temperature);
        document.getElementById('light-color').value = rgbColor;
        updateTemperatureDisplay(temperature);
        setupLights();
    });
    
    // نمایش اولیه دمای رنگ
    updateTemperatureDisplay(parseInt(document.getElementById('light-temperature').value));
    
    // تنظیم رندرر برای کیفیت بهتر
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
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