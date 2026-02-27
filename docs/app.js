let currentMode = 0;
let isUserInteracting = false;
let currentH = 90;
let currentV = 0;
let currentServoH = 90;
let currentServoV = 0;

// --- Three.js Global Variables ---
let scene, camera, renderer, panelPivot, sunLight, sunMesh;

// --- Celestial Position Calculation (using SunCalc) ---
function getSunData() {
    const pos = SunCalc.getPosition(new Date(), CONFIG.location.lat, CONFIG.location.lon);
    return {
        azimuthRad: pos.azimuth,
        elevation: pos.altitude * 180 / Math.PI
    };
}

function getMoonData() {
    const pos = SunCalc.getMoonPosition(new Date(), CONFIG.location.lat, CONFIG.location.lon);
    return {
        azimuthRad: pos.azimuth,
        elevation: pos.altitude * 180 / Math.PI
    };
}

// --- Clock Logic ---
function updateClock() {
    const now = new Date();
    const options = { timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const dateOptions = { timeZone: 'Asia/Singapore', weekday: 'short', day: '2-digit', month: 'short' };

    try {
        const timeEl = document.getElementById('current-time');
        if (timeEl) {
            timeEl.querySelector('.time').textContent = now.toLocaleTimeString('en-GB', options);
            timeEl.querySelector('.date').textContent = now.toLocaleDateString('en-GB', dateOptions);
        }
    } catch (e) { }
}
setInterval(updateClock, 1000);
updateClock();

// --- Three.js Initialization ---
function initThreeJS() {
    const container = document.getElementById('three-viz-container');
    if (!container) return;

    scene = new THREE.Scene();

    // Camera Setup - Lower FOV (40) and moved back (Z=22) to ensure the sun arc isn't blocked at the edges
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
    camera.position.set(0, 10, 22); // Lifted higher to see the peak of the arc
    camera.lookAt(0, 4, 0);       // Look at the center of the arc

    // Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 1. Earth (Ground Dome with procedural texture)
    const earthGeo = new THREE.SphereGeometry(10, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);

    // Create Earth Map
    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = 512;
    earthCanvas.height = 256;
    const eCtx = earthCanvas.getContext('2d');

    // Ocean
    eCtx.fillStyle = '#1e40af';
    eCtx.fillRect(0, 0, 512, 256);

    // Procedural Landmasses (random blobs for simplicity but distinct)
    eCtx.fillStyle = '#10b981';
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 256;
        const rClose = 10 + Math.random() * 30;
        eCtx.beginPath();
        eCtx.arc(x, y, rClose, 0, Math.PI * 2);
        eCtx.fill();
    }

    // Add some brown/mountain detail
    eCtx.fillStyle = '#84cc16';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 256;
        const rClose = 5 + Math.random() * 15;
        eCtx.beginPath();
        eCtx.arc(x, y, rClose, 0, Math.PI * 2);
        eCtx.fill();
    }

    const earthTex = new THREE.CanvasTexture(earthCanvas);
    const earthMat = new THREE.MeshPhongMaterial({
        map: earthTex,
        shininess: 10,
        bumpScale: 0.1
    });

    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.y = -10.1;
    earth.rotation.y = Math.PI / 4; // Rotate slightly to show land
    scene.add(earth);

    // 2. Vertical Support Pole
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 3, 16);
    const poleMat = new THREE.MeshPhongMaterial({ color: 0x64748b });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.4;
    scene.add(pole);

    // 3. Solar Panel Group (Pivot)
    panelPivot = new THREE.Group();
    panelPivot.position.y = 2.9; // Sit on top of pole
    scene.add(panelPivot);

    const panelGeo = new THREE.BoxGeometry(5, 0.1, 3);
    const panelMat = new THREE.MeshPhongMaterial({ color: 0x1e40af });
    const panel = new THREE.Mesh(panelGeo, panelMat);

    // Grid overlay for the panel
    const wireGeo = new THREE.EdgesGeometry(panelGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    const wire = new THREE.LineSegments(wireGeo, wireMat);
    panel.add(wire);

    panelPivot.add(panel);

    // 4. Visual Sun Model (Sprite mimicking the precise 2D SVG)
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 128;
    sunCanvas.height = 128;
    const sunCtx = sunCanvas.getContext('2d');

    // Outer dark orange stroke
    sunCtx.beginPath();
    sunCtx.arc(64, 64, 60, 0, Math.PI * 2);
    sunCtx.strokeStyle = 'rgba(251, 146, 60, 0.8)';
    sunCtx.lineWidth = 6;
    sunCtx.stroke();

    // Inner glowing fill (yellow to orange)
    const sunGrad = sunCtx.createRadialGradient(64, 64, 10, 64, 64, 56);
    sunGrad.addColorStop(0, '#fef08a');
    sunGrad.addColorStop(0.5, '#facc15');
    sunGrad.addColorStop(1, '#f59e0b');
    sunCtx.beginPath();
    sunCtx.arc(64, 64, 56, 0, Math.PI * 2);
    sunCtx.fillStyle = sunGrad;
    sunCtx.fill();

    const sunTex = new THREE.CanvasTexture(sunCanvas);

    // Create Moon Texture
    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = 128;
    moonCanvas.height = 128;
    const moonCtx = moonCanvas.getContext('2d');
    moonCtx.beginPath();
    moonCtx.arc(64, 64, 50, 0, Math.PI * 2);
    moonCtx.fillStyle = '#e2e8f0';
    moonCtx.fill();
    moonCtx.globalCompositeOperation = 'destination-out';
    moonCtx.beginPath();
    moonCtx.arc(84, 44, 50, 0, Math.PI * 2);
    moonCtx.fill();
    moonCtx.globalCompositeOperation = 'source-over';
    const moonTex = new THREE.CanvasTexture(moonCanvas);

    // Store textures for swapping
    window.sunTexture = sunTex;
    window.moonTexture = moonTex;

    const sunMatSprite = new THREE.SpriteMaterial({ map: sunTex, color: 0xffffff, depthTest: false });
    sunMesh = new THREE.Sprite(sunMatSprite);
    sunMesh.scale.set(4, 4, 1);
    sunMesh.renderOrder = 999; // Ensure it renders on top
    scene.add(sunMesh);

    // Weather Icon Sprite (follows the sun)
    const weatherCanvas = document.createElement('canvas');
    weatherCanvas.width = 128;
    weatherCanvas.height = 128;
    const weatherTex = new THREE.CanvasTexture(weatherCanvas);
    const weatherMat = new THREE.SpriteMaterial({ map: weatherTex, transparent: true, depthTest: false });
    weatherMesh = new THREE.Sprite(weatherMat);
    weatherMesh.scale.set(6, 6, 1); // Large enough to see the emoji
    weatherMesh.renderOrder = 1000;
    scene.add(weatherMesh);
    window.weatherCanvas = weatherCanvas;
    window.weatherTex = weatherTex;

    // 5. Sun Path (The Arc) - Matching the exact reference
    const curve = new THREE.EllipseCurve(0, -1, 12, 11, 0, Math.PI, false, 0);
    const points = curve.getPoints(50);
    const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
    const arcMat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.5, gapSize: 0.5, transparent: true, opacity: 0.2 });
    const orbitLine = new THREE.Line(arcGeo, arcMat);
    orbitLine.computeLineDistances();
    scene.add(orbitLine);

    // 6. Cardinal Labels (EAST/WEST) - Fallback if overlay fails, but we'll use CSS overlay now
    // Removing 3D Sprite Labels in favor of the cleaner HTML overlay from the reference code.

    // 7. Dynamic Point Light (Direct Sun Source)
    sunLight = new THREE.PointLight(0xffffff, 2, 100);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    animateThreeJS();

    window.addEventListener('resize', onWindowResize);
}

