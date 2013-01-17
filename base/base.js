

/*
 *  This is the main file used by the 3D interface. It defines the most important prototypes that are in use.
 *  The main object is a singleton-like object of type Gamliba. It's core functionality is to setup the 3D scene
 *  and events.
 *  In order to access the object, one should use the getInstance function: Gamliba.getinstance() .
 *  One more important prototype is the GamlibaWidget prototype, which defines the basic functionality for 3D widgets.
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
 * Gamliba Singleton, renders and animates the entire scene.
 * sets up all widgets and the environment according to retrieved JSON data.
 * Before anything can be done, the main render loop should be called by Gamliba.getInstance().loop();
 */

var Gamliba = new function  Gamliba()
{
	var self=this;
	
	Gamliba.getInstance = function()
	{
		//console.log(self);
		
		return self;
	}
	
	return Gamliba;
}

Gamliba.prototype.container;
Gamliba.prototype.camera;
Gamliba.prototype.controls;
Gamliba.prototype.scene;
Gamliba.prototype.projector;
Gamliba.prototype.renderer;
Gamliba.prototype.objects = [];
Gamliba.prototype.plane;

Gamliba.prototype.mouse = new THREE.Vector2(),
Gamliba.prototype.offset = new THREE.Vector3(),
Gamliba.prototype.INTERSECTED;
Gamliba.prototype.SELECTED;

/*
 * setups the scene, and starts the animation loop of the webgl canvas.
 */

Gamliba.prototype.loop = function()
{
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

Gamliba.prototype.setup = function()
{
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
		
		Gamliba.getInstance().scene.add(Gamliba.getInstance().setEnv(data.cubeProjection));
		
		for (i=0;i<data.widgets.length;i++)
		{
			new function() {
				widget = new window[data.widgets[i].name];
				
				if (data.widgets[i].model!==undefined)
					widget.setModel(data.widgets[i].model);
				
				position = data.widgets[i].position;
				console.log(position);
				widget.setPosition(position.x,position.y,position.z);
				widget.load();
			};

		}
	});
}

/*
 *	this function adds the mousemove, mousedown and mouseup event listeners.
 *	also, it sets up a resize listener, in case the window size is changed.
 */

