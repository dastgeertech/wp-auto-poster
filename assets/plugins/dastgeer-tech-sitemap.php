<?php
/**
 * Plugin Name: Dastgeer Tech Sitemap
 * Plugin URI: https://dastgeertech.studio
 * Description: Generates News Sitemap, Robots.txt, and optimizes SEO for tech news sites
 * Version: 2.0.0
 * Author: Dastgeer Tech
 * Author URI: https://dastgeertech.studio
 */

// Prevent direct access
if (!defined('ABSPATH')) exit;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function dastgeer_get_site_name() {
    return get_bloginfo('name') ?: 'Dastgeer Tech';
}

// ==========================================
// NEWS SITEMAP GENERATOR - Google News Compliant
// ==========================================
function dastgeer_news_sitemap() {
    $site_name = dastgeer_get_site_name();
    
    $args = array(
        'post_type' => 'post',
        'post_status' => 'publish',
        'posts_per_page' => 1000,
        'orderby' => 'date',
        'order' => 'DESC'
    );
    
    $posts = new WP_Query($args);
    
    if (!$posts->have_posts()) {
        header('Content-Type: text/plain; charset=utf-8');
        echo 'No posts found';
        die();
    }
    
    header('Content-Type: application/xml; charset=utf-8');
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' . "\n";
    echo '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" ' . "\n";
    echo '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' . "\n";
    echo '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 ' . "\n";
    echo '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">' . "\n";
    
    while ($posts->have_posts()) {
        $posts->the_post();
        $post_id = get_the_ID();
        $title = get_the_title();
        $link = get_permalink();
        $date = get_the_date('Y-m-d\TH:i:s+00:00');
        $modified = get_the_modified_date('Y-m-d\TH:i:s+00:00');
        $categories = get_the_category($post_id);
        $category_name = !empty($categories) ? $categories[0]->name : 'Technology';
        $author = get_the_author();
        $excerpt = get_the_excerpt() ?: wp_trim_words(get_the_content(), 30);
        
        // Google News requires posts to be within 2 days
        $post_time = get_the_time('U');
        $current_time = current_time('timestamp');
        $days_diff = ($current_time - $post_time) / (60 * 60 * 24);
        
        // Only include posts from last 2 days for Google News
        if ($days_diff > 2) {
            continue;
        }
        
        echo '  <url>' . "\n";
        echo '    <loc>' . esc_url($link) . '</loc>' . "\n";
        echo '    <lastmod>' . esc_html($modified) . '</lastmod>' . "\n";
        echo '    <news:news>' . "\n";
        echo '      <news:publication>' . "\n";
        echo '        <news:name>' . esc_html($site_name) . '</news:name>' . "\n";
        echo '        <news:language>en</news:language>' . "\n";
        echo '      </news:publication>' . "\n";
        echo '      <news:publication_date>' . esc_html($date) . '</news:publication_date>' . "\n";
        echo '      <news:title>' . htmlspecialchars($title) . '</news:title>' . "\n";
        echo '      <news:keywords>' . esc_html($category_name . ', technology, tech news, ' . $author) . '</news:keywords>' . "\n";
        echo '      <news:stock_tickers></news:stock_tickers>' . "\n";
        echo '    </news:news>' . "\n";
        echo '  </url>' . "\n";
    }
    
    echo '</urlset>';
    wp_reset_postdata();
    die();
}

