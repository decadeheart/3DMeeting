
// socket.io
let socket;
let socket2;
let id;

// 客户端数组
let clients = {};
var clientNames = {};
var content;
var homeContent; 
var passContent;

// 存储threejs的变量
let glScene;

// WebRTC 变量:
const { RTCPeerConnection, RTCSessionDescription } = window;
let iceServerList;

//视频宽、高、码率
const videoWidth = 160;
const videoHeight = 120;
const videoFrameRate = 15;

//本地流
var localMediaStream = null;
var nowClient;

//本地音频视频流约束
let mediaConstraints = {
	audio: true,
	video: {
		width: videoWidth,
		height: videoHeight,
		frameRate: videoFrameRate
	}
}



////////////////////////////////////////////////////////////////////////////////
// 启动时的执行顺序
////////////////////////////////////////////////////////////////////////////////

window.onload = async () => {
	// 首先获得媒体，webrtc接口
	localMediaStream = await getMedia(mediaConstraints);

	function show(){
		mask.style.display = "none";
		modal.style.display = "block";
	}
	function close(){
		

		content = document.getElementById('nameContent').value;
		homeContent = document.getElementById('homeContent').value;
		passContent = document.getElementById('passContent').value;

		if(content&&homeContent){
			mask.style.display = "none";
			modal.style.display = "none";
			// 信令连接
			initSocketConnection();

			// 创建threejs场景
			createScene();
		}

	}
	// 获取需要使用到的元素
	var mask = document.getElementsByClassName("mask")[0];
	var modal = document.getElementsByClassName("modal")[0];
	var closes = document.getElementsByClassName("close");
	show();
	closes[0].onclick = close;
	closes[1].onclick = close;
	console.log("加载窗口.");

};

////////////////////////////////////////////////////////////////////////////////
// 本地流媒体设置
////////////////////////////////////////////////////////////////////////////////

// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia，接口文档
async function getMedia(_mediaConstraints) {
	let stream = null;

	try {
		stream = await navigator.mediaDevices.getUserMedia(_mediaConstraints);
	} catch (err) {
		console.log("获取媒体失败!");
		console.warn(err);
	}

	return stream;
}

function addTracksToPeerConnection(_stream, _pc) {
	if (_stream == null) {
		console.log("Local User media stream not yet established!");
	} else {
		//每一个pc都建立追踪监听
		_stream.getTracks().forEach(track => {
			_pc.addTrack(track, _stream)
		});
	}
}

////////////////////////////////////////////////////////////////////////////////
// socket通信部分
////////////////////////////////////////////////////////////////////////////////

