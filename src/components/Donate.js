// src/components/Donate.js
import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { TextField, Button, Typography, Box } from '@mui/material';

const Donate = ({ user, weaverId }) => {
  const [amount, setAmount] = useState(0);

  const handleDonate = async () => {
    if (!user) return alert('Login required');
    if (!weaverId) return alert('Weaver ID is required');
    try {
      await addDoc(collection(db, 'donations'), {
        user_id: user.uid,
        weaver_id: weaverId,
        amount: parseFloat(amount), // Ensure amount is a number
        date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
      alert(`Donated $${amount}!`);
      setAmount(0); // Reset amount after successful donation
    } catch (error) {
      console.error('Donation error:', error);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Donate to Weaver</Typography>
      <TextField fullWidth label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} sx={{ mb: 2 }} />
      <Button variant="contained" fullWidth onClick={handleDonate}>Donate</Button>
    </Box>
  );
};

export default Donate;