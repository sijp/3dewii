

/*
 *  This is the main file used by the 3D interface. It defines the most important prototypes that are in use.
 *  The main object is a singleton-like object of type Ewii3D. It's core functionality is to setup the 3D scene
 *  and events.
 *  In order to access the object, one should use the getInstance function: Ewii3D.getinstance() .
 *  One more important prototype is the Ewii3DWidget prototype, which defines the basic functionality for 3D widgets.
 */


/*
 *	This function gets a (x,y,z) coordinate, a camera, and the canvas and translates it into (x,y) coordinate.
 *	
 */

function toScreenXY(position, camera, canvas) {
			  var pos = position.clone();
			  var projScreenMat = new THREE.Matrix4();
			  projScreenMat.multiply(camera.projectionMatrix, camera.matrixWorldInverse);
			  projScreenMat.multiplyVector3( pos );

			  return { x: ( pos.x + 1 ) * canvas.width / 2 + canvas.offsetLeft,
			      y: ( - pos.y + 1) * canvas.height / 2 + canvas.offsetTop };
			}

/*
 * Ewii3D Singleton, renders and animates the entire scene.
 * sets up all widgets and the environment according to retrieved JSON data.
 * Before anything can be done, the main render loop should be called by Ewii3D.getInstance().loop();
 */

