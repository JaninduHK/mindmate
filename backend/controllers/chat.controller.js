import Message from '../models/message.model.js';
import GroupChat from '../models/GroupChat.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

// Save message to database
export const saveMessage = asyncHandler(async (req, res) => {
  const { senderId, recipientId, message, fileUrl, fileType, fileName } = req.body;

  if (!senderId || !recipientId || !message) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'senderId, recipientId, and message are required');
  }

  const newMessage = await Message.create({
    senderId,
    recipientId,
    message,
    fileUrl: fileUrl || null,
    fileType: fileType || null,
    fileName: fileName || null,
  });

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, newMessage, 'Message saved')
  );
});

// Get message history between two users
export const getMessageHistory = asyncHandler(async (req, res) => {
  const { userId, recipientId } = req.query;

  if (!userId || !recipientId) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'userId and recipientId are required');
  }

  // Get all messages between these two users, sorted by createdAt
  const messages = await Message.find({
    $or: [
      { senderId: userId, recipientId: recipientId },
      { senderId: recipientId, recipientId: userId },
    ],
  })
    .populate('senderId', 'name avatar')
    .populate('recipientId', 'name avatar')
    .sort({ createdAt: 1 })
    .limit(100); // Limit to last 100 messages for performance

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { messages }, 'Message history retrieved')
  );
});

// Get conversations list (latest message with each user)
export const getConversations = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'userId is required');
  }

  // Get the latest message with each unique contact
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { recipientId: userId }],
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$senderId', userId] },
            '$recipientId',
            '$senderId',
          ],
        },
        lastMessage: { $first: '$$ROOT' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'contactInfo',
      },
    },
    {
      $sort: { 'lastMessage.createdAt': -1 },
    },
  ]);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { conversations }, 'Conversations retrieved')
  );
});

// Edit message
export const editMessage = asyncHandler(async (req, res) => {
  const { messageId, newMessage, userId } = req.body;

  if (!messageId || !newMessage || !userId) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'messageId, newMessage, and userId are required');
  }

  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Message not found');
  }

  // Only sender can edit
  if (message.senderId.toString() !== userId) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You can only edit your own messages');
  }

  message.message = newMessage;
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, message, 'Message edited successfully')
  );
});

// Delete message
export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId, userId } = req.body;

  if (!messageId || !userId) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'messageId and userId are required');
  }

  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Message not found');
  }

  // Only sender or recipient can delete
  if (message.senderId.toString() !== userId && message.recipientId.toString() !== userId) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You cannot delete this message');
  }

  message.deletedAt = new Date();
  message.deletedBy = userId;
  await message.save();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, message, 'Message deleted successfully')
  );
});

// Mark message as read
export const markMessageAsRead = asyncHandler(async (req, res) => {
  const { messageId, userId } = req.body;

  if (!messageId || !userId) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'messageId and userId are required');
  }

  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Message not found');
  }

  // Only recipient can mark as read
  if (message.recipientId.toString() !== userId) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You can only mark your own messages as read');
  }

  if (!message.readAt) {
    message.readAt = new Date();
    await message.save();
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, message, 'Message marked as read')
  );
});

// Mark all messages in conversation as read
export const markConversationAsRead = asyncHandler(async (req, res) => {
  const { userId, senderId } = req.body;

  if (!userId || !senderId) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'userId and senderId are required');
  }

  await Message.updateMany(
    {
      senderId: senderId,
      recipientId: userId,
      readAt: null,
    },
    {
      readAt: new Date(),
    }
  );

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, null, 'Conversation marked as read')
  );
});

// Search messages
export const searchMessages = asyncHandler(async (req, res) => {
  const { userId, recipientId, keyword } = req.query;

  if (!userId || !recipientId || !keyword) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'userId, recipientId, and keyword are required');
  }

  const messages = await Message.find(
    {
      $or: [
        { senderId: userId, recipientId: recipientId },
        { senderId: recipientId, recipientId: userId },
      ],
      message: { $regex: keyword, $options: 'i' }, // Case-insensitive search
      deletedAt: null,
    }
  )
    .populate('senderId', 'name avatar')
    .populate('recipientId', 'name avatar')
    .sort({ createdAt: -1 });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { messages }, 'Messages searched successfully')
  );
});

// ---- GROUP CHAT METHODS ---- //

// Create group chat (peer counselors only)
export const createGroupChat = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { _id: userId, role } = req.user;

  console.log('Creating group chat:', { name, userId, userRole: role });

  if (!name) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Group name is required');
  }

  // Only peer_supporter role can create groups
  if (role !== 'peer_supporter') {
    console.error('User role not peer_supporter:', { role });
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Only peer supporters can create group chats');
  }

  const newGroup = await GroupChat.create({
    name,
    description: description || '',
    creatorId: userId,
    members: [userId]
  });

  console.log('Group created successfully:', newGroup);

  await newGroup.populate('creatorId', 'name avatar');

  console.log('Group populated:', newGroup);

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, newGroup, 'Group chat created successfully')
  );
});

// Get all available group chats
export const getAvailableGroupChats = asyncHandler(async (req, res) => {
  console.log('Fetching available group chats...');
  
  const groups = await GroupChat.find({ isActive: true })
    .populate('creatorId', 'name avatar')
    .sort({ createdAt: -1 });

  console.log('Available groups found:', groups.length);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, groups, 'Available group chats retrieved')
  );
});

// Get group chat messages
export const getGroupChatMessages = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const messages = await Message.find({ recipientId: groupId })
    .populate('senderId', 'name avatar')
    .sort({ createdAt: 1 });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, messages, 'Group messages retrieved')
  );
});

// Join a group chat
export const joinGroupChat = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { _id: userId } = req.user;

  const group = await GroupChat.findById(groupId);

  if (!group) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Group chat not found');
  }

  // Check if user is already a member
  if (group.members.includes(userId)) {
    return res.status(HTTP_STATUS.OK).json(
      new ApiResponse(HTTP_STATUS.OK, group, 'You are already a member of this group')
    );
  }

  // Add user to group
  group.members.push(userId);
  await group.save();
  await group.populate(['creatorId', 'members'], 'name avatar');

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, group, 'Successfully joined the group chat')
  );
});

// Leave a group chat
export const leaveGroupChat = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { _id: userId } = req.user;

  const group = await GroupChat.findById(groupId);

  if (!group) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Group chat not found');
  }

  // Remove user from group
  group.members = group.members.filter(member => member.toString() !== userId.toString());
  await group.save();

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, group, 'Successfully left the group chat')
  );
});

// Get group details with members
export const getGroupDetails = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const group = await GroupChat.findById(groupId)
    .populate('creatorId', 'name avatar')
    .populate('members', 'name avatar');

  if (!group) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Group chat not found');
  }

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, group, 'Group details retrieved')
  );
});

// Send message to group
export const sendGroupMessage = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { message, fileUrl, fileType, fileName } = req.body;
  const { _id: userId } = req.user;

  if (!message) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Message content is required');
  }

  // Verify group exists and user is member
  const group = await GroupChat.findById(groupId);

  if (!group) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Group chat not found');
  }

  if (!group.members.includes(userId)) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not a member of this group');
  }

  const newMessage = await Message.create({
    senderId: userId,
    recipientId: groupId, // Use groupId as recipientId for group messages
    message,
    fileUrl: fileUrl || null,
    fileType: fileType || null,
    fileName: fileName || null,
  });

  await newMessage.populate('senderId', 'name avatar');

  res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, newMessage, 'Message sent to group')
  );
});
