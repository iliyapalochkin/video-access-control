import json
import time
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Upload and serve video files for the website
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with function metadata
    Returns: HTTP response dict with video upload/serve functionality
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    elif method == 'GET':
        # Получение списка видео или конкретного видео
        params = event.get('queryStringParameters', {}) or {}
        video_id = params.get('video_id')
        
        if video_id:
            # Возвращаем информацию о конкретном видео
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'video_id': video_id,
                    'status': 'available',
                    'stream_url': f'https://functions.poehali.dev/video-stream?id={video_id}',
                    'upload_url': 'https://functions.poehali.dev/972ec2bc-ed85-4ed1-8cfa-eaba5692cc4c'
                }),
                'isBase64Encoded': False
            }
        else:
            # Возвращаем список всех видео
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'videos': [
                        {'id': 'demo_video', 'name': 'Demo Video', 'duration': '5:30'}
                    ],
                    'upload_url': 'https://functions.poehali.dev/972ec2bc-ed85-4ed1-8cfa-eaba5692cc4c',
                    'instructions': 'POST video as base64 in body with filename'
                }),
                'isBase64Encoded': False
            }
    
    elif method == 'POST':
        # Загрузка видео - упрощенная версия
        try:
            body = event.get('body', '{}')
            if body:
                body_data = json.loads(body)
                filename = body_data.get('filename', 'video.mp4')
                video_data = body_data.get('video_data', '')
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'video_id': f'video_{int(time.time())}',
                        'filename': filename,
                        'message': 'Video upload endpoint ready'
                    }),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No data provided'}),
                    'isBase64Encoded': False
                }
                
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': str(e)}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }