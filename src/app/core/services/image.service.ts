import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { StockImage } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private groqApiKey: string = '';
  private pexelsApiKey: string = '';
  private unsplashAccessKey: string = '';

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const settings = localStorage.getItem('wp_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.groqApiKey = parsed.ai?.openaiApiKey || '';
        this.pexelsApiKey = parsed.images?.pexelsApiKey || '';
        this.unsplashAccessKey = parsed.images?.unsplashApiKey || '';
        console.log(
          'Image service loaded - Pexels:',
          this.pexelsApiKey ? 'Configured' : 'Not Set',
          '- Unsplash:',
          this.unsplashAccessKey ? 'Configured' : 'Not Set',
        );
      }
    } catch (e) {
      console.log('Could not load image settings');
    }
  }

  getGroqApiKey(): string {
    return this.groqApiKey;
  }

  getPexelsApiKey(): string {
    return this.pexelsApiKey;
  }

  searchImages(query: string, perPage: number = 10): Observable<StockImage[]> {
    const cleanQuery = query.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
    console.log('Searching images for:', cleanQuery);

    // Try DuckDuckGo first (free, keyword-based)
    return this.searchDuckDuckGoImages(cleanQuery, perPage).pipe(
      switchMap((images) => {
        if (images.length > 0) return of(images);
        // Try Wikimedia Commons
        return this.searchWikimediaImages(cleanQuery, perPage).pipe(
          switchMap((images) => {
            if (images.length > 0) return of(images);
            // Try Pexels if configured
            return this.searchPexelsImages(cleanQuery, perPage).pipe(
              switchMap((images) => {
                if (images.length > 0) return of(images);
                // Try Unsplash if configured
                return this.searchUnsplashImages(cleanQuery, perPage).pipe(
                  switchMap((images) => {
                    if (images.length > 0) return of(images);
                    // Final fallback - Wikimedia
                    return this.searchWikimediaImages(cleanQuery, perPage, true);
                  }),
                );
              }),
            );
          }),
        );
      }),
      catchError(() => {
        console.log('All image searches failed, trying Wikimedia');
        return this.searchWikimediaImages(cleanQuery, perPage, true);
      }),
    );
  }

  private searchDuckDuckGoImages(query: string, perPage: number): Observable<StockImage[]> {
    console.log('Searching DuckDuckGo Images for:', query);

    // Use AllOrigins CORS proxy to access DuckDuckGo
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&ia=images&iax=images`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(searchUrl)}`;

    return from(fetch(proxyUrl)).pipe(
      switchMap((response: Response) => {
        if (!response.ok) {
          throw new Error(`Proxy Error: ${response.status}`);
        }
        return from(response.text());
      }),
      map((html: string) => {
        const images: StockImage[] = [];

        // Parse DuckDuckGo image results
        const imgRegex = /img src="(https:\/\/external-content\.duckduckgo\.com\/iu\/\?[^"]+)"/g;
        let match;

        while ((match = imgRegex.exec(html)) !== null && images.length < perPage) {
          const encodedUrl = match[1];
          try {
            const decodedUrl = decodeURIComponent(encodedUrl);
            const cleanUrl = decodedUrl.split('&')[0];

            if (cleanUrl && this.isValidImageUrl(cleanUrl)) {
              // Get image dimensions from URL
              let width = 800;
              let height = 600;

              const widthMatch = decodedUrl.match(/&w=(\d+)/);
              const heightMatch = decodedUrl.match(/&h=(\d+)/);

              if (widthMatch) width = parseInt(widthMatch[1]);
              if (heightMatch) height = parseInt(heightMatch[1]);

              // Skip tiny images
              if (width < 300 || height < 200) continue;

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

        console.log(`DuckDuckGo found ${images.length} images for "${query}"`);
        return images;
      }),
      catchError((err) => {
        console.log('DuckDuckGo search failed:', err);
        return of([]);
      }),
    );
  }

  private searchWikimediaImages(
    query: string,
    perPage: number,
    forceSearch: boolean = false,
  ): Observable<StockImage[]> {
    console.log('Searching Wikimedia Commons for:', query);

    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=${perPage * 2}&format=json&origin=*`;

    return from(fetch(url)).pipe(
      switchMap((response: Response) => {
        if (!response.ok) {
          throw new Error(`Wikimedia API Error: ${response.status}`);
        }
        return from(response.json());
      }),
      map((data: any) => {
        const images: StockImage[] = [];

        if (data.query && data.query.search) {
          data.query.search.forEach((result: any, index: number) => {
            if (images.length >= perPage) return;

            const title = result.title;
            // Get direct image URL
            const imageUrl = this.getWikimediaImageUrl(title);

            if (imageUrl) {
              images.push({
                id: `wiki-${index}`,
                url: imageUrl,
                thumbnailUrl: imageUrl.replace(/\/\d+px-/, '/300px-'),
                altText: query,
                photographer: 'Wikimedia Commons',
                photographerUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
                source: 'custom' as const,
              });
            }
          });
        }

        console.log(`Wikimedia found ${images.length} images for "${query}"`);
        return images;
      }),
      catchError((err) => {
        console.log('Wikimedia search failed:', err);
        return of([]);
      }),
    );
  }

  private getWikimediaImageUrl(title: string): string {
    // Convert title to filename format
    const filename = title.replace(/^File:/, '').replace(/\s/g, '_');
    // Return the original size URL
    return `https://upload.wikimedia.org/wikipedia/commons/${encodeURIComponent(filename)}`;
  }

  private searchPexelsImages(query: string, perPage: number): Observable<StockImage[]> {
    if (!this.pexelsApiKey) {
      console.log('No Pexels API key configured');
      return of([]);
    }

    console.log('Searching Pexels for:', query);

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

    return from(
      fetch(url, {
        headers: {
          Authorization: this.pexelsApiKey,
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
          console.log(`Pexels found ${images.length} images`);
          return images;
        }
        return [];
      }),
      catchError((err) => {
        console.log('Pexels search failed:', err);
        return of([]);
      }),
    );
  }

  private searchUnsplashImages(query: string, perPage: number): Observable<StockImage[]> {
    if (!this.unsplashAccessKey) {
      console.log('No Unsplash API key configured');
      return of([]);
    }

    console.log('Searching Unsplash for:', query);

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

    return from(
      fetch(url, {
        headers: {
          Authorization: `Client-ID ${this.unsplashAccessKey}`,
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
          console.log(`Unsplash found ${images.length} images`);
          return images;
        }
        return [];
      }),
      catchError((err) => {
        console.log('Unsplash search failed:', err);
        return of([]);
      }),
    );
  }

  private isValidImageUrl(url: string): boolean {
    return (
      url.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null ||
      url.includes('imgur.com') ||
      url.includes('wikimedia.org') ||
      url.includes('picsum.photos')
    );
  }

  generateAndGetImageUrl(keyword: string, apiKey: string): Observable<string> {
    // First try DuckDuckGo
    return this.searchDuckDuckGoImages(keyword, 1).pipe(
      switchMap((images) => {
        if (images.length > 0) {
          return of(images[0].url);
        }
        // Try Wikimedia
        return this.searchWikimediaImages(keyword, 1).pipe(
          switchMap((images) => {
            if (images.length > 0) {
              return of(images[0].url);
            }
            // Try Pexels
            return this.searchPexelsImages(keyword, 1).pipe(
              switchMap((images) => {
                if (images.length > 0) {
                  return of(images[0].url);
                }
                // Return placeholder
                return of(`https://picsum.photos/seed/${encodeURIComponent(keyword)}/800/600`);
              }),
            );
          }),
        );
      }),
      catchError(() => {
        return of(`https://picsum.photos/seed/${encodeURIComponent(keyword)}/800/600`);
      }),
    );
  }

  searchByUrl(imageUrl: string, keyword: string): Observable<StockImage> {
    return of({
      id: 'custom-' + Date.now(),
      url: imageUrl,
      thumbnailUrl: imageUrl,
      altText: keyword,
      photographer: 'External Image',
      photographerUrl: '#',
      source: 'custom' as const,
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
