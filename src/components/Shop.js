// src/components/Shop.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Donate from './Donate';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

const RECT_CARD_HEIGHT = 400; // consistent tile shape
const RECT_IMAGE_HEIGHT = 220; // rectangular image band

const Shop = ({ user }) => {
  // Data
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  // UI State
  const [openDonateDialog, setOpenDonateDialog] = useState(false);
  const [selectedWeaverId, setSelectedWeaverId] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoom, setZoom] = useState(1);

  // Filters / Sorting
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest'); // 'newest' | 'priceAsc' | 'priceDesc'

  const navigate = useNavigate();

  // ---------- Fetch: Products ----------
  useEffect(() => {
    const fetchProducts = async () => {
      const snap = await getDocs(collection(db, 'products'));
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (list.length === 0) {
        list = [
          {
            id: 'mock_id',
            weaver_id: 'mock_weaver_id',
            name: 'Mock Inabel Textile',
            price: 50.0,
            description:
              'Handwoven using traditional loom techniques. Size: 2m x 1m. Made from natural cotton fibers and dyed with organic colors.',
            images: [
              'https://via.placeholder.com/800x600?text=Mock+Weaving+Product+1',
              'https://via.placeholder.com/800x600?text=Mock+Weaving+Product+2',
            ],
            created_at: new Date().toISOString(),
            tags: ['Inabel', 'Cotton', 'Handwoven'],
          },
        ];
      }

      const normalized = list.map((p) => ({
        ...p,
        price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
        images: Array.isArray(p.images)
          ? p.images
          : p.image
          ? [p.image]
          : ['https://via.placeholder.com/800x600?text=No+Image'],
        tags: Array.isArray(p.tags) ? p.tags : [],
        created_at: p.created_at || new Date().toISOString(),
      }));

      const withWeavers = await Promise.all(
        normalized.map(async (prod) => {
          if (prod.weaver_id === 'mock_weaver_id') {
            return {
              ...prod,
              weaverName: 'Mock Weaver',
              weaverPhotoURL: 'https://via.placeholder.com/40?text=MW',
            };
          }
          let weaverName = 'Unknown Weaver';
          let weaverPhotoURL = '';
          const weaverDoc = await getDoc(doc(db, 'users', prod.weaver_id));
          if (weaverDoc.exists()) {
            weaverName = weaverDoc.data().name || weaverName;
            weaverPhotoURL = weaverDoc.data().photoURL || '';
          }
          return { ...prod, weaverName, weaverPhotoURL };
        })
      );

      setProducts(withWeavers);
    };

    fetchProducts().catch(console.error);
  }, []);

  // ---------- Real-time: Cart ----------
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/carts`));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCart(items);
    });
    return () => unsub();
  }, [user]);

  // ---------- Actions ----------
  const addToCart = async (product) => {
    if (!user) return alert('Login required');
    const cartRef = doc(db, `users/${user.uid}/carts`, product.id);
    const snap = await getDoc(cartRef);
    if (snap.exists()) {
      const current = snap.data().quantity || 1;
      await setDoc(cartRef, { ...snap.data(), quantity: current + 1 }, { merge: true });
    } else {
      // Save minimal fields + whatever you want to show in cart
      await setDoc(
        cartRef,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          images: product.images,
          weaver_id: product.weaver_id,
          weaverName: product.weaverName,
          quantity: 1,
          added_at: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  };

  const openDonate = (weaverId) => {
    if (!user) return alert('Login required');
    setSelectedWeaverId(weaverId);
    setOpenDonateDialog(true);
  };

  const goToProfile = (weaverId) => {
    navigate(`/profile/${weaverId}`);
  };

  const goToCart = () => {
    navigate('/cart');
  };

  // ---------- Product detail modal helpers ----------
  const openProductModal = (prod) => {
    setSelectedProduct(prod);
    setActiveImageIdx(0);
    setZoom(1);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setActiveImageIdx(0);
    setZoom(1);
  };

  const nextImage = () => {
    if (!selectedProduct) return;
    setActiveImageIdx((prev) =>
      prev + 1 < selectedProduct.images.length ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    if (!selectedProduct) return;
    setActiveImageIdx((prev) =>
      prev - 1 >= 0 ? prev - 1 : selectedProduct.images.length - 1
    );
  };

  const zoomIn = () => setZoom((z) => Math.min(2, parseFloat((z + 0.25).toFixed(2))));
  const zoomOut = () => setZoom((z) => Math.max(1, parseFloat((z - 0.25).toFixed(2))));

  // ---------- Derived UI (filter/sort) ----------
  const filteredSorted = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    let list = products.filter((p) => {
      if (!q) return true;
      const text =
        `${p.name} ${p.description} ${p.weaverName} ${p.tags.join(' ')}`.toLowerCase();
      return text.includes(q);
    });

    list = list.sort((a, b) => {
      if (sort === 'priceAsc') return a.price - b.price;
      if (sort === 'priceDesc') return b.price - a.price;
      // newest (by created_at)
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return list;
  }, [products, search, sort]);

  return (
    <Box sx={{ padding: 3 }}>
      {/* Header / Actions */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" fontWeight={700} color="primary">
          Shop
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search products, weavers, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: '100%', sm: 260 } }}
          />
          <ToggleButtonGroup
            size="small"
            exclusive
            value={sort}
            onChange={(_, v) => v && setSort(v)}
          >
            <ToggleButton value="newest">Newest</ToggleButton>
            <ToggleButton value="priceAsc">Price ↑</ToggleButton>
            <ToggleButton value="priceDesc">Price ↓</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ShoppingCartIcon />}
            onClick={goToCart}
            sx={{ borderRadius: 3, px: 2.5 }}
          >
            Cart ({cart.length})
          </Button>
        </Box>
      </Box>

      {/* Tag suggestions (from products) */}
      {products.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {Array.from(
            new Set(products.flatMap((p) => p.tags || []))
          )
            .slice(0, 10)
            .map((t) => (
              <Chip
                key={t}
                label={t}
                variant="outlined"
                onClick={() => setSearch(t)}
                sx={{ borderRadius: 2 }}
              />
            ))}
        </Box>
      )}

    {/* Products Grid — exactly 3 columns on md+ */}
<Grid container spacing={3} justifyContent="center">
  {filteredSorted.map((product) => (
    <Grid item xs={12} md={4} key={product.id}>
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: 3,
          height: 420,   // taller card
          width:360,
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.25s ease',
          cursor: 'pointer',
          '&:hover': { boxShadow: 6, transform: 'translateY(-6px)' },
        }}
      >
        {/* Product Image */}
        <CardMedia
          component="img"
          height="240"   // taller image area
          image={
            product.images && product.images.length > 0
              ? product.images[0]
              : 'https://via.placeholder.com/300x200?text=No+Image'
          }
          alt={product.name}
          sx={{
            objectFit: 'cover',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
          onClick={() => setSelectedProduct(product)}
        />

        {/* Product Info */}
        <CardContent
          sx={{ flexGrow: 1, p: 2 }}
          onClick={() => setSelectedProduct(product)}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {product.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ₱{product.price.toFixed(2)}
          </Typography>
        </CardContent>

        {/* Actions */}
        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddShoppingCartIcon />}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            sx={{ borderRadius: 2 }}
          >
            Add
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              openDonate(product.weaver_id);
            }}
            sx={{ borderRadius: 2 }}
          >
            Donate
          </Button>
        </CardActions>
      </Card>
    </Grid>
  ))}
</Grid>


      {/* Donate Dialog */}
      <Dialog
        open={openDonateDialog}
        onClose={() => setOpenDonateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Donate to Weaver</DialogTitle>
        <DialogContent>
          <Donate user={user} weaverId={selectedWeaverId} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDonateDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Product Details Modal */}
      <Dialog
        open={!!selectedProduct}
        onClose={closeProductModal}
        maxWidth="md"
        fullWidth
        scroll="body"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={selectedProduct?.weaverPhotoURL}
              alt={selectedProduct?.weaverName}
              sx={{ width: 40, height: 40, cursor: 'pointer' }}
              onClick={() => {
                closeProductModal();
                if (selectedProduct?.weaver_id) goToProfile(selectedProduct.weaver_id);
              }}
            />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {selectedProduct?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                by {selectedProduct?.weaverName}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={closeProductModal}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          {selectedProduct && (
            <Grid container spacing={3}>
  {/* Gallery */}
  <Grid item xs={12} md={7}>
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        borderRadius: 2,
        boxShadow: 2,
      }}
    >
      <CardMedia
        component="img"
        image={selectedProduct.images[activeImageIdx]}
        alt={`${selectedProduct.name} image ${activeImageIdx + 1}`}
        sx={{
          width: '100%',
          aspectRatio: '16/9',   // ✅ uniform ratio
          objectFit: 'cover',
          transform: `scale(${zoom})`,
          transition: 'transform 0.2s ease',
        }}
      />
      {/* Nav arrows */}
      {selectedProduct.images.length > 1 && (
        <>
          <IconButton
            onClick={prevImage}
            sx={{
              position: 'absolute',
              top: '50%',
              left: 8,
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.4)',
              color: '#fff',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' },
            }}
            size="small"
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={nextImage}
            sx={{
              position: 'absolute',
              top: '50%',
              right: 8,
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.4)',
              color: '#fff',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' },
            }}
            size="small"
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </>
      )}

      {/* Zoom controls */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          display: 'flex',
          gap: 1,
        }}
      >
        <Tooltip title="Zoom out">
          <span>
            <IconButton
              onClick={zoomOut}
              disabled={zoom <= 1}
              sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
              size="small"
            >
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Zoom in">
          <span>
            <IconButton
              onClick={zoomIn}
              disabled={zoom >= 2}
              sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
              size="small"
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>

    {/* Thumbnails */}
    {selectedProduct.images.length > 1 && (
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {selectedProduct.images.map((img, idx) => (
          <Box
            key={idx}
            onClick={() => {
              setActiveImageIdx(idx);
              setZoom(1);
            }}
            sx={{
              width: 72,
              height: 72,
              borderRadius: 1,
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: idx === activeImageIdx ? 4 : 1,
              outline:
                idx === activeImageIdx ? '2px solid #8d6e63' : 'none',
            }}
          >
            <img
              src={img}
              alt={`thumb-${idx + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Box>
        ))}
      </Box>
    )}
  </Grid>

  {/* Details */}
  <Grid item xs={12} md={5}>
    <Typography variant="h5" fontWeight={700} gutterBottom>
      ${selectedProduct.price.toFixed(2)}
    </Typography>
    <Typography variant="body1" sx={{ mb: 2 }}>
      {selectedProduct.description || 'No description available.'}
    </Typography>

    {selectedProduct.tags?.length > 0 && (
      <>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ mb: 1 }}
        >
          Tags
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {selectedProduct.tags.map((t) => (
            <Chip key={t} label={t} variant="outlined" />
          ))}
        </Box>
      </>
    )}

    <Divider sx={{ my: 2 }} />

    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddShoppingCartIcon />}
        onClick={() => addToCart(selectedProduct)}
        sx={{ borderRadius: 2 }}
      >
        Add to Cart
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        startIcon={<FavoriteIcon />}
        onClick={() => {
          openDonate(selectedProduct.weaver_id);
        }}
        sx={{ borderRadius: 2 }}
      >
        Donate
      </Button>
      <Button
        variant="text"
        onClick={() => {
          closeProductModal();
          goToProfile(selectedProduct.weaver_id);
        }}
      >
        View Weaver Profile
      </Button>
    </Box>
  </Grid>
</Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeProductModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Shop;
