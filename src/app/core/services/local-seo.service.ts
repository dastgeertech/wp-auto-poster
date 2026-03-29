import { Injectable, signal } from '@angular/core';

export interface LocalBusiness {
  id: string;
  name: string;
  type: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  phone: string;
  email: string;
  website: string;
  hours: {
    day: string;
    open: string;
    close: string;
  }[];
  images: string[];
  socialProfiles: {
    platform: string;
    url: string;
  }[];
  verified: boolean;
  ratings: {
    google: number;
    yelp: number;
    facebook: number;
  };
}

export interface LocalCitation {
  id: string;
  businessName: string;
  url: string;
  platform: string;
  category: string;
  status: 'found' | 'missing' | 'incorrect';
  lastChecked: Date;
  NAP: {
    name: string;
    address: string;
    phone: string;
  };
}

export interface LocalSEOStats {
  citationsFound: number;
  citationsMissing: number;
  citationsIncorrect: number;
  avgRating: number;
  totalReviews: number;
  businessScore: number;
}

@Injectable({
  providedIn: 'root',
})
export class LocalSeoService {
  private business = signal<LocalBusiness | null>(null);
  private citations = signal<LocalCitation[]>([]);

  constructor() {
    this.loadData();
    this.initializeMockData();
  }

  private loadData(): void {
    try {
      const savedBusiness = localStorage.getItem('local_business');
      const savedCitations = localStorage.getItem('local_citations');
      if (savedBusiness) {
        this.business.set(JSON.parse(savedBusiness));
      }
      if (savedCitations) {
        this.citations.set(
          JSON.parse(savedCitations).map((c: any) => ({
            ...c,
            lastChecked: new Date(c.lastChecked),
          })),
        );
      }
    } catch (e) {}
  }

  private saveData(): void {
    localStorage.setItem('local_business', JSON.stringify(this.business()));
    localStorage.setItem('local_citations', JSON.stringify(this.citations()));
  }

  private initializeMockData(): void {
    if (!this.business()) {
      this.business.set({
        id: '1',
        name: 'Your Business Name',
        type: 'Professional Service',
        address: {
          street: '123 Main Street',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
          country: 'USA',
        },
        coordinates: { lat: 37.7749, lng: -122.4194 },
        phone: '+1-555-123-4567',
        email: 'contact@yourbusiness.com',
        website: 'https://yourbusiness.com',
        hours: [
          { day: 'Monday', open: '09:00', close: '18:00' },
          { day: 'Tuesday', open: '09:00', close: '18:00' },
          { day: 'Wednesday', open: '09:00', close: '18:00' },
          { day: 'Thursday', open: '09:00', close: '18:00' },
          { day: 'Friday', open: '09:00', close: '17:00' },
          { day: 'Saturday', open: '10:00', close: '14:00' },
          { day: 'Sunday', open: '', close: '' },
        ],
        images: [],
        socialProfiles: [
          { platform: 'Facebook', url: 'https://facebook.com/yourbusiness' },
          { platform: 'Twitter', url: 'https://twitter.com/yourbusiness' },
          { platform: 'LinkedIn', url: 'https://linkedin.com/company/yourbusiness' },
        ],
        verified: true,
        ratings: { google: 4.8, yelp: 4.5, facebook: 4.7 },
      });
    }

    if (this.citations().length === 0) {
      const mockCitations: LocalCitation[] = [
        {
          id: '1',
          businessName: 'Your Business Name',
          url: 'https://google.com/maps/place/yourbusiness',
          platform: 'Google Business Profile',
          category: 'Search Engine',
          status: 'found',
          lastChecked: new Date(),
          NAP: { name: 'Match', address: 'Match', phone: 'Match' },
        },
        {
          id: '2',
          businessName: 'Your Business Name',
          url: 'https://bing.com/local/yourbusiness',
          platform: 'Bing Places',
          category: 'Search Engine',
          status: 'found',
          lastChecked: new Date(),
          NAP: { name: 'Match', address: 'Match', phone: 'Match' },
        },
        {
          id: '3',
          businessName: 'Your Business',
          url: 'https://yelp.com/biz/yourbusiness',
          platform: 'Yelp',
          category: 'Business Directory',
          status: 'found',
          lastChecked: new Date(),
          NAP: { name: 'Match', address: 'Mismatch', phone: 'Match' },
        },
        {
          id: '4',
          businessName: 'Your Business',
          url: 'https://facebook.com/yourbusiness',
          platform: 'Facebook',
          category: 'Social Media',
          status: 'found',
          lastChecked: new Date(),
          NAP: { name: 'Match', address: 'Match', phone: 'Match' },
        },
        {
          id: '5',
          businessName: '',
          url: 'https://yellowpages.com/yourbusiness',
          platform: 'Yellow Pages',
          category: 'Business Directory',
          status: 'missing',
          lastChecked: new Date(),
          NAP: { name: '', address: '', phone: '' },
        },
        {
          id: '6',
          businessName: '',
          url: 'https://yp.com/yourbusiness',
          platform: 'YP.com',
          category: 'Business Directory',
          status: 'missing',
          lastChecked: new Date(),
          NAP: { name: '', address: '', phone: '' },
        },
        {
          id: '7',
          businessName: 'Your Business Name LLC',
          url: 'https://bbb.org/yourbusiness',
          platform: 'Better Business Bureau',
          category: 'Review Site',
          status: 'incorrect',
          lastChecked: new Date(),
          NAP: { name: 'Similar', address: 'Match', phone: 'Match' },
        },
        {
          id: '8',
          businessName: 'Your Business Name',
          url: 'https://apple.com/maps/yourbusiness',
          platform: 'Apple Maps',
          category: 'Maps',
          status: 'found',
          lastChecked: new Date(),
          NAP: { name: 'Match', address: 'Match', phone: 'Match' },
        },
        {
          id: '9',
          businessName: '',
          url: 'https://manta.com/yourbusiness',
          platform: 'Manta',
          category: 'Business Directory',
          status: 'missing',
          lastChecked: new Date(),
          NAP: { name: '', address: '', phone: '' },
        },
        {
          id: '10',
          businessName: 'Your Business',
          url: 'https://foursquare.com/yourbusiness',
          platform: 'Foursquare',
          category: 'Local Discovery',
          status: 'found',
          lastChecked: new Date(),
          NAP: { name: 'Match', address: 'Match', phone: 'Match' },
        },
      ];
      this.citations.set(mockCitations);
      this.saveData();
    }
  }

  getBusiness(): LocalBusiness | null {
    return this.business();
  }

  updateBusiness(business: Partial<LocalBusiness>): void {
    this.business.update((b) => (b ? { ...b, ...business } : b));
    this.saveData();
  }

  getCitations(): LocalCitation[] {
    return this.citations();
  }

  getStats(): LocalSEOStats {
    const citations = this.citations();
    const business = this.business();

    return {
      citationsFound: citations.filter((c) => c.status === 'found').length,
      citationsMissing: citations.filter((c) => c.status === 'missing').length,
      citationsIncorrect: citations.filter((c) => c.status === 'incorrect').length,
      avgRating: business
        ? (business.ratings.google + business.ratings.yelp + business.ratings.facebook) / 3
        : 0,
      totalReviews: Math.floor(Math.random() * 500) + 100,
      businessScore: Math.floor(Math.random() * 20) + 80,
    };
  }

  getMissingCitations(): LocalCitation[] {
    return this.citations().filter((c) => c.status === 'missing');
  }

  addCitation(citation: Omit<LocalCitation, 'id' | 'lastChecked'>): LocalCitation {
    const newCitation: LocalCitation = {
      ...citation,
      id: 'citation_' + Date.now(),
      lastChecked: new Date(),
    };
    this.citations.update((citations) => [...citations, newCitation]);
    this.saveData();
    return newCitation;
  }

  updateCitationStatus(id: string, status: LocalCitation['status']): void {
    this.citations.update((citations) =>
      citations.map((c) => (c.id === id ? { ...c, status, lastChecked: new Date() } : c)),
    );
    this.saveData();
  }
}
