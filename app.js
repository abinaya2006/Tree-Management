
let zoneList = {};

// REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCNV72D3X6ecI3tpqnPt4CUWJzrLo83Bkc",
    authDomain: "try-firebase-bdb77.firebaseapp.com",
    projectId: "try-firebase-bdb77",
    storageBucket: "try-firebase-bdb77.firebasestorage.app",
    // storageBucket: "try-firebase-bdb77.appspot.com",
    messagingSenderId: "327656427702",
    appId: "1:327656427702:web:c2bf0fff68d18460029617",
    measurementId: "G-KWBQWMT4GJ"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let treeUrl;

let currentUser = null;
let userRole = null;
let userCollege = null;


document.addEventListener('DOMContentLoaded', function() {
    // Check current page
    const currentPage = window.location.pathname;
    const isAdminPage = currentPage.includes("admin.html");
    const isCaretakerPage = currentPage.includes("caretaker.html");
    
    if (isAdminPage || isCaretakerPage) {
        // On protected pages, wait for auth check
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                // Not logged in, redirect to index.html
                window.location.href = "index.html";
                return;
            }
            
            // User is logged in, continue with normal flow
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                userRole = userData.role;
                userCollege = userData.collegeId;
                
                // Check if user has access to this page
                if (isAdminPage && userRole !== "admin") {
                    alert("Access denied! Admins only.");
                    window.location.href = "index.html";
                    return;
                }
                
                if (isCaretakerPage && userRole !== "caretaker") {
                    alert("Access denied! Caretakers only.");
                    window.location.href = "index.html";
                    return;
                }
                
                // User has correct role, load content
                loadStats();
                await loadZonesForDropdown();
                await viewAllTrees();
                
                // Show dashboard if it exists
                const dashboard = document.getElementById('dashboard');
                if (dashboard) {
                    dashboard.style.display = 'block';
                }
            } else {
                // User document doesn't exist, log out
                await auth.signOut();
                window.location.href = "index.html";
            }
        });
    }
});


// SIGNIN
// SIGNIN - SIMPLIFIED VERSION
async function signin() {
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;

    // Validate inputs
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    try {
        // Show loading state
        const signinBtn = document.querySelector('button[onclick="signin()"]');
        const originalText = signinBtn.textContent;
        signinBtn.textContent = 'Signing in...';
        signinBtn.disabled = true;

        // Sign in with Firebase
        await auth.signInWithEmailAndPassword(email, password);
        
        // Success - auth state change will handle redirection
        console.log('Signed in successfully');
        
    } catch (error) {
        console.error('Signin error:', error);
        
        // User-friendly error messages
        let errorMessage = 'Sign-in failed. ';
        
        switch(error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMessage += 'Invalid email or password.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email format.';
                break;
            case 'auth/user-disabled':
                errorMessage += 'This account has been disabled.';
                break;
            case 'auth/too-many-requests':
                errorMessage += 'Too many attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                errorMessage += 'Network error. Please check your connection.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
        
        // Reset button
        const signinBtn = document.querySelector('button[onclick="signin()"]');
        signinBtn.textContent = originalText;
        signinBtn.disabled = false;
    }
}

// LOGOUT
async function logout() {
    try {
        await auth.signOut();
        window.location.href = "index.html";

    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// TOGGLE FORM
function toggleForm() {
    document.getElementById('signupForm').classList.toggle('hidden');
    document.getElementById('signinForm').classList.toggle('hidden');
}

// MONITOR AUTH STATE
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            userRole = userData.role;
            userCollege = userData.collegeId;
            
            // Only redirect from index.html
            const currentPage = window.location.pathname;
            if (currentPage.includes("index.html") || currentPage === "/") {
                if (userRole === "admin") {
                    window.location.href = "admin.html";
                }
                else if (userRole === "caretaker") {
                    window.location.href = "caretaker.html";
                }
            }
        }
    } else {
        currentUser = null;
        // Only show/hide login elements if they exist (on index.html)
        const loginPage = document.getElementById('loginPage');
        const dashboard = document.getElementById('dashboard');
        
        if (loginPage) loginPage.classList.remove('hidden');
        if (dashboard) dashboard.classList.add('hidden');
    }
});
// LOAD STATS
async function loadStats() {
    const snapshot = await db.collection('trees').where('collegeId', '==', userCollege).get();
    
    let total = 0, healthy = 0, needsCare = 0;
    snapshot.forEach(doc => {
        const tree = doc.data();
        total++;
        if (tree.healthStatus === 'healthy') healthy++;
        if (['poor', 'dying'].includes(tree.healthStatus)) needsCare++;
    });

    document.getElementById('totalTrees').textContent = total;
    document.getElementById('healthyTrees').textContent = healthy;
    document.getElementById('needsCareTrees').textContent = needsCare;
}

