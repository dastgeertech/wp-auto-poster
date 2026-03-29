<?php
/**
 * Plugin Name: Dastgeer SEO Pro Complete
 * Plugin URI: https://dastgeer.com/seo-pro
 * Description: Comprehensive WordPress SEO plugin combining Rank Math + Yoast SEO + All in One SEO features with AI capabilities
 * Version: 1.0.0
 * Author: Dastgeer
 * Author URI: https://dastgeer.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: dastgeer-seo-pro
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

define('DASTGEER_SEO_VERSION', '1.0.0');
define('DASTGEER_SEO_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('DASTGEER_SEO_PLUGIN_URL', plugin_dir_url(__FILE__));
define('DASTGEER_SEO_PLUGIN_BASENAME', plugin_basename(__FILE__));

class Dastgeer_SEO_Pro {
    private static $instance = null;
    private $admin_pages = array();
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->init_hooks();
        $this->create_tables();
    }
    
    private function init_hooks() {
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        add_action('init', array($this, 'load_textdomain'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        add_action('wp_head', array($this, 'output_seo_tags'), 1);
        add_action('template_redirect', array($this, 'handle_redirects'));
        add_action('save_post', array($this, 'save_seo_meta'), 10, 2);
        add_action('add_meta_boxes', array($this, 'add_seo_meta_box'));
        
        add_filter('document_title_parts', array($this, 'modify_title'), 10, 1);
        add_filter('wpseo_json_ld_search', array($this, 'disable_wpseo_json_ld'));
        
        add_action('wp_ajax_dastgeer_ai_generate', array($this, 'ai_generate_content'));
        add_action('wp_ajax_dastgeer_save_settings', array($this, 'save_settings'));
        add_action('wp_ajax_dastgeer_export_settings', array($this, 'export_settings'));
        add_action('wp_ajax_dastgeer_import_settings', array($this, 'import_settings'));
        add_action('wp_ajax_dastgeer_add_redirect', array($this, 'add_redirect'));
        add_action('wp_ajax_dastgeer_delete_redirect', array($this, 'delete_redirect'));
        add_action('wp_ajax_dastgeer_clear_404_log', array($this, 'clear_404_log'));
        add_action('wp_ajax_dastgeer_run_seo_analysis', array($this, 'run_seo_analysis'));
        
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }
    
    public function activate() {
        $this->create_tables();
        flush_rewrite_rules();
        
        $default_settings = array(
            'dastgeer_seo_home_title' => get_bloginfo('name'),
            'dastgeer_seo_home_description' => get_bloginfo('description'),
            'dastgeer_seo_home_keywords' => '',
            'dastgeer_seo_og_image' => '',
            'dastgeer_seo_twitter_card' => 'summary_large_image',
            'dastgeer_seo_google_verification' => '',
            'dastgeer_seo_bing_verification' => '',
            'dastgeer_seo_baidu_verification' => '',
            'dastgeer_seo_enable_sitemap' => 1,
            'dastgeer_seo_enable_news_sitemap' => 0,
            'dastgeer_seo_enable_video_sitemap' => 0,
            'dastgeer_seo_enable_image_sitemap' => 1,
            'dastgeer_seo_sitemap_include' => array('post', 'page'),
            'dastgeer_seo_sitemap_exclude' => array(),
            'dastgeer_seo_default_schema' => 'Article',
            'dastgeer_seo_local_business_type' => 'LocalBusiness',
            'dastgeer_seo_local_name' => get_bloginfo('name'),
            'dastgeer_seo_local_address' => '',
            'dastgeer_seo_local_phone' => '',
            'dastgeer_seo_local_opening_hours' => '',
            'dastgeer_seo_local_coordinates' => '',
            'dastgeer_seo_ai_provider' => 'openai',
            'dastgeer_seo_ai_api_key' => '',
            'dastgeer_seo_auto_post_enabled' => 0,
            'dastgeer_seo_auto_post_tokens' => array(),
            'dastgeer_seo_redirect_enabled' => 1,
            'dastgeer_seo_404_monitor_enabled' => 1,
        );
        
        foreach ($default_settings as $key => $value) {
            if (get_option($key) === false) {
                add_option($key, $value);
            }
        }
        
        set_transient('dastgeer_seo_activated', true, 30);
    }
    
    public function deactivate() {
        flush_rewrite_rules();
        wp_clear_scheduled_hook('dastgeer_seo_daily_cleanup');
    }
    
    public function load_textdomain() {
        load_plugin_textdomain('dastgeer-seo-pro', false, dirname(DASTGEER_SEO_PLUGIN_BASENAME) . '/languages');
    }
    
    private function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $redirects_table = $wpdb->prefix . 'dastgeer_seo_redirects';
        $sql_redirects = "CREATE TABLE IF NOT EXISTS $redirects_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            source_url text NOT NULL,
            destination_url text NOT NULL,
            response_code int(3) DEFAULT 301,
            hits int(11) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY source_url (source_url(255))
        ) $charset_collate;";
        
        $404_table = $wpdb->prefix . 'dastgeer_seo_404_log';
        $sql_404 = "CREATE TABLE IF NOT EXISTS $404_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            request_uri text NOT NULL,
            referrer text,
            user_agent text,
            ip_address varchar(45),
            hit_count int(11) DEFAULT 1,
            first_visit datetime DEFAULT CURRENT_TIMESTAMP,
            last_visit datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY request_uri (request_uri(255)),
            KEY last_visit (last_visit)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_redirects);
        dbDelta($sql_404);
    }
    
    public function add_admin_menu() {
        $icon_svg = 'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#667eea"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>');
        
        add_menu_page(
            __('Dastgeer SEO Pro', 'dastgeer-seo-pro'),
            __('Dastgeer SEO', 'dastgeer-seo-pro'),
            'manage_options',
            'dastgeer-seo',
            array($this, 'render_dashboard_page'),
            $icon_svg,
            80
        );
        
        $submenus = array(
            'dastgeer-seo' => array(
                'title' => __('Dashboard', 'dastgeer-seo-pro'),
                'cap' => 'manage_options',
                'slug' => 'dastgeer-seo',
                'callback' => array($this, 'render_dashboard_page')
            ),
            'dastgeer-seo-general' => array(
                'title' => __('General', 'dastgeer-seo-pro'),
                'cap' => 'manage_options',
                'slug' => 'dastgeer-seo-general',
                'callback' => array($this, 'render_general_page')
            ),
            'dastgeer-seo-social' => array(
                'title' => __('Social', 'dastgeer-seo-pro'),
                'cap' => 'manage_options',
                'slug' => 'dastgeer-seo-social',
                'callback' => array($this, 'render_social_page')
            ),
            'dastgeer-seo-sitemaps' => array(
                'title' => __('Sitemaps', 'dastgeer-seo-pro'),
                'cap' => 'manage_options',
                'slug' => 'dastgeer-seo-sitemaps',
                'callback' => array($this, 'render_sitemaps_page')
            ),
            'dastgeer-seo-schema' => array(
                'title' => __('Schema', 'dastgeer-seo-pro'),
                'cap' => 'manage_options',
                'slug' => 'dastgeer-seo-schema',
                'callback' => array($this, 'render_schema_page')
            ),
            'dastgeer-seo-redirects' => array(
                'title' => __('Redirects', 'dastgeer-seo-pro'),
                'cap' => 'manage_options',
                'slug' => 'dastgeer-seo-redirects',
                'callback' => array($this, 'render_redirects_page')
            ),
            'dastgeer-seo-404' => array(
                'title' => __('404 Monitor', 'dastgeer-seo-pro'),
                'cap' => 'manage_options',
                'slug' => 'dastgeer-seo-404',
                'callback' => array($this, 'render_404_page')
            ),
            'dastgeer-seo-local' => array(
                'title' => __('Local SEO', 'dastgeer-seo-pro'),
                'cap' => 'manage_options',
                'slug' => 'dastgeer-seo-local',
                'callback' => array($this, 'render_local_page')
            ),
            'dastgeer-seo-auto-poster' => array(
                'title' => __('Auto Poster', 'dastgeer-seo-pro'),
                'cap' => 'manage_options',
                'slug' => 'dastgeer-seo-auto-poster',
                'callback' => array($this, 'render_auto_poster_page')
            ),
            'dastgeer-seo-advanced' => array(
                'title' => __('Advanced', 'dastgeer-seo-pro'),
                'cap' => 'manage_options',
                'slug' => 'dastgeer-seo-advanced',
                'callback' => array($this, 'render_advanced_page')
            ),
            'dastgeer-seo-import-export' => array(
                'title' => __('Import/Export', 'dastgeer-seo-pro'),
                'cap' => 'manage_options',
                'slug' => 'dastgeer-seo-import-export',
                'callback' => array($this, 'render_import_export_page')
            ),
        );
        
        foreach ($submenus as $menu_slug => $menu_data) {
            add_submenu_page(
                'dastgeer-seo',
                $menu_data['title'],
                $menu_data['title'],
                $menu_data['cap'],
                $menu_data['slug'],
                $menu_data['callback']
            );
        }
        
        $this->admin_pages = $submenus;
    }
    
    public function enqueue_admin_assets($hook) {
        if (strpos($hook, 'dastgeer-seo') === false) {
            return;
        }
        
        wp_enqueue_style(
            'dastgeer-seo-admin',
            DASTGEER_SEO_PLUGIN_URL . 'css/admin.css',
            array(),
            DASTGEER_SEO_VERSION
        );
        
        wp_enqueue_style(
            'dastgeer-seo-fonts',
            'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
            array(),
            DASTGEER_SEO_VERSION
        );
        
        wp_enqueue_script(
            'dastgeer-seo-admin',
            DASTGEER_SEO_PLUGIN_URL . 'js/admin.js',
            array('jquery'),
            DASTGEER_SEO_VERSION,
            true
        );
        
        wp_localize_script('dastgeer-seo-admin', 'dastgeerSEO', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('dastgeer_seo_nonce'),
            'strings' => array(
                'saveSuccess' => __('Settings saved successfully!', 'dastgeer-seo-pro'),
                'saveError' => __('Error saving settings.', 'dastgeer-seo-pro'),
                'confirmDelete' => __('Are you sure you want to delete this item?', 'dastgeer-seo-pro'),
                'generating' => __('Generating...', 'dastgeer-seo-pro'),
                'generated' => __('Content generated!', 'dastgeer-seo-pro'),
            )
        ));
    }
    
    private function get_seo_data($post_id = 0) {
        if ($post_id === 0) {
            $post_id = get_the_ID();
        }
        
        $title = get_post_meta($post_id, 'dastgeer_seo_title', true);
        $description = get_post_meta($post_id, 'dastgeer_seo_description', true);
        $keywords = get_post_meta($post_id, 'dastgeer_seo_keywords', true);
        $canonical = get_post_meta($post_id, 'dastgeer_seo_canonical', true);
        $schema_type = get_post_meta($post_id, 'dastgeer_seo_schema_type', true);
        $og_image = get_post_meta($post_id, 'dastgeer_seo_og_image', true);
        $noindex = get_post_meta($post_id, 'dastgeer_seo_noindex', true);
        $nofollow = get_post_meta($post_id, 'dastgeer_seo_nofollow', true);
        $focus_keyword = get_post_meta($post_id, 'dastgeer_seo_focus_keyword', true);
        
        if (empty($title)) {
            $title_template = get_option('dastgeer_seo_title_template', '%title% | %site%');
            $title = str_replace(
                array('%title%', '%site%', '%sep%', '%page%'),
                array(get_the_title($post_id), get_bloginfo('name'), '|', ''),
                $title_template
            );
        }
        
        if (empty($description)) {
            $description = get_post_meta($post_id, '_yoast_meta_description', true);
            if (empty($description)) {
                $description = wp_strip_all_tags(get_the_excerpt($post_id));
            }
        }
        
        return array(
            'title' => $title,
            'description' => $description,
            'keywords' => $keywords,
            'canonical' => $canonical ?: get_permalink($post_id),
            'schema_type' => $schema_type ?: get_option('dastgeer_seo_default_schema', 'Article'),
            'og_image' => $og_image ?: get_option('dastgeer_seo_og_image', ''),
            'noindex' => $noindex,
            'nofollow' => $nofollow,
            'focus_keyword' => $focus_keyword
        );
    }
    
    public function output_seo_tags() {
        if (is_singular() || is_home() || is_front_page()) {
            $post_id = is_home() ? get_option('page_for_posts') : get_the_ID();
            $seo_data = $this->get_seo_data($post_id);
            
            if (is_front_page()) {
                $seo_data['title'] = get_option('dastgeer_seo_home_title', get_bloginfo('name'));
                $seo_data['description'] = get_option('dastgeer_seo_home_description', get_bloginfo('description'));
            }
            
            $og_image = $seo_data['og_image'];
            if (empty($og_image) && has_post_thumbnail($post_id)) {
                $og_image = get_the_post_thumbnail_url($post_id, 'large');
            }
            if (empty($og_image)) {
                $og_image = get_option('dastgeer_seo_og_image', '');
            }
            
            echo '<title>' . esc_html($seo_data['title']) . '</title>' . "\n";
            echo '<meta name="description" content="' . esc_attr($seo_data['description']) . '" />' . "\n";
            
            if (!empty($seo_data['keywords'])) {
                echo '<meta name="keywords" content="' . esc_attr($seo_data['keywords']) . '" />' . "\n";
            }
            
            if ($seo_data['noindex']) {
                echo '<meta name="robots" content="noindex, nofollow" />' . "\n";
            }
            
            $verification = get_option('dastgeer_seo_google_verification', '');
            if (!empty($verification)) {
                echo '<meta name="google-site-verification" content="' . esc_attr($verification) . '" />' . "\n";
            }
            
            $bing_verification = get_option('dastgeer_seo_bing_verification', '');
            if (!empty($bing_verification)) {
                echo '<meta name="msvalidate.01" content="' . esc_attr($bing_verification) . '" />' . "\n";
            }
            
            echo '<link rel="canonical" href="' . esc_url($seo_data['canonical']) . '" />' . "\n";
            
            $og_type = is_front_page() ? 'website' : 'article';
            if (is_category() || is_tag() || is_tax()) {
                $og_type = 'website';
            }
            
            echo '<meta property="og:type" content="' . esc_attr($og_type) . '" />' . "\n";
            echo '<meta property="og:title" content="' . esc_attr($seo_data['title']) . '" />' . "\n";
            echo '<meta property="og:description" content="' . esc_attr($seo_data['description']) . '" />' . "\n";
            echo '<meta property="og:url" content="' . esc_url($seo_data['canonical']) . '" />' . "\n";
            echo '<meta property="og:site_name" content="' . esc_attr(get_bloginfo('name')) . '" />' . "\n";
            
            if (!empty($og_image)) {
                echo '<meta property="og:image" content="' . esc_url($og_image) . '" />' . "\n";
            }
            
            $twitter_card = get_option('dastgeer_seo_twitter_card', 'summary_large_image');
            echo '<meta name="twitter:card" content="' . esc_attr($twitter_card) . '" />' . "\n";
            echo '<meta name="twitter:title" content="' . esc_attr($seo_data['title']) . '" />' . "\n";
            echo '<meta name="twitter:description" content="' . esc_attr($seo_data['description']) . '" />' . "\n";
            if (!empty($og_image)) {
                echo '<meta name="twitter:image" content="' . esc_url($og_image) . '" />' . "\n";
            }
            
            $this->output_schema_markup($post_id, $seo_data);
        }
    }
    
    private function output_schema_markup($post_id, $seo_data) {
        $schema_type = $seo_data['schema_type'];
        $schema = array(
            '@context' => 'https://schema.org',
            '@type' => $schema_type,
            'headline' => $seo_data['title'],
            'description' => $seo_data['description'],
            'url' => $seo_data['canonical'],
        );
        
        if (is_singular('post')) {
            $author_name = get_the_author_meta('display_name', get_post_field('post_author', $post_id));
            $schema = array(
                '@context' => 'https://schema.org',
                '@type' => 'Article',
                'headline' => $seo_data['title'],
                'description' => $seo_data['description'],
                'url' => $seo_data['canonical'],
                'datePublished' => get_post_field('post_date', $post_id),
                'dateModified' => get_post_field('post_modified', $post_id),
                'author' => array(
                    '@type' => 'Person',
                    'name' => $author_name
                ),
                'publisher' => array(
                    '@type' => 'Organization',
                    'name' => get_bloginfo('name'),
                    'logo' => array(
                        '@type' => 'ImageObject',
                        'url' => get_site_icon_url()
                    )
                )
            );
            
            if (has_post_thumbnail($post_id)) {
                $schema['image'] = array(
                    '@type' => 'ImageObject',
                    'url' => get_the_post_thumbnail_url($post_id, 'full')
                );
            }
        }
        
        if (is_front_page()) {
            $local_business = get_option('dastgeer_seo_local_business_type', 'LocalBusiness');
            if (!empty(get_option('dastgeer_seo_local_address', ''))) {
                $schema = array(
                    '@context' => 'https://schema.org',
                    '@type' => $local_business,
                    'name' => get_option('dastgeer_seo_local_name', get_bloginfo('name')),
                    'address' => array(
                        '@type' => 'PostalAddress',
                        'streetAddress' => get_option('dastgeer_seo_local_address', '')
                    ),
                    'telephone' => get_option('dastgeer_seo_local_phone', ''),
                    'openingHours' => get_option('dastgeer_seo_local_opening_hours', ''),
                    'geo' => array(
                        '@type' => 'GeoCoordinates',
                        'latitude' => get_option('dastgeer_seo_local_latitude', ''),
                        'longitude' => get_option('dastgeer_seo_local_longitude', '')
                    )
                );
            } else {
                $schema = array(
                    '@context' => 'https://schema.org',
                    '@type' => 'WebSite',
                    'name' => get_bloginfo('name'),
                    'url' => home_url('/'),
                    'potentialAction' => array(
                        '@type' => 'SearchAction',
                        'target' => home_url('/?s={search_term_string}'),
                        'query-input' => 'required name=search_term_string'
                    )
                );
            }
        }
        
        if (is_author()) {
            $author_id = get_query_var('author');
            $schema = array(
                '@context' => 'https://schema.org',
                '@type' => 'Person',
                'name' => get_the_author_meta('display_name', $author_id),
                'url' => get_author_posts_url($author_id),
                'sameAs' => $this->get_author_social_profiles($author_id)
            );
        }
        
        if (class_exists('WooCommerce') && (is_shop() || is_product())) {
            $schema = $this->get_woocommerce_schema($post_id);
        }
        
        echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
    }
    
    private function get_author_social_profiles($author_id) {
        $profiles = array();
        $social_fields = array('facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'pinterest');
        
        foreach ($social_fields as $field) {
            $value = get_the_author_meta($field, $author_id);
            if (!empty($value)) {
                $profiles[] = $value;
            }
        }
        
        return $profiles;
    }
    
    private function get_woocommerce_schema($post_id) {
        if (!function_exists('wc_get_product')) {
            return array();
        }
        
        $product = wc_get_product($post_id);
        if (!$product) {
            return array();
        }
        
        $schema = array(
            '@context' => 'https://schema.org',
            '@type' => 'Product',
            'name' => $product->get_name(),
            'description' => wp_strip_all_tags($product->get_description()),
            'sku' => $product->get_sku(),
            'image' => wp_get_attachment_url($product->get_image_id()),
            'url' => get_permalink($post_id),
        );
        
        if ($product->get_regular_price()) {
            $schema['offers'] = array(
                '@type' => 'Offer',
                'price' => $product->get_price(),
                'priceCurrency' => get_woocommerce_currency(),
                'availability' => $product->is_in_stock() ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                'seller' => array(
                    '@type' => 'Organization',
                    'name' => get_bloginfo('name')
                )
            );
        }
        
        $rating = $product->get_average_rating();
        if ($rating > 0) {
            $schema['aggregateRating'] = array(
                '@type' => 'AggregateRating',
                'ratingValue' => $rating,
                'reviewCount' => $product->get_review_count()
            );
        }
        
        return $schema;
    }
    
    public function modify_title($title_parts) {
        if (is_front_page()) {
            $custom_title = get_option('dastgeer_seo_home_title', '');
            if (!empty($custom_title)) {
                $title_parts['title'] = $custom_title;
            }
        }
        
        $post_id = is_home() ? get_option('page_for_posts') : get_the_ID();
        if ($post_id && is_singular()) {
            $custom_title = get_post_meta($post_id, 'dastgeer_seo_title', true);
            if (!empty($custom_title)) {
                $title_parts['title'] = $custom_title;
            }
        }
        
        return $title_parts;
    }
    
    public function disable_wpseo_json_ld() {
        return false;
    }
    
    public function handle_redirects() {
        if (!get_option('dastgeer_seo_redirect_enabled', true)) {
            return;
        }
        
        global $wpdb;
        $request_uri = $_SERVER['REQUEST_URI'] ?? '';
        $request_uri = parse_url($request_uri, PHP_URL_PATH);
        
        $redirect = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}dastgeer_seo_redirects WHERE source_url = %s LIMIT 1",
                $request_uri
            )
        );
        
        if ($redirect) {
            $wpdb->update(
                $wpdb->prefix . 'dastgeer_seo_redirects',
                array('hits' => $redirect->hits + 1),
                array('id' => $redirect->id)
            );
            
            wp_redirect($redirect->destination_url, $redirect->response_code);
            exit;
        }
    }
    
    public function add_seo_meta_box() {
        $post_types = get_post_types(array('public' => true), 'names');
        
        foreach ($post_types as $post_type) {
            add_meta_box(
                'dastgeer_seo_meta_box',
                __('Dastgeer SEO Pro', 'dastgeer-seo-pro'),
                array($this, 'render_seo_meta_box'),
                $post_type,
                'normal',
                'high'
            );
        }
    }
    
    public function render_seo_meta_box($post) {
        wp_nonce_field('dastgeer_seo_meta_box', 'dastgeer_seo_meta_nonce');
        
        $seo_data = $this->get_seo_data($post->ID);
        $focus_keyword = get_post_meta($post->ID, 'dastgeer_seo_focus_keyword', true);
        $seo_score = $this->calculate_seo_score($post->ID, $focus_keyword);
        
        $schema_types = array(
            'Article', 'NewsArticle', 'BlogPosting', 'WebPage', 'VideoObject', 
            'Event', 'Product', 'Recipe', 'FAQPage', 'HowTo', 'LocalBusiness',
            'Organization', 'Person', 'Place', 'Book', 'Movie', 'Review'
        );
        
        ?>
        <div class="dastgeer-seo-meta-box">
            <div class="dastgeer-seo-tabs">
                <button type="button" class="dastgeer-seo-tab active" data-tab="general"><?php _e('General', 'dastgeer-seo-pro'); ?></button>
                <button type="button" class="dastgeer-seo-tab" data-tab="social"><?php _e('Social', 'dastgeer-seo-pro'); ?></button>
                <button type="button" class="dastgeer-seo-tab" data-tab="schema"><?php _e('Schema', 'dastgeer-seo-pro'); ?></button>
                <button type="button" class="dastgeer-seo-tab" data-tab="ai"><?php _e('AI Tools', 'dastgeer-seo-pro'); ?></button>
            </div>
            
            <div class="dastgeer-seo-tab-content active" id="tab-general">
                <div class="dastgeer-seo-score-container">
                    <div class="dastgeer-seo-score-label"><?php _e('SEO Score', 'dastgeer-seo-pro'); ?></div>
                    <div class="dastgeer-seo-score-circle" data-score="<?php echo esc_attr($seo_score); ?>">
                        <span class="score-value"><?php echo esc_html($seo_score); ?></span>
                    </div>
                </div>
                
                <div class="dastgeer-seo-field">
                    <label for="dastgeer_seo_focus_keyword"><?php _e('Focus Keyword', 'dastgeer-seo-pro'); ?></label>
                    <input type="text" id="dastgeer_seo_focus_keyword" name="dastgeer_seo_focus_keyword" value="<?php echo esc_attr($focus_keyword); ?>" placeholder="<?php esc_attr_e('Enter focus keyword...', 'dastgeer-seo-pro'); ?>">
                    <p class="description"><?php _e('Enter the main keyword you want this post to rank for.', 'dastgeer-seo-pro'); ?></p>
                </div>
                
                <div class="dastgeer-seo-field">
                    <label for="dastgeer_seo_title"><?php _e('SEO Title', 'dastgeer-seo-pro'); ?></label>
                    <input type="text" id="dastgeer_seo_title" name="dastgeer_seo_title" value="<?php echo esc_attr($seo_data['title']); ?>" maxlength="70">
                    <p class="description"><?php _e('Recommended: 50-60 characters', 'dastgeer-seo-pro'); ?></p>
                    <div class="dastgeer-seo-char-count"><?php echo strlen($seo_data['title']); ?>/60</div>
                </div>
                
                <div class="dastgeer-seo-field">
                    <label for="dastgeer_seo_description"><?php _e('Meta Description', 'dastgeer-seo-pro'); ?></label>
                    <textarea id="dastgeer_seo_description" name="dastgeer_seo_description" rows="3" maxlength="160"><?php echo esc_textarea($seo_data['description']); ?></textarea>
                    <p class="description"><?php _e('Recommended: 120-160 characters', 'dastgeer-seo-pro'); ?></p>
                    <div class="dastgeer-seo-char-count"><?php echo strlen($seo_data['description']); ?>/160</div>
                </div>
                
                <div class="dastgeer-seo-field">
                    <label for="dastgeer_seo_canonical"><?php _e('Canonical URL', 'dastgeer-seo-pro'); ?></label>
                    <input type="url" id="dastgeer_seo_canonical" name="dastgeer_seo_canonical" value="<?php echo esc_url($seo_data['canonical']); ?>">
                </div>
                
                <div class="dastgeer-seo-field-row">
                    <div class="dastgeer-seo-field">
                        <label>
                            <input type="checkbox" name="dastgeer_seo_noindex" value="1" <?php checked($seo_data['noindex'], '1'); ?>>
                            <?php _e('No Index', 'dastgeer-seo-pro'); ?>
                        </label>
                    </div>
                    <div class="dastgeer-seo-field">
                        <label>
                            <input type="checkbox" name="dastgeer_seo_nofollow" value="1" <?php checked($seo_data['nofollow'], '1'); ?>>
                            <?php _e('No Follow', 'dastgeer-seo-pro'); ?>
                        </label>
                    </div>
                </div>
                
                <div class="dastgeer-seo-checklist">
                    <h4><?php _e('SEO Checklist', 'dastgeer-seo-pro'); ?></h4>
                    <?php echo $this->render_seo_checklist($post->ID, $focus_keyword); ?>
                </div>
            </div>
            
            <div class="dastgeer-seo-tab-content" id="tab-social">
                <div class="dastgeer-seo-preview-section">
                    <h4><?php _e('Social Preview', 'dastgeer-seo-pro'); ?></h4>
                    <div class="dastgeer-seo-social-preview">
                        <div class="preview-facebook">
                            <div class="preview-label">Facebook</div>
                            <div class="preview-card">
                                <div class="preview-image-placeholder"></div>
                                <div class="preview-content">
                                    <div class="preview-site"><?php echo esc_html(get_bloginfo('name')); ?></div>
                                    <div class="preview-title"><?php echo esc_html($seo_data['title']); ?></div>
                                    <div class="preview-description"><?php echo esc_html($seo_data['description']); ?></div>
                                </div>
                            </div>
                        </div>
                        <div class="preview-twitter">
                            <div class="preview-label">Twitter / X</div>
                            <div class="preview-card twitter">
                                <div class="preview-image-placeholder"></div>
                                <div class="preview-content">
                                    <div class="preview-title"><?php echo esc_html($seo_data['title']); ?></div>
                                    <div class="preview-description"><?php echo esc_html($seo_data['description']); ?></div>
                                    <div class="preview-site"><?php echo esc_html(get_bloginfo('url')); ?></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="dastgeer-seo-field">
                    <label for="dastgeer_seo_og_image"><?php _e('Open Graph Image', 'dastgeer-seo-pro'); ?></label>
                    <input type="url" id="dastgeer_seo_og_image" name="dastgeer_seo_og_image" value="<?php echo esc_url($seo_data['og_image']); ?>">
                    <button type="button" class="button" id="upload-og-image"><?php _e('Upload Image', 'dastgeer-seo-pro'); ?></button>
                </div>
            </div>
            
            <div class="dastgeer-seo-tab-content" id="tab-schema">
                <div class="dastgeer-seo-field">
                    <label for="dastgeer_seo_schema_type"><?php _e('Schema Type', 'dastgeer-seo-pro'); ?></label>
                    <select id="dastgeer_seo_schema_type" name="dastgeer_seo_schema_type">
                        <?php foreach ($schema_types as $type) : ?>
                            <option value="<?php echo esc_attr($type); ?>" <?php selected($seo_data['schema_type'], $type); ?>><?php echo esc_html($type); ?></option>
                        <?php endforeach; ?>
                    </select>
                    <p class="description"><?php _e('Select the most appropriate schema type for this content.', 'dastgeer-seo-pro'); ?></p>
                </div>
            </div>
            
            <div class="dastgeer-seo-tab-content" id="tab-ai">
                <div class="dastgeer-seo-ai-tools">
                    <h4><?php _e('AI Content Tools', 'dastgeer-seo-pro'); ?></h4>
                    <p><?php _e('Use AI to generate SEO-optimized content and suggestions.', 'dastgeer-seo-pro'); ?></p>
                    
                    <div class="dastgeer-seo-ai-tool">
                        <label for="ai_prompt"><?php _e('AI Prompt', 'dastgeer-seo-pro'); ?></label>
                        <textarea id="ai_prompt" rows="3" placeholder="<?php esc_attr_e('Describe what content you want to generate...', 'dastgeer-seo-pro'); ?>"></textarea>
                    </div>
                    
                    <div class="dastgeer-seo-ai-actions">
                        <button type="button" class="button button-primary" id="ai_generate_title"><?php _e('Generate Title', 'dastgeer-seo-pro'); ?></button>
                        <button type="button" class="button button-primary" id="ai_generate_description"><?php _e('Generate Description', 'dastgeer-seo-pro'); ?></button>
                        <button type="button" class="button button-primary" id="ai_generate_content"><?php _e('Generate Content', 'dastgeer-seo-pro'); ?></button>
                        <button type="button" class="button button-primary" id="ai_analyze_keywords"><?php _e('Analyze Keywords', 'dastgeer-seo-pro'); ?></button>
                    </div>
                    
                    <div class="dastgeer-seo-ai-result" id="ai_result" style="display:none;">
                        <h4><?php _e('Generated Result', 'dastgeer-seo-pro'); ?></h4>
                        <div id="ai_result_content"></div>
                        <button type="button" class="button" id="ai_apply_result"><?php _e('Apply to Post', 'dastgeer-seo-pro'); ?></button>
                    </div>
                </div>
            </div>
        </div>
        <style>
        .dastgeer-seo-meta-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: #fff; }
        .dastgeer-seo-tabs { display: flex; gap: 10px; margin-bottom: 20px; }
        .dastgeer-seo-tab { background: rgba(255,255,255,0.2); border: none; padding: 10px 20px; border-radius: 6px; color: #fff; cursor: pointer; transition: all 0.3s; }
        .dastgeer-seo-tab:hover, .dastgeer-seo-tab.active { background: rgba(255,255,255,0.4); }
        .dastgeer-seo-tab-content { display: none; background: #fff; padding: 20px; border-radius: 8px; color: #333; }
        .dastgeer-seo-tab-content.active { display: block; }
        .dastgeer-seo-field { margin-bottom: 15px; }
        .dastgeer-seo-field label { display: block; font-weight: 600; margin-bottom: 5px; }
        .dastgeer-seo-field input, .dastgeer-seo-field textarea, .dastgeer-seo-field select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
        .dastgeer-seo-field input:focus, .dastgeer-seo-field textarea:focus, .dastgeer-seo-field select:focus { outline: none; border-color: #667eea; }
        .dastgeer-seo-char-count { text-align: right; font-size: 12px; color: #666; margin-top: 5px; }
        .dastgeer-seo-score-container { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
        .dastgeer-seo-score-circle { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; }
        .dastgeer-seo-score-circle .score-value { font-size: 24px; font-weight: bold; color: #fff; }
        .dastgeer-seo-checklist h4, .dastgeer-seo-ai-tools h4 { margin: 20px 0 10px; color: #333; }
        .dastgeer-seo-social-preview { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .preview-card { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .preview-image-placeholder { height: 120px; background: #f0f0f0; }
        .preview-content { padding: 12px; }
        .preview-site { font-size: 11px; color: #666; text-transform: uppercase; }
        .preview-title { font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 5px 0; }
        .preview-description { font-size: 12px; color: #666; }
        .dastgeer-seo-ai-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0; }
        .dastgeer-seo-ai-result { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 15px; }
        </style>
        <script>
        jQuery(document).ready(function($) {
            $('.dastgeer-seo-tab').on('click', function() {
                $('.dastgeer-seo-tab').removeClass('active');
                $('.dastgeer-seo-tab-content').removeClass('active');
                $(this).addClass('active');
                $('#tab-' + $(this).data('tab')).addClass('active');
            });
            
            $('#ai_generate_title, #ai_generate_description, #ai_generate_content, #ai_analyze_keywords').on('click', function() {
                var action = $(this).attr('id');
                var prompt = $('#ai_prompt').val();
                var post_id = <?php echo get_the_ID(); ?>;
                
                $('#ai_result').show();
                $('#ai_result_content').html('<p><?php _e('Generating...', 'dastgeer-seo-pro'); ?></p>');
                
                $.ajax({
                    url: dastgeerSEO.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'dastgeer_ai_generate',
                        nonce: dastgeerSEO.nonce,
                        post_id: post_id,
                        tool: action,
                        prompt: prompt
                    },
                    success: function(response) {
                        if (response.success) {
                            $('#ai_result_content').html('<pre>' + response.data + '</pre>');
                        } else {
                            $('#ai_result_content').html('<p style="color:red;">' + response.data + '</p>');
                        }
                    },
                    error: function() {
                        $('#ai_result_content').html('<p style="color:red;"><?php _e('Error generating content', 'dastgeer-seo-pro'); ?></p>');
                    }
                });
            });
        });
        </script>
        <?php
    }
    
    private function calculate_seo_score($post_id, $focus_keyword) {
        $score = 0;
        $content = get_post_field('post_content', $post_id);
        $title = get_the_title($post_id);
        $description = get_post_meta($post_id, 'dastgeer_seo_description', true);
        
        if (empty($description)) {
            $description = get_the_excerpt($post_id);
        }
        
        if (!empty($focus_keyword)) {
            if (stripos($title, $focus_keyword) !== false) {
                $score += 20;
            }
            if (stripos($description, $focus_keyword) !== false) {
                $score += 20;
            }
            if (stripos($content, $focus_keyword) !== false) {
                $score += 20;
            }
        }
        
        if (has_post_thumbnail($post_id)) {
            $score += 10;
        }
        
        if (!empty($description) && strlen($description) >= 120) {
            $score += 10;
        }
        
        if (strlen($title) >= 30 && strlen($title) <= 60) {
            $score += 10;
        }
        
        if (preg_match('/<h[2-3]/i', $content)) {
            $score += 10;
        }
        
        return min(100, $score);
    }
    
    private function render_seo_checklist($post_id, $focus_keyword) {
        $checks = array();
        $content = get_post_field('post_content', $post_id);
        $title = get_the_title($post_id);
        
        $checks[] = array(
            'label' => __('Focus keyword is set', 'dastgeer-seo-pro'),
            'passed' => !empty($focus_keyword)
        );
        
        $checks[] = array(
            'label' => __('Focus keyword in title', 'dastgeer-seo-pro'),
            'passed' => !empty($focus_keyword) && stripos($title, $focus_keyword) !== false
        );
        
        $checks[] = array(
            'label' => __('Focus keyword in content', 'dastgeer-seo-pro'),
            'passed' => !empty($focus_keyword) && stripos($content, $focus_keyword) !== false
        );
        
        $checks[] = array(
            'label' => __('Meta description is set', 'dastgeer-seo-pro'),
            'passed' => strlen(get_post_meta($post_id, 'dastgeer_seo_description', true)) > 0
        );
        
        $checks[] = array(
            'label' => __('Title length is optimal (30-60 chars)', 'dastgeer-seo-pro'),
            'passed' => strlen($title) >= 30 && strlen($title) <= 60
        );
        
        $checks[] = array(
            'label' => __('Featured image is set', 'dastgeer-seo-pro'),
            'passed' => has_post_thumbnail($post_id)
        );
        
        $checks[] = array(
            'label' => __('Content has subheadings (H2, H3)', 'dastgeer-seo-pro'),
            'passed' => preg_match('/<h[2-3]/i', $content) === 1
        );
        
        $checks[] = array(
            'label' => __('Content length is good (300+ words)', 'dastgeer-seo-pro'),
            'passed' => str_word_count(strip_shortcodes($content)) >= 300
        );
        
        $checks[] = array(
            'label' => __('Internal links are present', 'dastgeer-seo-pro'),
            'passed' => preg_match('/<a\s+href/i', $content) === 1
        );
        
        $checks[] = array(
            'label' => __('Outbound links are present', 'dastgeer-seo-pro'),
            'passed' => preg_match('/<a\s+href=["\']https?:\/\//i', $content) === 1
        );
        
        $html = '<ul class="seo-checklist">';
        foreach ($checks as $check) {
            $status = $check['passed'] ? 'pass' : 'fail';
            $icon = $check['passed'] ? '✓' : '✗';
            $html .= sprintf(
                '<li class="%s"><span class="icon">%s</span> %s</li>',
                esc_attr($status),
                esc_html($icon),
                esc_html($check['label'])
            );
        }
        $html .= '</ul>';
        
        return $html;
    }
    
    public function save_seo_meta($post_id, $post) {
        if (!isset($_POST['dastgeer_seo_meta_nonce']) || !wp_verify_nonce($_POST['dastgeer_seo_meta_nonce'], 'dastgeer_seo_meta_box')) {
            return;
        }
        
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }
        
        $fields = array(
            'dastgeer_seo_title',
            'dastgeer_seo_description',
            'dastgeer_seo_keywords',
            'dastgeer_seo_canonical',
            'dastgeer_seo_schema_type',
            'dastgeer_seo_og_image',
            'dastgeer_seo_focus_keyword'
        );
        
        foreach ($fields as $field) {
            if (isset($_POST[$field])) {
                update_post_meta($post_id, $field, sanitize_text_field($_POST[$field]));
            }
        }
        
        $checkbox_fields = array('dastgeer_seo_noindex', 'dastgeer_seo_nofollow');
        foreach ($checkbox_fields as $field) {
            update_post_meta($post_id, $field, isset($_POST[$field]) ? '1' : '');
        }
    }
    
    public function ai_generate_content() {
        check_ajax_referer('dastgeer_seo_nonce', 'nonce');
        
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        $tool = isset($_POST['tool']) ? sanitize_text_field($_POST['tool']) : '';
        $prompt = isset($_POST['prompt']) ? sanitize_textarea_field($_POST['prompt']) : '';
        
        $provider = get_option('dastgeer_seo_ai_provider', 'openai');
        $api_key = get_option('dastgeer_seo_ai_api_key', '');
        
        if (empty($api_key)) {
            wp_send_json_error(__('AI API key is not configured. Please add it in Advanced settings.', 'dastgeer-seo-pro'));
        }
        
        $post = get_post($post_id);
        $context = '';
        
        if ($post) {
            $context = sprintf(
                "Current post title: %s\nCurrent content: %s\n\n",
                get_the_title($post),
                wp_strip_all_tags(get_post_field('post_content', $post))
            );
        }
        
        $ai_prompt = '';
        
        switch ($tool) {
            case 'ai_generate_title':
                $ai_prompt = $context . "Generate an SEO-optimized title for this content. The title should be between 50-60 characters, include the main keyword naturally, and be compelling for readers. Return only the title.";
                break;
            case 'ai_generate_description':
                $ai_prompt = $context . "Generate an SEO-optimized meta description for this content. The description should be between 120-160 characters, include the main keyword, and compel users to click. Return only the description.";
                break;
            case 'ai_generate_content':
                $ai_prompt = $context . "Generate high-quality, SEO-optimized content based on this outline or prompt: " . $prompt . ". Include proper headings (H2, H3), paragraphs, and relevant keywords naturally.";
                break;
            case 'ai_analyze_keywords':
                $ai_prompt = $context . "Analyze this content and suggest related keywords for SEO optimization. Return a JSON array of keyword suggestions with their search intent.";
                break;
            default:
                $ai_prompt = $context . $prompt;
        }
        
        $response = $this->call_ai_api($provider, $api_key, $ai_prompt);
        
        if (is_wp_error($response)) {
            wp_send_json_error($response->get_error_message());
        }
        
        wp_send_json_success($response);
    }
    
    private function call_ai_api($provider, $api_key, $prompt) {
        $response = '';
        
        switch ($provider) {
            case 'openai':
                $response = $this->call_openai($api_key, $prompt);
                break;
            case 'gemini':
                $response = $this->call_gemini($api_key, $prompt);
                break;
            case 'groq':
                $response = $this->call_groq($api_key, $prompt);
                break;
            default:
                return new WP_Error('invalid_provider', __('Invalid AI provider', 'dastgeer-seo-pro'));
        }
        
        return $response;
    }
    
    private function call_openai($api_key, $prompt) {
        $args = array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'application/json'
            ),
            'body' => json_encode(array(
                'model' => 'gpt-3.5-turbo',
                'messages' => array(
                    array(
                        'role' => 'system',
                        'content' => 'You are an expert SEO content writer. Generate optimized content based on the user request.'
                    ),
                    array(
                        'role' => 'user',
                        'content' => $prompt
                    )
                ),
                'max_tokens' => 1000,
                'temperature' => 0.7
            )),
            'timeout' => 60
        );
        
        $response = wp_remote_post('https://api.openai.com/v1/chat/completions', $args);
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (!isset($body['choices'][0]['message']['content'])) {
            return new WP_Error('api_error', __('Error communicating with OpenAI API', 'dastgeer-seo-pro'));
        }
        
        return $body['choices'][0]['message']['content'];
    }
    
    private function call_gemini($api_key, $prompt) {
        $args = array(
            'headers' => array(
                'Content-Type' => 'application/json'
            ),
            'body' => json_encode(array(
                'contents' => array(
                    array(
                        'parts' => array(
                            array('text' => $prompt)
                        )
                    )
                )
            )),
            'timeout' => 60
        );
        
        $response = wp_remote_post("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" . $api_key, $args);
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (!isset($body['candidates'][0]['content']['parts'][0]['text'])) {
            return new WP_Error('api_error', __('Error communicating with Gemini API', 'dastgeer-seo-pro'));
        }
        
        return $body['candidates'][0]['content']['parts'][0]['text'];
    }
    
    private function call_groq($api_key, $prompt) {
        $args = array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'application/json'
            ),
            'body' => json_encode(array(
                'model' => 'mixtral-8x7b-32768',
                'messages' => array(
                    array(
                        'role' => 'system',
                        'content' => 'You are an expert SEO content writer.'
                    ),
                    array(
                        'role' => 'user',
                        'content' => $prompt
                    )
                ),
                'max_tokens' => 1000,
                'temperature' => 0.7
            )),
            'timeout' => 60
        );
        
        $response = wp_remote_post('https://api.groq.com/openai/v1/chat/completions', $args);
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (!isset($body['choices'][0]['message']['content'])) {
            return new WP_Error('api_error', __('Error communicating with Groq API', 'dastgeer-seo-pro'));
        }
        
        return $body['choices'][0]['message']['content'];
    }
    
    public function save_settings() {
        check_ajax_referer('dastgeer_seo_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Permission denied', 'dastgeer-seo-pro'));
        }
        
        $settings = isset($_POST['settings']) ? $_POST['settings'] : array();
        
        foreach ($settings as $key => $value) {
            update_option($key, sanitize_text_field($value));
        }
        
        wp_send_json_success(__('Settings saved successfully!', 'dastgeer-seo-pro'));
    }
    
    public function export_settings() {
        check_ajax_referer('dastgeer_seo_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die(__('Permission denied', 'dastgeer-seo-pro'));
        }
        
        $settings = array();
        $option_keys = array(
            'dastgeer_seo_home_title',
            'dastgeer_seo_home_description',
            'dastgeer_seo_home_keywords',
            'dastgeer_seo_og_image',
            'dastgeer_seo_twitter_card',
            'dastgeer_seo_google_verification',
            'dastgeer_seo_bing_verification',
            'dastgeer_seo_enable_sitemap',
            'dastgeer_seo_enable_news_sitemap',
            'dastgeer_seo_enable_video_sitemap',
            'dastgeer_seo_enable_image_sitemap',
            'dastgeer_seo_sitemap_include',
            'dastgeer_seo_default_schema',
            'dastgeer_seo_local_business_type',
            'dastgeer_seo_local_name',
            'dastgeer_seo_local_address',
            'dastgeer_seo_local_phone',
            'dastgeer_seo_local_opening_hours',
            'dastgeer_seo_local_coordinates',
            'dastgeer_seo_ai_provider',
            'dastgeer_seo_redirect_enabled',
            'dastgeer_seo_404_monitor_enabled',
        );
        
        foreach ($option_keys as $key) {
            $settings[$key] = get_option($key, '');
        }
        
        $filename = 'dastgeer-seo-settings-' . date('Y-m-d') . '.json';
        
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-cache, must-revalidate');
        
        echo json_encode($settings, JSON_PRETTY_PRINT);
        exit;
    }
    
    public function import_settings() {
        check_ajax_referer('dastgeer_seo_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Permission denied', 'dastgeer-seo-pro'));
        }
        
        if (!isset($_FILES['import_file'])) {
            wp_send_json_error(__('No file uploaded', 'dastgeer-seo-pro'));
        }
        
        $file = $_FILES['import_file'];
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            wp_send_json_error(__('Upload error', 'dastgeer-seo-pro'));
        }
        
        $content = file_get_contents($file['tmp_name']);
        $settings = json_decode($content, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_send_json_error(__('Invalid JSON file', 'dastgeer-seo-pro'));
        }
        
        foreach ($settings as $key => $value) {
            update_option($key, $value);
        }
        
        wp_send_json_success(__('Settings imported successfully!', 'dastgeer-seo-pro'));
    }
    
    public function add_redirect() {
        check_ajax_referer('dastgeer_seo_nonce', 'nonce');
        
        global $wpdb;
        
        $source = isset($_POST['source_url']) ? sanitize_text_field($_POST['source_url']) : '';
        $destination = isset($_POST['destination_url']) ? sanitize_text_field($_POST['destination_url']) : '';
        $code = isset($_POST['response_code']) ? intval($_POST['response_code']) : 301;
        
        if (empty($source) || empty($destination)) {
            wp_send_json_error(__('Source and destination URLs are required', 'dastgeer-seo-pro'));
        }
        
        $result = $wpdb->insert(
            $wpdb->prefix . 'dastgeer_seo_redirects',
            array(
                'source_url' => $source,
                'destination_url' => $destination,
                'response_code' => $code
            ),
            array('%s', '%s', '%d')
        );
        
        if ($result) {
            wp_send_json_success(__('Redirect added successfully!', 'dastgeer-seo-pro'));
        } else {
            wp_send_json_error(__('Error adding redirect', 'dastgeer-seo-pro'));
        }
    }
    
    public function delete_redirect() {
        check_ajax_referer('dastgeer_seo_nonce', 'nonce');
        
        global $wpdb;
        
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        
        if ($id === 0) {
            wp_send_json_error(__('Invalid redirect ID', 'dastgeer-seo-pro'));
        }
        
        $result = $wpdb->delete(
            $wpdb->prefix . 'dastgeer_seo_redirects',
            array('id' => $id)
        );
        
        if ($result) {
            wp_send_json_success(__('Redirect deleted successfully!', 'dastgeer-seo-pro'));
        } else {
            wp_send_json_error(__('Error deleting redirect', 'dastgeer-seo-pro'));
        }
    }
    
    public function clear_404_log() {
        check_ajax_referer('dastgeer_seo_nonce', 'nonce');
        
        global $wpdb;
        
        $result = $wpdb->query("TRUNCATE TABLE {$wpdb->prefix}dastgeer_seo_404_log");
        
        if ($result !== false) {
            wp_send_json_success(__('404 log cleared successfully!', 'dastgeer-seo-pro'));
        } else {
            wp_send_json_error(__('Error clearing 404 log', 'dastgeer-seo-pro'));
        }
    }
    
    public function run_seo_analysis() {
        check_ajax_referer('dastgeer_seo_nonce', 'nonce');
        
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        
        if ($post_id === 0) {
            wp_send_json_error(__('Invalid post ID', 'dastgeer-seo-pro'));
        }
        
        $focus_keyword = get_post_meta($post_id, 'dastgeer_seo_focus_keyword', true);
        $score = $this->calculate_seo_score($post_id, $focus_keyword);
        $checklist = $this->render_seo_checklist($post_id, $focus_keyword);
        
        wp_send_json_success(array(
            'score' => $score,
            'checklist' => $checklist
        ));
    }
    
    public function register_rest_routes() {
        register_rest_route('dastgeer-seo/v1', '/sitemap', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_sitemap'),
            'permission_callback' => '__return_true'
        ));
        
        register_rest_route('dastgeer-seo/v1', '/sitemap-news', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_news_sitemap'),
            'permission_callback' => '__return_true'
        ));
        
        register_rest_route('dastgeer-seo/v1', '/sitemap-video', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_video_sitemap'),
            'permission_callback' => '__return_true'
        ));
    }
    
    public function get_sitemap() {
        if (!get_option('dastgeer_seo_enable_sitemap', 1)) {
            return new WP_Error('disabled', __('Sitemap is disabled', 'dastgeer-seo-pro'));
        }
        
        $include_types = get_option('dastgeer_seo_sitemap_include', array('post', 'page'));
        $exclude_ids = get_option('dastgeer_seo_sitemap_exclude', array());
        
        $urls = array();
        
        $home_url = home_url('/');
        $urls[] = array(
            'loc' => $home_url,
            'priority' => '1.0',
            'changefreq' => 'daily'
        );
        
        foreach ($include_types as $post_type) {
            $args = array(
                'post_type' => $post_type,
                'posts_per_page' => -1,
                'post_status' => 'publish',
                'post__not_in' => $exclude_ids
            );
            
            $posts = get_posts($args);
            
            foreach ($posts as $post) {
                $seo_data = $this->get_seo_data($post->ID);
                $priority = is_front_page() ? '1.0' : '0.8';
                $changefreq = 'weekly';
                
                if ($post_type === 'post') {
                    $priority = '0.9';
                    $changefreq = 'daily';
                }
                
                $urls[] = array(
                    'loc' => get_permalink($post->ID),
                    'lastmod' => get_post_modified_time('c', true, $post->ID),
                    'priority' => $priority,
                    'changefreq' => $changefreq
                );
            }
        }
        
        $taxonomies = get_taxonomies(array('public' => true), 'objects');
        foreach ($taxonomies as $taxonomy) {
            if ($taxonomy->name === 'post_format') continue;
            
            $terms = get_terms(array(
                'taxonomy' => $taxonomy->name,
                'hide_empty' => true
            ));
            
            foreach ($terms as $term) {
                $urls[] = array(
                    'loc' => get_term_link($term),
                    'priority' => '0.6',
                    'changefreq' => 'weekly'
                );
            }
        }
        
        header('Content-Type: application/xml; charset=utf-8');
        echo $this->generate_sitemap_xml($urls);
        exit;
    }
    
    private function generate_sitemap_xml($urls) {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<?xml-stylesheet type="text/xsl" href="' . DASTGEER_SEO_PLUGIN_URL . 'xslt/sitemap.xsl"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        
        foreach ($urls as $url) {
            $xml .= '  <url>' . "\n";
            $xml .= '    <loc>' . esc_url($url['loc']) . '</loc>' . "\n";
            if (isset($url['lastmod'])) {
                $xml .= '    <lastmod>' . esc_html($url['lastmod']) . '</lastmod>' . "\n";
            }
            $xml .= '    <changefreq>' . esc_html($url['changefreq']) . '</changefreq>' . "\n";
            $xml .= '    <priority>' . esc_html($url['priority']) . '</priority>' . "\n";
            $xml .= '  </url>' . "\n";
        }
        
        $xml .= '</urlset>';
        
        return $xml;
    }
    
    public function get_news_sitemap() {
        if (!get_option('dastgeer_seo_enable_news_sitemap', 0)) {
            return new WP_Error('disabled', __('News sitemap is disabled', 'dastgeer-seo-pro'));
        }
        
        $args = array(
            'post_type' => 'post',
            'posts_per_page' => 1000,
            'post_status' => 'publish',
            'date_query' => array(
                'after' => '-2 days'
            )
        );
        
        $posts = get_posts($args);
        $items = array();
        
        foreach ($posts as $post) {
            $items[] = array(
                'loc' => get_permalink($post->ID),
                'name' => get_bloginfo('name'),
                'language' => get_locale(),
                'publication_date' => get_post_field('post_date_gmt', $post->ID),
                'title' => get_the_title($post->ID),
                'keywords' => get_post_meta($post->ID, 'dastgeer_seo_keywords', true),
                'stock_tickers' => ''
            );
        }
        
        header('Content-Type: application/xml; charset=utf-8');
        echo $this->generate_news_sitemap_xml($items);
        exit;
    }
    
    private function generate_news_sitemap_xml($items) {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.google.com/schemas/sitemap-news/0.9">' . "\n";
        
        foreach ($items as $item) {
            $xml .= '  <url>' . "\n";
            $xml .= '    <loc>' . esc_url($item['loc']) . '</loc>' . "\n";
            $xml .= '    <news:news>' . "\n";
            $xml .= '      <news:publication>' . "\n";
            $xml .= '        <news:name>' . esc_html($item['name']) . '</news:name>' . "\n";
            $xml .= '        <news:language>' . esc_html($item['language']) . '</news:language>' . "\n";
            $xml .= '      </news:publication>' . "\n";
            $xml .= '      <news:publication_date>' . esc_html($item['publication_date']) . '</news:publication_date>' . "\n";
            $xml .= '      <news:title>' . esc_html($item['title']) . '</news:title>' . "\n";
            if (!empty($item['keywords'])) {
                $xml .= '      <news:keywords>' . esc_html($item['keywords']) . '</news:keywords>' . "\n";
            }
            $xml .= '    </news:news>' . "\n";
            $xml .= '  </url>' . "\n";
        }
        
        $xml .= '</urlset>';
        
        return $xml;
    }
    
    public function get_video_sitemap() {
        if (!get_option('dastgeer_seo_enable_video_sitemap', 0)) {
            return new WP_Error('disabled', __('Video sitemap is disabled', 'dastgeer-seo-pro'));
        }
        
        $items = array();
        
        $args = array(
            'post_type' => 'post',
            'posts_per_page' => -1,
            'post_status' => 'publish'
        );
        
        $posts = get_posts($args);
        
        foreach ($posts as $post) {
            $video_url = get_post_meta($post->ID, 'dastgeer_seo_video_url', true);
            if (!empty($video_url)) {
                $items[] = array(
                    'loc' => get_permalink($post->ID),
                    'video' => array(
                        'title' => get_the_title($post->ID),
                        'description' => wp_strip_all_tags(get_the_excerpt($post->ID)),
                        'content_loc' => $video_url,
                        'player_loc' => $video_url,
                        'thumbnail_loc' => get_the_post_thumbnail_url($post->ID, 'large'),
                        'duration' => get_post_meta($post->ID, 'dastgeer_seo_video_duration', true),
                        'upload_date' => get_post_field('post_date_gmt', $post->ID)
                    )
                );
            }
        }
        
        header('Content-Type: application/xml; charset=utf-8');
        echo $this->generate_video_sitemap_xml($items);
        exit;
    }
    
    private function generate_video_sitemap_xml($items) {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.google.com/schemas/sitemap-video/1.1">' . "\n";
        
        foreach ($items as $item) {
            $xml .= '  <url>' . "\n";
            $xml .= '    <loc>' . esc_url($item['loc']) . '</loc>' . "\n";
            $xml .= '    <video:video>' . "\n";
            $xml .= '      <video:title>' . esc_html($item['video']['title']) . '</video:title>' . "\n";
            $xml .= '      <video:description>' . esc_html($item['video']['description']) . '</video:description>' . "\n";
            $xml .= '      <video:content_loc>' . esc_url($item['video']['content_loc']) . '</video:content_loc>' . "\n";
            if (!empty($item['video']['thumbnail_loc'])) {
                $xml .= '      <video:thumbnail_loc>' . esc_url($item['video']['thumbnail_loc']) . '</video:thumbnail_loc>' . "\n";
            }
            if (!empty($item['video']['duration'])) {
                $xml .= '      <video:duration>' . esc_html($item['video']['duration']) . '</video:duration>' . "\n";
            }
            if (!empty($item['video']['upload_date'])) {
                $xml .= '      <video:upload_date>' . esc_html($item['video']['upload_date']) . '</video:upload_date>' . "\n";
            }
            $xml .= '    </video:video>' . "\n";
            $xml .= '  </url>' . "\n";
        }
        
        $xml .= '</urlset>';
        
        return $xml;
    }
    
    public function render_dashboard_page() {
        global $wpdb;
        
        $total_posts = wp_count_posts()->publish;
        $total_pages = wp_count_posts('page')->publish;
        $total_redirects = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}dastgeer_seo_redirects");
        $total_404s = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}dastgeer_seo_404_log");
        
        $recent_404s = $wpdb->get_results(
            "SELECT * FROM {$wpdb->prefix}dastgeer_seo_404_log ORDER BY last_visit DESC LIMIT 10"
        );
        
        $top_redirects = $wpdb->get_results(
            "SELECT * FROM {$wpdb->prefix}dastgeer_seo_redirects ORDER BY hits DESC LIMIT 10"
        );
        
        ?>
        <div class="dastgeer-seo-admin">
            <div class="dastgeer-seo-header">
                <h1><?php _e('Dastgeer SEO Pro Dashboard', 'dastgeer-seo-pro'); ?></h1>
                <p class="subtitle"><?php _e('Complete SEO solution with AI capabilities', 'dastgeer-seo-pro'); ?></p>
            </div>
            
            <div class="dastgeer-seo-stats">
                <div class="stat-card">
                    <div class="stat-icon"><span class="dashicons dashicons-admin-post"></span></div>
                    <div class="stat-info">
                        <h3><?php echo number_format($total_posts); ?></h3>
                        <p><?php _e('Published Posts', 'dastgeer-seo-pro'); ?></p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><span class="dashicons dashicons-admin-page"></span></div>
                    <div class="stat-info">
                        <h3><?php echo number_format($total_pages); ?></h3>
                        <p><?php _e('Pages', 'dastgeer-seo-pro'); ?></p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><span class="dashicons dashicons-randomize"></span></div>
                    <div class="stat-info">
                        <h3><?php echo number_format($total_redirects); ?></h3>
                        <p><?php _e('Active Redirects', 'dastgeer-seo-pro'); ?></p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><span class="dashicons dashicons-dismiss"></span></div>
                    <div class="stat-info">
                        <h3><?php echo number_format($total_404s); ?></h3>
                        <p><?php _e('404 Errors Logged', 'dastgeer-seo-pro'); ?></p>
                    </div>
                </div>
            </div>
            
            <div class="dastgeer-seo-grid">
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Quick Actions', 'dastgeer-seo-pro'); ?></h2>
                    <div class="quick-actions">
                        <a href="<?php echo admin_url('admin.php?page=dastgeer-seo-general'); ?>" class="action-btn">
                            <span class="dashicons dashicons-admin-generic"></span>
                            <?php _e('General Settings', 'dastgeer-seo-pro'); ?>
                        </a>
                        <a href="<?php echo admin_url('admin.php?page=dastgeer-seo-sitemaps'); ?>" class="action-btn">
                            <span class="dashicons dashicons-networking"></span>
                            <?php _e('XML Sitemaps', 'dastgeer-seo-pro'); ?>
                        </a>
                        <a href="<?php echo admin_url('admin.php?page=dastgeer-seo-social'); ?>" class="action-btn">
                            <span class="dashicons dashicons-share"></span>
                            <?php _e('Social Settings', 'dastgeer-seo-pro'); ?>
                        </a>
                        <a href="<?php echo admin_url('admin.php?page=dastgeer-seo-schema'); ?>" class="action-btn">
                            <span class="dashicons dashicons-clipboard"></span>
                            <?php _e('Schema Markup', 'dastgeer-seo-pro'); ?>
                        </a>
                        <a href="<?php echo admin_url('admin.php?page=dastgeer-seo-redirects'); ?>" class="action-btn">
                            <span class="dashicons dashicons-randomize"></span>
                            <?php _e('Manage Redirects', 'dastgeer-seo-pro'); ?>
                        </a>
                        <a href="<?php echo admin_url('admin.php?page=dastgeer-seo-404'); ?>" class="action-btn">
                            <span class="dashicons dashicons-dismiss"></span>
                            <?php _e('404 Monitor', 'dastgeer-seo-pro'); ?>
                        </a>
                    </div>
                </div>
                
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Recent 404 Errors', 'dastgeer-seo-pro'); ?></h2>
                    <?php if (!empty($recent_404s)) : ?>
                        <table class="widefat">
                            <thead>
                                <tr>
                                    <th><?php _e('URL', 'dastgeer-seo-pro'); ?></th>
                                    <th><?php _e('Hits', 'dastgeer-seo-pro'); ?></th>
                                    <th><?php _e('Last Visit', 'dastgeer-seo-pro'); ?></th>
                                    <th><?php _e('Actions', 'dastgeer-seo-pro'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($recent_404s as $404) : ?>
                                    <tr>
                                        <td><code><?php echo esc_html($404->request_uri); ?></code></td>
                                        <td><?php echo esc_html($404->hit_count); ?></td>
                                        <td><?php echo esc_html($404->last_visit); ?></td>
                                        <td>
                                            <button type="button" class="button create-redirect" data-url="<?php echo esc_url($404->request_uri); ?>">
                                                <?php _e('Create Redirect', 'dastgeer-seo-pro'); ?>
                                            </button>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php else : ?>
                        <p><?php _e('No 404 errors logged yet.', 'dastgeer-seo-pro'); ?></p>
                    <?php endif; ?>
                </div>
                
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Top Redirects', 'dastgeer-seo-pro'); ?></h2>
                    <?php if (!empty($top_redirects)) : ?>
                        <table class="widefat">
                            <thead>
                                <tr>
                                    <th><?php _e('Source', 'dastgeer-seo-pro'); ?></th>
                                    <th><?php _e('Destination', 'dastgeer-seo-pro'); ?></th>
                                    <th><?php _e('Hits', 'dastgeer-seo-pro'); ?></th>
                                    <th><?php _e('Code', 'dastgeer-seo-pro'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($top_redirects as $redirect) : ?>
                                    <tr>
                                        <td><code><?php echo esc_html($redirect->source_url); ?></code></td>
                                        <td><code><?php echo esc_html($redirect->destination_url); ?></code></td>
                                        <td><?php echo esc_html($redirect->hits); ?></td>
                                        <td><?php echo esc_html($redirect->response_code); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php else : ?>
                        <p><?php _e('No redirects configured yet.', 'dastgeer-seo-pro'); ?></p>
                    <?php endif; ?>
                </div>
            </div>
            
            <div class="dastgeer-seo-card">
                <h2><?php _e('SEO Health Check', 'dastgeer-seo-pro'); ?></h2>
                <div class="health-checks">
                    <?php
                    $checks = array(
                        array(
                            'label' => __('Homepage has SEO title', 'dastgeer-seo-pro'),
                            'status' => !empty(get_option('dastgeer_seo_home_title')),
                            'fix' => admin_url('admin.php?page=dastgeer-seo-general')
                        ),
                        array(
                            'label' => __('Homepage has meta description', 'dastgeer-seo-pro'),
                            'status' => !empty(get_option('dastgeer_seo_home_description')),
                            'fix' => admin_url('admin.php?page=dastgeer-seo-general')
                        ),
                        array(
                            'label' => __('XML Sitemap is enabled', 'dastgeer-seo-pro'),
                            'status' => get_option('dastgeer_seo_enable_sitemap', 1) == 1,
                            'fix' => admin_url('admin.php?page=dastgeer-seo-sitemaps')
                        ),
                        array(
                            'label' => __('Open Graph is enabled', 'dastgeer-seo-pro'),
                            'status' => !empty(get_option('dastgeer_seo_og_image')),
                            'fix' => admin_url('admin.php?page=dastgeer-seo-social')
                        ),
                        array(
                            'label' => __('Google Search Console verified', 'dastgeer-seo-pro'),
                            'status' => !empty(get_option('dastgeer_seo_google_verification')),
                            'fix' => admin_url('admin.php?page=dastgeer-seo-general')
                        ),
                        array(
                            'label' => __('Local SEO configured', 'dastgeer-seo-pro'),
                            'status' => !empty(get_option('dastgeer_seo_local_address')),
                            'fix' => admin_url('admin.php?page=dastgeer-seo-local')
                        ),
                    );
                    
                    foreach ($checks as $check) :
                        $status_class = $check['status'] ? 'pass' : 'fail';
                        $status_icon = $check['status'] ? '✓' : '✗';
                        ?>
                        <div class="health-check <?php echo esc_attr($status_class); ?>">
                            <span class="status-icon"><?php echo esc_html($status_icon); ?></span>
                            <span class="status-label"><?php echo esc_html($check['label']); ?></span>
                            <?php if (!$check['status']) : ?>
                                <a href="<?php echo esc_url($check['fix']); ?>" class="button button-small">
                                    <?php _e('Fix', 'dastgeer-seo-pro'); ?>
                                </a>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function render_general_page() {
        $home_title = get_option('dastgeer_seo_home_title', get_bloginfo('name'));
        $home_description = get_option('dastgeer_seo_home_description', get_bloginfo('description'));
        $home_keywords = get_option('dastgeer_seo_home_keywords', '');
        $google_verification = get_option('dastgeer_seo_google_verification', '');
        $bing_verification = get_option('dastgeer_seo_bing_verification', '');
        $baidu_verification = get_option('dastgeer_seo_baidu_verification', '');
        ?>
        <div class="dastgeer-seo-admin">
            <div class="dastgeer-seo-header">
                <h1><?php _e('General Settings', 'dastgeer-seo-pro'); ?></h1>
            </div>
            
            <form method="post" action="" id="dastgeer-seo-general-form">
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Homepage SEO', 'dastgeer-seo-pro'); ?></h2>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_home_title"><?php _e('Homepage Title', 'dastgeer-seo-pro'); ?></label>
                        <input type="text" id="dastgeer_seo_home_title" name="dastgeer_seo_home_title" value="<?php echo esc_attr($home_title); ?>" maxlength="70">
                        <p class="description"><?php _e('Recommended: 50-60 characters', 'dastgeer-seo-pro'); ?></p>
                    </div>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_home_description"><?php _e('Homepage Meta Description', 'dastgeer-seo-pro'); ?></label>
                        <textarea id="dastgeer_seo_home_description" name="dastgeer_seo_home_description" rows="3" maxlength="160"><?php echo esc_textarea($home_description); ?></textarea>
                        <p class="description"><?php _e('Recommended: 120-160 characters', 'dastgeer-seo-pro'); ?></p>
                    </div>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_home_keywords"><?php _e('Homepage Keywords', 'dastgeer-seo-pro'); ?></label>
                        <input type="text" id="dastgeer_seo_home_keywords" name="dastgeer_seo_home_keywords" value="<?php echo esc_attr($home_keywords); ?>">
                        <p class="description"><?php _e('Comma-separated keywords', 'dastgeer-seo-pro'); ?></p>
                    </div>
                </div>
                
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Search Engine Verification', 'dastgeer-seo-pro'); ?></h2>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_google_verification"><?php _e('Google Search Console', 'dastgeer-seo-pro'); ?></label>
                        <input type="text" id="dastgeer_seo_google_verification" name="dastgeer_seo_google_verification" value="<?php echo esc_attr($google_verification); ?>" placeholder="ABCDEFGHIJKLMNOPQRSTUVWXYZ">
                        <p class="description"><?php _e('Enter your Google verification code from Search Console', 'dastgeer-seo-pro'); ?></p>
                    </div>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_bing_verification"><?php _e('Bing Webmaster Tools', 'dastgeer-seo-pro'); ?></label>
                        <input type="text" id="dastgeer_seo_bing_verification" name="dastgeer_seo_bing_verification" value="<?php echo esc_attr($bing_verification); ?>" placeholder="1234567890ABCDEFG">
                        <p class="description"><?php _e('Enter your Bing verification code', 'dastgeer-seo-pro'); ?></p>
                    </div>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_baidu_verification"><?php _e('Baidu Webmaster Tools', 'dastgeer-seo-pro'); ?></label>
                        <input type="text" id="dastgeer_seo_baidu_verification" name="dastgeer_seo_baidu_verification" value="<?php echo esc_attr($baidu_verification); ?>">
                        <p class="description"><?php _e('Enter your Baidu verification code', 'dastgeer-seo-pro'); ?></p>
                    </div>
                </div>
                
                <p class="submit">
                    <button type="submit" class="button button-primary button-hero">
                        <?php _e('Save All Changes', 'dastgeer-seo-pro'); ?>
                    </button>
                </p>
            </form>
        </div>
        <?php
    }
    
    public function render_social_page() {
        $og_image = get_option('dastgeer_seo_og_image', '');
        $twitter_card = get_option('dastgeer_seo_twitter_card', 'summary_large_image');
        $fb_app_id = get_option('dastgeer_seo_fb_app_id', '');
        $default_og_title = get_option('dastgeer_seo_default_og_title', '');
        $default_og_description = get_option('dastgeer_seo_default_og_description', '');
        ?>
        <div class="dastgeer-seo-admin">
            <div class="dastgeer-seo-header">
                <h1><?php _e('Social Media Settings', 'dastgeer-seo-pro'); ?></h1>
            </div>
            
            <form method="post" action="" id="dastgeer-seo-social-form">
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Open Graph Settings', 'dastgeer-seo-pro'); ?></h2>
                    <p><?php _e('Open Graph tags help control how your content appears when shared on Facebook, LinkedIn, and other social platforms.', 'dastgeer-seo-pro'); ?></p>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_og_image"><?php _e('Default Open Graph Image', 'dastgeer-seo-pro'); ?></label>
                        <input type="url" id="dastgeer_seo_og_image" name="dastgeer_seo_og_image" value="<?php echo esc_url($og_image); ?>">
                        <p class="description"><?php _e('Recommended size: 1200x630 pixels', 'dastgeer-seo-pro'); ?></p>
                    </div>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_fb_app_id"><?php _e('Facebook App ID', 'dastgeer-seo-pro'); ?></label>
                        <input type="text" id="dastgeer_seo_fb_app_id" name="dastgeer_seo_fb_app_id" value="<?php echo esc_attr($fb_app_id); ?>">
                    </div>
                </div>
                
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Twitter Card Settings', 'dastgeer-seo-pro'); ?></h2>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_twitter_card"><?php _e('Default Twitter Card Type', 'dastgeer-seo-pro'); ?></label>
                        <select id="dastgeer_seo_twitter_card" name="dastgeer_seo_twitter_card">
                            <option value="summary" <?php selected($twitter_card, 'summary'); ?>><?php _e('Summary', 'dastgeer-seo-pro'); ?></option>
                            <option value="summary_large_image" <?php selected($twitter_card, 'summary_large_image'); ?>><?php _e('Summary with Large Image', 'dastgeer-seo-pro'); ?></option>
                        </select>
                    </div>
                </div>
                
                <p class="submit">
                    <button type="submit" class="button button-primary button-hero">
                        <?php _e('Save All Changes', 'dastgeer-seo-pro'); ?>
                    </button>
                </p>
            </form>
        </div>
        <?php
    }
    
    public function render_sitemaps_page() {
        $enable_sitemap = get_option('dastgeer_seo_enable_sitemap', 1);
        $enable_news_sitemap = get_option('dastgeer_seo_enable_news_sitemap', 0);
        $enable_video_sitemap = get_option('dastgeer_seo_enable_video_sitemap', 0);
        $enable_image_sitemap = get_option('dastgeer_seo_enable_image_sitemap', 1);
        $sitemap_include = get_option('dastgeer_seo_sitemap_include', array('post', 'page'));
        $sitemap_exclude = get_option('dastgeer_seo_sitemap_exclude', array());
        $sitemap_priority = get_option('dastgeer_seo_sitemap_priority', 'auto');
        
        $post_types = get_post_types(array('public' => true), 'objects');
        ?>
        <div class="dastgeer-seo-admin">
            <div class="dastgeer-seo-header">
                <h1><?php _e('XML Sitemap Settings', 'dastgeer-seo-pro'); ?></h1>
            </div>
            
            <form method="post" action="" id="dastgeer-seo-sitemap-form">
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Sitemap Configuration', 'dastgeer-seo-pro'); ?></h2>
                    
                    <div class="dastgeer-seo-toggle">
                        <label>
                            <input type="checkbox" name="dastgeer_seo_enable_sitemap" value="1" <?php checked($enable_sitemap, 1); ?>>
                            <?php _e('Enable XML Sitemap', 'dastgeer-seo-pro'); ?>
                        </label>
                        <p class="description"><?php _e('Your sitemap is available at:', 'dastgeer-seo-pro'); ?> 
                        <a href="<?php echo esc_url(home_url('/wp-json/dastgeer-seo/v1/sitemap')); ?>" target="_blank"><?php _e('View Sitemap', 'dastgeer-seo-pro'); ?></a></p>
                    </div>
                    
                    <div class="dastgeer-seo-toggle">
                        <label>
                            <input type="checkbox" name="dastgeer_seo_enable_news_sitemap" value="1" <?php checked($enable_news_sitemap, 1); ?>>
                            <?php _e('Enable News Sitemap', 'dastgeer-seo-pro'); ?>
                        </label>
                        <p class="description"><?php _e('For Google News. Only includes posts from the last 48 hours.', 'dastgeer-seo-pro'); ?></p>
                    </div>
                    
                    <div class="dastgeer-seo-toggle">
                        <label>
                            <input type="checkbox" name="dastgeer_seo_enable_video_sitemap" value="1" <?php checked($enable_video_sitemap, 1); ?>>
                            <?php _e('Enable Video Sitemap', 'dastgeer-seo-pro'); ?>
                        </label>
                        <p class="description"><?php _e('For posts with video content', 'dastgeer-seo-pro'); ?></p>
                    </div>
                    
                    <div class="dastgeer-seo-toggle">
                        <label>
                            <input type="checkbox" name="dastgeer_seo_enable_image_sitemap" value="1" <?php checked($enable_image_sitemap, 1); ?>>
                            <?php _e('Enable Image Sitemap', 'dastgeer-seo-pro'); ?>
                        </label>
                    </div>
                </div>
                
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Include in Sitemap', 'dastgeer-seo-pro'); ?></h2>
                    
                    <?php foreach ($post_types as $pt) : ?>
                        <div class="dastgeer-seo-toggle">
                            <label>
                                <input type="checkbox" name="dastgeer_seo_sitemap_include[]" value="<?php echo esc_attr($pt->name); ?>" <?php checked(in_array($pt->name, $sitemap_include), true); ?>>
                                <?php echo esc_html($pt->labels->name); ?>
                            </label>
                        </div>
                    <?php endforeach; ?>
                </div>
                
                <p class="submit">
                    <button type="submit" class="button button-primary button-hero">
                        <?php _e('Save All Changes', 'dastgeer-seo-pro'); ?>
                    </button>
                </p>
            </form>
        </div>
        <?php
    }
    
    public function render_schema_page() {
        $default_schema = get_option('dastgeer_seo_default_schema', 'Article');
        $schema_types = array(
            'Article', 'NewsArticle', 'BlogPosting', 'WebPage', 'VideoObject',
            'Event', 'Product', 'Recipe', 'FAQPage', 'HowTo', 'LocalBusiness',
            'Organization', 'Person', 'Place', 'Book', 'Movie', 'Review'
        );
        ?>
        <div class="dastgeer-seo-admin">
            <div class="dastgeer-seo-header">
                <h1><?php _e('Schema Markup Settings', 'dastgeer-seo-pro'); ?></h1>
            </div>
            
            <form method="post" action="" id="dastgeer-seo-schema-form">
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Default Schema Type', 'dastgeer-seo-pro'); ?></h2>
                    <p><?php _e('Select the default schema type for your posts. You can override this for individual posts in the post editor.', 'dastgeer-seo-pro'); ?></p>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_default_schema"><?php _e('Default Schema Type', 'dastgeer-seo-pro'); ?></label>
                        <select id="dastgeer_seo_default_schema" name="dastgeer_seo_default_schema">
                            <?php foreach ($schema_types as $type) : ?>
                                <option value="<?php echo esc_attr($type); ?>" <?php selected($default_schema, $type); ?>><?php echo esc_html($type); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>
                
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Schema Type Reference', 'dastgeer-seo-pro'); ?></h2>
                    <table class="widefat">
                        <thead>
                            <tr>
                                <th><?php _e('Schema Type', 'dastgeer-seo-pro'); ?></th>
                                <th><?php _e('Description', 'dastgeer-seo-pro'); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Article</strong></td>
                                <td><?php _e('General news articles, blog posts', 'dastgeer-seo-pro'); ?></td>
                            </tr>
                            <tr>
                                <td><strong>NewsArticle</strong></td>
                                <td><?php _e('Breaking news, journalism', 'dastgeer-seo-pro'); ?></td>
                            </tr>
                            <tr>
                                <td><strong>BlogPosting</strong></td>
                                <td><?php _e('Blog entries', 'dastgeer-seo-pro'); ?></td>
                            </tr>
                            <tr>
                                <td><strong>Product</strong></td>
                                <td><?php _e('Products for sale', 'dastgeer-seo-pro'); ?></td>
                            </tr>
                            <tr>
                                <td><strong>Recipe</strong></td>
                                <td><?php _e('Food recipes', 'dastgeer-seo-pro'); ?></td>
                            </tr>
                            <tr>
                                <td><strong>FAQPage</strong></td>
                                <td><?php _e('Frequently asked questions', 'dastgeer-seo-pro'); ?></td>
                            </tr>
                            <tr>
                                <td><strong>LocalBusiness</strong></td>
                                <td><?php _e('Local business information', 'dastgeer-seo-pro'); ?></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <p class="submit">
                    <button type="submit" class="button button-primary button-hero">
                        <?php _e('Save All Changes', 'dastgeer-seo-pro'); ?>
                    </button>
                </p>
            </form>
        </div>
        <?php
    }
    
    public function render_redirects_page() {
        global $wpdb;
        
        $redirects = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}dastgeer_seo_redirects ORDER BY id DESC");
        $redirect_enabled = get_option('dastgeer_seo_redirect_enabled', 1);
        ?>
        <div class="dastgeer-seo-admin">
            <div class="dastgeer-seo-header">
                <h1><?php _e('Redirect Manager', 'dastgeer-seo-pro'); ?></h1>
            </div>
            
            <form method="post" id="dastgeer-seo-redirects-form">
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Settings', 'dastgeer-seo-pro'); ?></h2>
                    <div class="dastgeer-seo-toggle">
                        <label>
                            <input type="checkbox" name="dastgeer_seo_redirect_enabled" value="1" <?php checked($redirect_enabled, 1); ?>>
                            <?php _e('Enable Redirect Processing', 'dastgeer-seo-pro'); ?>
                        </label>
                    </div>
                </div>
                
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Add New Redirect', 'dastgeer-seo-pro'); ?></h2>
                    
                    <div class="dastgeer-seo-redirect-form">
                        <div class="form-row">
                            <label for="source_url"><?php _e('Source URL', 'dastgeer-seo-pro'); ?></label>
                            <input type="url" id="source_url" name="source_url" placeholder="/old-page" required>
                        </div>
                        <div class="form-row">
                            <label for="destination_url"><?php _e('Destination URL', 'dastgeer-seo-pro'); ?></label>
                            <input type="url" id="destination_url" name="destination_url" placeholder="https://example.com/new-page" required>
                        </div>
                        <div class="form-row">
                            <label for="response_code"><?php _e('Redirect Type', 'dastgeer-seo-pro'); ?></label>
                            <select id="response_code" name="response_code">
                                <option value="301">301 - Permanent</option>
                                <option value="302">302 - Temporary</option>
                                <option value="307">307 - Temporary (Strict)</option>
                                <option value="410">410 - Gone</option>
                                <option value="451">451 - Unavailable (Legal)</option>
                            </select>
                        </div>
                        <button type="button" id="add-redirect-btn" class="button button-primary">
                            <?php _e('Add Redirect', 'dastgeer-seo-pro'); ?>
                        </button>
                    </div>
                </div>
                
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Active Redirects', 'dastgeer-seo-pro'); ?></h2>
                    
                    <?php if (!empty($redirects)) : ?>
                        <table class="widefat" id="redirects-table">
                            <thead>
                                <tr>
                                    <th><?php _e('Source URL', 'dastgeer-seo-pro'); ?></th>
                                    <th><?php _e('Destination URL', 'dastgeer-seo-pro'); ?></th>
                                    <th><?php _e('Type', 'dastgeer-seo-pro'); ?></th>
                                    <th><?php _e('Hits', 'dastgeer-seo-pro'); ?></th>
                                    <th><?php _e('Actions', 'dastgeer-seo-pro'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($redirects as $redirect) : ?>
                                    <tr data-id="<?php echo esc_attr($redirect->id); ?>">
                                        <td><code><?php echo esc_html($redirect->source_url); ?></code></td>
                                        <td><code><?php echo esc_html($redirect->destination_url); ?></code></td>
                                        <td><?php echo esc_html($redirect->response_code); ?></td>
                                        <td><?php echo esc_html($redirect->hits); ?></td>
                                        <td>
                                            <button type="button" class="button delete-redirect" data-id="<?php echo esc_attr($redirect->id); ?>">
                                                <?php _e('Delete', 'dastgeer-seo-pro'); ?>
                                            </button>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php else : ?>
                        <p><?php _e('No redirects have been created yet.', 'dastgeer-seo-pro'); ?></p>
                    <?php endif; ?>
                </div>
                
                <p class="submit">
                    <button type="submit" class="button button-primary button-hero">
                        <?php _e('Save Settings', 'dastgeer-seo-pro'); ?>
                    </button>
                </p>
            </form>
        </div>
        <?php
    }
    
    public function render_404_page() {
        global $wpdb;
        
        $errors_404 = $wpdb->get_results(
            "SELECT * FROM {$wpdb->prefix}dastgeer_seo_404_log ORDER BY last_visit DESC LIMIT 100"
        );
        
        $monitor_enabled = get_option('dastgeer_seo_404_monitor_enabled', 1);
        ?>
        <div class="dastgeer-seo-admin">
            <div class="dastgeer-seo-header">
                <h1><?php _e('404 Error Monitor', 'dastgeer-seo-pro'); ?></h1>
            </div>
            
            <form method="post" id="dastgeer-seo-404-form">
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Settings', 'dastgeer-seo-pro'); ?></h2>
                    <div class="dastgeer-seo-toggle">
                        <label>
                            <input type="checkbox" name="dastgeer_seo_404_monitor_enabled" value="1" <?php checked($monitor_enabled, 1); ?>>
                            <?php _e('Enable 404 Monitoring', 'dastgeer-seo-pro'); ?>
                        </label>
                        <p class="description"><?php _e('Log all 404 errors to help identify broken links and missing pages.', 'dastgeer-seo-pro'); ?></p>
                    </div>
                </div>
                
                <div class="dastgeer-seo-card">
                    <h2><?php _e('404 Error Log', 'dastgeer-seo-pro'); ?></h2>
                    <div class="tablenav top">
                        <div class="alignleft actions">
                            <button type="button" id="clear-404-log" class="button">
                                <?php _e('Clear Log', 'dastgeer-seo-pro'); ?>
                            </button>
                        </div>
                    </div>
                    
                    <?php if (!empty($errors_404)) : ?>
                        <table class="widefat" id="404-table">
                            <thead>
                                <tr>
                                    <th><?php _e('Requested URL', 'dastgeer-seo-pro'); ?></th>
                                    <th><?php _e('Referrer', 'dastgeer-seo-pro'); ?></th>
                                    <th><?php _e('User Agent', 'dastgeer-seo-pro'); ?></th>
                                    <th><?php _e('Hits', 'dastgeer-seo-pro'); ?></th>
                                    <th><?php _e('Last Visit', 'dastgeer-seo-pro'); ?></th>
                                    <th><?php _e('Actions', 'dastgeer-seo-pro'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($errors_404 as $error) : ?>
                                    <tr>
                                        <td><code><?php echo esc_html($error->request_uri); ?></code></td>
                                        <td><?php echo esc_html($error->referrer ?: '-'); ?></td>
                                        <td><?php echo esc_html(wp_trim_words($error->user_agent, 5, '...')); ?></td>
                                        <td><?php echo esc_html($error->hit_count); ?></td>
                                        <td><?php echo esc_html($error->last_visit); ?></td>
                                        <td>
                                            <button type="button" class="button create-redirect" data-url="<?php echo esc_url($error->request_uri); ?>">
                                                <?php _e('Create Redirect', 'dastgeer-seo-pro'); ?>
                                            </button>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php else : ?>
                        <p><?php _e('No 404 errors have been logged yet.', 'dastgeer-seo-pro'); ?></p>
                    <?php endif; ?>
                </div>
            </form>
        </div>
        <?php
    }
    
    public function render_local_page() {
        $business_type = get_option('dastgeer_seo_local_business_type', 'LocalBusiness');
        $business_name = get_option('dastgeer_seo_local_name', get_bloginfo('name'));
        $address = get_option('dastgeer_seo_local_address', '');
        $phone = get_option('dastgeer_seo_local_phone', '');
        $opening_hours = get_option('dastgeer_seo_local_opening_hours', '');
        $latitude = get_option('dastgeer_seo_local_latitude', '');
        $longitude = get_option('dastgeer_seo_local_longitude', '');
        $price_range = get_option('dastgeer_seo_local_price_range', '');
        
        $business_types = array(
            'LocalBusiness',
            'Restaurant',
            'Cafe',
            'Bar',
            'Bakery',
            'Store',
            'ClothingStore',
            'ElectronicsStore',
            'FurnitureStore',
            'GroceryStore',
            'Hotel',
            'LodgingBusiness',
            'MedicalClinic',
            'Dentist',
            'Doctor',
            'Hospital',
            'Pharmacy',
            'AutoRepair',
            'BankOrCreditUnion',
            'Salon',
            'Spas',
            'Gym',
            'FitnessCenter'
        );
        ?>
        <div class="dastgeer-seo-admin">
            <div class="dastgeer-seo-header">
                <h1><?php _e('Local SEO', 'dastgeer-seo-pro'); ?></h1>
            </div>
            
            <form method="post" action="" id="dastgeer-seo-local-form">
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Local Business Information', 'dastgeer-seo-pro'); ?></h2>
                    <p><?php _e('This information will be used to generate Local Business schema markup for search engines.', 'dastgeer-seo-pro'); ?></p>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_local_business_type"><?php _e('Business Type', 'dastgeer-seo-pro'); ?></label>
                        <select id="dastgeer_seo_local_business_type" name="dastgeer_seo_local_business_type">
                            <?php foreach ($business_types as $type) : ?>
                                <option value="<?php echo esc_attr($type); ?>" <?php selected($business_type, $type); ?>><?php echo esc_html($type); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_local_name"><?php _e('Business Name', 'dastgeer-seo-pro'); ?></label>
                        <input type="text" id="dastgeer_seo_local_name" name="dastgeer_seo_local_name" value="<?php echo esc_attr($business_name); ?>">
                    </div>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_local_address"><?php _e('Street Address', 'dastgeer-seo-pro'); ?></label>
                        <input type="text" id="dastgeer_seo_local_address" name="dastgeer_seo_local_address" value="<?php echo esc_attr($address); ?>" placeholder="123 Main St, Suite 100">
                    </div>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_local_phone"><?php _e('Phone Number', 'dastgeer-seo-pro'); ?></label>
                        <input type="tel" id="dastgeer_seo_local_phone" name="dastgeer_seo_local_phone" value="<?php echo esc_attr($phone); ?>" placeholder="+1 (555) 123-4567">
                    </div>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_local_opening_hours"><?php _e('Opening Hours', 'dastgeer-seo-pro'); ?></label>
                        <input type="text" id="dastgeer_seo_local_opening_hours" name="dastgeer_seo_local_opening_hours" value="<?php echo esc_attr($opening_hours); ?>" placeholder="Mo-Fr 09:00-17:00, Sa 10:00-14:00">
                        <p class="description"><?php _e('Format: Day-Time, Day-Time (e.g., Mo-Fr 09:00-17:00)', 'dastgeer-seo-pro'); ?></p>
                    </div>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_local_price_range"><?php _e('Price Range', 'dastgeer-seo-pro'); ?></label>
                        <select id="dastgeer_seo_local_price_range" name="dastgeer_seo_local_price_range">
                            <option value=""><?php _e('Select...', 'dastgeer-seo-pro'); ?></option>
                            <option value="$" <?php selected($price_range, '$'); ?>>$ - Inexpensive</option>
                            <option value="$$" <?php selected($price_range, '$$'); ?>>$$ - Moderate</option>
                            <option value="$$$" <?php selected($price_range, '$$$'); ?>>$$$ - Pricey</option>
                            <option value="$$$$" <?php selected($price_range, '$$$$'); ?>>$$$$ - Ultra High-End</option>
                        </select>
                    </div>
                </div>
                
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Geographic Coordinates', 'dastgeer-seo-pro'); ?></h2>
                    <p><?php _e('Enter the latitude and longitude for accurate map display.', 'dastgeer-seo-pro'); ?></p>
                    
                    <div class="dastgeer-seo-field-row">
                        <div class="dastgeer-seo-field">
                            <label for="dastgeer_seo_local_latitude"><?php _e('Latitude', 'dastgeer-seo-pro'); ?></label>
                            <input type="text" id="dastgeer_seo_local_latitude" name="dastgeer_seo_local_latitude" value="<?php echo esc_attr($latitude); ?>" placeholder="40.712776">
                        </div>
                        <div class="dastgeer-seo-field">
                            <label for="dastgeer_seo_local_longitude"><?php _e('Longitude', 'dastgeer-seo-pro'); ?></label>
                            <input type="text" id="dastgeer_seo_local_longitude" name="dastgeer_seo_local_longitude" value="<?php echo esc_attr($longitude); ?>" placeholder="-74.005974">
                        </div>
                    </div>
                </div>
                
                <p class="submit">
                    <button type="submit" class="button button-primary button-hero">
                        <?php _e('Save All Changes', 'dastgeer-seo-pro'); ?>
                    </button>
                </p>
            </form>
        </div>
        <?php
    }
    
    public function render_auto_poster_page() {
        $enabled = get_option('dastgeer_seo_auto_post_enabled', 0);
        $post_types = get_option('dastgeer_seo_auto_post_types', array('post'));
        $publish_status = get_option('dastgeer_seo_auto_post_status', 'publish');
        
        $all_post_types = get_post_types(array('public' => true), 'objects');
        ?>
        <div class="dastgeer-seo-admin">
            <div class="dastgeer-seo-header">
                <h1><?php _e('Auto Poster Settings', 'dastgeer-seo-pro'); ?></h1>
            </div>
            
            <form method="post" action="" id="dastgeer-seo-auto-poster-form">
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Auto Poster Configuration', 'dastgeer-seo-pro'); ?></h2>
                    <p><?php _e('Configure automatic posting to social media platforms when content is published.', 'dastgeer-seo-pro'); ?></p>
                    
                    <div class="dastgeer-seo-toggle">
                        <label>
                            <input type="checkbox" name="dastgeer_seo_auto_post_enabled" value="1" <?php checked($enabled, 1); ?>>
                            <?php _e('Enable Auto Poster', 'dastgeer-seo-pro'); ?>
                        </label>
                    </div>
                </div>
                
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Post Types', 'dastgeer-seo-pro'); ?></h2>
                    <p><?php _e('Select which post types should trigger auto posting.', 'dastgegeer-seo-pro'); ?></p>
                    
                    <?php foreach ($all_post_types as $pt) : ?>
                        <div class="dastgeer-seo-toggle">
                            <label>
                                <input type="checkbox" name="dastgeer_seo_auto_post_types[]" value="<?php echo esc_attr($pt->name); ?>" <?php checked(in_array($pt->name, $post_types), true); ?>>
                                <?php echo esc_html($pt->labels->name); ?>
                            </label>
                        </div>
                    <?php endforeach; ?>
                </div>
                
                <div class="dastgeer-seo-card">
                    <h2><?php _e('Publishing Options', 'dastgeer-seo-pro'); ?></h2>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_auto_post_status"><?php _e('Post Status', 'dastgeer-seo-pro'); ?></label>
                        <select id="dastgeer_seo_auto_post_status" name="dastgeer_seo_auto_post_status">
                            <option value="publish" <?php selected($publish_status, 'publish'); ?>><?php _e('Published', 'dastgeer-seo-pro'); ?></option>
                            <option value="draft" <?php selected($publish_status, 'draft'); ?>><?php _e('Draft', 'dastgeer-seo-pro'); ?></option>
                            <option value="pending" <?php selected($publish_status, 'pending'); ?>><?php _e('Pending Review', 'dastgeer-seo-pro'); ?></option>
                        </select>
                    </div>
                </div>
                
                <p class="submit">
                    <button type="submit" class="button button-primary button-hero">
                        <?php _e('Save All Changes', 'dastgeer-seo-pro'); ?>
                    </button>
                </p>
            </form>
        </div>
        <?php
    }
    
    public function render_advanced_page() {
        $ai_provider = get_option('dastgeer_seo_ai_provider', 'openai');
        $ai_api_key = get_option('dastgeer_seo_ai_api_key', '');
        ?>
        <div class="dastgeer-seo-admin">
            <div class="dastgeer-seo-header">
                <h1><?php _e('Advanced Settings', 'dastgeer-seo-pro'); ?></h1>
            </div>
            
            <form method="post" action="" id="dastgeer-seo-advanced-form">
                <div class="dastgeer-seo-card">
                    <h2><?php _e('AI Configuration', 'dastgeer-seo-pro'); ?></h2>
                    <p><?php _e('Configure AI settings for content generation and optimization.', 'dastgeer-seo-pro'); ?></p>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_ai_provider"><?php _e('AI Provider', 'dastgeer-seo-pro'); ?></label>
                        <select id="dastgeer_seo_ai_provider" name="dastgeer_seo_ai_provider">
                            <option value="openai" <?php selected($ai_provider, 'openai'); ?>><?php _e('OpenAI (GPT-3.5)', 'dastgeer-seo-pro'); ?></option>
                            <option value="gemini" <?php selected($ai_provider, 'gemini'); ?>><?php _e('Google Gemini', 'dastgeer-seo-pro'); ?></option>
                            <option value="groq" <?php selected($ai_provider, 'groq'); ?>><?php _e('Groq (Mixtral)', 'dastgeer-seo-pro'); ?></option>
                        </select>
                    </div>
                    
                    <div class="dastgeer-seo-field">
                        <label for="dastgeer_seo_ai_api_key"><?php _e('API Key', 'dastgeer-seo-pro'); ?></label>
                        <input type="password" id="dastgeer_seo_ai_api_key" name="dastgeer_seo_ai_api_key" value="<?php echo esc_attr($ai_api_key); ?>" autocomplete="off">
                        <p class="description"><?php _e('Your API key is stored securely and never shared.', 'dastgeer-seo-pro'); ?></p>
                    </div>
                </div>
                
                <div class="dastgeer-seo-card">
                    <h2><?php _e('API Key Setup Guides', 'dastgeer-seo-pro'); ?></h2>
                    <div class="setup-guides">
                        <div class="guide-item">
                            <h3><?php _e('OpenAI API Key', 'dastgeer-seo-pro'); ?></h3>
                            <ol>
                                <li><?php _e('Go to', 'dastgeer-seo-pro'); ?> <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a></li>
                                <li><?php _e('Create a new API key', 'dastgeer-seo-pro'); ?></li>
                                <li><?php _e('Copy and paste the key above', 'dastgeer-seo-pro'); ?></li>
                            </ol>
                        </div>
                        <div class="guide-item">
                            <h3><?php _e('Google Gemini API Key', 'dastgeer-seo-pro'); ?></h3>
                            <ol>
                                <li><?php _e('Go to', 'dastgeer-seo-pro'); ?> <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
                                <li><?php _e('Create a new API key', 'dastgeer-seo-pro'); ?></li>
                                <li><?php _e('Copy and paste the key above', 'dastgeer-seo-pro'); ?></li>
                            </ol>
                        </div>
                        <div class="guide-item">
                            <h3><?php _e('Groq API Key', 'dastgeer-seo-pro'); ?></h3>
                            <ol>
                                <li><?php _e('Go to', 'dastgeer-seo-pro'); ?> <a href="https://console.groq.com/keys" target="_blank">Groq Console</a></li>
                                <li><?php _e('Create a new API key', 'dastgeer-seo-pro'); ?></li>
                                <li><?php _e('Copy and paste the key above', 'dastgeer-seo-pro'); ?></li>
                            </ol>
                        </div>
                    </div>
                </div>
                
                <p class="submit">
                    <button type="submit" class="button button-primary button-hero">
                        <?php _e('Save All Changes', 'dastgeer-seo-pro'); ?>
                    </button>
                </p>
            </form>
        </div>
        <?php
    }
    
    public function render_import_export_page() {
        ?>
        <div class="dastgeer-seo-admin">
            <div class="dastgeer-seo-header">
                <h1><?php _e('Import / Export', 'dastgeer-seo-pro'); ?></h1>
            </div>
            
            <div class="dastgeer-seo-card">
                <h2><?php _e('Export Settings', 'dastgeer-seo-pro'); ?></h2>
                <p><?php _e('Download all your Dastgeer SEO Pro settings as a JSON file for backup or to transfer to another site.', 'dastgeer-seo-pro'); ?></p>
                <p><button type="button" id="export-settings" class="button button-primary">
                    <?php _e('Export Settings', 'dastgeer-seo-pro'); ?>
                </button></p>
            </div>
            
            <div class="dastgeer-seo-card">
                <h2><?php _e('Import Settings', 'dastgeer-seo-pro'); ?></h2>
                <p><?php _e('Import settings from a previously exported JSON file.', 'dastgeer-seo-pro'); ?></p>
                
                <form method="post" enctype="multipart/form-data" id="import-settings-form">
                    <input type="file" name="import_file" id="import_file" accept=".json">
                    <p class="description"><?php _e('Select a JSON file to import (max 2MB)', 'dastgeer-seo-pro'); ?></p>
                    <p><button type="submit" class="button button-primary">
                        <?php _e('Import Settings', 'dastgeer-seo-pro'); ?>
                    </button></p>
                </form>
            </div>
            
            <div class="dastgeer-seo-card">
                <h2><?php _e('Import from other SEO Plugins', 'dastgeer-seo-pro'); ?></h2>
                <p><?php _e('Import settings from other popular SEO plugins.', 'dastgeer-seo-pro'); ?></p>
                
                <div class="import-options">
                    <button type="button" class="button import-yoast" data-plugin="yoast">
                        <?php _e('Import from Yoast SEO', 'dastgeer-seo-pro'); ?>
                    </button>
                    <button type="button" class="button import-aioseo" data-plugin="aioseo">
                        <?php _e('Import from All in One SEO', 'dastgeer-seo-pro'); ?>
                    </button>
                    <button type="button" class="button import-rankmath" data-plugin="rankmath">
                        <?php _e('Import from Rank Math', 'dastgeer-seo-pro'); ?>
                    </button>
                </div>
            </div>
        </div>
        <?php
    }
}

function Dastgeer_SEO_Pro() {
    return Dastgeer_SEO_Pro::get_instance();
}

add_action('plugins_loaded', 'Dastgeer_SEO_Pro');

add_filter('mod_rewrite_rules', function($rules) {
    $sitemap_url = home_url('/wp-json/dastgeer-seo/v1/sitemap');
    return $rules;
});

class Dastgeer_SEO_WooCommerce {
    private $seo;
    
    public function __construct($seo) {
        $this->seo = $seo;
        $this->init_hooks();
    }
    
    private function init_hooks() {
        add_filter('dastgeer_seo_schema_markup', array($this, 'add_woocommerce_schema'), 10, 2);
        add_action('woocommerce_product_options_general', array($this, 'add_woocommerce_fields'));
        add_action('woocommerce_process_product_meta', array($this, 'save_woocommerce_fields'));
    }
    
    public function add_woocommerce_schema($schema, $post_id) {
        if (!class_exists('WooCommerce')) {
            return $schema;
        }
        
        $product = wc_get_product($post_id);
        if (!$product) {
            return $schema;
        }
        
        return $this->seo->get_woocommerce_schema($post_id);
    }
    
    public function add_woocommerce_fields() {
        global $post;
        
        echo '<div class="options_group">';
        
        woocommerce_wp_text_input(array(
            'id' => '_dastgeer_seo_video_url',
            'label' => __('SEO Video URL', 'dastgeer-seo-pro'),
            'desc_tip' => true,
            'description' => __('Enter a video URL for video sitemap.', 'dastgeer-seo-pro')
        ));
        
        woocommerce_wp_text_input(array(
            'id' => '_dastgeer_seo_video_duration',
            'label' => __('Video Duration (seconds)', 'dastgeer-seo-pro'),
            'desc_tip' => true,
            'description' => __('Enter video duration in seconds.', 'dastgeer-seo-pro'),
            'type' => 'number'
        ));
        
        woocommerce_wp_select(array(
            'id' => '_dastgeer_seo_schema_type',
            'label' => __('Schema Type', 'dastgeer-seo-pro'),
            'options' => array(
                'Product' => 'Product',
                'SoftwareApplication' => 'Software Application',
                'VideoObject' => 'Video Object'
            )
        ));
        
        echo '</div>';
    }
    
    public function save_woocommerce_fields($post_id) {
        if (isset($_POST['_dastgeer_seo_video_url'])) {
            update_post_meta($post_id, '_dastgeer_seo_video_url', sanitize_text_field($_POST['_dastgeer_seo_video_url']));
        }
        
        if (isset($_POST['_dastgeer_seo_video_duration'])) {
            update_post_meta($post_id, '_dastgeer_seo_video_duration', intval($_POST['_dastgeer_seo_video_duration']));
        }
        
        if (isset($_POST['_dastgeer_seo_schema_type'])) {
            update_post_meta($post_id, '_dastgeer_seo_schema_type', sanitize_text_field($_POST['_dastgeer_seo_schema_type']));
        }
    }
}

add_action('init', function() {
    if (class_exists('WooCommerce')) {
        $seo = Dastgeer_SEO_Pro::get_instance();
        new Dastgeer_SEO_WooCommerce($seo);
    }
}, 20);

function dastgeer_seo_log_404() {
    if (!is_404()) {
        return;
    }
    
    if (!get_option('dastgeer_seo_404_monitor_enabled', 1)) {
        return;
    }
    
    global $wpdb;
    $request_uri = $_SERVER['REQUEST_URI'] ?? '';
    $referrer = $_SERVER['HTTP_REFERER'] ?? '';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
    
    $existing = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT id, hit_count FROM {$wpdb->prefix}dastgeer_seo_404_log WHERE request_uri = %s",
            $request_uri
        )
    );
    
    if ($existing) {
        $wpdb->update(
            $wpdb->prefix . 'dastgeer_seo_404_log',
            array(
                'hit_count' => $existing->hit_count + 1,
                'last_visit' => current_time('mysql'),
                'referrer' => $referrer
            ),
            array('id' => $existing->id)
        );
    } else {
        $wpdb->insert(
            $wpdb->prefix . 'dastgeer_seo_404_log',
            array(
                'request_uri' => $request_uri,
                'referrer' => $referrer,
                'user_agent' => $user_agent,
                'ip_address' => $ip_address,
                'hit_count' => 1,
                'first_visit' => current_time('mysql'),
                'last_visit' => current_time('mysql')
            ),
            array('%s', '%s', '%s', '%s', '%d', '%s', '%s')
        );
    }
}
add_action('template_redirect', 'dastgeer_seo_log_404');
