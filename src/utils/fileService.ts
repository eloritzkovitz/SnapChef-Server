import fs from 'fs';
import path from 'path';

/**
 * Saves a base64-encoded image to the uploads folder.
 * @param base64Data - The base64 image string (with or without data URL prefix).
 * @param filename - The filename to save as (e.g., "image.jpg").
 * @returns The relative URL path to the saved image.
 */
export const saveBase64Image = (base64Data: string, filename: string): string => {
    // Remove data URL prefix if present
    const matches = base64Data.match(/^data:image\/\w+;base64,(.+)$/);
    const imageBuffer = Buffer.from(matches ? matches[1] : base64Data, 'base64');
    const uploadsDir = path.join(__dirname, '../../dist/uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, imageBuffer);
    // Return the relative URL (adjust if you serve uploads differently)
    return `/uploads/${filename}`;
};

/**
 * Deletes a file from the filesystem.
 * @param filePath - The path to the file to be deleted.
 */
export const deleteFile = (filePath: string): void => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File deleted: ${filePath}`);
    } else {
        console.log(`File not found: ${filePath}`);
    }
};