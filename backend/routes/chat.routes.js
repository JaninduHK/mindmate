import express from 'express';
import Message from '../models/message.model.js';

const router = express.Router();

router.get('/:userId', async (req, res) => {
    try{
        const message = await Message.find({
            userId: req.params.userId,
        }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: message
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;