var Ewii3D = (function (self){

	console.log("module pattern!");
	console.log(self);
	

	//deprecated
	self.getInstance = function() {
		//console.log(self);
		
		return self;
	}
	
	var _attr={
		container:null,
		camera:null,
		controls:null,
		scene:null,
		projector:null,
		renderer:null,
		objects : [],
		plane:null,
		mouse : new THREE.Vector2(),
		offset : new THREE.Vector3(),
		INTERSECTED:null,
		SELECTED:null
	};
	/*
	 * setups the scene, and starts the animation loop of the webgl canvas.
	 */

	self.loop = function(){
		setup();
		animate();
	}

	self.addObjectToScene = function(obj){
		console.log("adding object to scene:");
		console.log(obj);
		_attr.scene.add(obj);
		god=new THREE.Mesh( new THREE.CubeGeometry( 1000, 1000, 1000 ));
		god.position = obj.position;
		_attr.scene.add( god );
	}

	self.setGrabbable = function(obj){
		_attr.objects.push(obj)
	}

	self.toScreenXY = function(position){
		return toScreenXY(position,_attr.camera,_attr.renderer.domElement);
	}

	/*
	 *	this function, adds sets up the webgl Canvas, and adds to it all the relevant 3D objects, such as
	 *	the environment sky cube, a camera, the helper plane (for moving widgets) and sets up events handlers
	 *	for grabbing widgets.
	 *
	 *	It sends an AJAX request for a json formatted file, to retrieve the list of the widgets and other settings.
	 */

	function setup(){
		_attr.container = document.createElement( 'div' );
		document.body.appendChild( _attr.container );
		
		_attr.scene = new THREE.Scene();
		setCamera();
		addLights();
		setHelpers();
		setRenderer();
		setActions();
		
		jQuery.getJSON("demo/scene.json",sceneLoadedCallback);
	}

	function sceneLoadedCallback(data){
		_attr.scene.add(setEnv(data.cubeProjection));
		
		for (i=0;i<data.widgets.length;i++)
		{
			new function() {
				widget = new window[data.widgets[i].name];
				console.log(data.widgets[i])	
				if (data.widgets[i].model!==undefined)
					widget.setModel(data.widgets[i].model);
				if (data.widgets[i].position!==undefined)	
				{
					position = data.widgets[i].position;
					widget.setPosition(position.x,position.y,position.z);
				}
				if (data.widgets[i].scale!==undefined)
					widget.setScale(data.widgets[i].scale);

				widget.load();
			};
		}
	}

	function setCamera(){
		_attr.camera = new THREE.PerspectiveCamera( 25, window.innerWidth / window.innerHeight, 1, 10000 );
		_attr.camera.position.z = 4200;
		_attr.camera.position.y = 350;
		_attr.camera.rotation.x = Math.PI/180;
		
		_attr.scene.add(_attr.camera);
		
	}

	/*
	 *	this function adds the mousemove, mousedown and mouseup event listeners.
	 *	also, it sets up a resize listener, in case the window size is changed.
	 */

	function setActions(){
		_attr.renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
		_attr.renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
		_attr.renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
		
		window.addEventListener( 'resize', onWindowResize, false );
	}

	/*
	 *	setEnv, loads 6 images, from the `envName` directory and puts them on a cube as
	 *	a cubemap for the environment (sky).
	 *
	 *	it returns a THREE.Mesh object whose geometry is that cube.
	 *
	 */

	function setEnv(envName){
		var urlPrefix = "demo/"+envName+"/";
		var urls = [ urlPrefix + "3.jpg", urlPrefix + "1.jpg",
		urlPrefix + "5.jpg", urlPrefix + "6.jpg",
		urlPrefix + "4.jpg", urlPrefix + "2.jpg" ];
		var textureCube = THREE.ImageUtils.loadTextureCube( urls ); 
		textureCube.format = THREE.RGBFormat;
		
		var shader = THREE.ShaderUtils.lib[ "cube" ];
		shader.uniforms[ "tCube" ].texture = textureCube;
		
		var material = new THREE.ShaderMaterial( {

		  fragmentShader: shader.fragmentShader,
		  vertexShader: shader.vertexShader,
		  uniforms: shader.uniforms,
		  depthWrite: false

		});
		
		// build the skybox Mesh
		skyboxMesh =  new THREE.Mesh( new THREE.CubeGeometry( 10000, 10000, 10000 ), material );
		skyboxMesh.flipSided = true;
		
		skyboxMesh.rotation.y=Math.PI;
		skyboxMesh.castShadow=false;
		
		// add it to the scene
		return skyboxMesh;
	}

	/*
	 *	causes the scene to be rerendered according to the new width and height of the window.
	 */

	function onWindowResize() {

		_attr.camera.aspect = window.innerWidth / window.innerHeight;
		_attr.camera.updateProjectionMatrix();

		_attr.renderer.setSize( window.innerWidth, window.innerHeight );
		
		for (o in _attr.objects)
		{
			console.log(_attr.objects[o]);
			_attr.objects[o].ewii3DWidget.refresh();
		}

	}

	/*
	 *	event handler for mouse move events
	 */

	function onDocumentMouseMove( event ) {

		event.preventDefault();

		_attr.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		_attr.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

		//

		var vector = new THREE.Vector3( _attr.mouse.x, _attr.mouse.y, 0.5 );
		_attr.projector.unprojectVector( vector, _attr.camera );

		var ray = new THREE.Ray( _attr.camera.position, 
					 vector.subSelf( _attr.camera.position ).normalize() );


		if ( _attr.SELECTED ) {

			var intersects = ray.intersectObject( _attr.plane );
			_attr.SELECTED.ewii3DWidget.grabAction();
			_attr.SELECTED.position.copy( intersects[ 0 ].point.subSelf( _attr.offset ) );
			
			_attr.SELECTED.lookAt( new THREE.Vector3 (0,350,4200) );
			_attr.plane.position.copy( _attr.SELECTED.position );
			/*plane.lookAt( camera.position );
			plane.rotation.x += Math.PI/2;*/
			return;

		}

		var intersects = ray.intersectObjects( _attr.objects );
		if ( intersects.length > 0 ) {

			if ( _attr.INTERSECTED != intersects[ 0 ].object ) {

				//if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

				_attr.INTERSECTED = intersects[ 0 ].object;
				//INTERSECTED.currentHex = INTERSECTED.material.color.getHex();

				_attr.plane.position.copy( _attr.INTERSECTED.position );
				/*plane.lookAt( camera.position );
				plane.rotation.x += Math.PI/2;*/
				

			}

			_attr.container.style.cursor = 'pointer';

		} else {

			//if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

			_attr.INTERSECTED = null;

			_attr.container.style.cursor = 'auto';

		}

	}

	/*
	 *	event handler for mouse down events
	 */

	function onDocumentMouseDown( event ) {

		console.log("DOWN");
		event.preventDefault();

		var vector = new THREE.Vector3( _attr.mouse.x, _attr.mouse.y, 0.5 );
		_attr.projector.unprojectVector( vector, _attr.camera );

		var ray = new THREE.Ray( _attr.camera.position, vector.subSelf( _attr.camera.position ).normalize() );

		var intersects = ray.intersectObjects( _attr.objects );

		if ( intersects.length > 0 ) {

	//					controls.enabled = false;

			_attr.SELECTED = intersects[ 0 ].object;
			_attr.SELECTED.ewii3DWidget.clickAction();

			var intersects = ray.intersectObject( _attr.plane );
			_attr.offset.copy( intersects[ 0 ].point ).subSelf( _attr.plane.position );

			_attr.container.style.cursor = 'move';

		}

	}

	/*
	 *	event handler for mouse up events
	 */

	function onDocumentMouseUp( event ) {

		event.preventDefault();

		//controls.enabled = true;

		if ( _attr.INTERSECTED ) {

			_attr.plane.position.copy( _attr.INTERSECTED.position );
			if (_attr.SELECTED)
				_attr.SELECTED.ewii3DWidget.clickAction();
			_attr.SELECTED = null;

		}

		_attr.container.style.cursor = 'auto';

	}

	/*
	 *	adds some light objects to the scene, a spot light and a sun light.
	 */

	function addLights(){
		
		_attr.scene.add( new THREE.AmbientLight( 0x606060 ) );
		
		var light = new THREE.SpotLight( 0xffffff, 1 );
		light.position.set( 0, 0, 2000 );
		light.castShadow = true;

		light.shadowCameraNear = 200;
		light.shadowCameraFar = _attr.camera.far;
		light.shadowCameraFov = 50;

		light.shadowBias = -0.00022;
		light.shadowDarkness = 0.5;

		light.shadowMapWidth = 2048;
		light.shadowMapHeight = 2048;

		_attr.scene.add( light );
		
		var dirLight = new THREE.DirectionalLight( 0xffffff, 10 );
		dirLight.position.set( 0, 0, 1000 ).normalize();
		_attr.scene.add( dirLight );
	}

	/*
	 *	sets up the renderer object and appends the domElement to the document.
	 */

	function setRenderer(){
		_attr.projector = new THREE.Projector();

		_attr.renderer = new THREE.WebGLRenderer( { antialias: true } );
		_attr.renderer.sortObjects = false;
		_attr.renderer.setSize( window.innerWidth, window.innerHeight );

		_attr.renderer.shadowMapEnabled = true;
		_attr.renderer.shadowMapSoft = true;

		_attr.container.appendChild( _attr.renderer.domElement );
	}

	/*
	 *	adds a helper plane for detecting and manipulating widgets position.
	 *	the plane is invisible.
	 */

	function setHelpers(){
		_attr.plane = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.25, transparent: true, wireframe: true } ) );
		_attr.plane.visible = false;
		_attr.plane.rotation.x = Math.PI/2;
		_attr.scene.add( _attr.plane );
	}

	/*
	 *	starts the animation loop.
	 */

	function animate() {

		requestAnimationFrame( animate );
		render();
	}

	/*
	 *	renders the canvas only once.
	 */

	function render() {


		_attr.renderer.render( _attr.scene, _attr.camera );

	}
	
	return self;
}(Ewii3D || {}));





