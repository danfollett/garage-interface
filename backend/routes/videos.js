const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const Vehicle = require('../models/Vehicle');
const { uploadVideo, uploadThumbnail } = require('../config/multer');
const path = require('path');
const fs = require('fs');

// Helper function to extract YouTube video ID
const extractYouTubeId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

// Helper function to get YouTube thumbnail
const getYouTubeThumbnail = (videoId) => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

// Get all videos
router.get('/', async (req, res) => {
  try {
    const videos = await Video.getAll();
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get recent videos
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const videos = await Video.getRecent(limit);
    res.json(videos);
  } catch (error) {
    console.error('Error fetching recent videos:', error);
    res.status(500).json({ error: 'Failed to fetch recent videos' });
  }
});

// Get video count by vehicle type
router.get('/count-by-vehicle-type', async (req, res) => {
  try {
    const counts = await Video.getCountByVehicleType();
    res.json(counts);
  } catch (error) {
    console.error('Error fetching video counts:', error);
    res.status(500).json({ error: 'Failed to fetch video counts' });
  }
});

// Get video count by video type
router.get('/count-by-video-type', async (req, res) => {
  try {
    const counts = await Video.getCountByVideoType();
    res.json(counts);
  } catch (error) {
    console.error('Error fetching video type counts:', error);
    res.status(500).json({ error: 'Failed to fetch video type counts' });
  }
});

// Search videos
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const videos = await Video.search(q);
    res.json(videos);
  } catch (error) {
    console.error('Error searching videos:', error);
    res.status(500).json({ error: 'Failed to search videos' });
  }
});

// Get videos by type (local or youtube)
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['local', 'youtube'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid video type' });
    }
    
    const videos = await Video.getByType(type);
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos by type:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get videos for a specific vehicle
router.get('/vehicle/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    // Verify vehicle exists
    await Vehicle.getById(vehicleId);
    
    const videos = await Video.getByVehicleId(vehicleId);
    res.json(videos);
  } catch (error) {
    console.error('Error fetching vehicle videos:', error);
    if (error.message === 'Vehicle not found') {
      res.status(404).json({ error: 'Vehicle not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  }
});

// Get single video
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.getById(req.params.id);
    res.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    if (error.message === 'Video not found') {
      res.status(404).json({ error: 'Video not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch video' });
    }
  }
});

// Add YouTube video
router.post('/vehicle/:vehicleId/youtube', uploadThumbnail.single('thumbnail'), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { title, description, youtube_url } = req.body;
    
    // Verify vehicle exists
    await Vehicle.getById(vehicleId);
    
    // Validate YouTube URL
    if (!youtube_url) {
      return res.status(400).json({ error: 'YouTube URL required' });
    }
    
    const videoId = extractYouTubeId(youtube_url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    
    // Use YouTube thumbnail if no custom thumbnail uploaded
    const thumbnailPath = req.file 
      ? `/uploads/thumbnails/${req.file.filename}`
      : getYouTubeThumbnail(videoId);
    
    const videoData = {
      vehicle_id: vehicleId,
      title: title || 'YouTube Video',
      description: description || '',
      type: 'youtube',
      path_or_url: `https://www.youtube.com/embed/${videoId}`,
      thumbnail_path: thumbnailPath
    };
    
    const newVideo = await Video.create(videoData);
    res.status(201).json(newVideo);
  } catch (error) {
    console.error('Error adding YouTube video:', error);
    
    // Clean up uploaded thumbnail on error
    if (req.file) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', 'thumbnails', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    if (error.message === 'Vehicle not found') {
      res.status(404).json({ error: 'Vehicle not found' });
    } else {
      res.status(500).json({ error: 'Failed to add YouTube video' });
    }
  }
});

// Upload local video
router.post('/vehicle/:vehicleId/upload', 
  uploadVideo.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]), 
  async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const { title, description } = req.body;
      
      // Verify vehicle exists
      await Vehicle.getById(vehicleId);
      
      // Check if video was uploaded
      if (!req.files || !req.files.video) {
        return res.status(400).json({ error: 'Video file required' });
      }
      
      const videoFile = req.files.video[0];
      const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;
      
      // Use original filename as title if not provided
      const videoTitle = title || path.basename(videoFile.originalname, path.extname(videoFile.originalname));
      
      const videoData = {
        vehicle_id: vehicleId,
        title: videoTitle,
        description: description || '',
        type: 'local',
        path_or_url: `/uploads/videos/${videoFile.filename}`,
        thumbnail_path: thumbnailFile 
          ? `/uploads/thumbnails/${thumbnailFile.filename}`
          : null
      };
      
      const newVideo = await Video.create(videoData);
      res.status(201).json(newVideo);
    } catch (error) {
      console.error('Error uploading video:', error);
      
      // Clean up uploaded files on error
      if (req.files) {
        if (req.files.video) {
          const videoPath = path.join(__dirname, '..', '..', 'uploads', 'videos', req.files.video[0].filename);
          if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
          }
        }
        if (req.files.thumbnail) {
          const thumbPath = path.join(__dirname, '..', '..', 'uploads', 'thumbnails', req.files.thumbnail[0].filename);
          if (fs.existsSync(thumbPath)) {
            fs.unlinkSync(thumbPath);
          }
        }
      }
      
      if (error.message === 'Vehicle not found') {
        res.status(404).json({ error: 'Vehicle not found' });
      } else {
        res.status(500).json({ error: 'Failed to upload video' });
      }
    }
});

// Update video
router.put('/:id', uploadThumbnail.single('thumbnail'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const videoId = req.params.id;
    
    // Get existing video
    const existingVideo = await Video.getById(videoId);
    
    const videoData = {
      title: title || existingVideo.title,
      description: description !== undefined ? description : existingVideo.description,
      thumbnail_path: req.file 
        ? `/uploads/thumbnails/${req.file.filename}`
        : existingVideo.thumbnail_path
    };
    
    // Delete old thumbnail if new one uploaded and it's a local file
    if (req.file && existingVideo.thumbnail_path && existingVideo.thumbnail_path.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', '..', existingVideo.thumbnail_path);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    const updatedVideo = await Video.update(videoId, videoData);
    res.json(updatedVideo);
  } catch (error) {
    console.error('Error updating video:', error);
    if (error.message === 'Video not found') {
      res.status(404).json({ error: 'Video not found' });
    } else {
      res.status(500).json({ error: 'Failed to update video' });
    }
  }
});

// Delete a video
router.delete('/:id', async (req, res) => {
  try {
    const videoId = req.params.id;
    
    // Get video to delete files
    const video = await Video.getById(videoId);
    
    // Delete from database
    await Video.delete(videoId);
    
    // Delete files if they're local
    if (video.type === 'local' && video.path_or_url) {
      const videoPath = path.join(__dirname, '..', '..', video.path_or_url);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }
    
    // Delete thumbnail if it's local
    if (video.thumbnail_path && video.thumbnail_path.startsWith('/uploads/')) {
      const thumbPath = path.join(__dirname, '..', '..', video.thumbnail_path);
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    }
    
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    if (error.message === 'Video not found') {
      res.status(404).json({ error: 'Video not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete video' });
    }
  }
});

module.exports = router;