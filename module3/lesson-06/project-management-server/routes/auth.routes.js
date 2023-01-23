const express = require("express");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
 
const router = express.Router();
const saltRounds = 10;
 
// POST  /auth/signup
router.post("/signup", (req, res) => {
    const {email, password, name } = req.body;

    if (email === '' || password === '' || name === '') {
        res.status(400).json({ message: "Provide email, password and name" });
        return;
      }
     
      // Use regex to validate the email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ message: 'Provide a valid email address.' });
        return;
      }
      
      // Use regex to validate the password format
      const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
      if (!passwordRegex.test(password)) {
        res.status(400).json({ message: 'Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.' });
        return;
      }

      User.findOne({ email })
        .then(async (foundUser) => {
        // If the user with the same email already exists, send an error response
        if (foundUser) {
            res.status(400).json({ message: "User already exists." });
            return;
        }

        const passwordHash = await bcrypt.hash(password, saltRounds)
        return User.create({email, password: passwordHash, name})
        })
        .then(createdUser => {
            const user = {_id: createdUser._id, email: createdUser.email, name: createdUser.name};
            return res.status(201).json({ user })
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ message: "Internal Server Error" })
          });
})
 
 
// POST  /auth/login
router.post("/login", (req, res) => {

    const {email, password } = req.body;

    if (email === '' || password === '') {
        res.status(400).json({ message: "Provide email and password." });
        return;
      }

    User.findOne({ email })
        .then((foundUser) => {
        
        if (!foundUser) {
            // If the user is not found, send an error response
            res.status(401).json({ message: "User not found." })
            return;
        }
    
        // Compare the provided password with the one saved in the database
        const passwordCorrect = bcrypt.compareSync(password, foundUser.password);
    
        if (passwordCorrect) {
           
            // Deconstruct the user object to omit the password
            const { _id, email, name } = foundUser;
            
            // Create an object that will be set as the token payload
            const payload = { _id, email, name };

            // Create and sign the token
            const authToken = jwt.sign( 
            payload,
            process.env.TOKEN_SECRET,
            { algorithm: 'HS256', expiresIn: "6h" }
            );

    
            // Send the token as the response
            res.status(200).json({ authToken: authToken });
        }
        else {
            res.status(401).json({ message: "Unable to authenticate the user" });
        }

        })
        .catch(err => res.status(500).json({ message: "Internal Server Error" }));
    
})
 
 
// GET  /auth/verify
// ...
 
module.exports = router;