/*  
*2020.11.8
* https://github.com/juniorxsound/THREE.Multiplayer
* https://github.com/Miczeq22/simple-chat-app
*
*/
class Scene {
	constructor(
		domElement = document.getElementById('gl_context'),
		_width = window.innerWidth,
		_height = window.innerHeight,
		clearColor = 'lightblue',
		_movementCallback) {
		//移动回调函数
		this.movementCallback = _movementCallback;

		this.scene = new THREE.Scene();
		this.keyState = {};

		this.width = _width;
		this.height = _height;

		//增加播放器
		this.addSelf();

		// 灯光
		this.addLights();

		//相机
		this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 5000);
		this.camera.position.set(5, 20, 15);
		this.scene.add(this.camera);

		let roomLoader = new THREE.GLTFLoader();
		let self = this;
		roomLoader.load(
			//资源链接
			'images/room2.gltf',
			function (glb) {
				let building = glb.scene;
				self.scene.add(building);			
			},
			onProgress,
			onError
		)

		// roomLoader.load(
		// 	//资源链接
		// 	'images/test.gltf',
		// 	function (glb) {
		// 		let building = glb.scene;
		// 		console.log('man',building);
		// 		self.scene.add(building);			
		// 	},
		// 	onProgress,
		// 	onError
		// )

		//房间
		// let room1=CreateRoom('images/floor.jpg');
		// this.scene.add(room1);

		// let table = CreateTable('images/table.jpg');
		// this.scene.add(table);
		//绘制文字精灵
		let sprite = drawSprite( '会议室--'+homeContent, 0.01, 120, 6, 9, 0 );
		sprite.material.needsUpdate = true;
		this.scene.add( sprite );

		// 音频监听器
		this.listener = new THREE.AudioListener();
		this.playerGroup.add(this.listener);

		// WebGL 渲染
		this.renderer = new THREE.WebGLRenderer({
			antialiasing: true
		});
		this.renderer.setClearColor(new THREE.Color(clearColor));
		this.renderer.setSize(this.width, this.height);

		// 增加键盘控制
		this.controls = new THREE.PlayerControls(this.camera, this.playerGroup);

		//将canvas加到dom
		domElement.append(this.renderer.domElement);

		//键盘事件监听器
		window.addEventListener('resize', e => this.onWindowResize(e), false);
		window.addEventListener('keydown', e => this.onKeyDown(e), false);
		window.addEventListener('keyup', e => this.onKeyUp(e), false);

		// 坐标轴
		//this.scene.add(new THREE.GridHelper(500, 500));
		//this.scene.add(new THREE.AxesHelper(10));

