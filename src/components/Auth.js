// src/components/Auth.js
import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Avatar,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';

const Auth = ({ isLoggedIn, onLogin, onLogout }) => {
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [tempUserData, setTempUserData] = useState(null);

  // Google Login
  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userData = result.user;
      const userDoc = await getDoc(doc(db, 'users', userData.uid));

      if (!userDoc.exists()) {
        // New user → role selection
        setTempUserData(userData);
        setOpenRoleDialog(true);
      } else {
        onLogin(userData);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Save Role
  const handleRoleSelection = async (isWeaver) => {
    if (tempUserData) {
      const role = isWeaver ? 'weaver' : 'user';
      await setDoc(doc(db, 'users', tempUserData.uid), {
        name: tempUserData.displayName,
        email: tempUserData.email,
        google_id_token: tempUserData.accessToken,
        created_at: new Date().toISOString(),
        role,
        weavingSkills: isWeaver ? '' : null,
        photoURL: tempUserData.photoURL,
      });
      onLogin(tempUserData);
      setOpenRoleDialog(false);
      setTempUserData(null);
    }
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    onLogout();
  };

  return (
    <>
      {isLoggedIn ? (
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<LogoutIcon />}
          onClick={logout}
          sx={{ borderRadius: 3, px: 3 }}
        >
          Logout
        </Button>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mt: 4,
            mb: 2,
          }}
        >
          <Button
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={login}
            sx={{
              borderRadius: 4,
              px: 4,
              py: 1.8,
              fontSize: '1rem',
              backgroundColor: '#DB4437',
              '&:hover': { backgroundColor: '#c23321' },
            }}
          >
            Sign in with Google
          </Button>
        </Box>
      )}

      {/* Role Selection Dialog */}
      <Dialog
        open={openRoleDialog}
        onClose={() => {}}
        disableEscapeKeyDown
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Choose Your Role
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Avatar
            src={tempUserData?.photoURL}
            alt={tempUserData?.displayName}
            sx={{ width: 72, height: 72, mx: 'auto', mb: 2 }}
          />
          <Typography variant="h6">{tempUserData?.displayName}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Are you joining as a <strong>Weaver</strong> or a
            <strong> Regular User</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<PersonIcon />}
            onClick={() => handleRoleSelection(false)}
            sx={{ borderRadius: 3, px: 3 }}
          >
            Regular User
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleRoleSelection(true)}
            sx={{ borderRadius: 3, px: 3 }}
          >
            Weaver
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Auth;
