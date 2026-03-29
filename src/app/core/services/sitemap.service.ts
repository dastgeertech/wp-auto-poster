import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SitemapService {
  private siteUrl: string = '';

  constructor(private http: HttpClient) {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const settings = localStorage.getItem('wp_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.wordpress?.apiUrl) {
          this.siteUrl = parsed.wordpress.apiUrl.replace('/wp-json/wp/v2', '');
        }
      }
    } catch (e) {
      console.log('Could not load settings');
    }
  }

  private getAuthHeader(): HttpHeaders {
    try {
      const settings = localStorage.getItem('wp_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.wordpress?.username && parsed.wordpress?.appPassword) {
          const credentials = btoa(`${parsed.wordpress.username}:${parsed.wordpress.appPassword}`);
          return new HttpHeaders({
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/xml',
          });
        }
      }
    } catch (e) {
      console.log('Could not get auth header');
    }
    return new HttpHeaders();
  }

  uploadSitemap(sitemapType: 'sitemap' | 'news-sitemap' | 'robots'): Observable<boolean> {
    let content = '';
    let filename = '';

    if (sitemapType === 'robots') {
      content = this.generateRobotsTxt();
      filename = 'robots.txt';
    } else if (sitemapType === 'sitemap') {
      content = this.generateSitemapXml();
      filename = 'sitemap.xml';
    } else {
      content = this.generateNewsSitemap();
      filename = 'news-sitemap.xml';
    }

    return this.uploadFile(content, filename, sitemapType);
  }

  private uploadFile(content: string, filename: string, sitemapType: string): Observable<boolean> {
    return new Observable((observer) => {
      fetch(`${this.siteUrl}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader().get('Authorization') || '',
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
        body: content,
      })
        .then((response) => {
          if (response.ok) {
            observer.next(true);
            observer.complete();
          } else {
            throw new Error(`Upload failed: ${response.status}`);
          }
        })
        .catch((err) => {
          console.log('Direct upload failed, trying alternative method...');
          this.createSitemapPage(content, filename, sitemapType).subscribe({
            next: (success) => {
              observer.next(success);
              observer.complete();
            },
            error: (e) => observer.error(e),
          });
        });
    });
  }

  private createSitemapPage(
    content: string,
    filename: string,
    sitemapType: string,
  ): Observable<boolean> {
    return new Observable((observer) => {
      const postData = {
        title:
          sitemapType === 'robots'
            ? 'Robots.txt'
            : sitemapType === 'sitemap'
              ? 'XML Sitemap'
              : 'News Sitemap',
        content: `<pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
        status: 'publish',
        meta: {
          _sitemap_type: sitemapType,
        },
      };

      fetch(`${this.siteUrl}/wp-json/wp/v2/pages`, {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader().get('Authorization') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })
        .then((response) => {
          if (response.ok) {
            observer.next(true);
            observer.complete();
          } else {
            observer.error(new Error('Failed to create sitemap page'));
          }
        })
        .catch((err) => observer.error(err));
    });
  }

  getWordPressSitemapInstructions(): string {
    return `
<!-- ========================================== -->
<!-- ADD THIS CODE TO YOUR THEME'S functions.php -->
<!-- ========================================== -->

// Enable WordPress Native Sitemaps
add_theme_support( 'rank_math_sitemap' );

// Custom Sitemap for Google News
function dastgeer_news_sitemap() {
    $posts = get_posts(array(
        'numberposts' => 1000,
        'post_status' => 'publish',
        'post_type' => 'post'
    ));
    
    header('Content-Type: application/xml; charset=utf-8');
    echo '<?xml version="1.0" encoding="UTF-8"?>';
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">';
    
    foreach($posts as $post) {
        setup_postdata($post);
        $pubDate = get_the_date('Y-m-d');
        echo '<url>';
        echo '<loc>'.get_permalink().'</loc>';
        echo '<news:news>';
        echo '<news:publication>';
        echo '<news:name>Dastgeer Tech</news:name>';
        echo '<news:language>en</news:language>';
        echo '</news:publication>';
        echo '<news:publication_date>'.$pubDate.'</news:publication_date>';
        echo '<news:title>'.htmlspecialchars(get_the_title()).'</news:title>';
        echo '</news:news>';
        echo '</url>';
    }
    
    echo '</urlset>';
    wp_reset_postdata();
    die();
}
add_action('init', function() {
    add_rewrite_rule('news-sitemap\\.xml$', 'index.php?news_sitemap=1', 'top');
});

add_filter('query_vars', function($vars) {
    $vars[] = 'news_sitemap';
    return $vars;
});

add_action('template_redirect', function() {
    if(get_query_var('news_sitemap')) {
        dastgeer_news_sitemap();
    }
});

// Custom Robots.txt
add_action('init', function() {
    add_rewrite_rule('robots\\.txt$', 'index.php?robots=1', 'top');
});

add_filter('query_vars', function($vars) {
    $vars[] = 'robots';
    return $vars;
});

add_action('template_redirect', function() {
    if(get_query_var('robots')) {
        header('Content-Type: text/plain; charset=utf-8');
        echo '# robots.txt for dastgeertech.studio
User-agent: *
Allow: /

Disallow: /wp-admin/
Disallow: /wp-admin/admin-ajax.php
Disallow: /wp-content/plugins/
Disallow: /wp-content/cache/

Sitemap: https://dastgeertech.studio/news-sitemap.xml
Sitemap: https://dastgeertech.studio/sitemap.xml';
        die();
    }
});

// Flush rewrite rules on theme activation
add_action('after_switch_theme', function() {
    flush_rewrite_rules();
});
`;
  }

  private generateRobotsTxt(): string {
    return `# robots.txt for dastgeertech.studio
User-agent: *
Allow: /

# Block admin and wp-content
Disallow: /wp-admin/
Disallow: /wp-admin/admin-ajax.php
Disallow: /wp-content/plugins/
Disallow: /wp-content/cache/

# Block sensitive files
Disallow: /wp-config.php
Disallow: /xmlrpc.php

# Allow search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Sitemap locations
Sitemap: https://dastgeertech.studio/sitemap.xml
Sitemap: https://dastgeertech.studio/news-sitemap.xml

# Crawl delay
Crawl-delay: 1`;
  }

  private generateSitemapXml(): string {
    const now = new Date().toISOString();
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://dastgeertech.studio/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://dastgeertech.studio/category/technology/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://dastgeertech.studio/category/ai-artificial-intelligence/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
  }

  private generateNewsSitemap(): string {
    const now = new Date().toISOString().split('T')[0];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>https://dastgeertech.studio/</loc>
    <news:news>
      <news:publication>
        <news:name>Dastgeer Tech</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${now}</news:publication_date>
      <news:title>Dastgeer Tech - Latest Technology News</news:title>
    </news:news>
  </url>
</urlset>`;
  }

  downloadFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
