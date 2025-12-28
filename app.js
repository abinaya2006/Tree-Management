
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



// SIGNUP
async function signup() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const name = document.getElementById('signupName').value;
    const college = document.getElementById('collegeName').value;

    if (!email || !password || !name || !college) {
        alert('Please fill all fields');
        return;
    }

    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        const uid = result.user.uid;
        const collegeId = 'college_' + Date.now();

        // Create user doc
        await db.collection('users').doc(uid).set({
            email, displayName: name, role: 'admin', collegeId,
            createdAt: new Date().toISOString()
        });

        // Create college doc
        await db.collection('colleges').doc(collegeId).set({
            name: college,
            location: { lat: 40.599, lng: -75.290 },
            admin_id: uid,
            createdAt: new Date().toISOString()
        });

        alert('✓ Account created! Logging in...');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// SIGNIN
async function signin() {
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        alert('Error: ' + error.message);
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
            
            
            if (userRole === "admin" && !location.pathname.includes("admin")) {
                window.location.href = "admin.html";
            }
            else if (userRole === "caretaker" && !location.pathname.includes("caretaker")) {
                window.location.href = "caretaker.html";
            }

            loadStats();
            await loadZonesForDropdown()
            await viewAllTrees()
        }
    } else {
        currentUser = null;
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
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




// VIEW ALL TREES
async function viewAllTrees() {
    const snapshot = await db.collection('trees').where('collegeId', '==', userCollege).get();
    
    let html = '<h2>All Trees</h2><table><thead><tr><th>Name</th><th>Species</th><th>Zone</th><th>Health</th><th>DBH</th><th>Option</th></tr></thead><tbody>';
    
    snapshot.forEach(doc => {
        const tree = doc.data();
        const healthColor = tree.healthStatus === 'healthy' ? 'green' : tree.healthStatus === 'fair' ? 'orange' : 'red';
        html += `<tr><td>${tree.commonName}</td><td>${tree.genus} ${tree.species}</td><td>${zoneList[tree.zoneId] }</td><td style="color:${healthColor};">${tree.healthStatus}</td><td>${tree.dbh}</td><td><button onclick="viewTree()">View</button></td></tr>`;
    });
    
    html += '</tbody></table>';
    document.getElementById('treeListContainer').innerHTML = html;
}

function viewTree(){
    window.location.href = "tree.html"
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
    const zoneId = document.getElementById('zoneSelect').value;

    const user = auth.currentUser;
    if (!user) { alert("Not logged in"); return; }



    if (name ) {
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