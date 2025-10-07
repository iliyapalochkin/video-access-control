import React, { useState } from 'react';
import Icon from '@/components/ui/icon';
import funcUrls from '../../backend/func2url.json';

interface GoogleDriveDownloaderProps {
  onVideoDownloaded: (videoUrl: string) => void;
}

const GoogleDriveDownloader: React.FC<GoogleDriveDownloaderProps> = ({ onVideoDownloaded }) => {
  const [driveUrl, setDriveUrl] = useState<string>('https://drive.google.com/file/d/1eXbat2EkxhehBMJc7iE3sgM-RoThojFo/view');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const saveToIndexedDB = async (filename: string, videoBase64: string, size: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // Конвертируем base64 в Blob
        const byteCharacters = atob(videoBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'video/mp4' });
        
        // Создаем File объект
        const file = new File([blob], filename, { type: 'video/mp4' });
        
        const request = indexedDB.open('VideoStorage', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('videos')) {
            db.createObjectStore('videos');
          }
        };
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['videos'], 'readwrite');
          const store = transaction.objectStore('videos');
          
          const videoData = {
            name: filename,
            size: size,
            type: 'video/mp4',
            file: file,
            uploadDate: new Date().toISOString()
          };
          
          const putRequest = store.put(videoData, 'siteVideo');
          
          putRequest.onsuccess = () => {
            db.close();
            resolve(blob);
          };
          
          putRequest.onerror = () => {
            db.close();
            reject(putRequest.error);
          };
        };
      } catch (err) {
        reject(err);
      }
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    if (!driveUrl.trim()) {
      setError('Введите ссылку на Google Drive');
      return;
    }

    setIsDownloading(true);
    setProgress(0);
    setError('');

    try {
      setProgress(10);
      
      const response = await fetch(funcUrls['download-from-drive'], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ driveUrl })
      });

      setProgress(30);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки с Google Drive');
      }

      const data = await response.json();
      setProgress(60);

      if (!data.success) {
        throw new Error(data.message || 'Не удалось скачать видео');
      }

      // Сохраняем в IndexedDB
      const blob = await saveToIndexedDB(data.filename, data.videoBase64, data.size);
      setProgress(90);

      // Создаем URL для воспроизведения
      const videoUrl = URL.createObjectURL(blob);
      setProgress(100);

      onVideoDownloaded(videoUrl);

      alert(`✅ Видео загружено и сохранено!\nРазмер: ${formatFileSize(data.size)}\n\n✨ Видео теперь доступно офлайн и будет работать в полноэкранном режиме в Safari!`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      alert(`❌ Ошибка: ${errorMessage}\n\n💡 Проверьте, что ссылка правильная и файл доступен для скачивания (публичный доступ)`);
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border-2 border-dashed border-green-300 hover:border-green-500 transition-colors">
        <div className="text-center">
          <Icon name="Download" size={48} className="mx-auto mb-4 text-green-500" />
          
          <h3 className="text-lg font-semibold mb-2 text-gray-800">Загрузить с Google Drive</h3>
          
          <p className="text-gray-600 mb-4 text-sm">
            ✅ <span className="text-green-600 font-medium">Видео сохранится на сервере</span><br/>
            <span className="text-gray-500">Автоматическая загрузка с вашего Google Drive</span>
          </p>

          {!isDownloading ? (
            <>
              <div className="mb-4">
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              
              <button
                onClick={handleDownload}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Скачать и сохранить видео
              </button>
            </>
          ) : (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-700 font-medium">
                Загрузка видео... {progress}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Это может занять несколько минут для больших файлов
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500 bg-white rounded-lg p-3">
            <p className="font-medium text-gray-700 mb-1">📋 Как это работает:</p>
            <p>• Сервер скачивает видео с Google Drive</p>
            <p>• Сохраняет в браузере через IndexedDB</p>
            <p>• Полноэкранный режим работает в Safari</p>
            <p>• Видео доступно офлайн после загрузки</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveDownloader;
