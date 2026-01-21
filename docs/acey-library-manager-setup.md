# 📚 Acey Library Manager Setup Guide

## 🎯 Overview

The Acey Library Manager centralizes all file storage and management for Acey's assets, datasets, and models. This creates a clean, organized structure on the D: drive with automatic archiving and maintenance.

## 📁 Directory Structure

```
D:/AceyLibrary/
├── datasets/     # JSONL training datasets
├── audio/        # Generated audio files
├── images/       # Generated images and graphics
├── models/       # Fine-tuned model files
├── logs/         # System logs and metrics
└── archive/      # Archived old files
    ├── audio/
    ├── images/
    ├── datasets/
    └── models/
```

## 🚀 Quick Setup

### **1. Create Library Directory**
```bash
# Create main library directory
mkdir D:\AceyLibrary

# The system will automatically create subdirectories
```

### **2. Initialize Library Manager**
```typescript
import AceyLibraryManager from "./utils/libraryManager";

// Initialize all folders
AceyLibraryManager.initLibrary();

// Validate setup
const validation = AceyLibraryManager.validateLibrary();
if (!validation.valid) {
  console.error('Library setup issues:', validation.issues);
}
```

### **3. Start the System**
```typescript
import { initializeSystem } from "./server/initialization";

const system = await initializeSystem(config);
console.log('Acey Library Manager ready!');
```

## 🔧 Module Integration

### **Orchestrator Module**
```typescript
import AceyLibraryManager from "./libraryManager";

// Save audio output
const audioFileName = `audio-${Date.now()}.wav`;
const outputPath = path.join(AceyLibraryManager.paths.audio, audioFileName);
AceyLibraryManager.saveFile('audio', audioFileName, audioData);
```

### **AudioCodingOrchestrator Module**
```typescript
const saveOutput = (taskType: TaskType, output: string | Buffer) => {
  let folderName: keyof typeof AceyLibraryManager.paths;
  
  switch(taskType) {
    case 'audio': folderName = 'audio'; break;
    case 'website':
    case 'graphics': folderName = 'datasets'; break;
    case 'images': folderName = 'images'; break;
    default: folderName = 'datasets';
  }

  const fileName = `${taskType}-${Date.now()}.dat`;
  return AceyLibraryManager.saveFile(folderName, fileName, output);
};
```

### **ContinuousLearningLoop Module**
```typescript
// Save approved outputs to JSONL
const datasetPath = path.join(
  AceyLibraryManager.paths.datasets,
  `acey_${taskType.toLowerCase()}.jsonl` 
);

const jsonlEntry = JSON.stringify({
  id: entry.id,
  taskType: entry.taskType,
  prompt: entry.prompt,
  output: entry.output,
  confidence: entry.confidence,
  timestamp: entry.timestamp
});

fs.appendFileSync(datasetPath, jsonlEntry + "\n");
```

### **RealTimeFineTune Module**
```typescript
// Save fine-tuned models
const modelFolder = AceyLibraryManager.paths.models;
const modelName = `finetune-${taskType}-${Date.now()}.pt`;
const modelPath = AceyLibraryManager.saveFile('models', modelName, modelData);
```

### **Dashboard Integration**
```typescript
import AceyLibraryManager from "../../server/utils/libraryManager";

// Get library statistics for dashboard
const stats = AceyLibraryManager.getLibraryStats();
console.log('Library Stats:', stats);
// Output: { audio: 150, datasets: 75, images: 30, models: 5, logs: 1000, archive: 200 }
```

## 📊 Dashboard Features

### **Storage Statistics Display**
```typescript
const LibraryStatsPanel: React.FC = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const updateStats = () => {
      const libraryStats = AceyLibraryManager.getLibraryStats();
      setStats(libraryStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3">Library Statistics</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-sm text-gray-600">Audio Files</span>
          <p className="text-xl font-bold">{stats?.audio || 0}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Datasets</span>
          <p className="text-xl font-bold">{stats?.datasets || 0}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Images</span>
          <p className="text-xl font-bold">{stats?.images || 0}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Models</span>
          <p className="text-xl font-bold">{stats?.models || 0}</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t">
        <span className="text-sm text-gray-600">Total Size</span>
        <p className="text-lg font-semibold">
          {((stats?.totalSize || 0) / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    </div>
  );
};
```

