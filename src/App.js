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
import Cart from './components/Cart';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AppBar, Toolbar, Typography, Button, Container, Card, Avatar, Box, CssBaseline } from '@mui/material';
import { brown, green, grey } from '@mui/material/colors';

// Theme
const theme = createTheme({
  palette: {
    primary: { main: brown[700] },
    secondary: { main: green[600] },
    background: { default: '#f9fafb', paper: '#ffffff' },
    text: { primary: grey[900], secondary: grey[600] },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
    h4: { fontSize: '2.5rem', fontWeight: 700 },
    h6: { fontSize: '1.5rem', fontWeight: 600 },
    body1: { fontSize: '1.1rem' },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: brown[800],
          height: '80px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '80px !important',
          justifyContent: 'space-between',
          padding: '0 24px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          '&:hover': { opacity: 0.9 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        container: { padding: 2 },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
          <Typography
            variant="h4"
            component="div"
            sx={{ flexGrow: 1, color: 'white' }}
          >
            WeaveTogether
          </Typography>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button color="inherit" component={Link} to="/shop">
                Shop
              </Button>
              <Button color="inherit" component={Link} to="/create-video">
                Create Video
              </Button>
              <Button color="inherit" component={Link} to="/view-content">
                View Content
              </Button>
              {role === 'weaver' && (
                <Button color="inherit" component={Link} to="/upload-product">
                  Upload Product
                </Button>
              )}
              <Button color="inherit" component={Link} to="/profile">
                Profile
              </Button>
              <Avatar
                src={user.photoURL}
                alt={user.displayName}
                sx={{ ml: 2, width: 40, height: 40 }}
              />
              {/* Logout only when logged in */}
              <Box sx={{ ml: 2 }}>
                <Auth isLoggedIn={!!user} onLogin={setUser} onLogout={handleLogout} />
              </Box>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Full-width container so cards can spread */}
      <Container maxWidth="xl" sx={{ mt: 4, minHeight: '80vh' }}>
        <Routes>
          <Route
            path="/"
            element={
              <Home user={user} onLogin={setUser} onLogout={handleLogout} />
            }
          />
          <Route path="/shop" element={<Shop user={user} />} />
          <Route path="/upload-product" element={<UploadProduct user={user} />} />
          <Route path="/create-video" element={<CreateVideo user={user} />} />
          <Route path="/view-content" element={<ViewContent />} />
          <Route path="/profile" element={<Profile user={user} role={role} />} />
          <Route
            path="/profile/:profileUserId"
            element={<Profile user={user} role={role} />}
          />
          <Route path="/cart" element={<Cart user={user} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
    </>
  );
}

// Home Page
const Home = ({ user, onLogin, onLogout }) => (
  <Box
    sx={{
      position: 'relative',
      height: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage:
        'url(https://images.unsplash.com/photo-1579783483458-83d02133bb5f)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      borderRadius: 2,
      overflow: 'hidden',
      mb: 4,
    }}
  >
    <Box
      sx={{
        backgroundColor: 'rgba(255,255,255,0.9)',
        p: 4,
        borderRadius: 2,
        textAlign: 'center',
        maxWidth: '70%',
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{ color: brown[800], fontWeight: 700 }}
      >
        Welcome to WeaveTogether!
      </Typography>
      <Typography variant="body1" sx={{ color: grey[800], mb: 3 }}>
        Discover and preserve indigenous weaving through our digital platform.
        Explore authentic Cordillera textiles, stories, and more.
      </Typography>

      {!user ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Auth isLoggedIn={!!user} onLogin={onLogin} onLogout={onLogout} />
        </Box>
      ) : (
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/shop"
          sx={{
            borderRadius: 8,
            px: 5,
            py: 2,
            fontSize: '1.2rem',
          }}
        >
          Shop Now
        </Button>
      )}
    </Box>
  </Box>
);

// Not Found
const NotFound = () => (
  <Card sx={{ p: 4, textAlign: 'center', borderRadius: 12, boxShadow: 3 }}>
    <Typography variant="h6" gutterBottom color="text.secondary">
      404 - Page Not Found
    </Typography>
    <Typography variant="body1" color="text.secondary">
      The page you're looking for doesn’t exist.{' '}
      <Button component={Link} to="/" color="primary">
        Go back home
      </Button>
      .
    </Typography>
  </Card>
);

export default App;
