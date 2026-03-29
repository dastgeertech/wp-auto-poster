import { Injectable, signal } from '@angular/core';

export interface SchemaType {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: SchemaField[];
}

export interface SchemaField {
  key: string;
  label: string;
  type: 'text' | 'url' | 'number' | 'date' | 'email' | 'phone' | 'textarea' | 'select';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface GeneratedSchema {
  id: string;
  type: string;
  jsonLd: string;
  microdata: string;
  createdAt: Date;
  used: boolean;
  pageUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SchemaGeneratorService {
  private generatedSchemas = signal<GeneratedSchema[]>([]);

  readonly schemaTypes: SchemaType[] = [
    {
      id: 'organization',
      name: 'Organization',
      description: 'Your business information for search engines',
      icon: 'business',
      fields: [
        {
          key: 'name',
          label: 'Organization Name',
          type: 'text',
          required: true,
          placeholder: 'Your Company Name',
        },
        {
          key: 'url',
          label: 'Website URL',
          type: 'url',
          required: true,
          placeholder: 'https://example.com',
        },
        {
          key: 'logo',
          label: 'Logo URL',
          type: 'url',
          required: false,
          placeholder: 'https://example.com/logo.png',
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          required: false,
          placeholder: 'Brief description of your business',
        },
        { key: 'foundingDate', label: 'Founded Date', type: 'date', required: false },
        { key: 'email', label: 'Contact Email', type: 'email', required: false },
        {
          key: 'phone',
          label: 'Phone Number',
          type: 'phone',
          required: false,
          placeholder: '+1-555-555-5555',
        },
        { key: 'address', label: 'Street Address', type: 'text', required: false },
        { key: 'city', label: 'City', type: 'text', required: false },
        { key: 'state', label: 'State/Province', type: 'text', required: false },
        { key: 'zip', label: 'ZIP/Postal Code', type: 'text', required: false },
        { key: 'country', label: 'Country', type: 'text', required: false },
        {
          key: 'sameAs',
          label: 'Social Profiles (one per line)',
          type: 'textarea',
          required: false,
          placeholder: 'https://facebook.com/...\nhttps://twitter.com/...',
        },
      ],
    },
    {
      id: 'article',
      name: 'Article',
      description: 'Blog posts and news articles',
      icon: 'article',
      fields: [
        {
          key: 'headline',
          label: 'Article Headline',
          type: 'text',
          required: true,
          placeholder: 'Your Article Title',
        },
        { key: 'url', label: 'Article URL', type: 'url', required: true },
        { key: 'image', label: 'Featured Image URL', type: 'url', required: false },
        { key: 'author', label: 'Author Name', type: 'text', required: true },
        { key: 'authorUrl', label: 'Author Page URL', type: 'url', required: false },
        { key: 'publisher', label: 'Publisher Name', type: 'text', required: true },
        { key: 'datePublished', label: 'Published Date', type: 'date', required: true },
        { key: 'dateModified', label: 'Modified Date', type: 'date', required: false },
        { key: 'description', label: 'Article Description', type: 'textarea', required: true },
        {
          key: 'keywords',
          label: 'Keywords',
          type: 'text',
          required: false,
          placeholder: 'keyword1, keyword2, keyword3',
        },
      ],
    },
    {
      id: 'product',
      name: 'Product',
      description: 'E-commerce products with prices and reviews',
      icon: 'shopping_cart',
      fields: [
        { key: 'name', label: 'Product Name', type: 'text', required: true },
        { key: 'url', label: 'Product Page URL', type: 'url', required: true },
        { key: 'image', label: 'Product Image URL', type: 'url', required: false },
        { key: 'description', label: 'Product Description', type: 'textarea', required: true },
        { key: 'sku', label: 'SKU/Product ID', type: 'text', required: false },
        { key: 'brand', label: 'Brand Name', type: 'text', required: false },
        { key: 'price', label: 'Price', type: 'number', required: true },
        {
          key: 'currency',
          label: 'Currency',
          type: 'select',
          required: true,
          options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
        },
        {
          key: 'availability',
          label: 'Availability',
          type: 'select',
          required: true,
          options: ['In Stock', 'Out of Stock', 'Pre-order', 'Limited Availability'],
        },
        {
          key: 'condition',
          label: 'Condition',
          type: 'select',
          required: false,
          options: ['New', 'Used', 'Refurbished'],
        },
      ],
    },
    {
      id: 'faq',
      name: 'FAQ Page',
      description: 'Frequently Asked Questions',
      icon: 'help',
      fields: [
        { key: 'url', label: 'FAQ Page URL', type: 'url', required: true },
        { key: 'headline', label: 'Page Headline', type: 'text', required: true },
      ],
    },
    {
      id: 'localbusiness',
      name: 'Local Business',
      description: 'Physical business locations with hours',
      icon: 'store',
      fields: [
        { key: 'name', label: 'Business Name', type: 'text', required: true },
        { key: 'url', label: 'Website URL', type: 'url', required: false },
        { key: 'logo', label: 'Logo URL', type: 'url', required: false },
        { key: 'phone', label: 'Phone Number', type: 'phone', required: true },
        { key: 'email', label: 'Email', type: 'email', required: false },
        { key: 'street', label: 'Street Address', type: 'text', required: true },
        { key: 'city', label: 'City', type: 'text', required: true },
        { key: 'state', label: 'State', type: 'text', required: true },
        { key: 'zip', label: 'ZIP Code', type: 'text', required: true },
        { key: 'country', label: 'Country', type: 'text', required: true },
        { key: 'latitude', label: 'Latitude', type: 'number', required: false },
        { key: 'longitude', label: 'Longitude', type: 'number', required: false },
        {
          key: 'priceRange',
          label: 'Price Range',
          type: 'select',
          required: false,
          options: ['$', '$$', '$$$', '$$$$'],
        },
        {
          key: 'openingHours',
          label: 'Opening Hours',
          type: 'textarea',
          required: false,
          placeholder: 'Mo-Fr 09:00-18:00',
        },
        { key: 'servesCuisine', label: 'Cuisine Type', type: 'text', required: false },
        {
          key: 'businessType',
          label: 'Business Type',
          type: 'select',
          required: true,
          options: [
            'Restaurant',
            'Store',
            'Professional Service',
            'Health & Beauty',
            'Automotive',
            'Home Service',
            'Other',
          ],
        },
      ],
    },
    {
      id: 'video',
      name: 'Video',
      description: 'Video content with metadata',
      icon: 'videocam',
      fields: [
        { key: 'name', label: 'Video Title', type: 'text', required: true },
        { key: 'url', label: 'Video URL', type: 'url', required: true },
        { key: 'thumbnail', label: 'Thumbnail URL', type: 'url', required: false },
        { key: 'description', label: 'Video Description', type: 'textarea', required: true },
        { key: 'uploadDate', label: 'Upload Date', type: 'date', required: true },
        { key: 'duration', label: 'Duration (seconds)', type: 'number', required: false },
        { key: 'embedUrl', label: 'Embed URL', type: 'url', required: false },
      ],
    },
    {
      id: 'event',
      name: 'Event',
      description: 'Virtual or physical events',
      icon: 'event',
      fields: [
        { key: 'name', label: 'Event Name', type: 'text', required: true },
        { key: 'url', label: 'Event URL', type: 'url', required: true },
        { key: 'description', label: 'Event Description', type: 'textarea', required: true },
        { key: 'startDate', label: 'Start Date & Time', type: 'date', required: true },
        { key: 'endDate', label: 'End Date & Time', type: 'date', required: true },
        { key: 'location', label: 'Location Name', type: 'text', required: true },
        { key: 'address', label: 'Street Address', type: 'text', required: false },
        { key: 'city', label: 'City', type: 'text', required: false },
        { key: 'organizer', label: 'Organizer Name', type: 'text', required: false },
        { key: 'ticketUrl', label: 'Ticket URL', type: 'url', required: false },
        { key: 'price', label: 'Ticket Price', type: 'number', required: false },
        {
          key: 'currency',
          label: 'Currency',
          type: 'select',
          required: false,
          options: ['USD', 'EUR', 'GBP'],
        },
      ],
    },
    {
      id: 'recipe',
      name: 'Recipe',
      description: 'Food and cooking recipes',
      icon: 'restaurant',
      fields: [
        { key: 'name', label: 'Recipe Name', type: 'text', required: true },
        { key: 'url', label: 'Recipe URL', type: 'url', required: true },
        { key: 'image', label: 'Recipe Image URL', type: 'url', required: false },
        { key: 'author', label: 'Author', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea', required: true },
        { key: 'prepTime', label: 'Prep Time (minutes)', type: 'number', required: false },
        { key: 'cookTime', label: 'Cook Time (minutes)', type: 'number', required: false },
        { key: 'totalTime', label: 'Total Time (minutes)', type: 'number', required: false },
        { key: 'servings', label: 'Servings', type: 'number', required: false },
        { key: 'calories', label: 'Calories per Serving', type: 'number', required: false },
        { key: 'category', label: 'Category', type: 'text', required: false },
        { key: 'cuisine', label: 'Cuisine', type: 'text', required: false },
        {
          key: 'ingredients',
          label: 'Ingredients (one per line)',
          type: 'textarea',
          required: true,
        },
        {
          key: 'instructions',
          label: 'Instructions (one step per line)',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ];

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    try {
      const saved = localStorage.getItem('generated_schemas');
      if (saved) {
        this.generatedSchemas.set(
          JSON.parse(saved).map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt),
          })),
        );
      }
    } catch (e) {}
  }

  private saveData(): void {
    localStorage.setItem('generated_schemas', JSON.stringify(this.generatedSchemas()));
  }

  getSchemaTypes(): SchemaType[] {
    return this.schemaTypes;
  }

  getGeneratedSchemas(): GeneratedSchema[] {
    return this.generatedSchemas();
  }

  generateJsonLd(type: string, data: any): string {
    const d = data as any;
    switch (type) {
      case 'organization':
        return this.generateOrganizationSchema(d);
      case 'article':
        return this.generateArticleSchema(d);
      case 'product':
        return this.generateProductSchema(d);
      case 'faq':
        return this.generateFaqSchema(d);
      case 'localbusiness':
        return this.generateLocalBusinessSchema(d);
      case 'video':
        return this.generateVideoSchema(d);
      case 'event':
        return this.generateEventSchema(d);
      case 'recipe':
        return this.generateRecipeSchema(d);
      default:
        return '{}';
    }
  }

  private generateOrganizationSchema(data: any): string {
    const addressParts = [data.address, data.city, data.state, data.zip, data.country].filter(
      Boolean,
    );
    const socials = (data.sameAs || '').split('\n').filter((s: string) => s.trim());

    return JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: data.name,
        url: data.url,
        ...(data.logo && { logo: data.logo }),
        ...(data.description && { description: data.description }),
        ...(data.foundingDate && { foundingDate: data.foundingDate }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { telephone: data.phone }),
        ...(addressParts.length > 0 && {
          address: {
            '@type': 'PostalAddress',
            streetAddress: data.address,
            addressLocality: data.city,
            addressRegion: data.state,
            postalCode: data.zip,
            addressCountry: data.country,
          },
        }),
        ...(socials.length > 0 && { sameAs: socials }),
      },
      null,
      2,
    );
  }

  private generateArticleSchema(data: any): string {
    return JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.headline,
        url: data.url,
        ...(data.image && { image: data.image }),
        author: {
          '@type': 'Person',
          name: data.author,
          ...(data.authorUrl && { url: data.authorUrl }),
        },
        publisher: {
          '@type': 'Organization',
          name: data.publisher,
        },
        datePublished: data.datePublished,
        ...(data.dateModified && { dateModified: data.dateModified }),
        description: data.description,
        ...(data.keywords && { keywords: data.keywords }),
      },
      null,
      2,
    );
  }

  private generateProductSchema(data: any): string {
    const availabilityMap: any = {
      'In Stock': 'https://schema.org/InStock',
      'Out of Stock': 'https://schema.org/OutOfStock',
      'Pre-order': 'https://schema.org/PreOrder',
      'Limited Availability': 'https://schema.org/LimitedAvailability',
    };

    return JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: data.name,
        url: data.url,
        ...(data.image && { image: data.image }),
        description: data.description,
        ...(data.sku && { sku: data.sku }),
        ...(data.brand && { brand: { '@type': 'Brand', name: data.brand } }),
        offers: {
          '@type': 'Offer',
          price: data.price,
          priceCurrency: data.currency,
          availability: availabilityMap[data.availability] || 'https://schema.org/InStock',
          url: data.url,
        },
      },
      null,
      2,
    );
  }

  private generateFaqSchema(data: any): string {
    return JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [],
      },
      null,
      2,
    );
  }

  private generateLocalBusinessSchema(data: any): string {
    const typeMap: any = {
      Restaurant: 'Restaurant',
      Store: 'Store',
      'Professional Service': 'ProfessionalService',
      'Health & Beauty': 'HealthAndBeautyBusiness',
      Automotive: 'AutoRepair',
      'Home Service': 'HomeAndConstructionBusiness',
      Other: 'LocalBusiness',
    };

    const address = {
      '@type': 'PostalAddress',
      streetAddress: data.street,
      addressLocality: data.city,
      addressRegion: data.state,
      postalCode: data.zip,
      addressCountry: data.country,
    };

    const geo =
      data.latitude && data.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: data.latitude,
            longitude: data.longitude,
          }
        : {};

    return JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': typeMap[data.businessType] || 'LocalBusiness',
        name: data.name,
        ...(data.url && { url: data.url }),
        ...(data.logo && { logo: data.logo }),
        telephone: data.phone,
        ...(data.email && { email: data.email }),
        address: address,
        ...(Object.keys(geo).length > 0 && { geo: geo }),
        ...(data.priceRange && { priceRange: data.priceRange }),
        ...(data.openingHours && { openingHours: data.openingHours }),
        ...(data.servesCuisine && { servesCuisine: data.servesCuisine }),
      },
      null,
      2,
    );
  }

  private generateVideoSchema(data: any): string {
    return JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: data.name,
        url: data.url,
        ...(data.thumbnail && { thumbnailUrl: data.thumbnail }),
        description: data.description,
        uploadDate: data.uploadDate,
        ...(data.duration && { duration: `PT${data.duration}S` }),
        ...(data.embedUrl && { embedUrl: data.embedUrl }),
      },
      null,
      2,
    );
  }

  private generateEventSchema(data: any): string {
    const location = {
      '@type': 'Place',
      name: data.location,
      ...(data.address && {
        address: {
          '@type': 'PostalAddress',
          addressLocality: data.city,
          streetAddress: data.address,
        },
      }),
    };

    return JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: data.name,
        url: data.url,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        location: location,
        ...(data.organizer && {
          organizer: {
            '@type': 'Organization',
            name: data.organizer,
          },
        }),
        ...(data.ticketUrl && {
          offers: {
            '@type': 'Offer',
            url: data.ticketUrl,
            ...(data.price && { price: data.price, priceCurrency: data.currency || 'USD' }),
          },
        }),
      },
      null,
      2,
    );
  }

  private generateRecipeSchema(data: any): string {
    const ingredients = (data.ingredients || '').split('\n').filter((s: string) => s.trim());
    const instructions = (data.instructions || '').split('\n').filter((s: string) => s.trim());

    return JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: data.name,
        url: data.url,
        ...(data.image && { image: data.image }),
        author: { '@type': 'Person', name: data.author },
        description: data.description,
        ...(data.prepTime && { prepTime: `PT${data.prepTime}M` }),
        ...(data.cookTime && { cookTime: `PT${data.cookTime}M` }),
        ...(data.totalTime && { totalTime: `PT${data.totalTime}M` }),
        ...(data.calories && {
          nutrition: { '@type': 'NutritionInformation', calories: `${data.calories} calories` },
        }),
        ...(data.recipeYield && { recipeYield: data.servings }),
        recipeCategory: data.category,
        recipeCuisine: data.cuisine,
        recipeIngredient: ingredients,
        recipeInstructions: instructions.map((step: string, index: number) => ({
          '@type': 'HowToStep',
          position: index + 1,
          text: step,
        })),
      },
      null,
      2,
    );
  }

  saveSchema(type: string, jsonLd: string, pageUrl?: string): GeneratedSchema {
    const schema: GeneratedSchema = {
      id: 'schema_' + Date.now(),
      type,
      jsonLd,
      microdata: '',
      createdAt: new Date(),
      used: false,
      pageUrl,
    };
    this.generatedSchemas.update((schemas) => [...schemas, schema]);
    this.saveData();
    return schema;
  }

  deleteSchema(id: string): void {
    this.generatedSchemas.update((schemas) => schemas.filter((s) => s.id !== id));
    this.saveData();
  }

  markAsUsed(id: string): void {
    this.generatedSchemas.update((schemas) =>
      schemas.map((s) => (s.id === id ? { ...s, used: true } : s)),
    );
    this.saveData();
  }
}