async function addTree() {
    
    const name = document.getElementById('treeName').value
    const genus = document.getElementById('genus').value
    const species = document.getElementById('species').value
    const dbh = document.getElementById('dbh').value
    const height = document.getElementById('height').value
    const count = document.getElementById('count').value
    const zoneId = document.getElementById('zoneSelect').value


    

    if (name && count && zoneId) {
        try {
            const treeRef = await db.collection('trees').add({
                collegeId: userCollege,
                commonName: name,
                genus, species, dbh, height,
                zoneId:zoneId,
                // ageClass: 'mature',
                healthStatus: 'healthy',
                healthScore: 100,
                location: { lat: 40.599, lng: -75.290 },
                createdBy: currentUser.uid,
                createdAt: new Date().toISOString()
            });
    
            
            alert('✓ Tree added!');
            closeTreeModal()
            loadStats();
        } catch (error) {
                console.error("Firestore error:", error);
            alert('Error: ' + error.message);
        }
    }
}



async function checkZonesWithoutCaretakers() {
    if (!userCollege) return null;
    
    try {
        // Get all zones for this college
        const zonesSnapshot = await db.collection('zones')
            .where('collegeId', '==', userCollege)
            .get();
        
        const zonesWithoutCaretakers = [];
        
        // Get all caretaker IDs to check if they exist
        const caretakerIds = [];
        zonesSnapshot.forEach(doc => {
            const zoneData = doc.data();
            if (zoneData.caretakerId && zoneData.caretakerId !== '') {
                caretakerIds.push(zoneData.caretakerId);
            }
        });
        
        // Check which caretaker IDs actually exist
        const existingCaretakers = new Set();
        if (caretakerIds.length > 0) {
            const caretakersSnapshot = await db.collection('users')
                .where('role', '==', 'caretaker')
                .where('collegeId', '==', userCollege)
                .get();
            
            caretakersSnapshot.forEach(doc => {
                existingCaretakers.add(doc.id);
            });
        }
        
        // Now check each zone
        zonesSnapshot.forEach(doc => {
            const zoneData = doc.data();
            const zoneId = doc.id;
            const caretakerId = zoneData.caretakerId;
            
            // Zone has no caretaker OR caretaker doesn't exist
            if (!caretakerId || caretakerId === '' || !existingCaretakers.has(caretakerId)) {
                zonesWithoutCaretakers.push({
                    id: zoneId,
                    name: zoneData.name || 'Unnamed Zone',
                    caretakerId: caretakerId
                });
                
                // If caretaker doesn't exist, update the zone to remove the invalid caretakerId
                if (caretakerId && caretakerId !== '' && !existingCaretakers.has(caretakerId)) {
                    db.collection('zones').doc(zoneId).update({
                        caretakerId: ''
                    }).catch(err => console.error("Error updating zone:", err));
                }
            }
        });
        
        return zonesWithoutCaretakers;
    } catch (error) {
        console.error("Error checking zones without caretakers:", error);
        return null;
    }
}

