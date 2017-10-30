var Baby = require('babyparse')
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var fs = require('fs');
var gm = require('gm').subClass({ imageMagick: true });

var AWS = require('aws-sdk');
AWS.config.loadFromPath('./awsconfig.json');

var myBucket = 'artlyowl-dev-artists';
var s3 = new AWS.S3({params:{Bucket:myBucket}});

CustomPKFactory = function() {}
CustomPKFactory.prototype = new Object();
CustomPKFactory.createPk = function() {
	console.log("CUSTOM_PK_FACTORY");
	return Date.now().toString();
}

var mongoUrl = 'mongodb://localhost:3501/meteor';
//var mongoUrl = 'mongodb://heroku_plqblm1j:rkptj63jetgh9sa2i2gi5sqo74@ds019976.mlab.com:19976/heroku_plqblm1j'

const emptyArtwork = {
	visible: false,
	featured: false,
	artistId: null,
	sold: false,
	artworkInformation: {
	  title: null,
	  series: null,
	  price: null,
	  framed: null,
	  heightUnframed: null,
	  widthUnframed: null,
	  depthUnframed: null,
	  weightUnframed: null,
	  heightFramed: null,
	  widthFramed: null,
	  depthFramed: null,
	  weightFramed: null,
	  medium: null,
	  typeOfWork: null,
	  editionOf: null,
	  remaining: null,
	  addition: null,
	  inspiration: null,
	  currentLocation: null,
	  otherLocation: {
		name: null,
		address: {},
	  },
	  exhibitionDate: null,
	},
	artworkImages: {
	  primaryImage: null,
	  scaleImage: null,
	  detailImage: null,
	  additionalImage1: null,
	  additionalImage2: null,
	},
	shippingOptions: {
	  pickupInStudio: {
		allow: true,
		price: 0,
	  },
	  shipping: {
		allow: false,
		boxRef: 0,
		boxDimWeight: 0,
	  },
	},
	artworkConfirmation: {
	  confirmed: null,
	  signature: null,
	},
	createdAt: new Date(),
};

var file = process.env.npm_config_file || "artwork.csv"
console.log(file)

var config = {
	header:true,
	skipEmptyLines:true,
	//dynamicTyping:true
};
parsed = Baby.parseFiles(file, config);