// ==========================================
// MAIN SITEMAP GENERATOR - Comprehensive
// ==========================================
function dastgeer_main_sitemap() {
    $site_url = get_site_url();
    
    $args = array(
        'post_type' => array('post', 'page'),
        'post_status' => 'publish',
        'posts_per_page' => 2000,
        'orderby' => 'modified',
        'order' => 'DESC'
    );
    
    $posts = new WP_Query($args);
    
    header('Content-Type: application/xml; charset=utf-8');
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' . "\n";
    echo '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" ' . "\n";
    echo '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" ' . "\n";
    echo '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" ' . "\n";
    echo '        xmlns:xhtml="http://www.w3.org/1999/xhtml" ' . "\n";
    echo '        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">' . "\n";
    
    // Homepage
    echo '  <url>' . "\n";
    echo '    <loc>' . esc_url(home_url('/')) . '</loc>' . "\n";
    echo '    <lastmod>' . esc_html(current_time('Y-m-d\TH:i:s+00:00')) . '</lastmod>' . "\n";
    echo '    <changefreq>hourly</changefreq>' . "\n";
    echo '    <priority>1.0</priority>' . "\n";
    echo '  </url>' . "\n";
    
    // Static pages
    $pages = get_pages(array('post_status' => 'publish'));
    foreach ($pages as $page) {
        $page_link = get_permalink($page->ID);
        $page_modified = get_the_modified_date('Y-m-d\TH:i:s+00:00', $page->ID);
        
        echo '  <url>' . "\n";
        echo '    <loc>' . esc_url($page_link) . '</loc>' . "\n";
        echo '    <lastmod>' . esc_html($page_modified) . '</lastmod>' . "\n";
        echo '    <changefreq>monthly</changefreq>' . "\n";
        echo '    <priority>0.8</priority>' . "\n";
        echo '  </url>' . "\n";
    }
    
    // Categories
    $categories = get_categories(array('hide_empty' => true, 'number' => 100));
    foreach ($categories as $cat) {
        $cat_link = get_category_link($cat->term_id);
        $cat_count = $cat->count;
        $changefreq = $cat_count > 50 ? 'daily' : ($cat_count > 10 ? 'weekly' : 'monthly');
        
        echo '  <url>' . "\n";
        echo '    <loc>' . esc_url($cat_link) . '</loc>' . "\n";
        echo '    <lastmod>' . esc_html(current_time('Y-m-d\TH:i:s+00:00')) . '</lastmod>' . "\n";
        echo '    <changefreq>' . $changefreq . '</changefreq>' . "\n";
        echo '    <priority>0.7</priority>' . "\n";
        echo '  </url>' . "\n";
    }
    
    // Tags
    $tags = get_tags(array('hide_empty' => true, 'number' => 200));
    foreach ($tags as $tag) {
        $tag_link = get_tag_link($tag->term_id);
        
        echo '  <url>' . "\n";
        echo '    <loc>' . esc_url($tag_link) . '</loc>' . "\n";
        echo '    <lastmod>' . esc_html(current_time('Y-m-d\TH:i:s+00:00')) . '</lastmod>' . "\n";
        echo '    <changefreq>weekly</changefreq>' . "\n";
        echo '    <priority>0.5</priority>' . "\n";
        echo '  </url>' . "\n";
    }
    
    // Posts
    if ($posts->have_posts()) {
        while ($posts->have_posts()) {
            $posts->the_post();
            $post_id = get_the_ID();
            $link = get_permalink();
            $modified = get_the_modified_date('Y-m-d\TH:i:s+00:00');
            $date = get_the_date('Y-m-d\TH:i:s+00:00');
            
            // Calculate priority based on post age and views
            $post_age = (current_time('timestamp') - get_the_time('U')) / (60 * 60 * 24);
            $priority = $post_age < 7 ? '0.9' : ($post_age < 30 ? '0.7' : '0.6');
            $changefreq = $post_age < 7 ? 'daily' : ($post_age < 30 ? 'weekly' : 'monthly');
            
            echo '  <url>' . "\n";
            echo '    <loc>' . esc_url($link) . '</loc>' . "\n";
            echo '    <lastmod>' . esc_html($modified) . '</lastmod>' . "\n";
            echo '    <changefreq>' . $changefreq . '</changefreq>' . "\n";
            echo '    <priority>' . $priority . '</priority>' . "\n";
            
            // Add featured image to sitemap
            if (has_post_thumbnail()) {
                $image_url = get_the_post_thumbnail_url($post_id, 'full');
                if ($image_url) {
                    $thumb_id = get_post_thumbnail_id($post_id);
                    $alt_text = get_post_meta($thumb_id, '_wp_attachment_image_alt', true) ?: get_the_title();
                    
                    echo '    <image:image>' . "\n";
                    echo '      <image:loc>' . esc_url($image_url) . '</image:loc>' . "\n";
                    echo '      <image:title>' . esc_html(get_the_title()) . '</image:title>' . "\n";
                    echo '      <image:caption>' . esc_html($alt_text) . '</image:caption>' . "\n";
                    echo '    </image:image>' . "\n";
                }
            }
            
            echo '  </url>' . "\n";
        }
        wp_reset_postdata();
    }
    
    echo '</urlset>';
    die();
}

