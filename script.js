// متغیرهای اصلی - با بررسی اضافی
let scene, camera, renderer, controls, model;
let ambientLight, directionalLight; // متغیرهای نور
// بررسی وجود container قبل از استفاده
let container = document.getElementById('model-viewer');
if (!container) {
    console.error('المان model-viewer یافت نشد');
    throw new Error('المان model-viewer در HTML موجود نیست');
}

let loadingElement = document.getElementById('loading');
if (!loadingElement) {
    console.error('المان loading یافت نشد');
}

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

    // جایگزینی کد قبلی OrbitControls با تابع جدید
    setupOrbitControls();

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
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
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

// تابع تنظیم کنترل‌های نور - با بررسی اضافی برای وجود المان‌ها
function setupLightingControls() {
    console.log('شروع تنظیم کنترل‌های نور...');
    
    try {
        // بررسی وجود تمام المان‌های مورد نیاز به صورت یکجا
        const elements = {
            ambientIntensity: document.getElementById('ambient-intensity'),
            ambientValue: document.getElementById('ambient-value'),
            directionalIntensity: document.getElementById('directional-intensity'),
            directionalValue: document.getElementById('directional-value'),
            lightPositionX: document.getElementById('light-position-x'),
            lightXValue: document.getElementById('light-x-value'),
            lightPositionY: document.getElementById('light-position-y'),
            lightYValue: document.getElementById('light-y-value'),
            lightPositionZ: document.getElementById('light-position-z'),
            lightZValue: document.getElementById('light-z-value'),
            lightingPanel: document.getElementById('lighting-panel')
        };
        
        // بررسی وجود المان‌ها
        for (const [key, element] of Object.entries(elements)) {
            if (!element) {
                console.error(`المان ${key} یافت نشد`);
            }
        }
        
        // کنترل شدت نور محیطی
        if (elements.ambientIntensity) {
            elements.ambientIntensity.addEventListener('input', function(e) {
                if (!ambientLight) {
                    console.error('متغیر ambientLight تعریف نشده است');
                    return;
                }
                const value = parseFloat(e.target.value);
                ambientLight.intensity = value;
                if (elements.ambientValue) elements.ambientValue.textContent = value.toFixed(2);
            });
        }
        
        // کنترل شدت نور جهت‌دار
        if (elements.directionalIntensity) {
            elements.directionalIntensity.addEventListener('input', function(e) {
                if (!directionalLight) {
                    console.error('متغیر directionalLight تعریف نشده است');
                    return;
                }
                const value = parseFloat(e.target.value);
                directionalLight.intensity = value;
                if (elements.directionalValue) elements.directionalValue.textContent = value.toFixed(2);
            });
        }
        
        // کنترل موقعیت X نور
        if (elements.lightPositionX) {
            elements.lightPositionX.addEventListener('input', function(e) {
                if (!directionalLight) {
                    console.error('متغیر directionalLight تعریف نشده است');
                    return;
                }
                const value = parseFloat(e.target.value);
                directionalLight.position.x = value;
                if (elements.lightXValue) elements.lightXValue.textContent = value.toFixed(1);
            });
        }
        
        // کنترل موقعیت Y نور
        if (elements.lightPositionY) {
            elements.lightPositionY.addEventListener('input', function(e) {
                if (!directionalLight) {
                    console.error('متغیر directionalLight تعریف نشده است');
                    return;
                }
                const value = parseFloat(e.target.value);
                directionalLight.position.y = value;
                if (elements.lightYValue) elements.lightYValue.textContent = value.toFixed(1);
            });
        }
        
        // کنترل موقعیت Z نور
        if (elements.lightPositionZ) {
            elements.lightPositionZ.addEventListener('input', function(e) {
                if (!directionalLight) {
                    console.error('متغیر directionalLight تعریف نشده است');
                    return;
                }
                const value = parseFloat(e.target.value);
                directionalLight.position.z = value;
                if (elements.lightZValue) elements.lightZValue.textContent = value.toFixed(1);
            });
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
    const lightingPanel = document.getElementById('lighting-panel');
    if (toggleButton && lightingPanel) {
        toggleButton.addEventListener('click', function() {
            lightingPanel.style.display =
                (lightingPanel.style.display === 'none') ? 'block' : 'none';
        });
    }

    // فراخوانی برای نمایش لیست مدل‌ها
    loadModelsList();
});

// بررسی وضعیت آنلاین
window.addEventListener('online', function() {
    console.log('وضعیت: آنلاین');
});

window.addEventListener('offline', function() {
    console.log('وضعیت: آفلاین - ممکن است بارگذاری مدل‌های آزمایشی کار نکند');
});

// راه‌اندازی با بررسی document آماده
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initScene();
        animate();
    });
} else {
    initScene();
    animate();
}

// انیمیشن با بررسی وجود controls
function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

// پیام خوشامدگویی در کنسول
console.log('نمایشگر مدل‌های GLTF/GLB آماده است. از منوی کناری یک مدل انتخاب کنید.');

