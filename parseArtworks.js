var Baby = require('babyparse')
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var fs = require('fs');

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

var mongoUrl = 'mongodb://localhost:3001/meteor';

let emptyArtwork = {
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
	  inspiration: null,
	  currentLocation: null,
	  otherLocation: {
	  	name: null,
	  	address:{}
	  },
	  exhibitionDate: null
  },
  artworkImages: {
    primaryImage: null,
	  scaleImage: null,
	  detailImage: null,
	  additionalImage1:null,
	  additionalImage2:null
  },
  artworkConfirmation: {
    confirmed: null,
	signature: null
  },
  createdAt: null
}

var config = {
	header:true,
	skipEmptyLines:true,
	//dynamicTyping:true
};
parsed = Baby.parseFiles("sample_artwork.csv", config);

rows = parsed.data;

rows.forEach(function(row){
	var firstName = row.artistFirstName;
	var lastName = row.artistLastName;

	var newArtwork = (JSON.parse(JSON.stringify(emptyArtwork)));
	newArtwork.sold = row.sold;
	newArtwork.artworkInformation.title = row.title;
	newArtwork.artworkInformation.series = row.series;
	newArtwork.artworkInformation.price = Number(row.price);
	newArtwork.artworkInformation.framed = row.framed.toLowerCase() === 'true';
	newArtwork.artworkInformation.heightUnframed = row.heightUnframed;
	newArtwork.artworkInformation.widthUnframed = row.widthUnframed;
	newArtwork.artworkInformation.depthUnframed = row.depthUnframed;
	newArtwork.artworkInformation.weightUnframed = row.weightUnframed;
	newArtwork.artworkInformation.heightFramed = row.heightFramed;
	newArtwork.artworkInformation.widthFramed = row.widthFramed;
	newArtwork.artworkInformation.depthFramed = row.depthFramed;
	newArtwork.artworkInformation.weightFramed = row.weightFramed;
	newArtwork.artworkInformation.medium = row.medium;
	newArtwork.artworkInformation.typeOfWork = row.typeOfWork;
	newArtwork.artworkInformation.editionOf = row.editionOf;
	newArtwork.artworkInformation.remaining = row.remaining;
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
	newArtwork.artworkConfirmation.confirmed = row.confirmed.toLowerCase() === "true";
	newArtwork.artworkConfirmation.signature = row.signature;
	newArtwork.createdAt = new Date();

	if(isValid(newArtwork)){
		MongoClient.connect(mongoUrl, {pkFactory: CustomPKFactory}, function (err, db) {
		  if (err) {
		    console.log('Unable to connect to the mongoDB server. Error:', err);
		  } else {
		    //HURRAY!! We are connected. :)
		    console.log('Connection established to', mongoUrl);
		    var artists = db.collection('Artists');
		    var collection = db.collection('Artworks');


		    collection.insert(newArtwork, function (err, result) {
		      if (err) {
		        console.log(err);
		      } else {
		        console.log('Inserted document into the "Artists" collection. The documents inserted with "_id" are:', result.insertedIds);
		        var itemId = result.insertedIds;
		        uploadImage(itemId+'/profile/'+newArtist.contactInformation.slug+'-profilePicture', newArtist.mediaInformation.profilePicture, 'image/jpeg', function(err, url){
		        	updateUrl(itemId,{'mediaInformation.profilePicture':url});
		        });
		        uploadImage(itemId+'/profile/'+newArtist.contactInformation.slug+'-bannerPicture', newArtist.mediaInformation.bannerPicture, 'image/jpeg', function(err, url){
		        	updateUrl(itemId,{'mediaInformation.bannerPicture':url});
		        });
		        if(newArtist.mediaInformation.otherMedia != '')
		        	uploadImage(itemId+'/profile/'+newArtist.contactInformation.slug+'-otherMedia', newArtist.mediaInformation.otherMedia, 'image/jpeg',  function(err, url){
		        		updateUrl(itemId,{'mediaInformation.otherMedia':url});
		        });
		        if(newArtist.additionalInformation.resume != '')
		        	uploadImage(itemId+'/cv/'+newArtist.contactInformation.slug+'-resume', newArtist.additionalInformation.resume, 'application/msword',  function(err, url){
		        		updateUrl(itemId,{'additionalInformation.resume':url});
		        });

		      }
		      //Close connection
		      db.close();
		    });
		  }
		});
	}
})

function isValid(newArtwork){
	if(!newArtwork.contactInformation.firstName){
		console.log("firstName mandatory");
		return false;
	}
	
	if(newArtwork.mediaInformation.profilePicture){
		if(!fs.existsSync(newArtwork.mediaInformation.profilePicture)){
			console.log("cannot find profilePicture image");
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
	  		var collection = db.collection('Artists');
	  		/*collection.find({'_id': id.toString()}).toArray(function (err, result) {
		      if (err) {
		        console.log(err);
		      } else if (result.length) {
		        console.log('Found:', result);
		      } else {
		        console.log('No document(s) found with defined "find" criteria!');
		      }
		      //Close connection
		      db.close();
		    });*/
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


uploadImage = function(key, file, contentType, callback){
	
	fs.readFile(file, function (err, data) {
		if (err) throw err;

		var params = {
			Key: key,
			Body: data,
			ACL: 'public-read',
			ContentType: contentType
		}

		s3.upload(params, function (err, data) {            
            if (err) {
                console.log('ERROR MSG: ', err);
            } else {
                console.log('Successfully uploaded data');
                console.log(data.Location)
                var url = data.Location;
                callback(null,url);
            }
        });


	})


}




