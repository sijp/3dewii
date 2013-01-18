

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

var Ewii3D = new function  Ewii3D(){
	var self=this;
	
	Ewii3D.getInstance = function()
	{
		//console.log(self);
		
		return self;
	}
	
	return Ewii3D;
}

Ewii3D.prototype.container;
Ewii3D.prototype.camera;
Ewii3D.prototype.controls;
Ewii3D.prototype.scene;
Ewii3D.prototype.projector;
Ewii3D.prototype.renderer;
Ewii3D.prototype.objects = [];
Ewii3D.prototype.plane;

Ewii3D.prototype.mouse = new THREE.Vector2(),
Ewii3D.prototype.offset = new THREE.Vector3(),
Ewii3D.prototype.INTERSECTED;
Ewii3D.prototype.SELECTED;

/*
 * setups the scene, and starts the animation loop of the webgl canvas.
 */

Ewii3D.prototype.loop = function(){
	this.setup();
	this.animate();
}

/*
 *	this function, adds sets up the webgl Canvas, and adds to it all the relevant 3D objects, such as
 *	the environment sky cube, a camera, the helper plane (for moving widgets) and sets up events handlers
 *	for grabbing widgets.
 *
 *	It sends an AJAX request for a json formatted file, to retrieve the list of the widgets and other settings.
 */

