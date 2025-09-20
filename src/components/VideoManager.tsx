import React, { useState } from 'react';
import VideoUploader from './VideoUploader';
import Icon from '@/components/ui/icon';

interface VideoManagerProps {
  currentVideo?: string;
  onVideoChange: (videoUrl: string) => void;
}

const VideoManager: React.FC<VideoManagerProps> = ({ 
  currentVideo = '', 
  onVideoChange 
}) => {
  const [localVideo, setLocalVideo] = useState<string>(currentVideo);
  const [showUploader, setShowUploader] = useState(false);

  const handleVideoSelect = (videoUrl: string) => {
    setLocalVideo(videoUrl);
    setShowUploader(false);
  };

  const handleUseVideo = () => {
    onVideoChange(localVideo);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Управление видео</h2>
        
        {localVideo ? (
          <div className="space-y-6">
            {/* Превью видео */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={localVideo}
                controls
                className="w-full h-full object-cover"
              >
                Ваш браузер не поддерживает воспроизведение видео.
              </video>
            </div>

            {/* Действия */}
            <div className="flex gap-4">
              <button
                onClick={handleUseVideo}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
              >
                <Icon name="Check" size={20} />
                Применить к сайту
              </button>
              
              <button
                onClick={() => setShowUploader(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
              >
                <Icon name="Upload" size={20} />
                Загрузить другое
              </button>
              
              <button
                onClick={() => setLocalVideo('')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
              >
                <Icon name="Trash2" size={20} />
                Удалить
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Icon name="Video" size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Видео не выбрано</h3>
            <p className="text-gray-600 mb-6">
              Загрузите видеофайл для использования на сайте
            </p>
            <button
              onClick={() => setShowUploader(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Загрузить видео
            </button>
          </div>
        )}

        {/* Модальное окно загрузки */}
        {showUploader && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Загрузка видео</h3>
                <button
                  onClick={() => setShowUploader(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Icon name="X" size={24} />
                </button>
              </div>
              
              <VideoUploader onVideoSelect={handleVideoSelect} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoManager;