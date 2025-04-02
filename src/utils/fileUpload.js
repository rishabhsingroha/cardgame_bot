const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
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
    const fileExtension = '.png';
    const baseFileName = Date.now().toString();
    const fileName = baseFileName + fileExtension;
    const filePath = path.join('uploads', fileName);
    const foilFilePath = path.join('uploads', `${baseFileName}_foil${fileExtension}`);

    // Fetch the file content from the attachment URL
    const response = await fetch(attachment.url);
    const buffer = await response.arrayBuffer();
    
    // Save original image
    await sharp(Buffer.from(buffer))
        .png()
        .toFile(path.join(process.cwd(), filePath));

    // Create foil version with effects
    await sharp(Buffer.from(buffer))
        .png()
        .modulate({
            brightness: 1.1,
            saturation: 1.2
        })
        .toFile(path.join(process.cwd(), foilFilePath));

    return filePath;
}

module.exports = {
    handleCardImageUpload
};