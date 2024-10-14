const { ErrorHandler } = require('./error.js')
const jwt = require('jsonwebtoken')
const User = require('../models/user.js')

const isAuthorized = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        // console.log("Incoming Headers:", req.headers);
        // console.log("Incoming Cookies:", req.cookies);
        if (!token) {
            console.log('No token found');
            return next(new ErrorHandler('Unauthorized user', 401));
        }

        const decodeData = jwt.verify(token, process.env.JWT_SECRET);
        // console.log('Decoded Data---->', decodeData);

        req.user = await User.findById(decodeData.userId);
        // console.log("User ID being searched:", decodeData.userId);
        if (!req.user) {
            return next(new ErrorHandler('User not found', 404));
        }

        // console.log('User:', req.user);
        next();
    } catch (error) {
        console.error('Error in isAuthorized:', error);
        next(new ErrorHandler('Unauthorized user', 401));
    }
};


module.exports = { isAuthorized };