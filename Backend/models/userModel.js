const mongoose = require('mongoose');
const bcrypt = require('bcrypt');



const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  }, 
  username: {
    type: String,
    required: true,
    trim: true
  }, 
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false // Don't include password by default in queries
  },
  
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female','*'],
    lowercase: true
  },
  ProfilePic: {
    type: String,
    required: true
  }
  
}, { timestamps: true });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Check if the password is already hashed
    if (this.password.startsWith('$2b$')) {
      console.log(`Debug: Password already hashed for ${this.email}, skipping hashing`);
      return next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log(`Debug: Password hashed in pre-save hook for ${this.email}: ${this.password.substring(0, 10)}...`);
    next();
  } catch (error) {
    console.error(`Error hashing password for ${this.email}:`, error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log(`Debug: Comparing passwords for ${this.email}`);
    console.log(`Debug: Candidate password length: ${candidatePassword.length}`);
    console.log(`Debug: Stored hash: ${this.password.substring(0, 10)}...`);
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log(`Debug: Password comparison result: ${isMatch}`);
    return isMatch;
  } catch (error) {
    console.error(`Error comparing passwords for ${this.email}:`, error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);
module.exports = User;

