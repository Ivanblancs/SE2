// src/components/ViewContent.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css'; // Import Video.js CSS
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Stack, Card, CardContent, Typography, Box, IconButton, Avatar, CircularProgress } from '@mui/material';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import { useNavigate } from 'react-router-dom';

const ViewContent = () => {
  const [videos, setVideos] = useState([]);
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const playerRefs = useRef({}); // Store Video.js player instances

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'videoContents'));
      const fetchedVideos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const videosWithCreators = await Promise.all(fetchedVideos.map(async (vid) => {
        let creatorName = 'Unknown Creator';
        let creatorPhotoURL = '';
        const userDoc = await getDoc(doc(db, 'users', vid.user_id));
        if (userDoc.exists()) {
          creatorName = userDoc.data().name;
          creatorPhotoURL = userDoc.data().photoURL || '';
        }
        return { ...vid, creatorName, creatorPhotoURL };
      }));
      setVideos(videosWithCreators);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const goToProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleError = (id, error) => {
    console.error(`Video playback error for ID ${id}:`, error);
    alert('This video cannot be played. Ensure it’s an MP4 and publicly accessible on Cloudinary.');
    setPlayingVideoId(null);
  };

  const initializePlayer = (videoId, url) => {
    if (!playerRefs.current[videoId] && document.getElementById(`video-player-${videoId}`)) {
      const player = videojs(`video-player-${videoId}`, {
        controls: true,
        fluid: true, // Dynamic sizing based on container
        // Removed aspectRatio to let video dictate its size
        muted: true,
        playsinline: true,
        sources: [{ src: url, type: 'video/mp4' }],
        fill: true, // Fit video to player while maintaining aspect ratio
        controlBar: {
          playToggle: true,
          progressControl: true,
          volumePanel: true,
          fullscreenToggle: true,
        },
      }, () => {
        console.log(`Player ready for video ${videoId}`);
      });
      playerRefs.current[videoId] = player;
      player.on('error', (e) => handleError(videoId, e));
      player.on('play', () => console.log(`Playing ${videoId}`));
      player.on('pause', () => console.log(`Paused ${videoId}`));
    }
  };

  const togglePlay = (videoId) => {
    const player = playerRefs.current[videoId];
    if (!player) return; // Skip if player not initialized

    if (playingVideoId === videoId) {
      player.pause();
      setPlayingVideoId(null);
    } else {
      // Pause other players
      Object.values(playerRefs.current).forEach(p => p !== player && p.pause());
      setPlayingVideoId(videoId);
      player.play().catch(error => {
        console.error(`Play error for ${videoId}:`, error);
        handleError(videoId, error);
      });
    }
  };

  useEffect(() => {
    // Initialize players for all videos
    videos.forEach(video => {
      initializePlayer(video.id, video.url);
    });
    // Cleanup on unmount
    return () => {
      Object.values(playerRefs.current).forEach(player => player?.dispose());
      playerRefs.current = {};
    };
  }, [videos]);

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom align="center">Educational Content</Typography>
      <Stack spacing={4}>
        {videos.length > 0 ? (
          videos.map(video => (
            <Card key={video.id} sx={{ boxShadow: 3, borderRadius: 2 }}>
              <Box onClick={() => togglePlay(video.id)} sx={{ cursor: 'pointer' }}>
                <div data-vjs-player>
                  <video
                    id={`video-player-${video.id}`}
                    className="video-js"
                    style={{ width: '100%', height: 'auto', objectFit: 'contain' }} // Fit the video
                    preload="metadata"
                  >
                    <source src={video.url} type="video/mp4" />
                  </video>
                </div>
              </Box>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar src={video.creatorPhotoURL} alt={video.creatorName} sx={{ width: 32, height: 32, mr: 1, cursor: 'pointer' }} onClick={() => goToProfile(video.user_id)} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => goToProfile(video.user_id)}>{video.creatorName}</Typography>
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{video.title}</Typography>
                <Typography variant="body2">{video.description}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <IconButton aria-label="like">
                    <ThumbUpOutlinedIcon />
                  </IconButton>
                  <IconButton aria-label="comment">
                    <ChatBubbleOutlineOutlinedIcon />
                  </IconButton>
                  <IconButton aria-label="share">
                    <ShareOutlinedIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography align="center">No videos available. Upload some content to get started!</Typography>
        )}
      </Stack>
    </Box>
  );
};

export default ViewContent;