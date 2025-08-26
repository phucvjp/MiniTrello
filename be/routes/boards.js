const express = require("express");
const { db } = require("../config/firebase");
const { authenticateToken } = require("../middleware/auth");
const {
  validateBoard,
  validateObjectId,
  validatePagination,
} = require("../middleware/validation");

const router = express.Router();

// GET /boards - Get user's boards with pagination
router.get("/", authenticateToken, validatePagination, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    let query = db
      .collection("boards")
      .where("members", "array-contains", userId);

    // Add search filter if provided
    if (search) {
      // Firestore doesn't support full-text search, so we'll do a simple title filter
      // In production, consider using Algolia or Elasticsearch for better search
      query = query
        .where("title", ">=", search)
        .where("title", "<=", search + "\uf8ff");
    }

    // Get total count for pagination
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Apply pagination
    const offset = (page - 1) * limit;
    const boardsSnapshot = await query
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .offset(offset)
      .get();

    const boards = await Promise.all(
      boardsSnapshot.docs.map(async (doc) => {
        const boardData = doc.data();

        // Get member details
        const memberPromises = boardData.members.map(async (memberId) => {
          const memberDoc = await db.collection("users").doc(memberId).get();
          if (memberDoc.exists) {
            const memberData = memberDoc.data();
            return {
              id: memberId,
              username: memberData.username,
              email: memberData.email,
              avatar: memberData.avatar,
            };
          }
          return null;
        });

        const members = (await Promise.all(memberPromises)).filter(Boolean);

        // Get cards count
        const cardsSnapshot = await db
          .collection("cards")
          .where("boardId", "==", doc.id)
          .get();

        return {
          id: doc.id,
          title: boardData.title,
          description: boardData.description,
          isPrivate: boardData.isPrivate,
          owner: boardData.owner,
          members,
          cardsCount: cardsSnapshot.size,
          createdAt: boardData.createdAt,
          updatedAt: boardData.updatedAt,
        };
      })
    );

    res.json({
      success: true,
      data: boards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get boards error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch boards",
    });
  }
});

// POST /boards - Create new board
router.post("/", authenticateToken, validateBoard, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, isPrivate = false } = req.body;

    const boardData = {
      title,
      description: description || "",
      isPrivate,
      owner: userId,
      members: [userId], // Owner is automatically a member
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const boardRef = await db.collection("boards").add(boardData);

    // Emit real-time event
    req.io.emit("board:created", {
      id: boardRef.id,
      ...boardData,
      members: [
        {
          id: userId,
          username: req.user.username,
          email: req.user.email,
          avatar: req.user.avatar,
        },
      ],
      cardsCount: 0,
    });

    res.status(201).json({
      success: true,
      message: "Board created successfully",
      board: {
        id: boardRef.id,
        ...boardData,
        members: [
          {
            id: userId,
            username: req.user.username,
            email: req.user.email,
            avatar: req.user.avatar,
          },
        ],
        cardsCount: 0,
      },
    });
  } catch (error) {
    console.error("Create board error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create board",
    });
  }
});

// GET /boards/:id - Get board by ID
router.get(
  "/:id",
  authenticateToken,
  validateObjectId("id"),
  async (req, res) => {
    try {
      const boardId = req.params.id;
      const userId = req.user.id;

      const boardDoc = await db.collection("boards").doc(boardId).get();

      if (!boardDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Board not found",
        });
      }

      const boardData = boardDoc.data();

      // Check if user has access to this board
      if (!boardData.members.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Get member details
      const memberPromises = boardData.members.map(async (memberId) => {
        const memberDoc = await db.collection("users").doc(memberId).get();
        if (memberDoc.exists) {
          const memberData = memberDoc.data();
          return {
            id: memberId,
            username: memberData.username,
            email: memberData.email,
            avatar: memberData.avatar,
          };
        }
        return null;
      });

      const members = (await Promise.all(memberPromises)).filter(Boolean);

      // Get cards for this board
      const cardsSnapshot = await db
        .collection("cards")
        .where("boardId", "==", boardId)
        .orderBy("order")
        .get();

      const cards = await Promise.all(
        cardsSnapshot.docs.map(async (cardDoc) => {
          const cardData = cardDoc.data();

          // Get tasks for each card
          const tasksSnapshot = await db
            .collection("tasks")
            .where("cardId", "==", cardDoc.id)
            .orderBy("order")
            .get();

          const tasks = tasksSnapshot.docs.map((taskDoc) => ({
            id: taskDoc.id,
            ...taskDoc.data(),
          }));

          return {
            id: cardDoc.id,
            ...cardData,
            tasks,
          };
        })
      );

      const board = {
        id: boardId,
        title: boardData.title,
        description: boardData.description,
        isPrivate: boardData.isPrivate,
        owner: boardData.owner,
        members,
        cards,
        createdAt: boardData.createdAt,
        updatedAt: boardData.updatedAt,
      };

      res.json({
        success: true,
        board,
      });
    } catch (error) {
      console.error("Get board error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch board",
      });
    }
  }
);