		// 开始循环
		this.frameCount = 0;
		this.update();
	}


	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	// 灯光 💡

	addLights() {
		//add some lights

		//环境光， AmbientLight( color, intensity ) color — 光的颜色值，十六进制，默认值为0xffffff.intensity — 光的强度，默认值为1.  
		var ambientLight = new THREE.AmbientLight( 0xffffe6, 1 );
		this.scene.add( ambientLight );


		//点光源 PointLight( color, intensity, distance, decay )  distance — 光照距离，默认为0，表示无穷远都能照到. decay — 随着光的距离，强度衰减的程度，默认为1，为模拟真实效果，建议设置为2
		var pointLight = new THREE.PointLight( 0xffffff, 1 );
		pointLight.position.set(0,200,0);
		this.scene.add(pointLight)
		//this.scene.add(new THREE.AmbientLight(0xffffe6, 0.7));
	}

	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	// 客户端 👫

	addSelf() {
		let text2d=content;
		let texture = canvasMultilineText( text2d, { backgroundColor: 0xffffff}, 'rgba(155, 187, 89, 1)'  );
		let wordMaterial = new THREE.MeshBasicMaterial( { map: texture, opacity: 0.9 } );
		let manMaterial = new THREE.MeshBasicMaterial({color:0xe8b73b});

		let _body = new THREE.Mesh(
			new THREE.BoxGeometry(4, 4, 4),
			wordMaterial
		);

		//创建自身媒体流元素，videoElement已经绑定了本地媒体流
		createLocalVideoElement();
		//video  <video> element --> <canvas> --> videoTexture --> videoMaterial  THREE.js
		let [videoTexture, videoMaterial] = makeVideoTextureAndMaterial("local");

		let _head = new THREE.Mesh(
			new THREE.BoxGeometry(4, 4, 4),
			videoMaterial
		);
		this.playerGroup = new THREE.Group();

		let self = this;
		var man;

		let x = Math.ceil(Math.random()*10); 
		let y = Math.ceil(Math.random()*10); 

		// loadMtl('images/','worker').then(obj=>{
		// 	//console.log('obj',obj);
		// 	//obj.scale.set(0.01,0.01,0.01);
		// 	//obj.children[0].material.color.set(0xe8b73b);
		// 	man=obj.children[0];
		// 	//man.scale.set(0.03,0.03,0.03);
		// 	man.position.set(x, 8, y);
		// 	//console.log('人物',man);
		// 	//self.scene.add(man);
		// 	//let top = new THREE.Mesh(man,manMaterial);

		// 	// 设置头部位置
		// 	_body.position.set(x, 1, y);
		// 	_head.position.set(x, 5, y);
		// 	//top.position.set(0,2,4);
		// 	//console.log('top',top)

		// 	// https://threejs.org/docs/index.html#api/en/objects/Group
			
		// 	//self.playerGroup.position.set(0, 0.5, 0);
		// 	self.playerGroup.add(_body);
		// 	self.playerGroup.add(_head);
		// 	self.playerGroup.add(man);
		// 	self.playerVideoTexture = videoTexture;
		// 	//console.log('playerGroup',self.playerGroup);

		// 	self.scene.add(self.playerGroup);			
		// })

		loadGlb('images/','worker').then(obj=>{
			//console.log('obj',obj);
			//obj.scale.set(0.01,0.01,0.01);
			//obj.children[0].material.color.set(0xe8b73b);
			man=obj.scene
			//man.scale.set(0.03,0.03,0.03);
			man.position.set(x, 8, y);
			//console.log('人物',man);
			//self.scene.add(man);
			//let top = new THREE.Mesh(man,manMaterial);

			// 设置头部位置
			_body.position.set(x, 1, y);
			_head.position.set(x, 5, y);
			//top.position.set(0,2,4);
			//console.log('top',top)

			// https://threejs.org/docs/index.html#api/en/objects/Group
			
			//self.playerGroup.position.set(0, 0.5, 0);
			self.playerGroup.add(_body);
			self.playerGroup.add(_head);
			self.playerGroup.add(man);
			self.playerVideoTexture = videoTexture;
			//console.log('playerGroup',self.playerGroup);

			self.scene.add(self.playerGroup);			
		})
	}

	// 视频纹理，区分信令里的方法
	addClient(_id) {

		//async 异步执行解决大问题！！
		socket.on('getAllName', async _clientProps => {

			clients[_id].name = _clientProps[_id].name;
		});

		//添加姓名
		let text2d='其他人';
		let texture = canvasMultilineText( text2d, { backgroundColor: 0xffffff}, 'rgba(155, 187, 89, 1)'  );
		let wordMaterial = new THREE.MeshBasicMaterial( { map: texture, opacity: 0.9 } );
		let _body = new THREE.Mesh(
			new THREE.BoxGeometry(4, 4, 4),
			wordMaterial
		);

		//使用客户端ID创建的<video>元素
		createClientVideoElement(_id);

		let [videoTexture, videoMaterial] = makeVideoTextureAndMaterial(_id);

		let _head = new THREE.Mesh(
			new THREE.BoxGeometry(4, 4, 4),
			videoMaterial
		);

		let x = Math.ceil(Math.random()*10); 
		let y = Math.ceil(Math.random()*10); 

		_body.position.set(x, 1, y);
		_head.position.set(x, 5, y);

		// https://threejs.org/docs/index.html#api/en/objects/Group

		var group = new THREE.Group();
		var self = this;

		loadObj('images/','man').then(obj=>{
			obj.children[0].material.color.set(0xe8b73b);
			let man=obj.children[0];
			man.scale.set(0.03,0.03,0.03);
			man.position.set(x, 8, y);
			group.add(_body);
			group.add(_head);
			group.add(man);

			self.scene.add(group);
			clients[_id].group = group;
			//console.log('group',_id,group);
			clients[_id].texture = videoTexture;
			clients[_id].desiredPosition = new THREE.Vector3();
			clients[_id].desiredRotation = new THREE.Quaternion();
			clients[_id].oldPos = group.position
			clients[_id].oldRot = group.quaternion;
			clients[_id].movementAlpha = 0;
			clients[_id].isLoaded = true;	
		})
	}

	removeClient(_id) {
		this.scene.remove(clients[_id].group);

		removeClientVideoElementAndCanvas(_id);
	}

	// 更新用户的位置
	updateClientPositions(_clientProps) {

		for (let _id in _clientProps) {
			// 我们将分别进行更新以避免滞后，当前的用户是实时移动可以不用更新
			if (_id != id) {
				clients[_id].desiredPosition = new THREE.Vector3().fromArray(_clientProps[_id].position);
				clients[_id].desiredRotation = new THREE.Quaternion().fromArray(_clientProps[_id].rotation)
			}
		}
	}

	// 如果我们靠近就可以捕捉到位置和旋转
	updatePositions() {
		let snapDistance = 0.5;
		let snapAngle = 0.2; // radians
		for (let _id in clients) {

			clients[_id].group.position.lerp(clients[_id].desiredPosition, 0.2);
			clients[_id].group.quaternion.slerp(clients[_id].desiredRotation, 0.2);
			if (clients[_id].group.position.distanceTo(clients[_id].desiredPosition) < snapDistance) {
				clients[_id].group.position.set(clients[_id].desiredPosition.x, clients[_id].desiredPosition.y, clients[_id].desiredPosition.z);
			}
			if (clients[_id].group.quaternion.angleTo(clients[_id].desiredRotation) < snapAngle) {
				clients[_id].group.quaternion.set(clients[_id].desiredRotation.x, clients[_id].desiredRotation.y, clients[_id].desiredRotation.z, clients[_id].desiredRotation.w);
			}
		}
	}
	//设置音量
	updateClientVolumes() {
		for (let _id in clients) {
			let audioEl = document.getElementById(_id+"_audio");
			if (audioEl) {
				let distSquared = this.camera.position.distanceToSquared(clients[_id].group.position);

				// console.log('Dist:',this.camera.position.distanceTo(clients[_id].group.position));
				// console.log('DistSquared:',distSquared);
				if (distSquared > 500) {
					// console.log('setting vol to 0')
					audioEl.volume = 0;
				} else {
					// from lucasio here: https://discourse.threejs.org/t/positionalaudio-setmediastreamsource-with-webrtc-question-not-hearing-any-sound/14301/29
					let volume = Math.min(1, 10 / distSquared);
					audioEl.volume = volume;
					// console.log('setting vol to',volume)
				}
			}
		}
	}

	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//🤾‍♀️相互作用

	getPlayerPosition() {
		//四元组
		return [
			[this.playerGroup.position.x, this.playerGroup.position.y, this.playerGroup.position.z],
			[this.playerGroup.quaternion._x, this.playerGroup.quaternion._y, this.playerGroup.quaternion._z, this.playerGroup.quaternion._w]];
	}

	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//  🎥实时渲染更新
	update() {
		requestAnimationFrame(() => this.update());
		this.frameCount ++;

		//若键盘已经操作需要将移动告诉信令服务器
		let sendStats = false;
		for (let i in this.keyState) {
			if (this.keyState[i]) {
				sendStats = true;
				break;
			}
		}
		if (sendStats) { this.movementCallback(); }

		if (this.frameCount % 20 === 0) {
			//更新声音
			//this.updateClientVolumes();
			if(localMediaStream){
				//let rvideoImageCanvas = document.createElement('canvas');
				//document.body.appendChild(rvideoImageCanvas);
			
				//rvideoImageCanvas.width = videoWidth;
				//rvideoImageCanvas.height = videoHeight;
				//let rvideoImageContext = rvideoImageCanvas.getContext('2d');

				var photo=document.getElementById('photo');
				var video = document.getElementById('local_video')
				photo.width=videoWidth;
				photo.height=videoHeight;
				var photoContext=photo.getContext('2d');
				//var img = photoContext.drawImage(localMediaStream,400,400);
				if(video){
					//rvideoImageContext.drawImage(video,0,0,160,120);
					photoContext.drawImage(video,0,0,160,120);
					//var img = photoContext.getImageData(0,0,160,120);
					//console.log('img',img);
					//var imgUrl = rvideoImageCanvas.toDataURL('image/jpeg');
					//不用存，传输数据流
					var imgUrl = photo.toDataURL('image/jpeg');
					//console.log('photrvideoImageCanvas',imgUrl);
					socket2.emit('img',{
						id: nowClient,
						url: imgUrl
					})
				}
				
			}
		}
		let canUpdate = true;
		for (let _id in clients) {
			if(!clients[_id].isLoaded){
				canUpdate =false;
			}
		}
		if(canUpdate){
			this.updatePositions();

		}
		this.controls.update();
		this.render();


	}

	render() {
		// 更新每一个客户端的canvas
		this.updateVideoTextures();
		this.renderer.render(this.scene, this.camera);
	}
	//更新视频纹理将很关键
	updateVideoTextures() {
		// 终于统一了video标签和canvas标签
		let localVideo = document.getElementById("local_video");
		let localVideoCanvas = document.getElementById("local_canvas");
		this.redrawVideoCanvas(localVideo, localVideoCanvas, this.playerVideoTexture)


		for (let _id in clients) {
			let remoteVideo = document.getElementById(_id);
			let remoteVideoCanvas = document.getElementById(_id + "_canvas");

			//console.log('身子',clients[_id].group.children[0].material);
			//添加姓名,更新姓名
			//console.log('clients[_id].name',clients[_id].name)
			if(clients[_id].name&&clients[_id].group){
				let text2d=clients[_id].name;
				let texture = canvasMultilineText( text2d, { backgroundColor: 0xffffff}, 'rgba(155, 187, 89, 1)'  );
				let wordMaterial = new THREE.MeshBasicMaterial( { map: texture, opacity: 0.9 } );
				clients[_id].group.children[0].material = wordMaterial;
			}


			this.redrawVideoCanvas(remoteVideo, remoteVideoCanvas, clients[_id].texture);
		}
	}

	//这个函数从一个<video>重新绘制一个2D <canvas>，并指示到three.js，名字的含义就是重新绘制canvas
	redrawVideoCanvas(_videoEl, _canvasEl, _videoTex) {
		if(_videoTex) {
			let _canvasDrawingContext = _canvasEl.getContext('2d');

			// 检查video元素上是否有足够的数据来重画画布
			if (_videoEl.readyState === _videoEl.HAVE_ENOUGH_DATA) {
				//视频元素变成了贴图
				_canvasDrawingContext.drawImage(_videoEl, 0, 0, _canvasEl.width, _canvasEl.height);
				//向three.js指示需要从画布上重绘纹理
				_videoTex.needsUpdate = true;
			}
		}

	}

	//////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////
	//  🍽事件手柄

	onWindowResize(e) {
		this.width = window.innerWidth;
		this.height = Math.floor(window.innerHeight - (window.innerHeight * 0.3));
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.width, this.height);
	}

	// 设置了键盘响应
	onKeyDown(event) {
		event = event || window.event;
		this.keyState[event.keyCode || event.which] = true;
	}

	onKeyUp(event) {
		event = event || window.event;
		this.keyState[event.keyCode || event.which] = false;
	}
}

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
// 实用工具 🚂