rows = parsed.data;
rows.forEach(function(row){
	var displayName = row.artistDisplayName;

	var newArtwork = (JSON.parse(JSON.stringify(emptyArtwork)));
	newArtwork.sold = row.sold.toLowerCase() === 'true';
	newArtwork.artworkInformation.title = row.title;
	newArtwork.artworkInformation.series = row.series;
	newArtwork.artworkInformation.price = Number(row.price);
	newArtwork.artworkInformation.framed = row.framed.toLowerCase() === 'true';
	newArtwork.artworkInformation.heightUnframed = Number(row.heightUnframed);
	newArtwork.artworkInformation.widthUnframed = Number(row.widthUnframed);
	newArtwork.artworkInformation.depthUnframed = Number(row.depthUnframed);
	newArtwork.artworkInformation.weightUnframed = Number(row.weightUnframed);
	newArtwork.artworkInformation.heightFramed = Number(row.heightFramed);
	newArtwork.artworkInformation.widthFramed = Number(row.widthFramed);
	newArtwork.artworkInformation.depthFramed = Number(row.depthFramed);
	newArtwork.artworkInformation.weightFramed = Number(row.weightFramed);
	newArtwork.artworkInformation.medium = row.medium;
	newArtwork.artworkInformation.typeOfWork = row.typeOfWork;
	newArtwork.artworkInformation.editionOf = Number(row.editionOf);
	newArtwork.artworkInformation.remaining = Number(row.remaining);
	newArtwork.artworkInformation.addition = row.addition;
	newArtwork.artworkInformation.inspiration = row.inspiration;
	newArtwork.artworkInformation.currentLocation = row.currentLocation;
	newArtwork.artworkInformation.otherLocation.name = row.locationName;
	newArtwork.artworkInformation.otherLocation.address.street = row.street;
	newArtwork.artworkInformation.otherLocation.address.city = row.city;
	newArtwork.artworkInformation.otherLocation.address.state = row.state;
	newArtwork.artworkInformation.otherLocation.address.zipCode = row.zipCode;
	newArtwork.artworkInformation.exhibitionDate = row.exhibitionDate;
	newArtwork.artworkImages.primaryImage = row.primaryImage;
	newArtwork.artworkImages.scaleImage = row.scaleImage;
	newArtwork.artworkImages.detailImage = row.detailImage;
	newArtwork.artworkImages.additionalImage1 = row.additionalImage1;
	newArtwork.artworkImages.additionalImage2 = row.additionalImage2;
	newArtwork.shippingOptions.pickupInStudio.allow = row.pickupInStudio,
	newArtwork.shippingOptions.pickupInStudio.price = row.pickupPrice,
	newArtwork.shippingOptions.shipping.allow = row.allowShipping,
	newArtwork.shippingOptions.shipping.boxRef = row.boxRef,
	newArtwork.shippingOptions.shipping.boxDimWeight = row.boxDimWeight,
	newArtwork.artworkConfirmation.confirmed = row.confirmed.toLowerCase() === "true";
	newArtwork.artworkConfirmation.signature = row.signature;
	newArtwork.createdAt = new Date();
	//Orientation
	if(newArtwork.artworkInformation.heightUnframed > newArtwork.artworkInformation.widthUnframed){
		newArtwork.orientation = 'vertical';
	}
	else if(newArtwork.artworkInformation.heightUnframed < newArtwork.artworkInformation.widthUnframed){
		newArtwork.orientation = 'horizontal';
	}
	else{
		newArtwork.orientation = 'square';
	}
	//Size
	let surface = newArtwork.artworkInformation.heightUnframed * newArtwork.artworkInformation.widthUnframed;
	if(surface <= 144){
		newArtwork.size = 'small';
	}
	else if(surface > 144 && surface < 400){
		newArtwork.size = 'medium';
	}
	else{
		newArtwork.size = 'big';
	}


	//console.log(newArtwork)
	if(isValid(newArtwork)){
		MongoClient.connect(mongoUrl, {pkFactory: CustomPKFactory}, function (err, db) {
		  if (err) {
		    console.log('Unable to connect to the mongoDB server. Error:', err);
		  } else {
		    //HURRAY!! We are connected. :)
		    console.log('Connection established to', mongoUrl);
		    var artists = db.collection('Artists');
		    var collection = db.collection('Artworks');
		    artists.findOne({'contactInformation.slug': displayName.replace(/\s+/g, '-').toLowerCase()}, function (err, document) {
		      if (err) {
		        console.log(err);
		        db.close();
		      } else if (!document) {
		        console.log(`[ERROR]: No document found for ${displayName}`);
		        db.close();
		      } else {
		      	var artistId = document._id;
		        newArtwork.artistId = artistId;
		        collection.insert(newArtwork, function (err, result) {
			      if (err) {
			        console.log(err);
			      } else {
			        console.log('Inserted document into the "Artworks" collection. The documents inserted with "_id" are:', result.insertedIds);
			        var itemId = result.insertedIds;
					uploadFile(newArtwork.artworkImages.primaryImage, itemId, 'primaryImage', newArtwork)
					.then((url) => {
						updateUrl(itemId,{'artworkImages.primaryImage':url});
					})			        	
					if(newArtwork.artworkImages.scaleImage != ''){
						uploadFile(newArtwork.artworkImages.scaleImage, itemId, 'scaleImage', newArtwork)
						.then((url) => {
							updateUrl(itemId,{'artworkImages.scaleImage':url});
						})	
					}
					if(newArtwork.artworkImages.detailImage != ''){
						uploadFile(newArtwork.artworkImages.detailImage, itemId, 'detailImage', newArtwork)
						.then((url) => {
							updateUrl(itemId,{'artworkImages.detailImage':url});
						})
					}
					uploadFile(newArtwork.artworkConfirmation.signature, itemId, 'signature', newArtwork)
					.then((url) => {
						updateUrl(itemId,{'artworkConfirmation.signature':url});
					})
			        if(newArtwork.artworkImages.additionalImage1 != ''){
			        	uploadFile(newArtwork.artworkImages.additionalImage1, itemId, 'additionalImage1', newArtwork)
						.then((url) => {
							updateUrl(itemId,{'artworkImages.additionalImage1':url});
						})
			        }
			        if(newArtwork.artworkImages.additionalImage2 != ''){
			        	uploadFile(newArtwork.artworkImages.additionalImage2, itemId, 'additionalImage2', newArtwork)
						.then((url) => {
							updateUrl(itemId,{'artworkImages.additionalImage2':url});
						})	
			        }

			      }
			      //Close connection
			      db.close();
			    });


		      }
		    });
		  }
		});
	}
})

