const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port =process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');


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
    const serviceCollection = client.db('genius-car-23').collection('service'); 
    const orderCollection = client.db('genius-car-23').collection('order');
  //get all
  app.get('/service', async (req, res)=>{
    const query = {};
    const cursor = serviceCollection.find(query);
    const services = await cursor.toArray();
    res.send(services);
     
  }) 
  // get one
  app.get('/service/:id([0-9a-fA-F]{24})', async (req, res)=>{
    
    const id = req.params.id; 
    
    const query =  {_id: new ObjectId(id)};
    // console.log(id)
    const service = await serviceCollection.findOne(query);
    res.send(service)
    // console.log(service)
  }) 
//post  
  app.post('/service', async(req, res)=>{
  const newService = req.body;
  const result = await serviceCollection.insertOne(newService);
  res.send(result);
  })
  //delete
  app.delete('/service/:id', async(req, res)=>{
    const id =req.params.id;
    const query ={_id: ObjectId};
    const result = await serviceCollection.deleteOne(query);
    res.send(result);
  })
   //post for orderCollection

  app.post('/order', async(req, res) =>{
    const order = req.body;
    const result = await orderCollection.insertOne(order);
    res.send(result)
  });
  

  //get for orderCollection API
  app.get('/orders', async(req, res)=>{
    const email = req.query.email;
    const query ={email};
    const cursor = orderCollection.find(query);
    const orders = await cursor.toArray();
    res.send(orders)
  })












    console.log(" connected to MongoDB!");
  } finally {

   
  }
}
run().catch(console.dir);
