import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Select,
  MenuItem,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";

const CARD_HEIGHT = 420;
const IMAGE_HEIGHT = 220;

const Admin = ({ user, role }) => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [videos, setVideos] = useState([]);

  // Product modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoom, setZoom] = useState(1);

  // Fetch all collections
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [usersSnap, productsSnap, videosSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "products")),
        getDocs(collection(db, "videoContents")),
      ]);

      const userData = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const productData = await Promise.all(
        productsSnap.docs.map(async (docItem) => {
          const data = docItem.data();
          let weaverName = "Unknown Weaver";
          let weaverPhotoURL = "";
          if (data.weaver_id) {
            const weaverDoc = await getDoc(doc(db, "users", data.weaver_id));
            if (weaverDoc.exists()) {
              weaverName = weaverDoc.data().name || weaverName;
              weaverPhotoURL = weaverDoc.data().photoURL || "";
            }
          }
          return {
            id: docItem.id,
            ...data,
            weaverName,
            weaverPhotoURL,
            images: data.images || [],
          };
        })
      );

      const videoData = videosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setUsers(userData);
      setProducts(productData);
      setVideos(videoData);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") fetchAll();
  }, [role]);

  // CRUD actions
  const handleRoleChange = async (id, newRole) => {
    await updateDoc(doc(db, "users", id), { role: newRole });
    fetchAll();
  };

  const handleDeleteUser = async (id) => {
    await deleteDoc(doc(db, "users", id));
    fetchAll();
  };

  const handleDeleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
    fetchAll();
  };

  const handleDeleteVideo = async (id) => {
    await deleteDoc(doc(db, "videoContents", id));
    fetchAll();
  };

  if (role !== "admin") {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="error" gutterBottom>
          Access Denied – Admins only.
        </Typography>
      </Box>
    );
  }

  if (loading)
    return (
      <Box sx={{ p: 5, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading admin data...</Typography>
      </Box>
    );

  // Image modal helpers
  const nextImage = () =>
    setActiveImageIdx((i) =>
      selectedProduct && i + 1 < selectedProduct.images.length ? i + 1 : 0
    );
  const prevImage = () =>
    setActiveImageIdx((i) =>
      selectedProduct && i - 1 >= 0 ? i - 1 : selectedProduct.images.length - 1
    );
  const zoomIn = () => setZoom((z) => Math.min(2, z + 0.25));
  const zoomOut = () => setZoom((z) => Math.max(1, z - 0.25));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Admin Dashboard
      </Typography>

      <Tabs value={tab} onChange={(e, val) => setTab(val)} sx={{ mb: 3 }}>
        <Tab label="Manage Users" />
        <Tab label="Products" />
        <Tab label="Videos" />
      </Tabs>

      {/* USERS TAB */}
      {tab === 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell><b>Name</b></TableCell>
                <TableCell><b>Email</b></TableCell>
                <TableCell><b>Role</b></TableCell>
                <TableCell><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name || "N/A"}</TableCell>
                  <TableCell>{u.email || "N/A"}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role || "user"}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      size="small"
                    >
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="weaver">Weaver</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <IconButton color="error" onClick={() => handleDeleteUser(u.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* PRODUCTS TAB */}
      {tab === 1 && (
        <>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
            Weaver Products
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {products.length > 0 ? (
              products.map((p) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
                  <Card
                    onClick={() => {
                      setSelectedProduct(p);
                      setActiveImageIdx(0);
                      setZoom(1);
                    }}
                    sx={{
                      height: CARD_HEIGHT,
                      borderRadius: 3,
                      boxShadow: 3,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": { transform: "translateY(-5px)", boxShadow: 6 },
                    }}
                  >
                    <CardMedia
                      component="img"
                      height={IMAGE_HEIGHT}
                      image={
                        p.images?.[0] ||
                        "https://via.placeholder.com/400x300?text=No+Image"
                      }
                      alt={p.name}
                      sx={{
                        objectFit: "cover",
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                      }}
                    />
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} noWrap>
                        {p.name || "Unnamed Product"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ₱{p.price || "N/A"}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                        <Avatar src={p.weaverPhotoURL} alt={p.weaverName} sx={{ width: 28, height: 28 }} />
                        <Typography variant="caption" color="text.secondary">
                          {p.weaverName}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: "flex-end", pb: 2, px: 2 }}>
                      <IconButton
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(p.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            ) : (
              <Typography>No products found.</Typography>
            )}
          </Grid>

          {/* PRODUCT MODAL */}
          <Dialog
            open={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
            maxWidth="md"
            fullWidth
            scroll="body"
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar src={selectedProduct?.weaverPhotoURL} alt={selectedProduct?.weaverName} />
                <Typography variant="h6">{selectedProduct?.weaverName}</Typography>
              </Box>
              <IconButton onClick={() => setSelectedProduct(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              {selectedProduct && (
                <>
                  <Box sx={{ position: "relative" }}>
                    <CardMedia
                      component="img"
                      image={
                        selectedProduct.images[activeImageIdx] ||
                        "https://via.placeholder.com/600x400?text=No+Image"
                      }
                      alt={selectedProduct.name}
                      sx={{
                        width: "100%",
                        borderRadius: 2,
                        objectFit: "cover",
                        transform: `scale(${zoom})`,
                        transition: "transform 0.2s",
                      }}
                    />
                    {selectedProduct.images.length > 1 && (
                      <>
                        <IconButton
                          onClick={prevImage}
                          sx={{
                            position: "absolute",
                            top: "50%",
                            left: 10,
                            background: "rgba(0,0,0,0.4)",
                            color: "#fff",
                          }}
                        >
                          <ArrowBackIosNewIcon />
                        </IconButton>
                        <IconButton
                          onClick={nextImage}
                          sx={{
                            position: "absolute",
                            top: "50%",
                            right: 10,
                            background: "rgba(0,0,0,0.4)",
                            color: "#fff",
                          }}
                        >
                          <ArrowForwardIosIcon />
                        </IconButton>
                      </>
                    )}
                    <Box sx={{ position: "absolute", bottom: 10, right: 10 }}>
                      <Tooltip title="Zoom out">
                        <IconButton
                          onClick={zoomOut}
                          disabled={zoom <= 1}
                          sx={{ backgroundColor: "rgba(255,255,255,0.9)" }}
                        >
                          <ZoomOutIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Zoom in">
                        <IconButton
                          onClick={zoomIn}
                          disabled={zoom >= 2}
                          sx={{
                            backgroundColor: "rgba(255,255,255,0.9)",
                            ml: 1,
                          }}
                        >
                          <ZoomInIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Typography variant="h5" fontWeight={700} sx={{ mt: 2 }}>
                    ₱{selectedProduct.price}
                  </Typography>
                  <Typography sx={{ mb: 2 }}>
                    {selectedProduct.description || "No description."}
                  </Typography>

                  {selectedProduct.tags?.length > 0 && (
                    <>
                      <Typography variant="subtitle2">Tags:</Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                        {selectedProduct.tags.map((tag) => (
                          <Chip key={tag} label={tag} variant="outlined" />
                        ))}
                      </Box>
                    </>
                  )}
                </>
              )}
            </DialogContent>

            <DialogActions>
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  handleDeleteProduct(selectedProduct.id);
                  setSelectedProduct(null);
                }}
              >
                Delete Product
              </Button>
              <Button onClick={() => setSelectedProduct(null)}>Close</Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* VIDEOS TAB */}
      {tab === 2 && (
        <>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
            Uploaded Videos
          </Typography>
          <Grid container spacing={3}>
            {videos.map((v) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={v.id}>
                <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                  {v.url || v.videoURL ? (
                    <video
                      src={v.url || v.videoURL}
                      controls
                      style={{
                        width: "100%",
                        height: 220,
                        objectFit: "cover",
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                      }}
                    />
                  ) : (
                    <CardMedia
                      component="img"
                      height="220"
                      image="https://via.placeholder.com/300x200?text=No+Video"
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" noWrap>
                      {v.title || "Untitled"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {v.user_id}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "flex-end", pb: 2 }}>
                    <IconButton color="error" onClick={() => handleDeleteVideo(v.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Admin;