function isValid(newArtwork){
	if(!newArtwork.artworkInformation.title){
		console.log("[ERROR] title mandatory");
		return false;
	}
	if(!newArtwork.artworkInformation.price){
		console.log("[ERROR] price mandatory");
		return false;
	}
	if(!newArtwork.artworkInformation.framed){
		console.log("[ERROR] framed mandatory");
		return false;
	}
	if(!newArtwork.artworkInformation.heightUnframed){
		console.log("[ERROR] heightUnframed mandatory");
		return false;
	}
	if(!newArtwork.artworkInformation.widthUnframed){
		console.log("[ERROR] widthUnframed mandatory");
		return false;
	}
	if(!newArtwork.artworkInformation.depthUnframed){
		console.log("[ERROR] depthUnframed mandatory");
		return false;
	}
	if(!newArtwork.artworkInformation.weightUnframed){
		console.log("[ERROR] weightUnframed mandatory");
		return false;
	}
	if(!newArtwork.artworkInformation.medium){
		console.log("[ERROR] medium mandatory");
		return false;
	}
	if(!newArtwork.artworkInformation.typeOfWork){
		console.log("[ERROR] typeOfWork mandatory");
		return false;
	}
	if(newArtwork.artworkInformation.typeOfWork != 'original' && newArtwork.artworkInformation.typeOfWork != 'originalArtPrint') {
		console.log("[ERROR] typeOfWork has to be original or originalArtPrint");
		return false;
	}
	if(!newArtwork.artworkInformation.inspiration){
		console.log("[ERROR] inspiration mandatory");
		return false;
	}
	if(!newArtwork.artworkInformation.currentLocation){
		console.log("[ERROR] currentLocation mandatory");
		return false;
	}
	if(newArtwork.artworkInformation.currentLocation != 'inStudio' && newArtwork.artworkInformation.currentLocation != 'other') {
		console.log("[ERROR] currentLocation has to be inStudio or other");
		return false;
	}
	if(!newArtwork.artworkInformation.exhibitionDate){
		console.log("[ERROR] exhibitionDate mandatory");
		return false;
	}
	if(!newArtwork.artworkImages.primaryImage){
		console.log("[ERROR] primaryImage mandatory");
		return false;
	}
	if(!newArtwork.artworkConfirmation.confirmed){
		console.log("[ERROR] confirmed mandatory");
		return false;
	}
	if(!newArtwork.artworkConfirmation.signature){
		console.log("[ERROR] signature mandatory");
		return false;
	}
	if(newArtwork.artworkImages.primaryImage){
		if(!fs.existsSync(newArtwork.artworkImages.primaryImage)){
			console.log("[ERROR] cannot find primaryImage image");
			return false;
		}
	}
	if(newArtwork.artworkImages.scaleImage){
		if(!fs.existsSync(newArtwork.artworkImages.scaleImage)){
			console.log("[ERROR] cannot find scaleImage image");
			return false;
		}
	}
	if(newArtwork.artworkImages.detailImage){
		if(!fs.existsSync(newArtwork.artworkImages.detailImage)){
			console.log("[ERROR] cannot find detailImage image");
			return false;
		}
	}
	if(newArtwork.artworkImages.additionalImage1){
		if(!fs.existsSync(newArtwork.artworkImages.additionalImage1)){
			console.log("[ERROR] cannot find additionalImage1 image");
			return false;
		}
	}
	if(newArtwork.artworkImages.additionalImage2){
		if(!fs.existsSync(newArtwork.artworkImages.additionalImage2)){
			console.log("[ERROR] cannot find additionalImage2 image");
			return false;
		}
	}
	if(newArtwork.artworkConfirmation.signature){
		if(!fs.existsSync(newArtwork.artworkConfirmation.signature)){
			console.log("[ERROR] cannot find signature image");
			return false;
		}
	}
	
	return true;

}

