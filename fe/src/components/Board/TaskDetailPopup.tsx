import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Avatar,
  Chip,
  TextField,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  DialogTitle,
} from "@mui/material";
import {
  Close as CloseIcon,
  CreditCard as CardIcon,
  Person as PersonIcon,
  Label as LabelIcon,
  Schedule as ScheduleIcon,
  AttachFile as AttachFileIcon,
  Archive as ArchiveIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import { apiService } from "../../services/api";
import { BoardMember, Card as CardType } from "../../types";

interface TaskDetailProps {
  open: boolean;
  onClose: () => void;
  task?: CardType;
  boardMembers?: BoardMember[];
  onTaskUpdate?: (updatedTask: CardType) => void;
  onTaskDelete?: (taskId: string) => void;
}

function TaskDetailPopup({
  open,
  onClose,
  task,
  boardMembers = [],
  onTaskUpdate,
  onTaskDelete,
}: TaskDetailProps) {
  const [newComment, setNewComment] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState(task?.description || "");
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Editing states
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [editingLabels, setEditingLabels] = useState(false);
  const [editingPriority, setEditingPriority] = useState(false);

  // Form states
  const [title, setTitle] = useState(task?.title || "");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || "");
  const [dueDate, setDueDate] = useState<string>(() => {
    if (!task?.dueDate) return "";
    try {
      const date = new Date(task.dueDate);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  });
  const [labels, setLabels] = useState<string[]>(task?.labels || []);
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [newLabel, setNewLabel] = useState("");

  // Load comments when task changes
  useEffect(() => {
    if (task && open) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setAssigneeId(task.assigneeId || "");

      // Safe date handling
      let dateStr = "";
      if (task.dueDate) {
        try {
          const date = new Date(task.dueDate);
          if (!isNaN(date.getTime())) {
            dateStr = date.toISOString().split("T")[0];
          }
        } catch {
          // Invalid date, keep empty string
        }
      }
      setDueDate(dateStr);

      setLabels(task.labels || []);
      setPriority(task.priority || "medium");
      loadComments();
    }
  }, [task, open]);

  const loadComments = async () => {
    if (!task?.id) return;

    try {
      const response = await apiService.getCardComments(task.id);
      setComments(response.comments || []);
    } catch (error) {
      toast.error("Failed to load comments");
    }
  };

  const updateCard = async (updateData: any) => {
    if (!task?.id) return;

    try {
      const response = await apiService.updateCard(task.id, updateData);
      if (response.success && onTaskUpdate) {
        onTaskUpdate(response.card);
      }
      return response.success;
    } catch (error) {
      toast.error("Failed to update card");
      return false;
    }
  };

  const handleSaveTitle = async () => {
    if (loading) return; // Prevent duplicate submissions

    setLoading(true);
    const success = await updateCard({ title });
    if (success) {
      setEditingTitle(false);
    }
    setLoading(false);
  };

  const handleSaveAssignee = async () => {
    if (loading) return; // Prevent duplicate submissions

    try {
      setLoading(true);
      const response = await apiService.assignCard(
        task?.id || "",
        assigneeId || null
      );
      if (response.success && onTaskUpdate) {
        onTaskUpdate(response.card);
      }
      setEditingAssignee(false);
    } catch (error) {
      toast.error("Failed to assign card");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDueDate = async () => {
    if (loading) return; // Prevent duplicate submissions

    setLoading(true);
    const success = await updateCard({
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    });
    if (success) {
      setEditingDueDate(false);
    }
    setLoading(false);
  };

  const handleSaveLabels = async () => {
    const success = await updateCard({ labels });
    if (success) {
      setEditingLabels(false);
    }
  };

  const handleSavePriority = async () => {
    const success = await updateCard({ priority });
    if (success) {
      setEditingPriority(false);
    }
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()]);
      setNewLabel("");
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter((label) => label !== labelToRemove));
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !task?.id) return;

    setLoading(true);
    try {
      const response = await apiService.addCardComment(
        task.id,
        newComment.trim()
      );
      if (response.success) {
        setNewComment("");
        await loadComments(); // Reload comments
      }
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!task?.id) return;

    try {
      const response = await apiService.deleteCardComment(task.id, commentId);
      if (response.success) {
        await loadComments(); // Reload comments
      }
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const handleDeleteCard = async () => {
    if (!task?.id) return;

    if (!window.confirm("Are you sure you want to delete this card? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.deleteCard(task.id);
      if (response.success) {
        toast.success("Card deleted successfully");
        if (onTaskDelete) {
          onTaskDelete(task.id);
        }
        onClose();
      }
    } catch (error) {
      toast.error("Failed to delete card");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDescription = async () => {
    const success = await updateCard({ description });
    if (success) {
      setEditingDescription(false);
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

  const getLabelColor = (index: number) => {
    const colors = [
      "primary",
      "secondary",
      "success",
      "warning",
      "error",
      "info",
    ];
    return colors[index % colors.length];
  };

  if (!task) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", mb: 3 }}>
          <CardIcon sx={{ mr: 2, mt: 0.5, color: "text.secondary" }} />
          <Box sx={{ flex: 1 }}>
            {editingTitle ? (
              <Box sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  sx={{ mb: 1 }}
                  autoFocus
                />
                <Box>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSaveTitle}
                    sx={{ mr: 1 }}
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setTitle(task.title);
                      setEditingTitle(false);
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, flex: 1 }}>
                  {task.title}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setEditingTitle(true)}
                  sx={{ ml: 1 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
            <Typography variant="body2" color="text.secondary">
              in list <strong>{task.status}</strong>
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ ml: 2 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: "flex", height: "85vh" }}>
          {/* Main Content */}
          <Box sx={{ flex: 1, p: 3, overflowY: "auto" }}>
            {/* Labels and Priority */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ flex: 1 }}
                >
                  LABELS & PRIORITY
                </Typography>
                <IconButton size="small" onClick={() => setEditingLabels(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>

              {editingLabels ? (
                <Box sx={{ mb: 2 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mb: 2, flexWrap: "wrap" }}
                  >
                    {labels.map((label, index) => (
                      <Chip
                        key={label}
                        label={label}
                        size="small"
                        color={getLabelColor(index) as any}
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
                    <Button
                      onClick={handleAddLabel}
                      disabled={!newLabel.trim()}
                    >
                      Add
                    </Button>
                  </Box>

                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      label="Priority"
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                  </FormControl>

                  <Box>
                    <Button
                      variant="contained"
                      onClick={handleSaveLabels}
                      sx={{ mr: 1 }}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setLabels(task.labels || []);
                        setPriority(task.priority || "medium");
                        setNewLabel("");
                        setEditingLabels(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {(task.labels || []).map((label, index) => (
                    <Chip
                      key={label}
                      label={label}
                      size="small"
                      color={getLabelColor(index) as any}
                      sx={{ mb: 1 }}
                    />
                  ))}
                  <Chip
                    label={task.priority}
                    size="small"
                    color={getPriorityColor(task.priority) as any}
                    sx={{ mb: 1 }}
                  />
                </Box>
              )}
            </Box>

            {/* Description */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                DESCRIPTION
              </Typography>
              {editingDescription ? (
                <Box>
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Box>
                    <Button
                      variant="contained"
                      onClick={handleSaveDescription}
                      sx={{ mr: 1 }}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setDescription(task.description || "");
                        setEditingDescription(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Card
                  sx={{
                    bgcolor: "#f8f9fa",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#e9ecef" },
                  }}
                  onClick={() => setEditingDescription(true)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="body2">
                      {task.description || "Add a description..."}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Activity/Comments */}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                ACTIVITY
              </Typography>

              {/* Add Comment */}
              <Box sx={{ display: "flex", mb: 3 }}>
                <Avatar sx={{ mr: 2, width: 32, height: 32 }}>U</Avatar>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    placeholder="Write a comment..."
                    multiline
                    rows={3}
                    fullWidth
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || loading}
                  >
                    {loading ? "Adding..." : "Comment"}
                  </Button>
                </Box>
              </Box>

              {/* Comments List */}
              <List>
                {comments &&
                  comments?.map((comment) => (
                    <ListItem
                      key={comment?.id}
                      alignItems="flex-start"
                      sx={{ px: 0 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {comment?.author?.username?.charAt(0) || "?"}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, mr: 1 }}
                            >
                              {comment?.author?.username || "Unknown"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(
                                comment?.timestamp?.seconds
                                  ? comment.timestamp.seconds * 1000
                                  : comment.timestamp
                              ).toLocaleString()}
                            </Typography>
                            <Box sx={{ ml: "auto" }}>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteComment(comment.id)}
                                sx={{
                                  opacity: 0.6,
                                  "&:hover": { opacity: 1 },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Paper sx={{ p: 2, bgcolor: "#f8f9fa" }}>
                            <Typography variant="body2">
                              {comment.content}
                            </Typography>
                          </Paper>
                        }
                      />
                    </ListItem>
                  ))}
                {comments.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 2 }}
                  >
                    No comments yet. Be the first to comment!
                  </Typography>
                )}
              </List>
            </Box>
          </Box>

          {/* Sidebar */}
          <Box
            sx={{
              width: 200,
              // bgcolor: "#f8f9fa",
              p: 2,
              borderLeft: "1px solid #e0e6ed",
            }}
          >
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              ACTIONS
            </Typography>

            <Button
              fullWidth
              startIcon={<CopyIcon />}
              sx={{
                justifyContent: "flex-start",
                mb: 1,
                color: "text.primary",
                textTransform: "none",
              }}
            >
              Copy
            </Button>

            <Button
              fullWidth
              startIcon={<ArchiveIcon />}
              sx={{
                justifyContent: "flex-start",
                mb: 1,
                color: "text.primary",
                textTransform: "none",
              }}
            >
              Archive
            </Button>

            <Button
              fullWidth
              startIcon={<DeleteIcon />}
              onClick={handleDeleteCard}
              disabled={loading}
              sx={{
                justifyContent: "flex-start",
                mb: 1,
                color: "error.main",
                textTransform: "none",
              }}
            >
              Delete
            </Button>

            {/* Card Info */}
            <Divider sx={{ my: 2 }} />

            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              ASSIGNED TO
            </Typography>

            {editingAssignee ? (
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Assignee</InputLabel>
                  <Select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    label="Assignee"
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {boardMembers.map((member) => (
                      <MenuItem key={member.id} value={member.id}>
                        {member.username}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSaveAssignee}
                    sx={{ mr: 1 }}
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setAssigneeId(task.assigneeId || "");
                      setEditingAssignee(false);
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  sx={{ width: 24, height: 24, mr: 1, fontSize: "0.75rem" }}
                >
                  {task.assignee?.username?.charAt(0) || "U"}
                </Avatar>
                <Typography variant="body2">
                  {task.assignee?.username || "Unassigned"}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setEditingAssignee(true)}
                  sx={{ ml: 1 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            )}

            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              DUE DATE
            </Typography>

            {editingDueDate ? (
              <Box sx={{ mb: 2 }}>
                <TextField
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  size="small"
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSaveDueDate}
                    sx={{ mr: 1 }}
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      // Safe date reset
                      let dateStr = "";
                      if (task?.dueDate) {
                        try {
                          const date = new Date(task.dueDate);
                          if (!isNaN(date.getTime())) {
                            dateStr = date.toISOString().split("T")[0];
                          }
                        } catch {
                          // Invalid date, keep empty string
                        }
                      }
                      setDueDate(dateStr);
                      setEditingDueDate(false);
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "No due date"}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setEditingDueDate(true)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default TaskDetailPopup;