//建立socket连接
function initSocketConnection() {
	console.log("初始化 socket.io...");
	socket = io().connect("https://127.0.0.1:1989",{secure: true})


	//终于成功连接上了！！！解决了技术难题，可以通信了！！，关键在于重新创建一个连接！！
	socket2 = io.connect("wss://119.29.208.124:3000", {'force new connection': true });
	//socket2 = io.connect("ws://localhost:3000", {transports: ['websocket', 'polling', 'flashsocket']},{'force new connection': true });
	//socket2 = io.connect("ws://localhost:3000", {'force new connection': true });

	//下面是错误的连接方法
	//socket2 = io().connect("ws://localhost:3000");

	socket.on('connect', () => { });

	socket2.on('connect', () => {
		console.log(' 图片传输端口连接成功')
	  });
	  
	//socket2.emit('CH01', 'me', 'test msg');
	//socket2.emit("message", "HELLO INCLUDE HELP");



	//在连接服务器上，向客户端发送其ID和所有密钥的列表
	socket.on('introduction', (_id, _clientNum, _ids, _iceServers) => {
		// 从服务收到服务器的凭据
		console.log("从服务器获得ICE服务器许可证",_iceServers);
		iceServerList = _iceServers;

		// 保持本地ID:
		console.log('我的 socket ID 是: ' + _id);
		id = _id;
		nowClient = _id;
		//clients[_id].name = content;

		//发送本地姓名
		socket.emit('name',nowClient,content);

		
		//对于每个现有用户，将其添加为客户端，并将轨迹添加到其对等连接--这个方法适用于后发进入的用户
		for (let i = 0; i < _ids.length; i++) {
			//排除了是当前id，只和其他的id建立连接
			if (_ids[i] != id) {
				addClient(_ids[i]);
				callUser(_ids[i]);
			}else{
			}
		}
		

	});

	//新用户加入服务器时--这个方法适用于先加入用户，逐个新增新的客户端
	socket.on('newUserConnected', (clientCount, _id,name, _ids) => {
		console.log(clientCount + ' 个客户端已经连接了');

		let alreadyHasUser = false;
		for (let i = 0; i < Object.keys(clients).length; i++) {
			//返回对象的可枚举字符串属性和方法的名称
			if (Object.keys(clients)[i] == _id) {
				alreadyHasUser = true;
				break;
			}
		}
		if (_id != id && !alreadyHasUser) {
			console.log('新用户添加了: ' + _id + name);
			addClient(_id);
			if(!clients[_id].name){
				clients[_id].name = name;
				//console.log('clients[_id].name',clients[_id].name);
			}
		}
		
	});

	//用户断开
	socket.on('userDisconnected', (clientCount, _id, _ids) => {
		// 更新服务器数据

		if (_id != id) {
			console.log('一个用户已经下线了，id如下: ' + _id+',还剩'+clientCount+'个客户端');
			glScene.removeClient(_id);
			delete clients[_id];
		}
	});


	// 更新移动，使用的方法是在server中定义的
	socket.on('userPositions', _clientProps => {
		
		glScene.updateClientPositions(_clientProps);
	});
	//打电话模式
	socket.on("call-made", async data => {
		console.log("Receiving call from user " + data.socket);

		//将远程会话描述设置为传入报价
		await clients[data.socket].peerConnection.setRemoteDescription(
			new RTCSessionDescription(data.offer)
		);

		// 创建答案并将本地会话描述设置为该答案
		//peerConnection里的方法
		const answer = await clients[data.socket].peerConnection.createAnswer();
		//连接的一端（或潜在的连接）及其配置方式。 每个RTCSessionDescription包含一个描述类型，该类型指示它描述的提议/答案协商过程的哪一部分以及会话的SDP描述符。
		await clients[data.socket].peerConnection.setLocalDescription(new RTCSessionDescription(answer));

		// 发送应答给打电话者
		socket.emit("make-answer", {
			answer,
			to: data.socket
		});

	});
	//应答模式
	socket.on("answer-made", async data => {

		console.log("Answer made by " + data.socket);

		//设置远程信息描述
		await clients[data.socket].peerConnection.setRemoteDescription(
			new RTCSessionDescription(data.answer)
		);

		if (!clients[data.socket].isAlreadyCalling) {
			callUser(data.socket);
			clients[data.socket].isAlreadyCalling = true;
		}
	});

	socket.on("call-rejected", data => {
		alert(`User: "Socket: ${data.socket}" rejected your call.`);
	});

	socket.on('iceCandidateFound', data => {
		clients[data.socket].peerConnection.addIceCandidate(data.candidate);
	});
}


////////////////////////////////////////////////////////////////////////////////
//  WebRTC通信
////////////////////////////////////////////////////////////////////////////////

//为客户端对象添加THREE.js对象，DOM视频对象以及每个对象的RTC对等连接
function addClient(_id) {

	console.log("添加了客户端 " + _id);
	clients[_id] = {};

	// 和客户端建立对等连接
	let pc = createPeerConnection(_id);
	clients[_id].peerConnection = pc;

	// 设置已经连接真值
	clients[_id].isAlreadyCalling = false;
	clients[_id].isLoaded = false;
	glScene.addClient(_id);

}


