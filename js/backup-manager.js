// Backup Manager - Daily Data Backup System with Google Drive Integration
const BackupManager = {
    supabaseClient: null,
    backupInterval: null,
    lastBackupDate: null,
    googleDriveClient: null,
    isGoogleDriveAuthenticated: false,
    selectedFolderId: null,
    selectedFolderName: null,

    async init() {
        // Get Supabase client
        if (window.sharedSupabaseClient) {
            this.supabaseClient = window.sharedSupabaseClient;
        } else if (window.supabaseClient) {
            this.supabaseClient = window.supabaseClient;
        } else if (typeof supabase !== 'undefined' && typeof CONFIG !== 'undefined') {
            this.supabaseClient = supabase.createClient(
                CONFIG.SUPABASE_URL,
                CONFIG.SUPABASE_ANON_KEY
            );
        }

        // Load backup settings
        this.loadBackupSettings();
        
        // Initialize Google Drive API
        await this.initGoogleDrive();
        
        // Check if daily backup is enabled
        if (this.isDailyBackupEnabled()) {
            this.scheduleDailyBackup();
        }
    },

    async initGoogleDrive() {
        // Load Google Drive API script if not already loaded
        if (typeof gapi === 'undefined') {
            await this.loadGoogleDriveAPI();
        }

        // Check for existing auth token
        const authToken = localStorage.getItem('google_drive_access_token');
        if (authToken) {
            this.isGoogleDriveAuthenticated = true;
            // Load saved folder preference
            const savedFolderId = localStorage.getItem('google_drive_backup_folder_id');
            const savedFolderName = localStorage.getItem('google_drive_backup_folder_name');
            if (savedFolderId) {
                this.selectedFolderId = savedFolderId;
                this.selectedFolderName = savedFolderName;
            }
            this.updateGoogleDriveUI();
        }
    },

    loadGoogleDriveAPI() {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src*="apis.google.com"]')) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                gapi.load('client:auth2', () => {
                    resolve();
                });
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    async authenticateGoogleDrive() {
        try {
            // Get Google Client ID from config or prompt user
            const clientId = CONFIG?.GOOGLE_DRIVE_CLIENT_ID || 
                           localStorage.getItem('google_drive_client_id') ||
                           prompt('Please enter your Google Drive Client ID (OAuth 2.0):');

            if (!clientId) {
                this.showToast('Google Drive Client ID is required', 'error');
                return false;
            }

            // Store client ID
            localStorage.setItem('google_drive_client_id', clientId);

            // Initialize Google API client with broader scope for folder selection
            await gapi.client.init({
                apiKey: CONFIG?.GOOGLE_API_KEY || '',
                clientId: clientId,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly'
            });

            const authInstance = gapi.auth2.getAuthInstance();
            const user = authInstance.currentUser.get();

            if (!user.isSignedIn()) {
                await authInstance.signIn();
            }

            const accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
            localStorage.setItem('google_drive_access_token', accessToken);
            this.isGoogleDriveAuthenticated = true;
            
            // Load saved folder preference
            const savedFolderId = localStorage.getItem('google_drive_backup_folder_id');
            const savedFolderName = localStorage.getItem('google_drive_backup_folder_name');
            if (savedFolderId) {
                this.selectedFolderId = savedFolderId;
                this.selectedFolderName = savedFolderName;
            }
            
            this.updateGoogleDriveUI();
            
            // Prompt for folder selection after authentication
            await this.selectBackupFolder();

            this.showToast('Google Drive authenticated successfully', 'success');
            return true;
        } catch (error) {
            console.error('Error authenticating Google Drive:', error);
            this.showToast(`Google Drive authentication failed: ${error.message}`, 'error');
            return false;
        }
    },

    async disconnectGoogleDrive() {
        try {
            if (gapi && gapi.auth2) {
                const authInstance = gapi.auth2.getAuthInstance();
                if (authInstance.isSignedIn.get()) {
                    await authInstance.signOut();
                }
            }
            localStorage.removeItem('google_drive_access_token');
            localStorage.removeItem('google_drive_backup_folder_id');
            localStorage.removeItem('google_drive_backup_folder_name');
            this.isGoogleDriveAuthenticated = false;
            this.selectedFolderId = null;
            this.selectedFolderName = null;
            this.updateGoogleDriveUI();
            this.showToast('Disconnected from Google Drive', 'info');
        } catch (error) {
            console.error('Error disconnecting Google Drive:', error);
        }
    },

    async uploadToGoogleDrive(blob, fileName, backupInfo) {
        if (!this.isGoogleDriveAuthenticated) {
            const authenticated = await this.authenticateGoogleDrive();
            if (!authenticated) {
                return false;
            }
        }

        try {
            this.showToast('Uploading backup to Google Drive...', 'info');

            // Convert blob to base64
            const base64Data = await this.blobToBase64(blob);

            // Create file metadata with selected folder
            const metadata = {
                name: fileName,
                mimeType: 'application/json',
                parents: this.selectedFolderId ? [this.selectedFolderId] : [] // Upload to selected folder or root
            };

            // Upload file
            const response = await gapi.client.drive.files.create({
                resource: metadata,
                media: {
                    mimeType: 'application/json',
                    body: base64Data.split(',')[1] // Remove data:application/json;base64, prefix
                },
                fields: 'id, name, webViewLink, createdTime'
            });

            const file = response.result;
            backupInfo.googleDriveFileId = file.id;
            backupInfo.googleDriveLink = file.webViewLink;
            backupInfo.googleDriveUploaded = new Date().toISOString();

            // Update backup history
            const backups = JSON.parse(localStorage.getItem('backup_history') || '[]');
            const index = backups.findIndex(b => b.fileName === fileName);
            if (index !== -1) {
                backups[index] = { ...backups[index], ...backupInfo };
                localStorage.setItem('backup_history', JSON.stringify(backups));
            }

            this.showToast('Backup uploaded to Google Drive successfully', 'success');
            this.updateBackupUI();
            return true;
        } catch (error) {
            console.error('Error uploading to Google Drive:', error);
            this.showToast(`Google Drive upload failed: ${error.message}`, 'error');
            return false;
        }
    },

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },

    async selectBackupFolder() {
        if (!this.isGoogleDriveAuthenticated) {
            this.showToast('Please authenticate with Google Drive first', 'error');
            return;
        }

        try {
            // Show folder selection modal
            const modal = document.getElementById('google-drive-folder-modal');
            if (modal) {
                modal.classList.add('active');
                await this.loadGoogleDriveFolders();
            } else {
                // Fallback: prompt for folder ID
                const folderId = prompt('Enter Google Drive Folder ID (or leave empty for root):');
                if (folderId) {
                    this.selectedFolderId = folderId;
                    // Try to get folder name
                    try {
                        const response = await gapi.client.drive.files.get({
                            fileId: folderId,
                            fields: 'name'
                        });
                        this.selectedFolderName = response.result.name;
                    } catch (e) {
                        this.selectedFolderName = 'Custom Folder';
                    }
                    this.saveFolderPreference();
                }
            }
        } catch (error) {
            console.error('Error selecting folder:', error);
            this.showToast('Error selecting folder. Using root folder.', 'warning');
        }
    },

    async loadGoogleDriveFolders() {
        const folderList = document.getElementById('google-drive-folder-list');
        if (!folderList) return;

        try {
            folderList.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Loading folders...</div>';

            // Get root folder option
            let html = `
                <div class="folder-item p-3 border border-slate-200 rounded-lg mb-2 cursor-pointer hover:bg-slate-50 ${!this.selectedFolderId ? 'bg-blue-50 border-blue-300' : ''}" 
                     onclick="BackupManager.selectFolder(null, 'My Drive (Root)')">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-folder text-blue-600"></i>
                        <div class="flex-1">
                            <div class="font-medium text-slate-900">My Drive (Root)</div>
                            <div class="text-xs text-slate-500">Upload to root of Google Drive</div>
                        </div>
                        ${!this.selectedFolderId ? '<i class="fas fa-check text-blue-600"></i>' : ''}
                    </div>
                </div>
            `;

            // List folders
            const response = await gapi.client.drive.files.list({
                q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
                fields: 'files(id, name, parents)',
                pageSize: 100,
                orderBy: 'name'
            });

            const folders = response.result.files || [];
            folders.forEach(folder => {
                const isSelected = this.selectedFolderId === folder.id;
                html += `
                    <div class="folder-item p-3 border border-slate-200 rounded-lg mb-2 cursor-pointer hover:bg-slate-50 ${isSelected ? 'bg-blue-50 border-blue-300' : ''}" 
                         onclick="BackupManager.selectFolder('${folder.id}', '${this.escapeHtml(folder.name)}')">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-folder text-blue-600"></i>
                            <div class="flex-1">
                                <div class="font-medium text-slate-900">${this.escapeHtml(folder.name)}</div>
                                <div class="text-xs text-slate-500">Folder ID: ${folder.id}</div>
                            </div>
                            ${isSelected ? '<i class="fas fa-check text-blue-600"></i>' : ''}
                        </div>
                    </div>
                `;
            });

            folderList.innerHTML = html || '<div class="text-center py-4 text-slate-500">No folders found</div>';
        } catch (error) {
            console.error('Error loading folders:', error);
            folderList.innerHTML = '<div class="text-center py-4 text-red-500">Error loading folders. Please try again.</div>';
        }
    },

    selectFolder(folderId, folderName) {
        this.selectedFolderId = folderId;
        this.selectedFolderName = folderName || 'My Drive (Root)';
        this.saveFolderPreference();
        this.updateGoogleDriveUI();
        
        // Close modal
        const modal = document.getElementById('google-drive-folder-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        
        this.showToast(`Backup folder set to: ${this.selectedFolderName}`, 'success');
    },

    saveFolderPreference() {
        if (this.selectedFolderId) {
            localStorage.setItem('google_drive_backup_folder_id', this.selectedFolderId);
            localStorage.setItem('google_drive_backup_folder_name', this.selectedFolderName);
        } else {
            localStorage.removeItem('google_drive_backup_folder_id');
            localStorage.removeItem('google_drive_backup_folder_name');
        }
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    updateGoogleDriveUI() {
        const authBtn = document.getElementById('backup-google-drive-auth');
        const statusEl = document.getElementById('backup-google-drive-status');
        const actionsDiv = document.getElementById('backup-google-drive-actions');
        const folderBtn = document.getElementById('backup-google-drive-select-folder');
        const disconnectBtn = document.getElementById('backup-google-drive-disconnect');
        const folderInfo = document.getElementById('backup-google-drive-folder-info');

        if (authBtn) {
            authBtn.style.display = this.isGoogleDriveAuthenticated ? 'none' : 'block';
        }
        if (actionsDiv) {
            actionsDiv.style.display = this.isGoogleDriveAuthenticated ? 'flex' : 'none';
        }
        if (statusEl) {
            if (this.isGoogleDriveAuthenticated) {
                statusEl.innerHTML = '<span class="text-green-600"><i class="fas fa-check-circle"></i> Connected</span>';
            } else {
                statusEl.innerHTML = '<span class="text-slate-400"><i class="fas fa-times-circle"></i> Not Connected</span>';
            }
        }
        if (folderInfo) {
            if (this.isGoogleDriveAuthenticated && this.selectedFolderName) {
                folderInfo.innerHTML = `<div class="text-xs text-slate-600 mt-2"><i class="fas fa-folder"></i> ${this.escapeHtml(this.selectedFolderName)}</div>`;
            } else if (this.isGoogleDriveAuthenticated) {
                folderInfo.innerHTML = '<div class="text-xs text-amber-600 mt-2"><i class="fas fa-exclamation-triangle"></i> No folder selected (will use root)</div>';
            } else {
                folderInfo.innerHTML = '';
            }
        }
    },

    loadBackupSettings() {
        const settings = JSON.parse(localStorage.getItem('backup_settings') || '{}');
        this.lastBackupDate = settings.lastBackupDate || null;
        return settings;
    },

    saveBackupSettings(settings) {
        const current = this.loadBackupSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem('backup_settings', JSON.stringify(updated));
        this.lastBackupDate = updated.lastBackupDate;
    },

    isDailyBackupEnabled() {
        const settings = this.loadBackupSettings();
        return settings.dailyBackupEnabled !== false; // Default to enabled
    },

    async createBackup() {
        if (!this.supabaseClient) {
            this.showToast('Database connection not available', 'error');
            return null;
        }

        try {
            this.showToast('Creating backup...', 'info');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                tables: {}
            };

            // List of all tables to backup
            const tables = [
                'assets',
                'work_orders',
                'customers',
                'locations',
                'equipment_types',
                'equipment_makes',
                'equipment_models',
                'pm_frequencies',
                'device_configurations',
                'checklists',
                'checklist_items',
                'depreciation_profiles',
                'work_order_types',
                'technicians',
                'inventory_items',
                'purchase_orders'
            ];

            // Backup each table
            for (const table of tables) {
                try {
                    const { data, error } = await this.supabaseClient
                        .from(table)
                        .select('*');

                    if (error) {
                        console.warn(`Error backing up ${table}:`, error);
                        backupData.tables[table] = { error: error.message, data: [] };
                    } else {
                        backupData.tables[table] = data || [];
                        console.log(`Backed up ${table}: ${(data || []).length} records`);
                    }
                } catch (err) {
                    console.warn(`Error accessing table ${table}:`, err);
                    backupData.tables[table] = { error: err.message, data: [] };
                }
            }

            // Create backup file
            const backupJson = JSON.stringify(backupData, null, 2);
            const backupBlob = new Blob([backupJson], { type: 'application/json' });
            const backupFileName = `merc-cmms-backup-${timestamp}.json`;

            // Save backup info
            const backupInfo = {
                fileName: backupFileName,
                timestamp: new Date().toISOString(),
                size: backupBlob.size,
                recordCount: Object.values(backupData.tables).reduce((sum, table) => {
                    return sum + (Array.isArray(table) ? table.length : (table.data?.length || 0));
                }, 0)
            };

            // Store backup in localStorage (metadata only)
            const backups = JSON.parse(localStorage.getItem('backup_history') || '[]');
            backups.unshift(backupInfo);
            // Keep only last 30 backups in history
            if (backups.length > 30) {
                backups.splice(30);
            }
            localStorage.setItem('backup_history', JSON.stringify(backups));

            // Update last backup date
            this.saveBackupSettings({ lastBackupDate: new Date().toISOString() });

            // Download backup file (always provide local copy)
            this.downloadBackup(backupBlob, backupFileName);

            // Upload to Google Drive (primary storage)
            const googleDriveSuccess = await this.uploadToGoogleDrive(backupBlob, backupFileName, backupInfo);

            // Also try to upload to Supabase Storage if bucket exists (secondary storage)
            await this.uploadToStorage(backupBlob, backupFileName, backupInfo);

            const message = `Backup created: ${backupInfo.recordCount} records`;
            const messageType = googleDriveSuccess ? 'success' : 'warning';
            this.showToast(message + (googleDriveSuccess ? ' (saved to Google Drive)' : ' (local download only)'), messageType);
            this.updateBackupUI();

            return backupInfo;
        } catch (error) {
            console.error('Error creating backup:', error);
            this.showToast(`Error creating backup: ${error.message}`, 'error');
            return null;
        }
    },

    downloadBackup(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    async uploadToStorage(blob, fileName, backupInfo) {
        if (!this.supabaseClient) return;

        try {
            // Try to upload to 'backups' bucket
            const { data, error } = await this.supabaseClient.storage
                .from('backups')
                .upload(fileName, blob, {
                    contentType: 'application/json',
                    upsert: false
                });

            if (error) {
                // If bucket doesn't exist, that's okay - we still have the download
                if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
                    console.log('Backups bucket not found. Backup downloaded only.');
                } else {
                    console.warn('Error uploading backup to storage:', error);
                }
            } else {
                console.log('Backup uploaded to storage:', data.path);
                backupInfo.storagePath = data.path;
                
                // Update backup history with storage path
                const backups = JSON.parse(localStorage.getItem('backup_history') || '[]');
                const index = backups.findIndex(b => b.fileName === fileName);
                if (index !== -1) {
                    backups[index].storagePath = data.path;
                    localStorage.setItem('backup_history', JSON.stringify(backups));
                }
            }
        } catch (error) {
            console.warn('Error uploading to storage (non-critical):', error);
            // Don't fail the backup if storage upload fails
        }
    },

    async restoreBackup(file) {
        if (!this.supabaseClient) {
            this.showToast('Database connection not available', 'error');
            return;
        }

        if (!confirm('WARNING: Restoring a backup will overwrite existing data. This cannot be undone. Are you sure you want to continue?')) {
            return;
        }

        try {
            this.showToast('Reading backup file...', 'info');
            const text = await file.text();
            const backupData = JSON.parse(text);

            if (!backupData.tables || !backupData.version) {
                throw new Error('Invalid backup file format');
            }

            let restoredCount = 0;
            let errorCount = 0;

            // Restore each table
            for (const [tableName, tableData] of Object.entries(backupData.tables)) {
                if (tableData.error) {
                    console.warn(`Skipping ${tableName}: ${tableData.error}`);
                    continue;
                }

                if (!Array.isArray(tableData) || tableData.length === 0) {
                    continue;
                }

                try {
                    // Delete existing data (optional - you might want to keep and merge)
                    // await this.supabaseClient.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');

                    // Insert backup data
                    const { error: insertError } = await this.supabaseClient
                        .from(tableName)
                        .upsert(tableData, { onConflict: 'id' });

                    if (insertError) {
                        console.error(`Error restoring ${tableName}:`, insertError);
                        errorCount++;
                    } else {
                        restoredCount += tableData.length;
                        console.log(`Restored ${tableName}: ${tableData.length} records`);
                    }
                } catch (err) {
                    console.error(`Error restoring ${tableName}:`, err);
                    errorCount++;
                }
            }

            this.showToast(`Restore complete: ${restoredCount} records restored, ${errorCount} errors`, 
                         errorCount > 0 ? 'warning' : 'success');
            
            // Refresh page to show updated data
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Error restoring backup:', error);
            this.showToast(`Error restoring backup: ${error.message}`, 'error');
        }
    },

    toggleDailyBackup(enabled) {
        this.saveBackupSettings({ dailyBackupEnabled: enabled });
        if (enabled) {
            this.scheduleDailyBackup();
        } else {
            if (this.backupInterval) {
                clearInterval(this.backupInterval);
                this.backupInterval = null;
            }
        }
        this.showToast(`Daily backup ${enabled ? 'enabled' : 'disabled'}`, 'info');
    },

    handleRestore() {
        const fileInput = document.getElementById('backup-restore-file');
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            this.showToast('Please select a backup file to restore', 'error');
            return;
        }
        this.restoreBackup(fileInput.files[0]);
    },

    scheduleDailyBackup() {
        // Clear existing interval
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
        }

        // Check if backup is needed (once per day)
        const checkAndBackup = async () => {
            const lastBackup = this.lastBackupDate ? new Date(this.lastBackupDate) : null;
            const now = new Date();
            
            // Check if last backup was more than 24 hours ago
            if (!lastBackup || (now - lastBackup) >= 24 * 60 * 60 * 1000) {
                console.log('Daily backup triggered');
                await this.createBackup();
            }
        };

        // Check immediately
        checkAndBackup();

        // Check every hour
        this.backupInterval = setInterval(checkAndBackup, 60 * 60 * 1000);
    },

    stopDailyBackup() {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
    },

    updateBackupUI() {
        const lastBackupEl = document.getElementById('backup-last-backup');
        const backupHistoryEl = document.getElementById('backup-history-list');

        if (lastBackupEl && this.lastBackupDate) {
            const date = new Date(this.lastBackupDate);
            lastBackupEl.textContent = date.toLocaleString();
        }

        if (backupHistoryEl) {
            const backups = JSON.parse(localStorage.getItem('backup_history') || '[]');
            if (backups.length === 0) {
                backupHistoryEl.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-slate-500">No backups yet</td></tr>';
            } else {
                backupHistoryEl.innerHTML = backups.map(backup => {
                    const date = new Date(backup.timestamp);
                    const sizeKB = (backup.size / 1024).toFixed(2);
                    return `
                        <tr class="hover:bg-slate-50">
                            <td class="px-4 py-3 text-sm text-slate-900">${date.toLocaleString()}</td>
                            <td class="px-4 py-3 text-sm text-slate-600">${backup.recordCount.toLocaleString()} records</td>
                            <td class="px-4 py-3 text-sm text-slate-600">${sizeKB} KB</td>
                            <td class="px-4 py-3 text-sm">
                                ${backup.storagePath ? '<span class="text-green-600"><i class="fas fa-cloud"></i> Stored</span>' : '<span class="text-slate-400">Local only</span>'}
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
    },

    showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    }
};

// Expose globally
window.BackupManager = BackupManager;

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        BackupManager.init();
    });
} else {
    BackupManager.init();
}
