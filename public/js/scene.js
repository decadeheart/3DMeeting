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
		this.isRoomLoaded = false;

		this.width = _width;
		this.height = _height;

		//相机
		this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 5000);
		//this.camera.position.set(5, 20, 15);

		//增加播放器
		this.addSelf();

		// 灯光
		this.addLights();

		this.scene.add(this.camera);

		let roomLoader = new THREE.GLTFLoader();
		let self = this;


		var dracoLoader = new THREE.DRACOLoader();
		dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');

		roomLoader.setDRACOLoader(dracoLoader);
		roomLoader.load(
			//资源链接
			'images/room4Draco.gltf',
			function (glb) {
				let building = glb.scene;
				self.scene.add(building);
				console.log('building',building);
				self.isRoomLoaded = true;		
			},
			onProgress,
			onError
		)


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
		var mesh = new THREE.MeshPhongMaterial({
            specular: 0xffffff,
            color: 0x7777ff,
			opacity: 0, 
			transparent: true
        });

		let texture = canvasMultilineText( text2d, { backgroundColor: 0xffffff}, 'rgba(155, 187, 89, 1)'  );

        var caizhi = [
			new THREE.MeshPhongMaterial({map:texture}),
            mesh,
            mesh,
            mesh,
            mesh,
            mesh
        ];
		//let wordMaterial = new THREE.MeshBasicMaterial( { map: texture, opacity: 0.9 } );

		let _body = new THREE.Mesh(
			new THREE.BoxGeometry(10, 4, 10),
			caizhi
		);

		//创建自身媒体流元素，videoElement已经绑定了本地媒体流
		createLocalVideoElement();
		//video  <video> element --> <canvas> --> videoTexture --> videoMaterial  THREE.js
		let [videoTexture, videoMaterial] = makeVideoTextureAndMaterial("local");

		var caizhi2 = [
            videoMaterial,
            mesh,
            mesh,
            mesh,
            mesh,
            mesh
        ];

		let _head = new THREE.Mesh(
			new THREE.BoxGeometry(10, 10, 10),
			caizhi2
		);

		this.playerGroup = new THREE.Group();

		let self = this;

		// let x = Math.ceil(Math.random()*10); 
		// let y = Math.ceil(Math.random()*10); 
		let x = -3.4371676445007324
		let y = 3.1371405124664307

		// 设置头部位置
		_body.position.set(x, 1, y);
		_head.position.set(x, 10, y);
		//console.log('top',top)
		this.camera.position.set(x, 10, y);
		console.log('this.camera',this.camera.rotation);
		// https://threejs.org/docs/index.html#api/en/objects/Group
		
		//self.playerGroup.position.set(0, 0.5, 0);
		self.playerGroup.add(_body);
		self.playerGroup.add(_head);
		
		self.playerVideoTexture = videoTexture;

		//console.log('playerGroup',self.playerGroup);

		self.scene.add(self.playerGroup);			

	}

	// 视频纹理，区分信令里的方法,此处终于学会了await的用法
	async addClient(_id) {
		clientNum++;

		//async 异步执行解决大问题！！
		await socket.on('getAllName',  _clientProps => {

			clients[_id].name = _clientProps[_id].name;
		});

		//添加姓名
		let text2d='其他人';
		var mesh = new THREE.MeshPhongMaterial({
            specular: 0xffffff,
            color: 0x7777ff,
			opacity: 0, 
			transparent: true
        });

		let texture = canvasMultilineText( text2d, { backgroundColor: 0xffffff}, 'rgba(155, 187, 89, 1)'  );

        var caizhi = [
			
            mesh,
			new THREE.MeshPhongMaterial({map:texture}),
            mesh,
            mesh,
            mesh,
            mesh
        ];
		let _body = new THREE.Mesh(
			new THREE.BoxGeometry(10, 4, 10),
			caizhi
		);

		//使用客户端ID创建的<video>元素
		createClientVideoElement(_id);

		let [videoTexture, videoMaterial] = makeVideoTextureAndMaterial(_id);
		var caizhi2 = [
            
            mesh,  //1是前
			videoMaterial,
            mesh,
			
            mesh,   //3是上
			
            mesh,   //4是下
            mesh,
			  //6是右
        ];

		let _head = new THREE.Mesh(
			new THREE.BoxGeometry(10, 10, 10),
			caizhi2
		);
		
		let x,y;
		console.log("clients",clientNum)
		if(clientNum == 1) {
			y = 3.1371405124664307
			x = 26.74837303161621
		}

		_body.position.set(x, 1, y);
		_head.position.set(x, 10, y);
		// https://threejs.org/docs/index.html#api/en/objects/Group

		var group = new THREE.Group();
		var self = this;
		group.add(_body);
		group.add(_head);

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

		let canUpdate = true;
		for (let _id in clients) {
			if(!clients[_id].isLoaded){
				canUpdate =false;
			}
		}
		if(canUpdate){
			this.updatePositions();
			//更新声音
			this.updateClientVolumes();
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
		let self =this;
		this.predictWebcam(localVideo, localVideoCanvas, this.playerVideoTexture)
		if (this.isRoomLoaded && this.playerVideoTexture && modelHasLoaded) {
			renderPrediction(localVideo)
			
			if(faceFlag) {
				console.log('faceFlag',faceFlag)
					if(faceFlag == "RIGHT") {
						//第一列，第二列往下,第三列往右
						self.camera.lookAt(11.99665355682373,5.791983604431152,10.77586030960083);
					}else if(faceFlag == "LEFT") {
						self.camera.lookAt(11.99665355682373,5.791983604431152,-2.77586030960083);
					}
				//绘制文字精灵
				let directionSprite = drawSprite( faceFlag, 0.02, '#DC143C', 6, 11, 0);
				directionSprite.material.needsUpdate = true;
				self.scene.add( directionSprite );
			}
		}


		/******* 下面是其他用户处理****************/
		for (let _id in clients) {
			let remoteVideo = document.getElementById(_id);
			let remoteVideoCanvas = document.getElementById(_id + "_canvas");

			//console.log('身子',clients[_id].group.children[0].material);
			//添加姓名,更新姓名
			//console.log('clients[_id].name',clients[_id].name)
			if(clients[_id].name&&clients[_id].group){
				let text2d=clients[_id].name;
				let mesh = new THREE.MeshPhongMaterial({
					specular: 0xffffff,
					color: 0x7777ff,
					opacity: 0, 
					transparent: true
				});
		
				let texture = canvasMultilineText( text2d, { backgroundColor: 0xffffff}, 'rgba(155, 187, 89, 1)'  );
		
				var caizhi = [
					
					mesh,
					new THREE.MeshPhongMaterial({map:texture}),
					mesh,
					mesh,
					mesh,
					mesh
				];
				clients[_id].group.children[0].material = caizhi;
			}


			this.predictWebcam(remoteVideo, remoteVideoCanvas, clients[_id].texture);
		}
	}

 	// 关键步骤，循环预测
	predictWebcam(_videoEl ,_canvasEl ,_videoTex){
		let flag = true;
		let self = this;
		if (flag && _videoTex) {
			// 临时canvas,flag表示前面已经处理完了
			//在此处得到了视频中的画面图片,只是为了用来分割的
			let canvasCtx = _canvasEl.getContext('2d');
			let tmpCanvas = document.createElement('canvas');

			tmpCanvas.width = videoWidth;
			tmpCanvas.height = videoHeight;
			let tmpCanvasCtx = tmpCanvas.getContext('2d');

			tmpCanvasCtx.drawImage(_videoEl, 0, 0, videoWidth, videoHeight);

			flag = false;
	  
			//根据视频流得到分割数据，外面和内部的刷新频率不一样，所以要使用tmpCanvas进行过渡
			model.segmentPersonParts(tmpCanvas, segmentationProperties).then(function(segmentation) {
				processSegmentation(canvasCtx, tmpCanvasCtx,segmentation);
				flag = true;
				_videoTex.needsUpdate = true
			});

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

//制作视频纹理贴图
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
	rvideoImageContext.fillStyle = '#ffffff';
	rvideoImageContext.fillRect(0, 0, rvideoImageCanvas.width, rvideoImageCanvas.height);

	// 制作纹理,第一次的纹理
	let videoTexture = new THREE.Texture(rvideoImageCanvas);
	videoTexture.minFilter = THREE.LinearFilter;
	videoTexture.magFilter = THREE.LinearFilter;

	//side: THREE.DoubleSide
	var movieMaterial = new THREE.MeshBasicMaterial({ map: videoTexture,side:THREE.FrontSide,opacity: 1, transparent: true });
	//返回的就是视频纹理和电影材质
	return [videoTexture, movieMaterial];
}

//绘制精灵
function drawSprite(  text2d, scale, color, x, y, z){
	var texture = canvasMultilineText( text2d, { backgroundColor: color }, '#FFFF00'  );
	var spriteMaterial = new THREE.SpriteMaterial( { map: texture, opacity: 0.9 } );
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.position.set( x, y, z );

	sprite.scale.set( scale * texture.image.width, scale * texture.image.height );

	return sprite;
}

//绘制文字
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
		context.fillStyle = '#DC143C';
		context.fillText( textArray[j], 10, 48  + j * 60 );
	}

	var texture = new THREE.Texture( canvas );
	texture.minFilter = texture.magFilter = THREE.NearestFilter;
	texture.needsUpdate = true;

	return texture;

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
	console.log( '加载失败:' ,error);
}


