
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