//为本地媒体流创建<video>标签
function createLocalVideoElement() {
	const videoElement = document.createElement("video");
	videoElement.id = "local_video";
	videoElement.autoplay = true;
	videoElement.width = videoWidth;
	videoElement.height = videoHeight;
	videoElement.style = "visibility: hidden;";


	let videoStream = new MediaStream([localMediaStream.getVideoTracks()[0]]);

	videoElement.srcObject = videoStream;
	//最终给body增加了video元素
	document.body.appendChild(videoElement);
}

//使用客户端ID创建的<video>元素
function createClientVideoElement(_id) {
	console.log("使用客户端ID创建的<video>元素 " + _id);

	const videoElement = document.createElement("video");
	videoElement.id = _id;
	videoElement.width = videoWidth;
	videoElement.height = videoHeight;
	videoElement.autoplay = true;

	videoElement.style = "visibility: hidden;";

	document.body.appendChild(videoElement);
}

function removeClientVideoElementAndCanvas(_id) {
	console.log("Removing <video> element for client with id: " + _id);

	let videoEl = document.getElementById(_id).remove();
	if (videoEl != null) { videoEl.remove(); }
	let canvasEl = document.getElementById(_id + "_canvas");
	if (canvasEl != null) { canvasEl.remove(); }
}

