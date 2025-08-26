const express = require("express");
const { db } = require("../config/firebase");
const { authenticateToken } = require("../middleware/auth");
const { validateCard, validateObjectId } = require("../middleware/validation");

const router = express.Router();

// Helper function to check board access
const checkBoardAccess = async (boardId, userId) => {
  const boardDoc = await db.collection("boards").doc(boardId).get();

  if (!boardDoc.exists) {
    throw new Error("Board not found");
  }

  const boardData = boardDoc.data();

  if (!boardData.members.includes(userId)) {
    throw new Error("Access denied");
  }

  return boardData;
};

// GET /cards - Get cards for a board
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { boardId, status } = req.query;

    if (!boardId) {
      return res.status(400).json({
        success: false,
        message: "Board ID is required",
      });
    }

    // Check board access
    await checkBoardAccess(boardId, userId);

    let query = db.collection("cards").where("boardId", "==", boardId);

    // Filter by status if provided
    if (status) {
      query = query.where("status", "==", status);
    }

    const cardsSnapshot = await query.orderBy("order").get();

    const cards = await Promise.all(
      cardsSnapshot.docs.map(async (cardDoc) => {
        const cardData = cardDoc.data();

        // Get comments for each card
        const commentsSnapshot = await db
          .collection("comments")
          .where("cardId", "==", cardDoc.id)
          .orderBy("timestamp", "desc")
          .get();

        const comments = await Promise.all(
          commentsSnapshot.docs.map(async (commentDoc) => {
            const commentData = commentDoc.data();

            // Get author details
            const authorDoc = await db
              .collection("users")
              .doc(commentData.authorId)
              .get();

            let author = { username: "Unknown", email: "", avatar: null };
            if (authorDoc.exists) {
              const authorData = authorDoc.data();
              author = {
                id: commentData.authorId,
                username: authorData.username,
                email: authorData.email,
                avatar: authorData.avatar,
              };
            }

            return {
              id: commentDoc.id,
              content: commentData.content,
              timestamp: commentData.timestamp,
              author,
            };
          })
        );

        // Get assignee details if assigned
        let assignee = null;
        if (cardData.assigneeId) {
          const assigneeDoc = await db
            .collection("users")
            .doc(cardData.assigneeId)
            .get();
          if (assigneeDoc.exists) {
            const assigneeData = assigneeDoc.data();
            assignee = {
              id: cardData.assigneeId,
              username: assigneeData.username,
              email: assigneeData.email,
              avatar: assigneeData.avatar,
            };
          }
        }

        // Get creator details
        let creator = null;
        if (cardData.createdBy) {
          const creatorDoc = await db
            .collection("users")
            .doc(cardData.createdBy)
            .get();
          if (creatorDoc.exists) {
            const creatorData = creatorDoc.data();
            creator = {
              id: cardData.createdBy,
              username: creatorData.username,
              email: creatorData.email,
              avatar: creatorData.avatar,
            };
          }
        }

        return {
          id: cardDoc.id,
          ...cardData,
          assignee,
          creator,
          comments,
          commentsCount: comments.length,
        };
      })
    );

    res.json({
      success: true,
      cards,
    });
  } catch (error) {
    console.error("Get cards error:", error);

    if (error.message === "Board not found") {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    if (error.message === "Access denied") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch cards",
    });
  }
});

// POST /cards - Create new card
router.post("/", authenticateToken, validateCard, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      labels,
      boardId,
      assigneeId,
    } = req.body;

    if (!boardId) {
      return res.status(400).json({
        success: false,
        message: "Board ID is required",
      });
    }

    // Check board access
    await checkBoardAccess(boardId, userId);

    // Validate assignee if provided
    if (assigneeId) {
      const assigneeDoc = await db.collection("users").doc(assigneeId).get();
      if (!assigneeDoc.exists) {
        return res.status(400).json({
          success: false,
          message: "Assignee not found",
        });
      }
    }

    // Get the next order number for this status column
    const cardsSnapshot = await db
      .collection("cards")
      .where("boardId", "==", boardId)
      .where("status", "==", status)
      .orderBy("order", "desc")
      .limit(1)
      .get();

    const nextOrder = cardsSnapshot.empty
      ? 0
      : cardsSnapshot.docs[0].data().order + 1;

    const cardData = {
      title,
      description: description || "",
      status,
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      labels: labels || [],
      boardId,
      assigneeId: assigneeId || null,
      createdBy: userId,
      order: nextOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const cardRef = await db.collection("cards").add(cardData);

    // Get assignee details for response
    let assignee = null;
    if (assigneeId) {
      const assigneeDoc = await db.collection("users").doc(assigneeId).get();
      if (assigneeDoc.exists) {
        const assigneeData = assigneeDoc.data();
        assignee = {
          id: assigneeId,
          username: assigneeData.username,
          email: assigneeData.email,
          avatar: assigneeData.avatar,
        };
      }
    }

    const responseCard = {
      id: cardRef.id,
      ...cardData,
      assignee,
    };

    // Emit real-time event
    req.io.to(`board:${boardId}`).emit("card:created", responseCard);

    res.status(201).json({
      success: true,
      message: "Card created successfully",
      card: responseCard,
    });
  } catch (error) {
    console.error("Create card error:", error);

    if (error.message === "Board not found") {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    if (error.message === "Access denied") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create card",
    });
  }
});

