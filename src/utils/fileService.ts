import fs from 'fs';
import path from 'path';

/**
 * Deletes a file from the filesystem.
 * @param filePath - The path to the file to be deleted.
 */
export const deleteFile = (filePath: string): void => {
    const resolvedPath = resolveFilePath(filePath);
    if (fs.existsSync(resolvedPath)) fs.unlinkSync(resolvedPath);  
};

/**
 * Resolves the full path to a file based on the provided relative path.
 * @param relativePath - The relative path to the file.
 * @returns The full path to the file.
 */
export const resolveFilePath = (relativePath: string): string => {
    return relativePath ? path.join(__dirname, '../../', relativePath.replace(`${process.env.BASE_URL}`, '/dist')) : '';          
};