const fs = require('fs');
const path = require('path');
let fetch;

// Dynamic import for node-fetch
(async () => {
    const nodeFetch = await import('node-fetch');
    fetch = nodeFetch.default;
})();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

/**
 * Handles file upload for card images
 * @param {Discord.Attachment} attachment - The Discord attachment object
 * @returns {Promise<string>} The path where the file was saved
 */
async function handleCardImageUpload(attachment) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(attachment.contentType)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.');
    }

    // Generate unique filename
    const fileExtension = path.extname(attachment.name);
    const fileName = `${Date.now()}${fileExtension}`;
    const filePath = path.join('uploads', fileName);

    // Fetch the file content from the attachment URL
    const response = await fetch(attachment.url);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(path.join(process.cwd(), filePath), Buffer.from(buffer));

    return filePath;
}

module.exports = {
    handleCardImageUpload
};