// ==========================================
// ROBOTS.TXT GENERATOR - Comprehensive
// ==========================================
function dastgeer_robots_txt() {
    $site_url = get_site_url();
    $site_name = dastgeer_get_site_name();
    
    header('Content-Type: text/plain; charset=utf-8');
    echo '# robots.txt for ' . $site_url . '
# Generated by ' . $site_name . ' Sitemap Plugin
# Last updated: ' . date('Y-m-d H:i:s') . '

# ----------------------------------
# GENERAL SETTINGS
# ----------------------------------
User-agent: *
Allow: /

# ----------------------------------
# DISALLOW ADMIN AREAS
# ----------------------------------
Disallow: /wp-admin/
Disallow: /wp-admin/admin-ajax.php
Disallow: /wp-login.php
Disallow: /wp-register.php

# ----------------------------------
# DISALLOW SYSTEM FILES
# ----------------------------------
Disallow: /wp-config.php
Disallow: /wp-config-sample.php
Disallow: /xmlrpc.php
Disallow: /readme.html
Disallow: /readme.txt
Disallow: /wp-json/
Disallow: /feed/
Disallow: /trackback/
Disallow: /cgi-bin/
Disallow: /wp-content/cache/

# ----------------------------------
# DISALLOW PRIVATE DIRECTORIES
# ----------------------------------
Disallow: /private/
Disallow: /tmp/
Disallow: /\.htaccess$
Disallow: /\.htpasswd$

# ----------------------------------
# ALLOW IMAGES FOR BOTS
# ----------------------------------
Allow: /wp-content/uploads/
Allow: /wp-content/themes/
Allow: /wp-content/plugins/

# ----------------------------------
# MAJOR SEARCH BOTS
# ----------------------------------
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Googlebot-Image
Allow: /wp-content/uploads/
Crawl-delay: 2

User-agent: Googlebot-News
Allow: /

User-agent: Googlebot-Video
Allow: /

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: msnbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 1

User-agent: DuckDuckBot
Allow: /
Crawl-delay: 1

User-agent: YandexBot
Allow: /
Crawl-delay: 1

User-agent: YandexImages
Allow: /wp-content/uploads/

User-agent: Baiduspider
Allow: /
Crawl-delay: 1

User-agent: Exabot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: Applebot
Allow: /
Crawl-delay: 1

# ----------------------------------
# SITEMAPS
# ----------------------------------
Sitemap: ' . $site_url . '/news-sitemap.xml
Sitemap: ' . $site_url . '/main-sitemap.xml
Sitemap: ' . $site_url . '/sitemap_index.xml

# ----------------------------------
# HOST
# ----------------------------------
Host: ' . str_replace('https://', '', str_replace('http://', '', $site_url)) . '

';
    die();
}

// ==========================================
// REGISTER REWRITE RULES
// ==========================================
function dastgeer_activate() {
    // Add rewrite rules
    add_rewrite_rule('news-sitemap\.xml$', 'index.php?dastgeer_sitemap=news', 'top');
    add_rewrite_rule('main-sitemap\.xml$', 'index.php?dastgeer_sitemap=main', 'top');
    add_rewrite_rule('robots\.txt$', 'index.php?dastgeer_robots=1', 'top');
    
    // Flush rewrite rules
    flush_rewrite_rules();
}

