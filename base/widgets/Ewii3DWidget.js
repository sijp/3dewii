
Ewii3D = (function(self){


	/*
	 *  basic interface for the widgets. all widgets' prototypes must be an instance of this class.
	 *  widgets that inherit for Ewii3DWidget will not be able to be grabbed or interacted at all,
	 *  see Ewii3DGrabbableWidget for more info.
	 */




	function Widget(opts){
	}

	Widget.prototype.decorateMethods=function(settings){
		var THIS=this;
		methods = this.getDecoratedMethods();
		for (m in methods){
			(function(){
				console.log("decorating "+methods[m]);
				var methodName = methods[m];
				THIS[methodName] = function(){
					console.log(methodName+" called!");
					modifiedArgs = Array.prototype.slice.call(arguments);
					modifiedArgs.push(settings);
					console.log(modifiedArgs);
					return (Object.getPrototypeOf(THIS))[methodName].apply(Object.getPrototypeOf(THIS),modifiedArgs);
				}
			}());
		}
	};

	Widget.prototype.getDecoratedMethods = function(){
		return ["init","refresh","clickAction","grabAction"];
	};


	Widget.prototype.init=function(geo,settings){
		settings.object = new THREE.Mesh( geo, new THREE.MeshFaceMaterial({shading:THREE.FlatShading}) );

		settings.object.geometry.dynamic = true;
		settings.object.castShadow = true;
		settings.object.receiveShadow = true;

		settings.object.ewii3DWidget = settings.widget;
		
		settings.object.position.x = settings.position.x;
		settings.object.position.y = settings.position.y;
		settings.object.position.z = settings.position.z;
		
		settings.object.scale.x *= settings.scale;
		settings.object.scale.y *= settings.scale;
		settings.object.scale.z *= settings.scale;
		self.addObjectToScene(settings.object);
	};
	
	/*
	 *  actions to be taken once a click (mouse up) is made.
	 */
	Widget.prototype.clickAction = function(settings){
	};

	/*
	 *  actions to be taken once a grab (mouse down+move) is made.
	 */

	Widget.prototype.grabAction = function(settings){
	};


	Widget.prototype.refresh=function(settings){
		return;
	};

	self.Widget = Widget;

	return self;
}(Ewii3D || {}));

