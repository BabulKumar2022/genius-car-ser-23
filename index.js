const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const port =process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');


//middleware
app.use(cors());
app.use(express.json());


//verifyToken function
function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization;
  if(! authHeader){
    return res.status(401).send({message: "unauthorized access"})
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(403).send({message: 'Forbidden access'})
    }
    req.decoded = decoded;
    console.log('decoded', decoded)
    next()
  });
  // console.log("inside verifyJWT", authHeader);
 
}
 
 
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
  
  //get token
  app.post('/getToken', async(req, res)=>{
    const user = req.body;
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
      expiresIn: '1d'
    });
    res.send({accessToken})



  })
  
  
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
  app.get('/orders', verifyJWT,  async(req, res)=>{
   const decodedEmail = req.decoded.email;
    const email = req.query.email;
    if(email == decodedEmail){
      const query ={email};
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders)
    }else{
      res.status(403).send({message: 'Forbidden access'})
    }

  })












    console.log(" connected to MongoDB!");
    // console.log(process.env.ACCESS_TOKEN_SECRET)
  } finally {

   
  }
}
run().catch(console.dir);
