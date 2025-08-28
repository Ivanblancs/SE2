// src/components/SeedMocks.js (New component for seeding mocks - call it once in App.js for dev)
import { useEffect } from 'react';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const SeedMocks = () => {
  useEffect(() => {
    const seedData = async () => {
      // Seed mock user if not exists
      const mockUserRef = doc(db, 'users', 'mock_user_id');
      const mockUserDoc = await getDoc(mockUserRef);
      if (!mockUserDoc.exists()) {
        await setDoc(mockUserRef, {
          name: 'Mock User',
          email: 'mockuser@example.com',
          google_id_token: 'mock_token',
          created_at: new Date().toISOString(),
          role: 'user',
          weavingSkills: null,
          photoURL: 'https://via.placeholder.com/80?text=MU',
        });
        console.log('Mock User seeded');
      }

      // Seed mock weaver if not exists
      const mockWeaverRef = doc(db, 'users', 'mock_weaver_id');
      const mockWeaverDoc = await getDoc(mockWeaverRef);
      if (!mockWeaverDoc.exists()) {
        await setDoc(mockWeaverRef, {
          name: 'Mock Weaver',
          email: 'mockweaver@example.com',
          google_id_token: 'mock_token',
          created_at: new Date().toISOString(),
          role: 'weaver',
          weavingSkills: 'Expert in Inabel and Ikat weaving',
          photoURL: 'https://via.placeholder.com/80?text=MW',
        });
        console.log('Mock Weaver seeded');
      }

      // Optional: Seed mock product for weaver
      const mockProductRef = doc(collection(db, 'products'));
      await setDoc(mockProductRef, {
        weaver_id: 'mock_weaver_id',
        name: 'Mock Inabel Textile',
        price: 50,
        description: 'Handwoven using traditional loom techniques. Size: 2m x 1m.',
        image: 'https://via.placeholder.com/300x200?text=Mock+Product',
        created_at: new Date().toISOString(),
      });
      console.log('Mock Product seeded');

      // Optional: Seed mock video for user
      const mockVideoRef = doc(collection(db, 'videoContents'));
      await setDoc(mockVideoRef, {
        user_id: 'mock_user_id',
        title: 'Mock Educational Video',
        description: 'Exploring Cordillera weaving.',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        created_at: new Date().toISOString(),
      });
      console.log('Mock Video seeded');
    };

    seedData().catch(console.error);
  }, []); // Runs once on mount

  return null; // Invisible component
};

export default SeedMocks;