// https://github.com/zacharystenger/three-js-video-chat，制作视频纹理贴图
function makeVideoTextureAndMaterial(_id) {
	// 直接创建了canvas元素
	let rvideoImageCanvas = document.createElement('canvas');
	document.body.appendChild(rvideoImageCanvas);

	rvideoImageCanvas.id = _id + "_canvas";
	rvideoImageCanvas.width = videoWidth;
	rvideoImageCanvas.height = videoHeight;
	rvideoImageCanvas.style = "visibility: hidden;";

	// 获取画布绘图上下文
	let rvideoImageContext = rvideoImageCanvas.getContext('2d');

	// 第一次的背景纹理填充，第二次被视频替代
	rvideoImageContext.fillStyle = '#000000';
	rvideoImageContext.fillRect(0, 0, rvideoImageCanvas.width, rvideoImageCanvas.height);

	// 制作纹理,第一次的纹理
	let videoTexture = new THREE.Texture(rvideoImageCanvas);
	videoTexture.minFilter = THREE.LinearFilter;
	videoTexture.magFilter = THREE.LinearFilter;

	var movieMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, overdraw: true, side: THREE.DoubleSide });
	//返回的就是视频纹理和电影材质
	return [videoTexture, movieMaterial];
}
//绘制房间
function CreateRoom(URL){
	var roomGeometry = new THREE.Geometry();

	var loader = new THREE.TextureLoader();
	var texture = loader.load(URL);
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(20, 20);

	var boxGeometry1 = new THREE.BoxGeometry(20, 1, 20);
	var boxGeometry2 = new THREE.BoxGeometry(0.5, 5, 20.5);
	var boxGeometry3 = new THREE.BoxGeometry(0.5, 5, 20.5);
	var boxGeometry4 = new THREE.BoxGeometry(20.5, 5, 0.5);
	var boxGeometry5 = new THREE.BoxGeometry(20.5, 5, 0.5);

	var boxMesh1 = new THREE.Mesh(boxGeometry1);
	boxMesh1.position.y = -0.5;
	boxMesh1.updateMatrix();
	roomGeometry.merge(boxMesh1.geometry, boxMesh1.matrix);

	var boxMesh2 = new THREE.Mesh(boxGeometry2);
	boxMesh2.position.set(10, 0, 0);
	boxMesh2.updateMatrix();
	roomGeometry.merge(boxMesh2.geometry, boxMesh2.matrix);

	var boxMesh3 = new THREE.Mesh(boxGeometry3);
	boxMesh3.position.set(-10, 0, 0);
	boxMesh3.updateMatrix();
	roomGeometry.merge(boxMesh3.geometry, boxMesh3.matrix);

	var boxMesh4 = new THREE.Mesh(boxGeometry4);
	boxMesh4.position.set(0, 0, 10);
	boxMesh4.updateMatrix();
	roomGeometry.merge(boxMesh4.geometry, boxMesh4.matrix);

	var boxMesh5 = new THREE.Mesh(boxGeometry5);
	boxMesh5.position.set(0, 0, -10);
	boxMesh5.updateMatrix();
	roomGeometry.merge(boxMesh5.geometry, boxMesh5.matrix);

	var roomMaterial = new THREE.MeshPhongMaterial({ map:texture, color:0xffffff, specular:0xffffff, shininess: 10});
	return new THREE.Mesh(roomGeometry, roomMaterial);

}
//绘制精灵
function drawSprite(  text2d, scale, color, x, y, z){
	var texture = canvasMultilineText( text2d, { backgroundColor: color }, 'rgba(155, 187, 89, 1)'  );
	var spriteMaterial = new THREE.SpriteMaterial( { map: texture, opacity: 0.9 } );
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.position.set( x, y, z );

	sprite.scale.set( scale * texture.image.width, scale * texture.image.height );

	return sprite;
}