### **Disk Usage Monitor**
```typescript
const DiskUsageMonitor: React.FC = () => {
  const [diskUsage, setDiskUsage] = useState(null);

  useEffect(() => {
    const updateDiskUsage = () => {
      const usage = AceyLibraryManager.getDiskUsage();
      setDiskUsage(usage);
    };

    updateDiskUsage();
    const interval = setInterval(updateDiskUsage, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3">Disk Usage</h3>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-sm">
            <span>Library Usage</span>
            <span>{((diskUsage?.librarySize || 0) / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full"
              style="{% raw %}{{ width: `${Math.min((diskUsage?.librarySize || 0) / 1024 / 1024 / 1000 * 100, 100)}%` }}{% endraw %}"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

## ⚙️ Configuration

### **Archive Configuration**
```typescript
export const ACEY_ARCHIVE_CONFIG = {
  audioOlderThanDays: 30,      // Archive audio after 30 days
  imagesOlderThanDays: 30,     // Archive images after 30 days
  datasetsOlderThanDays: 90,   // Archive datasets after 90 days
  modelsOlderThanDays: 180,    // Archive models after 180 days
};
```

### **Storage Paths**
```typescript
export const ACEY_STORAGE_PATHS = {
  datasets: "D:/AceyLibrary/datasets",
  audio: "D:/AceyLibrary/audio",
  images: "D:/AceyLibrary/images",
  models: "D:/AceyLibrary/models",
  logs: "D:/AceyLibrary/logs",
  archive: "D:/AceyLibrary/archive",
};
```

## 🔄 Automated Maintenance

### **Daily Archiving**
```typescript
// Set up automatic archiving (runs daily)
setInterval(() => {
  const result = AceyLibraryManager.archiveOldFiles();
  
  if (result.archived > 0) {
    console.log(`📦 Archived ${result.archived} files`);
    // Send notification to dashboard
    sendNotification('archive', {
      filesArchived: result.archived,
      folders: result.folders
    });
  }
  
  if (result.errors.length > 0) {
    console.error('Archive errors:', result.errors);
    // Send error notification
    sendNotification('error', {
      type: 'archive_error',
      errors: result.errors
    });
  }
}, 24 * 60 * 60 * 1000); // Daily
```

### **Weekly Cleanup**
```typescript
// Set up weekly cleanup
setInterval(() => {
  AceyLibraryManager.cleanupEmptyFolders();
  console.log('🧹 Cleaned up empty folders');
}, 7 * 24 * 60 * 60 * 1000); // Weekly
```

### **Monthly Backup**
```typescript
// Set up monthly backup
setInterval(() => {
  const backupPath = AceyLibraryManager.createBackup();
  console.log(`💾 Created monthly backup: ${backupPath}`);
  
  // Notify dashboard
  sendNotification('backup', {
    path: backupPath,
    timestamp: new Date()
  });
}, 30 * 24 * 60 * 60 * 1000); // Monthly
```

## 📈 Monitoring & Alerts

### **Storage Alerts**
```typescript
const checkStorageLimits = () => {
  const stats = AceyLibraryManager.getLibraryStats();
  const totalSizeMB = stats.totalSize / 1024 / 1024;
  
  // Alert if library exceeds 10GB
  if (totalSizeMB > 10240) {
    sendNotification('warning', {
      type: 'storage_limit',
      size: totalSizeMB,
      message: 'Library approaching storage limit'
    });
  }
  
  // Alert if any category exceeds 1000 files
  Object.entries(stats).forEach(([category, count]) => {
    if (count > 1000) {
      sendNotification('warning', {
        type: 'category_limit',
        category,
        count,
        message: `${category} has ${count} files`
      });
    }
  });
};
```

### **Health Monitoring**
```typescript
const monitorLibraryHealth = () => {
  const validation = AceyLibraryManager.validateLibrary();
  
  if (!validation.valid) {
    sendNotification('error', {
      type: 'library_health',
      issues: validation.issues,
      missingFolders: validation.missingFolders
    });
  }
};
```

## 🔍 Advanced Features

### **File Search**
```typescript
const searchFiles = (query: string, folder?: keyof typeof ACEY_STORAGE_PATHS) => {
  const searchFolder = folder ? AceyLibraryManager.paths[folder] : null;
  const results: Array<{ path: string; name: string; size: number; modified: Date }> = [];
  
  const searchInFolder = (folderPath: string) => {
    if (!fs.existsSync(folderPath)) return;
    
    const files = fs.readdirSync(folderPath);
    files.forEach(file => {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && file.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          path: filePath,
          name: file,
          size: stats.size,
          modified: stats.mtime
        });
      }
    });
  };
  
  if (searchFolder) {
    searchInFolder(searchFolder);
  } else {
    Object.values(AceyLibraryManager.paths).forEach(searchInFolder);
  }
  
  return results.sort((a, b) => b.modified.getTime() - a.modified.getTime());
};
```

### **File Analytics**
```typescript
const getFileAnalytics = () => {
  const analytics = {
    totalFiles: 0,
    totalSize: 0,
    fileTypeBreakdown: {} as Record<string, { count: number; size: number }>,
    ageDistribution: {
      recent: 0,    // < 7 days
      week: 0,     // 7-30 days
      month: 0,    // 30-90 days
      old: 0       // > 90 days
    }
  };
  
  const now = Date.now();
  
  Object.entries(AceyLibraryManager.paths).forEach(([category, folderPath]) => {
    if (!fs.existsSync(folderPath)) return;
    
    const files = fs.readdirSync(folderPath);
    files.forEach(file => {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        analytics.totalFiles++;
        analytics.totalSize += stats.size;
        
        // File type breakdown
        const ext = path.extname(file).toLowerCase() || 'no-extension';
        if (!analytics.fileTypeBreakdown[ext]) {
          analytics.fileTypeBreakdown[ext] = { count: 0, size: 0 };
        }
        analytics.fileTypeBreakdown[ext].count++;
        analytics.fileTypeBreakdown[ext].size += stats.size;
        
        // Age distribution
        const ageInDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
        if (ageInDays < 7) analytics.ageDistribution.recent++;
        else if (ageInDays < 30) analytics.ageDistribution.week++;
        else if (ageInDays < 90) analytics.ageDistribution.month++;
        else analytics.ageDistribution.old++;
      }
    });
  });
  
  return analytics;
};
```

## 🚨 Troubleshooting

### **Common Issues**

#### **Issue: "Access Denied" errors**
```bash
# Solution: Run as administrator or check folder permissions
icacls "D:\AceyLibrary" /grant Users:(OI)(CI)F
```

#### **Issue: "Disk Full" warnings**
```bash
# Solution: Run manual archive
AceyLibraryManager.archiveOldFiles();

# Or increase archive frequency
setInterval(() => {
  AceyLibraryManager.archiveOldFiles();
}, 12 * 60 * 60 * 1000); // Every 12 hours
```

#### **Issue: "Missing Folders"**
```bash
# Solution: Re-initialize library
AceyLibraryManager.initLibrary();
```

### **Recovery Procedures**
```typescript
// Recover from corruption
const recoverLibrary = () => {
  // 1. Create backup of current state
  const backup = AceyLibraryManager.createBackup(`recovery-${Date.now()}`);
  
  // 2. Validate and repair structure
  AceyLibraryManager.initLibrary();
  
  // 3. Check for orphaned files
  const validation = AceyLibraryManager.validateLibrary();
  
  // 4. Report recovery status
  return {
    backup,
    validation,
    recovered: validation.valid
  };
};
```

---

**Result**: Acey's heavy assets, datasets, and models are now centrally managed on D: with automatic archiving, dashboard integration, and comprehensive monitoring! 🎉