Gamliba.prototype.setActions=function()
{
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

Gamliba.prototype.setEnv=function(envName)
{
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

Gamliba.prototype.onWindowResize=function() {

	Gamliba.getInstance().camera.aspect = window.innerWidth / window.innerHeight;
	Gamliba.getInstance().camera.updateProjectionMatrix();

	Gamliba.getInstance().renderer.setSize( window.innerWidth, window.innerHeight );
	
	for (o in Gamliba.getInstance().objects)
	{
		console.log(Gamliba.getInstance().objects[o]);
		Gamliba.getInstance().objects[o].gamlibaWidget.refresh();
	}

}

/*
 *	event handler for mouse move events
 */

Gamliba.prototype.onDocumentMouseMove=function( event ) {

	event.preventDefault();

	Gamliba.getInstance().mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	Gamliba.getInstance().mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	//

	var vector = new THREE.Vector3( Gamliba.getInstance().mouse.x, Gamliba.getInstance().mouse.y, 0.5 );
	Gamliba.getInstance().projector.unprojectVector( vector, Gamliba.getInstance().camera );

	var ray = new THREE.Ray( Gamliba.getInstance().camera.position, 
				 vector.subSelf( Gamliba.getInstance().camera.position ).normalize() );


	if ( Gamliba.getInstance().SELECTED ) {

		var intersects = ray.intersectObject( Gamliba.getInstance().plane );
		Gamliba.getInstance().SELECTED.gamlibaWidget.grabAction();
		Gamliba.getInstance().SELECTED.position.copy( intersects[ 0 ].point.subSelf( Gamliba.getInstance().offset ) );
		
		Gamliba.getInstance().SELECTED.lookAt( new THREE.Vector3 (0,350,4200) );
		Gamliba.getInstance().plane.position.copy( Gamliba.getInstance().SELECTED.position );
		/*plane.lookAt( camera.position );
		plane.rotation.x += Math.PI/2;*/
		return;

	}


	var intersects = ray.intersectObjects( Gamliba.getInstance().objects );

	if ( intersects.length > 0 ) {

		if ( Gamliba.getInstance().INTERSECTED != intersects[ 0 ].object ) {

			//if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

			Gamliba.getInstance().INTERSECTED = intersects[ 0 ].object;
			//INTERSECTED.currentHex = INTERSECTED.material.color.getHex();

			Gamliba.getInstance().plane.position.copy( Gamliba.getInstance().INTERSECTED.position );
			/*plane.lookAt( camera.position );
			plane.rotation.x += Math.PI/2;*/
			

		}

		Gamliba.getInstance().container.style.cursor = 'pointer';

	} else {

		//if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

		Gamliba.getInstance().INTERSECTED = null;

		Gamliba.getInstance().container.style.cursor = 'auto';

	}

}

/*
 *	event handler for mouse down events
 */

Gamliba.prototype.onDocumentMouseDown=function( event ) {

	console.log("DOWN");
	event.preventDefault();

	var vector = new THREE.Vector3( Gamliba.getInstance().mouse.x, Gamliba.getInstance().mouse.y, 0.5 );
	Gamliba.getInstance().projector.unprojectVector( vector, Gamliba.getInstance().camera );

	var ray = new THREE.Ray( Gamliba.getInstance().camera.position, vector.subSelf( Gamliba.getInstance().camera.position ).normalize() );

	var intersects = ray.intersectObjects( Gamliba.getInstance().objects );

	if ( intersects.length > 0 ) {

//					controls.enabled = false;

		Gamliba.getInstance().SELECTED = intersects[ 0 ].object;
		Gamliba.getInstance().SELECTED.gamlibaWidget.clickAction();

		var intersects = ray.intersectObject( Gamliba.getInstance().plane );
		Gamliba.getInstance().offset.copy( intersects[ 0 ].point ).subSelf( Gamliba.getInstance().plane.position );

		Gamliba.getInstance().container.style.cursor = 'move';

	}

}

/*
 *	event handler for mouse up events
 */

Gamliba.prototype.onDocumentMouseUp=function( event ) {

	event.preventDefault();

	//controls.enabled = true;

	if ( Gamliba.getInstance().INTERSECTED ) {

		Gamliba.getInstance().plane.position.copy( Gamliba.getInstance().INTERSECTED.position );
		if (Gamliba.getInstance().SELECTED)
			Gamliba.getInstance().SELECTED.gamlibaWidget.clickAction();
		Gamliba.getInstance().SELECTED = null;

	}

	Gamliba.getInstance().container.style.cursor = 'auto';

}

/*
 *	adds some light objects to the scene, a spot light and a sun light.
 */

Gamliba.prototype.addLights=function()
{
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

Gamliba.prototype.setRenderer=function()
{
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

Gamliba.prototype.setHelpers = function()
{
	this.plane = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.25, transparent: true, wireframe: true } ) );
	this.plane.visible = false;
	this.plane.rotation.x = Math.PI/2;
	this.scene.add( this.plane );
}

/*
 *	starts the animation loop.
 */

Gamliba.prototype.animate=function() {

	requestAnimationFrame( Gamliba.getInstance().animate );

	Gamliba.getInstance().render();

}

/*
 *	renders the canvas only once.
 */

Gamliba.prototype.render=function() {


	Gamliba.getInstance().renderer.render( Gamliba.getInstance().scene, Gamliba.getInstance().camera );

}


/*
 *  basic interface for the widgets. all widgets' prototypes must be an instance of this class.
 *  widgets that inherit for GamlibaWidget will not be able to be grabbed or interacted at all,
 *  see GamlibaGrabbableWidget for more info.
 */

function GamlibaWidget()
{
	this.id = GamlibaWidget.prototype.id++;
}

/*
 * the 3d model used for this widget, default: undefined
 */
GamlibaWidget.prototype.model=undefined;
/*
 * an object that stores the properties of this object
 */
GamlibaWidget.prototype.properties={};
/*
 * the 3D position of this widget
 */
GamlibaWidget.prototype.position={x:0,y:0,z:0};

/*
 * a reference to the 3D THREE.Mesh object 
 */

GamlibaWidget.prototype.object=undefined;

/*
 * a widget counter, used for assigning id's to widgets.
 */

GamlibaWidget.prototype.id = 0;


/*
 *	This method should not be called externally.
 *	it recieves a geometry, from the load function (via ajax).
 *	then it sets up the this.object propery using that mesh and positions it in the scene.
 */

GamlibaWidget.prototype.init = function(geo)
{
	console.log("INITING WIDGET");
	console.log(geo);
	this.object=new THREE.Mesh( geo, new THREE.MeshFaceMaterial({shading:THREE.FlatShading}) );
	
	this.object.geometry.dynamic = true;
	this.object.castShadow = true;
	this.object.receiveShadow = true;
	
	this.object.gamliba={
			click:this.clickAction,
			grab:this.grabAction
		};

	
	this.object.gamlibaWidget=this;
	
	
	this.object.position.x = this.position.x;
	this.object.position.y = this.position.y;
	this.object.position.z = this.position.z;
	
	/*this.object.scale.x =  60;
	this.object.scale.y =  60;
	this.object.scale.z =  60;*/


	Gamliba.getInstance().scene.add(this.object);
	//Gamliba.getInstance().objects.push(this.object);
	console.log("OH HAI");
	console.log(this);
}

/*
 *  changes the position of the widget.
 */

GamlibaWidget.prototype.setPosition = function (x,y,z)
{

	this.position={x:x,y:y,z:z};
}

/*
 *  actions to be taken once a click (mouse up) is made.
 */


GamlibaWidget.prototype.clickAction = function()
{
}

/*
 *  actions to be taken once a grab (mouse down+move) is made.
 */

GamlibaWidget.prototype.grabAction = function()
{
}


/*
 *  loads the proper JSON using the model property. model must be set before this call
 *  in the child widgets.
 */

GamlibaWidget.prototype.load = function()
{
	var jsonLoader = new THREE.JSONLoader();
	console.log(this.model);
	var self = this;
	jsonLoader.load( this.model, function( geometry ) { console.log (geometry); self.init(geometry);} );
	

}

/*
 *  sets this.model to be `model`
 */

GamlibaWidget.prototype.setModel = function (model)
{
	this.model = model;
}


GamlibaWidget.prototype.refresh=function()
{
}

/*
 *  GamlibaGrabbableWidgets extends GamlibaWidget and registers the widget to the interactable widgets
 *  in the Gamliba Singleton.
 */

function GamlibaGrabbableWidget ()
{
	//super constructor call
	GamlibaWidget.call(this);
}

/*
 *  sets up the inheritance.
 */

GamlibaGrabbableWidget.prototype = new GamlibaWidget();

/*
 *  calls the super init method and then registers this.object with
 *  the objects that can be interacted.
 */

GamlibaGrabbableWidget.prototype.init = function(geometry)
{
	GamlibaWidget.prototype.init.call(this,geometry);
	Gamliba.getInstance().objects.push(this.object);
}








/*
 *  upon document's readiness, start the setup and animation loop of Gamliba
 */

jQuery(document).ready(function()
{
	Gamliba.getInstance().loop();
});



