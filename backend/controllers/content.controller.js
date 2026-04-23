import ContentResource from '../models/ContentResource.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET all content (with filters)
export const getAllContent = asyncHandler(async (req, res) => {
  const { category, type, search } = req.query;
  const filter = { isActive: true };

  if (category && category !== 'all') {
    filter.moods = category;
  }
  if (type && type !== 'all') {
    filter.type = type;
  }
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const content = await ContentResource.find(filter).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, { data: content }, 'Content retrieved successfully')
  );
});

// POST to create new content (therapists only)
export const createContent = asyncHandler(async (req, res) => {
  const { title, type, description, externalUrl, thumbnailUrl, durationText, category, isCurated } = req.body;

  const newContent = await ContentResource.create({
    title,
    type,
    description,
    externalUrl,
    thumbnailUrl,
    durationText,
    moods: [category], // store category as mood
    isCurated: isCurated !== undefined ? isCurated : true,
    createdBy: req.user._id,
  });

  return res.status(201).json(
    new ApiResponse(201, { data: newContent }, 'Content created successfully')
  );
});

// PUT to update content
export const updateContent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const content = await ContentResource.findById(id);
  if (!content) {
    throw new ApiError(404, 'Content not found');
  }

  // Ensure only the creator or admin can update it
  if (content.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to update this content');
  }

  const updatedContent = await ContentResource.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  return res.status(200).json(
    new ApiResponse(200, { data: updatedContent }, 'Content updated successfully')
  );
});

// DELETE content
export const deleteContent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const content = await ContentResource.findById(id);
  if (!content) {
    throw new ApiError(404, 'Content not found');
  }

  if (content.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to delete this content');
  }

  await ContentResource.findByIdAndDelete(id);

  return res.status(200).json(
    new ApiResponse(200, null, 'Content deleted successfully')
  );
});
