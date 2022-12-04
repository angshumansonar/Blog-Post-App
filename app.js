const mongoose = require('mongoose');
const dotenv = require("dotenv");
const express  = require('express');
const app = express();
const path = require('path');

const User = require('./userScema');

dotenv.config({path:'./config.env'});
require('./connect');

app.use(express.json());
app.use(require('./auth')); 

app.use(express.static(path.join(__dirname+"/public")))

const PORT = process.env.PORT

app.listen(PORT, ()=>{
    console.log(`Server Running on ${PORT}`);
})