updateUrl = function(id,update){
	MongoClient.connect(mongoUrl, {pkFactory: CustomPKFactory}, function (err, db) {
		if (err) {
	    	console.log('Unable to connect to the mongoDB server. Error:', err);
		} else {
	  		var collection = db.collection('Artworks');
			collection.update({'_id': id.toString()}, {$set:update}, function(err, updated){
        		if (err) {
				    console.log(err);
				}
				else if(!updated){
					console.log('Not updated')
				}
				else if (updated) {
					console.log('Updated Successfully document.');
				} else {
				    console.log('No document found with defined "find" criteria!');
				}
				db.close()
			})
	  	}
	});
}

b64ToBlob = function(b64Data, contentType, sliceSize) {
	let byteNumbers, i, slice;
	let offset = 0;
	let byteCharacters = atob(b64Data);
	let byteArrays = [];
	sliceSize = sliceSize || 512;
	byteArrays = [];
	while (offset < byteCharacters.length) {
	  slice = byteCharacters.slice(offset, offset + sliceSize);
	  byteNumbers = [];
	  for (i = 0; i < slice.length; ++i) {
		byteNumbers.push(slice.charCodeAt(i));
	  }
	  byteArrays.push(new Uint8Array(byteNumbers));
	  offset += sliceSize;
	}
	return new Blob(byteArrays, {type: contentType});
  }

  function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

uploadFileToAmazon = function(file, id, sufix, newArtwork) {
    return new Promise((resolve, reject) => {
		
      console.log('weee')
	  
	  var params = {
		Key: `${newArtwork.artistId}/artwork/${id}/${newArtwork.artworkInformation.title.replace(/\s+/g, '-').toLowerCase()}-${sufix}`,
		Body: file,
		ACL: 'public-read',
		ContentType: 'image/jpeg'
		}

		s3.upload(params, function (err, data) {            
			if (err) {
				console.log('ERROR MSG: ', err);
			} else {
				console.log('Successfully uploaded data');
				console.log(data.Location)
				var url = data.Location;
				resolve(url)
			}
		});
    });
  }

uploadFile = function(file, id, imageType, newArtwork) {
    return new Promise((resolve, reject) => {
      const title = newArtwork.artworkInformation.title;
      const artistId = newArtwork.artistId;

	  //var base64str = base64_encode(file);
		uploadArtworkImage(file, id, title, imageType, artistId)
		.then((response) => {
			uploadFileToAmazon(response.w, id, imageType, newArtwork)
			.then(function(url){
				console.log(url);
				resolve(url);
			});
			uploadFileToAmazon(response.t, id, imageType + '-thumb', newArtwork);
		})      
    });
  }

/*
RECEIVES IMAGE PATH
RESOLVES WITH BASE64 IMAGE
*/
applyWatermark = function(file){
	return new Promise((resolve, reject) => {
	  const watermark = 'logo-watermark.png';
	  gm(file)
		.resize(600, 600)
		.draw([`image Over 0,0 0,0 "${watermark}"`])
		.toBuffer('PNG',function (err, buffer) {
			if (err) return handle(err);
			resolve(buffer)
		})
	});
  }
  
createThumbnail = function(imageString){
	return new Promise((resolve, reject) => {
	  gm(imageString)
	  .resize(150, 150)
	  .toBuffer('PNG',function (err, buffer) {
		if (err) return handle(err);
		resolve(buffer)
	  })
	});
  }
  
uploadArtworkImage = function(file, id, title, imageType, artistId){
	  return new Promise((resolve, reject) => {
		applyWatermark(file)
		.then(function (watermarked){
		  createThumbnail(watermarked)
		  .then(function (thumb){
			resolve({ w: watermarked, t: thumb });
		  });
		})
		.catch(function (error){
		  console.log(error)
		});
	  });
};




