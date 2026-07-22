// --- 🔊 BEEP SOUND GENERATOR ---
function playBeep() { 
    try { 
        const ctx = new (window.AudioContext || window.webkitAudioContext)(); 
        const osc = ctx.createOscillator(); 
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(800, ctx.currentTime); 
        osc.connect(ctx.destination); 
        osc.start(); 
        osc.stop(ctx.currentTime + 0.1); 
    } catch(e) {} 
}

// --- CUSTOM TOAST NOTIFICATION ---
function showToast(message) {
    const box = document.getElementById('toastBox');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    box.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
}

// --- LIVE VALIDATION & SHAKE (ON BLUR) ---
function attachValidations() {
    document.getElementById('r_barcode').addEventListener('blur', function() {
        let val = this.value.trim().toUpperCase().replace(/\s+/g, '');
        this.value = val;
        let pattern = /^[A-Z]{2}\d{9}[A-Z]{2}$/;
        if(val && !pattern.test(val)) {
            this.classList.add('shake');
            showToast("⚠️ <b>Barcode Error:</b><br>13 characters required (e.g. CP123456789IN)");
            setTimeout(()=>this.classList.remove('shake'), 500);
        }
    });
    document.getElementById('r_mobile').addEventListener('blur', function() {
        let val = this.value.replace(/\D/g, '');
        this.value = val;
        if(val && val.length !== 10) {
            this.classList.add('shake');
            showToast(`⚠️ <b>Mobile Error:</b><br>10 digits required. Aapne ${val.length} dale hain.`);
            setTimeout(()=>this.classList.remove('shake'), 500);
        }
    });
    document.getElementById('r_pin').addEventListener('blur', function() {
        let val = this.value.replace(/\D/g, '');
        this.value = val;
        if(val && val.length !== 6) {
            this.classList.add('shake');
            showToast(`⚠️ <b>PIN Code Error:</b><br>Must be exactly 6 digits.`);
            setTimeout(()=>this.classList.remove('shake'), 500);
        }
    });
    document.getElementById('r_add2').addEventListener('blur', function() {
        if(!this.value.trim()) {
            this.classList.add('shake');
            showToast("⚠️ <b>Address Error:</b><br>Address Line 2 is mandatory!");
            setTimeout(()=>this.classList.remove('shake'), 500);
        }
    });
}

// --- THEME MANAGEMENT ---
function setTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('rexTheme', themeName);
}

// --- ⌨️ KEYBOARD HIDER ---
function setKeyboardVisibility(show) {
    const inputs = document.querySelectorAll('input:not([type="hidden"])');
    inputs.forEach(inp => {
        if(!show) inp.setAttribute('inputmode', 'none'); 
        else inp.removeAttribute('inputmode'); 
    });
}

// --- 🎙️ SMART VOICE COMMANDS ---
let recognition;
let isListening = false;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true; 
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    
    recognition.onresult = function(event) {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        const lowerTranscript = transcript.toLowerCase();
        const activeEl = document.activeElement;
        
        if (!activeEl || (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'SELECT')) {
            showToast("⚠️ <b>Tap a box first!</b><br>Click inside a box before speaking.");
            return;
        }

        if (lowerTranscript === 'delete it' || lowerTranscript === 'clear it' || lowerTranscript === 'delete') {
            activeEl.value = '';
            activeEl.dispatchEvent(new Event('input', { bubbles: true }));
            showToast("🗑️ Box cleared");
            playBeep();
            return;
        }

        const replaceMatch = lowerTranscript.match(/replace (.+) with (.+)/i);
        if (replaceMatch) {
            const toReplace = new RegExp(replaceMatch[1].trim(), "gi");
            const replaceWithText = replaceMatch[2].trim();
            activeEl.value = activeEl.value.replace(toReplace, replaceWithText);
            activeEl.dispatchEvent(new Event('input', { bubbles: true }));
            showToast(`🔄 Replaced '${replaceMatch[1]}' with '${replaceWithText}'`);
            playBeep();
            return;
        }

        if (lowerTranscript === 'next' || lowerTranscript === 'agla') {
            jumpToNext(activeEl);
            playBeep();
            return;
        }

        let textToType = transcript;
        let shouldJumpNext = false;

        if (textToType.toLowerCase().endsWith(' next')) {
            shouldJumpNext = true;
            textToType = textToType.replace(/ next$/i, '').trim();
        } else if (textToType.toLowerCase().endsWith(' agla')) {
            shouldJumpNext = true;
            textToType = textToType.replace(/ agla$/i, '').trim();
        }

        if(activeEl.type === 'number') {
            activeEl.value += textToType.replace(/O/gi, '0').replace(/l/gi, '1').replace(/\D/g, '');
        } else {
            activeEl.value += (activeEl.value ? ' ' : '') + textToType;
        }
        
        activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        if(activeEl.id === 'r_add1' || activeEl.id === 'r_add2') checkAddressLength(activeEl.id);
        playBeep();

        if (shouldJumpNext) { jumpToNext(activeEl); }
    };

    recognition.onend = function() {
        if(isListening) { 
            try { recognition.start(); } catch(e) { resetVoiceUI(); }
        }
    };

    recognition.onerror = function(event) { 
        console.error("Voice Error: ", event.error);
        if(event.error === 'not-allowed') {
            showToast("❌ <b>Mic Blocked:</b> Voice mode requires HTTPS.");
            resetVoiceUI();
        }
    };
}

