import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  CircularProgress,
} from '@mui/material';
import { CreateBoardRequest, Board } from '../../types';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface CreateBoardDialogProps {
  open: boolean;
  onClose: () => void;
  onBoardCreated?: (board: Board) => void;
}

function CreateBoardDialog({ open, onClose, onBoardCreated }: CreateBoardDialogProps) {
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreateBoardRequest>({
    title: '',
    description: '',
    isPrivate: false,
  });

  const handleClose = () => {
    if (!creating) {
      setFormData({ title: '', description: '', isPrivate: false });
      onClose();
    }
  };

  const handleCreateBoard = async () => {
    if (!formData.title.trim()) return;

    try {
      setCreating(true);
      const response = await apiService.createBoard(formData);
      
      if (response.success && response.board) {
        toast.success('Board created successfully!');
        onBoardCreated?.(response.board);
        handleClose();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create board');
    } finally {
      setCreating(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey && formData.title.trim()) {
      event.preventDefault();
      handleCreateBoard();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>Create New Board</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Board Title"
          fullWidth
          variant="outlined"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          onKeyPress={handleKeyPress}
          disabled={creating}
          sx={{ mb: 2 }}
          placeholder="Enter board title..."
        />
        <TextField
          margin="dense"
          label="Description (Optional)"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          disabled={creating}
          sx={{ mb: 2 }}
          placeholder="Add a description for your board..."
        />
        <FormControlLabel
          control={
            <Switch
              checked={formData.isPrivate}
              onChange={(e) =>
                setFormData({ ...formData, isPrivate: e.target.checked })
              }
              disabled={creating}
            />
          }
          label="Private Board"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleClose} 
          disabled={creating}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateBoard}
          variant="contained"
          disabled={!formData.title.trim() || creating}
          sx={{ 
            textTransform: 'none',
            minWidth: 100,
          }}
        >
          {creating ? <CircularProgress size={20} color="inherit" /> : 'Create Board'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateBoardDialog;
