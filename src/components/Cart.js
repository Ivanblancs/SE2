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
  getDoc,
  setDoc,
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
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Cart = ({ user }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Shipping info dialog
  const [openShipping, setOpenShipping] = useState(false);
  const [shipping, setShipping] = useState({
    fullName: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    phone: '',
  });
  const [hasShipping, setHasShipping] = useState(false);

  // ✅ Thank You dialog and total
  const [thankYouOpen, setThankYouOpen] = useState(false);
  const [thankYouTotal, setThankYouTotal] = useState(0);

  useEffect(() => {
    if (user) {
      fetchCartFromDB();
      checkExistingShipping();
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

  const checkExistingShipping = async () => {
    if (!user) return;
    try {
      const shippingDoc = await getDoc(doc(db, `users/${user.uid}/shipping`, 'default'));
      if (shippingDoc.exists()) {
        setHasShipping(true);
        setShipping(shippingDoc.data());
      } else {
        setHasShipping(false);
      }
    } catch (err) {
      console.error('Check shipping error:', err);
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

    // ask for shipping details first time
    if (!hasShipping) {
      setOpenShipping(true);
      return;
    }

    try {
      const totalAmount = parseFloat(calculateTotal()); // ✅ store before clearing

      await addDoc(collection(db, 'orders'), {
        user_id: user.uid,
        items: cartItems,
        total: totalAmount,
        shipping: shipping,
        date: new Date().toISOString(),
        status: 'completed',
      });

      // Clear cart
      const cartQuery = query(collection(db, `users/${user.uid}/carts`));
      const querySnapshot = await getDocs(cartQuery);
      querySnapshot.forEach(async (doc) => await deleteDoc(doc.ref));
      setCartItems([]);

      // ✅ Show thank-you dialog with total
      setThankYouTotal(totalAmount);
      setThankYouOpen(true);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to complete checkout. Please try again.');
    }
  };

  const saveShipping = async () => {
    try {
      await setDoc(doc(db, `users/${user.uid}/shipping`, 'default'), shipping);
      setHasShipping(true);
      setOpenShipping(false);
      alert('Shipping details saved. You can now proceed with checkout.');
    } catch (err) {
      console.error('Save shipping error:', err);
      alert('Failed to save shipping info.');
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
                      ₱
                      {typeof item.price === 'number'
                        ? item.price.toFixed(2)
                        : parseFloat(item.price).toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Quantity: {item.quantity}
                    </Typography>
                  </CardContent>

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
                Total: ₱{calculateTotal()}
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

      {/* ✅ Thank You Dialog */}
      <Dialog
        open={thankYouOpen}
        onClose={() => {
          setThankYouOpen(false);
          navigate('/shop');
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            fontWeight: 'bold',
            color: 'success.main',
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 1 }} />
          <br />
          Thank You for Your Purchase!
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Your order has been successfully placed.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Order Summary
          </Typography>
          <Typography variant="body2">
            Total Amount: <strong>₱{thankYouTotal.toFixed(2)}</strong>
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Shipping To:
          </Typography>
          <Typography variant="body2">{shipping.fullName}</Typography>
          <Typography variant="body2">
            {shipping.address}, {shipping.city}, {shipping.province}
          </Typography>
          <Typography variant="body2">📞 {shipping.phone}</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setThankYouOpen(false);
              navigate('/shop');
            }}
          >
            Continue Shopping
          </Button>
        </DialogActions>
      </Dialog>

      {/* Shipping Info Dialog */}
      <Dialog open={openShipping} onClose={() => setOpenShipping(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enter Shipping Details</DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth margin="dense" label="Full Name" value={shipping.fullName}
            onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} />
          <TextField fullWidth margin="dense" label="Address" value={shipping.address}
            onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
          <TextField fullWidth margin="dense" label="City" value={shipping.city}
            onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
          <TextField fullWidth margin="dense" label="Province" value={shipping.province}
            onChange={(e) => setShipping({ ...shipping, province: e.target.value })} />
          <TextField fullWidth margin="dense" label="Postal Code" value={shipping.postalCode}
            onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} />
          <TextField fullWidth margin="dense" label="Phone Number" value={shipping.phone}
            onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShipping(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveShipping}>Save Shipping Info</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Cart;
