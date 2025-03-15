import clientPromise from '../auth/mongodb';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

        const form = new formidable.IncomingForm();
        
        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) return reject(err);
                resolve([fields, files]);
            });
        });

        const client = await clientPromise;
        const db = client.db('accounts');
        
        const users = db.collection('users');
        const user = await users.findOne({ sessionId });
        
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!user.friends || user.friends.length === 0) {
            return res.status(403).json({ error: 'You need to add at least one friend to post messages' });
        }

        let imageUrl = null;
        if (files.image) {
            const file = files.image;
            
            const ext = path.extname(file.originalFilename || '.jpg');
            const fileName = `${uuidv4()}${ext}`;
            
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            await fs.mkdir(uploadDir, { recursive: true });
            
            const data = await fs.readFile(file.filepath);
            await fs.writeFile(path.join(uploadDir, fileName), data);
            
            imageUrl = `/uploads/${fileName}`;
        }

        const content = fields.content ? fields.content.toString() : '';
        
        const message = {
            content: content,
            authorId: user._id.toString(),
            authorEmail: user.email,
            timestamp: new Date(),
            imageUrl: imageUrl,
        };

        const messagesCollection = db.collection('messages');
        const result = await messagesCollection.insertOne(message);
        
        res.status(201).json({
            message: {
                ...message,
                _id: result.insertedId,
                authorDetails: {
                    username: user.username || user.email,
                    email: user.email,
                    profileImageUrl: user.profileImageUrl
                }
            }
        });
    } catch (error) {
        console.error('Error posting message:', error);
        res.status(500).json({ error: 'Error posting message' });
    }
}