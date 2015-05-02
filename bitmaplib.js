/**
 * Wraps given value into interval <0,maximum>.
 * @private
 *
 * @param value value to be wrapped
 * @param maximum maximum allowed value
 * @return wrapped value
 */
 
function wrap(value, maximum)
  {  
    maximum += 1;
  
	if (value < 0)
	  {
		value *= -1;
        value %= maximum;
        value = maximum - value;
	  }
	  
	if (value != 0)
	  value = value % maximum;
  
    return value;
  }

/**
 *  Loads images from given set of input elements.
 *
 *  @param inputs array of input elements, their images must be
 *    already set (inputs without selected images will return null)
 *  @param completedCallback a function that will be called once
 *    all images have been loaded, it should take one parameter
 *    that will contain an array of images that have been loaded
 */
  
function loadImagesFromInputs(inputs, completedCallback)
  {
	  
  }
  
/**
 *  Creates a new Image.
 *  @class
 *
 *  @param width image width in pixels
 *  @param height image height in pixels
 */
 
function Image(width, height)
  { 
    // constants:
  
    /** Treat pixels outside the image area as black. */
    this.BORDER_BEHAVIOR_BLACK = 0;
    /** Treat pixels outside the image area as white. */
	this.BORDER_BEHAVIOR_WHITE = 1;
    /** Treat pixels outside the image with modular arithmetic, i.e. as if there was the same image. */
    this.BORDER_BEHAVIOR_WRAP = 2;
    /** Treat pixels outside the image as if there was the same image mirrored. */
    this.BORDER_BEHAVIOR_MIRROR = 3;
    /** If a pixel outside the image area is accessed, the closest one is used. */
    this.BORDER_BEHAVIOR_CLOSEST = 4;
    
	/** If a pixel is set to a value wxceeding minimum/maximum value, saturation is used (e.g. 257 => 255). */
    this.OVERFLOW_BEHAVIOR_SATURATE = 10;
	/** If a pixel is set to a value wxceeding minimum/maximum value, wrapping is used (modulo, e.g. 257 => 1). */
    this.OVERFLOW_BEHAVIOR_WRAP = 11;
	
	/**
	 *  Sets the image size to given value. Old content is
     *  either cropped or extended according to current border
	 *  behavior.
	 *
	 *  @param width new image width in pixels
	 *  @param height new image height in pixels
	 */
	
	this.setSize = function(width, height)
	  {
		var newArray = new Array(width);
		  
	    for (var i = 0; i < width; i++)
	      {
	        newArray[i] = new Array(height);
		  
	        for (var j = 0; j < height; j++)
		      newArray[i][j] = new Array(3);  // rgb
	      }
		  
		// copy the data to the new array:
		  
		for (var j = 0; j < height; j++)
	      for (var i = 0; i < width; i++)
		    {
			  var color = this.getPixel(i,j);
				
			  newArray[i][j][0] = color[0];
			  newArray[i][j][1] = color[1];
			  newArray[i][j][2] = color[2];
			}
			
		this.imageData = newArray;
	  }
	
	/**
	 *  Loads the image from input element of HTML5 File API.
	 *  This allows for client local images to be loaded. The loading
	 *  happens asynchronously.
	 *
	 *  @param input input element that must have the image
	 *    file selected (otherwise nothing happens)
	 *  @param completedCallback a function that will be run
	 *    once the loading has been completed
	 */
	
	this.loadFromInput = function(input, completedCallback)
	  {
        var file = input.files[0];		
		var reader = new FileReader();
		var selfReference = this;
		
		if (file)    // if file is selected
		  {
		    var imageElement = document.createElement("img");
	    
		    reader.onload = 
		      (
		        function(image)
			      {
			        return function(event)
				     { 
					   image.src = event.target.result;
					   
			           var width = image.width;
			           var height = image.height;
					   
					   selfReference.setSize(width,height);

					   var canvas = document.createElement("canvas");
					   canvas.width = width + 1;
					   canvas.height = height + 1;
		               var context = canvas.getContext("2d");
		               context.drawImage(image,0,0);
			
			           var imageData = context.getImageData(0,0,width,height);
			
			           var column = 0;
					   var row = 0;
					   
			           for (var i = 0; i < imageData.data.length; i+= 4)  // rgba
					     {
						   selfReference.setPixel(column,row,imageData.data[i],imageData.data[i + 1],imageData.data[i + 2]);
							
						   column += 1;
						   
						   if (column >= width)
						     {
							   column = 0;
							   row += 1;
							 }
						 }
						 
					   completedCallback();
				     };
			      }  
		      )(imageElement);
		
		    reader.readAsDataURL(file);
		  }  
	  }
	
	/**
	 *  Applies the current overflow behavior to given value.
	 *  @private
	 *
	 *  @param value value to apply the bahavior to
	 *  @return the value after the behavior has been applied
	 */
	
	this.applyOverflowBehavior = function(value)
	  {  
		switch(this.overflowBehavior)
		  {
			case this.OVERFLOW_BEHAVIOR_SATURATE:
			  if (value < 0)
				value = 0;
		      else if (value > 255)
				value = 255;
			  break;
			  
			case this.OVERFLOW_BEHAVIOR_WRAP: 
			  value = wrap(value,255);
			  break;
			  
			default:
			  break;
		  }
		  
		return value;
	  }

	/**
	 *  Applies the current border behavior to given value.
	 *  @private
	 *
	 *  @param value value to apply the bahavior to
	 *  @param maximum maximum value allowed
	 *  @return the value after the behavior has been applied or
	 *    -1 which means the value cannot be converted and should
	 *    not be used
	 */
	
	this.applyBorderBehavior = function(value, maximum)
	  {  
		switch(this.borderBehavior)
		  {
			default:
			case this.BORDER_BEHAVIOR_BLACK:
			case this.BORDER_BEHAVIOR_WHITE:
			  if (value < 0)
				value = -1;
		      else if (value > maximum)
				value = -1;
			  break;
			  
			case this.BORDER_BEHAVIOR_CLOSEST: 
			  if (value < 0)
				value = 0;
			  else if (value > maximum)
			    value = maximum;
			  break;
			  
			case this.BORDER_BEHAVIOR_WRAP:
			  value = wrap(value,maximum);
			  break;
			
            case this.BORDER_BEHAVIOR_MIRROR:
			  even_part = value >= 0 ?
			    Math.floor(value / (maximum + 1)) % 2 == 0 :
				Math.floor(-1 * (value + 1) / (maximum + 1)) % 2 != 0;
				
			  value = wrap(value,maximum);
			  
			  if (!even_part)
				value = maximum - value;
			  break;
		  }
		  
		return value;
	  }
	  
	/**
	 *  Sets the border behavior for the image, i.e. the rules
     *  that say which pixel is used when a pixel outside the
     *  image are is accessed.
     *
     *  @param behavior new behavior to be set, see the class
	 *         constants starting with BORDER_BEHAVIOR_	 
	 */
	
	this.setBorderBehavior = function(behavior)
	  {
		this.borderBehavior = behavior;
	  }
	  
	/**
	 *  Sets the overflow behavior for the image, i.e. the rules
     *  that say how a pixel value should be converted to the
	 *  minimum/maximum	range if it exceeds it.
	 *
     *  @param behavior new behavior to be set, see the class
	 *         constants starting with OVERFLOW_BEHAVIOR_
	 */
	
	this.setOverflowBehavior = function(behavior)
	  {
		this.overflowBehavior = behavior;
	  }
	
    /**
	 *  Gets the image width.
	 *
	 *  @return image width in pixels
	 */
  
	this.getWidth = function()
	  {
		return this.imageData.length;
	  }
			
	/**
	 *  Gets the image height.
	 *
	 *  @return image height in pixels
	 */
			
    this.getHeight = function()
	  {
		return this.imageData[0].length;
	  }
			
	/**
	 *  Gets a pixel RGB value.
	 *
	 *  @param x x position
	 *  @param y y position
	 *  @return array of color RGB components
	 */
			
	this.getPixel = function(x, y)
	  {
		x = this.applyBorderBehavior(x,this.getWidth() - 1);
		y = this.applyBorderBehavior(y,this.getHeight() - 1);
		
        if (x < 0 || y < 0)   // unusable values
		  {
			if (this.borderBehavior == this.BORDER_BEHAVIOR_WHITE)
 		  	  return [255,255,255];
		    else
			  return [0,0,0];
		  }
		  
		return this.imageData[x][y].slice();
	  }
	
    /**
	 *  Sets a pixel at given position to given RGB value.
	 *
	 *  @param x x position
	 *  @param y y position
	 *  @param red new red value (0 - 255)
	 *  @param green new green value (0 - 255)
	 *  @param blue new blue value (0 - 255)
	 */
	
    this.setPixel = function(x, y, red, green, blue)
	  {
		x = this.applyBorderBehavior(x,this.getWidth() - 1);
		y = this.applyBorderBehavior(y,this.getHeight() - 1);

        if (x < 0 || y < 0)   // unusable values
		  return;
		  
	    this.imageData[x][y][0] = this.applyOverflowBehavior(red);
		this.imageData[x][y][1] = this.applyOverflowBehavior(green);
		this.imageData[x][y][2] = this.applyOverflowBehavior(blue);
	  }
			
	/**
	 *  Performs given operation represented by a function
	 *  on every image pixel.
	 *
	 *  @param functionToApply function to be applied,
	 *         its parameters must be x, y, r, g, b and it
	 *         must return an array of RGB components
	 */
			
	this.forEachPixel = function(functionToApply)
	  {
	    for (var i = 0; i < this.getWidth(); i++)
		  for (var j = 0; j < this.getHeight(); j++)
		    {
		      var color = this.getPixel(i,j);
			  color = functionToApply(i,j,color[0],color[1],color[2]);
			  
			  this.setPixel(i,j,color[0],color[1],color[2]);
		    }
	  }
			
	/**
	 *  Draws the image to given canvas element.
	 *
	 *  @param canvas canvas element to draw the image to
	 */
			
    this.drawToCanvas = function(canvas)
	  { 
	    var context = canvas.getContext("2d");
		var id = context.createImageData(this.getWidth(),this.getHeight());
        var data  = id.data;                        
        
		var position = 0;
				
		for (var j = 0; j < this.getHeight(); j++)
		  for (var i = 0; i < this.getWidth(); i++)
		    {
		      var color = this.getPixel(i,j);
			  data[position]     = color[0];
              data[position + 1] = color[1];
              data[position + 2] = color[2];
              data[position + 3] = 255;      // alpha
		    
			  position += 4;
			}
			
		context.putImageData(id,0,0);
	  }
		
    /**
	 *  Inverts the image colors.
	 */
		
    this.invert = function()
	  {
		this.forEachPixel(function(x, y, r, g, b) {return [255 - r, 255 - g, 255 - b]});
	  }
		
	/**
	 *  Fills the whole image with given color.
	 *
	 *  @param red amount of red (0 - 255)
	 *  @param green amount of green (0 - 255)
	 *  @param blue amount of blue (0 - 255)
	 */
			
	this.fill = function(red, green, blue)
	  {
	    this.forEachPixel(
		  function(x,y,r,g,b)
		    {
		      return [red,green,blue];
		    }
	      );
	  }
		
	/**
	 *  Translates the image by given offset.
	 *
	 *  @param horizontal horizontal offset in pixels (can be negative)
	 *  @param vertical vertical offset in pixels (can be negative)
	 */
	 
    this.translate = function(horizontal, vertical)
	  {
	  }
	  
	/**
	 *  Creates a deep copy of the image.
	 *
	 *  @return new image that contains the same data as this image
	 */
	 
	this.copy = function()
	  {
	    var newImage = new Image(this.getWidth(),this.getHeight());	
	    var reference = this;
		
		copyFunction = function(x, y, r, g, b)
		  {
			return reference.getPixel(x,y);
		  };
		
		newImage.forEachPixel(copyFunction);
		
		return newImage;
	  }

	/**
	 *  Generates white noise into the image.
	 */
	 
	this.generateWhiteNoise = function()
	  {
	    this.forEachPixel
		  (
		    function (x, y, r, g, b)
			  {
				return [Math.floor(Math.random() * 256),Math.floor(Math.random() * 256),Math.floor(Math.random() * 256)];
			  }
		  );
	  }
	  
	/**
	 * Converts the image to grayscale.
	 */
	 
	this.toGrayscale = function()
	  {
	    this.forEachPixel
		  (
		    function (x, y, r, g, b)
			  {
				var value = Math.round(0.2126 * r) + Math.round(0.7152 * g) + Math.round(0.0722 * b);
				return [value,value,value];
			  }
		  );		
	  }
	  
	this.dft = function()
	  {  
	  }
	  
	this.idft = function()
	  {  
	  }
	  
	this.dct = function()
	  {	  
	  }
	  
	this.idct = function()
	  {
	  }
		
	// init the image:
			
	this.imageData = new Array(width);
		  
	for (var i = 0; i < width; i++)
	  {
	    this.imageData[i] = new Array(height);
			  
	    for (var j = 0; j < height; j++)
		  this.imageData[i][j] = new Array(3);  // rgb
	  }
			
	this.setBorderBehavior(this.BORDER_BEHAVIOR_WHITE);
	this.setOverflowBehavior(this.OVERFLOW_BEHAVIOR_SATURATE);
	this.fill(255,255,255);
  };