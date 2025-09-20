def handler(event, context):
    '''
    Business: Simple video service for website
    '''
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': '{"status": "ready", "message": "Video service is working"}',
        'isBase64Encoded': False
    }