function canvasMultilineText(textArray, parameters, rgba){
	parameters = parameters || {} ;
	var width = 0;
	var canvas = document.createElement( 'canvas' );
	var context = canvas.getContext( '2d' );
	var len = textArray.length;

	if ( typeof textArray === 'string' ) textArray = [ textArray ];

	context.font = parameters.font ? parameters.font : '48px sans-serif';

	for (var i = 0; i < len; i++) {

		width = context.measureText( textArray[i] ).width > width ? context.measureText( textArray[i] ).width : width;

	}

	canvas.width = width + 20; // 480
	canvas.height = textArray.length * 60;

	context.fillStyle = rgba;
	context.fillRect( 0, 0, canvas.width, canvas.height);

	context.font = parameters.font ? parameters.font : '48px sans-serif';

	for (var j = 0; j < len; j++) {
		context.fillStyle = '#1920E6';
		context.fillText( textArray[j], 10, 48  + j * 60 );
	}

	var texture = new THREE.Texture( canvas );
	texture.minFilter = texture.magFilter = THREE.NearestFilter;
	texture.needsUpdate = true;

	return texture;

}

//绘制桌子
function CreateTable(URL){

	var loader = new THREE.TextureLoader();
	var texture = loader.load(URL);
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(20, 20);

	var boxGeometry1 = new THREE.BoxGeometry(5, 2, 5);

	var boxMesh1 = new THREE.Mesh(boxGeometry1);
	boxMesh1.position.set(10, 8, 0)


	var roomMaterial = new THREE.MeshPhongMaterial({ map:texture, color:0xffffff, specular:0xffffff, shininess: 10});
	return new THREE.Mesh(boxGeometry1, roomMaterial);

}

