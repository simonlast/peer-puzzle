
var tiltLR, tiltFB, dir, motUD;

if (window.DeviceOrientationEvent) {
  //console.log("DeviceOrientation");
  // Listen for the deviceorientation event and handle the raw data
  window.addEventListener('deviceorientation', function(eventData) {
    // gamma is the left-to-right tilt in degrees, where right is positive
    tiltLR = eventData.gamma;
    // beta is the front-to-back tilt in degrees, where front is positive
    tiltFB = eventData.beta;
    // alpha is the compass direction the device is facing in degrees
    dir = eventData.alpha
    // deviceorientation does not provide this data
    motUD = null;
  }, false);
} else if (window.OrientationEvent) {
  //console.log("OrientationEvent");
  window.addEventListener('MozOrientation', function(eventData) {
    // x is the left-to-right tilt from -1 to +1, so we need to convert to degrees
    tiltLR = eventData.x * 90;
    // y is the front-to-back tilt from -1 to +1, so we need to convert to degrees
    // We also need to invert the value so tilting the device towards us (forward) 
    // results in a positive value. 
    tiltFB = eventData.y * -90;
    // MozOrientation does not provide this data
    dir = null;
    // z is the vertical acceleration of the device
    motUD = eventData.z;
  }, false);
} else {
  alert("Device Orientation not supported")
}
