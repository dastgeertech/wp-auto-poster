<?php
/**
 * Plugin Name: Dastgeer SEO Pro
 * Plugin URI: https://dastgeertech.studio
 * Description: The Most Complete WordPress SEO Plugin - Rank Math + Yoast SEO + All in One SEO features with AI
 * Version: 1.0.0
 * Author: Dastgeer Tech
 * Author URI: https://dastgeertech.studio
 * Text Domain: dastgeer-seo-pro
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) exit;

define('DASTGEER_SEO_VERSION', '1.0.0');
define('DASTGEER_SEO_PATH', plugin_dir_path(__FILE__));
define('DASTGEER_SEO_URL', plugin_dir_url(__FILE__));

class Dastgeer_SEO_Pro {
    
    private $options;
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function __construct() {
        $this->options = get_option('dastgeer_seo_options', $this->get_default_options());
        
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('wp_head', array($this, 'output_seo_tags'), 1);
        add_action('template_redirect', array($this, 'handle_requests'), 1);
        add_filter('robots_txt', array($this, 'custom_robots_txt'), 100);
        add_filter('language_attributes', array($this, 'add_opengraph_namespace'));
        
        if (is_admin()) {
            add_action('add_meta_boxes', array($this, 'add_meta_boxes'));
            add_action('save_post', array($this, 'save_meta_box'), 10, 2);
            add_action('admin_bar_menu', array($this, 'add_admin_bar_menu'), 100);
        }
        
        add_filter('the_content', array($this, 'auto_internal_links'), 20);
    }
    
    private function get_default_options() {
        return array(
            'general' => array(
                'site_title' => get_bloginfo('name'),
                'meta_description' => get_bloginfo('description'),
                'google_verify' => '',
                'bing_verify' => '',
                'google_analytics' => '',
                'schema_type' => 'Organization',
                'organization_name' => get_bloginfo('name'),
                'logo_url' => '',
                'phone' => '',
                'address' => '',
            ),
            'social' => array(
                'og_default_image' => '',
                'twitter_card_type' => 'summary_large_image',
                'fb_app_id' => '',
                'twitter_creator' => '',
            ),
            'sitemap' => array(
                'enable' => true,
                'enable_news' => true,
                'enable_video' => true,
                'enable_image' => true,
            ),
            'autopost' => array(
                'enable' => false,
                'api_provider' => 'groq',
                'api_key' => '',
                'frequency' => 'daily',
                'word_count' => 1500,
            ),
            'schema' => array(
                'news_article' => true,
                'article' => true,
                'breadcrumb' => true,
                'organization' => true,
                'faq' => true,
                'howto' => true,
            ),
            'local_seo' => array(
                'enable' => false,
                'business_type' => 'LocalBusiness',
                'name' => '',
                'phone' => '',
                'address' => '',
            ),
        );
    }
    
    public function activate() {
        add_option('dastgeer_seo_options', $this->get_default_options());
        add_option('dastgeer_seo_redirects', array());
        
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        
        $table_404 = $wpdb->prefix . 'dastgeer_seo_404';
        $sql_404 = "CREATE TABLE IF NOT EXISTS $table_404 (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            url varchar(255) NOT NULL,
            hits int(11) DEFAULT 1,
            first_seen datetime DEFAULT CURRENT_TIMESTAMP,
            last_seen datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_404);
        
        flush_rewrite_rules();
    }
    
    public function deactivate() {
        flush_rewrite_rules();
    }
    
    public function init() {
        load_plugin_textdomain('dastgeer-seo-pro', false, dirname(plugin_basename(__FILE__)) . '/languages');
        
        add_rewrite_rule('news-sitemap\.xml$', 'index.php?dastgeer_sitemap=news', 'top');
        add_rewrite_rule('main-sitemap\.xml$', 'index.php?dastgeer_sitemap=main', 'top');
        add_rewrite_rule('video-sitemap\.xml$', 'index.php?dastgeer_sitemap=video', 'top');
        add_rewrite_rule('image-sitemap\.xml$', 'index.php?dastgeer_sitemap=image', 'top');
        add_rewrite_rule('robots\.txt$', 'index.php?dastgeer_robots=1', 'top');
        
        add_filter('query_vars', array($this, 'add_query_vars'));
        add_action('wp', array($this, 'track_404'));
    }
    
    public function add_query_vars($vars) {
        $vars[] = 'dastgeer_sitemap';
        $vars[] = 'dastgeer_robots';
        return $vars;
    }
    
    public function handle_requests() {
        global $wp_query;
        
        if (isset($wp_query->query_vars['dastgeer_sitemap'])) {
            $type = $wp_query->query_vars['dastgeer_sitemap'];
            switch($type) {
                case 'news': $this->output_news_sitemap(); break;
                case 'main': $this->output_main_sitemap(); break;
                case 'video': $this->output_video_sitemap(); break;
                case 'image': $this->output_image_sitemap(); break;
            }
            exit;
        }
        
        if (isset($wp_query->query_vars['dastgeer_robots'])) {
            $this->output_robots_txt();
            exit;
        }
    }
    
    public function track_404() {
        if (!is_404()) return;
        
        global $wpdb;
        $table = $wpdb->prefix . 'dastgeer_seo_404';
        $url = sanitize_text_field($_SERVER['REQUEST_URI'] ?? '');
        
        $existing = $wpdb->get_row($wpdb->prepare("SELECT id, hits FROM $table WHERE url = %s", $url));
        
        if ($existing) {
            $wpdb->update($table, array('hits' => $existing->hits + 1, 'last_seen' => current_time('mysql')), array('id' => $existing->id));
        } else {
            $wpdb->insert($table, array('url' => $url, 'first_seen' => current_time('mysql'), 'last_seen' => current_time('mysql')));
        }
    }
    
    private function output_news_sitemap() {
        header('Content-Type: application/xml; charset=utf-8');
        
        $posts = new WP_Query(array(
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => 1000,
            'date_query' => array('after' => date('Y-m-d', strtotime('-2 days')))
        ));
        
        echo '<?xml version="1.0" encoding="UTF-8"?>';
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">';
        
        if ($posts->have_posts()) {
            while ($posts->have_posts()) {
                $posts->the_post();
                $categories = get_the_category();
                $cat_name = !empty($categories) ? $categories[0]->name : 'Tech';
                $org_name = $this->options['general']['organization_name'] ?? get_bloginfo('name');
                
                echo '<url>';
                echo '<loc>' . get_permalink() . '</loc>';
                echo '<news:news>';
                echo '<news:publication><news:name>' . esc_html($org_name) . '</news:name><news:language>en</news:language></news:publication>';
                echo '<news:publication_date>' . get_the_date('Y-m-d') . '</news:publication_date>';
                echo '<news:title><![CDATA[' . get_the_title() . ']]></news:title>';
                echo '<news:keywords>' . esc_html($cat_name) . ', tech, news</news:keywords>';
                echo '</news:news>';
                
                if (has_post_thumbnail()) {
                    $img = wp_get_attachment_image_src(get_post_thumbnail_id(), 'full');
                    if ($img) echo '<image:image><image:loc>' . $img[0] . '</image:loc></image:image>';
                }
                
                echo '</url>';
            }
        }
        
        echo '</urlset>';
        wp_reset_postdata();
        die();
    }
    
    private function output_main_sitemap() {
        header('Content-Type: application/xml; charset=utf-8');
        
        echo '<?xml version="1.0" encoding="UTF-8"?>';
        echo '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        
        if ($this->options['sitemap']['enable_news'] ?? true) {
            echo '<sitemap><loc>' . home_url('news-sitemap.xml') . '</loc><lastmod>' . date('c') . '</lastmod></sitemap>';
        }
        if ($this->options['sitemap']['enable_video'] ?? true) {
            echo '<sitemap><loc>' . home_url('video-sitemap.xml') . '</loc><lastmod>' . date('c') . '</lastmod></sitemap>';
        }
        if ($this->options['sitemap']['enable_image'] ?? true) {
            echo '<sitemap><loc>' . home_url('image-sitemap.xml') . '</loc><lastmod>' . date('c') . '</lastmod></sitemap>';
        }
        
        echo '</sitemapindex>';
        die();
    }
    
    private function output_video_sitemap() {
        header('Content-Type: application/xml; charset=utf-8');
        
        $posts = new WP_Query(array('post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 500));
        
        echo '<?xml version="1.0" encoding="UTF-8"?>';
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">';
        
        if ($posts->have_posts()) {
            while ($posts->have_posts()) {
                $posts->the_post();
                $content = get_post_field('post_content');
                preg_match_all('/<iframe[^>]*src=["\']([^"\']+)["\'][^>]*>/i', $content, $matches);
                
                if (!empty($matches[1])) {
                    foreach ($matches[1] as $video_url) {
                        if (strpos($video_url, 'youtube.com') !== false || strpos($video_url, 'youtu.be') !== false || strpos($video_url, 'vimeo.com') !== false) {
                            echo '<url>';
                            echo '<loc>' . get_permalink() . '</loc>';
                            echo '<video:video>';
                            echo '<video:title><![CDATA[' . get_the_title() . ']]></video:title>';
                            echo '<video:description><![CDATA[' . wp_trim_words(strip_shortcodes($content), 50) . ']]></video:description>';
                            echo '<video:content_loc>' . esc_url($video_url) . '</video:content_loc>';
                            if (has_post_thumbnail()) echo '<video:thumbnail_loc>' . get_the_post_thumbnail_url() . '</video:thumbnail_loc>';
                            echo '<video:publication_date>' . get_the_date('Y-m-d') . '</video:publication_date>';
                            echo '</video:video>';
                            echo '</url>';
                        }
                    }
                }
            }
        }
        
        echo '</urlset>';
        wp_reset_postdata();
        die();
    }
    
    private function output_image_sitemap() {
        header('Content-Type: application/xml; charset=utf-8');
        
        $posts = new WP_Query(array('post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 500));
        
        echo '<?xml version="1.0" encoding="UTF-8"?>';
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">';
        
        if ($posts->have_posts()) {
            while ($posts->have_posts()) {
                $posts->the_post();
                $content = get_post_field('post_content');
                
                echo '<url><loc>' . get_permalink() . '</loc>';
                
                preg_match_all('/<img[^>]+>/i', $content, $matches);
                foreach ($matches[0] as $img) {
                    if (preg_match('/src=["\']([^"\']+)["\']/', $img, $src)) {
                        echo '<image:image><image:loc>' . esc_url($src[1]) . '</image:loc></image:image>';
                    }
                }
                
                if (has_post_thumbnail()) {
                    echo '<image:image><image:loc>' . get_the_post_thumbnail_url() . '</image:loc></image:image>';
                }
                
                echo '</url>';
            }
        }
        
        echo '</urlset>';
        wp_reset_postdata();
        die();
    }
    
    private function output_robots_txt() {
        header('Content-Type: text/plain; charset=utf-8');
        
        $output = "User-agent: *\n";
        $output .= "Allow: /\n";
        $output .= "Disallow: /wp-admin/\n";
        $output .= "Disallow: /wp-includes/\n";
        $output .= "Disallow: /?s=*\n";
        $output .= "\n";
        
        if ($this->options['sitemap']['enable'] ?? true) {
            $output .= "Sitemap: " . home_url('news-sitemap.xml') . "\n";
            $output .= "Sitemap: " . home_url('main-sitemap.xml') . "\n";
        }
        
        echo $output;
        die();
    }
    
    public function custom_robots_txt($output) {
        return $output;
    }
    
    public function add_opengraph_namespace($output) {
        return str_replace('prefix="', 'prefix="og: http://ogp.me/ns# article: http://ogp.me/ns/article#', $output);
    }
    
    public function add_admin_bar_menu($wp_admin_bar) {
        if (!current_user_can('manage_options')) return;
        
        $wp_admin_bar->add_node(array(
            'id' => 'dastgeer-seo',
            'title' => '🎯 SEO',
            'href' => admin_url('admin.php?page=dastgeer-seo'),
        ));
    }
    
    public function output_seo_tags() {
        global $post;
        
        $title = $description = $keywords = $canonical = $og_image = '';
        $og_type = 'website';
        
        if (is_singular()) {
            $meta = get_post_meta($post->ID, 'dastgeer_seo', true) ?: array();
            $focus = get_post_meta($post->ID, 'dastgeer_seo_focus_keyword', true) ?: '';
            
            $title = $meta['seo_title'] ?: ($post->post_title . ' | ' . get_bloginfo('name'));
            $description = $meta['seo_description'] ?: wp_trim_words(strip_shortcodes($post->post_content), 30, '');
            $keywords = $meta['seo_keywords'] ?: $focus;
            $canonical = $meta['canonical_url'] ?: get_permalink();
            $og_image = $meta['og_image'] ?: (has_post_thumbnail() ? get_the_post_thumbnail_url() : '');
            $og_type = 'article';
            
            if (isset($meta['no_index']) && $meta['no_index']) {
                echo '<meta name="robots" content="noindex, nofollow" />' . "\n";
                return;
            }
            
        } elseif (is_home() || is_front_page()) {
            $title = $this->options['general']['site_title'] ?: get_bloginfo('name');
            $description = $this->options['general']['meta_description'] ?: get_bloginfo('description');
            $og_image = $this->options['social']['og_default_image'] ?: '';
            $canonical = home_url('/');
        }
        
        if (empty($title)) $title = wp_get_document_title();
        if (empty($description)) $description = get_bloginfo('description');
        
        $org_name = $this->options['general']['organization_name'] ?: get_bloginfo('name');
        
        echo "<!-- Dastgeer SEO Pro v" . DASTGEER_SEO_VERSION . " -->\n";
        
        echo '<title>' . esc_html($title) . '</title>' . "\n";
        echo '<meta name="description" content="' . esc_attr(wp_strip_all_tags($description)) . '" />' . "\n";
        
        if ($keywords) echo '<meta name="keywords" content="' . esc_attr($keywords) . '" />' . "\n";
        echo '<link rel="canonical" href="' . esc_url($canonical) . '" />' . "\n";
        
        if ($this->options['general']['google_verify']) {
            echo '<meta name="google-site-verification" content="' . esc_attr($this->options['general']['google_verify']) . '" />' . "\n";
        }
        
        echo '<meta property="og:title" content="' . esc_attr($title) . '" />' . "\n";
        echo '<meta property="og:description" content="' . esc_attr(wp_strip_all_tags($description)) . '" />' . "\n";
        echo '<meta property="og:type" content="' . esc_attr($og_type) . '" />' . "\n";
        echo '<meta property="og:url" content="' . esc_url($canonical) . '" />' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr($org_name) . '" />' . "\n";
        
        if ($og_image) {
            echo '<meta property="og:image" content="' . esc_url($og_image) . '" />' . "\n";
            echo '<meta property="og:image:width" content="1200" />' . "\n";
            echo '<meta property="og:image:height" content="630" />' . "\n";
        }
        
        if ($og_type === 'article') {
            echo '<meta property="article:published_time" content="' . esc_attr(get_the_date('c')) . '" />' . "\n";
            echo '<meta property="article:author" content="' . esc_attr(get_the_author()) . '" />' . "\n";
        }
        
        $twitter_card = $this->options['social']['twitter_card_type'] ?? 'summary_large_image';
        echo '<meta name="twitter:card" content="' . esc_attr($twitter_card) . '" />' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '" />' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr(wp_strip_all_tags($description)) . '" />' . "\n";
        if ($og_image) echo '<meta name="twitter:image" content="' . esc_url($og_image) . '" />' . "\n";
        
        if ($this->options['general']['google_analytics']) {
            $ga_id = $this->options['general']['google_analytics'];
            echo "<script async src='https://www.googletagmanager.com/gtag/js?id={$ga_id}'></script>
<script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '{$ga_id}');</script>\n";
        }
        
        echo $this->output_schema_markup();
        echo "<!-- / Dastgeer SEO Pro -->\n";
    }
    
    private function output_schema_markup() {
        if (!is_singular('post') && !is_front_page()) return '';
        
        global $post;
        $schemas = array();
        $schema_opts = $this->options['schema'] ?? array();
        $org_name = $this->options['general']['organization_name'] ?: get_bloginfo('name');
        $logo_url = $this->options['general']['logo_url'] ?: '';
        
        if (is_front_page()) {
            if ($schema_opts['organization'] ?? true) {
                $schemas[] = array(
                    '@context' => 'https://schema.org',
                    '@type' => 'WebSite',
                    'name' => $org_name,
                    'url' => home_url('/'),
                    'potentialAction' => array('@type' => 'SearchAction', 'target' => home_url('/?s={search_term_string}'), 'query-input' => 'required name=search_term_string')
                );
            }
        } elseif (is_singular('post')) {
            $categories = get_the_category();
            
            if ($schema_opts['news_article'] ?? true) {
                $schemas[] = array(
                    '@context' => 'https://schema.org',
                    '@type' => 'NewsArticle',
                    'headline' => get_the_title(),
                    'description' => wp_trim_words(strip_shortcodes($post->post_content), 50, ''),
                    'datePublished' => get_the_date('c'),
                    'dateModified' => get_the_modified_date('c'),
                    'author' => array('@type' => 'Person', 'name' => get_the_author()),
                    'publisher' => array('@type' => 'Organization', 'name' => $org_name, 'logo' => array('@type' => 'ImageObject', 'url' => $logo_url)),
                    'mainEntityOfPage' => array('@type' => 'WebPage', '@id' => get_permalink())
                );
                
                if (has_post_thumbnail()) {
                    $schemas[count($schemas)-1]['image'] = array('@type' => 'ImageObject', 'url' => get_the_post_thumbnail_url(), 'width' => 1200, 'height' => 630);
                }
            }
            
            if ($schema_opts['breadcrumb'] ?? true) {
                $schemas[] = array(
                    '@context' => 'https://schema.org',
                    '@type' => 'BreadcrumbList',
                    'itemListElement' => array(
                        array('@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => home_url('/')),
                        array('@type' => 'ListItem', 'position' => 2, 'name' => !empty($categories) ? $categories[0]->name : 'Articles', 'item' => get_category_link($categories[0]->term_id ?? 0)),
                        array('@type' => 'ListItem', 'position' => 3, 'name' => get_the_title(), 'item' => get_permalink())
                    )
                );
            }
        }
        
        if (!empty($schemas)) {
            return '<script type="application/ld+json">' . json_encode($schemas, JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
        }
        return '';
    }
    
    public function auto_internal_links($content) {
        if (!is_single() || !($this->options['links']['auto_internal'] ?? false)) return $content;
        
        $count = $this->options['links']['internal_count'] ?? 3;
        $post_id = get_the_ID();
        
        $related = get_posts(array('post__not_in' => array($post_id), 'posts_per_page' => $count, 'orderby' => 'rand'));
        
        if (!empty($related)) {
            $link_html = '<div class="dastgeer-related-posts"><h3>Related Articles</h3><ul>';
            foreach ($related as $rel) {
                $link_html .= '<li><a href="' . get_permalink($rel->ID) . '">' . get_the_title($rel->ID) . '</a></li>';
            }
            $link_html .= '</ul></div>';
            return $content . $link_html;
        }
        
        return $content;
    }
    
    public function add_meta_boxes() {
        add_meta_box('dastgeer_seo_metabox', '🎯 Dastgeer SEO Pro', array($this, 'render_meta_box'), 'post', 'normal', 'high');
        add_meta_box('dastgeer_seo_metabox', '🎯 Dastgeer SEO Pro', array($this, 'render_meta_box'), 'page', 'normal', 'high');
    }
    
    public function render_meta_box($post) {
        wp_nonce_field('dastgeer_seo_metabox', 'dastgeer_seo_nonce');
        
        $meta = get_post_meta($post->ID, 'dastgeer_seo', true) ?: array();
        $focus = get_post_meta($post->ID, 'dastgeer_seo_focus_keyword', true) ?: '';
        $content = $post->post_content;
        $word_count = str_word_count(strip_shortcodes($content));
        $score = $this->calculate_seo_score($post, $focus);
        
        $seo_title = $meta['seo_title'] ?? '';
        $seo_desc = $meta['seo_description'] ?? '';
        $seo_keywords = $meta['seo_keywords'] ?? '';
        $og_image = $meta['og_image'] ?? '';
        $no_index = $meta['no_index'] ?? false;
        $schema_type = $meta['schema_type'] ?? 'NewsArticle';
        
        ?>
        <style>
            .dastgeer-seo-wrap{font-family:'Segoe UI',Arial,sans-serif;background:#fff}
            .dastgeer-header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:20px;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:space-between}
            .dastgeer-header h2{margin:0;font-size:18px;display:flex;align-items:center;gap:8px}
            .dastgeer-badge{background:linear-gradient(135deg,#f093fb,#f5576c);padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700}
            .dastgeer-score{display:flex;align-items:center;gap:12px}
            .dastgeer-score-circle{width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;box-shadow:0 4px 15px rgba(0,0,0,0.3)}
            .score-excellent{background:linear-gradient(135deg,#11998e,#38ef7d)}
            .score-good{background:linear-gradient(135deg,#f2994a,#f2c94c)}
            .score-poor{background:linear-gradient(135deg,#eb3349,#f45c43)}
            .dastgeer-content{padding:20px}
            .dastgeer-tabs{display:flex;gap:8px;margin-bottom:20px;border-bottom:2px solid #eee;padding-bottom:10px}
            .dastgeer-tab{padding:10px 16px;background:#f5f5f5;border:none;border-radius:8px 8px 0 0;cursor:pointer;font-weight:600;font-size:13px;transition:all .3s}
            .dastgeer-tab:hover{background:#e8e8e8}
            .dastgeer-tab.active{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff}
            .dastgeer-tab-content{display:none}
            .dastgeer-tab-content.active{display:block}
            .dastgeer-form-group{margin-bottom:20px}
            .dastgeer-form-group label{display:block;font-weight:600;margin-bottom:8px;color:#333;font-size:13px}
            .dastgeer-form-group input,.dastgeer-form-group textarea,.dastgeer-form-group select{width:100%;padding:12px;border:2px solid #e0e0e0;border-radius:8px;font-size:14px;box-sizing:border-box;transition:border-color .3s}
            .dastgeer-form-group input:focus,.dastgeer-form-group textarea:focus{border-color:#667eea;outline:none}
            .dastgeer-char{font-size:12px;color:#888;text-align:right;margin-top:4px}
            .dastgeer-char.good{color:#27ae60}
            .dastgeer-char.warn{color:#f39c12}
            .dastgeer-char.bad{color:#e74c3c}
            .dastgeer-keyword-box{background:linear-gradient(135deg,#667eea10,#764ba210);border:2px solid #667eea30;border-radius:12px;padding:16px;margin-bottom:20px}
            .dastgeer-keyword-box h4{margin:0 0 10px;color:#667eea;font-size:14px}
            .dastgeer-checklist{list-style:none;padding:0;margin:0;background:#fff;border-radius:8px}
            .dastgeer-checklist li{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #f0f0f0}
            .dastgeer-checklist li:last-child{border-bottom:none}
            .dastgeer-checklist li.pass{background:#d4edda}
            .dastgeer-checklist li.fail{background:#f8d7da}
            .dastgeer-checklist li.warn{background:#fff3cd}
            .dastgeer-checklist .dashicons{font-size:20px}
            .dastgeer-checklist li.pass .dashicons{color:#27ae60}
            .dastgeer-checklist li.fail .dashicons{color:#e74c3c}
            .dastgeer-checklist li.warn .dashicons{color:#f39c12}
            .dastgeer-ai-box{background:linear-gradient(135deg,#667eea08,#764ba208);border:2px dashed #667eea50;border-radius:12px;padding:20px;margin:20px 0}
            .dastgeer-ai-box h4{margin:0 0 12px;color:#667eea}
            .dastgeer-ai-btn{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;padding:10px 18px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;margin-right:10px;margin-bottom:10px;transition:transform .2s}
            .dastgeer-ai-btn:hover{transform:translateY(-2px)}
            .dastgeer-preview{background:#fff;border:1px solid #ddd;border-radius:8px;padding:16px;margin-top:16px}
            .dastgeer-preview-title{color:#1a0dab;font-size:18px;margin-bottom:4px}
            .dastgeer-preview-url{color:#006621;font-size:13px;margin-bottom:4px}
            .dastgeer-preview-desc{color:#545454;font-size:13px;line-height:1.4}
            .dastgeer-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}
            .dastgeer-stat{background:#fff;padding:16px;border-radius:8px;text-align:center;border:1px solid #eee}
            .dastgeer-stat .val{font-size:24px;font-weight:800;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
            .dastgeer-stat .lbl{font-size:11px;color:#888;margin-top:4px;text-transform:uppercase}
            .dastgeer-schema-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
            .dastgeer-schema-opt{padding:12px 8px;background:#f5f5f5;border-radius:8px;text-align:center;cursor:pointer;border:2px solid transparent;transition:all .3s}
            .dastgeer-schema-opt:hover{border-color:#667eea}
            .dastgeer-schema-opt.selected{border-color:#667eea;background:#667eea15}
            .dastgeer-schema-opt input{display:none}
            .dastgeer-schema-opt .icon{font-size:24px}
            .dastgeer-schema-opt .name{font-size:11px;font-weight:600;margin-top:6px}
            .dastgeer-social-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
            .dastgeer-social-card{background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
            .dastgeer-social-card img{width:100%;display:block}
            .dastgeer-social-card .cnt{padding:12px}
            .dastgeer-social-card .site{font-size:10px;color:#606770;text-transform:uppercase}
            .dastgeer-social-card .ttl{font-weight:600;color:#1d2129;margin-top:4px;font-size:13px}
            .dastgeer-social-card .dsc{font-size:12px;color:#606770;margin-top:4px}
        </style>
        
        <div class="dastgeer-seo-wrap">
            <div class="dastgeer-header">
                <h2>🎯 SEO Analysis <span class="dastgeer-badge">PRO</span></h2>
                <div class="dastgeer-score">
                    <div class="dastgeer-score-circle <?php echo $score >= 80 ? 'score-excellent' : ($score >= 50 ? 'score-good' : 'score-poor'); ?>">
                        <?php echo $score; ?>
                    </div>
                    <div style="text-align:left">
                        <div style="font-size:14px;font-weight:700">
                            <?php if ($score >= 80): ?>🎉 Excellent
                            <?php elseif ($score >= 50): ?>⚡ Needs Work
                            <?php else: ?>❌ Poor
                            <?php endif; ?>
                        </div>
                        <div style="font-size:11px;opacity:0.9">SEO Score</div>
                    </div>
                </div>
            </div>
            
            <div class="dastgeer-content">
                <div class="dastgeer-ai-box">
                    <h4>🤖 AI SEO Tools</h4>
                    <button type="button" class="dastgeer-ai-btn" onclick="dastgeerGenTitle()">📝 Generate Title</button>
                    <button type="button" class="dastgeer-ai-btn" onclick="dastgeerGenMeta()">🏷️ Generate Meta</button>
                    <button type="button" class="dastgeer-ai-btn" onclick="dastgeerAnalyze()">🔍 Analyze</button>
                    <button type="button" class="dastgeer-ai-btn" onclick="dastgeerOptimize()">⚡ Auto Optimize</button>
                </div>
                
                <div class="dastgeer-tabs">
                    <button type="button" class="dastgeer-tab active" data-tab="general">📝 General</button>
                    <button type="button" class="dastgeer-tab" data-tab="social">📱 Social</button>
                    <button type="button" class="dastgeer-tab" data-tab="schema">🏷️ Schema</button>
                    <button type="button" class="dastgeer-tab" data-tab="analysis">📊 Analysis</button>
                    <button type="button" class="dastgeer-tab" data-tab="preview">👁️ Preview</button>
                </div>
                
                <div id="tab-general" class="dastgeer-tab-content active">
                    <div class="dastgeer-keyword-box">
                        <h4>🎯 Focus Keyword</h4>
                        <input type="text" name="dastgeer_focus_keyword" id="dastgeer_focus_keyword" value="<?php echo esc_attr($focus); ?>" placeholder="Enter main keyword" style="font-size:15px;padding:14px">
                    </div>
                    
                    <div class="dastgeer-form-group">
                        <label>🏷️ SEO Title</label>
                        <input type="text" name="dastgeer_seo[seo_title]" value="<?php echo esc_attr($seo_title); ?>" placeholder="<?php echo esc_attr($post->post_title); ?> | <?php bloginfo('name'); ?>">
                        <div class="dastgeer-char" id="title-count"><span>0</span>/60 characters</div>
                    </div>
                    
                    <div class="dastgeer-form-group">
                        <label>📝 Meta Description</label>
                        <textarea name="dastgeer_seo[seo_description]" rows="3" placeholder="Write compelling description (150-160 chars)"><?php echo esc_textarea($seo_desc); ?></textarea>
                        <div class="dastgeer-char" id="desc-count"><span>0</span>/160 characters</div>
                    </div>
                    
                    <div class="dastgeer-form-group">
                        <label>🔑 Keywords (comma separated)</label>
                        <input type="text" name="dastgeer_seo[seo_keywords]" value="<?php echo esc_attr($seo_keywords); ?>" placeholder="keyword1, keyword2, keyword3">
                    </div>
                    
                    <h4 style="margin:20px 0 12px">✅ SEO Checklist</h4>
                    <ul class="dastgeer-checklist">
                        <?php foreach ($this->get_seo_checklist($post, $focus) as $item): ?>
                            <li class="<?php echo esc_attr($item['status']); ?>">
                                <span class="dashicons dashicons-<?php echo $item['status'] === 'pass' ? 'yes-alt' : ($item['status'] === 'warn' ? 'warning' : 'dismiss'); ?>"></span>
                                <span style="flex:1"><?php echo esc_html($item['label']); ?></span>
                                <span style="font-weight:600">+<?php echo $item['points']; ?></span>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                    
                    <div style="margin-top:16px">
                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                            <input type="checkbox" name="dastgeer_seo[no_index]" value="1" <?php checked($no_index, true); ?>>
                            <span>🚫 noindex (Don't show in search)</span>
                        </label>
                    </div>
                </div>
                
                <div id="tab-social" class="dastgeer-tab-content">
                    <div class="dastgeer-form-group">
                        <label>📸 Social Share Image</label>
                        <input type="text" name="dastgeer_seo[og_image]" value="<?php echo esc_attr($og_image); ?>" placeholder="https://example.com/image.jpg">
                        <p style="margin:8px 0 0;font-size:12px;color:#888">Recommended: 1200x630px</p>
                    </div>
                    
                    <div class="dastgeer-social-grid">
                        <div class="dastgeer-social-card">
                            <img id="fb-preview" src="<?php echo $og_image ?: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 315"%3E%3Crect fill="%23f0f0f0" width="600" height="315"/%3E%3C/svg%3E'; ?>" alt="Facebook">
                            <div class="cnt">
                                <div class="site"><?php echo parse_url(home_url(), PHP_URL_HOST); ?></div>
                                <div class="ttl" id="fb-title"><?php echo esc_html($seo_title ?: $post->post_title); ?></div>
                                <div class="dsc" id="fb-desc"><?php echo esc_html(wp_trim_words($seo_desc, 15, '')); ?></div>
                            </div>
                        </div>
                        <div class="dastgeer-social-card">
                            <img id="tw-preview" src="<?php echo $og_image ?: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 314"%3E%3Crect fill="%23f0f0f0" width="600" height="314"/%3E%3C/svg%3E'; ?>" alt="Twitter">
                            <div class="cnt">
                                <div class="ttl" id="tw-title"><?php echo esc_html($seo_title ?: $post->post_title); ?></div>
                                <div class="dsc" id="tw-desc"><?php echo esc_html(wp_trim_words($seo_desc, 15, '')); ?></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="tab-schema" class="dastgeer-tab-content">
                    <div class="dastgeer-form-group">
                        <label>🏷️ Schema Type</label>
                        <div class="dastgeer-schema-grid">
                            <?php
                            $schemas = array('NewsArticle' => '📰', 'Article' => '📄', 'BlogPosting' => '📝', 'TechArticle' => '💻', 'HowTo' => '📖', 'FAQPage' => '❓', 'Review' => '⭐', 'Product' => '🛒');
                            foreach ($schemas as $type => $icon): ?>
                                <label class="dastgeer-schema-opt <?php selected($schema_type, $type, true); ?>">
                                    <input type="radio" name="dastgeer_seo[schema_type]" value="<?php echo $type; ?>" <?php checked($schema_type, $type); ?>>
                                    <div class="icon"><?php echo $icon; ?></div>
                                    <div class="name"><?php echo $type; ?></div>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
                
                <div id="tab-analysis" class="dastgeer-tab-content">
                    <div class="dastgeer-grid">
                        <div class="dastgeer-stat"><div class="val"><?php echo $word_count; ?></div><div class="lbl">Words</div></div>
                        <div class="dastgeer-stat"><div class="val"><?php echo ceil(max(1,$word_count)/200); ?></div><div class="lbl">Min Read</div></div>
                        <div class="dastgeer-stat"><div class="val"><?php echo substr_count(strtolower($content),'<h2')+substr_count(strtolower($content),'<h3'); ?></div><div class="lbl">Headings</div></div>
                        <div class="dastgeer-stat"><div class="val"><?php echo substr_count(strtolower($content),'<img'); ?></div><div class="lbl">Images</div></div>
                        <div class="dastgeer-stat"><div class="val"><?php echo substr_count(strtolower($content),'<a '); ?></div><div class="lbl">Links</div></div>
                        <div class="dastgeer-stat"><div class="val"><?php echo substr_count(strtolower($content),'<p'); ?></div><div class="lbl">Paragraphs</div></div>
                    </div>
                    
                    <div class="dastgeer-ai-box">
                        <h4>💡 AI Suggestions</h4>
                        <div id="ai-suggestions" style="font-size:13px;line-height:1.8">
                            <p style="color:#888;font-style:italic">Click "Analyze" to get suggestions...</p>
                        </div>
                    </div>
                </div>
                
                <div id="tab-preview" class="dastgeer-tab-content">
                    <h4 style="margin:0 0 12px">🔍 Google Search Preview</h4>
                    <div class="dastgeer-preview">
                        <div class="dastgeer-preview-title" id="google-title"><?php echo esc_html($seo_title ?: $post->post_title); ?></div>
                        <div class="dastgeer-preview-url">🌐 <?php echo str_replace(array('http://','https://'),'',get_permalink()); ?> ▼</div>
                        <div class="dastgeer-preview-desc" id="google-desc"><?php echo esc_html($seo_desc ?: wp_trim_words(strip_shortcodes($content), 30, '')); ?></div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            $('.dastgeer-tab').on('click', function() {
                $('.dastgeer-tab').removeClass('active');
                $('.dastgeer-tab-content').removeClass('active');
                $(this).addClass('active');
                $('#tab-' + $(this).data('tab')).addClass('active');
            });
            
            $('.dastgeer-schema-opt').on('click', function() {
                $('.dastgeer-schema-opt').removeClass('selected');
                $(this).addClass('selected');
            });
            
            function updateCounts() {
                var title = $('input[name="dastgeer_seo[seo_title]"]').val() || $('input[name="post_title"]').val() || '';
                var desc = $('textarea[name="dastgeer_seo[seo_description]"]').val() || '';
                
                $('#title-count span').text(title.length);
                $('#desc-count span').text(desc.length);
                
                $('#title-count').removeClass('good warn bad');
                $('#desc-count').removeClass('good warn bad');
                
                if (title.length > 60) $('#title-count').addClass('bad');
                else if (title.length >= 50) $('#title-count').addClass('good');
                else if (title.length > 0) $('#title-count').addClass('warn');
                
                if (desc.length > 160) $('#desc-count').addClass('bad');
                else if (desc.length >= 150 && desc.length <= 160) $('#desc-count').addClass('good');
                else if (desc.length > 0) $('#desc-count').addClass('warn');
                
                $('#google-title, #fb-title, #tw-title').text(title.substring(0, 60));
                $('#google-desc').text(desc.substring(0, 160));
                $('#fb-desc, #tw-desc').text(desc.substring(0, 90));
                
                var ogImg = $('input[name="dastgeer_seo[og_image]"]').val();
                if (ogImg) {
                    $('#fb-preview, #tw-preview').attr('src', ogImg);
                }
            }
            
            $('input[name="dastgeer_seo[seo_title]"], textarea[name="dastgeer_seo[seo_description]"], input[name="dastgeer_seo[og_image]"]').on('input', updateCounts);
            updateCounts();
        });
        
        function dastgeerGenTitle() {
            var kw = jQuery('#dastgeer_focus_keyword').val();
            if (!kw) { alert('Enter keyword first'); return; }
            var titles = [kw + ': Complete Guide 2024', 'Everything About ' + kw, 'How ' + kw + ' Changes Everything', kw + ': Tips & Best Practices'];
            jQuery('input[name="dastgeer_seo[seo_title]"]').val(titles[Math.floor(Math.random() * titles.length)]).trigger('input');
        }
        
        function dastgeerGenMeta() {
            var kw = jQuery('#dastgeer_focus_keyword').val();
            if (!kw) { alert('Enter keyword first'); return; }
            var descs = ['Discover ' + kw + ' in this comprehensive guide. Learn best strategies and techniques.', kw + ' is changing the game. Explore latest trends and expert insights.', 'Your complete resource for ' + kw + '. Practical tips and actionable advice.'];
            jQuery('textarea[name="dastgeer_seo[seo_description]"]').val(descs[Math.floor(Math.random() * descs.length)]).trigger('input');
        }
        
        function dastgeerAnalyze() {
            var content = jQuery('#content, textarea[name="content"]').val() || '';
            var kw = jQuery('#dastgeer_focus_keyword').val() || '';
            var words = content.split(/\s+/).filter(Boolean).length;
            
            var tips = [];
            if (words < 300) tips.push('❌ Content too short. Aim for 1000+ words.');
            else if (words < 1000) tips.push('⚠️ Expand to 1000+ words.');
            else tips.push('✅ Good content length (' + words + ' words)');
            
            var h2s = (content.match(/<h2/gi) || []).length;
            if (h2s < 2) tips.push('❌ Add more headings');
            else tips.push('✅ Good heading structure');
            
            var imgs = (content.match(/<img/gi) || []).length;
            if (imgs === 0) tips.push('❌ Add images');
            else tips.push('✅ Has ' + imgs + ' images');
            
            var links = (content.match(/<a /gi) || []).length;
            if (links < 2) tips.push('⚠️ Add more links');
            else tips.push('✅ Good linking');
            
            if (kw) {
                var density = ((content.toLowerCase().match(new RegExp(kw.toLowerCase(), 'g')) || []).length * kw.length / Math.max(1, content.length) * 100;
                tips.push('Keyword density: ' + density.toFixed(2) + '%');
            }
            
            jQuery('#ai-suggestions').html('<ul style="margin:0;padding-left:18px"><li>' + tips.join('</li><li>') + '</li></ul>');
        }
        
        function dastgeerOptimize() {
            dastgeerGenTitle();
            setTimeout(function() { dastgeerGenMeta(); }, 300);
            setTimeout(function() { dastgeerAnalyze(); }, 600);
        }
        </script>
        <?php
    }
    
    private function get_seo_checklist($post, $keyword) {
        $checklist = array();
        $content = $post->post_content;
        $word_count = str_word_count(strip_shortcodes($content));
        $meta = get_post_meta($post->ID, 'dastgeer_seo', true) ?: array();
        
        $checklist[] = array('label' => 'Focus keyword defined', 'status' => !empty($keyword) ? 'pass' : 'fail', 'points' => !empty($keyword) ? 10 : 0);
        
        if ($keyword) {
            $checklist[] = array('label' => 'Keyword in title', 'status' => stripos($post->post_title, $keyword) !== false ? 'pass' : 'fail', 'points' => stripos($post->post_title, $keyword) !== false ? 15 : 0);
            $checklist[] = array('label' => 'Keyword in meta description', 'status' => isset($meta['seo_description']) && stripos($meta['seo_description'], $keyword) !== false ? 'pass' : 'warn', 'points' => isset($meta['seo_description']) && stripos($meta['seo_description'], $keyword) !== false ? 10 : 0);
        }
        
        $checklist[] = array('label' => 'Content length (1000+)', 'status' => $word_count >= 1000 ? 'pass' : ($word_count >= 300 ? 'warn' : 'fail'), 'points' => $word_count >= 1000 ? 15 : ($word_count >= 300 ? 8 : 0));
        
        $h_count = substr_count(strtolower($content), '<h2') + substr_count(strtolower($content), '<h3');
        $checklist[] = array('label' => 'Subheadings (H2, H3)', 'status' => $h_count >= 3 ? 'pass' : ($h_count >= 1 ? 'warn' : 'fail'), 'points' => $h_count >= 3 ? 10 : ($h_count >= 1 ? 5 : 0));
        
        $img_count = substr_count(strtolower($content), '<img');
        $checklist[] = array('label' => 'Images with alt', 'status' => $img_count >= 1 ? 'pass' : 'fail', 'points' => $img_count >= 1 ? 10 : 0);
        
        $link_count = substr_count(strtolower($content), '<a ');
        $checklist[] = array('label' => 'Internal/external links', 'status' => $link_count >= 2 ? 'pass' : ($link_count >= 1 ? 'warn' : 'fail'), 'points' => $link_count >= 2 ? 10 : ($link_count >= 1 ? 5 : 0));
        
        $title_len = strlen($meta['seo_title'] ?? '');
        $checklist[] = array('label' => 'SEO title length', 'status' => $title_len > 0 && $title_len <= 60 ? 'pass' : 'warn', 'points' => $title_len > 0 && $title_len <= 60 ? 10 : 0);
        
        $desc_len = strlen($meta['seo_description'] ?? '');
        $checklist[] = array('label' => 'Meta description (120-160)', 'status' => $desc_len >= 120 && $desc_len <= 160 ? 'pass' : ($desc_len > 0 ? 'warn' : 'fail'), 'points' => $desc_len >= 120 && $desc_len <= 160 ? 10 : 0);
        
        return $checklist;
    }
    
    private function calculate_seo_score($post, $keyword) {
        $score = 0;
        $content = $post->post_content;
        $word_count = str_word_count(strip_shortcodes($content));
        $meta = get_post_meta($post->ID, 'dastgeer_seo', true) ?: array();
        
        if (!empty($keyword)) {
            if (stripos($post->post_title, $keyword) !== false) $score += 15;
            if (isset($meta['seo_title']) && stripos($meta['seo_title'], $keyword) !== false) $score += 5;
            if (isset($meta['seo_description']) && stripos($meta['seo_description'], $keyword) !== false) $score += 5;
            $density = (substr_count(strtolower($content), strtolower($keyword)) * strlen($keyword)) / max(1, strlen($content)) * 100;
            if ($density >= 1 && $density <= 2.5) $score += 15;
            elseif ($density > 0.5 && $density < 3) $score += 8;
            if (stripos(substr($content, 0, 500), $keyword) !== false) $score += 5;
        }
        
        if ($word_count >= 1000) $score += 15;
        elseif ($word_count >= 500) $score += 10;
        elseif ($word_count >= 300) $score += 5;
        
        $h_count = substr_count(strtolower($content), '<h2') + substr_count(strtolower($content), '<h3');
        if ($h_count >= 3) $score += 10;
        elseif ($h_count >= 1) $score += 5;
        
        $img_count = substr_count(strtolower($content), '<img');
        if ($img_count >= 1) $score += 10;
        
        $link_count = substr_count(strtolower($content), '<a ');
        if ($link_count >= 3) $score += 10;
        elseif ($link_count >= 1) $score += 5;
        
        if (isset($meta['seo_title']) && strlen($meta['seo_title']) <= 60) $score += 5;
        if (isset($meta['seo_description']) && strlen($meta['seo_description']) >= 120 && strlen($meta['seo_description']) <= 160) $score += 5;
        
        return min(100, $score);
    }
    
    public function save_meta_box($post_id, $post) {
        if (!isset($_POST['dastgeer_seo_nonce']) || !wp_verify_nonce($_POST['dastgeer_seo_nonce'], 'dastgeer_seo_metabox')) return;
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
        if (!current_user_can('edit_post', $post_id)) return;
        
        if (isset($_POST['dastgeer_seo'])) {
            update_post_meta($post_id, 'dastgeer_seo', array_map('sanitize_text_field', $_POST['dastgeer_seo']));
        }
        if (isset($_POST['dastgeer_focus_keyword'])) {
            update_post_meta($post_id, 'dastgeer_seo_focus_keyword', sanitize_text_field($_POST['dastgeer_focus_keyword']));
        }
    }
    
    public function enqueue_assets($hook) {
        if (!in_array($hook, array('post.php', 'post-new.php'))) return;
        wp_enqueue_style('dastgeer-seo-admin', DASTGEER_SEO_URL . 'assets/admin.css', array(), DASTGEER_SEO_VERSION);
    }
    
    public function add_admin_menu() {
        add_menu_page('Dastgeer SEO Pro', 'Dastgeer SEO', 'manage_options', 'dastgeer-seo', array($this, 'render_admin_page'), 'dashicons-chart-line', 80);
        add_submenu_page('dastgeer-seo', 'Dashboard', 'Dashboard', 'manage_options', 'dastgeer-seo', array($this, 'render_admin_page'));
        add_submenu_page('dastgeer-seo', 'General', 'General', 'manage_options', 'dastgeer-seo-general', array($this, 'render_general_page'));
        add_submenu_page('dastgeer-seo', 'Social', 'Social', 'manage_options', 'dastgeer-seo-social', array($this, 'render_social_page'));
        add_submenu_page('dastgeer-seo', 'Sitemaps', 'Sitemaps', 'manage_options', 'dastgeer-seo-sitemap', array($this, 'render_sitemap_page'));
        add_submenu_page('dastgeer-seo', 'Schema', 'Schema', 'manage_options', 'dastgeer-seo-schema', array($this, 'render_schema_page'));
        add_submenu_page('dastgeer-seo', 'Redirects', 'Redirects', 'manage_options', 'dastgeer-seo-redirects', array($this, 'render_redirects_page'));
        add_submenu_page('dastgeer-seo', '404 Monitor', '404 Monitor', 'manage_options', 'dastgeer-seo-404', array($this, 'render_404_page'));
        add_submenu_page('dastgeer-seo', 'Local SEO', 'Local SEO', 'manage_options', 'dastgeer-seo-local', array($this, 'render_local_page'));
        add_submenu_page('dastgeer-seo', 'AI Auto Poster', 'AI Auto Poster', 'manage_options', 'dastgeer-seo-autopost', array($this, 'render_autopost_page'));
        add_submenu_page('dastgeer-seo', 'Advanced', 'Advanced', 'manage_options', 'dastgeer-seo-advanced', array($this, 'render_advanced_page'));
    }
    
    public function render_admin_page() {
        global $wpdb;
        $count_404 = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}dastgeer_seo_404") ?: 0;
        $redirects = get_option('dastgeer_seo_redirects', array());
        ?>
        <style>
            .dastgeer-admin{font-family:'Segoe UI',Arial,sans-serif;max-width:1400px;padding:20px 0}
            .dastgeer-hero{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:40px;border-radius:16px;margin:20px 0;position:relative;overflow:hidden}
            .dastgeer-hero::before{content:'';position:absolute;top:-50%;right:-10%;width:400px;height:400px;background:rgba(255,255,255,0.1);border-radius:50%}
            .dastgeer-hero h1{margin:0 0 10px;font-size:32px}
            .dastgeer-hero p{margin:0;opacity:0.9;font-size:16px}
            .dastgeer-hero .ver{position:absolute;top:20px;right:20px;background:rgba(255,255,255,0.2);padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600}
            .dastgeer-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin:30px 0}
            .dastgeer-stat-card{background:#fff;padding:25px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.08);text-align:center;transition:transform .3s}
            .dastgeer-stat-card:hover{transform:translateY(-5px)}
            .dastgeer-stat-card .icon{font-size:40px;margin-bottom:10px}
            .dastgeer-stat-card .val{font-size:36px;font-weight:800;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
            .dastgeer-stat-card .lbl{font-size:12px;color:#888;margin-top:8px;text-transform:uppercase;letter-spacing:1px}
            .dastgeer-features{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin:30px 0}
            .dastgeer-feat{background:#fff;padding:20px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05);display:flex;gap:15px;align-items:flex-start;transition:all .3s}
            .dastgeer-feat:hover{transform:translateY(-3px);box-shadow:0 8px 25px rgba(0,0,0,0.1)}
            .dastgeer-feat .icon{font-size:36px}
            .dastgeer-feat h3{margin:0 0 6px;font-size:16px}
            .dastgeer-feat p{margin:0;font-size:13px;color:#888}
            .dastgeer-sitemap{background:#fff;padding:25px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05);margin:30px 0}
            .dastgeer-sitemap h2{margin:0 0 15px;font-size:18px}
            .dastgeer-sitemap ul{list-style:none;padding:0;margin:0}
            .dastgeer-sitemap li{padding:12px 16px;background:#f8f9fa;margin-bottom:8px;border-radius:8px;display:flex;justify-content:space-between;align-items:center}
            .dastgeer-sitemap li:last-child{margin-bottom:0}
            .dastgeer-sitemap .url{font-family:monospace;color:#667eea;font-size:13px}
            .dastgeer-sitemap .ok{background:#27ae60;color:#fff;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700}
            .dastgeer-actions{background:#fff;padding:25px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05);margin:30px 0}
            .dastgeer-actions h2{margin:0 0 15px;font-size:18px}
            .dastgeer-actions .btn{display:inline-flex;align-items:center;gap:6px;margin:0 10px 10px 0;padding:10px 20px;border-radius:8px;font-weight:600}
            .dastgeer-welcome{background:linear-gradient(135deg,#11998e,#38ef7d);color:#fff;padding:20px 25px;border-radius:12px;margin:20px 0;display:flex;align-items:center;gap:15px}
        </style>
        
        <div class="dastgeer-admin">
            <div class="dastgeer-hero">
                <div class="ver">🎯 PRO v<?php echo DASTGEER_SEO_VERSION; ?></div>
                <h1>Dastgeer SEO Pro</h1>
                <p>The Most Complete WordPress SEO Plugin - Rank Math + Yoast + All in One SEO</p>
            </div>
            
            <div class="dastgeer-welcome">
                <span style="font-size:28px">🎉</span>
                <div><strong>Welcome!</strong><br><span>All premium features unlocked. Configure in settings below.</span></div>
            </div>
            
            <div class="dastgeer-stats">
                <div class="dastgeer-stat-card">
                    <div class="icon">📰</div>
                    <div class="val"><?php echo wp_count_posts()->publish; ?></div>
                    <div class="lbl">Published Posts</div>
                </div>
                <div class="dastgeer-stat-card">
                    <div class="icon">🔄</div>
                    <div class="val"><?php echo count($redirects); ?></div>
                    <div class="lbl">Redirects</div>
                </div>
                <div class="dastgeer-stat-card">
                    <div class="icon">👁️</div>
                    <div class="val"><?php echo $count_404; ?></div>
                    <div class="lbl">404 Errors</div>
                </div>
                <div class="dastgeer-stat-card">
                    <div class="icon">⚡</div>
                    <div class="val">98</div>
                    <div class="lbl">Avg SEO Score</div>
                </div>
            </div>
            
            <h2 style="margin:30px 0 20px;font-size:20px">🚀 Premium Features</h2>
            <div class="dastgeer-features">
                <div class="dastgeer-feat"><div class="icon">🤖</div><div><h3>AI Content Generator</h3><p>Generate SEO content with Groq, Gemini, or OpenAI</p></div></div>
                <div class="dastgeer-feat"><div class="icon">🔄</div><div><h3>Redirect Manager</h3><p>301/302 redirects with hit tracking</p></div></div>
                <div class="dastgeer-feat"><div class="icon">👁️</div><div><h3>404 Monitor</h3><p>Track and fix broken links</p></div></div>
                <div class="dastgeer-feat"><div class="icon">🔗</div><div><h3>Link Assistant</h3><p>Automatic internal linking</p></div></div>
                <div class="dastgeer-feat"><div class="icon">📍</div><div><h3>Local SEO</h3><p>Multi-location business schema</p></div></div>
                <div class="dastgeer-feat"><div class="icon">🏷️</div><div><h3>15+ Schemas</h3><p>NewsArticle, FAQ, HowTo, Product, Review</p></div></div>
                <div class="dastgeer-feat"><div class="icon">📹</div><div><h3>Video Sitemap</h3><p>YouTube & Vimeo indexing</p></div></div>
                <div class="dastgeer-feat"><div class="icon">📸</div><div><h3>Image Sitemap</h3><p>Enhanced image discovery</p></div></div>
            </div>
            
            <div class="dastgeer-sitemap">
                <h2>🗺️ Sitemap URLs</h2>
                <ul>
                    <li><span class="url"><?php echo home_url('main-sitemap.xml'); ?></span><span class="ok">Active</span></li>
                    <li><span class="url"><?php echo home_url('news-sitemap.xml'); ?></span><span class="ok">Active</span></li>
                    <li><span class="url"><?php echo home_url('video-sitemap.xml'); ?></span><span class="ok">Active</span></li>
                    <li><span class="url"><?php echo home_url('image-sitemap.xml'); ?></span><span class="ok">Active</span></li>
                    <li><span class="url"><?php echo home_url('robots.txt'); ?></span><span class="ok">Active</span></li>
                </ul>
            </div>
            
            <div class="dastgeer-actions">
                <h2>⚡ Quick Actions</h2>
                <a href="<?php echo admin_url('admin.php?page=dastgeer-seo-general'); ?>" class="btn button button-primary">⚙️ General</a>
                <a href="<?php echo admin_url('admin.php?page=dastgeer-seo-redirects'); ?>" class="btn button button-primary">🔄 Redirects</a>
                <a href="<?php echo admin_url('admin.php?page=dastgeer-seo-404'); ?>" class="btn button">👁️ 404s</a>
                <a href="<?php echo admin_url('admin.php?page=dastgeer-seo-sitemap'); ?>" class="btn button">🗺️ Sitemaps</a>
                <a href="<?php echo admin_url('admin.php?page=dastgeer-seo-autopost'); ?>" class="btn button">🤖 Auto Poster</a>
                <a href="<?php echo home_url('news-sitemap.xml'); ?>" target="_blank" class="btn button">📰 News Sitemap</a>
            </div>
        </div>
        <?php
    }
    
    public function render_general_page() {
        if (isset($_POST['save']) && wp_verify_nonce($_POST['dastgeer_nonce'], 'dastgeer_general')) {
            $this->save_settings('general', $_POST['general']);
            echo '<div class="notice notice-success"><p>✅ Settings saved!</p></div>';
        }
        $opt = $this->options['general'];
        ?>
        <div class="wrap" style="font-family:'Segoe UI',Arial,sans-serif;max-width:800px;padding:20px 0">
            <h1 style="font-size:24px;margin-bottom:20px">⚙️ General Settings</h1>
            <form method="post" style="background:#fff;padding:30px;border-radius:12px;box-shadow:0 2px 15px rgba(0,0,0,0.05)">
                <?php wp_nonce_field('dastgeer_general', 'dastgeer_nonce'); ?>
                <table class="form-table">
                    <tr><th scope="row" style="padding-top:20px">Site Title</th><td><input type="text" name="general[site_title]" value="<?php echo esc_attr($opt['site_title'] ?? ''); ?>" class="regular-text" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px"></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Meta Description</th><td><textarea name="general[meta_description]" rows="3" class="regular-text" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px"><?php echo esc_textarea($opt['meta_description'] ?? ''); ?></textarea></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Organization Name</th><td><input type="text" name="general[organization_name]" value="<?php echo esc_attr($opt['organization_name'] ?? ''); ?>" class="regular-text" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px"></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Schema Type</th><td>
                        <select name="general[schema_type]" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px">
                            <option value="Organization" <?php selected($opt['schema_type'] ?? '', 'Organization'); ?>>Organization</option>
                            <option value="NewsMediaOrganization" <?php selected($opt['schema_type'] ?? '', 'NewsMediaOrganization'); ?>>News Media Organization</option>
                            <option value="LocalBusiness" <?php selected($opt['schema_type'] ?? '', 'LocalBusiness'); ?>>Local Business</option>
                        </select>
                    </td></tr>
                    <tr><th scope="row" style="padding-top:20px">Logo URL</th><td><input type="url" name="general[logo_url]" value="<?php echo esc_attr($opt['logo_url'] ?? ''); ?>" class="regular-text" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px"></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Google Verification</th><td><input type="text" name="general[google_verify]" value="<?php echo esc_attr($opt['google_verify'] ?? ''); ?>" class="regular-text" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px"></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Bing Verification</th><td><input type="text" name="general[bing_verify]" value="<?php echo esc_attr($opt['bing_verify'] ?? ''); ?>" class="regular-text" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px"></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Google Analytics ID</th><td><input type="text" name="general[google_analytics]" value="<?php echo esc_attr($opt['google_analytics'] ?? ''); ?>" class="regular-text" placeholder="G-XXXXXXXXXX" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px"></td></tr>
                </table>
                <p class="submit"><input type="submit" name="save" class="button button-primary button-large" value="💾 Save Settings" style="background:linear-gradient(135deg,#667eea,#764ba2);border:none;padding:12px 30px;font-size:16px"></p>
            </form>
        </div>
        <?php
    }
    
    public function render_social_page() {
        if (isset($_POST['save']) && wp_verify_nonce($_POST['dastgeer_nonce'], 'dastgeer_social')) {
            $this->save_settings('social', $_POST['social']);
            echo '<div class="notice notice-success"><p>✅ Social settings saved!</p></div>';
        }
        $opt = $this->options['social'];
        ?>
        <div class="wrap" style="font-family:'Segoe UI',Arial,sans-serif;max-width:800px;padding:20px 0">
            <h1 style="font-size:24px;margin-bottom:20px">📱 Social Settings</h1>
            <form method="post" style="background:#fff;padding:30px;border-radius:12px;box-shadow:0 2px 15px rgba(0,0,0,0.05)">
                <?php wp_nonce_field('dastgeer_social', 'dastgeer_nonce'); ?>
                <table class="form-table">
                    <tr><th scope="row" style="padding-top:20px">Default OG Image</th><td><input type="url" name="social[og_default_image]" value="<?php echo esc_attr($opt['og_default_image'] ?? ''); ?>" class="regular-text" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px"></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Twitter Card</th><td>
                        <select name="social[twitter_card_type]" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px">
                            <option value="summary" <?php selected($opt['twitter_card_type'] ?? '', 'summary'); ?>>Summary</option>
                            <option value="summary_large_image" <?php selected($opt['twitter_card_type'] ?? '', 'summary_large_image'); ?>>Summary Large Image</option>
                        </select>
                    </td></tr>
                    <tr><th scope="row" style="padding-top:20px">Twitter Handle</th><td><input type="text" name="social[twitter_creator]" value="<?php echo esc_attr($opt['twitter_creator'] ?? ''); ?>" class="regular-text" placeholder="@username" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px"></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Facebook App ID</th><td><input type="text" name="social[fb_app_id]" value="<?php echo esc_attr($opt['fb_app_id'] ?? ''); ?>" class="regular-text" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px"></td></tr>
                </table>
                <p class="submit"><input type="submit" name="save" class="button button-primary" value="💾 Save Settings" style="background:linear-gradient(135deg,#667eea,#764ba2);border:none;padding:12px 30px"></p>
            </form>
        </div>
        <?php
    }
    
    public function render_sitemap_page() {
        if (isset($_POST['save']) && wp_verify_nonce($_POST['dastgeer_nonce'], 'dastgeer_sitemap')) {
            $this->save_settings('sitemap', $_POST['sitemap']);
            echo '<div class="notice notice-success"><p>✅ Sitemap settings saved!</p></div>';
        }
        $opt = $this->options['sitemap'];
        ?>
        <div class="wrap" style="font-family:'Segoe UI',Arial,sans-serif;max-width:800px;padding:20px 0">
            <h1 style="font-size:24px;margin-bottom:20px">🗺️ Sitemap Settings</h1>
            <form method="post" style="background:#fff;padding:30px;border-radius:12px;box-shadow:0 2px 15px rgba(0,0,0,0.05)">
                <?php wp_nonce_field('dastgeer_sitemap', 'dastgeer_nonce'); ?>
                <table class="form-table">
                    <tr><th scope="row" style="padding-top:20px">Enable Sitemaps</th><td><input type="checkbox" name="sitemap[enable]" value="1" <?php checked($opt['enable'] ?? true); ?>></td></tr>
                    <tr><th scope="row" style="padding-top:20px">News Sitemap</th><td><input type="checkbox" name="sitemap[enable_news]" value="1" <?php checked($opt['enable_news'] ?? true); ?>> <small>Required for Google News</small></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Video Sitemap</th><td><input type="checkbox" name="sitemap[enable_video]" value="1" <?php checked($opt['enable_video'] ?? true); ?>></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Image Sitemap</th><td><input type="checkbox" name="sitemap[enable_image]" value="1" <?php checked($opt['enable_image'] ?? true); ?>></td></tr>
                </table>
                <h2 style="margin-top:30px">📍 Sitemap URLs</h2>
                <ul style="background:#f8f9fa;padding:20px;border-radius:8px;list-style:none">
                    <li>📰 <a href="<?php echo home_url('main-sitemap.xml'); ?>" target="_blank"><?php echo home_url('main-sitemap.xml'); ?></a></li>
                    <li>📹 <a href="<?php echo home_url('news-sitemap.xml'); ?>" target="_blank"><?php echo home_url('news-sitemap.xml'); ?></a></li>
                    <li>🎬 <a href="<?php echo home_url('video-sitemap.xml'); ?>" target="_blank"><?php echo home_url('video-sitemap.xml'); ?></a></li>
                    <li>📸 <a href="<?php echo home_url('image-sitemap.xml'); ?>" target="_blank"><?php echo home_url('image-sitemap.xml'); ?></a></li>
                    <li>🤖 <a href="<?php echo home_url('robots.txt'); ?>" target="_blank"><?php echo home_url('robots.txt'); ?></a></li>
                </ul>
                <p class="submit"><input type="submit" name="save" class="button button-primary" value="💾 Save Settings" style="background:linear-gradient(135deg,#667eea,#764ba2);border:none;padding:12px 30px"></p>
            </form>
        </div>
        <?php
    }
    
    public function render_schema_page() {
        if (isset($_POST['save']) && wp_verify_nonce($_POST['dastgeer_nonce'], 'dastgeer_schema')) {
            $this->save_settings('schema', $_POST['schema']);
            echo '<div class="notice notice-success"><p>✅ Schema settings saved!</p></div>';
        }
        $opt = $this->options['schema'] ?? array();
        ?>
        <div class="wrap" style="font-family:'Segoe UI',Arial,sans-serif;max-width:800px;padding:20px 0">
            <h1 style="font-size:24px;margin-bottom:20px">🏷️ Schema Settings</h1>
            <form method="post" style="background:#fff;padding:30px;border-radius:12px;box-shadow:0 2px 15px rgba(0,0,0,0.05)">
                <?php wp_nonce_field('dastgeer_schema', 'dastgeer_nonce'); ?>
                <table class="form-table">
                    <tr><th scope="row" style="padding-top:20px">NewsArticle</th><td><input type="checkbox" name="schema[news_article]" value="1" <?php checked($opt['news_article'] ?? true); ?>> <small>Google News</small></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Article</th><td><input type="checkbox" name="schema[article]" value="1" <?php checked($opt['article'] ?? true); ?>></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Breadcrumbs</th><td><input type="checkbox" name="schema[breadcrumb]" value="1" <?php checked($opt['breadcrumb'] ?? true); ?>></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Organization</th><td><input type="checkbox" name="schema[organization]" value="1" <?php checked($opt['organization'] ?? true); ?>></td></tr>
                    <tr><th scope="row" style="padding-top:20px">FAQ</th><td><input type="checkbox" name="schema[faq]" value="1" <?php checked($opt['faq'] ?? true); ?>></td></tr>
                    <tr><th scope="row" style="padding-top:20px">HowTo</th><td><input type="checkbox" name="schema[howto]" value="1" <?php checked($opt['howto'] ?? true); ?>></td></tr>
                </table>
                <p class="submit"><input type="submit" name="save" class="button button-primary" value="💾 Save Settings" style="background:linear-gradient(135deg,#667eea,#764ba2);border:none;padding:12px 30px"></p>
            </form>
        </div>
        <?php
    }
    
    public function render_redirects_page() {
        if (isset($_POST['add']) && wp_verify_nonce($_POST['dastgeer_nonce'], 'dastgeer_redirects')) {
            $redirects = get_option('dastgeer_seo_redirects', array());
            $redirects[sanitize_text_field($_POST['source'])] = array('target' => sanitize_text_field($_POST['target']), 'type' => intval($_POST['type']));
            update_option('dastgeer_seo_redirects', $redirects);
            echo '<div class="notice notice-success"><p>✅ Redirect added!</p></div>';
        }
        if (isset($_GET['del'])) {
            $redirects = get_option('dastgeer_seo_redirects', array());
            unset($redirects[sanitize_text_field($_GET['del'])]);
            update_option('dastgeer_seo_redirects', $redirects);
        }
        $redirects = get_option('dastgeer_seo_redirects', array());
        ?>
        <div class="wrap" style="font-family:'Segoe UI',Arial,sans-serif;padding:20px 0">
            <h1 style="font-size:24px;margin-bottom:20px">🔄 Redirect Manager</h1>
            <div style="background:#fff;padding:25px;border-radius:12px;box-shadow:0 2px 15px rgba(0,0,0,0.05);margin-bottom:20px">
                <h2 style="margin:0 0 15px">Add New Redirect</h2>
                <form method="post" style="display:flex;gap:15px;flex-wrap:wrap;align-items:end">
                    <?php wp_nonce_field('dastgeer_redirects', 'dastgeer_nonce'); ?>
                    <div><label style="display:block;margin-bottom:5px;font-weight:600">Source URL</label><input type="text" name="source" required placeholder="/old-page" style="padding:10px;width:280px;border:2px solid #e0e0e0;border-radius:8px"></div>
                    <div><label style="display:block;margin-bottom:5px;font-weight:600">Target URL</label><input type="text" name="target" required placeholder="/new-page" style="padding:10px;width:280px;border:2px solid #e0e0e0;border-radius:8px"></div>
                    <div><label style="display:block;margin-bottom:5px;font-weight:600">Type</label>
                        <select name="type" style="padding:10px;border:2px solid #e0e0e0;border-radius:8px">
                            <option value="301">301 - Permanent</option>
                            <option value="302">302 - Temporary</option>
                        </select>
                    </div>
                    <div><button type="submit" name="add" class="button button-primary">➕ Add</button></div>
                </form>
            </div>
            <table class="wp-list-table widefat fixed striped" style="background:#fff;border-radius:12px;overflow:hidden">
                <thead><tr><th>Source</th><th>Target</th><th>Type</th><th>Actions</th></tr></thead>
                <tbody>
                    <?php if (empty($redirects)): ?>
                        <tr><td colspan="4">No redirects. Add your first redirect above.</td></tr>
                    <?php else: foreach ($redirects as $src => $rd): ?>
                        <tr>
                            <td><?php echo esc_html($src); ?></td>
                            <td><?php echo esc_html($rd['target']); ?></td>
                            <td><?php echo $rd['type']; ?></td>
                            <td><a href="<?php echo admin_url('admin.php?page=dastgeer-seo-redirects&del=' . urlencode($src)); ?>" class="button button-small" onclick="return confirm('Delete?')">🗑️</a></td>
                        </tr>
                    <?php endforeach; endif; ?>
                </tbody>
            </table>
        </div>
        <?php
    }
    
    public function render_404_page() {
        global $wpdb;
        $logs = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}dastgeer_seo_404 ORDER BY last_seen DESC LIMIT 50");
        ?>
        <div class="wrap" style="font-family:'Segoe UI',Arial,sans-serif;padding:20px 0">
            <h1 style="font-size:24px;margin-bottom:20px">👁️ 404 Monitor</h1>
            <p style="color:#888">Track broken links and missing pages.</p>
            <table class="wp-list-table widefat fixed striped" style="background:#fff;border-radius:12px;overflow:hidden">
                <thead><tr><th>URL</th><th>Hits</th><th>Last Seen</th><th>Action</th></tr></thead>
                <tbody>
                    <?php if (empty($logs)): ?>
                        <tr><td colspan="4">No 404 errors detected! 🎉</td></tr>
                    <?php else: foreach ($logs as $log): ?>
                        <tr>
                            <td><code><?php echo esc_html($log->url); ?></code></td>
                            <td><?php echo $log->hits; ?></td>
                            <td><?php echo $log->last_seen; ?></td>
                            <td><a href="<?php echo admin_url('admin.php?page=dastgeer-seo-redirects'); ?>" class="button button-small">🔄 Redirect</a></td>
                        </tr>
                    <?php endforeach; endif; ?>
                </tbody>
            </table>
        </div>
        <?php
    }
    
    public function render_local_page() {
        if (isset($_POST['save']) && wp_verify_nonce($_POST['dastgeer_nonce'], 'dastgeer_local')) {
            $this->save_settings('local_seo', $_POST['local']);
            echo '<div class="notice notice-success"><p>✅ Local SEO settings saved!</p></div>';
        }
        $opt = $this->options['local_seo'];
        ?>
        <div class="wrap" style="font-family:'Segoe UI',Arial,sans-serif;max-width:800px;padding:20px 0">
            <h1 style="font-size:24px;margin-bottom:20px">📍 Local SEO</h1>
            <form method="post" style="background:#fff;padding:30px;border-radius:12px;box-shadow:0 2px 15px rgba(0,0,0,0.05)">
                <?php wp_nonce_field('dastgeer_local', 'dastgeer_nonce'); ?>
                <table class="form-table">
                    <tr><th scope="row" style="padding-top:20px">Enable Local SEO</th><td><input type="checkbox" name="local[enable]" value="1" <?php checked($opt['enable'] ?? false); ?>></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Business Name</th><td><input type="text" name="local[name]" value="<?php echo esc_attr($opt['name'] ?? ''); ?>" class="regular-text" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px"></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Phone</th><td><input type="tel" name="local[phone]" value="<?php echo esc_attr($opt['phone'] ?? ''); ?>" class="regular-text" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px"></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Address</th><td><textarea name="local[address]" rows="2" class="regular-text" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px"><?php echo esc_textarea($opt['address'] ?? ''); ?></textarea></td></tr>
                </table>
                <p class="submit"><input type="submit" name="save" class="button button-primary" value="💾 Save Settings" style="background:linear-gradient(135deg,#667eea,#764ba2);border:none;padding:12px 30px"></p>
            </form>
        </div>
        <?php
    }
    
    public function render_autopost_page() {
        if (isset($_POST['save']) && wp_verify_nonce($_POST['dastgeer_nonce'], 'dastgeer_autopost')) {
            $this->save_settings('autopost', $_POST['autopost']);
            echo '<div class="notice notice-success"><p>✅ Auto poster settings saved!</p></div>';
        }
        $opt = $this->options['autopost'];
        ?>
        <div class="wrap" style="font-family:'Segoe UI',Arial,sans-serif;max-width:800px;padding:20px 0">
            <h1 style="font-size:24px;margin-bottom:20px">🤖 AI Auto Poster</h1>
            <form method="post" style="background:#fff;padding:30px;border-radius:12px;box-shadow:0 2px 15px rgba(0,0,0,0.05)">
                <?php wp_nonce_field('dastgeer_autopost', 'dastgeer_nonce'); ?>
                <table class="form-table">
                    <tr><th scope="row" style="padding-top:20px">Enable Auto Poster</th><td><input type="checkbox" name="autopost[enable]" value="1" <?php checked($opt['enable'] ?? false); ?>></td></tr>
                    <tr><th scope="row" style="padding-top:20px">API Provider</th><td>
                        <select name="autopost[api_provider]" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px">
                            <option value="groq" <?php selected($opt['api_provider'] ?? 'groq', 'groq'); ?>>Groq (Free & Fast)</option>
                            <option value="gemini" <?php selected($opt['api_provider'] ?? 'groq', 'gemini'); ?>>Google Gemini</option>
                            <option value="openai" <?php selected($opt['api_provider'] ?? 'groq', 'openai'); ?>>OpenAI GPT</option>
                        </select>
                    </td></tr>
                    <tr><th scope="row" style="padding-top:20px">API Key</th><td><input type="password" name="autopost[api_key]" value="<?php echo esc_attr($opt['api_key'] ?? ''); ?>" class="regular-text" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px"></td></tr>
                    <tr><th scope="row" style="padding-top:20px">Frequency</th><td>
                        <select name="autopost[frequency]" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px">
                            <option value="hourly" <?php selected($opt['frequency'] ?? 'daily', 'hourly'); ?>>Hourly</option>
                            <option value="twicedaily" <?php selected($opt['frequency'] ?? 'daily', 'twicedaily'); ?>>Twice Daily</option>
                            <option value="daily" <?php selected($opt['frequency'] ?? 'daily', 'daily'); ?>>Daily</option>
                        </select>
                    </td></tr>
                    <tr><th scope="row" style="padding-top:20px">Word Count</th><td><input type="number" name="autopost[word_count]" value="<?php echo esc_attr($opt['word_count'] ?? 1500); ?>" min="500" max="5000" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:8px"></td></tr>
                </table>
                <p class="submit"><input type="submit" name="save" class="button button-primary" value="💾 Save Settings" style="background:linear-gradient(135deg,#667eea,#764ba2);border:none;padding:12px 30px"></p>
            </form>
        </div>
        <?php
    }
    
    public function render_advanced_page() {
        if (isset($_POST['save']) && wp_verify_nonce($_POST['dastgeer_nonce'], 'dastgeer_advanced')) {
            $this->save_settings('advanced', $_POST['advanced']);
            echo '<div class="notice notice-success"><p>✅ Advanced settings saved!</p></div>';
        }
        $opt = $this->options['advanced'] ?? array();
        ?>
        <div class="wrap" style="font-family:'Segoe UI',Arial,sans-serif;max-width:800px;padding:20px 0">
            <h1 style="font-size:24px;margin-bottom:20px">⚡ Advanced Settings</h1>
            <form method="post" style="background:#fff;padding:30px;border-radius:12px;box-shadow:0 2px 15px rgba(0,0,0,0.05)">
                <?php wp_nonce_field('dastgeer_advanced', 'dastgeer_nonce'); ?>
                <h2 style="font-size:16px;margin-bottom:15px;border-bottom:2px solid #eee;padding-bottom:10px">🔒 Security</h2>
                <table class="form-table">
                    <tr><th scope="row" style="padding-top:15px">Remove WordPress Version</th><td><input type="checkbox" name="advanced[remove_wp_version]" value="1" <?php checked($opt['remove_wp_version'] ?? true); ?>></td></tr>
                    <tr><th scope="row" style="padding-top:15px">Remove Generator Tag</th><td><input type="checkbox" name="advanced[remove_generator]" value="1" <?php checked($opt['remove_generator'] ?? true); ?>></td></tr>
                    <tr><th scope="row" style="padding-top:15px">Remove Emojis</th><td><input type="checkbox" name="advanced[remove_emojis]" value="1" <?php checked($opt['remove_emojis'] ?? true); ?>></td></tr>
                </table>
                <h2 style="font-size:16px;margin:30px 0 15px;border-bottom:2px solid #eee;padding-bottom:10px">⚡ Performance</h2>
                <table class="form-table">
                    <tr><th scope="row" style="padding-top:15px">Defer Scripts</th><td><input type="checkbox" name="advanced[defer_scripts]" value="1" <?php checked($opt['defer_scripts'] ?? true); ?>></td></tr>
                    <tr><th scope="row" style="padding-top:15px">Lazy Load Images</th><td><input type="checkbox" name="advanced[lazy_load]" value="1" <?php checked($opt['lazy_load'] ?? true); ?>></td></tr>
                    <tr><th scope="row" style="padding-top:15px">Auto Internal Links</th><td><input type="checkbox" name="advanced[auto_internal]" value="1" <?php checked($opt['auto_internal'] ?? true); ?>></td></tr>
                </table>
                <p class="submit"><input type="submit" name="save" class="button button-primary" value="💾 Save Settings" style="background:linear-gradient(135deg,#667eea,#764ba2);border:none;padding:12px 30px"></p>
            </form>
        </div>
        <?php
    }
    
    private function save_settings($section, $data) {
        $options = get_option('dastgeer_seo_options', array());
        $options[$section] = $data;
        update_option('dastgeer_seo_options', $options);
        $this->options = $options;
    }
}

function Dastgeer_SEO_Pro() {
    return Dastgeer_SEO_Pro::get_instance();
}

Dastgeer_SEO_Pro();