function loadObj(path ,id){
	let loder = new THREE.OBJLoader()
	return new Promise((resolve,reject)=>{
		loder.setPath(path)
		.load(
			//资源链接
			id + '.obj',
			function (obj) {
				console.log(URL+'模型加载成功了')
				resolve(obj);
			},
		)		
	}) 
}

function onProgress(xhr){
	console.log( ( xhr.loaded / xhr.total * 100 ) + '% 已加载' );
}

function onError(error) {
	console.log( 'An error happened:' ,error);
}

function loadMtl(path ,id){
	
	// let manager = new THREE.LoadingManager();
	// //dds纹理
	// let DDSLoader = new THREE.DDSLoader();
	// manager.addHandler( /\.dds$/i, );	

	let mtlLoader = new THREE.MTLLoader();

	return new Promise((resolve,reject)=>{
		mtlLoader
		.load('images/worker.mtl',function(materials){
			console.log(materials);
			materials.preload();

			let loder = new THREE.OBJLoader()
				loder.setMaterials( materials )
				.setPath(path)
				.load(
					//资源链接
					id + '.obj',
					function (obj) {
						console.log(obj+'模型加载成功了')
						resolve(obj);
					}
					,onProgress
					,onError
				)		
		}			
)
	}) 	
}

function loadFbx(path,id){
	let fbxLoader = new THREE.FBXLoader();
	
	return new Promise((resolve,reject)=>{
		fbxLoader.load('images/worker.fbx',function(obj){
			console.log(obj+'模型加载成功了');
			resolve(obj);			
		})
	})
}

function loadGlb(path,id){
	let glbLoader = new THREE.GLTFLoader();
	
	return new Promise((resolve,reject)=>{
		glbLoader.load('images/worker.gltf',function(obj){
			console.log(obj+'模型加载成功了');
			resolve(obj);			
		}
		,onProgress
		,onError
		)
	})
}