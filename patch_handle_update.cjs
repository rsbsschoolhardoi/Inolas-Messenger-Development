const fs = require('fs');
let code = fs.readFileSync('src/components/DeveloperPortal.tsx', 'utf8');

const newLogic = `
  const handleUpdateSettings = async () => {
    if (!selectedApp) return;
    setIsSaving(true);
    try {
      let finalBotUsername = selectedApp.bot_username;
      let finalAppName = editAppName.trim() || selectedApp.app_name;
      let botUsernameChanged = false;

      if (db) {
        const cleanNewBotUsername = editBotUsername.trim().toLowerCase().replace(/^@/, '');
        if (cleanNewBotUsername && cleanNewBotUsername !== selectedApp.bot_username) {
          const { doc, getDoc, setDoc, deleteDoc, updateDoc } = require('firebase/firestore');
          const newSaRef = doc(db, 'users', cleanNewBotUsername);
          const newSaSnap = await getDoc(newSaRef);
          if (newSaSnap.exists()) {
            showToast('Username already taken by another account.');
            setIsSaving(false);
            return;
          }
          finalBotUsername = cleanNewBotUsername;
          botUsernameChanged = true;
        }

        const { doc, updateDoc, setDoc, deleteDoc } = require('firebase/firestore');
        const devAppRef = doc(db, 'developer_apps', selectedApp.id);
        const updates = {};
        if (finalAppName !== selectedApp.app_name) updates.app_name = finalAppName;
        if (botUsernameChanged) updates.bot_username = finalBotUsername;
        
        if (Object.keys(updates).length > 0) {
          await updateDoc(devAppRef, updates);
        }

        if (botUsernameChanged) {
          await setDoc(doc(db, 'users', finalBotUsername), {
            username: finalBotUsername,
            display_name: finalAppName,
            bio: appDescription.trim() || 'Service Account',
            is_service_account: true,
            is_business_account: true,
            is_verified: false,
            owner_username: currentUser?.username || 'developer_user',
            registered_at: Date.now()
          });
          await deleteDoc(doc(db, 'users', selectedApp.bot_username));
        } else if (finalAppName !== selectedApp.app_name) {
          await updateDoc(doc(db, 'users', selectedApp.bot_username), {
            display_name: finalAppName
          });
        }
      }

      const effectiveApiKey = selectedApp.client_id || selectedApp.api_key;
      await fetch('/api/v1/apps/update', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${effectiveApiKey}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhook_url: webhookUrl.trim(),
          redirect_uris: redirectUris,
          website_url: websiteUrl.trim(),
          app_description: appDescription.trim(),
          allowed_ips: allowedIps.trim(),
          app_name: finalAppName
        })
      }).catch(e => console.warn(e));

      const updated = apps.map(a => a.id === selectedApp.id ? { 
        ...a, 
        webhook_url: webhookUrl.trim(), 
        redirect_uris: redirectUris,
        website_url: websiteUrl.trim(),
        app_description: appDescription.trim(),
        bot_username: finalBotUsername,
        app_name: finalAppName
      } : a);
      
      setApps(updated);
      setAppName(finalAppName);
      
      // Also update selectedApp reference if possible or it will auto-update on re-render.
      showToast('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };
`;

code = code.replace(
  /const handleUpdateSettings = async \(\) => \{[\s\S]*?setIsSaving\(false\);\n    \}\n  \};/,
  newLogic.trim()
);

fs.writeFileSync('src/components/DeveloperPortal.tsx', code);
