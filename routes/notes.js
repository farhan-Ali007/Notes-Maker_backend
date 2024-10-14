const express = require('express')
const router = express.Router();

const { createNote,
    getAllNotes,
    getSingleNote,
    updateNote,
    deleteNote,
    searchNotes,
    addToFavorite,
    removeFromFavorite,
    getAllFavorites,
} = require('../controllers/notes.js');
const { isAuthorized } = require('../middleware/auth.js')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })



router.post('/create', isAuthorized, upload.array('images', 20), createNote);

router.get('/getallfavorites', isAuthorized, getAllFavorites);

router.get('/search', isAuthorized, searchNotes);

router.get('/getall', isAuthorized, getAllNotes);

router.get('/:id', isAuthorized, getSingleNote);

router.put('/:id', isAuthorized, upload.array("images"), updateNote);

router.delete('/:id', isAuthorized, deleteNote);

router.put('/:id/favorite', isAuthorized, addToFavorite);

router.put('/:id/unfavorite', isAuthorized, removeFromFavorite);





module.exports = router;