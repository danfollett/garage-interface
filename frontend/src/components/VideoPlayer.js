import React, { useState } from 'react';
import { Upload, Video, Youtube, Trash2, X, Plus, Play } from 'lucide-react';
import { videoAPI } from '../services/api';
import { formatDate, ACCEPTED_FILE_TYPES, FILE_SIZE_LIMITS } from '../utils/constants';

const VideoPlayer = ({ videos, vehicleId, onDelete, onUpdate }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState('youtube'); // 'youtube' or 'upload'
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleYouTubeSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      await videoAPI.addYouTube(vehicleId, {
        title: videoTitle || 'YouTube Video',
        description: videoDescription,
        youtube_url: youtubeUrl
      });
      
      // Reset form
      setYoutubeUrl('');
      setVideoTitle('');
      setVideoDescription('');
      setShowAddModal(false);
      onUpdate();
    } catch (err) {
      console.error('Error adding YouTube video:', err);
      alert('Failed to add YouTube video: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > FILE_SIZE_LIMITS.VIDEO) {
      alert('Video file must be less than 500MB');
      return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', videoTitle || file.name.replace(/\.[^/.]+$/, ''));
    formData.append('description', videoDescription);

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      await videoAPI.uploadLocal(vehicleId, formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset form
      setTimeout(() => {
        setVideoTitle('');
        setVideoDescription('');
        setShowAddModal(false);
        setUploading(false);
        setUploadProgress(0);
        onUpdate();
      }, 500);
    } catch (err) {
      console.error('Error uploading video:', err);
      alert('Failed to upload video: ' + err.message);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (videos.length === 0 && !showAddModal) {
    return (
      <div className="text-center py-12">
        <Video size={64} className="mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg mb-6">No videos added yet</p>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 bg-garage-accent hover:bg-orange-600 px-6 py-3 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Add Video</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Video Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-garage-accent hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Add Video</span>
        </button>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors"
          >
            {/* Thumbnail */}
            <div 
              className="aspect-video bg-gray-900 relative cursor-pointer group"
              onClick={() => setSelectedVideo(video)}
            >
              {video.thumbnail_path ? (
                <img
                  src={video.thumbnail_path.startsWith('http') 
                    ? video.thumbnail_path 
                    : `http://localhost:5000${video.thumbnail_path}`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video size={48} className="text-gray-600" />
                </div>
              )}
              
              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white bg-opacity-20 rounded-full p-4">
                  <Play size={32} className="text-white" fill="white" />
                </div>
              </div>

              {/* Type Badge */}
              <div className="absolute top-2 right-2">
                {video.type === 'youtube' ? (
                  <Youtube size={24} className="text-red-500" />
                ) : (
                  <Video size={24} className="text-blue-500" />
                )}
              </div>
            </div>

            {/* Video Info */}
            <div className="p-4">
              <h3 className="font-semibold mb-1">{video.title}</h3>
              {video.description && (
                <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                  {video.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {formatDate(video.created_at)}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(video.id);
                  }}
                  className="text-red-500 hover:text-red-400 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-garage-gray rounded-lg w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">Add Video</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setYoutubeUrl('');
                  setVideoTitle('');
                  setVideoDescription('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4">
              {/* Type Selection */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setAddType('youtube')}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    addType === 'youtube'
                      ? 'bg-garage-accent text-white'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  YouTube
                </button>
                <button
                  onClick={() => setAddType('upload')}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    addType === 'upload'
                      ? 'bg-garage-accent text-white'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  Upload
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Enter video title"
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description (optional)</label>
                  <textarea
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    placeholder="Enter video description"
                    rows={3}
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
                  />
                </div>

                {addType === 'youtube' ? (
                  <div>
                    <label className="block text-sm font-medium mb-2">YouTube URL</label>
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-2">Video File</label>
                    <input
                      type="file"
                      accept={ACCEPTED_FILE_TYPES.VIDEO}
                      onChange={handleVideoUpload}
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-garage-accent file:text-white hover:file:bg-orange-600"
                      disabled={uploading}
                    />
                    <p className="text-xs text-gray-400 mt-1">Max file size: 500MB</p>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-2">
                    {addType === 'youtube' ? 'Adding video...' : 'Uploading video...'}
                  </p>
                  {addType === 'upload' && (
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-garage-accent h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              {addType === 'youtube' && (
                <button
                  onClick={handleYouTubeSubmit}
                  disabled={uploading || !youtubeUrl}
                  className="w-full mt-4 bg-garage-accent hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Add YouTube Video
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-garage-gray rounded-lg w-full max-w-6xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">{selectedVideo.title}</h2>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-gray-400 hover:text-white touch-target"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4">
              {selectedVideo.type === 'youtube' ? (
                <div className="aspect-video">
                  <iframe
                    src={selectedVideo.path_or_url}
                    title={selectedVideo.title}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : (
                <video
                  controls
                  className="w-full rounded-lg"
                  src={`http://localhost:5000${selectedVideo.path_or_url}`}
                >
                  Your browser does not support the video tag.
                </video>
              )}

              {selectedVideo.description && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-400">{selectedVideo.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;