function dastgeer_deactivate() {
    flush_rewrite_rules();
}

// Add query vars
function dastgeer_query_vars($vars) {
    $vars[] = 'dastgeer_sitemap';
    $vars[] = 'dastgeer_robots';
    return $vars;
}

// Handle sitemap and robots requests
function dastgeer_template_redirect() {
    global $wp_query;
    
    if (isset($wp_query->query_vars['dastgeer_sitemap'])) {
        $sitemap_type = $wp_query->query_vars['dastgeer_sitemap'];
        
        if ($sitemap_type === 'news') {
            dastgeer_news_sitemap();
        } elseif ($sitemap_type === 'main') {
            dastgeer_main_sitemap();
        }
    }
    
    if (isset($wp_query->query_vars['dastgeer_robots'])) {
        dastgeer_robots_txt();
    }
}

// Hook everything up
register_activation_hook(__FILE__, 'dastgeer_activate');
register_deactivation_hook(__FILE__, 'dastgeer_deactivate');
add_filter('query_vars', 'dastgeer_query_vars');
add_action('template_redirect', 'dastgeer_template_redirect');

// Also try to handle via init as backup
add_action('init', function() {
    // Try to catch requests early
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    
    if (preg_match('/news-sitemap\.xml/i', $uri)) {
        dastgeer_news_sitemap();
    }
    
    if (preg_match('/main-sitemap\.xml/i', $uri)) {
        dastgeer_main_sitemap();
    }
    
    if (preg_match('/^robots\.txt/i', $uri)) {
        dastgeer_robots_txt();
    }
}, 1);

