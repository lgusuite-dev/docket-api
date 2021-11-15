const mongoose = require('mongoose');
const FolderSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        _parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder'
        },
        _createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['Active', 'Deleted'],
            default: 'Active'
        },

    },
    {
        timestamps: true
    }
)
const Folder = mongoose.model('Folder', FolderSchema);
module.exports = Folder;