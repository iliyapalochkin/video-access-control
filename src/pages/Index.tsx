import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import VideoUploader from '@/components/VideoUploader';
import funcUrls from '../../backend/func2url.json';

const Index = () => {
  const [accessTime, setAccessTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [videoPlaying, setVideoPlaying] = useState<boolean>(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("https://vkvideo.ru/video-232832261_456239018");
  const [videoType, setVideoType] = useState<'file' | 'vk' | 'youtube' | 'rutube' | 'yandex' | 'google' | 'mega'>('vk');
  const [showCtaButton, setShowCtaButton] = useState<boolean>(false);
  const [ctaTimeRemaining, setCtaTimeRemaining] = useState<number>(1 * 60 * 1000); // 1 минута в миллисекундах

  // Функция для определения типа видео и получения embed URL
  const getVideoInfo = (url: string) => {
    if (url.includes('vkvideo.ru') || url.includes('vk.com/video')) {
      // Извлекаем ID из VK ссылки (убираем параметры после ?)
      const cleanUrl = url.split('?')[0];
      const match = cleanUrl.match(/video(-?\d+_\d+)/);
      if (match) {
        const videoId = match[1];
        const [oid, id] = videoId.split('_');
        return {
          type: 'vk' as const,
          embedUrl: `https://vk.com/video_ext.php?oid=${oid}&id=${id}&hd=2`
        };
      }
    }
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // YouTube логика
      return { type: 'youtube' as const, embedUrl: url };
    }

    if (url.includes('drive.google.com')) {
      // Google Drive - преобразуем в embed ссылку
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        return { type: 'google' as const, embedUrl: embedUrl };
      }
      return { type: 'file' as const, embedUrl: url };
    }
    
    if (url.includes('rutube.ru')) {
      // RuTube логика
      return { type: 'rutube' as const, embedUrl: url };
    }

    if (url.includes('mega.nz')) {
      // Mega.nz - используем iframe для встраивания
      const embedUrl = url.replace('mega.nz/file/', 'mega.nz/embed/');
      return { type: 'mega' as const, embedUrl: embedUrl };
    }

    if (url.includes('disk.yandex.ru')) {
      // Яндекс.Диск - получаем прямую ссылку для скачивания
      let directUrl = url;
      if (url.includes('/i/')) {
        // Формируем API запрос для получения прямой ссылки
        const publicKey = url.split('/i/')[1];
        directUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(url)}`;
      }
      return { type: 'file' as const, embedUrl: directUrl };
    }
    
    // Обычный файл или облачное хранилище
    return { type: 'file' as const, embedUrl: url };
  };

  // Автоматически загружаем видео с YouTube
  useEffect(() => {
    const YOUTUBE_VIDEO_ID = "HnwyFI_f3Q4";
    const embedUrl = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1&autohide=1&showinfo=0`;
    
    setCurrentVideoUrl(embedUrl);
    setVideoType('youtube');
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

  // Таймер для появления кнопки CTA через 1 минуту
  useEffect(() => {
    const ctaTimer = setTimeout(() => {
      setShowCtaButton(true);
    }, 1 * 60 * 1000); // 1 минута

    return () => clearTimeout(ctaTimer);
  }, []);

  // Обратный отсчет до появления кнопки
  useEffect(() => {
    if (!showCtaButton && ctaTimeRemaining > 0) {
      const interval = setInterval(() => {
        setCtaTimeRemaining(prev => {
          if (prev <= 1000) {
            setShowCtaButton(true);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showCtaButton, ctaTimeRemaining]);

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
                      width="100%"
                      height="100%"
                    />
                  );
                }

                if (videoInfo.type === 'youtube') {
                  return (
                    <iframe
                      src={videoInfo.embedUrl}
                      className="w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    />
                  );
                }

                if (videoInfo.type === 'yandex') {
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

                if (videoInfo.type === 'google' || videoInfo.type === 'gdrive') {
                  return (
                    <iframe
                      src={videoInfo.embedUrl}
                      className="w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock; accelerometer; gyroscope;"
                      style={{ border: 0 }}
                    />
                  );
                }

                if (videoInfo.type === 'mega') {
                  return (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
                      <div className="text-center text-white p-8">
                        <Icon name="ExternalLink" size={64} className="mx-auto mb-4 text-blue-400" />
                        <h3 className="text-2xl font-bold mb-4">Видео готово к просмотру</h3>
                        <p className="text-lg mb-6 text-gray-300">
                          Ваше видео размером 2.4ГБ загружено на Mega.nz
                        </p>
                        <a
                          href={currentVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl px-8 py-4 rounded-lg transform hover:scale-105 transition-all duration-300 shadow-xl inline-flex items-center gap-3"
                        >
                          <Icon name="Play" size={24} />
                          Смотреть видео
                        </a>
                        <p className="text-sm text-gray-400 mt-4">
                          Откроется в новой вкладке • Высокое качество • Без ограничений
                        </p>
                      </div>
                    </div>
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
                  <h3 className="text-xl font-semibold mb-2">Загрузите ваше видео</h3>
                  <p className="text-gray-300 mb-4">
                    Выберите один из способов загрузки видео
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
        {showCtaButton && (
          <div className="text-center mb-8">
            <a 
              href="https://buro17.ru/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block"
            >
              <button className="bg-red-600 hover:bg-red-700 text-white font-bold text-2xl px-12 py-4 rounded-lg transform hover:scale-105 transition-all duration-300 shadow-xl">
                СТАТЬ АРТИСТОМ
              </button>
            </a>
          </div>
        )}

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