// PUT /boards/:id - Update board
router.put(
  "/:id",
  authenticateToken,
  validateObjectId("id"),
  validateBoard,
  async (req, res) => {
    try {
      const boardId = req.params.id;
      const userId = req.user.id;
      const { title, description, isPrivate } = req.body;

      const boardDoc = await db.collection("boards").doc(boardId).get();

      if (!boardDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Board not found",
        });
      }

      const boardData = boardDoc.data();

      // Check if user is the owner or has edit permissions
      if (boardData.owner !== userId && !boardData.members.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const updateData = {
        title,
        description: description || "",
        isPrivate,
        updatedAt: new Date(),
      };

      await db.collection("boards").doc(boardId).update(updateData);

      // Emit real-time event
      req.io.to(`board:${boardId}`).emit("board:updated", {
        id: boardId,
        ...updateData,
      });

      res.json({
        success: true,
        message: "Board updated successfully",
        board: {
          id: boardId,
          ...boardData,
          ...updateData,
        },
      });
    } catch (error) {
      console.error("Update board error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update board",
      });
    }
  }
);

// DELETE /boards/:id - Delete board
router.delete(
  "/:id",
  authenticateToken,
  validateObjectId("id"),
  async (req, res) => {
    try {
      const boardId = req.params.id;
      const userId = req.user.id;

      const boardDoc = await db.collection("boards").doc(boardId).get();

      if (!boardDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Board not found",
        });
      }

      const boardData = boardDoc.data();

      // Only owner can delete the board
      if (boardData.owner !== userId) {
        return res.status(403).json({
          success: false,
          message: "Only board owner can delete the board",
        });
      }

      // Delete all related data
      const batch = db.batch();

      // Delete all tasks in the board
      const tasksSnapshot = await db
        .collection("tasks")
        .where("boardId", "==", boardId)
        .get();

      tasksSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete all cards in the board
      const cardsSnapshot = await db
        .collection("cards")
        .where("boardId", "==", boardId)
        .get();

      cardsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete the board
      batch.delete(db.collection("boards").doc(boardId));

      await batch.commit();

      // Emit real-time event
      req.io.to(`board:${boardId}`).emit("board:deleted", { id: boardId });

      res.json({
        success: true,
        message: "Board deleted successfully",
      });
    } catch (error) {
      console.error("Delete board error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete board",
      });
    }
  }
);

// POST /boards/:id/members - Add member to board
router.post(
  "/:id/members",
  authenticateToken,
  validateObjectId("id"),
  async (req, res) => {
    try {
      const boardId = req.params.id;
      const userId = req.user.id;
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const boardDoc = await db.collection("boards").doc(boardId).get();

      if (!boardDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Board not found",
        });
      }

      const boardData = boardDoc.data();

      // Check if user has permission to add members
      if (boardData.owner !== userId && !boardData.members.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Find user by email
      const userQuery = await db
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();

      if (userQuery.empty) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const newMemberDoc = userQuery.docs[0];
      const newMemberId = newMemberDoc.id;
      const newMemberData = newMemberDoc.data();

      // Check if user is already a member
      if (boardData.members.includes(newMemberId)) {
        return res.status(400).json({
          success: false,
          message: "User is already a member of this board",
        });
      }

      // Add member to board
      await db
        .collection("boards")
        .doc(boardId)
        .update({
          members: [...boardData.members, newMemberId],
          updatedAt: new Date(),
        });

      const newMember = {
        id: newMemberId,
        username: newMemberData.username,
        email: newMemberData.email,
        avatar: newMemberData.avatar,
      };

      // Emit real-time event
      req.io.to(`board:${boardId}`).emit("board:member_added", {
        boardId,
        member: newMember,
      });

      res.json({
        success: true,
        message: "Member added successfully",
        member: newMember,
      });
    } catch (error) {
      console.error("Add member error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add member",
      });
    }
  }
);

