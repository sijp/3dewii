Ewii3D = (function(self){

	/*
	 *  Ewii3DGrabbableWidgets extends Ewii3DWidget
	 *  and registers the widget to the interactable widgets
	 *  in the Ewii3D Singleton.
	 */
	var DummyWidget = self.augmentWidget(self.Widget);

	self.DummyWidget = DummyWidget;

	return self;
}(Ewii3D || {}));



