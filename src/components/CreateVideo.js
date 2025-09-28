// src/components/CreateVideo.js
import React, { useState, useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import {
  TextField,
  Button,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const CreateVideo = ({ user }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [video, setVideo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef(null);
  const videoContainerRef = useRef(null);
  const xhrRef = useRef(null);

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideo(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPlaying(false);
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    }
  };

  const handleUpload = async () => {
    if (!user) return alert('Login required');
    if (!video) return alert('Please select a video to upload');

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', video);
      formData.append('upload_preset', 'weave_unsigned');

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open('POST', 'https://api.cloudinary.com/v1_1/ddolnxwvm/video/upload', true);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(percent);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          const videoUrl = data.secure_url;

          await addDoc(collection(db, 'videoContents'), {
            user_id: user.uid,
            title,
            description,
            url: videoUrl,
            created_at: new Date().toISOString(),
          });

          alert('Video uploaded successfully!');
          resetForm();
        } else {
          throw new Error('Upload failed with status: ' + xhr.status);
        }
        setUploading(false);
        xhrRef.current = null;
      };

      xhr.onerror = () => {
        setUploading(false);
        alert('Network error during upload');
        xhrRef.current = null;
      };

      xhr.send(formData);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to upload video');
      setUploading(false);
      xhrRef.current = null;
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPreviewUrl(null);
    setVideo(null);
    setPlaying(false);
    setUploadProgress(0);
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      setUploading(false);
      setUploadProgress(0);
      alert('Upload canceled');
      xhrRef.current = null;
    }
  };

  useEffect(() => {
    if (previewUrl && videoContainerRef.current && !playerRef.current) {
      const videoElement = document.createElement('video');
      videoElement.id = 'preview-player';
      videoContainerRef.current.appendChild(videoElement);

      const player = videojs(videoElement, {
        controls: true,
        width: '100%',
        height: 'auto',
        muted: false,
        playsinline: true,
        sources: [{ src: previewUrl, type: 'video/mp4' }],
        fill: true,
        controlBar: {
          playToggle: true,
          progressControl: true,
          volumePanel: true,
          fullscreenToggle: true,
        },
      });
      playerRef.current = player;
    }
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
        if (videoContainerRef.current) {
          videoContainerRef.current.innerHTML = '';
        }
      }
    };
  }, [previewUrl]);

  const togglePlay = () => {
    if (playerRef.current) {
      if (playing) {
        playerRef.current.pause();
      } else {
        playerRef.current.play().catch(error => console.error('Play error:', error));
      }
      setPlaying(!playing);
    }
  };

  return (
    <Card sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 3, borderRadius: 3, boxShadow: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          Create Video Content
        </Typography>

        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Video Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={{ borderRadius: 2, py: 1.5 }}
          >
            Select Video
            <input type="file" accept="video/*" hidden onChange={handleVideoChange} />
          </Button>

          {previewUrl && (
            <Box
              ref={videoContainerRef}
              sx={{
                mt: 2,
                position: 'relative',
                width: '100%',
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: '#000',
                cursor: 'pointer',
              }}
              onClick={togglePlay}
            >
              <video
                id="preview-player"
                className="video-js vjs-fill"
                style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
              >
                <source src={previewUrl} type="video/mp4" />
              </video>
              <IconButton
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                }}
              >
                {playing ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            </Box>
          )}

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography align="center" sx={{ mt: 1 }}>
                {uploadProgress}%
              </Typography>
              <Button
                variant="contained"
                color="error"
                fullWidth
                onClick={handleCancelUpload}
                sx={{ mt: 2 }}
              >
                Cancel Upload
              </Button>
            </Box>
          )}

          {!uploading && (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleUpload}
              disabled={!video || !title}
              sx={{ borderRadius: 2, py: 1.5 }}
            >
              Upload Video
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CreateVideo;
