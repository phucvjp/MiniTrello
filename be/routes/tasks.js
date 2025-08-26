const express = require('express');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');
const { validateTask, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// Helper function to check card access
const checkCardAccess = async (cardId, userId) => {
  const cardDoc = await db.collection('cards').doc(cardId).get();
  
  if (!cardDoc.exists) {
    throw new Error('Card not found');
  }

  const cardData = cardDoc.data();
  
  // Check board access
  const boardDoc = await db.collection('boards').doc(cardData.boardId).get();
  
  if (!boardDoc.exists) {
    throw new Error('Board not found');
  }

  const boardData = boardDoc.data();
  
  if (!boardData.members.includes(userId)) {
    throw new Error('Access denied');
  }

  return { cardData, boardData };
};

// GET /tasks - Get tasks for a card
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.query;

    if (!cardId) {
      return res.status(400).json({
        success: false,
        message: 'Card ID is required'
      });
    }

    // Check card access
    const { cardData } = await checkCardAccess(cardId, userId);

    const tasksSnapshot = await db.collection('tasks')
      .where('cardId', '==', cardId)
      .orderBy('order')
      .get();

    const tasks = tasksSnapshot.docs.map(taskDoc => ({
      id: taskDoc.id,
      ...taskDoc.data()
    }));

    res.json({
      success: true,
      tasks
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    
    if (error.message === 'Card not found') {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }
    
    if (error.message === 'Board not found') {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }
    
    if (error.message === 'Access denied') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

// POST /tasks - Create new task
router.post('/', authenticateToken, validateTask, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, cardId } = req.body;

    if (!cardId) {
      return res.status(400).json({
        success: false,
        message: 'Card ID is required'
      });
    }

    // Check card access
    const { cardData, boardData } = await checkCardAccess(cardId, userId);

    // Get the next order number for this card
    const tasksSnapshot = await db.collection('tasks')
      .where('cardId', '==', cardId)
      .orderBy('order', 'desc')
      .limit(1)
      .get();

    const nextOrder = tasksSnapshot.empty ? 0 : tasksSnapshot.docs[0].data().order + 1;

    const taskData = {
      title,
      description: description || '',
      completed: false,
      cardId,
      boardId: cardData.boardId,
      createdBy: userId,
      order: nextOrder,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const taskRef = await db.collection('tasks').add(taskData);

    const responseTask = {
      id: taskRef.id,
      ...taskData
    };

    // Update card's updated timestamp
    await db.collection('cards').doc(cardId).update({
      updatedAt: new Date()
    });

    // Emit real-time event
    req.io.to(`board:${cardData.boardId}`).emit('task:created', {
      ...responseTask,
      cardId
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: responseTask
    });

  } catch (error) {
    console.error('Create task error:', error);
    
    if (error.message === 'Card not found') {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }
    
    if (error.message === 'Board not found') {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }
    
    if (error.message === 'Access denied') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
});

// GET /tasks/:id - Get task by ID
router.get('/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const taskDoc = await db.collection('tasks').doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const taskData = taskDoc.data();

    // Check card access
    await checkCardAccess(taskData.cardId, userId);

    // Get creator details
    let creator = null;
    if (taskData.createdBy) {
      const creatorDoc = await db.collection('users').doc(taskData.createdBy).get();
      if (creatorDoc.exists) {
        const creatorData = creatorDoc.data();
        creator = {
          id: taskData.createdBy,
          username: creatorData.username,
          email: creatorData.email,
          avatar: creatorData.avatar
        };
      }
    }

    const task = {
      id: taskId,
      ...taskData,
      creator
    };

    res.json({
      success: true,
      task
    });

  } catch (error) {
    console.error('Get task error:', error);
    
    if (error.message === 'Card not found') {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }
    
    if (error.message === 'Board not found') {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }
    
    if (error.message === 'Access denied') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch task'
    });
  }
});

