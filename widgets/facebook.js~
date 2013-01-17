/*
 *  This is an example for a widget that can display dynamic text.
 *  It uses an HTML div tag that floats around.
 */


function FacebookWidget(opts)
{
	//super call
	GamlibaGrabbableWidget.call(this);
	
}

/*
 *  This widget supports interaction, so inheritance to GamlibaGrabbableWidget is made.
 */
FacebookWidget.prototype = new GamlibaGrabbableWidget();


/*
 *  the 3D model is facebook.js which is a Three.js json formatted 3d model exported from blender.
 */

FacebookWidget.prototype.model="facebook.js";

/*
 *  calls the super init function and then sets up the HTML div with appropriate CSS definitions.
 *  then it calls the startLongPolling function to recieve data from the system.
 */


FacebookWidget.prototype.init = function(geometry)
{
	console.log("FACEBOOKKKKK");
	GamlibaGrabbableWidget.prototype.init.call(this,geometry);


	this.text = document.createElement( 'div' );
	this.text.style.position = 'absolute';
	this.text.innerHTML = 'Oh hai!';
	this.text.className = "HoverableText";

	this.text.style.display = "block";
	coord = toScreenXY(this.object.position,Gamliba.getInstance().camera,Gamliba.getInstance().renderer.domElement);

	this.text.style.left = coord.x + 'px';
	this.text.style.top = coord.y + 'px';

	document.body.appendChild( this.text );
	
	this.startLongPolling(this);


}


/*
 *  This function sends an AJAX request to the system for new updates and
 *  then displays them in the HTML DIV.
 *  it displays only the most recent message.
 */


FacebookWidget.prototype.startLongPolling = function(self)
{
	var polling=self.startLongPolling;
	jQuery.getJSON("/gamlibaspace/stream",function(data)
	{
		self.text.innerHTML = data[0]["author"]["diaspora_id"] + " says " + data[0]["text"];
		setTimeout(function(){self.startLongPolling(self);},2000);
	});
}

/*
 *  upon click, we want to display the text and reposition it accordingly to the new position of the 3D object.
 */


FacebookWidget.prototype.clickAction = function()
{
	this.text.style.display = "block";
	coord = toScreenXY(this.object.position,Gamliba.getInstance().camera,Gamliba.getInstance().renderer.domElement);

	this.text.style.left = coord.x + 'px';
	this.text.style.top = coord.y + 'px';
}

/*
 *  Once the widget is grabbed we want the text to disapear (syncing the 2D animation with the 3D animation is kind of lame)
 */


FacebookWidget.prototype.grabAction = function()
{

	this.text.style.display = "none";
	
}

