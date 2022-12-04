const mongoose = require('mongoose');

const postData =new mongoose.Schema({
    title:{type:String,require:true},
    textarea:{type:String,require:true},
    email:{type:String,require:true}
},{timestamps:true})


postData.methods.newPost= async function(title,textarea,email){
    try {
        this.posts=this.posts.concat({title,textarea,email});
        await this.save();
        return this.posts;

    } catch (error) {
        console.log(error);
    }

}


const Posts = mongoose.model('POSTS',postData);

module.exports = Posts;