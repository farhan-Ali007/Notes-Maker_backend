const bcrypt = require('bcrypt');
const crypto = require('crypto')
const User = require('../models/user.js')
const { ErrorHandler } = require('../middleware/error.js')
const generateTokenAndSetCookie = require('../utils/generateToken.js');
const sendEmail = require('../utils/sendEmail.js')
const uploadImage = require('../config/cloudinaryConfig.js');
const user = require('../models/user.js');


const signup = async (req, res, next) => {

    try {
        const { username, email, password } = req.body;
        // console.log("Coming data ------>", req.body);

        const file = req.file;
        // console.log("Image =====>", req.file)
        let imageUrls = [];


        if (file.size > 10 * 1024 * 1024) {
            return next(new ErrorHandler("File size must be less than 10 MB", 400));
        }

        if (file) {
            imageUrls = await uploadImage([file]);
            // console.log("Image URLs:", imageUrls);
        }

        if (!username || !email || !password)
            return next(new ErrorHandler("Please fill all the feilds", 400))

        if (password.length < 6)
            return next(new ErrorHandler("Password must be atleast 6 characters."))

        const validUsername = (username) => {
            return username.includes('@');
        };

        if (!validUsername(username))
            return next(new ErrorHandler("Username must contain an @."))

        if (validUsername(username).length < 4)
            return next(new ErrorHandler("Username must contain atleast 4 characters ", 400))

        const validEmail = (email) => {
            const emailRegex = /^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email);
        };
        if (!validEmail(email))
            return next(new ErrorHandler("Invalid email.", 400))

        const emailAlreadyExist = await User.findOne({ email: email })
        const usernameAlreadyExist = await User.findOne({ username: username })

        if (emailAlreadyExist)
            return next(new ErrorHandler("Email already exists.", 400))

        if (usernameAlreadyExist)
            return next(new ErrorHandler("Username already taken.", 400))


        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        const user = await User.create({ username, email, password: hashedPassword, image: imageUrls })

        const token = generateTokenAndSetCookie(user._id, res); // Store token after setting cookie

        // console.log("Created user:", user);

        res.status(200).json({
            success: true,
            token,
            user: {
                ...user._doc,
                password: "",
            },
            message: "User created successfully!"
        })
    } catch (error) {
        console.log("Error in signup", error)
        res.status(500).json({
            success: false,
            message: "Internal server error."
        })
    }


}

const login = async (req, res, next) => {

    try {

        const { email, password } = req.body

        if (!email || !password)
            return next(new ErrorHandler("All fields are required."))

        const user = await User.findOne({ email: email }).exec()

        if (!user)
            return next(new ErrorHandler("No user found", 404))

        const isCorrectPassword = await bcrypt.compare(password, user.password)

        if (!isCorrectPassword)
            return next(new ErrorHandler("Incorrect password", 400))
        const token = generateTokenAndSetCookie(user._id, res);

        return res.status(200).json({
            success: true,
            user: {
                ...user._doc,
                password: "",
            },
            token,
            message: "User logged in  successfully!"
        })

    } catch (error) {
        console.log("Error in login", error)
        res.status(500).json({
            success: false,
            message: "Internal server error."
        })
    }

}

const logout = (req, res) => {

    try {

        res.clearCookie("token");
        res.status(200).json({
            success: true,
            user: {
                ...user._doc,
                password: "",
            },
            message: "User logged out successfully."
        })

    } catch (error) {
        console.log("Error in logout ", error)
        res.status(500).json({
            success: false,
            message: "Internal server error."
        })
    }

}

const currentUser = (req, res, next) => {
    try {
        const user = req.user;

        if (!user)
            return next(new ErrorHandler("No user found.", 404))
        console.log("Current User----->", user._id)
        res.json({
            success: true,
            user: {
                ...user._doc,
                password: ""
            },
            message: "User fetched successfully."
        })
    } catch (error) {
        console.log("Error in getting user", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return next(new ErrorHandler('Please provide an email address', 400));
        }

        const user = await User.findOne({ email });

        if (!user) {
            return next(new ErrorHandler('User with this email does not exist', 404));
        }

        // Generate the reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash and set resetPasswordToken and resetPasswordExpire in the user model
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes

        await user.save();

        // Reset URL
        const frontendUrl = 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
        console.log(`Reset URL----->  ${resetUrl}`);

        // Send the email
        const message = `You have requested a password reset. Please click the following link to reset your password: ${resetUrl}`;

        await sendEmail({
            email: user.email,
            subject: 'Password Reset',
            message
        });
        res.status(200).json({
            success: true,
            message: `Password reset link  sent to ${email}`,
            token: resetToken
        });

    } catch (error) {
        console.log("Error in sending email----->", error)
        return next(new ErrorHandler('Error in sending email', 500));
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        // Find the user based on the reset token and ensure it's not expired
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }  // Check if the token is not expired
        });

        if (!user) {
            return next(new ErrorHandler('Invalid or expired password reset token', 400));
        }

        // Ensure password is provided and valid
        const { password } = req.body;
        if (!password || password.length < 6) {
            return next(new ErrorHandler('Please provide a valid password with at least 6 characters', 400));
        }

        // Hash the new password and save it to the user document
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // console.log("User.password---->" ,user.password )

        // Clear the reset token and expiration
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password has been updated successfully'
        });


    } catch (error) {
        return next(new ErrorHandler('Error resetting password', 500));
    }
};

const getResetemail = async (req, res, next) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        // Find the user based on the reset token and ensure it's not expired
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() } // Check if the token is not expired
        });

        if (!user) {
            return next(new ErrorHandler('Invalid or expired password reset token', 400));
        }

        res.status(200).json({
            success: true,
            email: user.email
        });
    } catch (error) {
        return next(new ErrorHandler('Error fetching email', 500));
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { username } = req.body;
        // console.log("Coming Name---->", req.body);
        const file = req.file;
        // console.log("Coming image---->", req.file)
        const userId = req.user._id;
        // console.log("User----->", req.user)

        let imageUrls = [];

        if (username) {
            if (username.length < 4)
                return next(new ErrorHandler("Username must be at least 4 characters", 400));

            const validUsername = (username) => username.includes('@');

            if (!validUsername(username)) {
                return next(new ErrorHandler("Username must contain an @.", 400));
            }

            const usernameAlreadyExists = await User.findOne({ username });
            if (usernameAlreadyExists && usernameAlreadyExists._id.toString() !== userId.toString()) {
                return next(new ErrorHandler("Username already exists.", 401));
            }
        }

        // Image upload logic (only if a file is provided)
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                return next(new ErrorHandler("File size must be less than 10mb", 400));
            }
            imageUrls = await uploadImage([file]);
        }
        const updateData = {};
        if (username) updateData.username = username;
        if (imageUrls.length > 0) updateData.image = imageUrls;

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
        });

        if (!updatedUser) return next(new ErrorHandler("No user found", 404));
        // console.log("Updated User---->", updatedUser)

        res.status(200).json({
            success: true,
            user: { ...updatedUser._doc, password: "" }, // Exclude password
            message: "Profile updated successfully.",
        });
    } catch (error) {
        console.log("Error in updating profile", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        console.log("User id being deleting------>", userId)

        const user = await User.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }


        await User.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            message: "User deleted successfully."
        });
    } catch (error) {
        console.log("Error in deleting user", error);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};




module.exports = { signup, login, logout, currentUser, forgotPassword, resetPassword, updateProfile, deleteUser, getResetemail }