function animateThreeJS() {
    requestAnimationFrame(animateThreeJS);
    if (renderer && scene && camera) {
        // In the user's reference code, they don't use real timezone azimuth, 
        // they map TargetH directly to the visible arc for simplicity in the UI. 
        // We will adapt that logic here so the sun doesn't disappear off-screen.

        // Get the current target values (from Firebase or UI memory)
        const currentTargetH = parseFloat(document.getElementById('target-h').innerText) || 0;

        // Map Target H to the Sun Path curve (from East to West)
        // In the reference: sunRad = (targetH + 90) * (Math.PI / 180);
        // We assume tracking ranges from East (approx 90 deg) to West (approx 270 deg)
        // The curve is: center(0,-1), xRadius=12, yRadius=11

        // Determine if it's Night or Day based on actual solar position
        const sunData = getSunData();
        const isNight = sunData.elevation < 0;

        // Map Azimuth to the Celestial Path (East to West)
        // SunCalc Azimuth: 0 South, PI/2 West, -PI/2 East
        // UI Arc mapping: rad = -azimuth + PI/2
        //   East (-PI/2) -> PI (Left side of arc)
        //   South (0) -> PI/2 (Center of arc)
        //   West (PI/2) -> 0 (Right side of arc)

        let celestialRad;

        if (isNight) {
            const nowTime = new Date();
            const now = nowTime.getTime();

            // Search for the latest rise before 'now' and the earliest set after 'now'
            let rise = null;
            let set = null;

            for (let d = -1; d <= 1; d++) {
                const day = new Date(now + d * 24 * 3600 * 1000);
                const t = SunCalc.getMoonTimes(day, CONFIG.location.lat, CONFIG.location.lon);

                if (t.rise) {
                    const rTime = t.rise.getTime();
                    if (rTime <= now && (!rise || rTime > rise)) rise = rTime;
                }
                if (t.set) {
                    const sTime = t.set.getTime();
                    if (sTime >= now && (!set || sTime < set)) set = sTime;
                }
            }

            if (rise && set && now >= rise && now <= set) {
                const progress = (now - rise) / (set - rise);
                // Map Progress: 0 (Rise) -> East (PI), 1 (Set) -> West (0)
                celestialRad = Math.PI - (progress * Math.PI);
            } else {
                // Fallback to Azimuth if no containing rise-set range found
                const moonData = getMoonData();
                celestialRad = -moonData.azimuthRad + Math.PI / 2;
                if (celestialRad < 0) celestialRad = 0;
                if (celestialRad > Math.PI) celestialRad = Math.PI;
            }

            if (window.debugTimer === undefined) window.debugTimer = 0;
            if (window.debugTimer++ % 600 === 0) {
                console.log(`[v3] Moon Progress Mapping - Rad: ${celestialRad.toFixed(4)}`);
            }
        } else {
            // During day, use real astronomical Sun Progress instead of tracker data
            const sunTimes = SunCalc.getTimes(new Date(), CONFIG.location.lat, CONFIG.location.lon);
            const now = new Date().getTime();
            const rise = sunTimes.sunrise.getTime();
            const set = sunTimes.sunset.getTime();

            const progress = (now - rise) / (set - rise);
            // Map progress (0 to 1) to arc angle (PI to 0) -> East to West
            celestialRad = Math.PI - (Math.max(0, Math.min(1, progress)) * Math.PI);

            if (window.debugTimer === undefined) window.debugTimer = 0;
            if (window.debugTimer++ % 600 === 0) {
                console.log(`[v3] Sun Progress Mapping - Rad: ${celestialRad.toFixed(4)}`);
            }
        }

        let uiX = 12 * Math.cos(celestialRad);
        let uiY = 11 * Math.sin(celestialRad) - 1;

        // Ensure celestial body doesn't sink deep into the Earth dome in the UI
        if (uiY < -0.5) uiY = -0.5;

        if (sunMesh && window.sunTexture && window.moonTexture) {
            sunMesh.material.map = isNight ? window.moonTexture : window.sunTexture;
            sunMesh.position.set(uiX, uiY, 0);
            sunMesh.material.opacity = 1.0;

            if (weatherMesh) {
                // Remove redundant symbols: only show 3D moon at night
                if (isNight) {
                    weatherMesh.visible = false;
                } else {
                    weatherMesh.visible = true;
                    weatherMesh.position.set(uiX, uiY + 1.8, 0.1);
                }
            }
        }

        if (sunLight) {
            sunLight.position.set(uiX, uiY, 5);
            sunLight.intensity = isNight ? 0.3 : 2.0;
        }

        renderer.render(scene, camera);
    }
}

