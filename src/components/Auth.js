// src/components/Auth.js
import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const Auth = ({ isLoggedIn, onLogin, onLogout }) => {
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [tempUserData, setTempUserData] = useState(null);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userData = result.user;
      const userDoc = await getDoc(doc(db, 'users', userData.uid));
      if (!userDoc.exists()) {
        // New user: Show role selection dialog
        setTempUserData(userData);
        setOpenRoleDialog(true);
      } else {
        // Existing user
        onLogin(userData);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRoleSelection = async (isWeaver) => {
    if (tempUserData) {
      const role = isWeaver ? 'weaver' : 'user';
      await setDoc(doc(db, 'users', tempUserData.uid), {
        name: tempUserData.displayName,
        email: tempUserData.email,
        google_id_token: tempUserData.accessToken,
        created_at: new Date().toISOString(),
        role: role,
        weavingSkills: isWeaver ? '' : null, // Optional: Set weavingSkills if weaver
        photoURL: tempUserData.photoURL, // Store Google profile image URL
      });
      onLogin(tempUserData);
      setOpenRoleDialog(false);
      setTempUserData(null);
    }
  };

  const logout = async () => {
    await signOut(auth);
    onLogout(); // Immediate state update
  };

  return (
    <>
      {isLoggedIn ? (
        <Button variant="outlined" color="inherit" onClick={logout}>Logout</Button>
      ) : (
        <Button variant="contained" startIcon={<GoogleIcon />} onClick={login}>Login with Google</Button>
      )}
      <Dialog open={openRoleDialog} onClose={() => {}} disableEscapeKeyDown>
        <DialogTitle>Are you a Weaver?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please select your role. If you are a weaver, you will be able to upload and manage products.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleRoleSelection(false)} color="primary">
            No, I'm a regular user
          </Button>
          <Button onClick={() => handleRoleSelection(true)} color="primary" autoFocus>
            Yes, I'm a weaver
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Auth;