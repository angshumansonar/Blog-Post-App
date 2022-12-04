const express  = require('express');
const multer  = require('multer');
const multers3 = require('multer-s3');
const aws = require('aws-sdk');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');


require('./connect');

const authenticate = require('./authenticate');
const User = require('./userScema');
const Posts = require('./postData');
const Photos = require('./photoData');

router.use(cookieParser());
router.use(bodyParser.json({limit: "50mb"}));
router.use(express.urlencoded({limit: '50mb', extended:true, parameterLimit:50000}));

const s3 = new aws.S3 ({
    accessKeyId:process.env.S3_ACCESS_KEY,
    secretAccessKey:process.env.S3_PRIVATE_KEY,
    region:process.env.S3_SERVER
})

const fileFilter = (req, file, cb) => {
    console.log(file.mimetype);
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(null, false);
     }
  };

const upload = (bucket)=> multer({
    storage:multers3({
        s3:s3,
        bucket:bucket,
        key:function(req,file,cb){
            cb(null,Date.now().toString() + '-' + file.originalname);
        },
    }),
    fileFilter:fileFilter,
    limits: {fileSize: 1 * 1024 * 1024}
});

//ImageUpload...............

router.post('/uploadphoto', upload('twittex-user-photos').single('photo'), async (req,res) => {

    try {

    const photo = req.file.location;
    const email = req.body.email;
    
    
    const photoExist = await Photos.findOne({email:email});

    if(photoExist){ 
        await Photos.findOneAndUpdate({email:email},{
            photo:photo
        });
        console.log("User Photo Updated Done.........");
        console.log(req.file.size);
        console.log(req.file.mimetype);
        res.send(req.body);
    }else{
        const userphoto = new Photos({photo, email});
        const photoUpload= await userphoto.save();
        if(photoUpload){
            console.log("User Photo Upload Done!");
            console.log(req.file.size);
            console.log(req.file.mimetype);
            res.send(req.body);
        }
    }
    
} catch (error) {
    console.log(error);
}
    
    
})

//Image Get ...............

router.get('/getphoto/:email', async (req,res) => {

    const myphoto = await Photos.findOne({email:req.params.email});
    if(myphoto){
        console.log("User photo found.....",myphoto);
        console.log('User photo found.....');
        res.send(myphoto);
    }else{
        console.log("NO User photo found.....");
    }
    
    
})

//Image Delete ...............

router.get('/deletephoto/:email', async (req,res) => {

    const defaultpic ='';
    await Photos.findOneAndUpdate({email:req.params.email},{photo:defaultpic});
        console.log("User photo Deleted.....");
    
})

//Update User ..................

router.put('/userupdatedata', async (req,res) => {

    await User.findOneAndUpdate({email:req.body.email},{
            name: req.body.name,
            phone: req.body.phone
    });
    
    res.send(req.body);
    
    
    
})

//Register...............

router.post('/register', async (req,res) => {
        
        const { name, email, phone, password, cpassword } = req.body;
    
        if ( !name || !email || !phone || !password || !cpassword ){
            return res.json({ error : "Not valid"});
        }

    try{
        const userExist = await User.findOne({email:email});

        if(userExist){
            console.log("User Already Exist");
            return res.status(422).json({error:"User Already Exist"});
        }else if(password!=cpassword){
            console.log("Password not Matching");
            return res.status(422).json({error:"Password not Matching"});
        }else{
            const user = new User({name, email, phone, password, cpassword});
            const userRegister = await user.save();
            if(userRegister){
                console.log("User Registration Done!");
                res.status(201).json({message:"User Registration Done!"});
            }
        }     
    }catch(err){
        console.log(err);
    }
});

//Login................

router.post('/signin', async (req,res)=>{
    
    const {email,password}=req.body;

    if(!email || !password ){
        console.log('Not Valid Login');
        return res.status(400).json({error:'Not Valid Login'});
    }


    try{
        const userExist = await User.findOne({email:email})

        if(userExist){

          const isMatch  = await bcrypt.compare(password, userExist.password);
          
          if(isMatch){
            const token = await userExist.generateAuthToken();
            console.log(token);

            res.cookie("jwtoken",token,{
            expires:new Date(Date.now()+ 86606666),// 24 hours 
            httpOnly:true
          })

          res.send(req.body);
            
          }else{
            console.log('Login Failed !');
          }

        }

    }catch(err){
        console.log(err);
    }
})



//My Post Page ..........................


router.get('/mypost',authenticate, (req,res)=>{
   console.log('My Post Page ..........................');
   res.send(req.rootPost);
}) 

//All Post HOME page ..........................


router.get('/allpost', async(req,res)=>{
    const allposts = await Posts.find();
    if(allposts){
        console.log('All Post to HOME page successful ................');
        res.send(allposts);
    }else{
        console.log('All Post to HOME page failed ................');
    }
      
})

//Getting User Data ..........................

router.get('/userdata', authenticate, (req,res)=>{
    console.log('Getting User Data ..........................');
    res.send(req.rootUser);
})

//Getting All User Data ..........................

router.get('/alluser/:email', async(req,res)=>{
    const allUser = await User.findOne({email:req.params.email});
    console.log('Getting All User Data ..........................');
    res.send(allUser);
})

//New Post Page ..........................

router.post('/newpost', authenticate, async(req,res)=>{

    try {

        const {title,textarea,email}=req.body;

        if(!title || !textarea ){
        console.log('Error! Write the Post First');
        return res.status(400).json({error:'Null Text'});
        }

        const userPost = await User.findOne({email:email});

        if(userPost){
            const newPost= new Posts({title,textarea,email});
            await newPost.save();
            console.log('Post Successfully....!');
            res.send(req.body);
        }


    } catch (error) {
        console.log(error);
        console.log('Post Failed....!');
    }
    
})


//Update Post ......

router.put('/update', async(req,res)=>{
    try {

        await Posts.findByIdAndUpdate(req.body.id ,{
            title: req.body.title,
            textarea: req.body.textarea
        });
        console.log(`Update Successfull`);

        res.send(req.body);

    }catch (error) {
        console.log(`Updatation failed`);
        console.log(error);
    }
})

//Delete Post ......

router.delete('/delete/:id', async(req,res)=>{
    try {
        console.log(req.params.id);

        await Posts.findByIdAndDelete(req.params.id);
        console.log(`Deletion Successfull`);

    }catch (error) {
        console.log(`Deletion failed`);
        console.log(error);
    }
})


module.exports = router;