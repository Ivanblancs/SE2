// src/utils/SyncService.js
import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Upload a base64 file to Cloudinary
 * @param {string} base64File - The base64 string of the file
 * @param {string} resourceType - "video" or "image"
 * @returns {Promise<string>} - The Cloudinary secure_url
 */
async function uploadToCloudinary(base64File, resourceType = "video") {
  const formData = new FormData();
  formData.append("file", base64File);
  formData.append("upload_preset", "weave_unsigned"); // update if you change preset

  const endpoint =
    resourceType === "video"
      ? "https://api.cloudinary.com/v1_1/ddolnxwvm/video/upload"
      : "https://api.cloudinary.com/v1_1/ddolnxwvm/image/upload";

  const response = await fetch(endpoint, { method: "POST", body: formData });
  const data = await response.json();

  if (!data.secure_url) {
    throw new Error("Cloudinary upload failed");
  }
  return data.secure_url;
}

/**
 * Sync offline videos stored in localStorage to Firestore + Cloudinary
 * @param {object} user - Current logged-in user
 */
export async function syncOfflineVideos(user) {
  const offlineVideos = JSON.parse(localStorage.getItem("offlineVideos") || "[]");
  if (!offlineVideos.length) {
    console.log("No offline videos to sync.");
    return;
  }

  console.log(`Syncing ${offlineVideos.length} offline videos...`);

  for (const vid of offlineVideos) {
    try {
      const videoUrl = await uploadToCloudinary(vid.fileBase64, "video");

      await addDoc(collection(db, "videoContents"), {
        user_id: vid.user_id || user?.uid || "offline_test_user",
        title: vid.title,
        description: vid.description,
        url: videoUrl,
        created_at: vid.created_at || new Date().toISOString(),
      });

      console.log(`Synced video: ${vid.title}`);
    } catch (error) {
      console.error("Failed to sync video:", vid.title, error);
    }
  }

  // Clear after sync
  localStorage.removeItem("offlineVideos");
  alert("Offline videos synced successfully!");
}

/**
 * 🔮 Placeholders for future offline sync:
 * 
 * export async function syncOfflineProducts(user) { ... }
 * export async function syncOfflineDonations(user) { ... }
 * export async function syncOfflineOrders(user) { ... }
 */