//建立对等连接
function createPeerConnection(_id) {
	let peerConnectionConfiguration;
	// if (false) {
	peerConnectionConfiguration = { iceServers: iceServerList };
	// } else {
	// peerConnectionConfiguration = {}; 
	// }


	//peerconnect的含义
	let pc = new RTCPeerConnection(peerConnectionConfiguration);

	// 为对等连接添加ontrack监听器
	pc.ontrack = function ({ streams: [_remoteStream] }) {
		console.log("OnTrack: track added to RTC Peer Connection.对等连接");
		// <video> element --> <canvas> --> videoTexture --> videoMaterial  THREE.js
		// https://stackoverflow.com/questions/50984531/threejs-positional-audio-with-webrtc-streams-produces-no-sound
		//分成两个媒体流，一个用于threejs音频，一个用于 <video>元素，threejs贴图
		let videoStream = new MediaStream([_remoteStream.getVideoTracks()[0]]);
		let audioStream = new MediaStream([_remoteStream.getAudioTracks()[0]]);

		//////////////////////////////////////////////////////////////////////
		// 有关音频的方法
		//////////////////////////////////////////////////////////////////////
		// 1. Positional Audio 
		// Working in Firefox 75.0
		// Not working in Chrome: https://bugs.chromium.org/p/chromium/issues/detail?id=933677
		// let audioSource = new THREE.PositionalAudio(glScene.listener);
		// audioSource.setMediaStreamSource(audioStream);
		// audioSource.setRefDistance(10);
		// audioSource.setRolloffFactor(10);
		// clients[_id].group.add(audioSource);

		// 2. Global Audio使用dom元素

		let audioEl = document.getElementById(_id+"_audio");
		if (!audioEl){
			audioEl = document.createElement('audio');
			audioEl.setAttribute("id",_id+"_audio");
			audioEl.style = "visibility: hidden;";
			audioEl.controls = 'controls';
			audioEl.volume = 1;
			document.body.appendChild(audioEl);
		}
		audioEl.srcObject = audioStream;
		audioEl.play();
	

		const remoteVideoElement = document.getElementById(_id);
		if (remoteVideoElement) {
			//直接给视频标签的url赋值了远程视频流
			remoteVideoElement.srcObject = videoStream;
		} else {
			console.warn("No video element found for ID: " + _id);
		}

	};

	// https://www.twilio.com/docs/stun-turn
	// stun-turn穿透，建立连接
	pc.onicecandidate = function (evt) {
		if (evt.candidate) {
			console.log('OnICECandidate: Forwarding ICE candidate to peer.');
			// 发送candidate通过信令通道
			socket.emit('addIceCandidate', {
				candidate: evt.candidate,
				to: _id
			});
		}
	};

	addTracksToPeerConnection(localMediaStream, pc);

	return pc;
}


async function callUser(id) {
	//确定对象是否具有具有指定名称的属性。
	if (clients.hasOwnProperty(id)) {
		console.log('Calling user ' + id);

		// https://blog.carbonfive.com/2014/10/16/webrtc-made-simple/
		// 创建提供会话描述
		const offer = await clients[id].peerConnection.createOffer();
		await clients[id].peerConnection.setLocalDescription(new RTCSessionDescription(offer));

		socket.emit("call-user", {
			offer,
			to: id
		});
	}
}

//暂停转出流
function disableOutgoingStream() {
	localMediaStream.getTracks().forEach(track => {
		track.enabled = false;
	})
}
//启用转出流
function enableOutgoingStream() {
	localMediaStream.getTracks().forEach(track => {
		track.enabled = true;
	})
}


////////////////////////////////////////////////////////////////////////////////
// Three.js部分
////////////////////////////////////////////////////////////////////////////////

function onPlayerMove() {
	//页面移动时发送消息
	// 这是一个回调方法
	socket.emit('move', glScene.getPlayerPosition());
}

function createScene() {
	console.log("创建three.js 场景...")
	//scene类的使用地方 
	glScene = new Scene(
		domElement = document.getElementById('gl_context'),
		_width = window.innerWidth,
		_height = window.innerHeight,
		// _width = 1000,
		// _height = 800,
		clearColor = 'lightblue',
		onPlayerMove);
}


