// src/components/Shop.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Grid, Card, CardMedia, CardContent, CardActions, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Donate from './Donate'; // Import Donate component

const Shop = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [openDonateDialog, setOpenDonateDialog] = useState(false);
  const [selectedWeaverId, setSelectedWeaverId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, 'products'));
      let fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (fetchedProducts.length === 0) {
        const mockProduct = {
          id: 'mock_id',
          weaver_id: 'mock_weaver_id',
          name: 'Mock Inabel Textile',
          price: 50.00,
          description: 'Handwoven using traditional loom techniques. Size: 2m x 1m. Made from natural cotton fibers and dyed with organic colors.',
          images: ['https://via.placeholder.com/300x200?text=Mock+Weaving+Product'],
          created_at: new Date().toISOString(),
        };
        fetchedProducts = [mockProduct];
      }
      // Normalize data: ensure images is always an array
      const normalizedProducts = fetchedProducts.map(prod => ({
        ...prod,
        images: Array.isArray(prod.images) ? prod.images : prod.image ? [prod.image] : ['https://via.placeholder.com/300x200?text=No+Image'],
      }));
      const productsWithWeavers = await Promise.all(normalizedProducts.map(async (prod) => {
        let weaverName = 'Unknown Weaver';
        let weaverPhotoURL = '';
        if (prod.weaver_id === 'mock_weaver_id') {
          weaverName = 'Mock Weaver';
          weaverPhotoURL = 'https://via.placeholder.com/40?text=MW';
        } else {
          const weaverDoc = await getDoc(doc(db, 'users', prod.weaver_id));
          if (weaverDoc.exists()) {
            weaverName = weaverDoc.data().name;
            weaverPhotoURL = weaverDoc.data().photoURL || '';
          }
        }
        return { ...prod, weaverName, weaverPhotoURL };
      }));
      setProducts(productsWithWeavers);
    };
    fetchProducts().catch(console.error); // Log any errors during fetch
  }, []);

  const makePurchase = async (productId) => {
    if (!user) return alert('Login required');
    alert(`Purchased product ${productId}!`);
  };

  const openDonate = (weaverId) => {
    if (!user) return alert('Login required');
    setSelectedWeaverId(weaverId);
    setOpenDonateDialog(true);
  };

  const goToProfile = (weaverId) => {
    navigate(`/profile/${weaverId}`);
  };

  return (
    <div>
      <Typography variant="h5" gutterBottom>Shop</Typography>
      <Grid container spacing={3}>
        {products.map(product => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card>
              <CardMedia
                component="img"
                height="140"
                image={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x200?text=No+Image'}
                alt={product.name}
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar src={product.weaverPhotoURL} alt={product.weaverName} sx={{ width: 24, height: 24, mr: 1, cursor: 'pointer' }} onClick={() => goToProfile(product.weaver_id)} />
                  <Typography variant="body2" sx={{ cursor: 'pointer' }} onClick={() => goToProfile(product.weaver_id)}>{product.weaverName}</Typography>
                </Box>
                <Typography variant="h6">{product.name}</Typography>
                <Typography variant="body2" color="text.secondary">${product.price}</Typography>
              </CardContent>
              <CardActions>
                <Button size="small" variant="contained" onClick={() => makePurchase(product.id)}>Buy</Button>
                <Button size="small" variant="outlined" onClick={() => openDonate(product.weaver_id)}>Donate to Weaver</Button>
                <Button size="small" variant="text" onClick={() => setSelectedProduct(product)}>View Details</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={openDonateDialog} onClose={() => setOpenDonateDialog(false)}>
        <DialogTitle>Donate to Weaver</DialogTitle>
        <DialogContent>
          <Donate user={user} weaverId={selectedWeaverId} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDonateDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!selectedProduct} onClose={() => setSelectedProduct(null)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedProduct?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6">Price: ${selectedProduct?.price}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Avatar src={selectedProduct?.weaverPhotoURL} alt={selectedProduct?.weaverName} sx={{ width: 32, height: 32, mr: 1, cursor: 'pointer' }} onClick={() => goToProfile(selectedProduct?.weaver_id)} />
                <Typography variant="subtitle1" sx={{ cursor: 'pointer' }} onClick={() => goToProfile(selectedProduct?.weaver_id)}>Weaver: {selectedProduct?.weaverName}</Typography>
              </Box>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Description: {selectedProduct?.description || 'No description available.'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Grid container spacing={2}>
                {selectedProduct?.images && selectedProduct.images.map((img, index) => (
                  <Grid item xs={12} key={index}>
                    <CardMedia component="img" image={img} alt={`${selectedProduct.name} image ${index + 1}`} sx={{ width: '100%', height: 'auto' }} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedProduct(null)}>Close</Button>
          <Button variant="outlined" onClick={() => { openDonate(selectedProduct?.weaver_id); setSelectedProduct(null); }}>Donate to Weaver</Button>
          <Button variant="contained" onClick={() => { makePurchase(selectedProduct?.id); setSelectedProduct(null); }}>Buy</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Shop;