// ==========================================
// ADD SCHEMA MARKUP TO HEAD
// ==========================================
function dastgeer_schema_markup() {
    $site_name = dastgeer_get_site_name();
    $site_url = get_site_url();
    
    if (is_single()) {
        global $post;
        $post_id = get_the_ID();
        $title = get_the_title();
        $excerpt = get_the_excerpt() ?: wp_trim_words(get_the_content(), 25);
        $publish_date = get_the_date('c');
        $modified_date = get_the_modified_date('c');
        $permalink = get_permalink();
        $author = get_the_author();
        $author_url = get_author_posts_url(get_the_author_meta('ID'));
        $categories = get_the_category($post_id);
        $category_name = !empty($categories) ? $categories[0]->name : 'Technology';
        $tags = wp_get_post_tags($post_id, array('fields' => 'names'));
        
        $schema = array(
            '@context' => 'https://schema.org',
            '@type' => 'NewsArticle',
            '@id' => $permalink . '#article',
            'headline' => $title,
            'name' => $title,
            'description' => $excerpt,
            'datePublished' => $publish_date,
            'dateModified' => $modified_date,
            'copyrightYear' => date('Y', strtotime($publish_date)),
            'copyrightHolder' => array(
                '@type' => 'Organization',
                'name' => $site_name
            ),
            'author' => array(
                '@type' => 'Person',
                'name' => $author,
                'url' => $author_url
            ),
            'publisher' => array(
                '@type' => 'Organization',
                'name' => $site_name,
                'url' => $site_url,
                'logo' => array(
                    '@type' => 'ImageObject',
                    'url' => $site_url . '/logo.png',
                    'width' => 200,
                    'height' => 60
                )
            ),
            'mainEntityOfPage' => array(
                '@type' => 'WebPage',
                '@id' => $permalink
            ),
            'articleSection' => $category_name,
            'keywords' => implode(', ', $tags),
            'wordCount' => str_word_count(strip_tags(get_the_content())),
            'inLanguage' => 'en-US',
            'isAccessibleForFree' => true
        );
        
        if (has_post_thumbnail()) {
            $thumb_id = get_post_thumbnail_id($post_id);
            $thumb_url = wp_get_attachment_image_src($thumb_id, 'full');
            if ($thumb_url) {
                $schema['image'] = array(
                    '@type' => 'ImageObject',
                    'url' => $thumb_url[0],
                    'width' => $thumb_url[1],
                    'height' => $thumb_url[2],
                    'caption' => $title
                );
            }
        } else {
            $schema['image'] = array(
                '@type' => 'ImageObject',
                'url' => $site_url . '/default-featured-image.jpg',
                'width' => 1200,
                'height' => 630
            );
        }
        
        echo '<script type="application/ld+json" class="schema-markup">' . json_encode($schema, JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
        
        // Add BreadcrumbList schema
        $breadcrumb_schema = array(
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => array(
                array(
                    '@type' => 'ListItem',
                    'position' => 1,
                    'name' => 'Home',
                    'item' => $site_url
                ),
                array(
                    '@type' => 'ListItem',
                    'position' => 2,
                    'name' => $category_name,
                    'item' => get_category_link($categories[0]->term_id ?? 0)
                ),
                array(
                    '@type' => 'ListItem',
                    'position' => 3,
                    'name' => $title,
                    'item' => $permalink
                )
            )
        );
        echo '<script type="application/ld+json" class="schema-markup-breadcrumb">' . json_encode($breadcrumb_schema, JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
    }
    
    // Website schema on homepage
    if (is_home() || is_front_page()) {
        $schema = array(
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            '@id' => $site_url . '#website',
            'name' => $site_name,
            'url' => $site_url,
            'description' => 'Latest technology news, reviews, and expert insights',
            'publisher' => array(
                '@type' => 'Organization',
                '@id' => $site_url . '#organization',
                'name' => $site_name,
                'url' => $site_url
            ),
            'potentialAction' => array(
                '@type' => 'SearchAction',
                'target' => $site_url . '/?s={search_term_string}',
                'query-input' => 'required name=search_term_string'
            ),
            'inLanguage' => 'en-US'
        );
        
        echo '<script type="application/ld+json" class="schema-markup-website">' . json_encode($schema, JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
    }
}
add_action('wp_head', 'dastgeer_schema_markup', 1);

// ==========================================
// OPTIMIZE RSS FEED
// ==========================================
function dastgeer_rss_feed() {
    add_feed('news', function() {
        header('Content-Type: application/rss+xml; charset=utf-8');
        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        echo '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">' . "\n";
        echo '<channel>' . "\n";
        echo '<title>Dastgeer Tech - Technology News</title>' . "\n";
        echo '<link>' . get_site_url() . '</link>' . "\n";
        echo '<description>Latest technology news and reviews</description>' . "\n";
        echo '<language>en-us</language>' . "\n";
        echo '<managingEditor>editor@dastgeertech.studio</managingEditor>' . "\n";
        
        $args = array(
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => 20
        );
        
        $posts = new WP_Query($args);
        
        if ($posts->have_posts()) {
            while ($posts->have_posts()) {
                $posts->the_post();
                echo '<item>' . "\n";
                echo '<title>' . htmlspecialchars(get_the_title()) . '</title>' . "\n";
                echo '<link>' . get_permalink() . '</link>' . "\n";
                echo '<guid isPermaLink="true">' . get_permalink() . '</guid>' . "\n";
                echo '<pubDate>' . get_the_date('r') . '</pubDate>' . "\n";
                echo '<description>' . htmlspecialchars(get_the_excerpt()) . '</description>' . "\n";
                echo '</item>' . "\n";
            }
            wp_reset_postdata();
        }
        
        echo '</channel>' . "\n";
        echo '</rss>';
        die();
    });
}
add_action('init', 'dastgeer_rss_feed');

// ==========================================
// ADD METADATA TO POSTS
// ==========================================
function dastgeer_post_meta() {
    $site_name = dastgeer_get_site_name();
    
    if (is_single()) {
        $title = get_the_title();
        $excerpt = get_the_excerpt() ?: wp_trim_words(get_the_content(), 30);
        $permalink = get_permalink();
        $post_id = get_the_ID();
        $publish_date = get_the_date('c');
        $modified_date = get_the_modified_date('c');
        $author = get_the_author();
        $categories = get_the_category($post_id);
        $category_name = !empty($categories) ? $categories[0]->name : 'Technology';
        $tags = wp_get_post_tags($post_id, array('fields' => 'names'));
        
        echo '<meta property="og:type" content="article" />' . "\n";
        echo '<meta property="og:title" content="' . esc_attr($title) . '" />' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($excerpt) . '" />' . "\n";
        echo '<meta property="og:url" content="' . esc_url($permalink) . '" />' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr($site_name) . '" />' . "\n";
        echo '<meta property="og:locale" content="en_US" />' . "\n";
        
        // Article-specific
        echo '<meta property="article:published_time" content="' . esc_attr($publish_date) . '" />' . "\n";
        echo '<meta property="article:modified_time" content="' . esc_attr($modified_date) . '" />' . "\n";
        echo '<meta property="article:author" content="' . esc_attr($author) . '" />' . "\n";
        echo '<meta property="article:section" content="' . esc_attr($category_name) . '" />' . "\n";
        
        // Tags
        foreach ($tags as $tag) {
            echo '<meta property="article:tag" content="' . esc_attr($tag) . '" />' . "\n";
        }
        
        // Images
        if (has_post_thumbnail()) {
            $image = get_the_post_thumbnail_url($post_id, 'full');
            echo '<meta property="og:image" content="' . esc_url($image) . '" />' . "\n";
            echo '<meta property="og:image:width" content="1200" />' . "\n";
            echo '<meta property="og:image:height" content="630" />' . "\n";
            echo '<meta property="og:image:alt" content="' . esc_attr($title) . '" />' . "\n";
        } else {
            echo '<meta property="og:image" content="' . esc_url(get_site_url() . '/default-featured-image.jpg') . '" />' . "\n";
            echo '<meta property="og:image:width" content="1200" />' . "\n";
            echo '<meta property="og:image:height" content="630" />' . "\n";
        }
        
        // Twitter
        echo '<meta name="twitter:card" content="summary_large_image" />' . "\n";
        echo '<meta name="twitter:site" content="@dastgeertech" />' . "\n";
        echo '<meta name="twitter:creator" content="@dastgeertech" />' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '" />' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr($excerpt) . '" />' . "\n";
        if (has_post_thumbnail()) {
            echo '<meta name="twitter:image" content="' . esc_url(get_the_post_thumbnail_url($post_id, 'full')) . '" />' . "\n";
        }
        
        // Standard meta
        echo '<meta name="description" content="' . esc_attr($excerpt) . '" />' . "\n";
    }
}
add_action('wp_head', 'dastgeer_post_meta', 5);

// ==========================================
// OPTIMIZE IMAGES FOR SEO
// ==========================================
function dastgeer_image_alt_text($attr, $attachment) {
    if (!isset($attr['alt']) || empty($attr['alt'])) {
        if (is_single()) {
            $attr['alt'] = get_the_title() . ' - Dastgeer Tech';
        } else {
            $attr['alt'] = 'Dastgeer Tech - Technology News';
        }
    }
    return $attr;
}
add_filter('wp_get_attachment_image_attributes', 'dastgeer_image_alt_text', 10, 2);

// ==========================================
// ADD CANONICAL URLS
// ==========================================
function dastgeer_canonical_url() {
    if (is_single()) {
        echo '<link rel="canonical" href="' . get_permalink() . '" />' . "\n";
    }
}
add_action('wp_head', 'dastgeer_canonical_url', 1);

// ==========================================
// DISABLE ADMIN NOTICE FOR USERS
// ==========================================
remove_action('admin_notices', 'rank_math_welcome_window_redirect');
remove_action('admin_init', 'rank_math_welcome_window_redirect');

// ==========================================
// PLUGIN INFO
// ==========================================
?>