/*
 *  basic interface for the widgets. all widgets' prototypes must be an instance of this class.
 *  widgets that inherit for Ewii3DWidget will not be able to be grabbed or interacted at all,
 *  see Ewii3DGrabbableWidget for more info.
 */

function Ewii3DWidget(){
	this.id = Ewii3DWidget.prototype.id++;
}

/*
 * the 3d model used for this widget, default: undefined
 */
Ewii3DWidget.prototype.model=undefined;
/*
 * an object that stores the properties of this object
 */
Ewii3DWidget.prototype.properties={};
/*
 * the 3D position of this widget
 */
Ewii3DWidget.prototype.position={x:0,y:0,z:0};
/*
 * the Scale factor for this widget
 */
Ewii3DWidget.prototype.scale =1;
/*
 * a reference to the 3D THREE.Mesh object 
 */

Ewii3DWidget.prototype.object=undefined;

/*
 * a widget counter, used for assigning id's to widgets.
 */

Ewii3DWidget.prototype.id = 0;


/*
 *	This method should not be called externally.
 *	it recieves a geometry, from the load function (via ajax).
 *	then it sets up the this.object propery using that mesh and positions it in the scene.
 */

Ewii3DWidget.prototype.init = function(geo){
	console.log("INITING WIDGET");
	console.log(geo);
	this.object=new THREE.Mesh( geo, new THREE.MeshFaceMaterial({shading:THREE.FlatShading}) );
	
	this.object.geometry.dynamic = true;
	this.object.castShadow = true;
	this.object.receiveShadow = true;
	
	this.object.ewii3D={
			click:this.clickAction,
			grab:this.grabAction
		};

	
	this.object.ewii3DWidget=this;
	
	
	this.object.position.x = this.position.x;
	this.object.position.y = this.position.y;
	this.object.position.z = this.position.z;
	
	this.object.scale.x *= this.scale;
	this.object.scale.y *= this.scale;
	this.object.scale.z *= this.scale;


	Ewii3D.addObjectToScene(this.object);
	//Ewii3D.getInstance().objects.push(this.object);
	console.log("OH HAI");
	console.log(this);
}

