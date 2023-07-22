const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port =process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware
app.use(cors());
app.use(express.json());


app.get('/', (req, res)=>{
    res.send("Running genius server")
});
app.listen(port, ()=>{
    console.log("Server running on", port)
})
// genius-car-user
// dSlZbUyDrl1nFOUt

const uri = `mongodb+srv://genius-car-user:dSlZbUyDrl1nFOUt@cluster0.jpegwwj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
 
    await client.connect();
    const serviceCollection = client.db('genius-car-23').collection('service') 
  
  //get all
  app.get('/service', async (req, res)=>{
    const query = {};
    const cursor = serviceCollection.find(query);
    const services = await cursor.toArray();
    res.send(services);
 
  })
  //get one
  app.get('/service/:id', async (req, res)=>{
    const id = req.params.id;
    const query ={_id: ObjectId};
    const service = await serviceCollection.findOne(query);
    res.send(service)
  })
  
  
   


    console.log(" connected to MongoDB!");
  } finally {

   
  }
}
run().catch(console.dir);