// GET /cards/:id - Get card by ID
router.get(
  "/:id",
  authenticateToken,
  validateObjectId("id"),
  async (req, res) => {
    try {
      const cardId = req.params.id;
      const userId = req.user.id;

      const cardDoc = await db.collection("cards").doc(cardId).get();

      if (!cardDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Card not found",
        });
      }

      const cardData = cardDoc.data();

      // Check board access
      await checkBoardAccess(cardData.boardId, userId);

      // Get assignee details if assigned
      let assignee = null;
      if (cardData.assigneeId) {
        const assigneeDoc = await db
          .collection("users")
          .doc(cardData.assigneeId)
          .get();
        if (assigneeDoc.exists) {
          const assigneeData = assigneeDoc.data();
          assignee = {
            id: cardData.assigneeId,
            username: assigneeData.username,
            email: assigneeData.email,
            avatar: assigneeData.avatar,
          };
        }
      }

      // Get creator details
      let creator = null;
      if (cardData.createdBy) {
        const creatorDoc = await db
          .collection("users")
          .doc(cardData.createdBy)
          .get();
        if (creatorDoc.exists) {
          const creatorData = creatorDoc.data();
          creator = {
            id: cardData.createdBy,
            username: creatorData.username,
            email: creatorData.email,
            avatar: creatorData.avatar,
          };
        }
      }

      const card = {
        id: cardId,
        ...cardData,
        assignee,
        creator,
      };

      res.json({
        success: true,
        card,
      });
    } catch (error) {
      console.error("Get card error:", error);

      if (error.message === "Board not found") {
        return res.status(404).json({
          success: false,
          message: "Board not found",
        });
      }

      if (error.message === "Access denied") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to fetch card",
      });
    }
  }
);

// PUT /cards/:id - Update card
router.put(
  "/:id",
  authenticateToken,
  validateObjectId("id"),
  // validateCard,
  async (req, res) => {
    try {
      const cardId = req.params.id;
      const userId = req.user.id;
      const {
        title,
        description,
        status,
        priority,
        dueDate,
        labels,
        // assigneeId,
      } = req.body;
      const cardDoc = await db.collection("cards").doc(cardId).get();

      if (!cardDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Card not found",
        });
      }

      const cardData = cardDoc.data();

      // Check board access
      await checkBoardAccess(cardData.boardId, userId);

      // // Validate assignee if provided
      // if (assigneeId) {
      //   const assigneeDoc = await db.collection("users").doc(assigneeId).get();
      //   if (!assigneeDoc.exists) {
      //     return res.status(400).json({
      //       success: false,
      //       message: "Assignee not found",
      //     });
      //   }
      // }

      const updateData = {
        title: title || cardData.title,
        description: description || cardData.description,
        status: status || cardData.status,
        priority: priority || cardData.priority,
        dueDate: dueDate ? new Date(dueDate) : cardData.dueDate,
        labels: labels || cardData.labels,
        // assigneeId: assigneeId || cardData.assigneeId,
        updatedAt: new Date(),
      };

      await db.collection("cards").doc(cardId).update(updateData);

      // // Get updated assignee details for response
      // let assignee = null;
      // if (assigneeId) {
      //   const assigneeDoc = await db.collection("users").doc(assigneeId).get();
      //   if (assigneeDoc.exists) {
      //     const assigneeData = assigneeDoc.data();
      //     assignee = {
      //       id: assigneeId,
      //       username: assigneeData.username,
      //       email: assigneeData.email,
      //       avatar: assigneeData.avatar,
      //     };
      //   }
      // }

      const updatedCard = {
        id: cardId,
        ...cardData,
        ...updateData,
        // assignee,
      };

      // Emit real-time event
      req.io.to(`board:${cardData.boardId}`).emit("card:updated", updatedCard);

      res.json({
        success: true,
        message: "Card updated successfully",
        card: updatedCard,
      });
    } catch (error) {
      console.error("Update card error:", error);

      if (error.message === "Board not found") {
        return res.status(404).json({
          success: false,
          message: "Board not found",
        });
      }

      if (error.message === "Access denied") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update card",
      });
    }
  }
);

