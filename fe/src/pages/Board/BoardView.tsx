import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
  IconButton,
  Avatar,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Stack,
} from "@mui/material";
import {
  Add as AddIcon,
  MoreHoriz as MoreIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Share as ShareIcon,
  FilterList as FilterIcon,
  AccessTime as TimeIcon,
  Chat as CommentIcon,
  Attachment as AttachmentIcon,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { Board, CardStatus, CardPriority } from "../../types";
import { apiService } from "../../services/api";
import { useBoardSocket } from "../../contexts/SocketContext";
import TaskDetailPopup from "../../components/Board/TaskDetailPopup";
import toast from "react-hot-toast";

function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [addCardDialogOpen, setAddCardDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDescription, setNewCardDescription] = useState("");
  const [newCardPriority, setNewCardPriority] =
    useState<CardPriority>("medium");
  const [newCardAssignee, setNewCardAssignee] = useState("");
  const [newCardLabels, setNewCardLabels] = useState<string[]>([]);
  const [newCardDueDate, setNewCardDueDate] = useState<string>("");
  const [newLabel, setNewLabel] = useState("");
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [teamInviteOpen, setTeamInviteOpen] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [boardMembers, setBoardMembers] = useState<any[]>([]);

  const drawerWidth = 320;

  // Column definitions matching backend status values
  const columns = [
    { id: "todo", title: "To Do", status: "todo" as CardStatus },
    {
      id: "in-progress",
      title: "In Progress",
      status: "in-progress" as CardStatus,
    },
    { id: "review", title: "Review", status: "review" as CardStatus },
    { id: "done", title: "Done", status: "done" as CardStatus },
  ];

  // Connect to board socket
  const { socket } = useBoardSocket(boardId || null);

  useEffect(() => {
    if (boardId) {
      loadBoard();
      loadCards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  // Listen for real-time card movement events
  useEffect(() => {
    if (socket && boardId) {
      const handleCardMoved = (data: any) => {
        console.log("Card moved event received:", data);
        // Reload cards to get the updated positions
        loadCards();
        toast.success(`Card moved by ${data.movedBy.username}`);
      };

      socket.on("card:moved", handleCardMoved);

      return () => {
        socket.off("card:moved", handleCardMoved);
      };
    }
  }, [socket, boardId]);

  const loadBoard = async () => {
    if (!boardId) return;

    try {
      setLoading(true);
      const response = await apiService.getBoard(boardId);
      setBoard(response.board);
      setMembers(response.board.members || []);

      // Load board members for assignee dropdown
      await loadBoardMembers();
    } catch (err: any) {
      setError(err.message || "Failed to load board");
    } finally {
      setLoading(false);
    }
  };

  const loadBoardMembers = async () => {
    if (!boardId) return;

    try {
      const response = await apiService.getBoardMembers(boardId);
      setBoardMembers(response.members || []);
    } catch (err: any) {
      console.error("Failed to load board members:", err);
    }
  };

  const loadCards = async () => {
    if (!boardId) return;

    try {
      const response = await apiService.getCards(boardId);
      if (response.success) {
        setCards(response.cards || []);
      }
    } catch (err: any) {
      console.error("Failed to load cards:", err);
    }
  };

  const getCardsForColumn = (status: CardStatus) => {
    return cards.filter((card) => card.status === status);
  };

  const handleAddCard = async () => {
    if (!newCardTitle.trim() || !selectedColumn || !boardId || creating) return;

    try {
      setCreating(true);
      const response = await apiService.createCard({
        title: newCardTitle,
        boardId,
        status: selectedColumn as CardStatus,
        description: newCardDescription,
        priority: newCardPriority as CardPriority,
        assigneeId: newCardAssignee || undefined,
        labels: newCardLabels,
        dueDate: newCardDueDate
          ? new Date(newCardDueDate).toISOString()
          : undefined,
      });

      if (response.success) {
        await loadCards(); // Reload cards to get updated list
        setNewCardTitle("");
        setNewCardDescription("");
        setNewCardPriority("medium");
        setNewCardAssignee("");
        setNewCardLabels([]);
        setNewCardDueDate("");
        setNewLabel("");
        setAddCardDialogOpen(false);
        setSelectedColumn("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create card");
    } finally {
      setCreating(false);
    }
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !newCardLabels.includes(newLabel.trim())) {
      setNewCardLabels([...newCardLabels, newLabel.trim()]);
      setNewLabel("");
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setNewCardLabels(newCardLabels.filter((label) => label !== labelToRemove));
  };

  const handleTaskUpdate = (updatedTask: any) => {
    setSelectedTask(updatedTask);
    loadCards(); // Refresh the cards list
  };

  const handleTaskDelete = (taskId: string) => {
    // Remove the task from local state
    setCards((prevCards) => prevCards.filter((card) => card.id !== taskId));
    setSelectedTask(null);
  };

  const handleMoveCard = async (
    cardId: string,
    newStatus: CardStatus,
    newOrder: number
  ) => {
    try {
      const response = await apiService.moveCard(cardId, {
        status: newStatus,
        order: newOrder,
      });

      if (response.success) {
        // Don't show success toast or reload cards here -
        // the socket event will handle both the update and notification
      }
    } catch (error) {
      toast.error("Failed to move card");
      // On error, reload to get the correct state
      loadCards();
    }
  };

  const handleCardClick = (card: any) => {
    setSelectedTask({
      ...card,
      labels: card.labels || [],
      comments: card.comments || [],
      attachments: card.attachments || [],
      dueDate: card.dueDate,
    });
    setTaskDetailOpen(true);
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || inviting || !boardId) return;

    try {
      setInviting(true);
      const response = await apiService.addBoardMember(
        boardId,
        inviteEmail.trim()
      );

      if (response.success) {
        setTeamInviteOpen(false);
        setInviteEmail("");
        // Optionally, you can show a success message or update the members list
        await loadBoardMembers();
      } else {
        toast.error(response.message || "Failed to invite member");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to invite member");
    } finally {
      setInviting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!board) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">Board not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", bgcolor: "#f5f6fa", minHeight: "100vh" }}>
      {/* Board Header */}
      <Box
        sx={{
          position: "fixed",
          top: 64, // Account for main navbar
          left: 0,
          right: sidebarOpen ? drawerWidth : 0,
          height: 60,
          bgcolor: "white",
          borderBottom: "1px solid #e0e6ed",
          display: "flex",
          alignItems: "center",
          px: 3,
          zIndex: 1100,
          transition: "right 0.3s ease",
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: "#172b4d", mr: 2 }}
        >
          {board.title}
        </Typography>

        <IconButton size="small" sx={{ mr: 1 }}>
          <StarIcon />
        </IconButton>

        <Button
          startIcon={<PersonIcon />}
          onClick={() => setTeamInviteOpen(true)}
          sx={{ mr: "auto", textTransform: "none" }}
        >
          Members
        </Button>
        {/* 
        <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
          <MoreIcon />
        </IconButton> */}
      </Box>

      {/* Main Board Content */}
      <Box
        sx={{
          flexGrow: 1,
          mt: 15, // Account for header
          p: 3,
          mr: sidebarOpen ? `${drawerWidth}px` : 0,
          transition: "margin-right 0.3s ease",
        }}
      >
        {/* Kanban Columns */}
        <Box
          sx={{
            display: "flex",
            gap: 3,
            overflowX: "auto",
            pb: 2,
            "&::-webkit-scrollbar": {
              height: 8,
            },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: 4,
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#c1c1c1",
              borderRadius: 4,
            },
          }}
        >
          {columns.map((column) => {
            const columnCards = getCardsForColumn(column.status);
            return (
              <Box
                key={column.id}
                sx={{
                  minWidth: 300,
                  maxWidth: 300,
                  bgcolor: "#f1f2f4",
                  borderRadius: 3,
                  p: 2,
                  maxHeight: "calc(100vh - 200px)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Column Header */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#172b4d", flexGrow: 1 }}
                  >
                    {column.title}
                  </Typography>
                  <Chip
                    label={columnCards.length}
                    size="small"
                    sx={{
                      bgcolor: "#ddd",
                      color: "#666",
                      fontWeight: 600,
                      mr: 1,
                    }}
                  />
                  <IconButton size="small">
                    <MoreIcon />
                  </IconButton>
                </Box>

                {/* Cards */}
                <Box sx={{ flexGrow: 1, overflowY: "auto", mb: 2 }}>
                  {columnCards.map((card) => (
                    <Card
                      key={card.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("cardId", card.id);
                        e.dataTransfer.setData("sourceStatus", card.status);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const cardId = e.dataTransfer.getData("cardId");
                        const sourceStatus =
                          e.dataTransfer.getData("sourceStatus");

                        if (
                          cardId &&
                          cardId !== card.id &&
                          sourceStatus !== column.status
                        ) {
                          handleMoveCard(
                            cardId,
                            column.status as CardStatus,
                            card.order
                          );
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onClick={() => handleCardClick(card)}
                      sx={{
                        mb: 2,
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
                          transform: "translateY(-1px)",
                        },
                        '&:hover[draggable="true"]': {
                          cursor: "grab",
                        },
                        '&:active[draggable="true"]': {
                          cursor: "grabbing",
                          opacity: 0.8,
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        {/* Card Title */}
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          {card.title}
                        </Typography>

                        {/* Card Description */}
                        {card.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mb: 2,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {card.description}
                          </Typography>
                        )}

                        {/* Labels/Tags */}
                        {card.labels && card.labels.length > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              mb: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            {card.labels.map((label: any, index: number) => (
                              <Chip
                                key={index}
                                label={label.name || label}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.7rem",
                                  bgcolor: label.color || "#e0e0e0",
                                  color: "#fff",
                                }}
                              />
                            ))}
                          </Box>
                        )}

                        {/* Due Date */}
                        {card.dueDate && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              mb: 1,
                            }}
                          >
                            <TimeIcon
                              sx={{ fontSize: 14, color: "text.secondary" }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(card.dueDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}

                        {/* Bottom Row: Priority, Comments, Attachments, Assignee */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mt: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {/* Priority */}
                            {card.priority && (
                              <Chip
                                label={card.priority}
                                size="small"
                                color={getPriorityColor(card.priority) as any}
                                sx={{ fontSize: "0.7rem", height: 20 }}
                              />
                            )}

                            {/* Comments Count */}
                            {card.comments && card.comments.length > 0 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.25,
                                }}
                              >
                                <CommentIcon
                                  sx={{ fontSize: 14, color: "text.secondary" }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {card.comments.length}
                                </Typography>
                              </Box>
                            )}

                            {/* Attachments Count */}
                            {card.attachments &&
                              card.attachments.length > 0 && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.25,
                                  }}
                                >
                                  <AttachmentIcon
                                    sx={{
                                      fontSize: 14,
                                      color: "text.secondary",
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {card.attachments.length}
                                  </Typography>
                                </Box>
                              )}
                          </Box>

                          {/* Assignee and Creator */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            {/* Creator (small avatar) */}
                            {card.creator && (
                              <Avatar
                                sx={{
                                  width: 20,
                                  height: 20,
                                  fontSize: "0.6rem",
                                  bgcolor: "grey.400",
                                }}
                                title={`Created by: ${
                                  card.creator.name ||
                                  card.creator.username ||
                                  card.creator.email
                                }`}
                              >
                                {(
                                  card.creator.name ||
                                  card.creator.username ||
                                  card.creator.email
                                )
                                  ?.charAt(0)
                                  ?.toUpperCase()}
                              </Avatar>
                            )}

                            {/* Assignee (main avatar) */}
                            {card.assignee && (
                              <Avatar
                                sx={{
                                  width: 28,
                                  height: 28,
                                  fontSize: "0.75rem",
                                  bgcolor: "primary.main",
                                }}
                                title={`Assigned to: ${
                                  card.assignee.name ||
                                  card.assignee.username ||
                                  card.assignee.email
                                }`}
                              >
                                {(
                                  card.assignee.name ||
                                  card.assignee.username ||
                                  card.assignee.email
                                )
                                  ?.charAt(0)
                                  ?.toUpperCase()}
                              </Avatar>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Drop Zone for empty area */}
                  <Box
                    onDrop={(e) => {
                      e.preventDefault();
                      const cardId = e.dataTransfer.getData("cardId");
                      const sourceStatus =
                        e.dataTransfer.getData("sourceStatus");

                      if (cardId && sourceStatus !== column.status) {
                        // Move to the end of this column
                        const newOrder = columnCards.length;
                        handleMoveCard(
                          cardId,
                          column.status as CardStatus,
                          newOrder
                        );
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    sx={{
                      minHeight: columnCards.length === 0 ? 100 : 20,
                      border: "2px dashed transparent",
                      borderRadius: 1,
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        borderColor: "primary.main",
                        backgroundColor: "action.hover",
                      },
                      mb: 1,
                    }}
                  >
                    {columnCards.length === 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          textAlign: "center",
                          py: 3,
                          fontStyle: "italic",
                        }}
                      >
                        Drop cards here
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Add Card Button */}
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedColumn(column.status);
                    setAddCardDialogOpen(true);
                  }}
                  sx={{
                    justifyContent: "flex-start",
                    color: "#666",
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: "#e4e6ea",
                    },
                  }}
                >
                  Add a card
                </Button>
              </Box>
            );
          })}

          {/* Add Column Button */}
          <Box
            sx={{
              minWidth: 300,
              maxWidth: 300,
              bgcolor: "rgba(255,255,255,0.5)",
              borderRadius: 3,
              p: 2,
              border: "2px dashed #ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.8)",
                borderColor: "primary.main",
              },
            }}
          >
            <Button
              startIcon={<AddIcon />}
              sx={{ textTransform: "none", color: "#666" }}
            >
              Add another list
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Members Sidebar */}
      <Drawer
        anchor="right"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        variant="persistent"
        sx={{
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#ffffff",
            borderLeft: "1px solid #e0e6ed",
            mt: 8, // Account for top navbar
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
              Board Members
            </Typography>
            <Button
              variant="contained"
              size="small"
              sx={{ textTransform: "none" }}
            >
              Invite
            </Button>
          </Box>

          <List>
            {members.map((member) => (
              <ListItem key={member.id} sx={{ px: 0, py: 1 }}>
                <ListItemAvatar>
                  <Avatar sx={{ width: 40, height: 40 }}>
                    {(member.name || member.username)?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.name || member.username}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {member.email}
                      </Typography>
                      <Chip
                        label={member.role || "Member"}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5, height: 20, fontSize: "0.7rem" }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            BOARD SETTINGS
          </Typography>
          <List dense>
            <ListItemButton>
              <ListItemText primary="Change background" />
            </ListItemButton>
            <ListItemButton>
              <ListItemText primary="Board settings" />
            </ListItemButton>
            <ListItemButton>
              <ListItemText primary="Archive board" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* Board Menu */}
      {/* <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setMenuAnchor(null)}>Board settings</MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          Change background
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>Export board</MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>Archive board</MenuItem>
      </Menu> */}

      {/* Add Card Dialog */}
      <Dialog
        open={addCardDialogOpen}
        onClose={() => setAddCardDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Card</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Card Title"
            fullWidth
            variant="outlined"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newCardDescription}
            onChange={(e) => setNewCardDescription(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Priority"
            fullWidth
            select
            variant="outlined"
            value={newCardPriority}
            onChange={(e) => setNewCardPriority(e.target.value as CardPriority)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>

          <TextField
            margin="dense"
            label="Assignee"
            fullWidth
            select
            variant="outlined"
            value={newCardAssignee}
            onChange={(e) => setNewCardAssignee(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="">Unassigned</MenuItem>
            {boardMembers.map((member) => (
              <MenuItem key={member.id} value={member.id}>
                {member.username}
              </MenuItem>
            ))}
          </TextField>

          {/* Labels Section */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Labels
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
            {newCardLabels.map((label, index) => (
              <Chip
                key={label}
                label={label}
                size="small"
                onDelete={() => handleRemoveLabel(label)}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Add label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddLabel();
                }
              }}
            />
            <Button onClick={handleAddLabel} disabled={!newLabel.trim()}>
              Add
            </Button>
          </Box>

          {/* Due Date Section */}
          <TextField
            label="Due Date"
            type="date"
            value={newCardDueDate}
            onChange={(e) => setNewCardDueDate(e.target.value)}
            fullWidth
            margin="dense"
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddCardDialogOpen(false);
              setNewCardTitle("");
              setNewCardDescription("");
              setNewCardPriority("medium");
              setNewCardAssignee("");
              setNewCardLabels([]);
              setNewCardDueDate("");
              setNewLabel("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddCard}
            variant="contained"
            disabled={creating || !newCardTitle.trim()}
          >
            {creating ? "Creating..." : "Add Card"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Member Invite Dialog */}
      <Dialog
        open={teamInviteOpen}
        onClose={() => setTeamInviteOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            onChange={(e) => setInviteEmail(e.target.value)}
            value={inviteEmail}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Current Members:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
            {members.map((member) => (
              <Chip
                key={member.id}
                label={member.email}
                size="small"
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setTeamInviteOpen(false);
              setInviteEmail("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInviteMember}
            variant="contained"
            disabled={inviting || !inviteEmail.trim()}
          >
            {inviting ? "Inviting..." : "Send Invite"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Detail Popup */}
      <TaskDetailPopup
        open={taskDetailOpen}
        onClose={() => setTaskDetailOpen(false)}
        task={selectedTask}
        boardMembers={boardMembers}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
      />
    </Box>
  );
}

export default BoardView;
