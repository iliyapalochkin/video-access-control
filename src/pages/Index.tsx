import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const Index = () => {
  const [accessTime, setAccessTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [videoPlaying, setVideoPlaying] = useState<boolean>(false);

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
            <video
              className="w-full h-full object-cover"
              controls
              preload="metadata"
              id="custom-player"
            >
              <source src="https://disk.yandex.ru/i/hvkGnaux59Q6nw" type="video/mp4" />
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
          </div>
        </div>

        {/* Кнопка CTA */}
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



      </div>
    </div>
  );
};

export default Index;