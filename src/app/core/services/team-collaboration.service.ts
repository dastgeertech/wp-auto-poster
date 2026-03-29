import { Injectable, signal } from '@angular/core';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'author' | 'viewer';
  status: 'online' | 'away' | 'offline';
  lastActive?: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: TeamMember;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  taskId: string;
  author: TeamMember;
  content: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class TeamCollaborationService {
  private members = signal<TeamMember[]>([]);
  private tasks = signal<Task[]>([]);
  private comments = signal<Comment[]>([]);

  constructor() {
    this.loadData();
    this.initializeMockData();
  }

  private loadData(): void {
    try {
      const savedMembers = localStorage.getItem('team_members');
      const savedTasks = localStorage.getItem('team_tasks');
      const savedComments = localStorage.getItem('team_comments');

      if (savedMembers) this.members.set(JSON.parse(savedMembers));
      if (savedTasks) {
        this.tasks.set(
          JSON.parse(savedTasks).map((t: any) => ({
            ...t,
            dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
          })),
        );
      }
      if (savedComments) {
        this.comments.set(
          JSON.parse(savedComments).map((c: any) => ({
            ...c,
            createdAt: new Date(c.createdAt),
          })),
        );
      }
    } catch (e) {}
  }

  private saveData(): void {
    try {
      localStorage.setItem('team_members', JSON.stringify(this.members()));
      localStorage.setItem('team_tasks', JSON.stringify(this.tasks()));
      localStorage.setItem('team_comments', JSON.stringify(this.comments()));
    } catch (e) {}
  }

  private initializeMockData(): void {
    if (this.members().length === 0) {
      this.members.set([
        { id: '1', name: 'John Smith', email: 'john@example.com', role: 'admin', status: 'online' },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          role: 'editor',
          status: 'online',
        },
        { id: '3', name: 'Mike Chen', email: 'mike@example.com', role: 'author', status: 'away' },
        {
          id: '4',
          name: 'Emily Davis',
          email: 'emily@example.com',
          role: 'author',
          status: 'offline',
        },
      ]);
      this.saveData();
    }
  }

  getMembers(): TeamMember[] {
    return this.members();
  }

  getMember(id: string): TeamMember | undefined {
    return this.members().find((m) => m.id === id);
  }

  addMember(member: Omit<TeamMember, 'id'>): TeamMember {
    const newMember: TeamMember = {
      ...member,
      id: 'member_' + Date.now(),
    };
    this.members.update((members) => [...members, newMember]);
    this.saveData();
    return newMember;
  }

  updateMember(id: string, updates: Partial<TeamMember>): void {
    this.members.update((members) => members.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    this.saveData();
  }

  removeMember(id: string): void {
    this.members.update((members) => members.filter((m) => m.id !== id));
    this.saveData();
  }

  getTasks(filters?: { status?: Task['status']; assigneeId?: string }): Task[] {
    let result = this.tasks();

    if (filters?.status) {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters?.assigneeId) {
      result = result.filter((t) => t.assignee?.id === filters.assigneeId);
    }

    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getTask(id: string): Task | undefined {
    return this.tasks().find((t) => t.id === id);
  }

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: 'task_' + Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.update((tasks) => [...tasks, newTask]);
    this.saveData();
    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>): void {
    this.tasks.update((tasks) =>
      tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t)),
    );
    this.saveData();
  }

  deleteTask(id: string): void {
    this.tasks.update((tasks) => tasks.filter((t) => t.id !== id));
    this.comments.update((comments) => comments.filter((c) => c.taskId !== id));
    this.saveData();
  }

  getTaskComments(taskId: string): Comment[] {
    return this.comments()
      .filter((c) => c.taskId === taskId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  addComment(taskId: string, author: TeamMember, content: string): Comment {
    const comment: Comment = {
      id: 'comment_' + Date.now(),
      taskId,
      author,
      content,
      createdAt: new Date(),
    };
    this.comments.update((comments) => [...comments, comment]);
    this.saveData();
    return comment;
  }

  getTaskStats(): { status: Task['status']; count: number; color: string }[] {
    const statuses: Task['status'][] = ['todo', 'in_progress', 'review', 'done'];
    const colors: Record<Task['status'], string> = {
      todo: '#666',
      in_progress: '#2196f3',
      review: '#ffc107',
      done: '#00d9a5',
    };

    return statuses.map((status) => ({
      status,
      count: this.tasks().filter((t) => t.status === status).length,
      color: colors[status],
    }));
  }

  getOnlineMembers(): TeamMember[] {
    return this.members().filter((m) => m.status === 'online');
  }

  setMemberStatus(id: string, status: TeamMember['status']): void {
    this.updateMember(id, { status, lastActive: new Date() });
  }
}
