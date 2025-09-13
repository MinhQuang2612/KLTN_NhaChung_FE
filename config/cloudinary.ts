// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: "dsbf5zlyv",
  
  // Video URLs từ Cloudinary của bạn
  VIDEOS: {
    PANEL_1: "https://res.cloudinary.com/dsbf5zlyv/video/upload/v1757788258/videopanel_j9xnwm.mp4",
    PANEL_2: "https://res.cloudinary.com/dsbf5zlyv/video/upload/v1757788272/videopanel1_eqj57i.mp4",
  }
};

// Helper function để lấy random video
export const getRandomVideo = () => {
  const videos = [CLOUDINARY_CONFIG.VIDEOS.PANEL_1, CLOUDINARY_CONFIG.VIDEOS.PANEL_2];
  return videos[Math.floor(Math.random() * videos.length)];
};
