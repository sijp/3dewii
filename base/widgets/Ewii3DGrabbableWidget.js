Ewii3D = (function(self){

    /*
     *  Ewii3DGrabbableWidgets extends Ewii3DWidget
     *  and registers the widget to the interactable widgets
     *  in the Ewii3D Singleton.
     */
    var GrabbableWidget = self.augmentWidget(self.Widget);

    GrabbableWidget.prototype.init = function(geo,settings){
        Object.getPrototypeOf(this).init(geo,settings);
        Ewii3D.setGrabbable(settings.object);
    };

    self.GrabbableWidget = GrabbableWidget;

    return self;
}(Ewii3D || {}));
