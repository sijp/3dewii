Ewii3D = (function(self){

	/*
	 *  Ewii3DGrabbableWidgets extends Ewii3DWidget
	 *  and registers the widget to the interactable widgets
	 *  in the Ewii3D Singleton.
	 */
	var GalleryWidget = self.augmentWidget(self.Widget);

	GalleryWidget.prototype.init = function(geometry,settings){
		Object.getPrototypeOf(this).init.call(Object.getPrototypeOf(this),geometry,settings);

		settings.pixMatrix = [];
		var padding =10;
		var height = 200;
		var width = 250;
		var posx = settings.position.x;
		var posy = settings.position.y;

		for (i=0;i<3;i++){		
			settings.pixMatrix[i]=[];
			for (j=0;j<4;j++){		
				var tmpPlane = settings.pixMatrix[i][j] = new THREE.Mesh(
								new THREE.PlaneGeometry( width, height, 8, 8 ),
								new THREE.MeshBasicMaterial( { 
									color: 0x000000,
									opacity: 1,
									transparent: false,
									wireframe: false 
								}));
				self.setXYZ(tmpPlane.position, posx + j*(width+padding), posy + i*(height+padding), 0);
				tmpPlane.rotation.x = Math.PI / 2;
				self.addObjectToScene(tmpPlane);
			}
		}

	};

	GalleryWidget.getModel = function(){
		return "widgets/stream/streamPod.js";
	};

	self.GalleryWidget = GalleryWidget;

	return self;
}(Ewii3D || {}));