function jumpToNext(currentEl) {
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select'));
    const currentIndex = inputs.indexOf(currentEl);
    if (currentIndex > -1 && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
    }
}

function resetVoiceUI() {
    isListening = false;
    setKeyboardVisibility(true);
    const btn = document.getElementById('voiceBtn');
    const fab = document.getElementById('fabVoiceBtn');
    if(btn) { btn.classList.remove('active'); btn.innerText = "🎙️ Voice"; }
    if(fab) { fab.classList.remove('active'); }
}

function toggleVoice() {
    const btn = document.getElementById('voiceBtn');
    const fab = document.getElementById('fabVoiceBtn');

    if(!recognition) { 
        showToast("❌ Voice mode requires HTTPS."); 
        return; 
    }
    
    if(isListening) {
        isListening = false; 
        recognition.stop();
        resetVoiceUI();
    } else {
        try {
            recognition.start();
            isListening = true;
            setKeyboardVisibility(false);
            if(btn) { btn.classList.add('active'); btn.innerText = "🔴 Listening"; }
            if(fab) { fab.classList.add('active'); }
            showToast("🎙️ <b>Voice Mode On!</b><br>Try: 'Delete it', 'Replace X with Y', or 'Next'.");
        } catch(e) {
            console.error(e);
            resetVoiceUI();
        }
    }
}

// --- TOGGLE SENDER CARD ---
function toggleSender() { 
    let body = document.getElementById('sender_body'); 
    let icon = document.getElementById('sender_toggle_icon'); 
    if(body.style.display === 'none') { 
        body.style.display = 'block'; 
        icon.innerText = '▲ Hide'; 
    } else { 
        body.style.display = 'none'; 
        icon.innerText = '▼ Show'; 
    } 
}

// --- MODAL CONTROLS ---
function openHelpModal() { document.getElementById('helpModal').style.display = 'flex'; }
function closeHelpModal() { document.getElementById('helpModal').style.display = 'none'; }

function openApiModal() { 
    document.getElementById('apiModal').style.display = 'flex'; 
    document.getElementById('gemini_api_key_1').value = localStorage.getItem('geminiApiKey1') || "";
    document.getElementById('gemini_api_key_2').value = localStorage.getItem('geminiApiKey2') || "";
    
    document.getElementById('set_fab').checked = localStorage.getItem('hideFab') !== 'true';
    document.getElementById('set_splash').checked = localStorage.getItem('hideSplash') !== 'true';
    
    document.getElementById('stat_total').innerText = receivers.length;
    let todayStr = new Date().toDateString();
    let todayCount = receivers.filter(r => new Date().toDateString() === todayStr).length;
    document.getElementById('stat_today').innerText = todayCount;
}

function closeApiModal() { document.getElementById('apiModal').style.display = 'none'; }

function saveSettings() {
    let key1 = document.getElementById('gemini_api_key_1').value.trim();
    let key2 = document.getElementById('gemini_api_key_2').value.trim();
    
    if(key1) localStorage.setItem('geminiApiKey1', key1); else localStorage.removeItem('geminiApiKey1');
    if(key2) localStorage.setItem('geminiApiKey2', key2); else localStorage.removeItem('geminiApiKey2');
    
    if(!document.getElementById('set_fab').checked) {
        localStorage.setItem('hideFab', 'true');
        document.getElementById('fabVoiceBtn').style.display = 'none';
    } else {
        localStorage.setItem('hideFab', 'false');
        document.getElementById('fabVoiceBtn').style.display = 'flex';
    }

    if(!document.getElementById('set_splash').checked) {
        localStorage.setItem('hideSplash', 'true');
    } else {
        localStorage.setItem('hideSplash', 'false');
    }

    showToast("✅ Settings Saved Successfully!"); 
    closeApiModal();
}

