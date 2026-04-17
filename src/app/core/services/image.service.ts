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
      return this.searchGoogleImages(cleanQuery, perPage).pipe(
        switchMap((images) => {
          if (images.length > 0) return of(images);
          // Fallback chain: Pexels → Unsplash → DuckDuckGo
          return this.searchPexelsImages(cleanQuery, perPage).pipe(
            switchMap((images) => {
              if (images.length > 0) return of(images);
              return this.searchUnsplashImages(cleanQuery, perPage).pipe(
                switchMap((images) => {
                  if (images.length > 0) return of(images);
                  return this.searchDuckDuckGoImages(cleanQuery, perPage);
                }),
              );
            }),
          );
        }),
      );
    }

    // No Google API - try Pexels → Unsplash → DuckDuckGo
    return this.searchPexelsImages(cleanQuery, perPage).pipe(
      switchMap((images) => {
        if (images.length > 0) return of(images);
        return this.searchUnsplashImages(cleanQuery, perPage).pipe(
          switchMap((images) => {
            if (images.length > 0) return of(images);
            return this.searchDuckDuckGoImages(cleanQuery, perPage);
          }),
        );
      }),
    );
  }

  private searchDuckDuckGoImages(query: string, perPage: number): Observable<StockImage[]> {
    console.log('Searching DuckDuckGo Images (free, no API key) for:', query);

    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&ia=images&iax=images&h=${perPage}`;

    return from(fetch(url)).pipe(
      switchMap((response: Response) => {
        if (!response.ok) {
          throw new Error(`DuckDuckGo Error: ${response.status}`);
        }
        return from(response.text());
      }),
      map((html: string) => {
        const images: StockImage[] = [];

        // Parse image URLs from DuckDuckGo HTML
        const imgRegex = /img src="(https:\/\/external-content\.duckduckgo\.com\/iu\/\?[^"]+)"/g;
        let match;

        while ((match = imgRegex.exec(html)) !== null && images.length < perPage) {
          const encodedUrl = match[1];
          // Decode URL and get clean image URL
          try {
            const decodedUrl = decodeURIComponent(encodedUrl);
            const cleanUrl = decodedUrl.split('&')[0];

            if (
              cleanUrl &&
              (cleanUrl.endsWith('.jpg') ||
                cleanUrl.endsWith('.jpeg') ||
                cleanUrl.endsWith('.png') ||
                cleanUrl.endsWith('.webp') ||
                cleanUrl.includes('.jpg?') ||
                cleanUrl.includes('.png?'))
            ) {
              // Skip tiny images
              if (decodedUrl.includes('&w=')) {
                const widthMatch = decodedUrl.match(/&w=(\d+)/);
                if (widthMatch && parseInt(widthMatch[1]) < 400) continue;
              }

              images.push({
                id: `ddg-${images.length}`,
                url: cleanUrl,
                thumbnailUrl: encodedUrl,
                altText: query,
                photographer: 'DuckDuckGo',
                photographerUrl: 'https://duckduckgo.com',
                source: 'custom' as const,
              });
            }
          } catch (e) {
            // Skip malformed URLs
          }
        }

        // Also try to find high-quality images from other sources
        const otherImgRegex = /src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))[^"]*"/gi;
        while ((match = otherImgRegex.exec(html)) !== null && images.length < perPage * 2) {
          const url = match[1];
          if (url && !url.includes('duckduckgo.com') && !images.some((img) => img.url === url)) {
            if (url.includes('wikimedia.org') || url.includes('commons.wikimedia.org')) {
              images.push({
                id: `ddg-wiki-${images.length}`,
                url: url,
                thumbnailUrl: url.replace(/\/\d+px-/, '/300px-'),
                altText: query,
                photographer: 'Wikimedia Commons',
                photographerUrl: 'https://commons.wikimedia.org',
                source: 'custom' as const,
              });
            }
          }
        }

        console.log(`DuckDuckGo found ${images.length} images`);
        return images.slice(0, perPage);
      }),
      catchError((err) => {
        console.log('DuckDuckGo search failed:', err);
        // Fallback to placeholder
        return this.generatePlaceholderImages(query, perPage);
      }),
    );
  }

  private generatePlaceholderImages(query: string, perPage: number): Observable<StockImage[]> {
    // Try DuckDuckGo first (free, no API key)
    return this.searchDuckDuckGoImages(query, perPage).pipe(
      switchMap((images) => {
        if (images.length > 0) {
          return of(images);
        }
        // Try Pexels → Unsplash → Gemini
        return this.searchPexelsImages(query, perPage).pipe(
          switchMap((images) => {
            if (images.length > 0) return of(images);
            return this.searchUnsplashImages(query, perPage).pipe(
              switchMap((images) => {
                if (images.length > 0) return of(images);
                const geminiKey = this.getGeminiApiKey();
                if (geminiKey) {
                  return this.searchImagesWithGemini(query, perPage, geminiKey);
                }
                console.log('No image sources available - returning empty list');
                return of([]);
              }),
            );
          }),
        );
      }),
      catchError(() => {
        // Try Pexels → Unsplash → Gemini as final fallback
        return this.searchPexelsImages(query, perPage).pipe(
          switchMap((images) => {
            if (images.length > 0) return of(images);
            return this.searchUnsplashImages(query, perPage).pipe(
              switchMap((images) => {
                if (images.length > 0) return of(images);
                const geminiKey = this.getGeminiApiKey();
                if (geminiKey) {
                  return this.searchImagesWithGemini(query, perPage, geminiKey);
                }
                return of([]);
              }),
            );
          }),
        );
      }),
    );
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
        // Fallback to DuckDuckGo
        return this.searchDuckDuckGoImages(query, perPage);
      }),
    );
  }

  private searchPexelsImages(query: string, perPage: number): Observable<StockImage[]> {
    const apiKey = this.getPexelsApiKey();
    if (!apiKey) {
      return this.searchDuckDuckGoImages(query, perPage);
    }

    console.log('Searching Pexels Images for:', query);

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

    return from(
      fetch(url, {
        headers: {
          Authorization: apiKey,
        },
      }),
    ).pipe(
      switchMap((response: Response) => {
        if (!response.ok) {
          throw new Error(`Pexels API Error: ${response.status}`);
        }
        return from(response.json());
      }),
      map((data: any) => {
        if (data.photos && data.photos.length > 0) {
          const images: StockImage[] = data.photos.map((photo: any, index: number) => ({
            id: `pexels-${index}`,
            url: photo.src.large2x || photo.src.large,
            thumbnailUrl: photo.src.medium,
            altText: photo.alt || query,
            photographer: photo.photographer,
            photographerUrl: photo.photographer_url,
            source: 'custom' as const,
          }));
          console.log('Found', images.length, 'images from Pexels');
          return images;
        }
        console.log('No images found from Pexels');
        return [];
      }),
      catchError((err) => {
        console.log('Pexels API failed:', err);
        return this.searchDuckDuckGoImages(query, perPage);
      }),
    );
  }

  private searchUnsplashImages(query: string, perPage: number): Observable<StockImage[]> {
    const accessKey = this.getUnsplashAccessKey();
    if (!accessKey) {
      return this.searchPexelsImages(query, perPage);
    }

    console.log('Searching Unsplash Images for:', query);

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&content_filter=high`;

    return from(
      fetch(url, {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }),
    ).pipe(
      switchMap((response: Response) => {
        if (!response.ok) {
          throw new Error(`Unsplash API Error: ${response.status}`);
        }
        return from(response.json());
      }),
      map((data: any) => {
        if (data.results && data.results.length > 0) {
          const images: StockImage[] = data.results.map((photo: any, index: number) => ({
            id: `unsplash-${index}`,
            url: photo.urls.regular,
            thumbnailUrl: photo.urls.thumb,
            altText: photo.alt_description || query,
            photographer: photo.user.name,
            photographerUrl: photo.user.links.html,
            source: 'custom' as const,
          }));
          console.log('Found', images.length, 'images from Unsplash');
          return images;
        }
        console.log('No images found from Unsplash');
        return [];
      }),
      catchError((err) => {
        console.log('Unsplash API failed:', err);
        return this.searchPexelsImages(query, perPage);
      }),
    );
  }

  private getPexelsApiKey(): string {
    try {
      const settings = localStorage.getItem('wp_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.images?.pexelsApiKey || '';
      }
    } catch (e) {}
    return '';
  }

  private getUnsplashAccessKey(): string {
    try {
      const settings = localStorage.getItem('wp_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.images?.unsplashApiKey || '';
      }
    } catch (e) {}
    return '';
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
