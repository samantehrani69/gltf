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
        camera.position.z = 5;
    }, undefined, (error) => {
        console.error('خطا در بارگذاری مدل:', error);
    });
}

// بارگذاری لیست فایل‌ها
const fileListDiv = document.getElementById('file-list');
fetch('models/files.json') // فرض بر این است که سرور لیستی از فایل‌ها را ارائه می‌دهد
    .then(response => response.json())
    .then(files => {
        files.forEach(file => {
            const p = document.createElement('p');
            p.textContent = file;
            p.addEventListener('click', () => loadModel(file));
            fileListDiv.appendChild(p);
        });
    })
    .catch(error => console.error('خطا در بارگذاری لیست فایل‌ها:', error));

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