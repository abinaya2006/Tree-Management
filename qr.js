// Global variables
let currentQRCode = null;
let currentUser = null;
let userCollege = "college_123"; // Replace with actual college ID from context

// Handle auth state
auth.onAuthStateChanged(user => {
  currentUser = user;
});

// GENERATE QR CODE (on form input change)
function generateQRCodePreview() {
  const treeName = document.getElementById('treeName').value;
  const treeSpecies = document.getElementById('treeSpecies').value;
  const treeZone = document.getElementById('treeZone').value;

  // Only show QR if tree name is filled
  if (!treeName) {
    document.getElementById('qrPreviewGroup').style.display = 'none';
    return;
  }

  // Create QR data (can be tree ID, name, or custom data)
  const qrData = `Tree: ${treeName}\nSpecies: ${treeSpecies}\nZone: ${treeZone}`;

  // Clear previous QR
  const container = document.getElementById('qrCodeContainer');
  container.innerHTML = '';

  // Generate new QR code
  currentQRCode = new QRCode(container, {
    text: qrData,
    width: 200,
    height: 200,
    colorDark: '#2c5f2d',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  document.getElementById('qrPreviewGroup').style.display = 'block';
}

// Listen for input changes to update QR preview
document.getElementById('treeName').addEventListener('change', generateQRCodePreview);
document.getElementById('treeSpecies').addEventListener('change', generateQRCodePreview);
document.getElementById('treeZone').addEventListener('change', generateQRCodePreview);

// SUBMIT FORM & UPLOAD QR CODE
document.getElementById('treeForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentUser) {
    alert('Please log in first');
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating tree...';

  try {
    // 1. Capture QR Code as image (convert to data URL)
    const qrImageDataUrl = await captureQRCodeAsImage();

    // 2. Create tree document in Firestore with QR embedded
    const treeRef = await createTreeInFirestore(qrImageDataUrl);

    alert(`✓ Tree created successfully!`);

    // Reset form
    document.getElementById('treeForm').reset();
    document.getElementById('qrPreviewGroup').style.display = 'none';

  } catch (error) {
    console.error('Error creating tree:', error);
    alert('Error: ' + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Tree';
  }
});

// CAPTURE QR CODE AS IMAGE
async function captureQRCodeAsImage() {
  const qrContainer = document.getElementById('qrCodeContainer');
  
  // Use html2canvas to convert QR code to image
  const canvas = await html2canvas(qrContainer, {
    backgroundColor: '#ffffff',
    scale: 2
  });

  // Convert canvas to blob
  return canvas.toDataURL('image/png');
}


// CREATE TREE IN FIRESTORE
async function createTreeInFirestore(qrDataUrl) {
  const treeName = document.getElementById('treeName').value;
  const treeSpecies = document.getElementById('treeSpecies').value;
  const treeZone = document.getElementById('treeZone').value;
  const treeHealth = document.getElementById('treeHealth').value;

  try {
    const treeRef = await db.collection('trees').add({
      collegeId: userCollege,
      commonName: treeName,
      species: treeSpecies,
      genus: treeSpecies.split(' '),
      zoneId: treeZone,
      healthStatus: treeHealth,
      qrCodeDataUrl: qrDataUrl,  // NOW STORES DATA URL STRING DIRECTLY!
      createdBy: currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lat: null,
      lng: null
    });

    await db.collection('auditLog').add({
      collegeId: userCollege,
      userId: currentUser.uid,
      action: 'tree_created',
      resourceId: treeRef.id,
      changes: {
        treeName: treeName,
        hasQRCode: true
      },
      timestamp: new Date().toISOString()
    });

    return treeRef;

  } catch (error) {
    console.error('Error creating tree in Firestore:', error);
    throw new Error('Failed to save tree to database');
  }
}
async function displayTreesWithQRCodes() {
  try {
    const snapshot = await db.collection('trees')
      .where('collegeId', '==', userCollege)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    let html = '<h3>Recent Trees with QR Codes</h3><div style="display:grid;gap:15px;">';

    snapshot.forEach(doc => {
      const tree = doc.data();
      html += `
        <div style="padding:15px;border:1px solid #ddd;border-radius:6px;">
          <h4>${tree.commonName}</h4>
          <p><strong>Species:</strong> ${tree.species}</p>
          <p><strong>Zone:</strong> ${tree.zoneId}</p>
          <p><strong>Health:</strong> ${tree.healthStatus}</p>
          ${tree.qrCodeDataUrl ? `
            <div style="margin-top:10px;">
              <img src="${tree.qrCodeDataUrl}" alt="QR Code" style="width:150px;height:150px;border:1px solid #ddd;padding:5px;">
              <br>
              <small>
                <a href="${tree.qrCodeDataUrl}" download="qr_${tree.commonName}.png">Download QR Code</a>
              </small>
            </div>
          ` : '<p style="color:#f00;">No QR code yet</p>'}
        </div>
      `;
    });

    html += '</div>';

    const container = document.getElementById('treesContainer');
    if (container) {
      container.innerHTML = html;
    }

  } catch (error) {
    console.error('Error displaying trees:', error);
  }
}

