const express = require('express');
const cors = require('cors');
const SSLCommerzPayment = require('sslcommerz-lts') 
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
// const uri = "mongodb://127.0.0.1:27017"
const uri =  `mongodb+srv://genius-car-user:dSlZbUyDrl1nFOUt@cluster0.jpegwwj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const store_id = process.env.store_id;
const store_passwd = process.env.store_passwd;
const is_live = false //true for live, false for sandbox

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
  //update service/product
  app.put('/service/:id',   async(req, res)=>{
    const id = req.params.id;
    const updatedService = req.body;
    const filter = {_id: new ObjectId(id)};
    const options ={upsert: true};
    const updatedDoc = {
      $set: {
       name: updatedService.name,      
      description: updatedService.description,
      price: updatedService.price,
      img: updatedService.img,
   

      }

    };
    const result = await serviceCollection.updateOne(filter, updatedDoc, options);
    res.send(result)

    console.log(result)

  })
  //delete
  app.delete('/service/:id', async(req, res)=>{
    const id =req.params.id;
    const query ={_id: new ObjectId(id)};
    const result = await serviceCollection.deleteOne(query);
    res.send(result);
  })
   //post for orderCollection and ssl e-commerce

//---------------------------------------------------------
//    Store ID: 
//    Store Password (API/Secret Key): 
//----------------------------------------------------------
const trans_id = new ObjectId().toString();

  app.post('/order', async(req, res) =>{
    const order = req.body;
    // const result = await orderCollection.insertOne(order);
    // res.send(result)
    const product = await serviceCollection.findOne({_id: new ObjectId(req.body.serviceId)})
 
    const data = {
        total_amount: product?.price,
        currency: 'BDT',
        tran_id: trans_id, // use unique tran_id for each api call
        success_url: `http://localhost:5000/payment/success/${trans_id}`,
        fail_url: `http://localhost:5000/payment/fail/${trans_id}`,
        cancel_url: 'http://localhost:3030/cancel',
        ipn_url: 'http://localhost:3030/ipn',
        shipping_method: 'Courier',
        product_name: order.service,
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: 'Customer Name',
        cus_email: order.email,
        cus_add1: order.address,
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: order.phone,
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
    };
    console.log(data)
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
    sslcz.init(data).then(apiResponse => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL
        res.send({url: GatewayPageURL});

        const finalOrder = {
          product,
          paidStatus: false,
          transactionId: trans_id,
        };
        const result =  orderCollection.insertOne(finalOrder);

        console.log('Redirecting to: ', GatewayPageURL)
    
        
    });
  
  app.post('/payment/success/:tranId', async (req, res)=>{
    console.log(req.params.tranId);
    const result = await orderCollection.updateOne(
      {transactionId: req.params.tranId},
      {
        $set:{
          paidStatus: true,
        }
      }
    );
    if(result.modifiedCount > 0){
      res.redirect(`http://localhost:3000/payment/success/${req.params.tranId}`)
    }

  });

app.post('payment/fail/:tranId', async(req, res)=>{
  const result = await orderCollection.deleteOne({transactionId: req.params.tranId})
  if(result.deletedCount){
    res.redirect(`http://localhost:3000/payment/fail/${req.params.tranId}`)
  }

})

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
