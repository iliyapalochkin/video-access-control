import React, { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface VideoUploaderProps {
  onVideoSelect: (videoUrl: string) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoSelect }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверяем тип файла
    if (!file.type.startsWith('video/')) {
      alert('Пожалуйста, выберите видеофайл');
      return;
    }

    // Проверяем размер (максимум 5GB)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > maxSize) {
      alert('Файл слишком большой. Максимум 5GB');
      return;
    }

    handleUpload(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Создаем URL для локального видео
      const videoUrl = URL.createObjectURL(file);
      
      // Для больших файлов показываем реалистичный прогресс
      const fileSize = file.size;
      const steps = fileSize > 1024 * 1024 * 1024 ? 20 : 10; // Для файлов >1GB больше шагов
      const stepDelay = fileSize > 1024 * 1024 * 1024 ? 200 : 100; // Для больших файлов больше задержка
      
      for (let progress = 0; progress <= 100; progress += (100 / steps)) {
        setUploadProgress(Math.min(progress, 100));
        await new Promise(resolve => setTimeout(resolve, stepDelay));
      }

      // Передаем URL родительскому компоненту
      onVideoSelect(videoUrl);
      
      alert(`Видео успешно загружено! Размер: ${formatFileSize(fileSize)}`);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('Ошибка при загрузке видео');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
      <div className="text-center">
        <Icon name="Upload" size={48} className="mx-auto mb-4 text-gray-400" />
        
        <h3 className="text-lg font-semibold mb-2">Загрузить видео</h3>
        
        <p className="text-gray-600 mb-4">
          Выберите видеофайл с компьютера (максимум 5GB)
        </p>

        {isUploading ? (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Загрузка... {uploadProgress}%
            </p>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Выбрать файл
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="mt-4 text-xs text-gray-500">
          <p>Поддерживаемые форматы: MP4, AVI, MOV, WMV</p>
          <p>Максимальный размер: 5GB</p>
        </div>
      </div>
    </div>
  );
};

export default VideoUploader;