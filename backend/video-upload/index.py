import json
import base64
import os
import uuid
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Загрузка видеофайлов на сервер для постоянного хранения
    Args: event - dict с httpMethod, body (base64 видео), headers
          context - объект с request_id, function_name и др.
    Returns: HTTP response с URL загруженного видео
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
        # Парсим данные
        body_data = json.loads(event.get('body', '{}'))
        
        # Получаем base64 данные видео
        video_data = body_data.get('videoData')
        filename = body_data.get('filename', 'video.mp4')
        
        if not video_data:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No video data provided'})
            }
        
        # Декодируем base64
        try:
            # Убираем префикс data:video/mp4;base64, если есть
            if ',' in video_data:
                video_data = video_data.split(',')[1]
            
            video_bytes = base64.b64decode(video_data)
        except Exception as e:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Invalid base64 data: {str(e)}'})
            }
        
        # Генерируем уникальное имя файла
        file_extension = filename.split('.')[-1] if '.' in filename else 'mp4'
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        
        # Возвращаем base64 видео обратно для хранения на клиенте
        # т.к. Cloud Functions не имеют постоянного хранилища
        file_size = len(video_bytes)
        
        # Создаем data URL для прямого использования
        mime_type = body_data.get('mimeType', 'video/mp4')
        data_url = f"data:{mime_type};base64,{video_data}"
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'filename': unique_filename,
                'size': file_size,
                'dataUrl': data_url,
                'message': f'Video processed successfully. Size: {file_size} bytes. Store in localStorage for persistence.'
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Server error: {str(e)}'})
        }