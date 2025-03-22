// تنظیمات اولیه Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee); // تغییر رنگ پس‌زمینه به خاکستری روشن

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 5); // تنظیم موقعیت اولیه دوربین

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(document.getElementById('scene').clientWidth, document.getElementById('scene').clientHeight);
document.getElementById('scene').appendChild(renderer.domElement);

// تنظیم رندرر برای کیفیت بهتر
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5; // افزایش میزان نوردهی

// اضافه کردن یک grid helper برای راهنمایی بهتر
const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
scene.add(gridHelper);

// تعریف متغیرهای نور
let currentLight;
let ambientLight;
let hemisphereLight;

// نمایشگر وضعیت بارگذاری
const loadingIndicator = document.getElementById('loading-indicator');
function showLoading() {
    loadingIndicator.style.display = 'block';
}
function hideLoading() {
    loadingIndicator.style.display = 'none';
}

// تنظیم نورهای پایه
function setupLights() {
    // حذف نورهای قبلی
    if (currentLight) scene.remove(currentLight);
    if (ambientLight) scene.remove(ambientLight);
    if (hemisphereLight) scene.remove(hemisphereLight);
    
    // تنظیم نور محیطی قوی‌تر برای همه حالت‌ها
    ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // افزایش شدت نور محیطی
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

// بهبود عملکرد لودر GLB - غیرفعال کردن Draco Loader برای جلوگیری از خطا
function enhanceGLTFLoader() {
    console.log('تنظیم GLTFLoader بدون Draco Loader');
    // Draco Loader را غیرفعال می‌کنیم چون باعث خطا می‌شود
    // و برای فایل‌های استاندارد نیازی به آن نیست
}

// تلاش برای بهبود لودر
try {
    enhanceGLTFLoader();
} catch (e) {
    console.log('Draco loader not available:', e);
}

// تابع بارگذاری مدل با پشتیبانی بهتر برای GLB - با مدیریت خطای بهبود یافته
function loadModel(file) {
    if (currentModel) {
        scene.remove(currentModel);
        currentModel = null;
    }
    
    // نمایش وضعیت بارگذاری
    showLoading();
    console.log(`در حال بارگذاری مدل: ${file}`);
    
    // استفاده از URL نسبی صحیح با کمک window.location برای اطمینان از کار با دامنه صحیح
    const modelPath = new URL(`models/${file}`, window.location.href).href;
    
    console.log(`تلاش برای بارگذاری مدل از مسیر: ${modelPath}`);
    
    // بررسی وجود فایل قبل از بارگذاری
    fetch(modelPath, { method: 'HEAD' })
        .then(response => {
            if (!response.ok) {
                console.error(`خطا: فایل ${modelPath} یافت نشد (${response.status})`);
                alert(`خطا: فایل مدل "${file}" در مسیر ${modelPath} یافت نشد.\n\nلطفاً از وجود این فایل در پوشه models اطمینان حاصل کنید.`);
                hideLoading();
                return;
            }
            
            console.log(`فایل ${modelPath} یافت شد. در حال بارگذاری...`);
            
            // بررسی اندازه فایل
            return fetch(modelPath)
                .then(response => {
                    // نمایش اطلاعات فایل
                    const fileSize = response.headers.get('content-length');
                    console.log(`اندازه فایل ${file}: ${fileSize} بایت`);
                    
                    if (fileSize === null || parseInt(fileSize) < 100) {
                        throw new Error(`فایل ${file} خالی یا بسیار کوچک است (${fileSize} بایت)`);
                    }
                    
                    // بارگذاری مدل
                    const loader = new THREE.GLTFLoader();
                    
                    // تلاش بارگذاری مدل با مسیر نسبی 
                    loader.load(modelPath, 
                        // موفقیت
                        (gltf) => {
                            console.log(`مدل ${file} با موفقیت بارگذاری شد.`, gltf);
                            currentModel = gltf.scene;
                            
                            // اطمینان از بارگذاری مدل
                            console.log("اطلاعات مدل بارگذاری شده:", currentModel);
                            
                            // بررسی تعداد فرزندان مدل
                            console.log("تعداد فرزندان مدل:", currentModel.children.length);
                            console.log("فرزندان مدل:", currentModel.children);
                            
                            // مقیاس‌بندی مدل برای نمایش بهتر
                            const box = new THREE.Box3().setFromObject(currentModel);
                            const size = box.getSize(new THREE.Vector3());
                            console.log("اندازه اصلی مدل:", size);
                            
                            // انتقال مدل به مرکز صحنه
                            const center = box.getCenter(new THREE.Vector3());
                            currentModel.position.x = -center.x;
                            currentModel.position.y = -center.y;
                            currentModel.position.z = -center.z;
                            
                            // افزودن مدل به صحنه
                            scene.add(currentModel);
                            console.log("مدل به صحنه اضافه شد");
                            
                            // نمایش مش‌ها روی مدل برای تشخیص بهتر
                            currentModel.traverse(function(node) {
                                if (node.isMesh) {
                                    console.log("یافتن مش:", node.name);
                                    // اضافه کردن یک wireframe برای نمایش بهتر
                                    const wireframe = new THREE.WireframeGeometry(node.geometry);
                                    const line = new THREE.LineSegments(wireframe);
                                    line.material.color.setHex(0x000000);
                                    line.material.opacity = 0.25;
                                    line.material.transparent = true;
                                    node.add(line);
                                    
                                    // اطمینان از نمایش صحیح مواد
                                    if (node.material) {
                                        if (Array.isArray(node.material)) {
                                            node.material.forEach(mat => {
                                                mat.side = THREE.DoubleSide; // نمایش هر دو طرف
                                                mat.needsUpdate = true;
                                            });
                                        } else {
                                            node.material.side = THREE.DoubleSide;
                                            node.material.needsUpdate = true;
                                        }
                                    }
                                }
                            });
                            
                            // تنظیم دوربین برای نمایش کامل مدل
                            fitCameraToModel(currentModel);
                            
                            hideLoading();
                        }, 
                        // پیشرفت
                        (xhr) => {
                            const loadingPercentage = xhr.lengthComputable ? 
                                Math.round((xhr.loaded / xhr.total) * 100) : 
                                Math.round(xhr.loaded / 1024) + 'KB';
                            
                            console.log(`بارگذاری ${file}: ${loadingPercentage}`);
                            loadingIndicator.textContent = `در حال بارگذاری مدل: ${loadingPercentage}%`;
                        },
                        // خطا
                        (error) => {
                            console.error('خطا در بارگذاری مدل:', error);
                            loadFallbackModel(file, error);
                        }
                    );
                });
        })
        .catch(error => {
            console.error('خطا در بررسی وجود فایل:', error);
            alert(`خطا در دسترسی به فایل ${file}: ${error.message}`);
            hideLoading();
        });
}

// تابع بارگذاری مدل جایگزین در صورت خطا
function loadFallbackModel(originalFile, originalError) {
    console.log(`تلاش برای بارگذاری مدل جایگزین به جای ${originalFile}`);
    
    // می‌توانیم یک مدل پیش‌فرض را بارگذاری کنیم
    const fallbackFile = 'fallback-cube.glb'; // یک مدل ساده مکعب
    const fallbackPath = `models/${fallbackFile}`;
    
    alert(`خطا در بارگذاری مدل ${originalFile}: ${originalError.message}\n\nاین ممکن است به دلیل خراب بودن فایل یا ناسازگاری آن با نمایشگر باشد.`);
    
    // ایجاد یک جعبه ساده به عنوان جایگزین
    const geometry = new THREE.BoxGeometry(5, 5, 5);
    const material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    const cube = new THREE.Mesh(geometry, material);
    
    currentModel = cube;
    scene.add(cube);
    
    // نمایش متن خطا روی مکعب
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'bold 24px Arial';
    context.fillStyle = '#ff0000';
    context.textAlign = 'center';
    context.fillText('خطا در بارگذاری مدل', canvas.width/2, canvas.height/2 - 20);
    context.font = '18px Arial';
    context.fillText(originalFile, canvas.width/2, canvas.height/2 + 10);
    
    const texture = new THREE.CanvasTexture(canvas);
    const errorMaterial = new THREE.MeshBasicMaterial({ map: texture });
    
    // اضافه کردن صفحه متن خطا
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        errorMaterial
    );
    plane.position.z = 2.51;
    cube.add(plane);
    
    hideLoading();
}