// DELETE /cards/:id - Delete card
router.delete(
  "/:id",
  authenticateToken,
  validateObjectId("id"),
  async (req, res) => {
    try {
      const cardId = req.params.id;
      const userId = req.user.id;

      const cardDoc = await db.collection("cards").doc(cardId).get();

      if (!cardDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Card not found",
        });
      }

      const cardData = cardDoc.data();

      // Check board access
      await checkBoardAccess(cardData.boardId, userId);

      // Delete all comments for this card
      const commentsSnapshot = await db
        .collection("comments")
        .where("cardId", "==", cardId)
        .get();

      const batch = db.batch();

      commentsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete the card
      batch.delete(db.collection("cards").doc(cardId));

      await batch.commit();

      // Emit real-time event
      req.io.to(`board:${cardData.boardId}`).emit("card:deleted", {
        id: cardId,
        boardId: cardData.boardId,
      });

      res.json({
        success: true,
        message: "Card deleted successfully",
      });
    } catch (error) {
      console.error("Delete card error:", error);

      if (error.message === "Board not found") {
        return res.status(404).json({
          success: false,
          message: "Board not found",
        });
      }

      if (error.message === "Access denied") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to delete card",
      });
    }
  }
);

// PUT /cards/:id/move - Move card to different status/position
router.put(
  "/:id/move",
  authenticateToken,
  validateObjectId("id"),
  async (req, res) => {
    try {
      const cardId = req.params.id;
      const userId = req.user.id;
      const { status, order } = req.body;

      if (!status || order === undefined) {
        return res.status(400).json({
          success: false,
          message: "Status and order are required",
        });
      }

      const cardDoc = await db.collection("cards").doc(cardId).get();

      if (!cardDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Card not found",
        });
      }

      const cardData = cardDoc.data();

      // Check board access
      await checkBoardAccess(cardData.boardId, userId);

      // Update card position
      await db.collection("cards").doc(cardId).update({
        status,
        order,
        updatedAt: new Date(),
      });

      // Emit real-time event for drag and drop
      const eventData = {
        id: cardId,
        boardId: cardData.boardId,
        oldStatus: cardData.status,
        newStatus: status,
        order,
        movedBy: {
          id: userId,
          username: req.user.username,
        },
      };

      console.log(`🚀 Emitting card:moved event to room board-${cardData.boardId}:`, eventData);
      req.io.to(`board-${cardData.boardId}`).emit("card:moved", eventData);

      res.json({
        success: true,
        message: "Card moved successfully",
      });
    } catch (error) {
      console.error("Move card error:", error);

      if (error.message === "Board not found") {
        return res.status(404).json({
          success: false,
          message: "Board not found",
        });
      }

      if (error.message === "Access denied") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to move card",
      });
    }
  }
);

// POST /cards/:id/comments - Add comment to card
router.post("/:id/comments", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cardId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    // Get card to check access
    const cardDoc = await db.collection("cards").doc(cardId).get();
    if (!cardDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Card not found",
      });
    }

    const cardData = cardDoc.data();
    await checkBoardAccess(cardData.boardId, userId);

    // Create comment
    const commentData = {
      cardId,
      authorId: userId,
      content: content.trim(),
      timestamp: new Date(),
    };

    const commentRef = await db.collection("comments").add(commentData);

    // Get author details for response
    const authorDoc = await db.collection("users").doc(userId).get();
    const authorData = authorDoc.data();

    const comment = {
      id: commentRef.id,
      content: commentData.content,
      timestamp: commentData.timestamp,
      author: {
        id: userId,
        username: authorData.username,
        email: authorData.email,
        avatar: authorData.avatar,
      },
    };

    // Emit real-time event
    req.io.to(`board:${cardData.boardId}`).emit("comment:added", {
      cardId,
      comment,
      addedBy: {
        id: userId,
        username: req.user.username,
      },
    });

    res.status(201).json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
    });
  }
});

