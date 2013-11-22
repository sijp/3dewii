/*
 *  This is an example for a widget that can display dynamic text.
 *  It uses an HTML div tag that floats around.
 */


function StreamWidget(opts){
	//super call
	Ewii3DGrabbableWidget.call(this);
	
}

/*
 *  This widget supports interaction, so inheritance to Ewii3DGrabbableWidget is made.
 */
StreamWidget.prototype = new Ewii3DGrabbableWidget();


/*
 *  the 3D model is facebook.js which is a Three.js json formatted 3d model exported from blender.
 */

StreamWidget.prototype.model="widgets/stream/streamPod.js";

/*
 *  calls the super init function and then sets up the HTML div with appropriate CSS definitions.
 *  then it calls the startLongPolling function to recieve data from the system.
 */


StreamWidget.prototype.init = function(geometry){
	Ewii3DGrabbableWidget.prototype.init.call(this,geometry);

	this.object.geometry.computeBoundingBox();
	boundingbox = this.object.geometry.boundingBox;
	
	/*
	 *  we add a helper cube which is invisible. it will help us understand where to put the 2D HTML Div to mimic
	 *  as if the text is displayed on top of the 3D object.
	 */
	
	bbox = new THREE.CubeGeometry((boundingbox.max.x-boundingbox.min.x)*0.6,
					(boundingbox.max.y-boundingbox.min.y)*0.7,
					boundingbox.max.z-boundingbox.min.z);
	console.log(bbox);
	this.bboxMeshHelper = new THREE.Mesh(bbox,new THREE.MeshBasicMaterial( { color: 0xFFFFFF,  wireframe: true , visible: false} ));
	this.bboxMeshHelper.position = this.object.position;
	this.bboxMeshHelper.visible=false;
	Ewii3D.addObjectToScene(this.bboxMeshHelper);


	this.text = document.createElement( 'div' );
	this.text.style.position = 'absolute';
	this.text.innerHTML = 'Oh hai!';
	this.text.className = "HoverableText";

	this.text.style.display = "block";

	
	this.statusButton = document.createElement( 'img' );
	this.statusButton.src = "./widgets/stream/images/add.png";
	this.statusButton.style.position = 'absolute';
	this.statusButton.className = "HoverableElement";
	
	this.statusForm = $("<div>\
			     <p>What is on your mind?</p>\
			<form>\
			<textarea name=\"status\" cols=\"25\" rows=\"4\" ></textarea>     \
			</form></div>").get();

	$(this.statusForm).hide();
	$("body").append( $(this.statusForm) );
	$(this.statusForm).dialog({
            autoOpen: false,
            height: 300,
            width: 350,
            modal: true,
            buttons:
		    {
		    	"post":function()
		    	{
		    	
		    	$.ajax({
			  type: 'POST',
			  url: "/status_messages",
			  data: {aspects_ids:"all_aspects", status_message:
					    		{text:"test"}},
			  dataType: "text/json"
			});
		    	

		    		$( this ).dialog( "close" );
		    	}
		    }
            });
	$(this.statusForm).show();
	
	this.refresh()

	document.body.appendChild( this.text );
	document.body.appendChild( this.statusButton );
	
	
	
	self=this;	
	$(this.statusButton).click(function()
	{
                $( self.statusForm ).dialog( "open" );
	});
	
	this.startLongPolling(this);


}


/*
 *  This function sends an AJAX request to the system for new updates and
 *  then displays them in the HTML DIV.
 *  it displays only the most recent message.
 */


StreamWidget.prototype.startLongPolling = function(self){
	var polling=self.startLongPolling;
	jQuery.getJSON("/stream",function(data)
	{
		self.text.innerHTML = data[0]["author"]["diaspora_id"] + " says " + data[0]["text"];
		setTimeout(function(){self.startLongPolling(self);},10000);
	});
}

/*
 *  upon click, we want to display the text and reposition it accordingly to the new position of the 3D object.
 */


StreamWidget.prototype.clickAction = function(){
	$(this.text).fadeIn(200);
	$(this.statusButton).fadeIn(200);
	
	this.refresh();
}

/*
 *  Once the widget is grabbed we want the text to disapear (syncing the 2D animation with the 3D animation is kind of lame)
 */

StreamWidget.prototype.refresh = function(){
	this.bboxMeshHelper.geometry.computeBoundingBox();
	boundingbox = this.bboxMeshHelper.geometry.boundingBox;
	
	boundingbox.max.z=0;
	boundingbox.min.z=0;
	
	
	//topright = toScreenXY(this.bboxMeshHelper.position.clone().addSelf(boundingbox.max),Ewii3D.getInstance().camera,Ewii3D.getInstance().renderer.domElement);
	//bottomleft = toScreenXY(this.bboxMeshHelper.position.clone().addSelf(boundingbox.min),Ewii3D.getInstance().camera,Ewii3D.getInstance().renderer.domElement);
	topright = Ewii3D.toScreenXY(this.bboxMeshHelper.position.clone().addSelf(boundingbox.max));
	bottomleft = Ewii3D.toScreenXY(this.bboxMeshHelper.position.clone().addSelf(boundingbox.min));
	this.text.style.left = (bottomleft.x) + 'px';
	this.text.style.top = (topright.y) + 'px';
	
	this.text.style.width = (topright.x-bottomleft.x) + 'px';
	this.text.style.height = (bottomleft.y-topright.y) + 'px';
	
	this.statusButton.style.left = (topright.x) + 'px';
	this.statusButton.style.top = (bottomleft.y) + 'px';

}

StreamWidget.prototype.grabAction = function(){

	//this.text.style.display = "none";
	$(this.text).fadeOut(100);
	$(this.statusButton).fadeOut(100);
	
	
}

