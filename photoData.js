const mongoose = require('mongoose');

const photoData =new mongoose.Schema({
    photo:{type:String,require:true},
    email:{type:String,require:true}
})


photoData.methods.newPhoto= async function(photo,email){
    try {
        this.posts=this.posts.concat({photo,email});
        await this.save();
        return this.posts;

    } catch (error) {
        console.log(error);
    }

}


const Photos = mongoose.model('PHOTOS',photoData);

module.exports = Photos;