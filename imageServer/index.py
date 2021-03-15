import eventlet
import socketio

sio = socketio.Server(cors_allowed_origins='*')
app = socketio.WSGIApp(sio)

@sio.on('connect')
def connect(sid, env):
    print('已经连接成功了 ', sid)

@sio.on('img')
def img(sid,data):
    print('图片传输中，用户id和数据：',sid,data)

eventlet.wsgi.server(
    eventlet.wrap_ssl(
        eventlet.listen(('10.128.0.2', 3000)),
        certfile='cert.pem',
        keyfile='key.pem',
        server_side=True
    ), 
    app)