// رویکرد ساده‌تر برای بارگذاری لیست مدل‌ها از models folder
function loadModelsList() {
    const modelsList = document.getElementById('models-list');
    if (!modelsList) {
        console.error('المان models-list یافت نشد');
        return;
    }
    
    // نمایش پیام بارگذاری
    modelsList.innerHTML = '<div style="text-align: center; padding: 10px; color: #666;">در حال بارگذاری مدل‌ها...</div>';
    
    // روش ساده‌تر با استفاده از فایل‌های GLB ثابت در پوشه models
    const modelFiles = [
        { name: 'مثال 1.glb', file: 'example1.glb' },
        { name: 'مثال 2.glb', file: 'example2.glb' },
        { name: 'مثال 3.glb', file: 'example3.glb' }
    ];

    // کد زیر مستقیماً فایل‌های موجود در پوشه models را جستجو می‌کند
    // این روشی ساده‌تر و مطمئن‌تر است
    const findModelsInFolder = () => {
        return new Promise((resolve) => {
            // لیست فایل‌های GLB/GLTF
            const foundModels = [];
            
            // ابتدا تلاش برای بارگذاری فایل‌های شناخته شده
            const knownModels = [
                'cube.glb', 'sphere.glb', 'cylinder.glb', 'cone.glb', 'torus.glb', 
                'example.glb', 'example1.glb', 'example2.glb', 'example3.glb',
                'model.glb', 'model.gltf', 'test.glb', 'test.gltf'
            ];
            
            // بررسی تک تک فایل‌های شناخته شده
            const checkPromises = knownModels.map(filename => {
                return new Promise((fileResolve) => {
                    fetch(`models/${filename}`)
                        .then(response => {
                            if (response.ok) {
                                foundModels.push({
                                    name: filename,
                                    file: filename,
                                    url: `models/${filename}`
                                });
                            }
                            fileResolve();
                        })
                        .catch(() => fileResolve());
                });
            });
            
            // پس از بررسی همه فایل‌ها، نتیجه را برمی‌گردانیم
            Promise.all(checkPromises).then(() => resolve(foundModels));
        });
    };
    
    // اجرای جستجوی فایل‌ها
    findModelsInFolder()
        .then(foundModels => {
            if (foundModels.length > 0) {
                // پاک کردن لیست قبلی
                modelsList.innerHTML = '';
                
                // اضافه کردن مدل‌ها به لیست
                foundModels.forEach(model => {
                    const link = document.createElement('a');
                    link.className = 'model-link';
                    link.textContent = model.name;
                    
                    // اضافه کردن رویداد کلیک
                    link.addEventListener('click', function() {
                        // انتخاب این مدل در لیست
                        document.querySelectorAll('.model-link').forEach(item => {
                            item.style.fontWeight = 'normal';
                        });
                        link.style.fontWeight = 'bold';
                        
                        // نمایش پیام بارگذاری
                        document.getElementById('loading').style.display = 'block';
                        document.getElementById('loading').textContent = 'در حال بارگذاری مدل...';
                        
                        // بارگذاری مدل
                        console.log('بارگذاری مدل:', model.file);
                        loadModelURL(`models/${model.file}`);
                    });
                    
                    modelsList.appendChild(link);
                });
                
                console.log(`${foundModels.length} مدل در پوشه models یافت شد.`);
            } else {
                // هیچ فایلی یافت نشد - نمایش دکمه آپلود
                modelsList.innerHTML = `
                    <div style="text-align: center; padding: 10px; color: #666;">
                        هیچ فایل GLB یا GLTF در پوشه models یافت نشد.
                    </div>
                    <div style="text-align: center; margin-top: 15px;">
                        <button id="add-model-button" style="padding: 8px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            افزودن مدل جدید
                        </button>
                    </div>`;
                
                // اضافه کردن رویداد برای دکمه آپلود
                const uploadBtn = document.getElementById('add-model-button');
                if (uploadBtn) {
                    uploadBtn.addEventListener('click', function() {
                        // ایجاد input برای انتخاب فایل
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = '.glb,.gltf';
                        
                        fileInput.addEventListener('change', function(event) {
                            const file = event.target.files[0];
                            if (file) {
                                loadModel(file);
                            }
                        });
                        
                        // شبیه‌سازی کلیک روی input
                        fileInput.click();
                    });
                }
            }
        })
        .catch(error => {
            console.error('خطا در جستجوی فایل‌های مدل:', error);
            modelsList.innerHTML = `
                <div style="text-align: center; padding: 10px; color: #d32f2f;">
                    خطا در جستجوی فایل‌های مدل<br>
                    <small>${error.message || 'خطای ناشناخته'}</small>
                </div>
                <div style="text-align: center; margin-top: 15px;">
                    <button id="add-model-button" style="padding: 8px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        افزودن مدل جدید
                    </button>
                </div>`;
            
            // اضافه کردن رویداد برای دکمه آپلود
            const uploadBtn = document.getElementById('add-model-button');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', function() {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = '.glb,.gltf';
                    
                    fileInput.addEventListener('change', function(event) {
                        const file = event.target.files[0];
                        if (file) {
                            loadModel(file);
                        }
                    });
                    
                    fileInput.click();
                });
            }
        });
}

// بهبود تابع setupOrbitControls برای اطمینان از درست کار کردن چرخش و زوم
function setupOrbitControls() {
    if (!camera || !renderer || !renderer.domElement) {
        console.error('camera یا renderer موجود نیست');
        return;
    }
    
    try {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        
        // تنظیمات برای چرخش بهتر
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        
        // تنظیمات زوم
        controls.enableZoom = true;
        controls.zoomSpeed = 1.0;
        controls.minDistance = 0.5;
        controls.maxDistance = 10;
        
        // فعال کردن چرخش
        controls.enableRotate = true;
        controls.rotateSpeed = 1.0;
        
        // تنظیمات پن (جا به جایی)
        controls.enablePan = true;
        controls.screenSpacePanning = true;
        
        // به‌روزرسانی اولیه
        controls.update();
        
        console.log('تنظیمات چرخش و زوم فعال شد');
    } catch (error) {
        console.error('خطا در تنظیم کنترل‌های چرخش و زوم:', error);
    }
}

// انتساب تابع‌ها به window برای دسترسی از بیرون
window.loadModelsList = loadModelsList;
window.initScene = initScene;
window.animate = animate;
window.setupOrbitControls = setupOrbitControls;