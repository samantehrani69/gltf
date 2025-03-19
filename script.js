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

    // افزودن نور به صحنه - تعریف متغیرهای جهانی
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
    
    // فراخوانی جداگانه setupLightingControls
    console.log('فراخوانی تابع تنظیم کنترل‌های نور...');
    window.setTimeout(function() {
        setupLightingControls();
        console.log('پس از فراخوانی تابع تنظیم کنترل‌های نور');
    }, 1000);
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

// تابع تنظیم کنترل‌های نور - بازنویسی شده با محافظت بیشتر
function setupLightingControls() {
    console.log('شروع تنظیم کنترل‌های نور...');
    
    try {
        // کنترل شدت نور محیطی
        const ambientIntensity = document.getElementById('ambient-intensity');
        if (ambientIntensity) {
            console.log('المان ambient-intensity یافت شد');
            ambientIntensity.addEventListener('input', function(e) {
                if (!ambientLight) {
                    console.error('متغیر ambientLight تعریف نشده است');
                    return;
                }
                const value = parseFloat(e.target.value);
                ambientLight.intensity = value;
                const ambientValue = document.getElementById('ambient-value');
                if (ambientValue) ambientValue.textContent = value.toFixed(2);
            });
        } else {
            console.error('المان ambient-intensity یافت نشد');
        }
        
        // کنترل شدت نور جهت‌دار
        const directionalIntensity = document.getElementById('directional-intensity');
        if (directionalIntensity) {
            console.log('المان directional-intensity یافت شد');
            directionalIntensity.addEventListener('input', function(e) {
                if (!directionalLight) {
                    console.error('متغیر directionalLight تعریف نشده است');
                    return;
                }
                const value = parseFloat(e.target.value);
                directionalLight.intensity = value;
                const directionalValue = document.getElementById('directional-value');
                if (directionalValue) directionalValue.textContent = value.toFixed(2);
            });
        } else {
            console.error('المان directional-intensity یافت نشد');
        }
        
        // کنترل موقعیت X نور
        const lightPositionX = document.getElementById('light-position-x');
        if (lightPositionX) {
            console.log('المان light-position-x یافت شد');
            lightPositionX.addEventListener('input', function(e) {
                if (!directionalLight) {
                    console.error('متغیر directionalLight تعریف نشده است');
                    return;
                }
                const value = parseFloat(e.target.value);
                directionalLight.position.x = value;
                const lightXValue = document.getElementById('light-x-value');
                if (lightXValue) lightXValue.textContent = value.toFixed(1);
            });
        } else {
            console.error('المان light-position-x یافت نشد');
        }
        
        // کنترل موقعیت Y نور
        const lightPositionY = document.getElementById('light-position-y');
        if (lightPositionY) {
            console.log('المان light-position-y یافت شد');
            lightPositionY.addEventListener('input', function(e) {
                if (!directionalLight) {
                    console.error('متغیر directionalLight تعریف نشده است');
                    return;
                }
                const value = parseFloat(e.target.value);
                directionalLight.position.y = value;
                const lightYValue = document.getElementById('light-y-value');
                if (lightYValue) lightYValue.textContent = value.toFixed(1);
            });
        } else {
            console.error('المان light-position-y یافت نشد');
        }
        
        // کنترل موقعیت Z نور
        const lightPositionZ = document.getElementById('light-position-z');
        if (lightPositionZ) {
            console.log('المان light-position-z یافت شد');
            lightPositionZ.addEventListener('input', function(e) {
                if (!directionalLight) {
                    console.error('متغیر directionalLight تعریف نشده است');
                    return;
                }
                const value = parseFloat(e.target.value);
                directionalLight.position.z = value;
                const lightZValue = document.getElementById('light-z-value');
                if (lightZValue) lightZValue.textContent = value.toFixed(1);
            });
        } else {
            console.error('المان light-position-z یافت نشد');
        }
        
        // کنترل رنگ نور
        const colorButtons = document.querySelectorAll('.toggle-button[data-color]');
        if (colorButtons.length > 0) {
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
        } else {
            console.error('المان‌های toggle-button[data-color] یافت نشد');
        }
        
        // نمایش پنل نور پس از تنظیم کنترل‌ها
        const lightingPanel = document.getElementById('lighting-panel');
        if (lightingPanel) {
            console.log('المان lighting-panel یافت شد');
            // پنل را مخفی نگه می‌داریم تا با دکمه نمایش داده شود
            lightingPanel.style.display = 'none';
        } else {
            console.error('المان lighting-panel یافت نشد');
        }
        
        console.log('تنظیم کنترل‌های نور با موفقیت انجام شد');
    } catch (error) {
        console.error('خطا در تنظیم کنترل‌های نور:', error);
    }
}

// تنظیم گوش‌دهنده برای نمایش یا مخفی کردن پنل نور در زمان‌های خاص
window.addEventListener('load', function() {
    console.log('صفحه کاملاً بارگذاری شد');
    
    // حذف دستور مربوط به file-input
    /* 
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                loadModel(file);
            }
        });
    }
    */
    
    // نمایش پنل نور با کلیک روی دکمه
    const toggleButton = document.getElementById('toggle-lighting-panel');
    if (toggleButton) {
        console.log('دکمه toggle-lighting-panel یافت شد');
    } else {
        console.error('دکمه toggle-lighting-panel یافت نشد');
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

// جایگزینی پیام خوشامدگویی
console.log('نمایشگر مدل‌های GLTF/GLB آماده است. از منوی کناری یک مدل انتخاب کنید.');