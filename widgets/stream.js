/*
 *  This is an example for a widget that can display dynamic text.
 *  It uses an HTML div tag that floats around.
 */

Ewii3D = (function(self){

    /*
     *  Ewii3DGrabbableWidgets extends Ewii3DWidget
     *  and registers the widget to the interactable widgets
     *  in the Ewii3D Singleton.
     */
    var StreamWidget = self.augmentWidget(self.GrabbableWidget);

    StreamWidget.prototype.getDecoratedMethods=function(){
        //var methList = Object.getPrototypeOf(this).getDecoratedMethods.call(Object.getPrototypeOf(this)); //super call
        var methList = self.superCall(this,'getDecoratedMethods');
        methList.push("startLongPolling");

        return methList;
    };
    
    StreamWidget.prototype.init = function(geometry,settings){
        Object.getPrototypeOf(this).init.call(Object.getPrototypeOf(this),geometry,settings);
        
        settings.object.geometry.computeBoundingBox();
        boundingbox = settings.object.geometry.boundingBox;
        
        /*
         *  we add a helper cube which is invisible. it will help us understand where to put the 2D HTML Div to mimic
         *  as if the text is displayed on top of the 3D object.
         */
        bbox = new THREE.CubeGeometry((boundingbox.max.x-boundingbox.min.x)*0.6,
                        (boundingbox.max.y-boundingbox.min.y)*0.7,
                        boundingbox.max.z-boundingbox.min.z);
        console.log(bbox);
        settings.bboxMeshHelper = new THREE.Mesh(bbox,new THREE.MeshBasicMaterial( { color: 0xFFFFFF,  wireframe: true , visible: false} ));
        settings.bboxMeshHelper.position = settings.object.position;
        settings.bboxMeshHelper.visible=false;
        Ewii3D.addObjectToScene(settings.bboxMeshHelper);


        settings.text = document.createElement( 'div' );
        settings.text.style.position = 'absolute';
        settings.text.innerHTML = 'Oh hai!';
        settings.text.className = "HoverableText";

        settings.text.style.display = "block";

        
        settings.statusButton = document.createElement( 'img' );
        settings.statusButton.src = "./widgets/stream/images/add.png";
        settings.statusButton.style.position = 'absolute';
        settings.statusButton.className = "HoverableElement";
        
        settings.statusForm = $("<div>\
                         <p>What is on your mind?</p>\
                    <form>\
                    <textarea name=\"status\" cols=\"25\" rows=\"4\" ></textarea>     \
                    </form></div>").get();

        $(settings.statusForm).hide();
        $("body").append( $(settings.statusForm) );
        $(settings.statusForm).dialog({
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
        $(settings.statusForm).show();
        
        this.refresh(settings)

        document.body.appendChild( settings.text );
        document.body.appendChild( settings.statusButton );
        
        $(settings.statusButton).click(function()
        {
            $( settings.statusForm ).dialog( "open" );
        });
        
        this.startLongPolling();
    };

    StreamWidget.getModel=function(){
        return "widgets/stream/streamPod.js";
    };

    function longPolling(settings){
        jQuery.getJSON("/stream",function(data)
        {
            settings.text.innerHTML = data[0]["author"]["diaspora_id"] + " says " + data[0]["text"];
            setTimeout(function(){
                    longPolling(settings);
                },10000);
        });
    }

    StreamWidget.prototype.startLongPolling = function(settings){
        longPolling(settings);
    }
    
    
    /*
     *  upon click, we want to display the text and reposition it accordingly to the new position of the 3D object.
     */
    StreamWidget.prototype.clickAction = function(settings){
        console.log("clickity");
        $(settings.text).fadeIn(200);
        $(settings.statusButton).fadeIn(200);
        
        this.refresh(settings);
    }

    /*
     *  Once the widget is grabbed we want the text to disapear (syncing the 2D animation with the 3D animation is kind of lame)
     */
    StreamWidget.prototype.refresh = function(settings){
        settings.bboxMeshHelper.geometry.computeBoundingBox();
        boundingbox = settings.bboxMeshHelper.geometry.boundingBox;
        
        boundingbox.max.z=0;
        boundingbox.min.z=0;
        
        //topright = toScreenXY(this.bboxMeshHelper.position.clone().addSelf(boundingbox.max),Ewii3D.getInstance().camera,Ewii3D.getInstance().renderer.domElement);
        //bottomleft = toScreenXY(this.bboxMeshHelper.position.clone().addSelf(boundingbox.min),Ewii3D.getInstance().camera,Ewii3D.getInstance().renderer.domElement);
        topright = Ewii3D.toScreenXY(settings.bboxMeshHelper.position.clone().addSelf(boundingbox.max));
        bottomleft = Ewii3D.toScreenXY(settings.bboxMeshHelper.position.clone().addSelf(boundingbox.min));
        settings.text.style.left = (bottomleft.x) + 'px';
        settings.text.style.top = (topright.y) + 'px';
        
        settings.text.style.width = (topright.x-bottomleft.x) + 'px';
        settings.text.style.height = (bottomleft.y-topright.y) + 'px';
        
        settings.statusButton.style.left = (topright.x) + 'px';
        settings.statusButton.style.top = (bottomleft.y) + 'px';

    }

    StreamWidget.prototype.grabAction = function(settings){
        //this.text.style.display = "none";
        $(settings.text).fadeOut(100);
        $(settings.statusButton).fadeOut(100);
        
        
    }
    
    self.StreamWidget = StreamWidget;

    return self;
}(Ewii3D || {}));