/*
 *  changes the position of the widget.
 */

Ewii3DWidget.prototype.setPosition = function (x,y,z){

	this.position={x:x,y:y,z:z};
}

/*
 *  changes the scale factor of the widget.
 */

Ewii3DWidget.prototype.setScale = function (s){

	this.scale=s;
}

/*
 *  actions to be taken once a click (mouse up) is made.
 */


Ewii3DWidget.prototype.clickAction = function(){
}

/*
 *  actions to be taken once a grab (mouse down+move) is made.
 */

Ewii3DWidget.prototype.grabAction = function(){
}


/*
 *  loads the proper JSON using the model property. model must be set before this call
 *  in the child widgets.
 */

Ewii3DWidget.prototype.load = function(){
	var jsonLoader = new THREE.JSONLoader();
	console.log(this.model);
	var self = this;
	jsonLoader.load( this.model, function( geometry ) { console.log("Model Loaded. Geo is:"); console.log (geometry); self.init(geometry);} );
	

}

/*
 *  sets this.model to be `model`
 */

Ewii3DWidget.prototype.setModel = function (model){
	this.model = model;
}


Ewii3DWidget.prototype.refresh=function(){
}

/*
 *  Ewii3DGrabbableWidgets extends Ewii3DWidget and registers the widget to the interactable widgets
 *  in the Ewii3D Singleton.
 */

function Ewii3DGrabbableWidget (){
	//super constructor call
	Ewii3DWidget.call(this);
}

/*
 *  sets up the inheritance.
 */

Ewii3DGrabbableWidget.prototype = new Ewii3DWidget();

/*
 *  calls the super init method and then registers this.object with
 *  the objects that can be interacted.
 */

Ewii3DGrabbableWidget.prototype.init = function(geometry){
	Ewii3DWidget.prototype.init.call(this,geometry);
	Ewii3D.setGrabbable(this.object);
}








/*
 *  upon document's readiness, start the setup and animation loop of Ewii3D
 */

jQuery(document).ready(function(){
	Ewii3D.getInstance().loop();
});



