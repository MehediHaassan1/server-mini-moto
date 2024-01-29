const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config();


// middleware
app.use(cors())
app.use(express.json());


// custom middleware
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'Unauthorized Access' })
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(401).send({ error: true, message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    });

}



app.get('/', (req, res) => {
    res.send('Mini Moto server is running')
})

// ----------------- MongoDB  Starts----------------- //




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wc6pepm.mongodb.net/?retryWrites=true&w=majority`;

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
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // collections
        const allToysCollection = client.db('miniMotoDB').collection('allToysCollection');


        app.get('/all-toys', async (req, res) => {
            const result = await allToysCollection.find().toArray();
            res.send(result);
        });

        app.get('/all-toys/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await allToysCollection.findOne(filter);
            res.send(result);
        })

        app.get('/cars', async (req, res) => {
            const cars = req.query.car;
            const query = { type: cars }
            const result = await allToysCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/sports-car', async (req, res) => {
            const sportsCars = req.query.sportsCar;
            const first = sportsCars.split('_')[0]
            const second = sportsCars.split('_')[1]
            const carType = first + ' ' + second;
            const query = { type: carType }
            const result = await allToysCollection.find(query).toArray();
            res.send(result)
        })


        app.get('/bike', async (req, res) => {
            const bike = req.query.bike;
            const query = { type: bike }
            const result = await allToysCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/my-toys', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            console.log(decoded);
            const query = req.query.email;
            const filter = { sellerEmail: query }
            const result = await allToysCollection.find(filter).toArray();
            res.send(result)
        })


        app.post('/all-toys', async (req, res) => {
            const itemInfo = req.body;
            const result = await allToysCollection.insertOne(itemInfo);
            res.send(result);
        })


        app.patch('/my-toys/:id', async (req, res) => {
            const id = req.params.id;
            const updateInfo = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    price: updateInfo.price,
                    quantity: updateInfo.quantity,
                    description: updateInfo.description
                },
            };

            const result = await allToysCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.delete('/my-toys/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await allToysCollection.deleteOne(filter);
            res.send(result);
        })


        // jwt
        app.post('/web-access-token', (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
            res.send({ token });
        })


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



// ----------------- MongoDB  Ends ----------------- //

app.listen(port, () => {
    console.log(`Mini Moto app listening on port ${port}`)
})