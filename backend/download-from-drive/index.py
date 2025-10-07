import json
import requests
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Скачивает видео с Google Drive и сохраняет в публичную папку
    Args: event - dict с httpMethod, body (driveUrl)
          context - объект с request_id, function_name
    Returns: HTTP response с URL сохранённого видео
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        drive_url = body_data.get('driveUrl')
        
        if not drive_url:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'driveUrl is required'})
            }
        
        # Извлекаем file ID из Google Drive URL
        file_id = None
        if '/d/' in drive_url:
            file_id = drive_url.split('/d/')[1].split('/')[0]
        elif 'id=' in drive_url:
            file_id = drive_url.split('id=')[1].split('&')[0]
        
        if not file_id:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid Google Drive URL'})
            }
        
        # Формируем прямую ссылку для скачивания
        download_url = f'https://drive.google.com/uc?export=download&id={file_id}'
        
        # Скачиваем файл
        response = requests.get(download_url, stream=True, timeout=300)
        
        # Проверяем на редирект (для больших файлов Google требует подтверждение)
        if 'confirm=' in response.text or response.status_code == 302:
            # Получаем confirm токен
            for key, value in response.cookies.items():
                if key.startswith('download_warning'):
                    download_url = f'{download_url}&confirm={value}'
                    break
            response = requests.get(download_url, stream=True, timeout=300)
        
        if response.status_code != 200:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Failed to download from Google Drive. Status: {response.status_code}'})
            }
        
        # Определяем имя файла
        filename = 'video.mp4'
        if 'Content-Disposition' in response.headers:
            content_disp = response.headers['Content-Disposition']
            if 'filename=' in content_disp:
                filename = content_disp.split('filename=')[1].strip('"')
        
        # Сохраняем во временную директорию (Cloud Functions не имеют доступа к public папке проекта)
        temp_path = f'/tmp/{filename}'
        
        total_size = 0
        with open(temp_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    total_size += len(chunk)
        
        # Конвертируем в base64 для передачи на фронтенд
        import base64
        with open(temp_path, 'rb') as f:
            video_bytes = f.read()
            video_base64 = base64.b64encode(video_bytes).decode('utf-8')
        
        # Удаляем временный файл
        os.remove(temp_path)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'filename': filename,
                'size': total_size,
                'videoBase64': video_base64,
                'message': f'Video downloaded successfully. Size: {total_size} bytes'
            })
        }
        
    except requests.exceptions.Timeout:
        return {
            'statusCode': 408,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Download timeout. File might be too large.'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Server error: {str(e)}'})
        }
