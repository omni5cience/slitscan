var buffer = [];
var finalImage;

self.addEventListener('message', function(e){
	var counter,
	    clusters,
		pixelData;
	// Hax! Grab the first frame we get as a reusable buffer that we use for
	// all the later frames
	if (!finalImage) {
		finalImage = e.data.imageData;
		self.postMessage({ name: 'readyForFrame' });
		return;
	}
	buffer.push(e.data.imageData);
	if (buffer.length === 480) {
		buffer.shift();
	}
	for (var i = 0, l = finalImage.data.length; i < l; ++i) {
		finalImage.data[i] = buffer[Math.floor(buffer.length * (i / l))].data[i];
	}
	self.postMessage({ name: 'outputFrame', imageData: finalImage });
	self.postMessage({ name: 'readyForFrame' });
});

self.postMessage({ name: 'readyForFrame' });