// تابع جدید برای بارگذاری مدل از مسیر
function loadModelFromPath(modelPath, isGLB) {
    console.log(`بارگذاری مدل از مسیر: ${modelPath}`);
    
    loader.load(modelPath, 
        // موفقیت
        (gltf) => {
            currentModel = gltf.scene;
            optimizeModel(currentModel, isGLB);
            scene.add(currentModel);
            fitCameraToModel(currentModel);
            hideLoading();
        }, 
        // پیشرفت
        (xhr) => {
            const loadingPercentage = xhr.lengthComputable ? 
                Math.round((xhr.loaded / xhr.total) * 100) : 
                Math.round(xhr.loaded / 1024) + 'KB';
            
            console.log(`بارگذاری: ${loadingPercentage}`);
            loadingIndicator.textContent = `در حال بارگذاری مدل: ${loadingPercentage}%`;
        },
        // خطا
        (error) => {
            console.error('خطا در بارگذاری مدل:', error);
            alert(`خطا در بارگذاری مدل: ${error.message}\n\nلطفاً از وجود فایل در مسیر درست اطمینان حاصل کنید.`);
            hideLoading();
        }
    );
}

// بهینه‌سازی مدل با توجه به نوع فایل
function optimizeModel(model, isGLB) {
    // تنظیمات مخصوص برای فایل‌های GLB
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    
    // اگر اندازه مدل بسیار بزرگ یا بسیار کوچک است، آن را مقیاس‌بندی می‌کنیم
    const maxDimension = Math.max(size.x, size.y, size.z);
    if (maxDimension > 100 || maxDimension < 0.1) {
        const scale = 10 / maxDimension;
        model.scale.set(scale, scale, scale);
    }
    
    // فعال کردن سایه‌ها و بهبود مواد برای همه مدل‌ها
    model.traverse(function(node) {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            
            // بهبود مواد برای نمایش بهتر
            if (node.material) {
                if (Array.isArray(node.material)) {
                    node.material.forEach(mat => {
                        enhanceMaterial(mat);
                    });
                } else {
                    enhanceMaterial(node.material);
                }
            }
        }
    });
}

