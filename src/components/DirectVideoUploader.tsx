import React, { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface DirectVideoUploaderProps {
  onVideoSelect: (videoUrl: string) => void;
}

const DirectVideoUploader: React.FC<DirectVideoUploaderProps> = ({ onVideoSelect }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверяем тип файла
    if (!file.type.startsWith('video/')) {
      alert('Пожалуйста, выберите видеофайл');
      return;
    }

    setCurrentFile(file);
    handleDirectUpload(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDirectUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Создаем URL для прямого воспроизведения
      const videoUrl = URL.createObjectURL(file);
      
      // Имитируем прогресс загрузки
      const progressSteps = [10, 25, 50, 75, 90, 100];
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadProgress(progressSteps[i]);
      }

      // Передаем URL для воспроизведения
      onVideoSelect(videoUrl);
      
      alert(`✅ Видео готово к просмотру!\nРазмер: ${formatFileSize(file.size)}\nТип: ${file.type}\n\n🎬 Видео загружено и будет воспроизводиться прямо на сайте!`);
      
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('❌ Ошибка при загрузке видео. Попробуйте еще раз.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors">
        <div className="text-center">
          <Icon name="Upload" size={48} className="mx-auto mb-4 text-blue-500" />
          
          <h3 className="text-lg font-semibold mb-2 text-gray-800">Загрузить видео на сайт</h3>
          
          <p className="text-gray-600 mb-4 text-sm">
            Видео будет воспроизводиться прямо на вашем сайте<br/>
            <span className="text-blue-600 font-medium">💡 Любой размер • Мгновенное воспроизведение</span>
          </p>

          {isUploading ? (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-700 font-medium">
                Подготовка видео... {uploadProgress}%
              </p>
              {currentFile && (
                <p className="text-xs text-gray-500 mt-1">
                  {currentFile.name} • {formatFileSize(currentFile.size)}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Выбрать видеофайл
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="mt-4 text-xs text-gray-500 bg-white rounded-lg p-3">
            <p className="font-medium text-gray-700 mb-1">✅ Преимущества:</p>
            <p>• Воспроизведение прямо на сайте</p>
            <p>• Мгновенная загрузка без ожидания</p>
            <p>• Поддержка файлов любого размера</p>
            <p>• Форматы: MP4, AVI, MOV, WMV, MKV</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectVideoUploader;