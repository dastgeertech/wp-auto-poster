import { Injectable, signal } from '@angular/core';

export interface OutreachContact {
  id: string;
  name: string;
  email: string;
  website: string;
  domainAuthority: number;
  platform: string;
  type: 'blogger' | 'journalist' | 'influencer' | 'webmaster';
  status: 'pending' | 'contacted' | 'responded' | 'approved' | 'rejected' | 'published';
  notes: string;
  lastContacted: Date;
  followUps: number;
}

export interface OutreachStats {
  totalContacts: number;
  contacted: number;
  responses: number;
  published: number;
  avgResponseRate: number;
}

@Injectable({ providedIn: 'root' })
export class OutreachService {
  private contacts = signal<OutreachContact[]>([]);

  constructor() {
    this.loadData();
    this.initMockData();
  }

  private loadData(): void {
    try {
      const saved = localStorage.getItem('outreach_contacts');
      if (saved)
        this.contacts.set(
          JSON.parse(saved).map((c: any) => ({ ...c, lastContacted: new Date(c.lastContacted) })),
        );
    } catch (e) {}
  }

  private saveData(): void {
    localStorage.setItem('outreach_contacts', JSON.stringify(this.contacts()));
  }

  private initMockData(): void {
    if (this.contacts().length === 0) {
      const data: OutreachContact[] = [
        {
          id: '1',
          name: 'John Smith',
          email: 'john@techblog.com',
          website: 'https://techblog.com',
          domainAuthority: 65,
          platform: 'Guest Post',
          type: 'blogger',
          status: 'published',
          notes: 'Published SEO guide',
          lastContacted: new Date(),
          followUps: 0,
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@marketingpro.com',
          website: 'https://marketingpro.com',
          domainAuthority: 52,
          platform: 'HARO',
          type: 'journalist',
          status: 'responded',
          notes: 'Interested in data story',
          lastContacted: new Date(),
          followUps: 1,
        },
        {
          id: '3',
          name: 'Mike Chen',
          email: 'mike@seoguide.net',
          website: 'https://seoguide.net',
          domainAuthority: 48,
          platform: 'Guest Post',
          type: 'blogger',
          status: 'contacted',
          notes: 'Awaiting response',
          lastContacted: new Date(),
          followUps: 2,
        },
        {
          id: '4',
          name: 'Lisa Brown',
          email: 'lisa@businessdaily.com',
          website: 'https://businessdaily.com',
          domainAuthority: 72,
          platform: 'PR',
          type: 'journalist',
          status: 'pending',
          notes: 'Found via Twitter',
          lastContacted: new Date(),
          followUps: 0,
        },
        {
          id: '5',
          name: 'David Lee',
          email: 'david@startupblog.com',
          website: 'https://startupblog.com',
          domainAuthority: 38,
          platform: 'Guest Post',
          type: 'blogger',
          status: 'rejected',
          notes: 'Not accepting guest posts',
          lastContacted: new Date(),
          followUps: 1,
        },
      ];
      this.contacts.set(data);
      this.saveData();
    }
  }

  getContacts(): OutreachContact[] {
    return this.contacts();
  }

  getStats(): OutreachStats {
    const c = this.contacts();
    return {
      totalContacts: c.length,
      contacted: c.filter((x) => x.status !== 'pending').length,
      responses: c.filter((x) => ['responded', 'approved', 'published'].includes(x.status)).length,
      published: c.filter((x) => x.status === 'published').length,
      avgResponseRate:
        c.length > 0
          ? Math.round(
              (c.filter((x) => ['responded', 'approved', 'published'].includes(x.status)).length /
                c.filter((x) => x.status !== 'pending').length) *
                100,
            )
          : 0,
    };
  }

  updateStatus(id: string, status: OutreachContact['status']): void {
    this.contacts.update((list) =>
      list.map((c) =>
        c.id === id ? { ...c, status, lastContacted: new Date(), followUps: c.followUps + 1 } : c,
      ),
    );
    this.saveData();
  }

  addContact(contact: Omit<OutreachContact, 'id' | 'lastContacted' | 'followUps'>): void {
    this.contacts.update((list) => [
      ...list,
      { ...contact, id: 'c_' + Date.now(), lastContacted: new Date(), followUps: 0 },
    ]);
    this.saveData();
  }
}
