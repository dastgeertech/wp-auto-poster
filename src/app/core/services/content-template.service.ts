import { Injectable } from '@angular/core';

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  structure: TemplateSection[];
  defaultWordCount: number;
  tone: string;
  includeFaq: boolean;
  includeToc: boolean;
}

export interface TemplateSection {
  type: 'introduction' | 'heading' | 'list' | 'faq' | 'conclusion' | 'statistics' | 'comparison';
  title?: string;
  description?: string;
  items?: string[];
  count?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ContentTemplateService {
  private templates: ContentTemplate[] = [
    {
      id: 'comprehensive-guide',
      name: 'Comprehensive Guide',
      description: 'Complete in-depth guide with FAQ, TOC, and statistics',
      icon: 'menu_book',
      defaultWordCount: 2500,
      tone: 'professional',
      includeFaq: true,
      includeToc: true,
      structure: [
        { type: 'introduction', description: 'Hook the reader with a compelling stat or question' },
        { type: 'heading', title: 'What is [Topic]?' },
        { type: 'heading', title: 'Why [Topic] Matters in 2026' },
        { type: 'statistics', title: 'Key Statistics', count: 5 },
        { type: 'heading', title: 'How to Get Started' },
        { type: 'list', title: 'Step-by-Step Process', count: 5 },
        { type: 'heading', title: 'Benefits and Advantages' },
        { type: 'heading', title: 'Common Challenges and Solutions' },
        { type: 'heading', title: 'Best Practices' },
        { type: 'faq', title: 'Frequently Asked Questions', count: 6 },
        { type: 'conclusion', description: 'Summarize key takeaways and encourage action' },
      ],
    },
    {
      id: 'listicle',
      name: 'Top 10 Listicle',
      description: 'Engaging numbered list with brief explanations',
      icon: 'format_list_numbered',
      defaultWordCount: 1500,
      tone: 'engaging',
      includeFaq: true,
      includeToc: false,
      structure: [
        { type: 'introduction', description: 'Why this topic matters right now' },
        { type: 'heading', title: 'Top 10 [Topic] You Need to Know in 2026' },
        { type: 'list', title: 'The List', count: 10, description: 'Each item with 100-150 words' },
        { type: 'conclusion', description: 'Final thoughts and recommendations' },
      ],
    },
    {
      id: 'comparison',
      name: 'Comparison Article',
      description: 'Side-by-side comparison with pros/cons',
      icon: 'compare',
      defaultWordCount: 2000,
      tone: 'informative',
      includeFaq: true,
      includeToc: true,
      structure: [
        { type: 'introduction', description: 'The need for comparison in current market' },
        { type: 'heading', title: 'Understanding the Differences' },
        { type: 'comparison', title: 'Feature Comparison' },
        { type: 'heading', title: 'Option A: Pros and Cons' },
        { type: 'heading', title: 'Option B: Pros and Cons' },
        { type: 'heading', title: 'Which is Right for You?' },
        { type: 'faq', title: 'Common Questions', count: 5 },
        { type: 'conclusion', description: 'Recommendation based on use case' },
      ],
    },
    {
      id: 'how-to',
      name: 'How-To Tutorial',
      description: 'Step-by-step tutorial with practical examples',
      icon: 'build',
      defaultWordCount: 1800,
      tone: 'friendly',
      includeFaq: false,
      includeToc: true,
      structure: [
        { type: 'introduction', description: 'What you will learn and prerequisites' },
        { type: 'heading', title: 'What You Need to Get Started' },
        { type: 'list', title: 'Prerequisites', count: 4 },
        { type: 'heading', title: 'Step 1: Initial Setup' },
        { type: 'heading', title: 'Step 2: Core Implementation' },
        { type: 'heading', title: 'Step 3: Testing' },
        { type: 'heading', title: 'Step 4: Optimization' },
        { type: 'heading', title: 'Common Mistakes to Avoid' },
        { type: 'conclusion', description: 'Next steps and additional resources' },
      ],
    },
    {
      id: 'news-trend',
      name: 'News & Trends',
      description: 'Latest updates with expert analysis',
      icon: 'new_releases',
      defaultWordCount: 1200,
      tone: 'urgent',
      includeFaq: false,
      includeToc: false,
      structure: [
        { type: 'introduction', description: 'Breaking news summary' },
        { type: 'heading', title: 'What Happened' },
        { type: 'heading', title: 'Why This Matters' },
        { type: 'statistics', title: 'Impact Analysis', count: 3 },
        { type: 'heading', title: 'Industry Expert Reactions' },
        { type: 'heading', title: 'What to Expect Next' },
        { type: 'conclusion', description: 'Key takeaways' },
      ],
    },
    {
      id: 'opinion',
      name: 'Opinion Piece',
      description: 'Expert opinion with predictions',
      icon: 'rate_review',
      defaultWordCount: 1400,
      tone: 'thoughtful',
      includeFaq: false,
      includeToc: false,
      structure: [
        { type: 'introduction', description: 'Controversial or thought-provoking hook' },
        { type: 'heading', title: 'The Current State' },
        { type: 'heading', title: 'My Perspective' },
        { type: 'heading', title: 'Evidence Supporting This View' },
        { type: 'heading', title: 'Predictions for the Future' },
        { type: 'heading', title: 'What This Means for You' },
        { type: 'conclusion', description: 'Call to discussion' },
      ],
    },
    {
      id: 'ultimate-resource',
      name: 'Ultimate Resource',
      description: 'Comprehensive resource hub with all information',
      icon: 'star',
      defaultWordCount: 3500,
      tone: 'professional',
      includeFaq: true,
      includeToc: true,
      structure: [
        { type: 'introduction', description: 'Why this is the ultimate resource' },
        { type: 'heading', title: 'Table of Contents' },
        { type: 'heading', title: 'Fundamentals' },
        { type: 'heading', title: 'Advanced Concepts' },
        { type: 'heading', title: 'Tools and Resources' },
        { type: 'list', title: 'Recommended Tools', count: 8 },
        { type: 'heading', title: 'Case Studies' },
        { type: 'heading', title: 'Expert Tips' },
        { type: 'list', title: 'Pro Tips', count: 6 },
        { type: 'heading', title: 'Common Questions' },
        { type: 'faq', title: 'FAQ', count: 8 },
        { type: 'conclusion', description: 'Final recommendations' },
      ],
    },
    {
      id: 'product-review',
      name: 'Product Review',
      description: 'Detailed review with pros, cons, and ratings',
      icon: 'rate_review',
      defaultWordCount: 2200,
      tone: 'balanced',
      includeFaq: true,
      includeToc: true,
      structure: [
        { type: 'introduction', description: 'Quick verdict and rating' },
        { type: 'heading', title: 'First Impressions' },
        { type: 'heading', title: 'Key Features' },
        { type: 'list', title: 'Features Breakdown', count: 6 },
        { type: 'heading', title: 'Pros' },
        { type: 'list', title: 'Advantages', count: 5 },
        { type: 'heading', title: 'Cons' },
        { type: 'list', title: 'Disadvantages', count: 3 },
        { type: 'heading', title: 'Performance Tests' },
        { type: 'heading', title: 'Comparison with Alternatives' },
        { type: 'heading', title: 'Who Should Buy?' },
        { type: 'faq', title: 'Questions Answered', count: 5 },
        { type: 'conclusion', description: 'Final rating and recommendation' },
      ],
    },
  ];

  private customTemplates: ContentTemplate[] = [];

  constructor() {
    this.loadCustomTemplates();
  }

  private loadCustomTemplates(): void {
    try {
      const saved = localStorage.getItem('custom_templates');
      if (saved) {
        this.customTemplates = JSON.parse(saved);
      }
    } catch (e) {}
  }

  private saveCustomTemplates(): void {
    localStorage.setItem('custom_templates', JSON.stringify(this.customTemplates));
  }

  getTemplates(): ContentTemplate[] {
    return [...this.templates, ...this.customTemplates];
  }

  getTemplateById(id: string): ContentTemplate | undefined {
    return this.getTemplates().find((t) => t.id === id);
  }

  getDefaultTemplate(): ContentTemplate {
    return this.templates[0];
  }

  addCustomTemplate(template: Omit<ContentTemplate, 'id'>): void {
    const newTemplate: ContentTemplate = {
      ...template,
      id: 'custom_' + Date.now(),
    };
    this.customTemplates.push(newTemplate);
    this.saveCustomTemplates();
  }

  deleteCustomTemplate(id: string): void {
    this.customTemplates = this.customTemplates.filter((t) => t.id !== id);
    this.saveCustomTemplates();
  }

  updateCustomTemplate(id: string, updates: Partial<ContentTemplate>): void {
    const index = this.customTemplates.findIndex((t) => t.id === id);
    if (index >= 0) {
      this.customTemplates[index] = { ...this.customTemplates[index], ...updates };
      this.saveCustomTemplates();
    }
  }
}
