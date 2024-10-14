const express = require('express')

const router = express.Router();
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

const { signup,
    login,
    logout,
    currentUser,
    forgotPassword,
    resetPassword,
    updateProfile,
    deleteUser,
    getResetemail } = require('../controllers/user.js')
const { isAuthorized } = require('../middleware/auth.js')


router.post('/signup', upload.single('image'), signup)

router.post('/login', login)

router.get('/logout', logout)

router.get('/current', isAuthorized, currentUser)

router.post('/updateprofile', isAuthorized, upload.single('image'), updateProfile)

router.post('/forgotpassword', forgotPassword)

router.get('/reset-email/:token', getResetemail)

router.put('/resetpassword/:token', resetPassword)

router.delete('/delete/:id', isAuthorized, deleteUser)


module.exports = router;