// DELETE /boards/:id/members/:memberId - Remove member from board
router.delete(
  "/:id/members/:memberId",
  authenticateToken,
  validateObjectId("id"),
  validateObjectId("memberId"),
  async (req, res) => {
    try {
      const boardId = req.params.id;
      const memberId = req.params.memberId;
      const userId = req.user.id;

      const boardDoc = await db.collection("boards").doc(boardId).get();

      if (!boardDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Board not found",
        });
      }

      const boardData = boardDoc.data();

      // Check permissions: owner can remove anyone, members can remove themselves
      if (boardData.owner !== userId && memberId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Cannot remove the owner
      if (memberId === boardData.owner) {
        return res.status(400).json({
          success: false,
          message: "Cannot remove board owner",
        });
      }

      // Check if user is a member
      if (!boardData.members.includes(memberId)) {
        return res.status(400).json({
          success: false,
          message: "User is not a member of this board",
        });
      }

      // Remove member from board
      const updatedMembers = boardData.members.filter((id) => id !== memberId);
      await db.collection("boards").doc(boardId).update({
        members: updatedMembers,
        updatedAt: new Date(),
      });

      // Emit real-time event
      req.io.to(`board:${boardId}`).emit("board:member_removed", {
        boardId,
        memberId,
      });

      res.json({
        success: true,
        message: "Member removed successfully",
      });
    } catch (error) {
      console.error("Remove member error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove member",
      });
    }
  }
);

// POST /boards/:id/invite - Invite members to board
router.post(
  "/:id/invite",
  authenticateToken,
  validateObjectId("id"),
  async (req, res) => {
    try {
      const boardId = req.params.id;
      const userId = req.user.id;
      const { invitations } = req.body; // Array of { email, role }

      if (!Array.isArray(invitations) || invitations.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invitations array is required",
        });
      }

      const boardDoc = await db.collection("boards").doc(boardId).get();

      if (!boardDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Board not found",
        });
      }

      const boardData = boardDoc.data();

      // Check if user has admin access to this board
      if (boardData.owner !== userId) {
        return res.status(403).json({
          success: false,
          message: "Only board owner can invite members",
        });
      }

      const results = [];

      for (const invitation of invitations) {
        const { email, role = 'Member' } = invitation;

        try {
          // Find user by email
          const userQuery = await db
            .collection("users")
            .where("email", "==", email)
            .limit(1)
            .get();

          if (userQuery.empty) {
            results.push({
              email,
              success: false,
              message: "User not found",
            });
            continue;
          }

          const userDoc = userQuery.docs[0];
          const userData = userDoc.data();
          const newMemberId = userDoc.id;

          // Check if user is already a member
          if (boardData.members.includes(newMemberId)) {
            results.push({
              email,
              success: false,
              message: "User is already a member",
            });
            continue;
          }

          // Add user to board members
          await db.collection("boards").doc(boardId).update({
            members: [...boardData.members, newMemberId],
            updatedAt: new Date(),
          });

          // Create invitation record (optional for tracking)
          await db.collection("invitations").add({
            boardId,
            inviterId: userId,
            inviteeId: newMemberId,
            email,
            role,
            status: 'accepted', // Since user exists, auto-accept
            createdAt: new Date(),
          });

          // Emit real-time event
          req.io.to(`board:${boardId}`).emit("board:member_added", {
            boardId,
            member: {
              id: newMemberId,
              username: userData.username,
              email: userData.email,
              avatar: userData.avatar,
              role,
            },
          });

          results.push({
            email,
            success: true,
            message: "Invitation sent successfully",
          });

        } catch (error) {
          console.error(`Error inviting ${email}:`, error);
          results.push({
            email,
            success: false,
            message: "Failed to send invitation",
          });
        }
      }

      res.json({
        success: true,
        message: "Invitations processed",
        results,
      });

    } catch (error) {
      console.error("Invite members error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process invitations",
      });
    }
  }
);

// GET /boards/:id/members - Get all members of a board
router.get("/:id/members", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const boardId = req.params.id;

    // Get board
    const boardDoc = await db.collection("boards").doc(boardId).get();

    if (!boardDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const boardData = boardDoc.data();

    // Check if user has access to the board
    if (!boardData.members.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get member details
    const memberPromises = boardData.members.map(async (memberId) => {
      const memberDoc = await db.collection("users").doc(memberId).get();
      if (memberDoc.exists) {
        const memberData = memberDoc.data();
        return {
          id: memberId,
          username: memberData.username,
          email: memberData.email,
          avatar: memberData.avatar,
          isOwner: boardData.owner === memberId,
        };
      }
      return null;
    });

    const members = (await Promise.all(memberPromises)).filter(Boolean);

    res.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("Get board members error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch board members",
    });
  }
});

module.exports = router;
