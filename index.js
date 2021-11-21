const express = require("express");
const cors = require("cors");
const server = express();
const PORT = process.env.PORT || 8080;
const atlasURL = process.env.DATABASE

server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(express.static(__dirname + "/public"));

const MongoClient = require("mongodb").MongoClient;
ObjectId = require("mongodb").ObjectId;

const dbName = "twitter";
let db;

server.listen(PORT, () => console.log(`server listening on PORT: ${PORT}`));

server.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/home/index.html");
});

server.get("/allScripts", (req, res) => {
  res.sendFile(__dirname + "/SeleniumScripts.side");
});

server.get("/twitterScripts", (req, res) => {
  res.sendFile(__dirname + "/twitter.side");
});

server.get("/tinderScript", (req, res) => {
  res.sendFile(__dirname + "/tinder.side");
});

server.get("/:tag", (req, res) => {
  res.sendFile(__dirname + `/public/home/${req.params.tag}.html`);
});


MongoClient.connect(atlasURL, { useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);

    console.log(`Connected MongoDB: ${atlasURL}`);
    console.log(`Database: ${dbName}`);

    const quotesCollection = db.collection("quotes");

    const twitterCollection = db.collection("TwitterUsers");

    const userCollection = db.collection("userInfo");

    server.post("/add", async (req, res) => {
        // params: url - string url of the user
        // params: name - string of user name
        // params: img - string img url of the user
        // params: followers - string of user followers
        // params: active - string Date.now() of the time of tweet 
        // params: human - string of whether user is human
        // params: tag - string of user tag
        // params: following - Array of clients following the user
        // return: result -update user and update the specific collection if user is human
      let urlFound = await twitterCollection
        .find({ url: req.body.url })
        .count();
      if (urlFound === 0) {
        if (req.body.followers.length > 1) {
          twitterCollection
            .findOneAndReplace(
              { url: req.body.url },
              {
                url: req.body.url,
                name: req.body.name,
                img: req.body.img,
                followers: req.body.followers,
                active: Date.now(),
                human: "true",
                tag: req.body.tag,
                following: [],
              },
              { upsert: true }
            )
            .then((result) => {
              res.status(200).json({ status: "success" });
            })
            .catch((error) => {
              console.error(error);
              res.send(error);
            });
        } else {
          res.status(200).json({ status: "Not Enough Followers" });
        }
      } else {
        twitterCollection
          .findOneAndUpdate(
            { url: req.body.url },
            {
              $set: {
                followers: req.body.followers,
                active: Date.now(),
              },
            }
          )
          .then((result) => {
            res.status(200).json({ status: "updated the followers" });
          })
          .catch((error) => {
            console.error(error);
            res.send(error);
          });
      }
    });

    server.post("/remove", async (req, res) => {
        // params: url - string url of the user
        // params: human - string of whether user is human
        // return: result -update user and update the specific collection if user is human
        console.log(req.body.url);
        console.log(req.body.human);
      twitterCollection
        .findOneAndUpdate({ url: req.body.url }, 
            {
              $set: {
                human: req.body.human,
              },
            })
        .then((result) => {
          console.log("updated bot");
        })
        .catch((error) => {
          console.error(error);
          res.send(error);
        });
        
        
        
        if(req.body.followerError==="true"){
            let doc = await twitterCollection.findOne({ url: req.body.url })
            console.table(Object.entries(doc))
            twitterCollection.findOneAndDelete({ url: doc.url })
        .then((result) => {
                console.log(200,`Deleted from ${doc.tag} Collection - Too Many/Not Enough Followers`)
        })
        .catch((error) => {
          console.error(error);
          res.send(error);
        });
        } else if(req.body.human==="true"){
            let doc = await twitterCollection.findOne({ url: req.body.url })
            console.table(Object.entries(doc))
            twitterCollection.findOneAndDelete({ url: doc.url })
            db.collection(`${doc.tag}`).findOneAndReplace(
              { url: doc.url },
              doc,
              { upsert: true }
            )
        .then((result) => {
                console.log(200,`Added to ${doc.tag} Collection`)
        })
        .catch((error) => {
          console.error(error);
          res.send(error);
        });
        }
        
        res.status(200).json({})
    });
    
    
 
    server.get("/info/:tag", (req, res) => {
        // params: tag - Keyword or genre we are querying for
        // return: result - 10 sorted by active Documents that have human===true
      twitterCollection.find({tag:req.params.tag, human: "true"}).sort({active:-1}).limit(10)
        .toArray()
        .then(async (result) => {
          await res.send(result);
        });
    });
    
    

    server.get("/:user/:tag", (req, res) => {
        // params: tag - Keyword or genre we are querying for
        // params: user - Keyword or genre we are querying for
        // return: result - 1 sorted by active Documents that have human===true
        let clientName = req.params.user
        let tag = req.params.tag
        let col = db.collection(`${tag}`)
        col.find().sort({active:-1})
        .toArray()
        .then(async (result) => {
          let users= await result.filter(x=>!x.following.includes(clientName));
          if(users.length>0){
            let user = users[0];
          let following = user.following.concat(clientName)
          col.findOneAndUpdate({url:user.url}, 
            {
              $set: {
                following: following,
              },
            })
          res.send(user.url)
             }else{
              res.status(404).json({ status: `No Users availble for ${clientName} in ${tag} collection` });
          }
        });
    });
    
  })
  .catch((error) => console.error(error));
