// src/components/Auth.js
import React, { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import {
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Avatar,
  CircularProgress,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';

const Auth = ({ isLoggedIn, onLogin, onLogout }) => {
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [tempUserData, setTempUserData] = useState(null);
  const [saving, setSaving] = useState(false);

  // 🟢 Google Login
  const login = async () => {
    try {
      // Prevents "Pending promise" crash
      await setPersistence(auth, browserLocalPersistence);

      const result = await signInWithPopup(auth, googleProvider);
      const userData = result.user;
      console.log('✅ Google Login successful for:', userData.email);

      // Check Firestore for existing user
      const userDocRef = doc(db, 'users', userData.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.log('🆕 New user detected:', userData.email);
        setTempUserData(userData);
        setOpenRoleDialog(true);
      } else {
        console.log('👤 Existing user found, logging in...');
        onLogin(userData);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      alert('Login failed: ' + error.message);
    }
  };

  // 🟢 Save Role Selection
  const handleRoleSelection = async (isWeaver) => {
    if (!tempUserData) return;
    setSaving(true);

    const role = isWeaver ? 'weaver' : 'user';
    const userRef = doc(db, 'users', tempUserData.uid);

    try {
      const userDataToSave = {
        name: tempUserData.displayName || 'Unnamed User',
        email: tempUserData.email || 'No email',
        created_at: new Date().toISOString(),
        role,
        weavingSkills: isWeaver ? '' : null,
        photoURL: tempUserData.photoURL || '',
      };

      console.log('🟡 Writing to Firestore path:', userRef.path, 'with data:', userDataToSave);

      await setDoc(userRef, userDataToSave, { merge: true });

      console.log('✅ User successfully saved to Firestore!');
      setSaving(false);
      setOpenRoleDialog(false);
      onLogin(tempUserData);
      setTempUserData(null);
    } catch (error) {
      setSaving(false);
      console.error('🚫 Error saving user to Firestore:', error);
      alert(`❌ Failed to save user data. 
      
Error: ${error.code || 'unknown'} 
Message: ${error.message || 'no message'} 
⚠️ Check your Firestore security rules or App Check configuration.`);
    }
  };

  // 🟢 Logout + Clear Cache
  const logout = async () => {
    await signOut(auth);
    onLogout();
    localStorage.clear();
    sessionStorage.clear();
    console.log('👋 User logged out and cache cleared.');
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

      {/* 🟡 Role Selection Dialog */}
      <Dialog open={openRoleDialog} disableEscapeKeyDown maxWidth="xs" fullWidth>
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
          {saving && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<PersonIcon />}
            disabled={saving}
            onClick={() => handleRoleSelection(false)}
            sx={{ borderRadius: 3, px: 3 }}
          >
            Regular User
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={saving}
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
