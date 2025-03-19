// متغیرهای اصلی
let scene, camera, renderer, controls, model;
let ambientLight, directionalLight; // متغیرهای نور
let container = document.getElementById('model-viewer');
let loadingElement = document.getElementById('loading');
let isWebGLSupported = true;

// بررسی پشتیبانی از WebGL
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        isWebGLSupported = !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        
        if (!isWebGLSupported) {
            showError('مرورگر شما از WebGL پشتیبانی نمی‌کند');
            return false;
        }
        return true;
    } catch (e) {
        showError('خطا در بررسی پشتیبانی WebGL');
        console.error('WebGL error:', e);
        return false;
    }
}

// تنظیم صحنه
function initScene() {
    if (!checkWebGLSupport()) return;
    
    // ایجاد صحنه
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // ایجاد دوربین
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // ایجاد رندرر
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        if (renderer.outputColorSpace !== undefined) { // برای سازگاری با نسخه‌های مختلف
            renderer.outputColorSpace = THREE.SRGBColorSpace;
        }
        container.appendChild(renderer.domElement);
    } catch (e) {
        console.error('خطا در ایجاد رندرر:', e);
        showError('خطا در ایجاد رندرر WebGL');
        return;
    }

    // افزودن نور به صحنه
    ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // نمایش کمکی برای نور جهت‌دار (برای توسعه‌دهندگان)
    // const helper = new THREE.DirectionalLightHelper(directionalLight, 1);
    // scene.add(helper);

    // ایجاد کنترل‌ها برای چرخاندن مدل
    try {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 1;
        controls.maxDistance = 10;
        controls.update();
    } catch (e) {
        console.error('خطا در ایجاد کنترل‌ها:', e);
    }

    // اضافه کردن تغییر اندازه خودکار
    window.addEventListener('resize', onWindowResize, false);
    
    // نمایش یک شکل ساده برای آزمایش صحنه
    addTestCube();
    
    // تنظیم کنترل‌های نور
    setupLightingControls();
}

// افزودن یک مکعب ساده برای آزمایش صحنه
function addTestCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x44aa88 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    // حذف مکعب پس از بارگذاری موفق مدل
    model = cube;
    console.log('مکعب آزمایشی اضافه شد - صحنه آماده است');
}

// تابع تغییر اندازه خودکار
function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// تابع انیمیشن
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    // به‌روزرسانی نور در هر فریم
    // این می‌تواند برای افکت‌های خاص مورد استفاده قرار گیرد
    // directionalLight.position.x = Math.sin(Date.now() * 0.001) * 3;
    
    renderer.render(scene, camera);
}

// تابع بارگذاری مدل
function loadModel(file) {
    if (!isWebGLSupported) {
        showError('مرورگر شما از WebGL پشتیبانی نمی‌کند');
        return;
    }

    // نمایش پیام درحال بارگذاری
    loadingElement.style.display = 'block';
    
    // حذف مدل قبلی اگر وجود داشته باشد
    if (model) {
        scene.remove(model);
        model = null;
    }

    // بررسی وجود کلاس GLTFLoader
    if (typeof THREE.GLTFLoader === 'undefined') {
        console.error('GLTFLoader بارگذاری نشده است');
        showError('خطا در بارگذاری کتابخانه GLTFLoader');
        return;
    }

    const loader = new THREE.GLTFLoader();
    
    // ایجاد URL برای فایل
    const fileURL = URL.createObjectURL(file);
    console.log('شروع بارگذاری فایل:', file.name, 'با حجم:', (file.size / 1024).toFixed(2), 'KB');
    
    try {
        loader.load(fileURL, 
            // موفقیت
            function(gltf) {
                try {
                    model = gltf.scene;
                    
                    // مرکزیابی مدل
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.x -= center.x;
                    model.position.y -= center.y;
                    model.position.z -= center.z;
                    
                    // مقیاس‌بندی مدل برای اندازه مناسب
                    const size = box.getSize(new THREE.Vector3());
                    const maxSize = Math.max(size.x, size.y, size.z);
                    if (maxSize > 0) {
                        const scale = 3 / maxSize;
                        model.scale.set(scale, scale, scale);
                    }
                    
                    // افزودن مدل به صحنه
                    scene.add(model);
                    console.log('مدل با موفقیت بارگذاری شد');
                    
                    loadingElement.style.display = 'none';
                } catch (innerError) {
                    console.error('خطا در پردازش مدل:', innerError);
                    showError('خطا در پردازش مدل');
                }
                
                // آزادسازی URL
                URL.revokeObjectURL(fileURL);
            }, 
            // پیشرفت بارگذاری
            function(xhr) {
                if (xhr.lengthComputable && xhr.total > 0) {
                    const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
                    loadingElement.textContent = `در حال بارگذاری: ${percent}%`;
                    console.log(`پیشرفت بارگذاری: ${percent}%`);
                } else {
                    loadingElement.textContent = 'در حال بارگذاری...';
                }
            }, 
            // خطا در بارگذاری
            function(error) {
                console.error('خطا در بارگذاری مدل:', error);
                showError('خطا در بارگذاری مدل');
                URL.revokeObjectURL(fileURL);
            }
        );
    } catch (e) {
        console.error('استثنا در بارگذاری مدل:', e);
        showError('خطا در بارگذاری مدل');
        URL.revokeObjectURL(fileURL);
    }
}

