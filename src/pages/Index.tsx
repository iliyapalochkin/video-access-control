import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import VideoUploader from '@/components/VideoUploader';

const Index = () => {
  const [accessTime, setAccessTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [videoPlaying, setVideoPlaying] = useState<boolean>(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("https://disk.yandex.ru/i/hvkGnaux59Q6nw");
  const [videoType, setVideoType] = useState<'file' | 'vk' | 'youtube' | 'rutube'>('file');

  // Функция для определения типа видео и получения embed URL
  const getVideoInfo = (url: string) => {
    if (url.includes('vkvideo.ru') || url.includes('vk.com/video')) {
      // Извлекаем ID из VK ссылки
      const match = url.match(/video(-?\d+_\d+)/);
      if (match) {
        const videoId = match[1];
        return {
          type: 'vk' as const,
          embedUrl: `https://vk.com/video_ext.php?oid=${videoId.split('_')[0]}&id=${videoId.split('_')[1]}&hd=2`
        };
      }
    }
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // YouTube логика
      return { type: 'youtube' as const, embedUrl: url };
    }
    
    if (url.includes('rutube.ru')) {
      // RuTube логика
      return { type: 'rutube' as const, embedUrl: url };
    }

    if (url.includes('disk.yandex.ru')) {
      // Яндекс.Диск - преобразуем в прямую ссылку для скачивания
      if (url.includes('/i/')) {
        // Формат /i/ нужно преобразовать в прямую ссылку
        const directUrl = url.replace('/i/', '/d/') + '?download=1';
        return { type: 'file' as const, embedUrl: directUrl };
      }
      return { type: 'file' as const, embedUrl: url };
    }
    
    // Обычный файл или облачное хранилище
    return { type: 'file' as const, embedUrl: url };
  };

  // Загружаем сохраненное видео при загрузке страницы
  useEffect(() => {
    const savedVideo = localStorage.getItem('siteVideo');
    if (savedVideo) {
      try {
        const videoData = JSON.parse(savedVideo);
        // Создаем blob из base64 данных
        const base64Data = videoData.data.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: videoData.type });
        const videoUrl = URL.createObjectURL(blob);
        setCurrentVideoUrl(videoUrl);
      } catch (error) {
        console.error('Ошибка загрузки сохраненного видео:', error);
      }
    }
  }, []);
  const [showUploader, setShowUploader] = useState<boolean>(false);

  useEffect(() => {
    const storedAccessTime = localStorage.getItem('video_access_time');
    const currentTime = Date.now();
    
    if (storedAccessTime) {
      const accessTimestamp = parseInt(storedAccessTime);
      const timePassed = currentTime - accessTimestamp;
      const tenHoursInMs = 10 * 60 * 60 * 1000; // 10 часов в миллисекундах
      
      if (timePassed >= tenHoursInMs) {
        setHasAccess(false);
        setTimeRemaining(0);
      } else {
        setHasAccess(true);
        setTimeRemaining(tenHoursInMs - timePassed);
      }
    } else {
      // Первый визит - сохраняем время
      localStorage.setItem('video_access_time', currentTime.toString());
      setAccessTime(currentTime);
      setTimeRemaining(10 * 60 * 60 * 1000); // 10 часов
    }
  }, []);

  useEffect(() => {
    if (timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1000) {
            setHasAccess(false);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timeRemaining]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayVideo = () => {
    if (hasAccess) {
      setVideoPlaying(true);
      // Автоматически запускаем HTML5 видео
      const video = document.getElementById('custom-player') as HTMLVideoElement;
      if (video) {
        video.play();
      }
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <Icon name="Lock" size={64} className="mx-auto mb-6 text-gray-400" />
          <h1 className="text-2xl font-bold mb-4 text-gray-800">
            Доступ к видео истёк
          </h1>
          <p className="text-gray-600 mb-6">
            Время доступа к этому видео закончилось. Для повторного просмотра перейдите по ссылке заново.
          </p>
          <button 
            onClick={() => {
              localStorage.removeItem('video_access_time');
              window.location.reload();
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Обновить доступ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            Сделай это и твой трек услышат ТЫСЯЧИ человек
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            В этом видео я рассказываю про систему, благодаря которой этот мир сможет тебя услышать
          </p>
        </div>

        {/* Видеоплеер */}
        <div className="relative mb-8">
          <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl relative">
            {currentVideoUrl ? (
              (() => {
                const videoInfo = getVideoInfo(currentVideoUrl);
                
                if (videoInfo.type === 'vk') {
                  return (
                    <iframe
                      src={videoInfo.embedUrl}
                      className="w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;"
                    />
                  );
                }
                
                // Для обычных файлов
                return (
                  <>
                    <video
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                      id="custom-player"
                    >
                      <source src={currentVideoUrl} type="video/mp4" />
                      Ваш браузер не поддерживает воспроизведение видео.
                    </video>
                    
                    {/* Кастомный интерфейс поверх видео */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Кастомная кнопка play/pause по центру */}
                      {!videoPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                          <button 
                            onClick={handlePlayVideo}
                            className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300"
                          >
                            <Icon name="Play" size={48} className="ml-1" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Icon name="Video" size={64} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Видео не загружено</h3>
                  <p className="text-gray-300 mb-4">
                    Нажмите кнопку ниже, чтобы загрузить ваше видео
                  </p>
                  <button
                    onClick={() => setShowUploader(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Загрузить видео
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Кнопки CTA */}
        <div className="text-center mb-8">
          <button className="bg-red-600 hover:bg-red-700 text-white font-bold text-2xl px-12 py-4 rounded-lg transform hover:scale-105 transition-all duration-300 shadow-xl">
            СТАТЬ АРТИСТОМ
          </button>
        </div>

        {/* Таймер */}
        <div className="text-center mb-8">
          <p className="text-lg font-medium text-gray-700 mb-2">
            Доступ к этому видео будет закрыт через
          </p>
          <div className="text-4xl font-mono font-bold text-red-600">
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Модальное окно загрузки видео */}
        {showUploader && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Загрузить ваше видео</h3>
                  <button
                    onClick={() => setShowUploader(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Icon name="X" size={24} />
                  </button>
                </div>
                
                <VideoUploader 
                  onVideoSelect={(videoUrl: string) => {
                    setCurrentVideoUrl(videoUrl);
                    const videoInfo = getVideoInfo(videoUrl);
                    setVideoType(videoInfo.type);
                    setShowUploader(false);
                    setVideoPlaying(false);
                    // Принудительно обновляем плеер только для файлов
                    if (videoInfo.type === 'file') {
                      setTimeout(() => {
                        const video = document.getElementById('custom-player') as HTMLVideoElement;
                        if (video) {
                          video.load();
                        }
                      }, 100);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Index;