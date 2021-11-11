const mongoose = require('mongoose');
const FolderSchema = new mongoose.Schema(
    {
        _parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder'
        },
    },
    {
        timestamps: true
    }
)
const Folder = mongoose.model('Folder', FolderSchema);
module.exports = Folder;