// تابع جدید برای بارگذاری مدل از آدرس URL
function loadModelURL(url) {
    if (!isWebGLSupported) {
        showError('مرورگر شما از WebGL پشتیبانی نمی‌کند');
        return;
    }

    loadingElement.style.display = 'block';

    if (model) {
        scene.remove(model);
        model = null;
    }

    // بررسی موجود بودن loader
    if (typeof THREE.GLTFLoader === 'undefined') {
        console.error('GLTFLoader بارگذاری نشده است');
        showError('خطا در بارگذاری کتابخانه GLTFLoader');
        return;
    }

    const loader = new THREE.GLTFLoader();
    console.log('بارگذاری مدل از:', url);

    loader.load(
        url,
        function(gltf) {
            try {
                model = gltf.scene;
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                model.position.x -= center.x;
                model.position.y -= center.y;
                model.position.z -= center.z;
                const size = box.getSize(new THREE.Vector3());
                const maxSize = Math.max(size.x, size.y, size.z);
                if (maxSize > 0) {
                    const scale = 3 / maxSize;
                    model.scale.set(scale, scale, scale);
                }
                scene.add(model);
                loadingElement.style.display = 'none';
                console.log('مدل با موفقیت از URL بارگذاری شد');
            } catch (error) {
                console.error('خطا در پردازش مدل:', error);
                showError('خطا در پردازش مدل');
                loadingElement.style.display = 'none';
            }
        },
        function(xhr) {
            if (xhr.lengthComputable && xhr.total > 0) {
                const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
                loadingElement.textContent = `در حال بارگذاری: ${percent}%`;
            } else {
                loadingElement.textContent = 'در حال بارگذاری...';
            }
        },
        function(error) {
            console.error('خطا در بارگذاری مدل از URL:', error);
            showError('خطا در بارگذاری مدل');
            loadingElement.style.display = 'none';
        }
    );
}

// نمایش خطا به کاربر
function showError(message) {
    loadingElement.textContent = message;
    loadingElement.style.color = 'red';
    setTimeout(() => {
        loadingElement.style.display = 'none';
        loadingElement.style.color = '#333';
    }, 3000);
}

// تنظیم کنترل‌های نور
function setupLightingControls() {
    // کنترل شدت نور محیطی
    document.getElementById('ambient-intensity').addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        ambientLight.intensity = value;
        document.getElementById('ambient-value').textContent = value.toFixed(2);
    });
    
    // کنترل شدت نور جهت‌دار
    document.getElementById('directional-intensity').addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        directionalLight.intensity = value;
        document.getElementById('directional-value').textContent = value.toFixed(2);
    });
    
    // کنترل موقعیت X نور
    document.getElementById('light-position-x').addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        directionalLight.position.x = value;
        document.getElementById('light-x-value').textContent = value.toFixed(1);
        // اگر helper وجود دارد، آن را بروز کن
        // if (helper) helper.update();
    });
    
    // کنترل موقعیت Y نور
    document.getElementById('light-position-y').addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        directionalLight.position.y = value;
        document.getElementById('light-y-value').textContent = value.toFixed(1);
        // if (helper) helper.update();
    });
    
    // کنترل موقعیت Z نور
    document.getElementById('light-position-z').addEventListener('input', function(e) {
        const value = parseFloat(e.target.value);
        directionalLight.position.z = value;
        document.getElementById('light-z-value').textContent = value.toFixed(1);
        // if (helper) helper.update();
    });
    
    // کنترل رنگ نور
    const colorButtons = document.querySelectorAll('.toggle-button[data-color]');
    colorButtons.forEach(button => {
        button.addEventListener('click', function() {
            // حذف کلاس active از همه دکمه‌ها
            colorButtons.forEach(btn => btn.classList.remove('active'));
            // افزودن کلاس active به دکمه کلیک شده
            this.classList.add('active');
            
            // تنظیم رنگ نور
            const color = new THREE.Color(this.dataset.color);
            ambientLight.color.copy(color);
            directionalLight.color.copy(color);
        });
    });
}

// تنظیم گوش‌دهنده رویداد برای دکمه آپلود فایل
document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        loadModel(file);
    }
});

// بررسی وضعیت آنلاین
window.addEventListener('online', function() {
    console.log('وضعیت: آنلاین');
});

window.addEventListener('offline', function() {
    console.log('وضعیت: آفلاین - ممکن است بارگذاری مدل‌های آزمایشی کار نکند');
});

// راه‌اندازی
initScene();
animate();

// پیام خوشامدگویی در کنسول
console.log('نمایشگر مدل‌های GLTF/GLB آماده است. لطفاً یک فایل انتخاب کنید.');