function onWindowResize() {
    const container = document.getElementById('three-viz-container');
    if (!container || !camera || !renderer) return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// --- Advanced Visualization Logic ---
function updateAdvancedViz(trackerAzimuth, trackerElevation) {
    if (!panelPivot) return;

    // Mapping based on user request:
    // Vertical angle move facing surface into page or out of page
    // Horizontal angle change shows when vertical is not 0 or 90

    // User logic from example:
    // pivot.rotation.z = -angH * (PI / 180); -> Arc/Swing
    // pivot.rotation.x = angV * (PI / 180);  -> Pitch

    const hRad = (trackerAzimuth - 90) * (Math.PI / 180);
    const vRad = trackerElevation * (Math.PI / 180);

    panelPivot.rotation.z = -hRad;
    panelPivot.rotation.x = vRad;
}

// --- Weather Icon Logic ---
const weatherIcons = {
    "Hot": "🔥☀️",      // Shiny and Hot
    "Sunny": "☀️",       // Normal Day
    "Cloudy": "⛅",      // Clouded with sun
    "Rainy": "🌧️",       // Raining
    "Storm": "⛈️⚡"       // Thunder with raining
};

function updateWeatherEffects(condition) {
    if (!window.weatherCanvas || !window.weatherTex) return;

    const ctx = window.weatherCanvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);
    ctx.font = '80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const sunData = getSunData();
    const isNight = sunData.elevation < 0;

    // Remove redundant symbols: if it's just clear/sunny, we don't need the emoji
    // as the main 3D sprite already represents the sun/moon.
    if (weatherMesh) {
        if (condition.includes("Clear") || condition.includes("Sunny")) {
            weatherMesh.visible = false;
            return;
        } else {
            weatherMesh.visible = true;
        }
    }

    let emoji = "☀️";

    if (isNight) {
        emoji = "🌙";
        if (sunMesh) sunMesh.material.color.setHex(0xffffff);
        if (weatherMesh) weatherMesh.material.opacity = 0.8;
    } else {
        if (weatherMesh) weatherMesh.material.opacity = 1.0;
        // Update the 2D UI Icon based on condition
        if (condition.includes("Hot")) {
            emoji = "🔥";
            if (sunMesh) sunMesh.material.color.setHex(0xff4500);
        } else if (condition.includes("Cloud")) {
            emoji = "⛅";
            if (sunMesh) sunMesh.material.color.setHex(0xe2e8f0);
        } else if (condition.includes("Rain")) {
            emoji = "🌧️";
            if (sunMesh) sunMesh.material.color.setHex(0xaaaaaa);
        } else if (condition.includes("Thunder") || condition.includes("Storm")) {
            emoji = "⛈️";
            if (sunMesh) sunMesh.material.color.setHex(0x888888);
        }
    }

    ctx.fillText(emoji, 64, 64);
    window.weatherTex.needsUpdate = true;
}

