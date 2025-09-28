// src/components/Donate.js
import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import {
  TextField,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  InputAdornment,
  Alert,
  Stack,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';

const Donate = ({ user, weaverId }) => {
  const [amount, setAmount] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleDonate = async () => {
    if (!user) return alert('Login required');
    if (!weaverId) return alert('Weaver ID is required');
    if (!amount || parseFloat(amount) <= 0)
      return alert('Please enter a valid amount');

    try {
      await addDoc(collection(db, 'donations'), {
        user_id: user.uid,
        weaver_id: weaverId,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      setSuccessMsg(`Thank you for donating $${amount}! ❤️`);
      setAmount('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      console.error('Donation error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <Card
      sx={{
        maxWidth: 600, // wider card
        mx: 'auto',
        mt: 6,
        borderRadius: 4,
        boxShadow: 6,
        p: 2,
      }}
    >
      <CardContent>
        <Stack spacing={4}>
          <Box textAlign="center">
            <Typography
              variant="h4"
              fontWeight={700}
              color="primary"
              gutterBottom
            >
              Support the Weaver
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Every contribution helps preserve indigenous weaving traditions.
            </Typography>
          </Box>

          {successMsg && (
            <Alert severity="success" sx={{ fontSize: '1.1rem' }}>
              {successMsg}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Donation Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
              sx: { fontSize: '1.2rem', py: 1.5 },
            }}
          />

          <Button
            variant="contained"
            fullWidth
            startIcon={<FavoriteIcon />}
            onClick={handleDonate}
            disabled={!amount || parseFloat(amount) <= 0}
            sx={{
              borderRadius: 3,
              py: 2,
              fontSize: '1.2rem',
            }}
          >
            Donate
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default Donate;
