// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import Auth from './components/Auth';
import Shop from './components/Shop';
import UploadProduct from './components/UploadProduct';
import CreateVideo from './components/CreateVideo';
import ViewContent from './components/ViewContent';
import Profile from './components/Profile';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AppBar, Toolbar, Typography, Button, Container, Card, Avatar, Box } from '@mui/material';
import { brown, green } from '@mui/material/colors';

// Custom theme inspired by expert designs (e.g., spacious layouts from Google Arts & Culture and TED)
const theme = createTheme({
  palette: {
    primary: { main: brown[700] }, // Earthy brown for buttons/nav
    secondary: { main: green[600] }, // Green for accents
    background: { default: '#f5f5f5' }, // Light neutral background
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h6: { fontSize: '1.8rem' }, // Larger title text inspired by Curry Up Now
    button: { fontSize: '1.2rem' }, // Larger button text
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: brown[800], height: '90px', boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' }, // Taller with shadow for depth
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: { minHeight: '90px !important', justifyContent: 'space-between' }, // Taller and better justification
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { mx: 3, px: 3 }, // Increased spacing (mx: 3 for more space between items)
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <InnerApp />
      </Router>
    </ThemeProvider>
  );
}

function InnerApp() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        }
      } else {
        setRole(null);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    navigate('/');
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            WeaveTogether
          </Typography>
          {user && (
            <>
              <Button color="inherit" component={Link} to="/shop">Shop</Button>
              <Button color="inherit" component={Link} to="/create-video">Create Video</Button>
              <Button color="inherit" component={Link} to="/view-content">View Content</Button>
              {role === 'weaver' && <Button color="inherit" component={Link} to="/upload-product">Upload Product</Button>}
              <Button color="inherit" component={Link} to="/profile">Profile</Button>
            </>
          )}
          {user && <Avatar src={user.photoURL} alt={user.displayName} sx={{ ml: 2 }} />}
          <Auth isLoggedIn={!!user} onLogin={setUser} onLogout={handleLogout} />
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop user={user} />} />
          <Route path="/upload-product" element={<UploadProduct user={user} />} />
          <Route path="/create-video" element={<CreateVideo user={user} />} />
          <Route path="/view-content" element={<ViewContent />} />
          <Route path="/profile" element={<Profile user={user} role={role} />} />
          <Route path="/profile/:profileUserId" element={<Profile user={user} role={role} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
    </>
  );
}

// Home component with MUI Typography and Card
const Home = () => (
  <Box sx={{ position: 'relative', height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4, backgroundImage: 'ur[](https://images.unsplash.com/photo-1579783483458-83d02133bb5f)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
    <Box sx={{ backgroundColor: 'rgba(255,255,255,0.8)', p: 6, borderRadius: 2, textAlign: 'center', maxWidth: '80%' }}>
      <Typography variant="h3" gutterBottom sx={{ color: brown[800] }}>Welcome to WeaveTogether!</Typography>
      <Typography variant="h5" sx={{ color: brown[600] }}>Preserving indigenous weaving through digital platforms. Log in to get started and explore authentic Cordillera textiles, stories, and more.</Typography>
    </Box>
  </Box>
);

// NotFound with MUI
const NotFound = () => (
  <Card sx={{ p: 4, textAlign: 'center' }}>
    <Typography variant="h5" gutterBottom>404 - Page Not Found</Typography>
    <Typography variant="body1">
      The page you're looking for doesn't exist. <Button component={Link} to="/">Go back home</Button>.
    </Typography>
  </Card>
);

export default App;