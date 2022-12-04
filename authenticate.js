
const jwt = require('jsonwebtoken');
const User = require('./userScema');
const Posts = require('./postData');

const authenticate = async(req,res,next) => {
  try{

    const token = req.cookies.jwtoken;
    const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
    const rootUser = await User.findOne({_id:verifyToken._id, "tokens:token":token});
    const rootPost = await Posts.find({email:rootUser.email});
    
    req.token = token;
    
    
   

    if (rootPost){
      console.log('User Post Found');
      req.rootPost=rootPost;
    }else{
      console.log('User Post Not Found');
    }


    if (rootUser){
      console.log('User Found');
      req.rootUser = rootUser;
      req.userID = rootUser._id;
    }else{
      console.log('User Not Found');
    }

    next();   

  }catch(err){
    console.log('No More Tokens');
    next();
  }
}

module.exports = authenticate;
