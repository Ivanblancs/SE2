// src/components/Donate.js
import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { TextField, Button, Typography, Box } from '@mui/material';

const Donate = ({ user }) => {
  const [amount, setAmount] = useState(0);

  const handleDonate = async () => {
    if (!user) return alert('Login required');
    try {
      await addDoc(collection(db, 'donations'), {
        user_id: user.uid,
        amount,
        date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
      alert(`Donated $${amount}!`);
    } catch (error) {
      console.error('Donation error:', error);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Donate to Weavers</Typography>
      <TextField fullWidth label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} sx={{ mb: 2 }} />
      <Button variant="contained" fullWidth onClick={handleDonate}>Donate</Button>
    </Box>
  );
};

export default Donate;