// بهبود مواد برای نمایش بهتر
function enhanceMaterial(material) {
    if (!material) return;
    
    // تنظیم کیفیت مواد برای نمایش بهتر
    material.roughness = Math.min(material.roughness || 0.7, 0.7);
    material.metalness = Math.max(material.metalness || 0.3, 0.3);
    
    // فعال‌سازی نقشه‌های نرمال اگر موجود باشند
    if (material.normalMap) {
        material.normalScale.set(1, 1);
    }
    
    // تضمین کد رنگ صحیح
    if (material.map) {
        material.map.encoding = THREE.sRGBEncoding;
    }
    
    // بهبود بازتاب نور
    material.envMapIntensity = 1.0;
}

// تابع بارگذاری مدل از فایل آپلود شده - بهبود یافته برای GLB
function loadUploadedModel(file) {
    if (currentModel) {
        scene.remove(currentModel);
    }
    
    showLoading();
    loadingIndicator.textContent = "در حال آماده‌سازی فایل...";
    
    const isGLB = file.name.toLowerCase().endsWith('.glb');
    console.log(`بارگذاری فایل آپلود شده: ${file.name}, اندازه: ${(file.size / 1024 / 1024).toFixed(2)}MB, نوع: ${isGLB ? 'GLB' : 'GLTF'}`);
    
    // برای فایل‌های GLB از تکنیک جدید استفاده می‌کنیم
    if (isGLB) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            
            // تبدیل ArrayBuffer به Blob URL برای سازگاری بیشتر
            const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
            const blobURL = URL.createObjectURL(blob);
            
            loadingIndicator.textContent = "در حال بارگذاری مدل...";
            
            // استفاده از URL برای بارگذاری مدل
            loader.load(blobURL, 
                // موفقیت
                (gltf) => {
                    currentModel = gltf.scene;
                    optimizeModel(currentModel, true);
                    scene.add(currentModel);
                    fitCameraToModel(currentModel);
                    addUploadedFileToList(file.name);
                    hideLoading();
                    
                    // آزاد کردن حافظه
                    URL.revokeObjectURL(blobURL);
                },
                // پیشرفت
                (xhr) => {
                    if (xhr.lengthComputable) {
                        const loadingPercentage = Math.round((xhr.loaded / xhr.total) * 100);
                        loadingIndicator.textContent = `در حال بارگذاری مدل: ${loadingPercentage}%`;
                    }
                },
                // خطا
                (error) => {
                    console.error('خطا در بارگذاری مدل GLB:', error);
                    alert(`خطا در بارگذاری فایل GLB: ${error.message}\nاطمینان حاصل کنید که فایل GLB معتبر است.`);
                    hideLoading();
                    URL.revokeObjectURL(blobURL);
                }
            );
        };
        
        reader.onerror = function() {
            alert('خطا در خواندن فایل. لطفاً دوباره تلاش کنید.');
            hideLoading();
        };
        
        // خواندن فایل به عنوان ArrayBuffer
        reader.readAsArrayBuffer(file);
    } else {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const fileURL = event.target.result;
            
            loader.load(fileURL, 
                (gltf) => {
                    currentModel = gltf.scene;
                    optimizeModel(currentModel, false);
                    scene.add(currentModel);
                    fitCameraToModel(currentModel);
                    addUploadedFileToList(file.name);
                    hideLoading();
                },
                (xhr) => {
                    const loadingPercentage = Math.round((xhr.loaded / xhr.total) * 100);
                    loadingIndicator.textContent = `در حال بارگذاری مدل: ${loadingPercentage}%`;
                },
                (error) => {
                    console.error('خطا در بارگذاری مدل GLTF:', error);
                    alert('خطا در بارگذاری مدل: ' + error.message);
                    hideLoading();
                }
            );
        };
        
        reader.readAsDataURL(file);
    }
}