// --- AI OCR TO GEMINI (WITH BULLETPROOF COMPRESSION FIX) ---
const compressImage = (file) => new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
        reject(new Error('Kripya sirf valid photo upload karein.'));
        return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1000; 
                const scaleSize = Math.min(1, MAX_WIDTH / img.width);
                canvas.width = img.width * scaleSize;
                canvas.height = img.height * scaleSize;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Format to Base64
                const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
                resolve(base64); 
            } catch(err) {
                reject(new Error("Image process nahi ho paayi. Photo ka size bohot bada ho sakta hai."));
            }
        };
        
        img.onerror = () => reject(new Error("Camera se photo read karne mein error aayi. Dobara try karein."));
    };
    
    reader.onerror = () => reject(new Error("File upload fail ho gayi."));
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function handleAIImage(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    let keysToTry = [];
    let k1 = localStorage.getItem('geminiApiKey1');
    let k2 = localStorage.getItem('geminiApiKey2');
    if(k1) keysToTry.push({key: k1, label: 'Key 1'});
    if(k2) keysToTry.push({key: k2, label: 'Key 2'});

    const statusLabel = document.getElementById('ai_status');

    if(keysToTry.length === 0) {
        showToast("❌ Please save at least one API Key in Settings first.");
        openApiModal();
        return;
    }

    statusLabel.style.color = "#3b82f6";
    
    try {
        statusLabel.innerText = "📸 Uploading image & compressing...";
        
        // Wait for compression (Will throw error and jump to Catch block if it fails)
        const base64String = await compressImage(file);
        await sleep(300); 

        statusLabel.innerText = "🔍 Reading label via Google Servers...";
        
        const payload = {
            contents: [{
                parts: [
                    { text: "Extract receiver details from this shipping label. \nRULES:\n1. Barcode: 13 chars exactly.\n2. PIN: EXACTLY 6 digits ONLY. Convert 'O' to '0' and 'l' to '1'.\n3. Mobile: EXACTLY 10 digits ONLY. Ignore '+91' or symbols. Convert 'O' to '0'.\n4. If 'VPP' or 'V.P.P' is written, set 'cod_type' to 'codr'. If 'COD', set to 'cod'.\n5. cod_amt must be numeric only.\nReply ONLY with JSON. Keys: barcode, name, mobile, add1, add2, pin, city, state, weight, cod_amt, cod_type." },
                    { inlineData: { mimeType: 'image/jpeg', data: base64String } } 
                ]
            }]
        };

        const modelsToTry = [
            "gemini-3.5-flash", 
            "gemini-2.5-flash", 
            "gemini-2.0-flash", 
            "gemini-1.5-flash"
        ];
        
        let response = null;
        let activeModel = "";
        let activeKeyLabel = "";
        let isSuccess = false;
        let lastErrorMsg = "Unknown Error";

        await sleep(300);
        statusLabel.innerText = `🤖 AI analysing data...`;

        for (const keyObj of keysToTry) {
            for (const model of modelsToTry) {
                try {
                    response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyObj.key}`,
                        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
                    );
                    
                    if (response.ok) {
                        isSuccess = true;
                        activeModel = model;
                        activeKeyLabel = keyObj.label;
                        document.getElementById('stat_model').innerText = `${model} (${keyObj.label})`;
                        break; 
                    } else {
                        if (response.status === 429) {
                            lastErrorMsg = "Quota Exceeded on " + keyObj.label;
                            break; 
                        } else if (response.status === 400 || response.status === 403) {
                            lastErrorMsg = "Invalid API Key: " + keyObj.label;
                            break; 
                        } else {
                            lastErrorMsg = "Unsupported Model: " + model;
                        }
                    }
                } catch(e) {
                    lastErrorMsg = "Internet not available or Server Down";
                    break; 
                }
            }
            if (isSuccess) break; 
        }

        if (!isSuccess) {
            throw new Error(lastErrorMsg);
        }
        
        statusLabel.innerText = `📦 Filling details using ${activeModel} (${activeKeyLabel})...`;
        await sleep(300);

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;
        
        let result;
        try { result = JSON.parse(aiText.replace(/```json/g, '').replace(/```/g, '').trim()); } 
        catch(e) {
            const match = aiText.match(/\{[\s\S]*\}/);
            if(match) result = JSON.parse(match[0]);
            else throw new Error("AI returned unreadable format.");
        }
        
        if(result.barcode) document.getElementById('r_barcode').value = result.barcode.replace(/\s+/g, '').toUpperCase();
        if(result.name) document.getElementById('r_name').value = result.name.toUpperCase();
        
        if(result.mobile) {
            let safeMob = String(result.mobile).replace(/O/gi, '0').replace(/l/gi, '1').replace(/\D/g, '');
            document.getElementById('r_mobile').value = safeMob.substring(0, 10);
        }
        if(result.add1) { document.getElementById('r_add1').value = result.add1.substring(0, 50).toUpperCase(); checkAddressLength('r_add1'); }
        if(result.add2) { document.getElementById('r_add2').value = result.add2.substring(0, 50).toUpperCase(); checkAddressLength('r_add2'); }
        
        if(result.pin) {
            let safePin = String(result.pin).replace(/O/gi, '0').replace(/l/gi, '1').replace(/\D/g, '');
            let finalPin = safePin.substring(0, 6);
            document.getElementById('r_pin').value = finalPin;
            
            let cachedLoc = localStorage.getItem('pin_' + finalPin);
            if(cachedLoc) {
                let loc = JSON.parse(cachedLoc);
                document.getElementById('r_city').value = loc.city;
                document.getElementById('r_state').value = loc.state;
            } else {
                fetchCityState(); 
            }
        }
        if(result.city) document.getElementById('r_city').value = result.city.toUpperCase();
        if(result.state) document.getElementById('r_state').value = result.state.toUpperCase();
        if(result.weight) document.getElementById('r_weight').value = String(result.weight).replace(/\D/g, '');
        
        if(result.cod_amt) {
            const amt = String(result.cod_amt).replace(/\D/g, '');
            if(amt) {
                document.getElementById('r_cod_amt').value = amt;
                let cType = result.cod_type ? String(result.cod_type).toLowerCase() : '';
                if(cType.includes('vpp') || cType.includes('codr')) document.getElementById('r_cod_type').value = 'codr';
                else if(cType.includes('cod')) document.getElementById('r_cod_type').value = 'cod';
                else document.getElementById('r_cod_type').value = 'codr';
            }
        }
        
        statusLabel.style.color = "#10b981";
        statusLabel.innerText = `✅ Done! Magic Complete.`;
        playBeep();
        
    } catch (error) {
        statusLabel.style.color = "#ef4444";
        statusLabel.innerText = "❌ " + error.message;
        showToast("❌ " + error.message);
    } finally {
        document.getElementById('ai_camera').value = '';
        document.getElementById('ai_upload').value = '';
    }
}

// --- 📷 UPGRADED BARCODE SCANNER ---
let html5QrScanner = null;
let scannerRunning = false;

async function startScanner() {
    if (scannerRunning) return;
    
    const container = document.getElementById("reader-container");
    container.style.display = "block";
    
    if (!html5QrScanner) {
        html5QrScanner = new Html5Qrcode("reader");
    }
    
    scannerRunning = true;
    
    const config = {
        fps: 20, 
        qrbox: { width: 280, height: 120 },
        aspectRatio: 1.77,
        disableFlip: true,
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    };

    try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
            throw new Error("No camera found!");
        }

        let rearCamera = cameras.find(c => 
            c.label.toLowerCase().includes("back") || 
            c.label.toLowerCase().includes("rear") || 
            c.label.toLowerCase().includes("environment")
        );
        
        const cameraId = rearCamera ? rearCamera.id : cameras[0].id;

        await html5QrScanner.start(
            cameraId,
            config,
            (decodedText) => {
                let cleanText = decodedText.trim().replace(/\s+/g, "").toUpperCase();
                
                if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(cleanText)) {
                    document.getElementById('r_barcode').value = cleanText;
                    playBeep();
                    stopScanner();
                } else {
                    console.log("Ignored invalid barcode: " + cleanText);
                }
            },
            (errorMessage) => {}
        );
    } catch (err) {
        scannerRunning = false;
        container.style.display = "none";
        showToast("❌ Camera Error: " + err.message);
    }
}

async function stopScanner() {
    if (!html5QrScanner) return;
    try {
        if (scannerRunning) {
            await html5QrScanner.stop();
        }
        await html5QrScanner.clear(); 
    } catch (err) {}
    
    html5QrScanner = null;
    scannerRunning = false;
    document.getElementById('reader-container').style.display = 'none';
}

function cancelEdit() { editIndex = -1; let btnAdd = document.getElementById('add_btn'); let btnCancel = document.getElementById('cancel_edit_btn'); btnAdd.innerHTML = '➕ Add Parcel'; btnAdd.style.background = ''; btnCancel.style.display = 'none'; ['r_barcode','r_name','r_mobile','r_add1','r_add2','r_pin','r_city','r_state','r_weight','r_cod_type','r_cod_amt'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ''; }); document.getElementById('count_r_add1').innerText = '0'; document.getElementById('count_r_add2').innerText = '0'; document.getElementById('ai_status').innerText = ''; }

function addReceiver() {
    let barcodeInput = document.getElementById('r_barcode');
    let mobileInput = document.getElementById('r_mobile');
    
    let barcode = barcodeInput.value.trim().toUpperCase().replace(/\s+/g, '');
    barcodeInput.value = barcode;
    
    let mobile = mobileInput.value.replace(/O/gi, '0').replace(/l/gi, '1').replace(/\D/g, '');
    mobileInput.value = mobile;
    
    let add2 = document.getElementById('r_add2').value.trim();

    let barcodePattern = /^[A-Z]{2}\d{9}[A-Z]{2}$/;
    if(!barcodePattern.test(barcode)) {
        barcodeInput.classList.add('shake');
        showToast("❌ <b>Barcode Error:</b><br>Galat format. 13 chars hone chahiye.");
        setTimeout(()=>barcodeInput.classList.remove('shake'), 500);
        return;
    }

    let dupIndex = receivers.findIndex(r => r.barcode === barcode);
    if(dupIndex > -1 && dupIndex !== editIndex) {
        barcodeInput.classList.add('shake');
        showToast(`❌ <b>Duplicate Alert:</b><br>Ye Barcode (${barcode}) list mein already hai!`);
        setTimeout(()=>barcodeInput.classList.remove('shake'), 500);
        return;
    }

    if(mobile && mobile.length !== 10) {
        mobileInput.classList.add('shake');
        showToast(`❌ <b>Mobile Error:</b><br>Exactly 10 digit chahiye. Aapne ${mobile.length} dale.`);
        setTimeout(()=>mobileInput.classList.remove('shake'), 500);
        return;
    }

    if(!add2) {
        let add2Input = document.getElementById('r_add2');
        add2Input.classList.add('shake');
        showToast("❌ <b>Address Error:</b><br>Address Line 2 mandatory hai!");
        setTimeout(()=>add2Input.classList.remove('shake'), 500);
        return;
    }
    
    let shape = document.getElementById('r_shape').value || 'NROL'; 
    let weightVal = document.getElementById('r_weight').value || '100';
    let l='', b='', h='', r_len='', dia='';
    if(shape === 'NROL') { l = document.getElementById('r_len').value || '14'; b = document.getElementById('r_brd').value || '9'; h = document.getElementById('r_ht').value || '1'; } 
    else if (shape === 'ROLL') { r_len = document.getElementById('r_r_len').value; dia = document.getElementById('r_dia').value; l = r_len; b = dia; }

    let parcelData = { 
        barcode: barcode, 
        name: document.getElementById('r_name').value.toUpperCase(), 
        mobile: mobile, 
        add1: document.getElementById('r_add1').value.toUpperCase(), 
        add2: add2.toUpperCase(), 
        pin: document.getElementById('r_pin').value, 
        city: document.getElementById('r_city').value.toUpperCase(), 
        state: document.getElementById('r_state').value.toUpperCase(), 
        weight: weightVal, 
        cod_type: document.getElementById('r_cod_type').value, 
        cod_amt: document.getElementById('r_cod_amt').value, 
        shape: shape, 
        length: l, 
        breadth: b, 
        height: h 
    };
    prevData = parcelData; 
    
    if (editIndex > -1) { receivers[editIndex] = parcelData; cancelEdit(); showToast("✅ Parcel Updated Successfully!"); } 
    else { receivers.push(parcelData); playBeep(); showToast("✅ Parcel Added Successfully!"); }
    
    updateSerials(); saveSession(); updateTable();
    
    let retainData = document.getElementById('retain_data').checked;
    if (!retainData && editIndex === -1) { 
        ['r_name','r_mobile','r_add1','r_add2','r_pin','r_city','r_state','r_cod_type','r_cod_amt'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ''; }); 
        document.getElementById('count_r_add1').innerText = '0'; 
        document.getElementById('count_r_add2').innerText = '0'; 
        document.getElementById('ai_status').innerText = ''; 
    }
    document.getElementById('r_barcode').value = ''; 
}

function editParcel(barcode) { let index = receivers.findIndex(r => r.barcode === barcode); if(index > -1) { let r = receivers[index]; document.getElementById('r_barcode').value = r.barcode; document.getElementById('r_name').value = r.name; document.getElementById('r_mobile').value = r.mobile; document.getElementById('r_add1').value = r.add1; document.getElementById('r_add2').value = r.add2; document.getElementById('r_pin').value = r.pin; document.getElementById('r_city').value = r.city; document.getElementById('r_state').value = r.state; document.getElementById('r_weight').value = r.weight; document.getElementById('r_cod_type').value = r.cod_type; document.getElementById('r_cod_amt').value = r.cod_amt; document.getElementById('r_shape').value = r.shape; editIndex = index; document.getElementById('add_btn').innerHTML = '💾 Update Parcel'; document.getElementById('add_btn').style.background = 'linear-gradient(135deg, #f59e0b, #d97706)'; document.getElementById('cancel_edit_btn').style.display = 'block'; window.scrollTo({ top: 0, behavior: 'smooth' }); } }
function deleteParcel(barcode) { if(confirm(`Delete Barcode: ${barcode}?`)) { receivers = receivers.filter(r => r.barcode !== barcode); updateSerials(); saveSession(); updateTable(); } }

function updateTable() {
    let tbody = document.getElementById('table-body'); let searchVal = (document.getElementById('search_bar')?.value || '').toLowerCase();
    let filtered = receivers.filter(r => r.barcode.toLowerCase().includes(searchVal) || r.name.toLowerCase().includes(searchVal) || r.pin.toString().includes(searchVal));
    if(filtered.length === 0) { tbody.innerHTML = '<tr><td colspan="14" style="text-align: center; color: var(--text-muted); padding: 20px;">No parcels found.</td></tr>'; return; }
    tbody.innerHTML = '';
    filtered.forEach((r) => { tbody.innerHTML += `<tr><td style="font-weight: 600;">${r.serial}</td><td><button class="btn-action" onclick="editParcel('${r.barcode}')">✏️</button><button class="btn-action" style="color: #ef4444;" onclick="deleteParcel('${r.barcode}')">❌</button></td><td style="font-weight: 600; color: #3b82f6;">${r.barcode}</td><td>${r.weight||'100'}</td><td>${r.city}</td><td>${r.pin}</td><td>${r.name}</td><td>${r.add1}</td><td>${r.add2}</td><td>${r.mobile}</td><td>${r.state}</td><td>${r.cod_type||''}</td><td>${r.cod_amt||''}</td><td>${r.shape}</td></tr>`; });
}

// --- SMART EXCEL FILE NAMING ---
function exportToExcel() {
    if(receivers.length === 0) { showToast("❌ List is empty!"); return; }
    let s = {}; senderFields.forEach(f => s[f] = document.getElementById(f).value.toUpperCase());
    
    if(!s.s_name || !s.s_mobile || !s.s_add1 || !s.s_add2 || !s.s_city || !s.s_state || !s.s_pin) {
        showToast("❌ Sender Details mein Company Name ke alawa sabhi fields mandatory hain!");
        if(document.getElementById('sender_body').style.display === 'none') toggleSender();
        return;
    }

    let exportData = receivers.map(r => { return { 'SERIAL NUMBER': r.serial, 'BARCODE NO': r.barcode, 'PHYSICAL WEIGHT': Number(r.weight || 100), 'REG': 0, 'OTP': 0, 'RECEIVER CITY': r.city, 'RECEIVER PINCODE': Number(r.pin), 'RECEIVER NAME': r.name, 'RECEIVER ADD LINE 1': r.add1, 'RECEIVER ADD LINE 2': r.add2, 'RECEIVER ADD LINE 3': '', 'RECEIVER MOBILE NO': r.mobile ? Number(r.mobile) : '', 'RECEIVER STATE/UT': r.state, 'ACK': 0, 'PREPAYMENT CODE': '', 'VALUE OF PREPAYMENT': '', 'CODR/COD': r.cod_type ? r.cod_type : '', 'VALUE FOR CODR/COD': r.cod_type && r.cod_amt ? Number(r.cod_amt) : '', 'INSURANCE TYPE': '', 'VALUE OF INSURANCE': '', 'SHAPE OF ARTICLE': r.shape || 'NROL', 'LENGTH ': r.length ? Number(r.length) : 14, 'BREADTH/DIAMETER': r.breadth ? Number(r.breadth) : 9, 'HEIGHT': r.height ? Number(r.height) : 1, 'PRIORITY FLAG': true, 'DELIVERY INSTRUCTION': 'ND', 'DELIVERY SLOT': '', 'INSTRUCTION RTS': 'RTS', 'SENDER MOBILE NO': Number(s.s_mobile), 'SENDER NAME': s.s_name, 'SENDER COMPANY NAME': s.s_company, 'SENDER CITY': s.s_city, 'SENDER STATE/UT': s.s_state, 'SENDER PINCODE': Number(s.s_pin), 'SENDER EMAILID': '', 'SENDER ADD LINE 1': s.s_add1, 'SENDER ADD LINE 2': s.s_add2, 'SENDER ALT CONTACT': '', 'SENDER KYC': '', 'SENDER TAX': '', 'RECEIVER COMPANY NAME': '', 'RECEIVER EMAILID': '', 'RECEIVER ALT CONTACT': '', 'RECEIVER KYC': '', 'RECEIVER TAX REF': '', 'ALT ADDRESS FLAG': false, 'BULK REFERENCE': '', 'SENDER ADD LINE 3': '' }; });
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const mandatoryCols = [ 'BARCODE NO', 'PHYSICAL WEIGHT', 'RECEIVER CITY', 'RECEIVER PINCODE', 'RECEIVER NAME', 'RECEIVER ADD LINE 1', 'RECEIVER ADD LINE 2', 'RECEIVER STATE/UT', 'SENDER MOBILE NO', 'SENDER NAME', 'SENDER CITY', 'SENDER STATE/UT', 'SENDER PINCODE', 'SENDER ADD LINE 1', 'SENDER ADD LINE 2', 'SHAPE OF ARTICLE' ];
    let colWidths = []; for(let i=0; i<=range.e.c; i++) { colWidths.push({wch: 18}); } worksheet['!cols'] = colWidths;
    
    for (let R = range.s.r; R <= range.e.r; ++R) { 
        for (let C = range.s.c; C <= range.e.c; ++C) { 
            const cellRef = XLSX.utils.encode_cell({c: C, r: R}); 
            if (!worksheet[cellRef]) continue; 
            worksheet[cellRef].s = { border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } }, font: { name: 'Calibri', sz: 11 } }; 
            if (R === 0) { 
                const headerName = worksheet[cellRef].v; 
                worksheet[cellRef].s.font.bold = true; 
                worksheet[cellRef].s.alignment = { horizontal: "center", vertical: "center" }; 
                if (mandatoryCols.includes(headerName)) { 
                    worksheet[cellRef].s.fill = { fgColor: { rgb: "FFFF0000" } }; 
                    worksheet[cellRef].s.font.color = { rgb: "FFFFFFFF" }; 
                } else { 
                    worksheet[cellRef].s.fill = { fgColor: { rgb: "FFD3D3D3" } }; 
                    worksheet[cellRef].s.font.color = { rgb: "FF000000" }; 
                } 
            } 
        } 
    }
    
    let senderCleanName = (s.s_name || 'Sender').replace(/[^a-zA-Z0-9]/g, '_');
    let today = new Date();
    let dateStr = String(today.getDate()).padStart(2, '0') + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + today.getFullYear();
    let fileName = `Bulk_Booking_${senderCleanName}_${dateStr}.xlsx`;

    const workbook = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(workbook, worksheet, "ArticleDetails"); 
    XLSX.writeFile(workbook, fileName);
}

window.onload = function() {
    if(localStorage.getItem('hideSplash') !== 'true') {
        if(!sessionStorage.getItem('rexSplashShownSession')) {
            const s = document.getElementById('rexSplash'); s.classList.add('show'); 
            sessionStorage.setItem('rexSplashShownSession','1');
            setTimeout(()=>{s.style.opacity='0'; setTimeout(()=>s.remove(),500);},3000);
        } else {
            const s = document.getElementById('rexSplash'); if(s) s.remove();
        }
    } else {
        const s = document.getElementById('rexSplash'); if(s) s.remove();
    }

    if(localStorage.getItem('hideFab') === 'true') {
        document.getElementById('fabVoiceBtn').style.display = 'none';
    }

    let savedTheme = localStorage.getItem('rexTheme') || 'light';
    setTheme(savedTheme);

    attachValidations();

    let hasSavedData = false;
    senderFields.forEach(f => { if(localStorage.getItem(f)) { document.getElementById(f).value = localStorage.getItem(f); hasSavedData = true; } });
    restoreSession(); handleShapeChange();
    if(hasSavedData) toggleSender();
};

let receivers = []; let prevData = {}; let editIndex = -1; 
const senderFields = ['s_name', 's_company', 's_mobile', 's_add1', 's_add2', 's_city', 's_state', 's_pin'];

function saveSession() { localStorage.setItem('savedParcels', JSON.stringify(receivers)); }
function autoSaveSender() { senderFields.forEach(f => localStorage.setItem(f, document.getElementById(f).value)); }

function restoreSession() { 
    let saved = localStorage.getItem('savedParcels'); 
    if (saved && saved !== "[]" && saved !== null) { 
        receivers = JSON.parse(saved); 
        updateTable(); 
    } 
}

function updateSerials() { receivers.forEach((r, idx) => { r.serial = idx + 1; }); }
function clearBatch() { if(confirm("Clear all parcels?")) { receivers = []; cancelEdit(); saveSession(); updateTable(); } }

function backupJSON() { 
    if(receivers.length === 0) { showToast("❌ List is empty!"); return; }
    let senderCleanName = (document.getElementById('s_name').value || 'Backup').replace(/[^a-zA-Z0-9]/g, '_');
    let today = new Date();
    let dateStr = String(today.getDate()).padStart(2, '0') + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + today.getFullYear();
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(receivers)); 
    const dlAnchorElem = document.createElement('a'); 
    dlAnchorElem.setAttribute("href", dataStr); 
    dlAnchorElem.setAttribute("download", `Parcels_${senderCleanName}_${dateStr}.json`); 
    dlAnchorElem.click(); 
}

function importJSON(event) { 
    const file = event.target.files[0]; 
    if(!file) return; 
    const reader = new FileReader(); 
    reader.onload = function(e) { 
        try { 
            const importedData = JSON.parse(e.target.result); 
            let addedCount = 0; 
            if(Array.isArray(importedData)) { 
                importedData.forEach(row => { 
                    if (row.barcode) { 
                        if (!receivers.find(r => r.barcode === row.barcode)) { 
                            receivers.push(row); 
                            addedCount++; 
                        } 
                    } 
                }); 
                updateSerials(); saveSession(); updateTable(); 
                showToast(`✅ ${addedCount} parcels imported!`); 
            } 
        } catch(err) {} 
        document.getElementById('import_json').value = ''; 
    }; 
    reader.readAsText(file); 
}

function importExcel(event) { 
    const file = event.target.files[0]; 
    if(!file) return; 
    const reader = new FileReader(); 
    reader.onload = function(e) { 
        const data = new Uint8Array(e.target.result); 
        const workbook = XLSX.read(data, {type: 'array'}); 
        const sheet = workbook.Sheets[workbook.SheetNames[0]]; 
        const json = XLSX.utils.sheet_to_json(sheet); 
        let addedCount = 0; 
        json.forEach(row => { 
            if (row['BARCODE NO']) { 
                if (!receivers.find(r => r.barcode === row['BARCODE NO'])) { 
                    receivers.push({ 
                        barcode: row['BARCODE NO'], weight: row['PHYSICAL WEIGHT']||'100', city: row['RECEIVER CITY']||'', pin: row['RECEIVER PINCODE']||'', name: row['RECEIVER NAME']||'', add1: row['RECEIVER ADD LINE 1']||'', add2: row['RECEIVER ADD LINE 2']||'', mobile: row['RECEIVER MOBILE NO']||'', state: row['RECEIVER STATE/UT']||'', cod_type: row['CODR/COD']||'', cod_amt: row['VALUE FOR CODR/COD']||'', shape: row['SHAPE OF ARTICLE']||'NROL', length: row['LENGTH '], breadth: row['BREADTH/DIAMETER'], height: row['HEIGHT'] 
                    }); addedCount++; 
                } 
            } 
        }); 
        updateSerials(); saveSession(); updateTable(); showToast(`✅ ${addedCount} parcels imported!`); document.getElementById('import_excel').value = ''; 
    }; 
    reader.readAsArrayBuffer(file); 
}

function copyPrev(f) { 
    let map = {'r_name':'name', 'r_mobile':'mobile', 'r_add1':'add1', 'r_add2':'add2', 'r_weight':'weight'};
    let key = map[f];
    if(prevData[key] !== undefined && prevData[key] !== '') { 
        document.getElementById(f).value = prevData[key]; 
        if(f === 'r_add1' || f === 'r_add2') checkAddressLength(f);
    }
}

function copyFromLine1() { document.getElementById('r_add2').value = document.getElementById('r_add1').value; checkAddressLength('r_add2'); }
function copyPrevPin() { if(prevData.pin) { document.getElementById('r_pin').value = prevData.pin; document.getElementById('r_city').value = prevData.city || ''; document.getElementById('r_state').value = prevData.state || ''; } }
function copyPrevCod() { if(prevData.cod_type !== undefined && prevData.cod_type !== '') { document.getElementById('r_cod_type').value = prevData.cod_type; document.getElementById('r_cod_amt').value = prevData.cod_amt; } }
function copyPrevShape() { if(prevData.shape) { document.getElementById('r_shape').value = prevData.shape; handleShapeChange(); if(prevData.shape==='NROL'){document.getElementById('r_len').value=prevData.length;document.getElementById('r_brd').value=prevData.breadth;document.getElementById('r_ht').value=prevData.height;}else if(prevData.shape==='ROLL'){document.getElementById('r_r_len').value=prevData.length;document.getElementById('r_dia').value=prevData.breadth;} } }

function saveSender() { 
    let sName = document.getElementById('s_name').value.trim();
    let sMob = document.getElementById('s_mobile').value.trim();
    let sAdd1 = document.getElementById('s_add1').value.trim();
    let sAdd2 = document.getElementById('s_add2').value.trim();
    let sCity = document.getElementById('s_city').value.trim();
    let sState = document.getElementById('s_state').value.trim();
    let sPin = document.getElementById('s_pin').value.trim();

    if(!sName || !sMob || !sAdd1 || !sAdd2 || !sCity || !sState || !sPin) {
        showToast("❌ Sender details mein Company Name ke alawa sabhi fields mandatory hain!");
        return;
    }

    senderFields.forEach(f => localStorage.setItem(f, document.getElementById(f).value)); 
    showToast("✅ Sender details saved successfully!"); 
    toggleSender(); 
}

function checkAddressLength(id) { document.getElementById('count_' + id).innerText = document.getElementById(id).value.length; }
function handleShapeChange() { let shape = document.getElementById('r_shape').value; document.getElementById('dim_nrol').style.display = 'none'; document.getElementById('dim_roll').style.display = 'none'; if (shape === 'NROL') document.getElementById('dim_nrol').style.display = 'flex'; else if (shape === 'ROLL') document.getElementById('dim_roll').style.display = 'flex'; }

async function fetchCityState() { 
    let pin = document.getElementById('r_pin').value; 
    if(pin.length === 6) { 
        try { 
            let res = await fetch(`https://api.postalpincode.in/pincode/${pin}`); 
            let data = await res.json(); 
            if(data[0].Status === 'Success') { 
                let city = data[0].PostOffice[0].District.toUpperCase();
                let state = data[0].PostOffice[0].State.toUpperCase();
                document.getElementById('r_city').value = city; 
                document.getElementById('r_state').value = state; 
                localStorage.setItem('pin_' + pin, JSON.stringify({city: city, state: state}));
            } 
        } catch(e) {} 
    } 
}

async function fetchSenderCityState() { 
    let pin = document.getElementById('s_pin').value; 
    if(pin.length === 6) { 
        try { 
            let res = await fetch(`https://api.postalpincode.in/pincode/${pin}`); 
            let data = await res.json(); 
            if(data[0].Status === 'Success') { 
                document.getElementById('s_city').value = data[0].PostOffice[0].District.toUpperCase(); 
                document.getElementById('s_state').value = data[0].PostOffice[0].State.toUpperCase(); 
                autoSaveSender();
            } 
        } catch(e) {} 
    } 
}
