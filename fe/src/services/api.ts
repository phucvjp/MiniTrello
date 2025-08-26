import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  Board,
  Card,
  Task,
  Comment,
  BoardMember,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  CreateBoardRequest,
  CreateCardRequest,
  CreateTaskRequest,
  MoveCardRequest,
  ApiResponse,
  PaginatedResponse
} from '../types';

// Create axios instance with base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Helper method to handle API responses
  private handleResponse<T>(response: AxiosResponse<T>): T {
    return response.data;
  }

  // Helper method to handle API errors
  private handleError(error: any): never {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }

  // Health check
  async healthCheck(): Promise<any> {
    try {
      const response = await this.api.get('/health');
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/signin', credentials);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/signup', credentials);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getCurrentUser(): Promise<{ success: boolean; user: User }> {
    try {
      const response = await this.api.get<{ success: boolean; user: User }>('/auth/me');
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.post<{ success: boolean; message: string }>('/auth/logout');
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async verifyKey(data: { email: string; verificationKey: string }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.post<{ success: boolean; message: string }>('/auth/verify-key', data);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.post<{ success: boolean; message: string }>('/auth/resend-verification', { email });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Board endpoints
  async getBoards(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Board>> {
    try {
      const response = await this.api.get<PaginatedResponse<Board>>('/boards', { params });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getBoard(boardId: string): Promise<{ success: boolean; board: Board }> {
    try {
      const response = await this.api.get<{ success: boolean; board: Board }>(`/boards/${boardId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async createBoard(boardData: CreateBoardRequest): Promise<{ success: boolean; board: Board; message: string }> {
    try {
      const response = await this.api.post<{ success: boolean; board: Board; message: string }>('/boards', boardData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateBoard(boardId: string, boardData: Partial<CreateBoardRequest>): Promise<{ success: boolean; board: Board; message: string }> {
    try {
      const response = await this.api.put<{ success: boolean; board: Board; message: string }>(`/boards/${boardId}`, boardData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteBoard(boardId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.delete<{ success: boolean; message: string }>(`/boards/${boardId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async addBoardMember(boardId: string, email: string): Promise<{ success: boolean; member: User; message: string }> {
    try {
      const response = await this.api.post<{ success: boolean; member: User; message: string }>(`/boards/${boardId}/members`, { email });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async removeBoardMember(boardId: string, memberId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.delete<{ success: boolean; message: string }>(`/boards/${boardId}/members/${memberId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async inviteBoardMembers(boardId: string, invitations: { email: string; role: string }[]): Promise<{ success: boolean; results: any[]; message: string }> {
    try {
      const response = await this.api.post<{ success: boolean; results: any[]; message: string }>(`/boards/${boardId}/invite`, { invitations });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Card endpoints
  async getCards(boardId: string, status?: string): Promise<{ success: boolean; cards: Card[] }> {
    try {
      const params = { boardId, ...(status && { status }) };
      const response = await this.api.get<{ success: boolean; cards: Card[] }>('/cards', { params });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getCard(cardId: string): Promise<{ success: boolean; card: Card }> {
    try {
      const response = await this.api.get<{ success: boolean; card: Card }>(`/cards/${cardId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async createCard(cardData: CreateCardRequest): Promise<{ success: boolean; card: Card; message: string }> {
    try {
      const response = await this.api.post<{ success: boolean; card: Card; message: string }>('/cards', cardData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateCard(cardId: string, cardData: Partial<CreateCardRequest>): Promise<{ success: boolean; card: Card; message: string }> {
    try {
      const response = await this.api.put<{ success: boolean; card: Card; message: string }>(`/cards/${cardId}`, cardData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteCard(cardId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.delete<{ success: boolean; message: string }>(`/cards/${cardId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async moveCard(cardId: string, moveData: MoveCardRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.put<{ success: boolean; message: string }>(`/cards/${cardId}/move`, moveData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async assignCard(cardId: string, assigneeId: string | null): Promise<{ success: boolean; card: Card; message: string }> {
    try {
      const response = await this.api.put<{ success: boolean; card: Card; message: string }>(`/cards/${cardId}/assign`, { assigneeId });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Task endpoints
  async getTasks(cardId: string): Promise<{ success: boolean; tasks: Task[] }> {
    try {
      const response = await this.api.get<{ success: boolean; tasks: Task[] }>('/tasks', { params: { cardId } });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getTask(taskId: string): Promise<{ success: boolean; task: Task }> {
    try {
      const response = await this.api.get<{ success: boolean; task: Task }>(`/tasks/${taskId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async createTask(taskData: CreateTaskRequest): Promise<{ success: boolean; task: Task; message: string }> {
    try {
      const response = await this.api.post<{ success: boolean; task: Task; message: string }>('/tasks', taskData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateTask(taskId: string, taskData: Partial<CreateTaskRequest>): Promise<{ success: boolean; task: Task; message: string }> {
    try {
      const response = await this.api.put<{ success: boolean; task: Task; message: string }>(`/tasks/${taskId}`, taskData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteTask(taskId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.delete<{ success: boolean; message: string }>(`/tasks/${taskId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async toggleTask(taskId: string): Promise<{ success: boolean; task: Task; message: string }> {
    try {
      const response = await this.api.put<{ success: boolean; task: Task; message: string }>(`/tasks/${taskId}/toggle`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async reorderTask(taskId: string, order: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.put<{ success: boolean; message: string }>(`/tasks/${taskId}/reorder`, { order });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Comments endpoints
  async getCardComments(cardId: string): Promise<{ success: boolean; comments: Comment[] }> {
    try {
      const response = await this.api.get<{ success: boolean; comments: Comment[] }>(`/cards/${cardId}/comments`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async addCardComment(cardId: string, content: string): Promise<{ success: boolean; comment: Comment }> {
    try {
      const response = await this.api.post<{ success: boolean; comment: Comment }>(`/cards/${cardId}/comments`, { content });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteCardComment(cardId: string, commentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.delete<{ success: boolean; message: string }>(`/cards/${cardId}/comments/${commentId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Board members endpoint
  async getBoardMembers(boardId: string): Promise<{ success: boolean; members: BoardMember[] }> {
    try {
      const response = await this.api.get<{ success: boolean; members: BoardMember[] }>(`/boards/${boardId}/members`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;