// GET /cards/:id/comments - Get comments for card
router.get("/:id/comments", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cardId = req.params.id;

    // Get card to check access
    const cardDoc = await db.collection("cards").doc(cardId).get();
    if (!cardDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Card not found",
      });
    }

    const cardData = cardDoc.data();
    await checkBoardAccess(cardData.boardId, userId);

    // Get comments
    const commentsSnapshot = await db
      .collection("comments")
      .where("cardId", "==", cardId)
      .orderBy("timestamp", "desc")
      .get();

    const comments = await Promise.all(
      commentsSnapshot.docs.map(async (commentDoc) => {
        const commentData = commentDoc.data();

        // Get author details
        const authorDoc = await db
          .collection("users")
          .doc(commentData.authorId)
          .get();

        let author = { username: "Unknown", email: "", avatar: null };
        if (authorDoc.exists) {
          const authorData = authorDoc.data();
          author = {
            id: commentData.authorId,
            username: authorData.username,
            email: authorData.email,
            avatar: authorData.avatar,
          };
        }

        return {
          id: commentDoc.id,
          content: commentData.content,
          timestamp: commentData.timestamp,
          author,
        };
      })
    );

    res.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
    });
  }
});

// DELETE /cards/:id/comments/:commentId - Delete comment
router.delete(
  "/:id/comments/:commentId",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const cardId = req.params.id;
      const commentId = req.params.commentId;

      // Get card to check access
      const cardDoc = await db.collection("cards").doc(cardId).get();
      if (!cardDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Card not found",
        });
      }

      const cardData = cardDoc.data();
      await checkBoardAccess(cardData.boardId, userId);

      // Get comment
      const commentDoc = await db.collection("comments").doc(commentId).get();
      if (!commentDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      const commentData = commentDoc.data();

      // Check if user can delete (comment author or board owner)
      const boardDoc = await db
        .collection("boards")
        .doc(cardData.boardId)
        .get();
      const boardData = boardDoc.data();

      if (commentData.authorId !== userId && boardData.owner !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Delete comment
      await db.collection("comments").doc(commentId).delete();

      // Emit real-time event
      req.io.to(`board:${cardData.boardId}`).emit("comment:deleted", {
        cardId,
        commentId,
        deletedBy: {
          id: userId,
          username: req.user.username,
        },
      });

      res.json({
        success: true,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete comment",
      });
    }
  }
);

// PUT /cards/:id/assign - Assign/unassign user to card
router.put(
  "/:id/assign",
  authenticateToken,
  validateObjectId("id"),
  async (req, res) => {
    try {
      const cardId = req.params.id;
      const userId = req.user.id;
      const { assigneeId } = req.body;

      const cardDoc = await db.collection("cards").doc(cardId).get();

      if (!cardDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Card not found",
        });
      }

      const cardData = cardDoc.data();

      // Check board access
      await checkBoardAccess(cardData.boardId, userId);

      // Validate assignee if provided
      if (assigneeId) {
        const assigneeDoc = await db.collection("users").doc(assigneeId).get();
        if (!assigneeDoc.exists) {
          return res.status(400).json({
            success: false,
            message: "Assignee not found",
          });
        }

        // Check if assignee has access to the board
        try {
          await checkBoardAccess(cardData.boardId, assigneeId);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: "Assignee does not have access to this board",
          });
        }
      }

      const updateData = {
        assigneeId: assigneeId || null,
        updatedAt: new Date(),
      };

      await db.collection("cards").doc(cardId).update(updateData);

      // Get updated assignee details for response
      let assignee = null;
      if (assigneeId) {
        const assigneeDoc = await db.collection("users").doc(assigneeId).get();
        if (assigneeDoc.exists) {
          const assigneeData = assigneeDoc.data();
          assignee = {
            id: assigneeId,
            username: assigneeData.username,
            email: assigneeData.email,
            avatar: assigneeData.avatar,
          };
        }
      }

      const updatedCard = {
        id: cardId,
        ...cardData,
        ...updateData,
        assignee,
      };

      // Emit real-time event
      req.io.to(`board:${cardData.boardId}`).emit("card:assigned", {
        cardId,
        assignee,
        assignedBy: {
          id: userId,
          username: req.user.username,
        },
      });

      res.json({
        success: true,
        message: assigneeId
          ? "Card assigned successfully"
          : "Card unassigned successfully",
        card: updatedCard,
      });
    } catch (error) {
      console.error("Assign card error:", error);

      if (error.message === "Board not found") {
        return res.status(404).json({
          success: false,
          message: "Board not found",
        });
      }

      if (error.message === "Access denied") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to assign card",
      });
    }
  }
);

module.exports = router;
