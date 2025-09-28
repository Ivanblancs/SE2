// src/components/UploadProduct.js
import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import axios from 'axios';
import {
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  Card,
  CardContent,
  Alert,
  Stack,
  LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const UploadProduct = ({ user }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progressList, setProgressList] = useState([]); // per-image progress

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setProgressList(new Array(files.length).fill(0));
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    setCurrentPreviewIndex(0);
  };

  const handleNext = () => {
    setCurrentPreviewIndex((prev) =>
      Math.min(prev + 1, previewUrls.length - 1)
    );
  };

  const handlePrev = () => {
    setCurrentPreviewIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleDelete = () => {
    const newImages = images.filter((_, idx) => idx !== currentPreviewIndex);
    const newPreviewUrls = previewUrls.filter(
      (_, idx) => idx !== currentPreviewIndex
    );
    setImages(newImages);
    setPreviewUrls(newPreviewUrls);
    setProgressList(progressList.filter((_, idx) => idx !== currentPreviewIndex));
    setCurrentPreviewIndex((prev) =>
      Math.min(prev, newPreviewUrls.length - 1)
    );
  };

  const handleUpload = async () => {
    if (!user) return alert('Login required');
    if (!images.length) return alert('Please select at least one image');

    try {
      setUploading(true);

      // Upload all images in parallel
      const uploadPromises = images.map((image, idx) => {
        const formData = new FormData();
        formData.append('file', image);
        formData.append('upload_preset', 'weave_unsigned');

        return axios.post(
          'https://api.cloudinary.com/v1_1/ddolnxwvm/image/upload',
          formData,
          {
            onUploadProgress: (event) => {
              const percent = Math.round((event.loaded * 100) / event.total);
              setProgressList((prev) => {
                const copy = [...prev];
                copy[idx] = percent;
                return copy;
              });
            },
          }
        );
      });

      const responses = await Promise.all(uploadPromises);
      const imageUrls = responses.map((res) => res.data.secure_url);

      // Save product
      await addDoc(collection(db, 'products'), {
        weaver_id: user.uid,
        name,
        price: parseFloat(price),
        description,
        images: imageUrls,
        created_at: new Date().toISOString(),
      });

      setSuccessMsg('Product uploaded successfully! 🎉');
      setTimeout(() => setSuccessMsg(''), 4000);

      // Reset
      setName('');
      setPrice('');
      setDescription('');
      setImages([]);
      setPreviewUrls([]);
      setProgressList([]);
      setCurrentPreviewIndex(0);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload product');
    } finally {
      setUploading(false);
    }
  };

  const totalProgress =
    progressList.length > 0
      ? Math.round(progressList.reduce((a, b) => a + b, 0) / progressList.length)
      : 0;

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 5, p: 2, borderRadius: 3, boxShadow: 4 }}>
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h5" fontWeight={700} color="primary" align="center">
            Upload New Product
          </Typography>

          {successMsg && <Alert severity="success">{successMsg}</Alert>}

          <TextField
            fullWidth
            label="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            fullWidth
            label="Price (USD)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description (e.g., size, materials, weaving details)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Upload Box */}
          <Box
            sx={{
              border: '2px dashed #aaa',
              borderRadius: 3,
              textAlign: 'center',
              p: 3,
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main', background: '#fafafa' },
            }}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImagesChange}
              style={{ display: 'none' }}
              id="upload-input"
            />
            <label htmlFor="upload-input" style={{ cursor: 'pointer' }}>
              <CloudUploadIcon color="primary" sx={{ fontSize: 40 }} />
              <Typography variant="body1" color="text.secondary">
                Click or drag files here to upload
              </Typography>
            </label>
          </Box>

          {/* Preview */}
          {previewUrls.length > 0 && (
            <Box
              sx={{
                mt: 2,
                position: 'relative',
                height: 250,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: 2,
              }}
            >
              <img
                src={previewUrls[currentPreviewIndex]}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
              <IconButton
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(255,255,255,0.8)',
                }}
                onClick={handleDelete}
              >
                <DeleteIcon color="error" />
              </IconButton>
              {previewUrls.length > 1 && (
                <>
                  <IconButton
                    onClick={handlePrev}
                    sx={{ position: 'absolute', left: 8, bgcolor: 'white' }}
                    disabled={currentPreviewIndex === 0}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                  <IconButton
                    onClick={handleNext}
                    sx={{ position: 'absolute', right: 8, bgcolor: 'white' }}
                    disabled={currentPreviewIndex === previewUrls.length - 1}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </>
              )}
            </Box>
          )}

          {/* Progress Bar */}
          {uploading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress variant="determinate" value={totalProgress} />
              <Typography align="center" sx={{ mt: 1 }}>
                Uploading... {totalProgress}%
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleUpload}
            disabled={uploading}
            sx={{ py: 1.5, borderRadius: 3, fontSize: '1rem' }}
          >
            {uploading ? 'Uploading...' : 'Upload Product'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default UploadProduct;
