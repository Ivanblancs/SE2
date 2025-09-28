// src/components/Cart.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  addDoc,
} from 'firebase/firestore';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  IconButton,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import InfoIcon from '@mui/icons-material/Info';

const Cart = ({ user }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (user) {
      fetchCartFromDB();
    }
  }, [user]);

  const fetchCartFromDB = async () => {
    if (!user) return;
    const cartQuery = query(collection(db, `users/${user.uid}/carts`));
    try {
      const querySnapshot = await getDocs(cartQuery);
      const dbCart = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        quantity: 1,
      }));
      setCartItems(dbCart);
    } catch (error) {
      console.error('Fetch cart error:', error);
    }
  };

  const removeItem = async (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    try {
      await deleteDoc(doc(db, `users/${user.uid}/carts`, id));
    } catch (error) {
      console.error('Remove item error:', error);
    }
  };

  const calculateTotal = () => {
    return cartItems
      .reduce(
        (total, item) =>
          total +
          (typeof item.price === 'number'
            ? item.price
            : parseFloat(item.price) || 0) *
            item.quantity,
        0
      )
      .toFixed(2);
  };

  const handleCheckout = async () => {
    if (!user) return alert('Login required');
    try {
      await addDoc(collection(db, 'orders'), {
        user_id: user.uid,
        items: cartItems,
        total: parseFloat(calculateTotal()),
        date: new Date().toISOString(),
        status: 'completed',
      });
      const cartQuery = query(collection(db, `users/${user.uid}/carts`));
      const querySnapshot = await getDocs(cartQuery);
      querySnapshot.forEach(async (doc) => await deleteDoc(doc.ref));
      setCartItems([]);
      alert(`Checkout successful! Total: $${calculateTotal()}.`);
      navigate('/shop');
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to complete checkout. Please try again.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h4" fontWeight={700} color="primary">
          Your Cart
        </Typography>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<ShoppingBasketIcon />}
          onClick={() => navigate('/shop')}
          sx={{ borderRadius: 3, px: 3 }}
        >
          Continue Shopping
        </Button>
      </Box>

      {cartItems.length === 0 ? (
        <Paper
          sx={{
            p: 5,
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: 2,
            backgroundColor: '#fafafa',
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Your cart is empty
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/shop')}
            sx={{ mt: 2, borderRadius: 3 }}
          >
            Start Shopping
          </Button>
        </Paper>
      ) : (
        <>
          {/* Cart Items Grid */}
          <Grid container spacing={3}>
            {cartItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: 3,
                    height: 380,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.25s ease',
                    '&:hover': { boxShadow: 6, transform: 'translateY(-6px)' },
                  }}
                >
                  {/* Image */}
                  <CardMedia
                    component="img"
                    height="200"
                    image={
                      item.images && item.images.length > 0
                        ? item.images[0]
                        : 'https://via.placeholder.com/300x200?text=No+Image'
                    }
                    alt={item.name}
                    sx={{
                      objectFit: 'cover',
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                    }}
                  />

                  {/* Info */}
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      $
                      {typeof item.price === 'number'
                        ? item.price.toFixed(2)
                        : parseFloat(item.price).toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Quantity: {item.quantity}
                    </Typography>
                  </CardContent>

                  {/* Actions */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      p: 2,
                    }}
                  >
                    <IconButton
                      color="info"
                      onClick={() => setSelectedProduct(item)}
                    >
                      <InfoIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => removeItem(item.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Checkout Summary */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mt: 5,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: 4,
                width: '350px',
              }}
            >
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" fontWeight={700} align="right">
                Total: ${calculateTotal()}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<ShoppingCartCheckoutIcon />}
                onClick={handleCheckout}
                sx={{
                  mt: 2,
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  width: '100%',
                }}
              >
                Proceed to Checkout
              </Button>
            </Paper>
          </Box>
        </>
      )}

      {/* Product Details Modal */}
      <Dialog
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedProduct?.name}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Typography variant="h6" fontWeight={700}>
                Price: ${selectedProduct?.price?.toFixed(2) || '0.00'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Quantity: {selectedProduct?.quantity || 1}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Avatar
                  src={selectedProduct?.weaverPhotoURL}
                  alt={selectedProduct?.weaverName}
                  sx={{
                    width: 44,
                    height: 44,
                    mr: 2,
                    border: '2px solid #ddd',
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{ color: 'primary.main' }}
                >
                  Weaver: {selectedProduct?.weaverName || 'Unknown'}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ mt: 3 }}>
                {selectedProduct?.description || 'No description available.'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={5}>
              <Grid container spacing={2}>
                {selectedProduct?.images?.map((img, index) => (
                  <Grid item xs={12} key={index}>
                    <CardMedia
                      component="img"
                      image={img}
                      alt={`${selectedProduct?.name} image ${index + 1}`}
                      sx={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: 2,
                        boxShadow: 2,
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedProduct(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Cart;
