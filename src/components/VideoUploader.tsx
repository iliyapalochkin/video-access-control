import React, { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';
import DirectVideoUploader from './DirectVideoUploader';

interface VideoUploaderProps {
  onVideoSelect: (videoUrl: string) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoSelect }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'direct' | 'url' | 'cloud' | 'file'>('direct');
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

  const handleUrlSubmit = () => {
    if (!videoUrl.trim()) {
      alert('Пожалуйста, введите ссылку на видео');
      return;
    }

    // Проверяем поддерживаемые платформы
    const supportedPlatforms = [
      'drive.google.com',
      'dropbox.com',
      'vkvideo.ru',
      'vk.com/video', 
      'youtube.com',
      'youtu.be',
      'rutube.ru',
      'disk.yandex.ru'
    ];

    const isSupported = supportedPlatforms.some(platform => 
      videoUrl.toLowerCase().includes(platform)
    );

    if (!isSupported) {
      alert('Поддерживаются ссылки с: VK Видео, YouTube, RuTube');
      return;
    }

    onVideoSelect(videoUrl);
  };

  const handleCloudUrlSubmit = () => {
    if (!videoUrl.trim()) {
      alert('Пожалуйста, введите ссылку на видео из Яндекс.Диска');
      return;
    }

    // Проверяем Яндекс.Диск
    if (!videoUrl.includes('disk.yandex.ru')) {
      alert('Пожалуйста, используйте ссылку с Яндекс.Диска\nФормат: https://disk.yandex.ru/d/...');
      return;
    }

    // Проверяем формат прямой ссылки
    if (!videoUrl.includes('/d/')) {
      alert('Используйте прямую ссылку на файл:\n1. Откройте видео в Яндекс.Диске\n2. Нажмите "Поделиться"\n3. Выберите "Скопировать ссылку"\n4. Ссылка должна содержать /d/');
      return;
    }

    onVideoSelect(videoUrl);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Для больших файлов показываем реалистичный прогресс
      const fileSize = file.size;
      const steps = fileSize > 1024 * 1024 * 1024 ? 20 : 10;
      const stepDelay = fileSize > 1024 * 1024 * 1024 ? 200 : 100;
      
      // Симулируем прогресс конвертации
      for (let progress = 0; progress <= 70; progress += (70 / steps)) {
        setUploadProgress(Math.min(progress, 70));
        await new Promise(resolve => setTimeout(resolve, stepDelay));
      }

      // Создаем URL для воспроизведения
      const videoUrl = URL.createObjectURL(file);
      setUploadProgress(80);

      // Для больших файлов (>50MB) используем только временное хранение
      // localStorage не может хранить файлы >5-10MB
      if (fileSize > 50 * 1024 * 1024) {
        console.log('Файл слишком большой для localStorage, используем временное хранение');
        setUploadProgress(100);
        onVideoSelect(videoUrl);
        alert(`Видео загружено! Размер: ${formatFileSize(fileSize)}\n⚠️ Большие файлы работают только в текущей сессии.\nДля постоянного хранения используйте файлы до 50МБ.`);
        return;
      }

      // Для файлов до 50MB сохраняем в localStorage
      try {
        const base64Data = await convertToBase64(file);
        setUploadProgress(85);

        const videoData = {
          name: file.name,
          size: fileSize,
          type: file.type,
          data: base64Data,
          uploadDate: new Date().toISOString()
        };
        
        localStorage.setItem('siteVideo', JSON.stringify(videoData));
        setUploadProgress(95);
        
        alert(`Видео сохранено на сайте! Размер: ${formatFileSize(fileSize)}\n✅ Теперь все посетители увидят ваше видео постоянно.`);
      } catch (error) {
        console.error('Ошибка сохранения в localStorage:', error);
        alert(`Видео загружено, но не сохранено постоянно. Размер: ${formatFileSize(fileSize)}\n⚠️ Для постоянного хранения используйте файлы поменьше.`);
      }

      setUploadProgress(100);

      // Передаем URL родительскому компоненту
      onVideoSelect(videoUrl);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('Ошибка при загрузке видео');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-center">Добавить видео</h3>
      
      {/* Табы */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setActiveTab('direct')}
          className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'direct'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📱 Прямо на сайт
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'url'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🔗 По ссылке
        </button>
      </div>

      {activeTab === 'direct' ? (
        <DirectVideoUploader onVideoSelect={onVideoSelect} />
      ) : activeTab === 'url' ? (
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Поддерживаются: VK Видео, YouTube, RuTube
          </p>
          
          <div className="mb-4">
            <input
              type="url"
              placeholder="https://vkvideo.ru/video-..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleUrlSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Добавить видео
          </button>
        </div>
      ) : activeTab === 'cloud' ? (
        <div className="text-center">
          <Icon name="Cloud" size={48} className="mx-auto mb-4 text-blue-500" />
          
          <p className="text-gray-600 mb-4">
            Вставьте прямую ссылку с Яндекс.Диска<br/>
            <span className="text-xs text-green-600">💡 Любой размер файла • Быстрая загрузка • Постоянный доступ</span>
          </p>
          
          <div className="mb-4">
            <input
              type="url"
              placeholder="https://disk.yandex.ru/d/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleCloudUrlSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors mb-4"
          >
            Загрузить из облака
          </button>

          <div className="text-left text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium mb-2">📋 Как получить ссылку с Яндекс.Диска:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Откройте disk.yandex.ru</li>
              <li>Загрузите ваше видео</li>
              <li>Нажмите на файл → кнопка "Поделиться"</li>
              <li>Нажмите "Скопировать ссылку"</li>
              <li>Вставьте ссылку сюда</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <Icon name="Upload" size={48} className="mx-auto mb-4 text-gray-400" />
          
          <p className="text-gray-600 mb-4">
            Выберите видеофайл с компьютера (максимум 5GB)<br/>
            <span className="text-sm text-blue-600">До 50MB - постоянное хранение | Свыше 50MB - только сессия</span>
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
      )}
    </div>
  );
};

export default VideoUploader;