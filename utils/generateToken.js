const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET;

const generateTokenAndSetCookie = (userId, res) => {

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
    res.cookie('token', token, {
        httpOnly: true,
        secure: true, // Use secure in production
        sameSite: 'None', // Allows cross-site cookie
        maxAge: 2592000 
    });

    // console.log("Generated token----->", token)
    return token;

};

module.exports = generateTokenAndSetCookie;