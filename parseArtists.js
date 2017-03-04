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

let emptyArtist = {
	visible: false,
	contactInformation:{
		firstName: null,
		lastName: null,
		email: null,
		address: {},
		phoneNumber: null,
		studioName: null,
		webUrl: null
	},
	profileInformation:{
		descriptiveNoun1: null,
		descriptiveNoun2: null,
		descriptiveNoun3: null,
		personalDescription: null,
		preferredActivity1: null,
		preferredActivity2: null,
		preferredActivity3: null,
		freeTime: null,
		customForm: null,
		customDescription: null
	},
	additionalInformation:{
		education: null,
		recentWork: null,
		recentAwards: null,
		resume: null
	},
	mediaInformation:{
		profilePicture: null,
		bannerPicture: null,
		otherMedia: null,
		youtubeLink: null
	},
	createdAt: null,

}

var config = {
	header:true,
	skipEmptyLines:true,
	//dynamicTyping:true
};
parsed = Baby.parseFiles("sample_artist2.csv", config);

rows = parsed.data;

rows.forEach(function(row){

	var newArtist = (JSON.parse(JSON.stringify(emptyArtist)));
	newArtist.contactInformation.firstName = row.firstName;
	newArtist.contactInformation.lastName = row.lastName;
	newArtist.contactInformation.email = row.email;
	newArtist.contactInformation.address.street = row.street;
	newArtist.contactInformation.address.city = row.city;
	newArtist.contactInformation.address.state = row.state;
	newArtist.contactInformation.address.zipCode = row.zipCode;
	newArtist.contactInformation.phoneNumber = row.phoneNumber;
	newArtist.contactInformation.studioName = row.studioName;
	newArtist.contactInformation.webUrl = row.webUrl;
	newArtist.contactInformation.slug = row.firstName.replace(/\s+/g, '-').toLowerCase()+'-'+row.lastName.replace(/\s+/g, '-').toLowerCase();
	newArtist.profileInformation.descriptiveNoun1 = row.descriptiveNoun1;
	newArtist.profileInformation.descriptiveNoun2 = row.descriptiveNoun2;
	newArtist.profileInformation.descriptiveNoun3 = row.descriptiveNoun3;
	newArtist.profileInformation.customDescription = row.customDescription;
	newArtist.profileInformation.missingSomething = row.missingSomething;
	newArtist.profileInformation.artistBio = row.customDescription+'\n\n'+row.missingSomething;
	newArtist.additionalInformation.education = [row.education];
	newArtist.additionalInformation.recentWork = [row.recentWork];
	newArtist.additionalInformation.recentAwards = [row.recentAwards];
	newArtist.additionalInformation.resume = row.resume;
	newArtist.mediaInformation.profilePicture = row.profilePicture;
	newArtist.mediaInformation.bannerPicture = row.bannerPicture;
	newArtist.mediaInformation.otherMedia = row.otherMedia;
	newArtist.mediaInformation.youtubeLink = row.youtubeLink;
	newArtist.createdAt = new Date();

	if(isValid(newArtist)){
		MongoClient.connect(mongoUrl, {pkFactory: CustomPKFactory}, function (err, db) {
		  if (err) {
		    console.log('Unable to connect to the mongoDB server. Error:', err);
		  } else {
		    //HURRAY!! We are connected. :)
		    console.log('Connection established to', mongoUrl);

		    var collection = db.collection('Artists');


		    collection.insert(newArtist, function (err, result) {
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

function isValid(newArtist){
	if(!newArtist.contactInformation.firstName){
		console.log("firstName mandatory");
		return false;
	}
	if(!newArtist.contactInformation.lastName){
		console.log("lastName mandatory");
		return false;
	}
	if(!newArtist.contactInformation.email){
		console.log("email mandatory");
		return false;
	}
	if(!newArtist.contactInformation.address.street){
		console.log("street mandatory");
		return false;
	}
	if(!newArtist.contactInformation.address.city){
		console.log("city mandatory");
		return false;
	}
	if(!newArtist.contactInformation.address.state){
		console.log("state mandatory");
		return false;
	}
	if(!newArtist.contactInformation.address.zipCode){
		console.log("zipCode mandatory");
		return false;
	}
	if(!newArtist.contactInformation.phoneNumber){
		console.log("firstName mandatory");
		return false;
	}
	if(!newArtist.profileInformation.customDescription){
		console.log("customDescription mandatory");
		return false;
	}
	if(!newArtist.mediaInformation.profilePicture){
		console.log("profilePicture mandatory");
		return false;
	}
	if(!newArtist.mediaInformation.bannerPicture){
		console.log("bannerPicture mandatory");
		return false;
	}
	if(newArtist.mediaInformation.profilePicture){
		if(!fs.existsSync(newArtist.mediaInformation.profilePicture)){
			console.log("cannot find profilePicture image");
			return false;
		}
	}
	if(newArtist.mediaInformation.bannerPicture){
		if(!fs.existsSync(newArtist.mediaInformation.bannerPicture)){
			console.log("cannot find bannerPicture image");
			return false;
		}
	}
	if(newArtist.mediaInformation.otherMedia){
		if(!fs.existsSync(newArtist.mediaInformation.otherMedia)){
			console.log("cannot find otherMedia image");
			return false;
		}
	}
	if(newArtist.additionalInformation.resume){
		if(!fs.existsSync(newArtist.additionalInformation.resume)){
			console.log("cannot find resume file");
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




