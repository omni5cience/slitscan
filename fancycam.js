"use strict";

function FPSTracker(){
	this.renderTimes = [];
}
FPSTracker.prototype.trackRender = function(){
	this.renderTimes.push(+new Date);
	if (this.renderTimes.length > 20) {
		this.renderTimes.shift();
	}
};
FPSTracker.prototype.getFPS = function(){
	return this.renderTimes.length / (+new Date() - this.renderTimes[0]) * 1000;
};

function Fancycam(Filter, outputcanvas, onfps){
		this.outputcanvas = outputcanvas;
		this.filter = new Filter();
		this.onfps = onfps;
		Fancycam.getUserMedia.call(navigator, { video: true, audio: false }, this.onstream.bind(this), console.warn.bind(console));
}
Fancycam.getUserMedia =
	navigator.getUserMedia ||
	navigator.webkitGetUserMedia ||
	navigator.mozGetUserMedia ||
	navigator.msGetUserMedia
;
Fancycam.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
Fancycam.prototype.onstream = function(stream){
	this.workers = [];
	this.videoel = document.createElement('video');
	this.videoel.src = Fancycam.URL.createObjectURL(stream);
	this.videoel.play();

	this.inputcanvas = document.createElement('canvas');
	this.inputctx = this.inputcanvas.getContext('2d');
	this.outputctx = this.outputcanvas.getContext('2d'),

	this.FPS = new FPSTracker;

	this.videoel.addEventListener('playing', this.onplaying.bind(this));
};
Fancycam.prototype.onplaying = function(){
	var i, worker;

	this.width = this.inputcanvas.width = this.outputcanvas.width = this.videoel.videoWidth;
	this.height = this.inputcanvas.height = this.outputcanvas.height = this.videoel.videoHeight;

	i = this.filter.workers;
	while (i--) {
		worker = new Worker(this.filter.workerSrc);
		this.workers.push(worker);
		var size = (this.height / this.workers.length);
		var top = size * i;
		worker.addEventListener('message', this.onworkermessage.bind(this, worker, i, size, top));
	};
};
Fancycam.prototype.onworkermessage = function(worker, n, size, top, e){
	switch (e.data.name) {
		case 'readyForFrame':
			this.inputctx.drawImage(this.videoel, 0, 0, this.width, this.height);
			worker.postMessage({ imageData: this.inputctx.getImageData(0, top, this.width, size) });
			break;
		case 'outputFrame':
			this.outputctx.putImageData(e.data.imageData, 0, top);
			if (n === 0) {
				this.FPS.trackRender();
				if (this.onfps) {
					this.onfps(Math.floor(this.FPS.getFPS() * 10 + 0.5) / 10);
				}
			}
	}
};
