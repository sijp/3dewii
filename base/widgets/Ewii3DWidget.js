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