// بهبود تابع تنظیم دوربین برای نمایش بهتر مدل‌ها
function fitCameraToModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    console.log("اندازه مدل:", size);
    console.log("مرکز مدل:", center);
    
    // تنظیم فاصله دوربین باتوجه به اندازه مدل
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // اگر اندازه مدل صفر یا خیلی کوچک است
    if (maxDim < 0.01) {
        console.warn("مدل خیلی کوچک است! تنظیم مقیاس.");
        model.scale.set(10, 10, 10); // افزایش مقیاس
        fitCameraToModel(model); // فراخوانی دوباره با مقیاس جدید
        return;
    }
    
    // تنظیم فاصله دوربین بر اساس اندازه
    const fov = camera.fov * (Math.PI / 180);
    let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5; // ضریب 1.5 برای فاصله بیشتر
    
    // حداقل و حداکثر فاصله
    cameraDistance = Math.max(2, Math.min(cameraDistance, 100));
    
    console.log("فاصله محاسبه شده دوربین:", cameraDistance);
    
    // تنظیم موقعیت دوربین
    camera.position.set(
        cameraDistance * 0.8, 
        cameraDistance * 0.6, 
        cameraDistance * 0.8
    );
    camera.lookAt(0, 0, 0);
    
    console.log("موقعیت جدید دوربین:", camera.position);
    
    // تنظیم کنترل‌ها
    controls.target.set(0, 0, 0);
    controls.update();
    
    // اضافه کردن یک نور نقطه‌ای در موقعیت دوربین برای روشنایی بهتر
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.copy(camera.position);
    scene.add(pointLight);
    
    // اضافه کردن helper برای نمایش موقعیت نور
    const lightHelper = new THREE.PointLightHelper(pointLight, 0.5);
    scene.add(lightHelper);
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
const fileListLoading = document.getElementById('file-list-loading');

