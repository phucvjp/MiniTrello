// User types
export interface User {
  id: string;
  username: string;
  email: string;
  isEmailVerified: boolean;
  avatar?: string;
  bio?: string;
  preferences: {
    theme: "light" | "dark";
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  createdAt: Date;
  lastLoginAt?: Date;
}

// Auth types
export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

// GitHub OAuth types
export interface GitHubOAuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
  provider: "github";
}

// Board types
export interface Board {
  id: string;
  title: string;
  description: string;
  isPrivate: boolean;
  owner: string;
  members: User[];
  cards?: Card[];
  cardsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBoardRequest {
  title: string;
  description?: string;
  isPrivate?: boolean;
}

// Board member types
export interface BoardMember {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
}

// Card types
export interface Card {
  id: string;
  title: string;
  description: string;
  status: CardStatus;
  priority: CardPriority;
  dueDate?: Date;
  labels?: string[];
  boardId: string;
  assigneeId?: string;
  assignee?: User;
  createdBy: string;
  creator?: User;
  order: number;
  tasks: Task[];
  tasksCount: number;
  completedTasksCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CardStatus = "todo" | "in-progress" | "review" | "done";
export type CardPriority = "low" | "medium" | "high";

export interface CreateCardRequest {
  title: string;
  description?: string;
  status: CardStatus;
  priority?: CardPriority;
  dueDate?: string;
  labels?: string[];
  boardId: string;
  assigneeId?: string;
}

export interface MoveCardRequest {
  status: CardStatus;
  order: number;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  cardId: string;
  boardId: string;
  createdBy: string;
  creator?: User;
  order: number;
  completedAt?: Date;
  completedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  cardId: string;
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  timestamp: Date;
  author: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Socket.IO event types
export interface SocketEvents {
  // Board events
  "board:created": (board: Board) => void;
  "board:updated": (board: Partial<Board> & { id: string }) => void;
  "board:deleted": (data: { id: string }) => void;
  "board:member_added": (data: { boardId: string; member: User }) => void;
  "board:member_removed": (data: { boardId: string; memberId: string }) => void;

  // Card events
  "card:created": (card: Card) => void;
  "card:updated": (card: Card) => void;
  "card:deleted": (data: { id: string; boardId: string }) => void;
  "card:moved": (data: {
    id: string;
    boardId: string;
    oldStatus: CardStatus;
    newStatus: CardStatus;
    order: number;
    movedBy: { id: string; username: string };
  }) => void;

  // Task events
  "task:created": (task: Task & { cardId: string }) => void;
  "task:updated": (task: Task & { cardId: string }) => void;
  "task:deleted": (data: {
    id: string;
    cardId: string;
    boardId: string;
  }) => void;
  "task:toggled": (
    task: Task & {
      cardId: string;
      toggledBy: { id: string; username: string };
    }
  ) => void;
  "task:reordered": (data: {
    id: string;
    cardId: string;
    order: number;
    reorderedBy: { id: string; username: string };
  }) => void;

  // User events
  "user:typing": (data: {
    userId: string;
    username: string;
    boardId: string;
    isTyping: boolean;
  }) => void;
  "user:joined": (data: {
    userId: string;
    username: string;
    boardId: string;
  }) => void;
  "user:left": (data: { userId: string; boardId: string }) => void;
}

// Drag and Drop types
export interface DragItem {
  type: "card";
  id: string;
  status: CardStatus;
  order: number;
}

export interface DropResult {
  status: CardStatus;
  order: number;
}

// Context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  loginWithGitHub: () => void;
  handleOAuthCallback: (token: string, provider: string) => Promise<void>;
}

export interface SocketContextType {
  socket: any | null;
  connected: boolean;
  joinBoard: (boardId: string) => void;
  leaveBoard: (boardId: string) => void;
  emitTyping: (boardId: string, isTyping: boolean) => void;
}

// Theme types
export interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

// Error types
export interface ErrorState {
  message: string;
  type: "error" | "warning" | "info" | "success";
  timestamp: Date;
}

// Loading states
export interface LoadingState {
  boards: boolean;
  cards: boolean;
  tasks: boolean;
  auth: boolean;
  global: boolean;
}

// Form types
export interface FormErrors {
  [key: string]: string;
}

export interface FormState<T> {
  data: T;
  errors: FormErrors;
  loading: boolean;
  dirty: boolean;
}
