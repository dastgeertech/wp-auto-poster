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

    // Try Pexels first (free stock photos)
    return this.searchPexelsImages(cleanQuery, perPage).pipe(
      switchMap((images) => {
        if (images.length > 0) return of(images);
        // Try Unsplash
        return this.searchUnsplashImages(cleanQuery, perPage).pipe(
          switchMap((images) => {
            if (images.length > 0) return of(images);
            // Try Google if configured
            if (this.useGoogleApi) {
              return this.searchGoogleImages(cleanQuery, perPage).pipe(
                switchMap((images) => {
                  if (images.length > 0) return of(images);
                  // Final fallback - placeholder images
                  return this.generatePlaceholderImages(cleanQuery, perPage);
                }),
              );
            }
            // Final fallback - placeholder images
            return this.generatePlaceholderImages(cleanQuery, perPage);
          }),
        );
      }),
      catchError(() => {
        console.log('All image APIs failed, using placeholders');
        return this.generatePlaceholderImages(cleanQuery, perPage);
      }),
    );
  }

  private generatePlaceholderImages(query: string, perPage: number): Observable<StockImage[]> {
    console.log('Generating placeholder images for:', query);

    const images: StockImage[] = [];

    for (let i = 0; i < Math.min(perPage, 6); i++) {
      const seed = query.replace(/\s/g, '') + '-' + i;
      const picsumUrl = `https://picsum.photos/seed/${seed}/800/600`;

      images.push({
        id: `placeholder-${i}`,
        url: picsumUrl,
        thumbnailUrl: `https://picsum.photos/seed/${seed}/300/200`,
        altText: query,
        photographer: 'Picsum Photos',
        photographerUrl: 'https://picsum.photos',
        source: 'custom' as const,
      });
    }

    console.log(`Generated ${images.length} placeholder images`);
    return of(images);
  }

  private searchPexelsImages(query: string, perPage: number): Observable<StockImage[]> {
    const apiKey = this.getPexelsApiKey();

    if (!apiKey) {
      console.log('No Pexels API key configured');
      return of([]);
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
        return of([]);
      }),
    );
  }

  private searchUnsplashImages(query: string, perPage: number): Observable<StockImage[]> {
    const accessKey = this.getUnsplashAccessKey();

    if (!accessKey) {
      console.log('No Unsplash API key configured');
      return of([]);
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
        return of([]);
      }),
    );
  }

  private searchGoogleImages(query: string, perPage: number): Observable<StockImage[]> {
    if (!this.useGoogleApi) {
      console.log('Google API not configured');
      return of([]);
    }

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

  generateAndGetImageUrl(keyword: string, apiKey: string): Observable<string> {
    return new Observable((observer) => {
      console.log('Generating image with Groq for:', keyword);

      if (!apiKey) {
        console.error('No Groq API key');
        // Return placeholder image
        observer.next(`https://picsum.photos/seed/${keyword}/800/600`);
        observer.complete();
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
            // Fallback to placeholder
            observer.next(`https://picsum.photos/seed/${keyword}/800/600`);
            observer.complete();
          } else {
            console.error('Invalid response from Groq:', data);
            // Fallback to placeholder
            observer.next(`https://picsum.photos/seed/${keyword}/800/600`);
            observer.complete();
          }
        })
        .catch((err) => {
          console.error('Groq image generation failed:', err);
          // Fallback to placeholder
          observer.next(`https://picsum.photos/seed/${keyword}/800/600`);
          observer.complete();
        });
    });
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
