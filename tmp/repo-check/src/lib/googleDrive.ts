/**
 * Google Drive API helper for Zenoa Vault
 * Uses appDataFolder for private, isolated storage
 */

const VAULT_FILE_NAME = 'zenoa_vault.bin';

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
}

/**
 * Searches for the vault file in the appDataFolder
 */
export async function findVaultFile(accessToken: string): Promise<DriveFileInfo | null> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${VAULT_FILE_NAME}' and trashed=false&spaces=appDataFolder&fields=files(id, name, modifiedTime)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    // Return the latest one if multiple exist (though overwrite should prevent this)
    return data.files.sort((a: any, b: any) => 
      new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
    )[0];
  }
  return null;
}

/**
 * Uploads (or updates) the vault file to appDataFolder
 */
export async function uploadVaultFile(accessToken: string, encryptedData: string, existingFileId?: string): Promise<string> {
  const metadata: any = {
    name: VAULT_FILE_NAME,
    mimeType: 'application/octet-stream',
  };
  
  if (!existingFileId) {
    metadata.parents = ['appDataFolder'];
  }

  const file = new Blob([encryptedData], { type: 'application/octet-stream' });
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  const url = existingFileId 
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  const method = existingFileId ? 'PATCH' : 'POST';

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (data.id) return data.id;
  console.error("Upload vault failed:", data);
  throw new Error(`Failed to upload vault to Google Drive: ${data.error?.message || 'Unknown error'}`);
}

/**
 * Downloads the vault file content
 */
export async function downloadVaultFile(accessToken: string, fileId: string): Promise<string> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) throw new Error('Failed to download vault from Google Drive');
  return await response.text();
}

/**
 * Uploads a media file (image/video/audio) to appDataFolder
 */
export async function uploadMediaToDrive(accessToken: string, file: File | Blob, fileName: string): Promise<string> {
  const metadata = {
    name: fileName,
    parents: ['appDataFolder'],
    mimeType: file.type,
  };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (data.id) return data.id;
  throw new Error('Failed to upload media to Google Drive');
}

/**
 * Gets a blob URL for a media file from Drive
 */
export async function getMediaUrlFromDrive(accessToken: string, fileId: string): Promise<string> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) throw new Error('Failed to fetch media from Google Drive');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Permanently deletes the vault file from Google Drive appDataFolder
 */
export async function deleteVaultFile(accessToken: string): Promise<void> {
  // 1. Find the file
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='zenoa_vault.enc'&spaces=appDataFolder`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await response.json();

  if (data.files && data.files.length > 0) {
    // 2. Delete each instance found
    for (const file of data.files) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  }
}

/**
 * Uploads a media file to a folder and makes it accessible via link
 */
export async function uploadPublicMediaToDrive(accessToken: string, file: File | Blob, fileName: string): Promise<string> {
  // 1. Upload the file
  const metadata = {
    name: fileName,
    mimeType: file.type,
  };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webContentLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const uploadData = await uploadResponse.json();
  const fileId = uploadData.id;

  if (!fileId) throw new Error('Failed to upload media to Google Drive');

  // 2. Make it readable by anyone with the link
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  });

  // 3. Get the direct link
  const linkResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=webContentLink`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  const linkData = await linkResponse.json();
  return linkData.webContentLink;
}
