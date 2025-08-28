// src/components/CreateVideo.js
import React, { useState, useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css'; // Import Video.js CSS
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { TextField, Button, Typography, Box, LinearProgress, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

const CreateVideo = ({ user }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [video, setVideo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef(null); // Ref for Video.js player
  const videoContainerRef = useRef(null); // Ref for the container div
  const xhrRef = useRef(null); // Ref to store the XMLHttpRequest

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideo(file);
      setPreviewUrl(URL.createObjectURL(file)); // Local URL for preview
      setPlaying(false); // Reset playing state
      // Dispose existing player
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
      formData.append('upload_preset', 'weave_unsigned'); // Ensure this matches your preset

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr; // Store the xhr instance
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
          if (!data.secure_url) throw new Error('Upload failed');
          const videoUrl = data.secure_url;

          // Preload metadata
          const preloadResponse = await fetch(videoUrl, { method: 'HEAD' });
          if (preloadResponse.ok) {
            console.log('Video metadata preloaded, ready for playback');
          }

          await addDoc(collection(db, 'videoContents'), {
            user_id: user.uid,
            title,
            description,
            url: videoUrl,
            created_at: new Date().toISOString(),
          });
          alert('Video created and preloaded!');
          setPreviewUrl(null);
          setVideo(null);
          setPlaying(false);
          if (playerRef.current) {
            playerRef.current.dispose();
          }
        } else {
          throw new Error('Upload failed with status: ' + xhr.status);
        }
        setUploading(false);
        setUploadProgress(0);
        xhrRef.current = null; // Clear xhr ref on completion
      };

      xhr.onerror = () => {
        setUploading(false);
        alert('Network error during upload');
        xhrRef.current = null; // Clear xhr ref on error
      };

      xhr.send(formData);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to upload video');
      setUploading(false);
      setUploadProgress(0);
      xhrRef.current = null; // Clear xhr ref on error
    }
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort(); // Cancel the upload
      setUploading(false);
      setUploadProgress(0);
      alert('Upload canceled');
      xhrRef.current = null; // Clear xhr ref
    }
  };

  useEffect(() => {
    if (previewUrl && videoContainerRef.current && !playerRef.current) {
      const videoElement = document.createElement('video');
      videoElement.id = 'preview-player';
      videoContainerRef.current.appendChild(videoElement);

      const player = videojs(videoElement, {
        controls: true,
        width: '100%', // Match container width
        height: 'auto', // Adjust height based on aspect ratio
        muted: false,
        playsinline: true,
        sources: [{ src: previewUrl, type: 'video/mp4' }],
        fill: true, // Fit video to player while maintaining aspect ratio
        controlBar: {
          playToggle: true,
          progressControl: true,
          volumePanel: true,
          fullscreenToggle: true,
        },
      }, () => {
        console.log('Player ready');
      });
      player.on('error', (e) => console.error('Preview error:', e));
      playerRef.current = player;
    }
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
        if (videoContainerRef.current) {
          videoContainerRef.current.innerHTML = ''; // Clear the container
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
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontSize: '1.8rem', mb: 3 }}>Create Video Content</Typography>
      <TextField fullWidth label="Title" value={title} onChange={e => setTitle(e.target.value)} sx={{ mb: 3 }} />
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        sx={{ mb: 3, '& .MuiInputBase-root': { minWidth: '100%', maxWidth: '100%' } }}
      />
      <input type="file" accept="video/*" onChange={handleVideoChange} />
      {previewUrl && (
        <Box
          ref={videoContainerRef}
          sx={{
            mt: 3,
            mb: 3,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%', // Match TextField width
            paddingTop: '56.25%', // 16:9 aspect ratio (9 / 16 * 100)
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 2,
            backgroundColor: '#f0f0f0',
            '&:hover .play-pause-button': {
              opacity: 1,
            },
          }}
          data-video-preview
          onClick={togglePlay}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            <video
              id="preview-player"
              className="video-js vjs-fill" // Ensure fill mode
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} // Center and fit
            >
              <source src={previewUrl} type="video/mp4" />
            </video>
          </div>
          <IconButton
            className="play-pause-button"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
              opacity: 0,
              transition: 'opacity 0.3s ease',
              zIndex: 1,
            }}
            onClick={togglePlay}
          >
            {playing ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
        </Box>
      )}
      {uploading && (
        <Box sx={{ mt: 3 }}>
          <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 2 }} />
          <Button
            variant="contained"
            color="error"
            fullWidth
            onClick={handleCancelUpload}
            disabled={!uploading}
          >
            Cancel Upload
          </Button>
        </Box>
      )}
      {!uploading && (
        <Button variant="contained" fullWidth onClick={handleUpload} sx={{ mt: 3 }} disabled={uploading || !video}>
          Upload Video
        </Button>
      )}
    </Box>
  );
};

export default CreateVideo;