// حذف پیام "درحال بارگذاری..." در صورت وجود
if (fileListLoading) {
    fileListLoading.remove();
}

// اصلاح تابع loadFileList برای استفاده از مسیر نسبی صحیح
function loadFileList() {
    console.log('تنظیم مستقیم لیست فایل‌ها...');
    
    // حذف پیام "درحال بارگذاری..."
    const loadingTemp = document.getElementById('file-list-loading-temp');
    if (loadingTemp) loadingTemp.remove();
    
    // پاک کردن لیست قبلی
    fileListDiv.innerHTML = '';
    
    // اضافه کردن راهنما در بالای لیست
    const helpDiv = document.createElement('div');
    helpDiv.style.padding = '8px';
    helpDiv.style.marginBottom = '10px';
    helpDiv.style.backgroundColor = '#e6f7ff';
    helpDiv.style.border = '1px solid #91d5ff';
    helpDiv.style.borderRadius = '4px';
    helpDiv.innerHTML = `
        <p style="margin-top: 0;"><strong>راهنما:</strong> فایل‌های زیر باید در پوشه models قرار داشته باشند:</p>
    `;
    fileListDiv.appendChild(helpDiv);
    
    // سعی در خواندن فایل‌ها از files.json - اگر وجود داشت
    fetch('models/files.json')
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                // اگر فایل files.json وجود نداشت، از آرایه پیش‌فرض استفاده می‌کنیم
                return ["model1.gltf", "model2.glb", "sample.gltf", "cube.glb"];
            }
        })
        .then(files => {
            console.log(`${files.length} فایل تنظیم شد:`, files);
            
            // نمایش فایل‌ها در لیست
            files.forEach(file => {
                const p = document.createElement('p');
                p.textContent = file;
                p.style.cursor = 'pointer';
                
                // استفاده از مسیر نسبی برای بررسی وجود فایل
                // استفاده از window.location.origin برای اطمینان از کار با دامنه صحیح
                const modelUrl = new URL(`models/${file}`, window.location.href).href;
                
                console.log(`بررسی وجود فایل: ${modelUrl}`);
                
                fetch(modelUrl, { method: 'HEAD' })
                    .then(response => {
                        if (response.ok) {
                            p.style.color = 'green';
                            p.innerHTML = `✓ ${file} <span style="font-size: 0.8em">(موجود)</span>`;
                            p.addEventListener('click', () => {
                                // حذف استایل انتخاب از همه موارد
                                document.querySelectorAll('#file-list p').forEach(item => {
                                    item.style.backgroundColor = '';
                                    item.style.fontWeight = '';
                                });
                                
                                // نمایش استایل انتخاب روی مورد فعلی
                                p.style.backgroundColor = '#e6f7ff';
                                p.style.fontWeight = 'bold';
                                
                                loadModel(file);
                            });
                        } else {
                            p.style.color = 'red';
                            p.innerHTML = `✗ ${file} <span style="font-size: 0.8em">(موجود نیست)</span>`;
                        }
                    })
                    .catch(error => {
                        p.style.color = 'red';
                        p.innerHTML = `✗ ${file} <span style="font-size: 0.8em">(خطا در بررسی)</span>`;
                        console.error(`خطا در بررسی فایل ${file}:`, error);
                    });
                
                fileListDiv.appendChild(p);
            });
            
            // اضافه کردن دکمه برای نمایش مدل پیش‌فرض
            const defaultModelBtn = document.createElement('button');
            defaultModelBtn.textContent = 'نمایش مدل پیش‌فرض';
            defaultModelBtn.style.marginTop = '15px';
            defaultModelBtn.style.padding = '8px 12px';
            defaultModelBtn.style.backgroundColor = '#1890ff';
            defaultModelBtn.style.color = 'white';
            defaultModelBtn.style.border = 'none';
            defaultModelBtn.style.borderRadius = '4px';
            defaultModelBtn.style.cursor = 'pointer';
            defaultModelBtn.style.width = '100%';
            
            defaultModelBtn.addEventListener('click', () => {
                createDefaultCube();
            });
            
            fileListDiv.appendChild(defaultModelBtn);
        })
        .catch(error => {
            console.error('خطا در بارگذاری لیست فایل‌ها:', error);
            showNoFilesMessage();
        });
}

