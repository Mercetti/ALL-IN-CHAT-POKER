/**
 * Simple Update Server for Direct APK Distribution
 * Enables over-the-air updates without Play Store
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.UPDATE_PORT || 3001;

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'updates');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `acey-control-${timestamp}.apk`);
  }
});

const upload = multer({ storage });

// Update information storage
const updateInfoFile = path.join(__dirname, 'update-info.json');

function loadUpdateInfo() {
  try {
    if (fs.existsSync(updateInfoFile)) {
      return JSON.parse(fs.readFileSync(updateInfoFile, 'utf8'));
    }
  } catch (error) {
    console.error('Failed to load update info:', error);
  }
  return {
    version: '1.0.0',
    downloadUrl: null,
    releaseNotes: 'Initial release',
    mandatory: false,
    lastUpdated: new Date().toISOString()
  };
}

function saveUpdateInfo(info) {
  try {
    fs.writeFileSync(updateInfoFile, JSON.stringify(info, null, 2));
  } catch (error) {
    console.error('Failed to save update info:', error);
  }
}

// Middleware
app.use(express.json());
app.use(express.static('updates'));

// Routes
app.get('/api/version', (req, res) => {
  const updateInfo = loadUpdateInfo();
  res.json(updateInfo);
});

app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'updates', filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, (err) => {
      if (err) {
        console.error('Download failed:', err);
        res.status(500).json({ error: 'Download failed' });
      }
    });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.get('/api/updates', (req, res) => {
  const updatesDir = path.join(__dirname, 'updates');
  
  if (!fs.existsSync(updatesDir)) {
    return res.json({ updates: [] });
  }
  
  const files = fs.readdirSync(updatesDir)
    .filter(file => file.endsWith('.apk'))
    .map(file => {
      const filePath = path.join(updatesDir, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        size: stats.size,
        uploadDate: stats.mtime.toISOString(),
        downloadUrl: `/api/download/${file}`
      };
    })
    .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
  
  res.json({ updates: files });
});

app.post('/api/upload', upload.single('apk'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const { version, releaseNotes, mandatory = false } = req.body;
  
  if (!version) {
    return res.status(400).json({ error: 'Version is required' });
  }
  
  const updateInfo = {
    version,
    downloadUrl: `/api/download/${req.file.filename}`,
    releaseNotes: releaseNotes || `Version ${version}`,
    mandatory: mandatory === 'true',
    lastUpdated: new Date().toISOString(),
    filename: req.file.filename,
    fileSize: req.file.size
  };
  
  saveUpdateInfo(updateInfo);
  
  console.log(`📦 Update uploaded: ${version} (${req.file.filename})`);
  
  res.json({
    success: true,
    update: updateInfo
  });
});

app.delete('/api/update/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'updates', filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️ Update deleted: ${filename}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Admin interface
app.get('/admin', (req, res) => {
  const updateInfo = loadUpdateInfo();
  const updatesDir = path.join(__dirname, 'updates');
  
  let existingFiles = [];
  if (fs.existsSync(updatesDir)) {
    existingFiles = fs.readdirSync(updatesDir)
      .filter(file => file.endsWith('.apk'))
      .map(file => {
        const filePath = path.join(updatesDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
          uploadDate: stats.mtime.toLocaleString(),
          isCurrent: file === updateInfo.filename
        };
      })
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Acey Control Update Server</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .card { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            .btn:hover { background: #0056b3; }
            .file-list { list-style: none; padding: 0; }
            .file-item { background: white; padding: 10px; margin: 5px 0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
            .current { background: #d4edda; }
        </style>
    </head>
    <body>
        <h1>🚀 Acey Control Update Server</h1>
        
        <div class="card">
            <h2>📦 Current Update</h2>
            <p><strong>Version:</strong> ${updateInfo.version}</p>
            <p><strong>Release Notes:</strong> ${updateInfo.releaseNotes}</p>
            <p><strong>Last Updated:</strong> ${new Date(updateInfo.lastUpdated).toLocaleString()}</p>
            <p><strong>Mandatory:</strong> ${updateInfo.mandatory ? 'Yes' : 'No'}</p>
            ${updateInfo.downloadUrl ? `<p><strong>Download URL:</strong> <a href="${updateInfo.downloadUrl}">${updateInfo.downloadUrl}</a></p>` : ''}
        </div>
        
        <div class="card">
            <h2>📤 Upload New Update</h2>
            <form action="/api/upload" method="post" enctype="multipart/form-data">
                <div style="margin-bottom: 10px;">
                    <label>Version: <input type="text" name="version" required placeholder="1.2.3"></label>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>APK File: <input type="file" name="apk" accept=".apk" required></label>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Release Notes: <textarea name="releaseNotes" rows="3" cols="50"></textarea></label>
                </div>
                <div style="margin-bottom: 10px;">
                    <label><input type="checkbox" name="mandatory" value="true"> Mandatory Update</label>
                </div>
                <button type="submit" class="btn">📤 Upload Update</button>
            </form>
        </div>
        
        <div class="card">
            <h2>📋 Available Updates</h2>
            ${existingFiles.length > 0 ? `
                <ul class="file-list">
                    ${existingFiles.map(file => `
                        <li class="file-item ${file.isCurrent ? 'current' : ''}">
                            <div>
                                <strong>${file.filename}</strong><br>
                                <small>${file.size} • ${file.uploadDate}</small>
                                ${file.isCurrent ? '<br><small>📍 Current Version</small>' : ''}
                            </div>
                            <div>
                                <a href="/api/download/${file.filename}" class="btn">⬇️ Download</a>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            ` : '<p>No updates uploaded yet.</p>'}
        </div>
        
        <div class="card">
            <h2>📱 App Integration</h2>
            <p>Add this to your app to check for updates:</p>
            <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px;">
const checkForUpdates = async () => {
  try {
    const response = await fetch('http://localhost:${PORT}/api/version');
    const update = await response.json();
    
    // Compare with current version and prompt user
    if (update.version > currentVersion) {
      // Show update dialog
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
};
            </pre>
        </div>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Update server running on http://localhost:${PORT}`);
  console.log(`📱 Admin interface: http://localhost:${PORT}/admin`);
  console.log(`📦 Version API: http://localhost:${PORT}/api/version`);
});

module.exports = app;
