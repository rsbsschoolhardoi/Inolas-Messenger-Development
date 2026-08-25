import { Message } from '../types';
import { storageManager } from '../storageManager';
import { db } from '../firebaseClient';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

/**
 * Send message through ephemeral relay.
 * 1. Persists to sender's local device IndexedDB.
 * 2. Relays temporary payload via Firestore to recipient.
 */
export const sendRelayMessage = async (message: Message) => {
  // 1. Save locally to IndexedDB
  await storageManager.saveMessages([message]);
  
  // 2. Relay via Firestore
  if (db) {
    try {
      await setDoc(doc(db, 'messages', message.id), { 
        ...message,
        relay_metadata: {
            sent_at: Date.now(),
            status: 'pending_relay'
        }
      });
    } catch (err) {
      console.warn("Firestore relay error:", err);
    }
  }
};

/**
 * Handle incoming message from Firestore relay:
 * 1. Store in recipient's local IndexedDB.
 * 2. Immediately delete from Firestore so zero content remains on cloud!
 */
export const processIncomingRelayMessage = async (messageData: Message, currentUsername?: string): Promise<Message> => {
  // Save to recipient's IndexedDB
  await storageManager.saveMessages([messageData]);

  // If message belongs to someone else or was received via relay, request server purge if it's in Firestore
  if (db && messageData.id) {
    try {
      // Immediate ephemeral cleanup: remove from cloud server
      await deleteDoc(doc(db, 'messages', messageData.id));
    } catch (e) {
      // Ignore if already deleted
    }
  }

  return messageData;
};

/**
 * Delete a message locally and attempt to clear from server relay if still present.
 */
export const deleteLocalMessage = async (messageId: string) => {
  // Delete from local IndexedDB
  await storageManager.deleteMessage(messageId);

  // Attempt delete from Firestore relay
  if (db) {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (e) {
      // Ignore
    }
  }
};

/**
 * Delete entire chat history locally.
 */
export const deleteLocalChatHistory = async (chatId: string) => {
  await storageManager.deleteMessagesForChat(chatId);
};