function loadDracoMesh(dracoFile) {
	dracoLoader.load(dracoFile, function ( geometry ) {
	  geometry.computeVertexNormals();

	  var material = new THREE.MeshStandardMaterial( { vertexColors: THREE.VertexColors } );
	  var mesh = new THREE.Mesh( geometry, material );
	  mesh.castShadow = true;
	  mesh.receiveShadow = true;
	  scene.add( mesh );
	} );
  }

   //canvas上下文的分割数据
 function processSegmentation(canvasCtx, temptCtx ,segmentation) {
	
	var imageData = canvasCtx.getImageData(0, 0, videoWidth, videoHeight);
	var originData = temptCtx.getImageData(0, 0, videoWidth, videoHeight);
	var odata = originData.data;
	var data = imageData.data;
	
   //1.注意data数据的格式，每隔4个是一个RGBA数据  2.此处实现了分割的目的
   let n = 0;
   for (let i = 0; i < data.length; i += 4) {
     if (segmentation.data[n] !== -1) {
       data[i] = odata[i];     // red
       data[i + 1] = odata[i + 1]; // green
       data[i + 2] = odata[i + 2]; // blue
       data[i + 3] = odata[i + 3]; // alpha
     } else {
       data[i] = 255;    
       data[i + 1] = 255;
       data[i + 2] = 255;
       data[i + 3] = 1;
     }

     n++;
   }
   canvasCtx.putImageData(imageData, 0, 0);
  }

