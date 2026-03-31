# Dastgeer SEO Premium - WordPress SEO Plugin

## Description

**Dastgeer SEO Premium** is the ultimate WordPress SEO plugin for tech news sites. It combines the best features from Rank Math, Yoast SEO, and All in One SEO with additional powerful features specifically designed for modern websites.

## Features

### Core SEO Features

- **Real-time SEO Analysis** - Score your posts from 0-100 based on multiple factors
- **8-Point SEO Checklist** - Visual checklist for each post
- **Focus Keyword Analysis** - Optimize content for target keywords
- **Meta Title & Description Editor** - Full control over search snippets
- **Canonical URLs** - Prevent duplicate content issues
- **Noindex/Nofollow Controls** - Fine-tune what search engines index

### Sitemap Management

- **Main Sitemap** (`/sitemap.xml`) - Posts, pages, categories, tags
- **News Sitemap** (`/news-sitemap.xml`) - Google News optimized
- **Image Sitemap** (`/image-sitemap.xml`) - Image SEO

### Schema Markup (Structured Data)

- NewsArticle Schema (for Google News)
- Article Schema
- BlogPosting Schema
- TechArticle Schema
- Organization Schema
- Automatic JSON-LD output

### Social Media Integration

- **Open Graph** meta tags for Facebook, LinkedIn
- **Twitter Card** meta tags
- Social preview in post editor
- Custom default OG image

### Technical SEO

- Google Search Console verification
- Bing Webmaster verification
- Google Analytics integration
- Facebook Pixel integration
- Custom robots.txt generation

### 404 Monitor & Redirects

- **404 Error Tracking** - Log and monitor broken URLs
- **Redirect Manager** - Create 301/302/307/308 redirects
- Quick create redirect from 404 logs
- Hit counter for each redirect

### AI-Powered Tools

- **Content Analyzer** - Analyze and score your content
- **Auto-generate Title** - AI-powered title generation
- **Auto-generate Description** - AI-powered meta description
- **Auto Optimize** - One-click optimization

### Import/Export

- Export all settings to JSON
- Import settings from backup

## Installation

### Method 1: Upload via WordPress Admin

1. Download the `dastgeer-seo-premium.php` file
2. Go to **WordPress Admin → Plugins → Add New**
3. Click **Upload Plugin** at the top
4. Choose the `dastgeer-seo-premium.php` file
5. Click **Install Now**
6. Activate the plugin

### Method 2: FTP/SFTP Upload

1. Connect to your server via FTP/SFTP
2. Navigate to `/wp-content/plugins/`
3. Create folder `dastgeer-seo-premium`
4. Upload `dastgeer-seo-premium.php` to that folder
5. Go to **WordPress Admin → Plugins**
6. Find "Dastgeer SEO Premium" and click **Activate**

## Configuration

### After Activation

1. Go to **SEO Premium** in the WordPress admin menu
2. Configure general settings (site title, verification codes)
3. Set up social media settings
4. Configure sitemap settings
5. Set up schema markup (especially for Google News)

### Sitemap Submission

After setup, submit your sitemaps to Google:

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your website
3. Go to **Sitemaps**
4. Submit:
   - `sitemap.xml`
   - `news-sitemap.xml`

## Sitemap URLs

Your sitemaps will be available at:

- Main: `https://dastgeertech.studio/sitemap.xml`
- News: `https://dastgeertech.studio/news-sitemap.xml`
- Images: `https://dastgeertech.studio/image-sitemap.xml`

## Database Tables

The plugin creates 3 custom database tables:

- `wp_dstseo_redirects` - Stores redirects
- `wp_dstseo_404_log` - Stores 404 errors
- `wp_dstseo_scores` - Stores SEO scores

## Frequently Asked Questions

### Q: Do I need Rank Math or Yoast SEO?

A: No! This plugin works independently and provides all the SEO features you need.

### Q: Will this conflict with other SEO plugins?

A: Possibly. It's recommended to disable other SEO plugins when using Dastgeer SEO Premium.

### Q: How do I get indexed by Google News?

A:

1. Enable NewsArticle schema in Schema Settings
2. Submit your news-sitemap.xml to Google Search Console
3. Ensure your site follows [Google News content policies](https://support.google.com/news/publishers/answer/9395820)

### Q: How is the SEO score calculated?

A: The score is based on:

- Title optimization (10%)
- Meta description (10%)
- Content length & quality (15%)
- Headings structure (15%)
- Images & alt text (15%)
- Internal & external links (15%)
- Schema markup (20%)

## Requirements

- WordPress 5.8 or higher
- PHP 7.4 or higher
- MySQL 5.6 or higher

## Changelog

### Version 2.0.0

- Complete rewrite with modern architecture
- Real-time SEO analysis
- AI-powered meta generation
- 404 monitoring with redirect creation
- Multiple schema types
- Social media previews
- Import/Export functionality

## Support

For support, visit: https://dastgeertech.studio

## License

GPL v2 or later

---

**Author:** Dastgeer Tech Studio  
**Website:** https://dastgeertech.studio  
**Version:** 2.0.0
