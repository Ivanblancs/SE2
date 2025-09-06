// src/components/Profile.js
import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useParams } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Grid, Card, CardMedia, CardContent, Typography, Box, Avatar, Tabs, Tab } from '@mui/material';

const Profile = ({ user, role }) => {
  const { profileUserId } = useParams(); // Get dynamic userId from URL
  const [profileData, setProfileData] = useState(null);
  const [products, setProducts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [profileRole, setProfileRole] = useState(null);
  const [totalDonations, setTotalDonations] = useState(0);

  useEffect(() => {
    const targetUserId = profileUserId || user?.uid; // Use param or current user
    if (!targetUserId) return;

    const fetchProfile = async () => {
      if (targetUserId.startsWith('mock_')) {
        // Handle mock user: Use placeholder data
        setProfileData({
          name: 'Mock User',
          email: 'mock@example.com',
          photoURL: 'https://via.placeholder.com/80?text=MU', // Mock avatar
        });
        setProfileRole('weaver'); // Assume weaver for mock, adjust as needed
        setTotalDonations(0); // Mock donation
        setVideos([]);
        setProducts([]);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', targetUserId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileData(data);
        setProfileRole(data.role);

        // Fetch videos
        const videosQuery = query(collection(db, 'videoContents'), where('user_id', '==', targetUserId));
        const videosSnapshot = await getDocs(videosQuery);
        setVideos(videosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch products if weaver
        if (data.role === 'weaver') {
          const productsQuery = query(collection(db, 'products'), where('weaver_id', '==', targetUserId));
          const productsSnapshot = await getDocs(productsQuery);
          setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

        // Fetch total donations for the weaver
        const donationsQuery = query(collection(db, 'donations'), where('weaver_id', '==', targetUserId));
        const donationsSnapshot = await getDocs(donationsQuery);
        const total = donationsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
        setTotalDonations(total);
      } else {
        // Handle non-existent real user
        setProfileData(null);
        setTotalDonations(0);
      }
    };
    fetchProfile();
  }, [user, profileUserId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (!profileData) {
    return <Typography variant="h6">Profile not found or loading...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Avatar src={profileData.photoURL} alt={profileData.name} sx={{ width: 80, height: 80, mr: 2 }} />
        <Box>
          <Typography variant="h5">{profileData.name}</Typography>
          <Typography variant="subtitle1">{profileData.email}</Typography>
          <Typography variant="body2">Role: {profileRole}</Typography>
          {profileRole === 'weaver' && (
            <Typography variant="body2" color="primary">Total Donations Received: ${totalDonations.toFixed(2)}</Typography>
          )}
        </Box>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} centered>
        <Tab label="Videos" />
        {profileRole === 'weaver' && <Tab label="Products" />}
      </Tabs>

      {tabValue === 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>Educational Content</Typography>
          {videos.length > 0 ? (
            <Grid container spacing={3}>
              {videos.map(video => (
                <Grid item xs={12} sm={6} md={4} key={video.id}>
                  <Card>
                    <ReactPlayer url={video.url} controls width="100%" height="auto" />
                    <CardContent>
                      <Typography variant="h6">{video.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{video.description}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography>No videos uploaded yet.</Typography>
          )}
        </Box>
      )}

      {profileRole === 'weaver' && tabValue === 1 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>Products</Typography>
          {products.length > 0 ? (
            <Grid container spacing={3}>
              {products.map(product => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card>
                    <CardMedia component="img" height="140" image={product.image} alt={product.name} />
                    <CardContent>
                      <Typography variant="h6">{product.name}</Typography>
                      <Typography variant="body2" color="text.secondary">${product.price}</Typography>
                      <Typography variant="body2">{product.description}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography>No products uploaded yet.</Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Profile;