import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  InputBase,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CreateBoardDialog from '../Board/CreateBoardDialog';
import { Board } from '../../types';

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleClose();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleDashboard = () => {
    navigate('/dashboard');
    handleClose();
  };

  const handleBoardCreated = (board: Board) => {
    // Navigate to the newly created board
    navigate(`/board/${board.id}`);
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={1}
      sx={{ 
        bgcolor: '#0079bf',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important' }}>
        {/* Left Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            color="inherit"
            onClick={handleDashboard}
            sx={{ 
              p: 1,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <HomeIcon />
          </IconButton>

          <Typography
            variant="h6"
            component="div"
            sx={{ 
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '1.2rem',
              mr: 2,
            }}
            onClick={handleDashboard}
          >
            Mini Trello
          </Typography>

          <Button
            color="inherit"
            onClick={handleDashboard}
            sx={{ 
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Boards
          </Button>
        </Box>

        {/* Center - Search */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', mx: 3 }}>
          <Box
            sx={{
              position: 'relative',
              borderRadius: 3,
              backgroundColor: alpha('#ffffff', 0.15),
              '&:hover': {
                backgroundColor: alpha('#ffffff', 0.25),
              },
              maxWidth: 400,
              width: '100%',
            }}
          >
            <Box
              sx={{
                padding: 2,
                height: '100%',
                position: 'absolute',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
            </Box>
            <InputBase
              placeholder="Search boards, cards, and members..."
              sx={{
                color: 'inherit',
                width: '100%',
                '& .MuiInputBase-input': {
                  padding: 1,
                  paddingLeft: 6,
                  transition: 'width 0.3s',
                  width: '100%',
                },
              }}
            />
          </Box>
        </Box>

        {/* Right Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Create new board">
            <IconButton
              color="inherit"
              onClick={() => setCreateDialogOpen(true)}
              sx={{ 
                p: 1,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              sx={{ 
                p: 1,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <NotificationsIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Account settings">
            <IconButton onClick={handleMenu} sx={{ p: 0, ml: 1 }}>
              <Avatar
                alt={user?.username}
                src={user?.avatar}
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: '#ffffff',
                  color: '#0079bf',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            onClick={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2,
                minWidth: 180,
              }
            }}
          >
            <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ width: 24, height: 24, mr: 2, fontSize: '0.75rem' }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </Avatar>
                Profile
              </Box>
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
      
      {/* Create Board Dialog */}
      <CreateBoardDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onBoardCreated={handleBoardCreated}
      />
    </AppBar>
  );
}

export default Navbar;
