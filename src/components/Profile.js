// src/components/Profile.js
import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useParams } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Avatar,
  Tabs,
  Tab,
  Paper,
  Divider,
} from '@mui/material';

const Profile = ({ user, role }) => {
  const { profileUserId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [products, setProducts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [profileRole, setProfileRole] = useState(null);
  const [totalDonations, setTotalDonations] = useState(0);

  useEffect(() => {
    const targetUserId = profileUserId || user?.uid;
    if (!targetUserId) return;

    const fetchProfile = async () => {
      if (targetUserId.startsWith('mock_')) {
        setProfileData({
          name: 'Mock User',
          email: 'mock@example.com',
          photoURL: 'https://via.placeholder.com/80?text=MU',
        });
        setProfileRole('weaver');
        setTotalDonations(0);
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
        const videosQuery = query(
          collection(db, 'videoContents'),
          where('user_id', '==', targetUserId)
        );
        const videosSnapshot = await getDocs(videosQuery);
        setVideos(videosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        // Fetch products if weaver
        if (data.role === 'weaver') {
          const productsQuery = query(
            collection(db, 'products'),
            where('weaver_id', '==', targetUserId)
          );
          const productsSnapshot = await getDocs(productsQuery);
          setProducts(productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

          // Fetch total donations
          const donationsQuery = query(
            collection(db, 'donations'),
            where('weaver_id', '==', targetUserId)
          );
          const donationsSnapshot = await getDocs(donationsQuery);
          const total = donationsSnapshot.docs.reduce(
            (sum, doc) => sum + Number(doc.data().amount || 0),
            0
          );
          setTotalDonations(total);
        }
      } else {
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
    return (
      <Typography variant="h6" align="center" sx={{ mt: 5 }}>
        Profile not found or loading...
      </Typography>
    );
  }

  return (
    <Box>
      {/* Profile Header */}
      <Paper
        elevation={3}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 3,
          mb: 4,
          borderRadius: 3,
          boxShadow: 4,
        }}
      >
        <Avatar
          src={profileData.photoURL}
          alt={profileData.name}
          sx={{ width: 100, height: 100, mr: 3 }}
        />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {profileData.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {profileData.email}
          </Typography>
          <Divider sx={{ my: 1, width: '60%' }} />
          <Typography variant="body2">Role: {profileRole}</Typography>
          {profileRole === 'weaver' && (
            <Typography variant="body2" color="primary" fontWeight={600}>
              Total Donations Received: ${Number(totalDonations || 0).toFixed(2)}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        centered
        textColor="primary"
        indicatorColor="primary"
        sx={{
          mb: 4,
          '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '1rem' },
        }}
      >
        <Tab label="Videos" />
        {profileRole === 'weaver' && <Tab label="Products" />}
      </Tabs>

      {/* Videos */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Educational Content
          </Typography>
          {videos.length > 0 ? (
            <Grid container spacing={3}>
              {videos.map((video) => (
                <Grid item xs={12} sm={6} md={4} key={video.id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      boxShadow: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <ReactPlayer url={video.url} controls width="100%" height="200px" />
                    <CardContent>
                      <Typography variant="h6" fontWeight={600}>
                        {video.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {video.description}
                      </Typography>
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

      {/* Products */}
      {profileRole === 'weaver' && tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Products
          </Typography>
          {products.length > 0 ? (
            <Grid container spacing={3}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      boxShadow: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="180"
                      image={
                        product.images && product.images.length > 0
                          ? product.images[0]
                          : 'https://via.placeholder.com/300?text=No+Image'
                      }
                      alt={product.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Typography variant="h6" fontWeight={600}>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${product.price}
                      </Typography>
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
