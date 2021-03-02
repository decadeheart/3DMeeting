/*  
*2020.11.8
* https://github.com/juniorxsound/THREE.Multiplayer
* https://github.com/Miczeq22/simple-chat-app
*
*/

//////EXPRESS服务器////////
const express = require('express');
const app = express();
const fs = require('fs')

const httpsOption = {
  key:fs.readFileSync('./public/cert/127.0.0.1-key.pem'),
  cert:fs.readFileSync('./public/cert/127.0.0.1.pem')
}
console.log('httpsOption',httpsOption)
////////HTTP/////////
//const https = require('http').createServer(app);

////////HTTPs/////////
const https = require('https').createServer(httpsOption,app);

//当前目录下环境变量port的值
const port = process.env.PORT || 1989;

//app.listen也可
const server = https.listen(port);
console.log('服务器运行在端口: ' + port);

//io()的出处
const io = require('socket.io').listen(server);
// io.set('origins', '*:*');
// io.set('origins', '0.0.0.0:3000','0.0.0.0:1989');

app.use(express.static('public'));

// 网络穿透服务
let iceServers = [{url:'stun:stun.l.google.com:19302'},
{url:'stun:stun1.l.google.com:19302'},
{url:'stun:stun2.l.google.com:19302'},
{url:'stun:stun3.l.google.com:19302'},
{url:'stun:stun4.l.google.com:19302'},];

let clients = {};

//Socket 设置
io.on('connection', client => {

    console.log('用户 ' + client.id + ' 连接了, 一共有' + io.engine.clientsCount + ' 客户端连接');

    //坐标和当前朝向
    clients[client.id] = {
      position: [0, 0.5, 0],
      rotation: [0, 0, 0, 1],
      name:"" 
    }

    //确保发送客户端的ID和用于WebRTC网络遍历的ICE服务器列表 
    client.emit('introduction', client.id, io.engine.clientsCount, Object.keys(clients), iceServers);
    client.on('name',(id,name)=>{

      clients[id].name = name;

      client.emit('getAllName', clients);
      //更新变化的用户数量
      io.sockets.emit('newUserConnected', io.engine.clientsCount, client.id, name,Object.keys(clients));
    })

    // 发送当前存在客户端的位置
    client.emit('userPositions', clients);



    //监听移动信息
    client.on('move', (data) => {
      if (clients[client.id]) {
        clients[client.id].position = data[0];
        clients[client.id].rotation = data[1];
      }
      io.sockets.emit('userPositions', clients);

    });

    //处理断开情况
    client.on('disconnect', () => {

      delete clients[client.id];
      io.sockets.emit('userDisconnected', io.engine.clientsCount, client.id, Object.keys(clients));
      console.log('User ' + client.id + ' diconnected, there are ' + io.engine.clientsCount + ' clients connected');

    });

    // WEBRTC 通信
    client.on("call-user", (data) => {
      console.log('Server forwarding call from ' + client.id + " to " + data.to);
      client.to(data.to).emit("call-made", {
        offer: data.offer,
        socket: client.id
      });
    });

    client.on("make-answer", data => {
      client.to(data.to).emit("answer-made", {
        socket: client.id,
        answer: data.answer
      });
    });

    client.on("reject-call", data => {
      client.to(data.from).emit("call-rejected", {
        socket: client.id
      });
    });

    // ICE 设置
    client.on('addIceCandidate', data => {
      client.to(data.to).emit("iceCandidateFound", {
        socket: client.id,
        candidate: data.candidate
      });
    });

    //接收图片
    client.on('img',data=>{
      //console.log(data.id+'前面是用户id:后面是图片连接'+data.url);
      imgId=data.id;
      imgUrl=data.url;
    })
});
