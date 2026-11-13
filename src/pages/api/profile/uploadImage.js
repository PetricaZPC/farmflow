import formidable from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import clientPromise, { getDatabase } from '../auth/mongodb';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const sessionId = req.cookies.sessionId;
        if (!sessionId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        console.log('Beginning file upload process...');

        // Serverless hosts (e.g. Vercel) have a read-only filesystem: uploads cannot be stored there.
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            await fs.access(uploadDir, fs.constants.W_OK);
        } catch (err) {
            console.error('Uploads directory is not writable:', err);
            return res.status(503).json({ error: 'Image uploads are not available on this deployment (read-only storage).' });
        }
        
        const form = formidable({ 
            keepExtensions: true,
            multiples: false,
            maxFileSize: 5 * 1024 * 1024
        });
        
        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    console.error('Error parsing form:', err);
                    return reject(err);
                }
                console.log('Form parsed successfully');
                resolve([fields, files]);
            });
        });
        
        if (!files.profileImage) {
            console.error('No profile image found in request');
            return res.status(400).json({ error: 'No image file provided' });
        }
        
        const file = files.profileImage;
        console.log('Received file:', file.originalFilename);
        
        const fileExt = path.extname(file.originalFilename || '.jpg');
        const uniqueFilename = `${uuidv4()}${fileExt}`;
        const destPath = path.join(uploadDir, uniqueFilename);
        
        const data = await fs.readFile(file.filepath);
        
        await fs.writeFile(destPath, data);
        console.log('File saved to:', destPath);
        
        try {
            await fs.unlink(file.filepath);
            console.log('Temp file removed');
        } catch (err) {
            console.warn('Could not delete temp file:', err);
        }
        
        const imageUrl = `/uploads/${uniqueFilename}`;
        console.log('Image URL:', imageUrl);
        
        const client = await clientPromise;
        const db = await getDatabase();
        const users = db.collection('users');
        
        const user = await users.findOne({ sessionId });
        
        if (!user) {
            console.error('User not found with sessionId');
            return res.status(401).json({ error: 'User not found' });
        }
        
        await users.updateOne(
            { _id: user._id },
            { $set: { profileImageUrl: imageUrl } }
        );
        
        console.log('Profile image updated successfully');
        return res.status(200).json({ imageUrl });
        
    } catch (error) {
        console.error('Error in image upload:', error);
        return res.status(500).json({ error: error.message || 'Error uploading image' });
    }
}