// نمایش پیام "فایلی یافت نشد"
function showNoFilesMessage() {
    const noFilesItem = document.createElement('p');
    noFilesItem.textContent = 'هیچ فایلی در لیست یافت نشد.';
    noFilesItem.style.fontStyle = 'italic';
    fileListDiv.appendChild(noFilesItem);
    
    const helpItem = document.createElement('p');
    helpItem.textContent = 'فایل‌های خود را با دکمه بالا آپلود کنید یا فایل models/files.json را ویرایش نمایید.';
    fileListDiv.appendChild(helpItem);
}

// بررسی وجود پوشه models و اطلاع‌رسانی به کاربر
function checkModelsFolder() {
    fetch('models/')
        .then(response => {
            if (!response.ok) {
                showModelsFolderError();
            } else {
                console.log('پوشه models یافت شد.');
            }
        })
        .catch(err => {
            showModelsFolderError();
            console.warn('خطا در بررسی وجود پوشه models:', err);
        });
}

function showModelsFolderError() {
    const errorDiv = document.createElement('div');
    errorDiv.style.padding = '10px';
    errorDiv.style.marginBottom = '10px';
    errorDiv.style.backgroundColor = '#ffeeee';
    errorDiv.style.border = '1px solid #ffaaaa';
    errorDiv.style.borderRadius = '5px';
    errorDiv.innerHTML = `
        <p style="color:red"><strong>خطا:</strong> پوشه <code>models</code> یافت نشد.</p>
        <p>برای استفاده از این برنامه، لطفاً یک پوشه به نام <code>models</code> ایجاد کنید و فایل‌های مدل سه‌بعدی خود را در آن قرار دهید.</p>
    `;
    fileListDiv.insertBefore(errorDiv, fileListDiv.firstChild);
}

// اضافه کردن تابع برای نمایش یک مکعب پیش‌فرض
function createDefaultCube() {
    if (currentModel) {
        scene.remove(currentModel);
    }
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x3080ee,
        metalness: 0.3,
        roughness: 0.4
    });
    currentModel = new THREE.Mesh(geometry, material);
    
    scene.add(currentModel);
    console.log("مکعب پیش‌فرض ایجاد شد");
    
    // تنظیم دوربین
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
}

// فراخوانی تابع بارگذاری لیست فایل‌ها
loadFileList();

// حذف بررسی وجود پوشه models از DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {
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
    
    // بارگذاری لیست فایل‌ها
    loadFileList();
    
    // ایجاد یک مکعب پیش‌فرض برای اطمینان از کارکرد صحنه
    setTimeout(createDefaultCube, 500);
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
    const sceneElement = document.getElementById('scene');
    const width = sceneElement.clientWidth;
    const height = sceneElement.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});