// PUT /tasks/:id - Update task
router.put('/:id', authenticateToken, validateObjectId('id'), validateTask, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { title, description, completed } = req.body;

    const taskDoc = await db.collection('tasks').doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const taskData = taskDoc.data();

    // Check card access
    const { cardData } = await checkCardAccess(taskData.cardId, userId);

    const updateData = {
      title,
      description: description || '',
      completed: completed !== undefined ? completed : taskData.completed,
      updatedAt: new Date()
    };

    await db.collection('tasks').doc(taskId).update(updateData);

    // Update card's updated timestamp
    await db.collection('cards').doc(taskData.cardId).update({
      updatedAt: new Date()
    });

    const updatedTask = {
      id: taskId,
      ...taskData,
      ...updateData
    };

    // Emit real-time event
    req.io.to(`board:${cardData.boardId}`).emit('task:updated', {
      ...updatedTask,
      cardId: taskData.cardId
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    });

  } catch (error) {
    console.error('Update task error:', error);
    
    if (error.message === 'Card not found') {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }
    
    if (error.message === 'Board not found') {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }
    
    if (error.message === 'Access denied') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
});

// DELETE /tasks/:id - Delete task
router.delete('/:id', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const taskDoc = await db.collection('tasks').doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const taskData = taskDoc.data();

    // Check card access
    const { cardData } = await checkCardAccess(taskData.cardId, userId);

    await db.collection('tasks').doc(taskId).delete();

    // Update card's updated timestamp
    await db.collection('cards').doc(taskData.cardId).update({
      updatedAt: new Date()
    });

    // Emit real-time event
    req.io.to(`board:${cardData.boardId}`).emit('task:deleted', {
      id: taskId,
      cardId: taskData.cardId,
      boardId: cardData.boardId
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    
    if (error.message === 'Card not found') {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }
    
    if (error.message === 'Board not found') {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }
    
    if (error.message === 'Access denied') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
});

// PUT /tasks/:id/toggle - Toggle task completion
router.put('/:id/toggle', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const taskDoc = await db.collection('tasks').doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const taskData = taskDoc.data();

    // Check card access
    const { cardData } = await checkCardAccess(taskData.cardId, userId);

    const newCompleted = !taskData.completed;

    await db.collection('tasks').doc(taskId).update({
      completed: newCompleted,
      completedAt: newCompleted ? new Date() : null,
      completedBy: newCompleted ? userId : null,
      updatedAt: new Date()
    });

    // Update card's updated timestamp
    await db.collection('cards').doc(taskData.cardId).update({
      updatedAt: new Date()
    });

    const updatedTask = {
      id: taskId,
      ...taskData,
      completed: newCompleted,
      completedAt: newCompleted ? new Date() : null,
      completedBy: newCompleted ? userId : null,
      updatedAt: new Date()
    };

    // Emit real-time event
    req.io.to(`board:${cardData.boardId}`).emit('task:toggled', {
      ...updatedTask,
      cardId: taskData.cardId,
      toggledBy: {
        id: userId,
        username: req.user.username
      }
    });

    res.json({
      success: true,
      message: `Task ${newCompleted ? 'completed' : 'reopened'} successfully`,
      task: updatedTask
    });

  } catch (error) {
    console.error('Toggle task error:', error);
    
    if (error.message === 'Card not found') {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }
    
    if (error.message === 'Board not found') {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }
    
    if (error.message === 'Access denied') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to toggle task'
    });
  }
});

// PUT /tasks/:id/reorder - Reorder task within card
router.put('/:id/reorder', authenticateToken, validateObjectId('id'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { order } = req.body;

    if (order === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Order is required'
      });
    }

    const taskDoc = await db.collection('tasks').doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const taskData = taskDoc.data();

    // Check card access
    const { cardData } = await checkCardAccess(taskData.cardId, userId);

    await db.collection('tasks').doc(taskId).update({
      order,
      updatedAt: new Date()
    });

    // Update card's updated timestamp
    await db.collection('cards').doc(taskData.cardId).update({
      updatedAt: new Date()
    });

    // Emit real-time event
    req.io.to(`board:${cardData.boardId}`).emit('task:reordered', {
      id: taskId,
      cardId: taskData.cardId,
      order,
      reorderedBy: {
        id: userId,
        username: req.user.username
      }
    });

    res.json({
      success: true,
      message: 'Task reordered successfully'
    });

  } catch (error) {
    console.error('Reorder task error:', error);
    
    if (error.message === 'Card not found') {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }
    
    if (error.message === 'Board not found') {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }
    
    if (error.message === 'Access denied') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to reorder task'
    });
  }
});

module.exports = router;