// VIEW ALL TREES
async function viewAllTrees() {
    let query = db.collection('trees').where('collegeId', '==', userCollege);
    const zonesWithoutCaretakers = await checkZonesWithoutCaretakers();
    // Get filter values
    const zoneFilter = document.getElementById('zoneFilter') ? document.getElementById('zoneFilter').value : '';
    const healthFilter = document.getElementById('healthFilter') ? document.getElementById('healthFilter').value : '';
    
    // Apply zone filter if selected
    if (zoneFilter) {
        query = query.where('zoneId', '==', zoneFilter);
    }
    
    // Note: We can't chain multiple where() with different fields in basic plan
    // So we'll filter health status in JavaScript
    const snapshot = await query.get();
    

    // Create warning message for zones without caretakers
    let warningMessage = '';
    if (zonesWithoutCaretakers && zonesWithoutCaretakers.length > 0) {
        warningMessage = `
            <div style="background: #fff8e1; border-left: 4px solid #ff9800; padding: 12px 16px; margin-bottom: 20px; border-radius: 6px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="font-size: 18px;">⚠️</span>
                    <strong style="color: #e65100;">Action Required: Zones without Caretakers</strong>
                </div>
                <div style="color: #5d4037; font-size: 14px; margin-bottom: 10px;">
                    The following zones don't have assigned caretakers. Please assign caretakers to these zones for proper management.
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
                    ${zonesWithoutCaretakers.map(zone => `
                        <span style="background: #ffecb3; color: #5d4037; padding: 4px 12px; border-radius: 20px; font-size: 13px; border: 1px solid #ffd54f;">
                            ${zone.name}
                        </span>
                    `).join('')}
                </div>
                <button onclick="showAddCare()" style="background: #ff9800; color: white; border: none; border-radius: 4px; padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                    <span>+</span>
                    Assign Caretakers Now
                </button>
            </div>
        `;
    }

    // Create filter controls HTML with improved layout
    let filterControls = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
            <div style="flex: 1; min-width: 250px;">
                <h2 style="margin: 0; color: #2c5f2d; font-size: 20px; font-weight: 600;">All Trees</h2>
                <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Manage and view all campus trees</p>
            </div>
            
            <div style="display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
                <div>
                    <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #495057; font-size: 13px;">Filter by Zone</label>
                    <select id="zoneFilter" style="padding: 8px 12px; border: 1px solid #ced4da; border-radius: 6px; font-size: 13px; width: 180px; background: white; color: #495057;">
                        <option value="">All Zones</option>
    `;
    
    // Add zone options to filter
    for (const [zoneId, zoneName] of Object.entries(zoneList)) {
        filterControls += `<option value="${zoneId}" ${zoneFilter === zoneId ? 'selected' : ''}>${zoneName}</option>`;
    }
    
    filterControls += `
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #495057; font-size: 13px;">Filter by Health</label>
                    <select id="healthFilter" style="padding: 8px 12px; border: 1px solid #ced4da; border-radius: 6px; font-size: 13px; width: 160px; background: white; color: #495057;">
                        <option value="">All Status</option>
                        <option value="healthy" ${healthFilter === 'healthy' ? 'selected' : ''}>Healthy</option>
                        <option value="fair" ${healthFilter === 'fair' ? 'selected' : ''}>Fair</option>
                        <option value="poor" ${healthFilter === 'poor' ? 'selected' : ''}>Poor</option>
                        <option value="dying" ${healthFilter === 'dying' ? 'selected' : ''}>Dying</option>
                    </select>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="applyFilters()" style="padding: 8px 16px; background: #2c5f2d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: background 0.2s; white-space: nowrap;">
                        Apply Filters
                    </button>
                    <button onclick="clearFilters()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: background 0.2s; white-space: nowrap;">
                        Clear Filters
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Create table
    let html = warningMessage + filterControls + `
        <div style="overflow-x: auto;  border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                <thead>
                  <tr><th>Name</th><th>Species</th><th>Zone</th><th>Health</th><th>DBH (cm)</th><th>Height (m)</th><th>Option</th></tr>
                </thead>
                <tbody>
    `;
    
    let treeCount = 0;
    snapshot.forEach(doc => {
        const tree = doc.data();
        const treeId = doc.id;
        
        // Apply health filter in JavaScript
        if (healthFilter && tree.healthStatus !== healthFilter) {
            return;
        }
        
        treeCount++;
        const healthColor = tree.healthStatus === 'healthy' ? '#28a745' : 
                           tree.healthStatus === 'fair' ? '#ffc107' : 
                           tree.healthStatus === 'poor' ? '#fd7e14' : '#dc3545';
        
        const zoneName = zoneList[tree.zoneId] || 'Unknown Zone';
        
        html += `
            <tr style="border-bottom: 1px solid #dee2e6; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                <td style="padding: 14px 16px; color: #212529; font-size: 14px; font-weight: 500;">${tree.commonName || 'Unnamed'}</td>
                <td style="padding: 14px 16px; color: #495057; font-size: 14px;">${tree.genus || ''} ${tree.species || ''}</td>
                <td style="padding: 14px 16px; color: #495057; font-size: 14px;">${zoneName}</td>
                <td style="padding: 14px 16px;">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; background: ${healthColor}20; color: ${healthColor}; border: 1px solid ${healthColor}40;">
                        ${tree.healthStatus || 'Unknown'}
                    </span>
                </td>
                <td style="padding: 14px 16px; color: #495057; font-size: 14px; font-weight: 500;">${tree.dbh || '-'}</td>
                <td style="padding: 14px 16px; color: #495057; font-size: 14px; font-weight: 500;">${tree.height || '-'}</td>
                <td style="padding: 14px 16px;">
                    <button onclick="viewTree('${treeId}')" style="padding: 6px 14px; background: #2c5f2d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; transition: background 0.2s;">
                        View Details
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table></div>`;
    
    // Add tree count summary
    html += `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding: 12px 16px; background: #f8f9fa; border-radius: 6px; border: 1px solid #dee2e6;">
            <div style="color: #495057; font-size: 14px;">
                <span style="font-weight: 600;">${treeCount}</span> tree${treeCount !== 1 ? 's' : ''} found
            </div>
            <div style="font-size: 13px; color: #6c757d;">
                ${zoneFilter ? `Filtered by zone: ${zoneList[zoneFilter] || zoneFilter}` : healthFilter ? `Filtered by health: ${healthFilter}` : 'Showing all trees'}
            </div>
        </div>
    `;
    
    if (treeCount === 0) {
        html += `
            <div style="text-align: center; padding: 40px 20px; background: white; border-radius: 8px; border: 1px solid #dee2e6; margin-top: 20px;">
                <div style="color: #6c757d; font-size: 16px; margin-bottom: 8px;">🌳</div>
                <div style="color: #6c757d; font-size: 15px; font-weight: 500; margin-bottom: 8px;">No trees found</div>
                <div style="color: #adb5bd; font-size: 13px;">Try adjusting your filters or add new trees</div>
            </div>
        `;
    }
    
    document.getElementById('treeListContainer').innerHTML = html;
}

// Function to apply filters
function applyFilters() {
    viewAllTrees();
}

// Function to clear filters
function clearFilters() {
    // Clear filter dropdowns
    const zoneFilter = document.getElementById('zoneFilter');
    const healthFilter = document.getElementById('healthFilter');
    
    if (zoneFilter) zoneFilter.value = '';
    if (healthFilter) healthFilter.value = '';
    
    // Reload trees without filters
    viewAllTrees();
}

function viewTree(treeId){
    if (treeId) {
        window.open(`tree.html?treeId=${treeId}`, '_blank');
    } else {
        window.open('tree.html', '_blank');
    }
}

async function addZone() {
    
    const name = document.getElementById('zonename').value
    const desc = document.getElementById('zoneDescription').value

    if (name ) {
        try {
            await db.collection('zones').add({
                collegeId: userCollege,
                name:name,
                description:desc,
                caretakerId:'',
                createdBy: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('✓ Zone added!');
            closeZoneModal()
            loadStats();
            loadZonesForDropdown()
        } catch (error) {
                console.error("Firestore error:", error);
            alert('Error: ' + error.message);
        }
    }
}

async function loadZonesForDropdown() {
    const zoneSelect = document.getElementById('zoneSelect');
    
    // Clear existing options except the placeholder
    zoneSelect.innerHTML = '<option value="">-- Choose a Zone --</option>';

    if (!userCollege) {
        console.error("userCollege not set!");
        return;
    }

    try {
        const snapshot = await db.collection('zones')
            .where('collegeId', '==', userCollege)
            .get();

        snapshot.forEach(doc => {
            const zone = doc.data();
            zoneList[doc.id] = doc.data().name;
            const option = document.createElement('option');
            option.value = doc.id; // you can store the zone document ID
            option.textContent = zone.name;

            const hasCaretaker = !!zone.caretakerId && zone.caretakerId !== '';
            option.textContent = zone.name + (hasCaretaker ? '' : ' ⚠️');

            zoneSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading zones:", error);
    }

    document.getElementById('zoneSelect').addEventListener('change', async function() {
    const zoneId = this.value;
    if (!zoneId) {
        document.getElementById('showzoneDescription').value = '';
        return;
    }

    try {
        const zoneDoc = await db.collection('zones').doc(zoneId).get();
        if (zoneDoc.exists) {
            document.getElementById('showzoneDescription').value = zoneDoc.data().description;
        }
    } catch (error) {
        console.error(error);
    }
});

}


async function addCare() {
    const name = document.getElementById('caretakername').value
    const email = document.getElementById('caretakerEmail').value
    const zoneId = document.getElementById('caretakerZoneSelect').value;

    const user = auth.currentUser;
    if (!user) { alert("Not logged in"); return; }



    if (name && email && zoneId) {
        try {
            const secondaryApp = firebase.initializeApp(firebaseConfig, "Secondary");
            const secondaryAuth = secondaryApp.auth();

            const result = await secondaryAuth.createUserWithEmailAndPassword(
                email,
                "password123"
            );
            const caretakerUid = result.user.uid;

            secondaryApp.delete(); 

            await db.collection('users').doc(caretakerUid).set({
                collegeId: userCollege,
                name:name,
                email:email,
                role:"caretaker",
                zoneId:zoneId,
                createdBy: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await db.collection('zones').doc(zoneId).update({
                caretakerId:caretakerUid
            })
            

            alert('✓ Caretaker added!');
            closeCareModal()
            loadStats();
        } catch (error) {
                console.error("Firestore error:", error);
            alert('Error: ' + error.message);
        }
    }

    else {
        alert('Please fill all fields including zone assignment');
    }
}

// Wait for DOM to be fully loaded
// document.addEventListener('DOMContentLoaded', function() {
//     const qrButton = document.getElementById('qrButton');
    
//     if (qrButton) {
//         qrButton.addEventListener('click', function(e) {
//             e.preventDefault();
            
//             // Check if QRCode library is loaded
//             if (typeof QRCode === 'undefined') {
//                 alert('QRCode library not loaded. Please check your internet connection.');
//                 console.error('QRCode is not defined. Library not loaded.');
//                 return;
//             }
            
//             const url = 'https://www.youtube.com/watch?v=qNiUlml9MDk';
//             const size = 300;
            
//             console.log('Generating QR code for:', url);
            
//             generateQr(url, size);
//         });
//     } else {
//         console.error('qrButton not found');
//     }
// });

// const generateQr = (url, size) => {
//     // Clear previous QR code if exists
//     const container = document.getElementById('qroutput');
//     if (!container) {
//         console.error('Element with id "qrcode" not found');
//         return;
//     }
    
//     container.innerHTML = ''; // Clear previous content
    
//     try {
//         // Create QR code
//         const qrcode = new QRCode(container, {
//             text: url,
//             width: size,
//             height: size,
//             colorDark: "#000000",
//             colorLight: "#ffffff",
//             correctLevel: QRCode.CorrectLevel.H
//         });
        
//         console.log('QR code generated successfully');
        
//         // Add a download button
//         setTimeout(() => {
//             const qrImg = container.querySelector('img');
//             if (qrImg) {
//                 addDownloadButton(qrImg.src, 'tree-qr-code.png');
//             }
//         }, 100);
        
//     } catch (error) {
//         console.error('Error generating QR code:', error);
        
//         // Fallback: Show the URL
//         container.innerHTML = `
//             <div style="padding: 20px; border: 1px solid #ccc; background: #f9f9f9;">
//                 <h4>QR Code Data</h4>
//                 <p style="word-break: break-all;">${url}</p>
//                 <p><small>Error: Could not generate QR code. ${error.message}</small></p>
//                 <button onclick="window.open('https://www.qr-code-generator.com/', '_blank')" 
//                         style="padding: 5px 10px; margin-top: 10px;">
//                     Generate QR Online
//                 </button>
//             </div>
//         `;
//     }
// };

async function loadZonesForCaretakerDropdown() {
   const zoneSelect = document.getElementById('caretakerZoneSelect');
    
    // Clear existing options except the placeholder
    zoneSelect.innerHTML = '<option value="">-- Choose a Zone --</option>';

    if (!userCollege) {
        console.error("userCollege not set!");
        return;
    }

    try {
        const snapshot = await db.collection('zones')
            .where('collegeId', '==', userCollege)
            .get();

        snapshot.forEach(doc => {
            const zone = doc.data();
            zoneList[doc.id] = doc.data().name;
            const option = document.createElement('option');
            option.value = doc.id; // you can store the zone document ID
            option.textContent = zone.name;
            zoneSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading zones:", error);
    }

    document.getElementById('caretakerZoneSelect').addEventListener('change', async function() {
    const zoneId = this.value;
    if (!zoneId) {
        document.getElementById('showzoneDescription').value = '';
        return;
    }

    try {
        const zoneDoc = await db.collection('zones').doc(zoneId).get();
        if (zoneDoc.exists) {
            document.getElementById('showzoneDescription').value = zoneDoc.data().description;
        }
    } catch (error) {
        console.error(error);
    }
});

}

// Modal buttons
function showAddZone() {
                 document.getElementById("zonemodal").classList.add("active");
}

function closeZoneModal() {
    document.getElementById("zonemodal").classList.remove("active");
}
function showAddCare() {
            document.getElementById("caremodal").classList.add("active");
            loadZonesForCaretakerDropdown();
}

function closeCareModal() {
    document.getElementById("caremodal").classList.remove("active");
}

function showAddTree() {
    document.getElementById("treemodal").classList.add("active");

}



function closeTreeModal() {
    document.getElementById("treemodal").classList.remove("active");
}