Ewii3D.prototype.setup = function(){
	this.container = document.createElement( 'div' );
	document.body.appendChild( this.container );
	
	this.camera = new THREE.PerspectiveCamera( 25, window.innerWidth / window.innerHeight, 1, 10000 );
	this.camera.position.z = 4200;
	this.camera.position.y = 350;
	this.camera.rotation.x = Math.PI/180;
	
	this.scene = new THREE.Scene();
	this.scene.add(this.camera);
	
	this.scene.add( new THREE.AmbientLight( 0x606060 ) );
	
	this.addLights();
	this.setHelpers();
	this.setRenderer();
	this.setActions();
	
	jQuery.getJSON("demo/scene.json", function(data)
	{
		
		Ewii3D.getInstance().scene.add(Ewii3D.getInstance().setEnv(data.cubeProjection));
		
		for (i=0;i<data.widgets.length;i++)
		{
			new function() {
				widget = new window[data.widgets[i].name];
				
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
	});
}

/*
 *	this function adds the mousemove, mousedown and mouseup event listeners.
 *	also, it sets up a resize listener, in case the window size is changed.
 */

Ewii3D.prototype.setActions=function(){
	this.renderer.domElement.addEventListener( 'mousemove', this.onDocumentMouseMove, false );
	this.renderer.domElement.addEventListener( 'mousedown', this.onDocumentMouseDown, false );
	this.renderer.domElement.addEventListener( 'mouseup', this.onDocumentMouseUp, false );
	
	window.addEventListener( 'resize', this.onWindowResize, false );
}

/*
 *	setEnv, loads 6 images, from the `envName` directory and puts them on a cube as
 *	a cubemap for the environment (sky).
 *
 *	it returns a THREE.Mesh object whose geometry is that cube.
 *
 */

Ewii3D.prototype.setEnv=function(envName){
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

Ewii3D.prototype.onWindowResize=function() {

	Ewii3D.getInstance().camera.aspect = window.innerWidth / window.innerHeight;
	Ewii3D.getInstance().camera.updateProjectionMatrix();

	Ewii3D.getInstance().renderer.setSize( window.innerWidth, window.innerHeight );
	
	for (o in Ewii3D.getInstance().objects)
	{
		console.log(Ewii3D.getInstance().objects[o]);
		Ewii3D.getInstance().objects[o].ewii3DWidget.refresh();
	}

}

/*
 *	event handler for mouse move events
 */

Ewii3D.prototype.onDocumentMouseMove=function( event ) {

	event.preventDefault();

	Ewii3D.getInstance().mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	Ewii3D.getInstance().mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	//

	var vector = new THREE.Vector3( Ewii3D.getInstance().mouse.x, Ewii3D.getInstance().mouse.y, 0.5 );
	Ewii3D.getInstance().projector.unprojectVector( vector, Ewii3D.getInstance().camera );

	var ray = new THREE.Ray( Ewii3D.getInstance().camera.position, 
				 vector.subSelf( Ewii3D.getInstance().camera.position ).normalize() );


	if ( Ewii3D.getInstance().SELECTED ) {

		var intersects = ray.intersectObject( Ewii3D.getInstance().plane );
		Ewii3D.getInstance().SELECTED.ewii3DWidget.grabAction();
		Ewii3D.getInstance().SELECTED.position.copy( intersects[ 0 ].point.subSelf( Ewii3D.getInstance().offset ) );
		
		Ewii3D.getInstance().SELECTED.lookAt( new THREE.Vector3 (0,350,4200) );
		Ewii3D.getInstance().plane.position.copy( Ewii3D.getInstance().SELECTED.position );
		/*plane.lookAt( camera.position );
		plane.rotation.x += Math.PI/2;*/
		return;

	}


	var intersects = ray.intersectObjects( Ewii3D.getInstance().objects );

	if ( intersects.length > 0 ) {

		if ( Ewii3D.getInstance().INTERSECTED != intersects[ 0 ].object ) {

			//if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

			Ewii3D.getInstance().INTERSECTED = intersects[ 0 ].object;
			//INTERSECTED.currentHex = INTERSECTED.material.color.getHex();

			Ewii3D.getInstance().plane.position.copy( Ewii3D.getInstance().INTERSECTED.position );
			/*plane.lookAt( camera.position );
			plane.rotation.x += Math.PI/2;*/
			

		}

		Ewii3D.getInstance().container.style.cursor = 'pointer';

	} else {

		//if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

		Ewii3D.getInstance().INTERSECTED = null;

		Ewii3D.getInstance().container.style.cursor = 'auto';

	}

}

/*
 *	event handler for mouse down events
 */

Ewii3D.prototype.onDocumentMouseDown=function( event ) {

	console.log("DOWN");
	event.preventDefault();

	var vector = new THREE.Vector3( Ewii3D.getInstance().mouse.x, Ewii3D.getInstance().mouse.y, 0.5 );
	Ewii3D.getInstance().projector.unprojectVector( vector, Ewii3D.getInstance().camera );

	var ray = new THREE.Ray( Ewii3D.getInstance().camera.position, vector.subSelf( Ewii3D.getInstance().camera.position ).normalize() );

	var intersects = ray.intersectObjects( Ewii3D.getInstance().objects );

	if ( intersects.length > 0 ) {

//					controls.enabled = false;

		Ewii3D.getInstance().SELECTED = intersects[ 0 ].object;
		Ewii3D.getInstance().SELECTED.ewii3DWidget.clickAction();

		var intersects = ray.intersectObject( Ewii3D.getInstance().plane );
		Ewii3D.getInstance().offset.copy( intersects[ 0 ].point ).subSelf( Ewii3D.getInstance().plane.position );

		Ewii3D.getInstance().container.style.cursor = 'move';

	}

}

/*
 *	event handler for mouse up events
 */

Ewii3D.prototype.onDocumentMouseUp=function( event ) {

	event.preventDefault();

	//controls.enabled = true;

	if ( Ewii3D.getInstance().INTERSECTED ) {

		Ewii3D.getInstance().plane.position.copy( Ewii3D.getInstance().INTERSECTED.position );
		if (Ewii3D.getInstance().SELECTED)
			Ewii3D.getInstance().SELECTED.ewii3DWidget.clickAction();
		Ewii3D.getInstance().SELECTED = null;

	}

	Ewii3D.getInstance().container.style.cursor = 'auto';

}

/*
 *	adds some light objects to the scene, a spot light and a sun light.
 */

Ewii3D.prototype.addLights=function(){
	var light = new THREE.SpotLight( 0xffffff, 1 );
	light.position.set( 0, 0, 2000 );
	light.castShadow = true;

	light.shadowCameraNear = 200;
	light.shadowCameraFar = this.camera.far;
	light.shadowCameraFov = 50;

	light.shadowBias = -0.00022;
	light.shadowDarkness = 0.5;

	light.shadowMapWidth = 2048;
	light.shadowMapHeight = 2048;

	this.scene.add( light );
	
	var dirLight = new THREE.DirectionalLight( 0xffffff, 10 );
	dirLight.position.set( 0, 0, 1000 ).normalize();
	this.scene.add( dirLight );
}

/*
 *	sets up the renderer object and appends the domElement to the document.
 */

Ewii3D.prototype.setRenderer=function(){
	this.projector = new THREE.Projector();

	this.renderer = new THREE.WebGLRenderer( { antialias: true } );
	this.renderer.sortObjects = false;
	this.renderer.setSize( window.innerWidth, window.innerHeight );

	this.renderer.shadowMapEnabled = true;
	this.renderer.shadowMapSoft = true;

	this.container.appendChild( this.renderer.domElement );
}

/*
 *	adds a helper plane for detecting and manipulating widgets position.
 *	the plane is invisible.
 */

Ewii3D.prototype.setHelpers = function(){
	this.plane = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.25, transparent: true, wireframe: true } ) );
	this.plane.visible = false;
	this.plane.rotation.x = Math.PI/2;
	this.scene.add( this.plane );
}

/*
 *	starts the animation loop.
 */

Ewii3D.prototype.animate=function() {

	requestAnimationFrame( Ewii3D.getInstance().animate );

	Ewii3D.getInstance().render();

}

/*
 *	renders the canvas only once.
 */

Ewii3D.prototype.render=function() {


	Ewii3D.getInstance().renderer.render( Ewii3D.getInstance().scene, Ewii3D.getInstance().camera );

}


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


	Ewii3D.getInstance().scene.add(this.object);
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
	jsonLoader.load( this.model, function( geometry ) { console.log (geometry); self.init(geometry);} );
	

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
	Ewii3D.getInstance().objects.push(this.object);
}








/*
 *  upon document's readiness, start the setup and animation loop of Ewii3D
 */

jQuery(document).ready(function(){
	Ewii3D.getInstance().loop();
});



