// Letterdrip
// by Ben Crowder

var initialHeight = 2;				// How tall the initial center bar is, in pixels
var numBaseHues = 3;				// How many base hues to start with
var baseHues = [];					// Array of base hues
var hueVariation = 5;				// How much variation from the base hues we allow
var saturationVariation = 5;		// Variation for saturation
var lightnessVariation = 5;			// Variation for lightness
var maxDither = 4;					// How much to dither


$(document).ready(function() {
	// Prep canvas
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");

	// On keyup, redraw everything
	$("#textbox, #seed").on("keyup", function() {
		run(context);
	});

	// Initial run
	run(context);
});


// Main function, sets seed and base hues
// --------------------------------------------------

function run(context) {
	var string = $("#textbox").val().trim();

	// If there's a seed in the box, use it
	if ($("#seed").val() != "") {
		Math.seedrandom($("#seed").val());
	} else {
		// Get a seed value from the time
		var seconds = new Date().getTime() / 1000;
		Math.seedrandom(seconds);
		$("#seed").val(seconds);
	}

	// Prep the base hues
	baseHues = [];
	for (var i=0; i<numBaseHues; i++) {
		var hue = Math.random() * 360;

		baseHues.push(hue);	
	}

	// Draw the center bar
	drawColorString(string, context);

	// Smear the pixels up and down
	meltTheScreen(context);
}


// Takes an array of HSL values and draws it out onto a canvas
// --------------------------------------------------

function drawColorString(string, c) {
	var colors = getColorsForString(string);				// Array of HSL values
	var lineY = Math.floor(c.canvas.height / 2);			// Location of the bar
	var characterWidth = c.canvas.width / colors.length;	// Width of each character's color bar

	// For each character in the string, plot the color bar
	for (var i=0; i<colors.length; i++) {
		var color = colors[i];

		c.fillStyle = 'hsl(' + color.h + ', ' + color.s + '%, ' + color.l + '%)';
		c.fillRect(i * characterWidth, lineY, characterWidth, initialHeight);
	}
}


// Smears the pixels
// --------------------------------------------------

function meltTheScreen(c) {
	var idata = c.getImageData(0, 0, c.canvas.width, c.canvas.height);	// Image data
	var halfDith = maxDither / 2;										// Used in dithering
	var lineY = Math.floor(c.canvas.height / 2);						// Y position of initial bar

	// Start at the middle and go up to the top
	for (y=lineY; y>=0; y--) {
		for (x=0; x<idata.width; x++) {
			smearPixel(idata, x, y, 1, halfDith);
		}
	}

	// Start at the middle and go down to the bottom
	for (y=lineY; y<idata.height; y++) {
		for (x=0; x<idata.width; x++) {
			smearPixel(idata, x, y, -1, halfDith);
		}
	}

	// Restore it
	c.putImageData(idata, 0, 0);
}


// Returns HSL color for a given character
// --------------------------------------------------

function getColorForCharacter(character) {
	var hue = 0;			// 0-360
	var saturation = 0;		// 0-100%
	var lightness = 0;		// 0-100%

	// Get the character code
	var charCode = character.charCodeAt(0);

	if (charCode >= 65 && charCode <= 90) {					// Uppercase
		var baseCode = charCode - 65;

		hue = baseHues[baseCode % numBaseHues] + ((Math.random() * hueVariation) - hueVariation / 2);
		saturation = 45 + ((Math.random() * saturationVariation) - saturationVariation / 2);
		lightness = 40 + ((Math.random() * lightnessVariation) - lightnessVariation / 2);
	} else if (charCode >= 97 && charCode <= 122) {			// Lowercase
		var baseCode = charCode - 97;

		hue = baseHues[baseCode % numBaseHues] + ((Math.random() * hueVariation) - hueVariation / 2);
		saturation = 35 + ((Math.random() * saturationVariation) - saturationVariation / 2);
		lightness = 60 + ((Math.random() * lightnessVariation) - lightnessVariation / 2);
	} else {												// Anything else
		hue = 0;
		saturation = 100;
		lightness = 0;
	}
		
	return { h: hue, s: saturation, l: lightness };
}


// Returns array of HSL values for a string
// --------------------------------------------------

function getColorsForString(string) {
	// Strip punctuation
	var s = string.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~() ]/g,"");
	s = s.replace(/\s{2,}/g,"");

	// For each character, get color and add to array
	var colors = [];

	for (var i=0; i<s.length; i++) {
		colors.push(getColorForCharacter(s[i]));
	}

	return colors;
}


// Gets a pixel's RGB value from the canvas
// --------------------------------------------------

function getPixel(imageData, x, y) {
	var index = (x + y * imageData.width) * 4;

	return { r: imageData.data[index], g: imageData.data[index + 1], b: imageData.data[index + 2], a: imageData.data[index + 3] };
}


// Sets a pixel's RGB value on the canvas
// --------------------------------------------------

function setPixel(imageData, x, y, r, g, b, a) {
	var index = (x + y * imageData.width) * 4;

	imageData.data[index] = r;
	imageData.data[index + 1] = g;
	imageData.data[index + 2] = b;
	imageData.data[index + 3] = a;
}


// Gets value of pixel somewhere above it and sets it
// --------------------------------------------------

function smearPixel(idata, x, y, direction, halfDith) {
	// Set the X value to pull from, randomly within maxDither
	var dither = Math.round(Math.random() * maxDither) - halfDith;

	// The pixel to pull from
	var srcPixel = getPixel(idata, x + dither, y + direction);

	// Set the color
	setPixel(idata, x, y, srcPixel.r, srcPixel.g, srcPixel.b, srcPixel.a);
}
