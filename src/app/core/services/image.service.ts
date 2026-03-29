import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { StockImage } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private groqApiKey: string = '';
  private googleApiKey: string = '';
  private googleCx: string = '';
  private useGoogleApi: boolean = false;

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const settings = localStorage.getItem('wp_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.groqApiKey = parsed.ai?.openaiApiKey || '';
        this.googleApiKey = parsed.images?.googleApiKey || '';
        this.googleCx = parsed.images?.googleCx || '';
        this.useGoogleApi = !!(this.googleApiKey && this.googleCx);
        console.log('Image service loaded, Groq:', this.groqApiKey ? 'API Key Set' : 'Not Set');
        console.log(
          'Image service loaded, Google API:',
          this.useGoogleApi ? 'Enabled' : 'Disabled',
        );
      }
    } catch (e) {
      console.log('Could not load image settings');
    }
  }

  updateSettings(apiKey: string, cx: string): void {
    this.googleApiKey = apiKey;
    this.googleCx = cx;
    this.useGoogleApi = !!(apiKey && cx);
  }

  getGroqApiKey(): string {
    return this.groqApiKey;
  }

  searchImages(query: string, perPage: number = 10): Observable<StockImage[]> {
    const cleanQuery = query.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
    console.log('Searching images for:', cleanQuery);

    if (this.useGoogleApi) {
      return this.searchGoogleImages(cleanQuery, perPage);
    }

    // Show placeholder images - actual generation happens at publish time
    return this.generatePlaceholderImages(cleanQuery, perPage);
  }

  private generatePlaceholderImages(query: string, perPage: number): Observable<StockImage[]> {
    // Try Gemini to find images
    const geminiKey = this.getGeminiApiKey();
    if (geminiKey) {
      return this.searchImagesWithGemini(query, perPage, geminiKey);
    }

    console.log('No image API configured - returning empty image list');
    return of([]);
  }

  private getGeminiApiKey(): string {
    try {
      const settings = localStorage.getItem('ai_multi_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.apiKeys?.google || '';
      }
    } catch (e) {}
    return '';
  }

  private searchImagesWithGemini(
    query: string,
    perPage: number,
    apiKey: string,
  ): Observable<StockImage[]> {
    return new Observable((observer) => {
      console.log('Searching images with Gemini for:', query);

      const prompt = `Find ${perPage} high-quality, royalty-free image URLs for "${query}".
      
Requirements:
- Only direct image URLs (ending in .jpg, .jpeg, .png, .webp)
- From sources like: Wikipedia Commons, Pexels, Pixabay, Unsplash
- Images should be at least 800px wide
- Relevant to "${query}"

Return ONLY URLs, one per line, no explanations.`;

      fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
          }),
        },
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            const text = data.candidates[0].content.parts[0].text;
            const urls = text
              .split('\n')
              .map((line: string) => line.trim())
              .filter(
                (line: string) =>
                  line.startsWith('http') &&
                  (line.includes('.jpg') ||
                    line.includes('.png') ||
                    line.includes('.jpeg') ||
                    line.includes('.webp')),
              )
              .slice(0, perPage);

            const images: StockImage[] = urls.map((url: string, index: number) => ({
              id: `gemini-${index}`,
              url,
              thumbnailUrl: url,
              altText: query,
              photographer: 'AI Found',
              photographerUrl: '',
              source: 'google' as const,
            }));

            console.log('Gemini found', images.length, 'images');
            observer.next(images);
            observer.complete();
          } else {
            console.log('Gemini image search returned no results');
            observer.next([]);
            observer.complete();
          }
        })
        .catch((err) => {
          console.error('Gemini image search failed:', err);
          observer.next([]);
          observer.complete();
        });
    });
  }

  generateAndGetImageUrl(keyword: string, apiKey: string): Observable<string> {
    return new Observable((observer) => {
      console.log('Generating image with Groq for:', keyword);

      if (!apiKey) {
        console.error('No Groq API key');
        observer.error('No Groq API key');
        return;
      }

      fetch('https://api.groq.com/openai/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'flux-1-schnell',
          prompt: `High quality photo of ${keyword}, product shot, realistic, professional lighting, centered, clean background`,
          n: 1,
          size: '1024x1024',
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('Groq response:', data);
          if (data.data && data.data[0] && data.data[0].url) {
            console.log('Image URL generated:', data.data[0].url);
            observer.next(data.data[0].url);
            observer.complete();
          } else if (data.error) {
            console.error('Groq API error:', data.error);
            observer.error(data.error.message || 'Failed to generate image');
          } else {
            console.error('Invalid response from Groq:', data);
            observer.error('Invalid response from Groq');
          }
        })
        .catch((err) => {
          console.error('Groq image generation failed:', err);
          observer.error(err);
        });
    });
  }

  private searchGoogleImages(query: string, perPage: number): Observable<StockImage[]> {
    console.log('Searching Google Images with API for:', query);

    const url = `https://www.googleapis.com/customsearch/v1?key=${this.googleApiKey}&cx=${this.googleCx}&q=${encodeURIComponent(query)}&searchType=image&num=${perPage}&safe=high`;

    return from(fetch(url)).pipe(
      switchMap((response: Response) => {
        if (!response.ok) {
          throw new Error(`Google API Error: ${response.status}`);
        }
        return from(response.json());
      }),
      map((data: any) => {
        if (data.items && data.items.length > 0) {
          const images: StockImage[] = data.items.map((item: any, index: number) => ({
            id: `google-${index}`,
            url: item.link,
            thumbnailUrl:
              item.image?.thumbnailLink || item.pagemap?.cse_thumbnail?.[0]?.src || item.link,
            altText: item.title || query,
            photographer: item.displayLink || 'Google Images',
            photographerUrl: item.image?.contextLink || item.link,
            source: 'google' as const,
          }));
          console.log('Found', images.length, 'images from Google');
          return images;
        }
        console.log('No images found from Google');
        return [];
      }),
      catchError((err) => {
        console.log('Google API failed:', err);
        return of([]);
      }),
    );
  }

  searchByUrl(imageUrl: string, keyword: string): Observable<StockImage> {
    return of({
      id: 'custom-' + Date.now(),
      url: imageUrl,
      thumbnailUrl: imageUrl,
      altText: keyword,
      photographer: 'Google Images',
      photographerUrl: '#',
      source: 'google' as const,
    });
  }

  getRandomImage(keyword: string): Observable<StockImage | null> {
    return this.searchImages(keyword, 1).pipe(
      map((images) => (images.length > 0 ? images[0] : null)),
    );
  }

  getMultipleImages(keyword: string, count: number = 3): Observable<StockImage[]> {
    return this.searchImages(keyword, count);
  }

  generateAltText(image: StockImage, keyword: string): string {
    return keyword;
  }

  insertImageInContent(image: StockImage, keyword: string): string {
    const creditText = `Image Source: ${image.photographer}`;

    return `<figure>
  <img src="${image.url}" alt="${keyword}" loading="lazy" style="max-width:100%;height:auto;" />
  <figcaption>${creditText}</figcaption>
</figure>`;
  }
}
