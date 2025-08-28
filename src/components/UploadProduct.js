// src/components/UploadProduct.js
import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { TextField, Button, Typography, Box, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteIcon from '@mui/icons-material/Delete';

const UploadProduct = ({ user }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    setCurrentPreviewIndex(0); // Reset to first image
  };

  const handleNext = () => {
    setCurrentPreviewIndex((prev) => Math.min(prev + 1, previewUrls.length - 1));
  };

  const handlePrev = () => {
    setCurrentPreviewIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleDelete = () => {
    const newImages = images.filter((_, index) => index !== currentPreviewIndex);
    const newPreviewUrls = previewUrls.filter((_, index) => index !== currentPreviewIndex);
    setImages(newImages);
    setPreviewUrls(newPreviewUrls);
    // Adjust index if deleted the last one or beyond
    setCurrentPreviewIndex((prev) => Math.min(prev, newPreviewUrls.length - 1));
  };

  const handleUpload = async () => {
    if (!user) return alert('Login required');
    if (images.length === 0) return alert('Please select at least one image');

    try {
      const imageUrls = [];
      for (const image of images) {
        const formData = new FormData();
        formData.append('file', image);
        formData.append('upload_preset', 'weave_unsigned'); // Replace with your actual unsigned preset name

        const response = await fetch('https://api.cloudinary.com/v1_1/ddolnxwvm/image/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (!data.secure_url) {
          throw new Error('Upload failed for image: ' + image.name);
        }
        imageUrls.push(data.secure_url);
      }

      // Save to Firestore with array of images
      await addDoc(collection(db, 'products'), {
        weaver_id: user.uid,
        name,
        price,
        description,
        images: imageUrls, // Array of image URLs
        created_at: new Date().toISOString(),
      });
      alert('Product uploaded!');
      // Reset states after upload
      setImages([]);
      setPreviewUrls([]);
      setCurrentPreviewIndex(0);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload product');
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Upload Product</Typography>
      <TextField fullWidth label="Name" value={name} onChange={e => setName(e.target.value)} sx={{ mb: 2 }} />
      <TextField fullWidth label="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} sx={{ mb: 2 }} />
      <TextField fullWidth multiline rows={4} label="Description (e.g., size, how it's made)" value={description} onChange={e => setDescription(e.target.value)} sx={{ mb: 2 }} />
      <input type="file" multiple accept="image/*" onChange={handleImagesChange} />
      {previewUrls.length > 0 && (
        <Box sx={{ mt: 2, position: 'relative', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={previewUrls[currentPreviewIndex]} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          <IconButton sx={{ position: 'absolute', top: 0, right: 0, color: 'red' }} onClick={handleDelete}>
            <DeleteIcon />
          </IconButton>
          {previewUrls.length > 1 && (
            <>
              <IconButton onClick={handlePrev} sx={{ position: 'absolute', left: 0 }} disabled={currentPreviewIndex === 0}>
                <ArrowBackIcon />
              </IconButton>
              <IconButton onClick={handleNext} sx={{ position: 'absolute', right: 0 }} disabled={currentPreviewIndex === previewUrls.length - 1}>
                <ArrowForwardIcon />
              </IconButton>
            </>
          )}
        </Box>
      )}
      <Button variant="contained" fullWidth onClick={handleUpload} sx={{ mt: 2 }}>Upload</Button>
    </Box>
  );
};

export default UploadProduct;