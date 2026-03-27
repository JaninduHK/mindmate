import express from 'express';
import { 
  saveMessage, 
  getMessageHistory, 
  getConversations,
  editMessage,
  deleteMessage,
  markMessageAsRead,
  markConversationAsRead,
  searchMessages,
} from '../controllers/chat.controller.js';

const router = express.Router();

// Get conversations list
router.get('/conversations', getConversations);

// Get message history between two users
router.get('/history', getMessageHistory);

// Search messages in a conversation
router.get('/search', searchMessages);

// Save message
router.post('/send', saveMessage);

// Edit message
router.put('/edit', editMessage);

// Delete message
router.delete('/delete', deleteMessage);

// Mark single message as read
router.put('/mark-read', markMessageAsRead);

// Mark all messages in conversation as read
router.put('/mark-conversation-read', markConversationAsRead);

export default router;