// --- Firebase Operations ---
async function fetchTrackerData() {
    if (isUserInteracting) return;
    try {
        const response = await fetch(CONFIG.firebaseUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        updateUI(data);
        setStatus(true);
    } catch (error) {
        console.error('Fetch error:', error);
        loadMockData();
        setStatus(false);
    }
}

async function patchFirebase(pathUrl, updateData) {
    try {
        const response = await fetch(pathUrl, {
            method: 'PATCH',
            body: JSON.stringify(updateData),
            headers: { 'Content-Type': 'application/json' }
        });
        return response.ok;
    } catch (error) {
        console.error('Update error:', error);
        return false;
    }
}

function setStatus(online) {
    const badge = document.getElementById('conn-status');
    const text = badge ? badge.querySelector('.text') : null;
    if (badge && text) {
        if (online) {
            badge.classList.add('online');
            text.textContent = 'Live Data';
        } else {
            badge.classList.remove('online');
            text.textContent = 'Offline';
        }
    }
}

// --- UI Updates ---
function updateUI(data) {
    if (!data) return;

    const rawString = data.tracker_status?.all_data;
    if (rawString) {
        const parts = rawString.split(',').map(s => s.trim());
        if (parts.length >= 8) {
            const rainStatusEl = document.getElementById('rain-status');
            if (rainStatusEl) rainStatusEl.textContent = parts[0];

            updateVoltageSensor('tl', parts[2]);
            updateVoltageSensor('tr', parts[3]);
            updateVoltageSensor('bl', parts[4]);
            updateVoltageSensor('br', parts[5]);

            currentServoH = parseFloat(parts[6]);
            currentServoV = parseFloat(parts[7]);

            const shEl = document.getElementById('servo-h');
            const svEl = document.getElementById('servo-v');
            if (shEl) shEl.textContent = currentServoH + '°';
            if (svEl) svEl.textContent = currentServoV + '°';
        }
    }

    const hTarget = parseFloat(data.control_commands?.target_h || 90);
    const vTarget = parseFloat(data.control_commands?.target_v || 0);

    updateAdvancedViz(hTarget, vTarget);

    if (!isUserInteracting) {
        currentH = hTarget;
        currentV = vTarget;

        const modeVal = parseInt(data.control_commands?.manual_mode ?? data.control_commands?.mode ?? 0);
        currentMode = modeVal;

        const modeToggle = document.getElementById('mode-toggle-checkbox');
        if (modeToggle) modeToggle.checked = (modeVal === 1);
        updateManualControlsVisibility(modeVal);

        const hDisp = document.getElementById('val-h-display');
        const vDisp = document.getElementById('val-v-display');
        if (hDisp) hDisp.textContent = currentH + '°';
        if (vDisp) vDisp.textContent = currentV + '°';

        const modeElement = document.getElementById('tracker-mode');
        if (modeElement) {
            modeElement.textContent = (modeVal === 1 ? 'MANUAL' : 'AI');
            modeElement.style.background = (modeVal === 0 ? 'var(--secondary)' : '#4b5563');
        }

        const thEl = document.getElementById('target-h');
        const tvEl = document.getElementById('target-v');
        if (thEl) thEl.textContent = hTarget + '°';
        if (tvEl) tvEl.textContent = vTarget + '°';
    }

    const weatherCond = data.weather_data?.condition || 'Sunny';
    const weatherCondEl = document.getElementById('weather-condition');
    if (weatherCondEl) weatherCondEl.textContent = weatherCond;

    updateWeatherEffects(weatherCond);

    const rawTemp = parseFloat(data.sensor_data?.temperature);
    const tempEl = document.getElementById('temp-value');
    if (tempEl) tempEl.textContent = (isNaN(rawTemp) ? '--' : rawTemp.toFixed(2)) + '°C';

    const humEl = document.getElementById('humidity-value');
    if (humEl) humEl.textContent = (data.sensor_data?.humidity || '--') + '%';

    const cloudEl = document.getElementById('cloud-cover');
    if (cloudEl) cloudEl.textContent = (data.weather_data?.cloud_cover || '--') + '%';

    const suggEl = document.getElementById('weather-suggestion');
    if (suggEl) suggEl.textContent = data.weather_data?.suggestion || '--';
}

function updateVoltageSensor(id, digitalValue) {
    const val = parseInt(digitalValue);
    const el = document.getElementById(`lux-${id}`);
    const bar = document.getElementById(`lux-${id}-bar`);
    if (el && bar) {
        const voltage = ((val / 1023) * 5).toFixed(2);
        el.textContent = `${voltage}V`;
        const percent = Math.min((val / 1023) * 100, 100);
        bar.style.width = percent + '%';
    }
}

function updateManualControlsVisibility(mode) {
    const group = document.getElementById('manual-controls-group');
    if (group) {
        if (mode === 1) group.classList.remove('disabled');
        else group.classList.add('disabled');
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();

    const modeToggle = document.getElementById('mode-toggle-checkbox');
    const updateBtn = document.getElementById('update-tracker-btn');

    // D-Pad Logic with Long-Press Acceleration
    const dpadButtons = [
        { id: 'btn-v-up', type: 'v', delta: 1 },
        { id: 'btn-v-down', type: 'v', delta: -1 },
        { id: 'btn-h-up', type: 'h', delta: 1 },
        { id: 'btn-h-down', type: 'h', delta: -1 }
    ];

    let holdTimer = null;
    let accelerationTimer = null;

    const adjust = (type, delta) => {
        isUserInteracting = true;
        if (type === 'h') {
            currentH = Math.min(360, Math.max(0, currentH + delta));
            const hDisp = document.getElementById('val-h-display');
            if (hDisp) hDisp.textContent = currentH + '°';
        } else {
            currentV = Math.min(90, Math.max(-90, currentV + delta));
            const vDisp = document.getElementById('val-v-display');
            if (vDisp) vDisp.textContent = currentV + '°';
        }
        updateAdvancedViz(currentH, currentV);
    };

    const startHold = (type, delta) => {
        adjust(type, delta);
        holdTimer = setTimeout(() => {
            accelerationTimer = setInterval(() => adjust(type, delta), 80);
        }, 500);
    };

    const stopHold = () => {
        clearTimeout(holdTimer);
        clearInterval(accelerationTimer);
    };

    dpadButtons.forEach(btn => {
        const el = document.getElementById(btn.id);
        if (el) {
            el.addEventListener('mousedown', () => startHold(btn.type, btn.delta));
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                startHold(btn.type, btn.delta);
            });
            el.addEventListener('mouseup', stopHold);
            el.addEventListener('mouseleave', stopHold);
            el.addEventListener('touchend', stopHold);
        }
    });

    if (modeToggle) {
        modeToggle.addEventListener('change', async (e) => {
            const newMode = e.target.checked ? 1 : 0;
            let updateData = {
                manual_mode: String(newMode),
                mode: newMode === 0 ? 'ai' : 'manual'
            };

            if (newMode === 0) {
                updateData.target_h = String(currentServoH);
                updateData.target_v = String(currentServoV);
                currentH = currentServoH;
                currentV = currentServoV;
            }

            const success = await patchFirebase(CONFIG.controlUrl, updateData);
            if (success) {
                currentMode = newMode;
                updateManualControlsVisibility(newMode);
                const modeElement = document.getElementById('tracker-mode');
                if (modeElement) {
                    modeElement.textContent = (newMode === 1 ? 'MANUAL' : 'AI');
                    modeElement.style.background = (newMode === 0 ? 'var(--secondary)' : '#4b5563');
                }

                if (newMode === 0) {
                    const hDisp = document.getElementById('val-h-display');
                    const vDisp = document.getElementById('val-v-display');
                    if (hDisp) hDisp.textContent = currentH + '°';
                    if (vDisp) vDisp.textContent = currentV + '°';
                    updateAdvancedViz(currentH, currentV);
                }
            } else {
                e.target.checked = !e.target.checked;
            }
        });
    }

    if (updateBtn) {
        updateBtn.addEventListener('click', async () => {
            const success = await patchFirebase(CONFIG.controlUrl, {
                target_h: String(currentH),
                target_v: String(currentV)
            });
            if (success) {
                const centerBtn = document.querySelector('.dpad-btn.center');
                if (centerBtn) {
                    centerBtn.style.background = 'var(--secondary)';
                    setTimeout(() => centerBtn.style.background = '', 500);
                }
                isUserInteracting = false;
            }
        });
    }

    fetchTrackerData();
});

setInterval(fetchTrackerData, CONFIG.fetchInterval);

function loadMockData() {
    const sunData = getSunData();
    const mockData = {
        "tracker_status": { "all_data": "CLEAR, AUTO, 282, 246, 664, 322, 180, 10" },
        "weather_data": { "condition": "Sunny", "cloud_cover": 20, "suggestion": "Optimal tracking" },
        "sensor_data": { "temperature": "28.50", "humidity": "65" },
        "control_commands": { "manual_mode": "0", "target_h": azimuth.toString(), "target_v": "10" }
    };
    updateUI(mockData);
}