async function renderPrediction(video) {
	const predictions = await faceModel.estimateFaces({
		input: video,
		returnTensors: false,
		flipHorizontal: false,
		predictIrises: true,
	});
	console.log(predictions);
	if (predictions.length > 0) {
		predictions.forEach((prediction) => {
		//左眼x坐标
		positionXLeftIris = prediction.annotations.leftEyeIris[0][0];
		//左眼y坐标
		positionYLeftIris = prediction.annotations.leftEyeIris[0][1];

		//脸部底部x坐标，脸部水平翻转，所以右下方实际上是左下角
		const faceBottomLeftX =
			video.width - prediction.boundingBox.bottomRight[0]; // face is flipped horizontally so bottom right is actually bottom left.
		const faceBottomLeftY = prediction.boundingBox.bottomRight[1];

		//脸部顶部坐标,左上实际上是右上
		const faceTopRightX = video.width - prediction.boundingBox.topLeft[0]; // face is flipped horizontally so top left is actually top right.
		const faceTopRightY = prediction.boundingBox.topLeft[1];

		if (faceBottomLeftX > 0 && !isFaceRotated(prediction.annotations ,video)) {
			const positionLeftIrisX = video.width - positionXLeftIris;
			const normalizedXIrisPosition = normalize(
			positionLeftIrisX,
			faceTopRightX,
			faceBottomLeftX
			);

			if (normalizedXIrisPosition > 0.355) {
			faceFlag = "RIGHT";
			} else if (normalizedXIrisPosition < 0.315) {
			faceFlag = "LEFT";
			} else {
			amountStraightEvents++;
			if (amountStraightEvents > 8) {
				faceFlag = "STRAIGHT";
				amountStraightEvents = 0;
			}
			}

			const normalizedYIrisPosition = normalize(
			positionYLeftIris,
			faceTopRightY,
			faceBottomLeftY
			);

			if (normalizedYIrisPosition > 0.62) {
			faceFlag = "TOP";
			}
		}
		});
	}
	return faceFlag;
}

const normalize = (val, max, min) =>
  Math.max(0, Math.min(1, (val - min) / (max - min)));

const isFaceRotated = (landmarks ,video) => {
  const leftCheek = landmarks.leftCheek;
  const rightCheek = landmarks.rightCheek;
  const midwayBetweenEyes = landmarks.midwayBetweenEyes;

  const xPositionLeftCheek = video.width - leftCheek[0][0];
  const xPositionRightCheek = video.width - rightCheek[0][0];
  const xPositionMidwayBetweenEyes = video.width - midwayBetweenEyes[0][0];

  const widthLeftSideFace = xPositionMidwayBetweenEyes - xPositionLeftCheek;
  const widthRightSideFace = xPositionRightCheek - xPositionMidwayBetweenEyes;

  const difference = widthRightSideFace - widthLeftSideFace;

  if (widthLeftSideFace < widthRightSideFace && Math.abs(difference) > 5) {
    return true;
  } else if (
    widthLeftSideFace > widthRightSideFace &&
    Math.abs(difference) > 5
  ) {
    return true;
  }
  return false;
};
