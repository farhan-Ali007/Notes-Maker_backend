const Note = require('../models/notes.js')
const { ErrorHandler } = require('../middleware/error.js');
const uploadImage = require('../config/cloudinaryConfig.js')
const cloudinary = require('cloudinary').v2


const createNote = async (req, res, next) => {
    try {
        const files = req.files;
        let imageUrls = [];
        // console.log("Comin images ----->", files)

        if (files && files.length > 0) {
            imageUrls = await uploadImage(files);
        }

        const { title, content, tag, } = req.body;
        // console.log("Coming Note Data---->", req.body)

        // Create new note with color field
        const note = new Note({
            ...req.body,
            author: req.user._id,
            images: imageUrls
        });

        await note.save();
        res.status(201).json({
            note,
            success: true,
            message: "Note saved successfully"
        });
    } catch (error) {
        console.log("Error in creating notes.", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const getAllNotes = async (req, res) => {

    try {

        const notes = await Note.find({}).populate('author', 'username').exec()
        res.status(200).json({
            success: true,
            notes,
            message: "Success"
        })
    } catch (error) {
        console.log("Error in getting all notes.", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }

}

const getSingleNote = async (req, res, next) => {
    try {

        const { id } = req.params;

        const note = await Note.findById(id).populate('author', 'username')

        if (!note)
            return next(new ErrorHandler("No note found", 404))

        res.status(200).json({
            success: true,
            note,
            message: "Success"
        })

    } catch (error) {
        console.log("Error in getting this note", error)
        res.status(500).json({
            success: false,
            message: "Internal server error."
        })
    }
}

const updateNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const files = req.files;
        // console.log("Coming  files-------->", files)
        let imageUrls = [];

        let note = await Note.findById(id);
        // console.log("Original Note------>", note?.title)
        if (!note) return next(new ErrorHandler("No note found", 404));

        if (note.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to update this note"
            });
        }

        if (files && files.length > 0) {
            imageUrls = await uploadImage(files);
        }

        // Handle image deletions if `req.body.deletedImages` contains deleted image IDs
        const deletedImages = req.body.deletedImages ? JSON.parse(req.body.deletedImages) : [];
        // console.log("Deleted images ----->", deletedImages)
        if (deletedImages.length > 0) {
            for (const imageId of deletedImages) {
                // Find the image in the note's `images` array and remove it
                const imageIndex = note.images.findIndex(img => img.public_id === imageId);
                if (imageIndex > -1) {
                    try {
                        // Delete from Cloudinary
                        await cloudinary.uploader.destroy(imageId);

                        // Remove image from the note's array
                        note.images.splice(imageIndex, 1);
                    } catch (err) {
                        console.error(`Error deleting image ${imageId}:`, err);
                    }
                }
            }
        }

        // Update the note with new content and new images (if any)
        const updatedData = {
            title: req.body.title,
            content: req.body.content,
            tag: req.body.tag,
            images: [...note.images, ...imageUrls],
        };


        // Update the note
        note = await Note.findByIdAndUpdate(
            id,
            updatedData,
            { new: true, runValidators: true, useFindAndModify: false }
        );

        // console.log("Updated note ------>", note)
        res.status(200).json({
            success: true,
            note,
            message: "Note updated successfully."
        });

    } catch (error) {
        console.error("Error in updating note:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

const deleteNote = async (req, res, next) => {
    try {
        const { id } = req.params;

        const note = await Note.findById(id)

        if (!note)
            return next(new ErrorHandler("No note found", 404))
        await Note.deleteOne()

        res.status(200).json({
            success: true,
            message: "Note deleted successfully."
        })


    } catch (error) {
        console.log("Error in deleting note", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

const searchNotes = async (req, res, next) => {
    try {
        const { query } = req.query;

        if (!query)
            return next(new ErrorHandler("Query perameter is required.", 400))

        const searchRegex = new RegExp(query, 'i'); // Case-insensitive search

        //To serach notes by title
        const notes = await Note.find({
            $or: [
                { title: searchRegex },
                { content: searchRegex }
            ]
        }).limit(10).exec();

        res.status(200).json({
            success: true,
            notes,
            message: "Search results retrieved successfully."
        });
    } catch (error) {
        console.log("Error in searching notes.", error);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

const addToFavorite = async (req, res, next) => {
    try {
        const { id } = req.params;
        // console.log("Coming id to favorite----->", id)
        const note = await Note.findById(id);

        if (!note) return next(new ErrorHandler("No note found", 404));

        // Ensure only the author can mark the note as favorite
        if (note.author?.toString() !== req.user._id?.toString()) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to favorite this note."
            });
        }

        note.favorite = true;
        await note.save();

        res.status(200).json({
            success: true,
            note,
            message: "Note added to favorites successfully."
        });
    } catch (error) {
        console.log("Error in adding to favorites.", error);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

const removeFromFavorite = async (req, res, next) => {
    try {
        const { id } = req.params;
        // console.log("coming id to unfavorite ----->", id)
        const note = await Note.findById(id);

        if (!note) return next(new ErrorHandler("No note found", 404));

        // Ensure only the author can remove the note from favorites
        if (note.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to unfavorite this note."
            });
        }

        note.favorite = false;
        await note.save();

        res.status(200).json({
            success: true,
            note,
            message: "Note removed from favorites successfully."
        });
    } catch (error) {
        console.log("Error in removing from favorites.", error);
        res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

const getAllFavorites = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const notes = await Note.find({ author: userId, favorite: true }).exec()

        // console.log("User Id while getting favorite notes---->", userId)
        // console.log(" favorite notes---->", notes.length)

        if (!notes.length || notes.length <= 0)
            return next(new ErrorHandler("No favorite note found. ", 404))

        res.status(200).json({
            success: true,
            notes,
            message: "Favorite notes fetched successfully."
        })

    } catch (error) {
        console.log("Error in fetching favorite notes", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}




module.exports = {
    createNote,
    getAllNotes,
    getSingleNote,
    updateNote,
    deleteNote,
    searchNotes,
    addToFavorite,
    removeFromFavorite,
    getAllFavorites,

}


