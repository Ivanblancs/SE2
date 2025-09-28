// src/offlineDB.js
import Dexie from "dexie";
import { db } from "./firebase";
import { setDoc, doc } from "firebase/firestore";

// ============ 1. Setup IndexedDB ============ //
const localDB = new Dexie("WeaveTogetherDB");
localDB.version(1).stores({
  users: "id,synced",
  products: "id,synced",
  carts: "id,synced",
  orders: "id,synced",
  donations: "id,synced",
  videos: "id,synced"
});

// Cloudinary Config
const CLOUDINARY_UPLOAD_PRESET = "weave_unsigned";
const CLOUDINARY_CLOUD_NAME = "ddolnxwvm";

// ============ 2. Save Locally ============ //
async function saveLocal(store, data) {
  const id = data.id || crypto.randomUUID();
  await localDB[store].put({ ...data, id, synced: false });
  return id;
}

// ============ 3. Cloudinary Upload Helpers ============ //
async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await response.json();
  if (!data.secure_url) throw new Error("Image upload failed");
  return data.secure_url;
}

async function uploadVideo(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
    { method: "POST", body: formData }
  );
  const data = await response.json();
  if (!data.secure_url) throw new Error("Video upload failed");
  return data.secure_url;
}

// ============ 4. Firestore Sync Helpers ============ //
async function syncUser(user) {
  await setDoc(doc(db, "users", user.id), user, { merge: true });
}

async function syncProduct(product) {
  let imageUrls = product.images;

  // If images are Blobs, upload them first
  if (product.images && product.images[0] instanceof File) {
    imageUrls = [];
    for (const file of product.images) {
      const url = await uploadImage(file);
      imageUrls.push(url);
    }
  }

  const productData = { ...product, images: imageUrls };
  await setDoc(doc(db, "products", product.id), productData, { merge: true });
}

async function syncVideo(video) {
  let videoUrl = video.url;

  // If video stored as Blob/File, upload it first
  if (video.videoBlob instanceof File) {
    videoUrl = await uploadVideo(video.videoBlob);
  }

  const videoData = {
    ...video,
    url: videoUrl,
    videoBlob: undefined // don’t store blob in Firestore
  };
  await setDoc(doc(db, "videoContents", video.id), videoData, { merge: true });
}

async function syncOrder(order) {
  await setDoc(doc(db, "orders", order.id), order, { merge: true });
}

async function syncDonation(donation) {
  await setDoc(doc(db, "donations", donation.id), donation, { merge: true });
}

// ============ 5. Public API ============ //
export const offlineDB = {
  // Save locally + queue for sync
  async add(store, collectionName, data) {
    const id = await saveLocal(store, data);
    this.syncItem(store, { ...data, id });
    return id;
  },

  async getAll(store) {
    return await localDB[store].toArray();
  },

  async syncItem(store, item) {
    try {
      switch (store) {
        case "users": await syncUser(item); break;
        case "products": await syncProduct(item); break;
        case "videos": await syncVideo(item); break;
        case "orders": await syncOrder(item); break;
        case "donations": await syncDonation(item); break;
        default: console.warn(`No sync logic for ${store}`);
      }
      await localDB[store].update(item.id, { synced: true });
      console.log(`✅ Synced ${store}/${item.id}`);
    } catch (err) {
      console.error(`❌ Failed to sync ${store}/${item.id}`, err);
    }
  },

  async syncPending() {
    for (const store of [
      "users",
      "products",
      "carts",
      "orders",
      "donations",
      "videos"
    ]) {
      const unsynced = await localDB[store]
        .where("synced")
        .equals(false)
        .toArray();
      for (const item of unsynced) {
        await this.syncItem(store, item);
      }
    }
  },

  // ✅ Clear all data (used on logout)
  async clear() {
    try {
      await Promise.all([
        localDB.users.clear(),
        localDB.products.clear(),
        localDB.carts.clear(),
        localDB.orders.clear(),
        localDB.donations.clear(),
        localDB.videos.clear(),
      ]);
      console.log("🧹 OfflineDB cleared");
    } catch (err) {
      console.error("Failed to clear offlineDB", err);
    }
  }
};

// ============ 6. Auto-Sync on Online ============ //
window.addEventListener("online", () => {
  console.log("🌐 Back online! Syncing pending data...");
  offlineDB.syncPending();
});
