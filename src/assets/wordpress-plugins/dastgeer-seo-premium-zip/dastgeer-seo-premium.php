<?php
/**
 * Plugin Name: Dastgeer SEO Premium
 * Plugin URI: https://dastgeertech.studio
 * Description: Complete WordPress SEO Solution - Advanced SEO analysis, Schema markup, Sitemaps, Social integration, AI optimization, 404 monitoring, Redirects & more. The ultimate SEO plugin for tech news sites.
 * Version: 2.0.0
 * Author: Dastgeer Tech Studio
 * Author URI: https://dastgeertech.studio
 * Text Domain: dastgeer-seo-premium
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * License: GPLv2 or later
 */

if (!defined('ABSPATH')) exit;

define('DSTSEO_VERSION', '2.0.0');

class Dastgeer_SEO_Premium {
    
    private $options;
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function __construct() {
        $this->options = get_option('dstseo_options', $this->get_default_options());
        
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('wp_head', array($this, 'output_seo_tags'), 1);
        add_action('template_redirect', array($this, 'handle_requests'), 1);
        add_filter('robots_txt', array($this, 'modify_robots_txt'), 100, 2);
        
        if (is_admin()) {
            add_action('add_meta_boxes', array($this, 'add_seo_meta_box'));
            add_action('save_post', array($this, 'save_seo_meta_box'), 10, 2);
            add_action('admin_bar_menu', array($this, 'add_admin_bar_menu'), 100);
            add_action('wp_ajax_dstseo_analyze', array($this, 'ajax_analyze'));
            add_action('wp_ajax_dstseo_save_redirect', array($this, 'ajax_save_redirect'));
            add_action('wp_ajax_dstseo_delete_redirect', array($this, 'ajax_delete_redirect'));
        }
    }
    
    private function get_default_options() {
        return array(
            'site_title' => get_bloginfo('name'),
            'homepage_title' => get_bloginfo('name') . ' - Tech News & Tutorials',
            'homepage_desc' => get_bloginfo('description'),
            'google_verification' => '',
            'bing_verification' => '',
            'og_enabled' => true,
            'og_image' => '',
            'twitter_card' => 'summary_large_image',
            'schema_org' => get_bloginfo('name'),
            'schema_logo' => '',
            'schema_type' => 'NewsMediaOrganization',
            'enable_sitemap' => true,
            'enable_news_sitemap' => true,
            'enable_404_log' => true,
        );
    }
    
    public function activate() {
        global $wpdb;
        
        $table_redirects = $wpdb->prefix . 'dstseo_redirects';
        $table_404 = $wpdb->prefix . 'dstseo_404_log';
        
        $charset = $wpdb->get_charset_collate();
        
        $sql1 = "CREATE TABLE IF NOT EXISTS $table_redirects (
            id BIGINT(20) NOT NULL AUTO_INCREMENT,
            old_url VARCHAR(2048) NOT NULL,
            new_url VARCHAR(2048) NOT NULL,
            status_code INT(3) DEFAULT 301,
            hits INT(11) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;";
        
        $sql2 = "CREATE TABLE IF NOT EXISTS $table_404 (
            id BIGINT(20) NOT NULL AUTO_INCREMENT,
            url VARCHAR(2048) NOT NULL,
            referer VARCHAR(2048),
            ip VARCHAR(45),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql1);
        dbDelta($sql2);
        
        if (!get_option('dstseo_options')) {
            add_option('dstseo_options', $this->get_default_options());
        }
        
        flush_rewrite_rules();
    }
    
    public function deactivate() {
        flush_rewrite_rules();
    }
    
    public function init() {
        load_plugin_textdomain('dastgeer-seo-premium', false, dirname(plugin_basename(__FILE__)) . '/languages');
        
        add_rewrite_rule('sitemap\.xml$', 'index.php?dstseo_sitemap=1', 'top');
        add_rewrite_rule('news-sitemap\.xml$', 'index.php?dstseo_sitemap=news', 'top');
        
        $this->check_redirects();
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'Dastgeer SEO',
            'SEO Premium',
            'manage_options',
            'dstseo',
            array($this, 'render_dashboard'),
            'dashicons-chart-line',
            80
        );
        
        add_submenu_page('dstseo', 'Dashboard', 'Dashboard', 'manage_options', 'dstseo', array($this, 'render_dashboard'));
        add_submenu_page('dstseo', 'Settings', 'Settings', 'manage_options', 'dstseo_settings', array($this, 'render_settings'));
        add_submenu_page('dstseo', 'Redirects', 'Redirects', 'manage_options', 'dstseo_redirects', array($this, 'render_redirects'));
        add_submenu_page('dstseo', '404 Log', '404 Log', 'manage_options', 'dstseo_404', array($this, 'render_404'));
    }
    
    public function enqueue_assets($hook) {
        if (strpos($hook, 'dstseo') === false && strpos($hook, 'post') === false && strpos($hook, 'page') === false) {
            return;
        }
        
        wp_enqueue_style('dstseo_admin', plugin_dir_url(__FILE__) . 'dstseo_admin.css', array(), DSTSEO_VERSION);
        wp_enqueue_script('dstseo_admin', plugin_dir_url(__FILE__) . 'dstseo_admin.js', array('jquery'), DSTSEO_VERSION, true);
        
        wp_localize_script('dstseo_admin', 'dstseo', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('dstseo_nonce'),
            'home_url' => home_url('/'),
        ));
    }
    
    public function add_seo_meta_box() {
        $types = get_post_types(array('public' => true));
        foreach ($types as $type) {
            add_meta_box('dstseo_metabox', 'Dastgeer SEO Premium', array($this, 'render_metabox'), $type, 'normal', 'high');
        }
    }
    
    public function render_metabox($post) {
        wp_nonce_field('dstseo_metabox', 'dstseo_nonce');
        
        $score = get_post_meta($post->ID, '_dstseo_score', true) ?: 0;
        $keyword = get_post_meta($post->ID, '_dstseo_keyword', true);
        $title = get_post_meta($post->ID, '_dstseo_title', true);
        $desc = get_post_meta($post->ID, '_dstseo_desc', true);
        $schema = get_post_meta($post->ID, '_dstseo_schema', true) ?: 'NewsArticle';
        $noindex = get_post_meta($post->ID, '_dstseo_noindex', true);
        ?>
        <div class="dstseo-metabox">
            <div class="dstseo-score-display">
                <div class="score-circle" style="--score: <?php echo $score; ?>%">
                    <span class="score-num"><?php echo $score; ?></span>
                    <span class="score-label">SEO Score</span>
                </div>
                <button type="button" class="button dstseo-analyze-btn" id="analyze_seo">
                    <span class="dashicons dashicons-yes-alt"></span> Analyze Content
                </button>
            </div>
            
            <div class="dstseo-checklist">
                <h4>SEO Checklist</h4>
                <ul id="seo_checklist">
                    <li class="pending"><span class="icon">○</span> SEO Title</li>
                    <li class="pending"><span class="icon">○</span> Meta Description</li>
                    <li class="pending"><span class="icon">○</span> Focus Keyword</li>
                    <li class="pending"><span class="icon">○</span> Content Length</li>
                    <li class="pending"><span class="icon">○</span> Images with Alt</li>
                    <li class="pending"><span class="icon">○</span> Internal Links</li>
                    <li class="pending"><span class="icon">○</span> External Links</li>
                </ul>
            </div>
            
            <p>
                <label for="dstseo_keyword"><strong>Focus Keyword:</strong></label>
                <input type="text" id="dstseo_keyword" name="dstseo_keyword" value="<?php echo esc_attr($keyword); ?>" class="widefat" placeholder="Enter focus keyword">
            </p>
            
            <p>
                <label for="dstseo_title"><strong>SEO Title:</strong></label>
                <input type="text" id="dstseo_title" name="dstseo_title" value="<?php echo esc_attr($title); ?>" class="widefat" maxlength="60" placeholder="<?php echo esc_attr(get_the_title($post->ID)); ?>">
                <span class="char-count"><span id="title_cnt">0</span>/60</span>
            </p>
            
            <p>
                <label for="dstseo_desc"><strong>Meta Description:</strong></label>
                <textarea id="dstseo_desc" name="dstseo_desc" rows="3" class="widefat" maxlength="160"><?php echo esc_textarea($desc); ?></textarea>
                <span class="char-count"><span id="desc_cnt">0</span>/160</span>
            </p>
            
            <p>
                <label for="dstseo_schema"><strong>Schema Type:</strong></label>
                <select id="dstseo_schema" name="dstseo_schema" class="widefat">
                    <option value="NewsArticle" <?php selected($schema, 'NewsArticle'); ?>>News Article</option>
                    <option value="Article" <?php selected($schema, 'Article'); ?>>Article</option>
                    <option value="BlogPosting" <?php selected($schema, 'BlogPosting'); ?>>Blog Post</option>
                    <option value="TechArticle" <?php selected($schema, 'TechArticle'); ?>>Tech Article</option>
                    <option value="FAQPage" <?php selected($schema, 'FAQPage'); ?>>FAQ Page</option>
                    <option value="HowTo" <?php selected($schema, 'HowTo'); ?>>How-To</option>
                    <option value="WebPage" <?php selected($schema, 'WebPage'); ?>>Web Page</option>
                </select>
            </p>
            
            <p>
                <label><input type="checkbox" name="dstseo_noindex" value="1" <?php checked($noindex, '1'); ?>> No Index (exclude from search)</label>
            </p>
            
            <div class="dstseo-preview">
                <h4>Google Preview</h4>
                <div class="google-result">
                    <div class="result-title"><?php echo esc_html($title ?: get_the_title($post->ID)); ?></div>
                    <div class="result-url"><?php echo esc_url(str_replace('https://', '', get_permalink($post->ID))); ?></div>
                    <div class="result-desc"><?php echo esc_html($desc ?: 'Add meta description...'); ?></div>
                </div>
            </div>
            
            <div class="dstseo-actions">
                <button type="button" class="button button-primary" id="generate_title">Generate Title</button>
                <button type="button" class="button button-primary" id="generate_desc">Generate Description</button>
                <button type="button" class="button button-primary" id="auto_optimize">Auto Optimize</button>
            </div>
        </div>
        
        <style>
        .dstseo-metabox{padding:10px 0;}
        .dstseo-score-display{display:flex;align-items:center;gap:20px;margin-bottom:15px;padding-bottom:15px;border-bottom:1px solid #ddd;}
        .score-circle{width:80px;height:80px;border-radius:50%;background:conic-gradient(#2271b1 var(--score),#ddd var(--score));display:flex;flex-direction:column;align-items:center;justify-content:center;}
        .score-circle::before{content:'';position:absolute;width:60px;height:60px;background:#fff;border-radius:50%;}
        .score-num{position:relative;font-size:24px;font-weight:700;z-index:1;}
        .score-label{position:relative;font-size:9px;color:#666;z-index:1;}
        .dstseo-checklist{background:#f8f9fa;padding:12px;border-radius:6px;margin-bottom:15px;}
        .dstseo-checklist h4{margin:0 0 10px;font-size:13px;}
        .dstseo-checklist ul{list-style:none;margin:0;padding:0;}
        .dstseo-checklist li{margin-bottom:6px;font-size:12px;display:flex;align-items:center;}
        .dstseo-checklist li .icon{margin-right:8px;width:18px;}
        .dstseo-checklist li.pass{color:#28a745;}
        .dstseo-checklist li.pass .icon{color:#28a745;}
        .dstseo-checklist li.fail{color:#dc3545;}
        .dstseo-checklist li.fail .icon{color:#dc3545;}
        .dstseo-checklist li.pending{color:#666;}
        .char-count{display:block;text-align:right;font-size:11px;color:#666;margin-top:3px;}
        #dstseo_keyword,#dstseo_title,#dstseo_desc,#dstseo_schema{width:100%;}
        .dstseo-preview{background:#fff;border:1px solid #ddd;padding:12px;border-radius:6px;margin:15px 0;}
        .dstseo-preview h4{margin:0 0 10px;font-size:13px;}
        .google-result{padding:8px;}
        .result-title{color:#1a0dab;font-size:18px;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .result-url{color:#006621;font-size:14px;margin-bottom:3px;}
        .result-desc{color:#545454;font-size:13px;line-height:1.4;}
        .dstseo-actions{display:flex;gap:8px;margin-top:15px;padding-top:15px;border-top:1px solid #ddd;}
        </style>
        
        <script>
        jQuery(document).ready(function($){
            var titleLen = $('#dstseo_title').val().length;
            var descLen = $('#dstseo_desc').val().length;
            $('#title_cnt').text(titleLen);
            $('#desc_cnt').text(descLen);
            
            $('#dstseo_title').on('input', function(){
                $('#title_cnt').text($(this).val().length);
                $('.result-title').text($(this).val() || '<?php echo esc_js(get_the_title($post->ID)); ?>');
            });
            
            $('#dstseo_desc').on('input', function(){
                $('#desc_cnt').text($(this).val().length);
                $('.result-desc').text($(this).val() || 'Add meta description...');
            });
            
            $('#analyze_seo').on('click', function(){
                var content = $('#content').val() || '';
                var title = $('#dstseo_title').val() || '';
                var desc = $('#dstseo_desc').val() || '';
                var keyword = $('#dstseo_keyword').val() || '';
                var words = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0);
                var score = 0;
                var checks = [];
                
                if (title.length >= 30 && title.length <= 60) { score += 15; checks[0] = true; }
                else if (title.length > 0) { score += 8; checks[0] = true; }
                
                if (desc.length >= 120 && desc.length <= 160) { score += 15; checks[1] = true; }
                else if (desc.length >= 80) { score += 10; checks[1] = true; }
                
                if (keyword.length > 0) { score += 10; checks[2] = true; }
                
                if (words.length >= 300) { score += 20; checks[3] = true; }
                else if (words.length >= 150) { score += 12; checks[3] = true; }
                
                var imgMatch = content.match(/<img[^>]*alt=["']([^"']+)["'][^>]*>/gi);
                var imgNoAlt = content.match(/<img(?![^>]*alt=)[^>]*>/gi);
                if ((imgMatch && imgMatch.length > 0) || !imgNoAlt) { score += 15; checks[4] = true; }
                
                var intLinks = content.match(/href=["']https?:\/\/[^"']*\/?["']|href=["']\/[^"']*["']/gi);
                if (intLinks && intLinks.length >= 2) { score += 15; checks[5] = true; }
                
                var extLinks = content.match(/href=["']https?:\/\/(?!<?php echo parse_url(home_url(), PHP_URL_HOST); ?>)[^"']+["']/gi);
                if (extLinks && extLinks.length >= 1) { score += 10; checks[6] = true; }
                
                score = Math.min(100, score);
                
                $('.score-circle').attr('style', '--score:' + score + '%');
                $('.score-num').text(score);
                
                $('#seo_checklist li').each(function(i){
                    if (checks[i]) {
                        $(this).removeClass('fail pending').addClass('pass').find('.icon').text('✓');
                    } else {
                        $(this).removeClass('pass pending').addClass('fail').find('.icon').text('✗');
                    }
                });
                
                $.ajax({
                    url: '<?php echo admin_url('admin-ajax.php'); ?>',
                    type: 'POST',
                    data: {
                        action: 'dstseo_analyze',
                        nonce: '<?php echo wp_create_nonce('dstseo_nonce'); ?>',
                        post_id: <?php echo $post->ID; ?>,
                        score: score
                    }
                });
            });
            
            $('#generate_title').on('click', function(){
                var postTitle = '<?php echo esc_js(get_the_title($post->ID)); ?>';
                var siteName = '<?php echo esc_js(get_bloginfo('name')); ?>';
                var newTitle = postTitle.substring(0, 50) + ' | ' + siteName;
                $('#dstseo_title').val(newTitle).trigger('input');
            });
            
            $('#generate_desc').on('click', function(){
                var content = $('#content').val() || '';
                var text = content.replace(/<[^>]*>/g, '').substring(0, 200);
                var sentences = text.match(/[^.!?]+[.!?]+/g);
                var desc = '';
                if (sentences) {
                    for (var i = 0; i < Math.min(2, sentences.length); i++) {
                        desc += sentences[i].trim() + ' ';
                        if (desc.length >= 120) break;
                    }
                }
                $('#dstseo_desc').val(desc.trim().substring(0, 160)).trigger('input');
            });
            
            $('#auto_optimize').on('click', function(){
                $('#generate_title').click();
                $('#generate_desc').click();
                setTimeout(function(){ $('#analyze_seo').click(); }, 500);
            });
        });
        </script>
        <?php
    }
    
    public function save_seo_meta_box($post_id, $post) {
        if (!isset($_POST['dstseo_nonce']) || !wp_verify_nonce($_POST['dstseo_nonce'], 'dstseo_metabox')) return;
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
        if (!current_user_can('edit_post', $post_id)) return;
        
        $fields = array('dstseo_keyword', 'dstseo_title', 'dstseo_desc', 'dstseo_schema');
        foreach ($fields as $field) {
            if (isset($_POST[$field])) {
                update_post_meta($post_id, '_' . $field, sanitize_text_field($_POST[$field]));
            }
        }
        
        if (isset($_POST['dstseo_noindex'])) {
            update_post_meta($post_id, '_dstseo_noindex', '1');
        } else {
            delete_post_meta($post_id, '_dstseo_noindex');
        }
    }
    
    public function output_seo_tags() {
        global $post;
        
        if (!is_singular() || !$post) return;
        
        $title = get_post_meta($post->ID, '_dstseo_title', true) ?: get_the_title($post->ID) . ' | ' . get_bloginfo('name');
        $desc = get_post_meta($post->ID, '_dstseo_desc', true) ?: get_the_excerpt($post->ID);
        $schema_type = get_post_meta($post->ID, '_dstseo_schema', true) ?: 'NewsArticle';
        $noindex = get_post_meta($post->ID, '_dstseo_noindex', true);
        
        echo '<title>' . esc_html($title) . '</title>' . "\n";
        echo '<meta name="description" content="' . esc_attr(wp_strip_all_tags($desc)) . '" />' . "\n";
        
        if ($noindex === '1') {
            echo '<meta name="robots" content="noindex, nofollow" />' . "\n";
        }
        
        $opts = $this->options;
        
        echo '<meta property="og:type" content="article" />' . "\n";
        echo '<meta property="og:title" content="' . esc_attr($title) . '" />' . "\n";
        echo '<meta property="og:description" content="' . esc_attr(wp_strip_all_tags($desc)) . '" />' . "\n";
        echo '<meta property="og:url" content="' . esc_url(get_permalink($post->ID)) . '" />' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr(get_bloginfo('name')) . '" />' . "\n";
        
        if (has_post_thumbnail($post->ID)) {
            $img = wp_get_attachment_image_src(get_post_thumbnail_id($post->ID), 'large');
            if ($img) echo '<meta property="og:image" content="' . esc_url($img[0]) . '" />' . "\n";
        } elseif (!empty($opts['og_image'])) {
            echo '<meta property="og:image" content="' . esc_url($opts['og_image']) . '" />' . "\n";
        }
        
        $twitter_card = !empty($opts['twitter_card']) ? $opts['twitter_card'] : 'summary_large_image';
        echo '<meta name="twitter:card" content="' . esc_attr($twitter_card) . '" />' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '" />' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr(wp_strip_all_tags($desc)) . '" />' . "\n";
        
        if (!empty($opts['google_verification'])) {
            echo '<meta name="google-site-verification" content="' . esc_attr($opts['google_verification']) . '" />' . "\n";
        }
        
        $schema = array(
            '@context' => 'https://schema.org',
            '@type' => $schema_type,
            'headline' => get_the_title($post->ID),
            'url' => get_permalink($post->ID),
            'datePublished' => get_the_date('c', $post->ID),
            'dateModified' => get_the_modified_date('c', $post->ID),
            'author' => array('@type' => 'Person', 'name' => get_the_author_meta('display_name', $post->post_author)),
            'publisher' => array(
                '@type' => !empty($opts['schema_type']) ? $opts['schema_type'] : 'Organization',
                'name' => !empty($opts['schema_org']) ? $opts['schema_org'] : get_bloginfo('name'),
                'url' => home_url('/'),
            ),
        );
        
        if (has_excerpt($post->ID)) {
            $schema['description'] = get_the_excerpt($post->ID);
        }
        
        if (has_post_thumbnail($post->ID)) {
            $img = wp_get_attachment_image_src(get_post_thumbnail_id($post->ID), 'full');
            if ($img) {
                $schema['image'] = array('@type' => 'ImageObject', 'url' => $img[0]);
            }
        }
        
        echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
    }
    
    public function modify_robots_txt($output, $public) {
        if ($public !== '1') return $output;
        
        $output .= "\n\n# Sitemaps\n";
        $output .= "Sitemap: " . home_url('/sitemap.xml') . "\n";
        $output .= "Sitemap: " . home_url('/news-sitemap.xml') . "\n";
        
        return $output;
    }
    
    public function handle_requests() {
        global $wpdb;
        
        if (get_query_var('dstseo_sitemap')) {
            $type = get_query_var('dstseo_sitemap');
            if ($type === '1' || $type === 'main') {
                $this->render_sitemap();
            } elseif ($type === 'news') {
                $this->render_news_sitemap();
            }
            exit;
        }
        
        if (is_404() && !empty($this->options['enable_404_log'])) {
            $table = $wpdb->prefix . 'dstseo_404_log';
            $wpdb->insert($table, array(
                'url' => $_SERVER['REQUEST_URI'],
                'referer' => isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
            ));
        }
        
        $this->check_redirects();
    }
    
    private function check_redirects() {
        global $wpdb;
        $table = $wpdb->prefix . 'dstseo_redirects';
        $uri = $_SERVER['REQUEST_URI'];
        $uri = strtok($uri, '?');
        
        $redirect = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE old_url = %s LIMIT 1", $uri));
        
        if ($redirect) {
            $wpdb->query($wpdb->prepare("UPDATE $table SET hits = hits + 1 WHERE id = %d", $redirect->id));
            wp_redirect($redirect->new_url, $redirect->status_code);
            exit;
        }
    }
    
    private function render_sitemap() {
        header('Content-Type: application/xml; charset=utf-8');
        
        $posts = get_posts(array('post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 1000));
        
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        
        $xml .= '<url><loc>' . home_url('/') . '</loc><changefreq>daily</changefreq><priority>1.0</priority></url>' . "\n";
        
        foreach ($posts as $p) {
            $xml .= '<url>' . "\n";
            $xml .= '<loc>' . get_permalink($p->ID) . '</loc>' . "\n";
            $xml .= '<lastmod>' . date('Y-m-d', strtotime($p->post_modified)) . '</lastmod>' . "\n";
            $xml .= '<changefreq>weekly</changefreq><priority>0.8</priority>' . "\n";
            $xml .= '</url>' . "\n";
        }
        
        $categories = get_categories(array('hide_empty' => true));
        foreach ($categories as $cat) {
            $xml .= '<url><loc>' . get_category_link($cat->term_id) . '</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>' . "\n";
        }
        
        $xml .= '</urlset>';
        echo $xml;
    }
    
    private function render_news_sitemap() {
        header('Content-Type: application/xml; charset=utf-8');
        
        $posts = get_posts(array(
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => 1000,
            'date_query' => array('after' => '2 days ago'),
        ));
        
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">' . "\n";
        
        foreach ($posts as $p) {
            $xml .= '<url>' . "\n";
            $xml .= '<loc>' . get_permalink($p->ID) . '</loc>' . "\n";
            $xml .= '<news:news><news:publication>' . "\n";
            $xml .= '<news:name>' . esc_html(get_bloginfo('name')) . '</news:name>' . "\n";
            $xml .= '<news:language>' . esc_html(get_bloginfo('language')) . '</news:language>' . "\n";
            $xml .= '</news:publication>' . "\n";
            $xml .= '<news:publication_date>' . date('Y-m-d', strtotime($p->post_date)) . '</news:publication_date>' . "\n";
            $xml .= '<news:title>' . esc_html(get_the_title($p->ID)) . '</news:title>' . "\n";
            $xml .= '</news:news></url>' . "\n";
        }
        
        $xml .= '</urlset>';
        echo $xml;
    }
    
    public function ajax_analyze() {
        check_ajax_referer('dstseo_nonce', 'nonce');
        
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        $score = isset($_POST['score']) ? intval($_POST['score']) : 0;
        
        if ($post_id > 0) {
            update_post_meta($post_id, '_dstseo_score', $score);
        }
        
        wp_send_json_success(array('score' => $score));
    }
    
    public function ajax_save_redirect() {
        check_ajax_referer('dstseo_nonce', 'nonce');
        
        global $wpdb;
        $table = $wpdb->prefix . 'dstseo_redirects';
        
        $old = isset($_POST['old_url']) ? sanitize_text_field($_POST['old_url']) : '';
        $new = isset($_POST['new_url']) ? sanitize_text_field($_POST['new_url']) : '';
        $code = isset($_POST['status_code']) ? intval($_POST['status_code']) : 301;
        
        if (empty($old) || empty($new)) {
            wp_send_json_error(array('message' => 'URLs required'));
        }
        
        $result = $wpdb->insert($table, array(
            'old_url' => $old,
            'new_url' => $new,
            'status_code' => $code,
        ));
        
        if ($result) {
            wp_send_json_success(array('message' => 'Redirect created'));
        } else {
            wp_send_json_error(array('message' => 'Failed'));
        }
    }
    
    public function ajax_delete_redirect() {
        check_ajax_referer('dstseo_nonce', 'nonce');
        
        global $wpdb;
        $table = $wpdb->prefix . 'dstseo_redirects';
        
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        
        if ($id > 0) {
            $wpdb->delete($table, array('id' => $id));
            wp_send_json_success();
        } else {
            wp_send_json_error();
        }
    }
    
    public function add_admin_bar_menu($wp_admin_bar) {
        if (!is_admin_bar_showing() || !current_user_can('manage_options')) return;
        
        $score = 0;
        if (is_singular()) {
            global $post;
            $score = get_post_meta($post->ID, '_dstseo_score', true) ?: 0;
        }
        
        $color = $score >= 80 ? '#1e7e34' : ($score >= 60 ? '#f0ad4e' : '#dc3545');
        
        $wp_admin_bar->add_node(array(
            'id' => 'dstseo_score',
            'title' => '<span style="background:' . $color . ';color:#fff;padding:2px 8px;border-radius:3px;margin-right:5px;">' . $score . '</span> SEO',
            'href' => admin_url('admin.php?page=dstseo'),
        ));
    }
    
    public function render_dashboard() {
        global $wpdb;
        
        $total_posts = wp_count_posts('post')->publish;
        $redirects = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}dstseo_redirects");
        $today_404 = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}dstseo_404_log WHERE DATE(created_at) = CURDATE()");
        
        ?>
        <div class="wrap dstseo-admin">
            <h1>Dastgeer SEO Premium</h1>
            
            <div class="dstseo-cards">
                <div class="dstseo-card">
                    <span class="dashicons dashicons-admin-post"></span>
                    <h3><?php echo number_format($total_posts); ?></h3>
                    <p>Published Posts</p>
                </div>
                <div class="dstseo-card">
                    <span class="dashicons dashicons-redo"></span>
                    <h3><?php echo number_format($redirects); ?></h3>
                    <p>Redirects</p>
                </div>
                <div class="dstseo-card">
                    <span class="dashicons dashicons-dismiss"></span>
                    <h3><?php echo number_format($today_404); ?></h3>
                    <p>404 Today</p>
                </div>
            </div>
            
            <div class="dstseo-panels">
                <div class="dstseo-panel">
                    <h2>Quick Links</h2>
                    <a href="<?php echo admin_url('admin.php?page=dstseo_settings'); ?>" class="button">Settings</a>
                    <a href="<?php echo admin_url('admin.php?page=dstseo_redirects'); ?>" class="button">Redirects</a>
                    <a href="<?php echo admin_url('admin.php?page=dstseo_404'); ?>" class="button">404 Log</a>
                    <a href="<?php echo home_url('/sitemap.xml'); ?>" target="_blank" class="button">Sitemap</a>
                    <a href="<?php echo home_url('/news-sitemap.xml'); ?>" target="_blank" class="button">News Sitemap</a>
                </div>
                
                <div class="dstseo-panel">
                    <h2>Your Sitemaps</h2>
                    <p><strong>Main:</strong> <a href="<?php echo home_url('/sitemap.xml'); ?>" target="_blank"><?php echo home_url('/sitemap.xml'); ?></a></p>
                    <p><strong>News:</strong> <a href="<?php echo home_url('/news-sitemap.xml'); ?>" target="_blank"><?php echo home_url('/news-sitemap.xml'); ?></a></p>
                    <p>Submit these to <a href="https://search.google.com/search-console" target="_blank">Google Search Console</a></p>
                </div>
            </div>
        </div>
        
        <style>
        .dstseo-admin{padding:20px;max-width:1200px;}
        .dstseo-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:20px 0;}
        .dstseo-card{background:#fff;border-radius:8px;padding:20px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.1);}
        .dstseo-card .dashicons{font-size:32px;width:32px;height:32px;color:#2271b1;}
        .dstseo-card h3{font-size:32px;margin:10px 0;}
        .dstseo-card p{margin:0;color:#666;}
        .dstseo-panels{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;}
        .dstseo-panel{background:#fff;border-radius:8px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.1);}
        .dstseo-panel h2{margin-top:0;font-size:18px;}
        .dstseo-panel .button{margin:5px 5px 5px 0;}
        </style>
        <?php
    }
    
    public function render_settings() {
        $opts = $this->options;
        
        if (isset($_POST['dstseo_save']) && wp_verify_nonce($_POST['_wpnonce'], 'dstseo_settings')) {
            $opts = array(
                'site_title' => sanitize_text_field($_POST['site_title']),
                'homepage_title' => sanitize_text_field($_POST['homepage_title']),
                'homepage_desc' => sanitize_textarea_field($_POST['homepage_desc']),
                'google_verification' => sanitize_text_field($_POST['google_verification']),
                'bing_verification' => sanitize_text_field($_POST['bing_verification']),
                'og_enabled' => isset($_POST['og_enabled']),
                'og_image' => esc_url_raw($_POST['og_image']),
                'twitter_card' => sanitize_text_field($_POST['twitter_card']),
                'schema_org' => sanitize_text_field($_POST['schema_org']),
                'schema_logo' => esc_url_raw($_POST['schema_logo']),
                'schema_type' => sanitize_text_field($_POST['schema_type']),
                'enable_sitemap' => isset($_POST['enable_sitemap']),
                'enable_news_sitemap' => isset($_POST['enable_news_sitemap']),
                'enable_404_log' => isset($_POST['enable_404_log']),
            );
            update_option('dstseo_options', $opts);
            echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
        }
        
        ?>
        <div class="wrap">
            <h1>SEO Settings</h1>
            
            <form method="post">
                <?php wp_nonce_field('dstseo_settings'); ?>
                
                <table class="form-table">
                    <tr>
                        <th>Site Title</th>
                        <td><input type="text" name="site_title" value="<?php echo esc_attr($opts['site_title']); ?>" class="regular-text"></td>
                    </tr>
                    <tr>
                        <th>Homepage Title</th>
                        <td><input type="text" name="homepage_title" value="<?php echo esc_attr($opts['homepage_title']); ?>" class="regular-text"></td>
                    </tr>
                    <tr>
                        <th>Homepage Description</th>
                        <td><textarea name="homepage_desc" rows="3" class="regular-text"><?php echo esc_textarea($opts['homepage_desc']); ?></textarea></td>
                    </tr>
                </table>
                
                <h2>Verification</h2>
                <table class="form-table">
                    <tr>
                        <th>Google Verification</th>
                        <td><input type="text" name="google_verification" value="<?php echo esc_attr($opts['google_verification']); ?>" class="regular-text" placeholder="Google site verification code"></td>
                    </tr>
                    <tr>
                        <th>Bing Verification</th>
                        <td><input type="text" name="bing_verification" value="<?php echo esc_attr($opts['bing_verification']); ?>" class="regular-text" placeholder="Bing site verification code"></td>
                    </tr>
                </table>
                
                <h2>Social Media</h2>
                <table class="form-table">
                    <tr>
                        <th>Enable Open Graph</th>
                        <td><label><input type="checkbox" name="og_enabled" value="1" <?php checked($opts['og_enabled'], true); ?>> Enable OG tags</label></td>
                    </tr>
                    <tr>
                        <th>Default OG Image</th>
                        <td><input type="url" name="og_image" value="<?php echo esc_url($opts['og_image']); ?>" class="regular-text"></td>
                    </tr>
                    <tr>
                        <th>Twitter Card</th>
                        <td>
                            <select name="twitter_card">
                                <option value="summary" <?php selected($opts['twitter_card'], 'summary'); ?>>Summary</option>
                                <option value="summary_large_image" <?php selected($opts['twitter_card'], 'summary_large_image'); ?>>Summary Large Image</option>
                            </select>
                        </td>
                    </tr>
                </table>
                
                <h2>Schema</h2>
                <table class="form-table">
                    <tr>
                        <th>Organization Name</th>
                        <td><input type="text" name="schema_org" value="<?php echo esc_attr($opts['schema_org']); ?>" class="regular-text"></td>
                    </tr>
                    <tr>
                        <th>Organization Logo</th>
                        <td><input type="url" name="schema_logo" value="<?php echo esc_url($opts['schema_logo']); ?>" class="regular-text"></td>
                    </tr>
                    <tr>
                        <th>Organization Type</th>
                        <td>
                            <select name="schema_type">
                                <option value="Organization" <?php selected($opts['schema_type'], 'Organization'); ?>>Organization</option>
                                <option value="NewsMediaOrganization" <?php selected($opts['schema_type'], 'NewsMediaOrganization'); ?>>News Media</option>
                                <option value="TechOrganization" <?php selected($opts['schema_type'], 'TechOrganization'); ?>>Tech Organization</option>
                                <option value="Corporation" <?php selected($opts['schema_type'], 'Corporation'); ?>>Corporation</option>
                            </select>
                        </td>
                    </tr>
                </table>
                
                <h2>Sitemaps & 404</h2>
                <table class="form-table">
                    <tr>
                        <th>Enable Sitemap</th>
                        <td><label><input type="checkbox" name="enable_sitemap" value="1" <?php checked($opts['enable_sitemap'], true); ?>> Enable sitemap</label></td>
                    </tr>
                    <tr>
                        <th>Enable News Sitemap</th>
                        <td><label><input type="checkbox" name="enable_news_sitemap" value="1" <?php checked($opts['enable_news_sitemap'], true); ?>> Enable news sitemap</label></td>
                    </tr>
                    <tr>
                        <th>Log 404 Errors</th>
                        <td><label><input type="checkbox" name="enable_404_log" value="1" <?php checked($opts['enable_404_log'], true); ?>> Log 404 errors</label></td>
                    </tr>
                </table>
                
                <p class="submit">
                    <input type="submit" name="dstseo_save" class="button button-primary" value="Save Settings">
                </p>
            </form>
        </div>
        <?php
    }
    
    public function render_redirects() {
        global $wpdb;
        $table = $wpdb->prefix . 'dstseo_redirects';
        
        if (isset($_POST['dstseo_add_redirect']) && wp_verify_nonce($_POST['_wpnonce'], 'dstseo_redirects')) {
            $wpdb->insert($table, array(
                'old_url' => sanitize_text_field($_POST['old_url']),
                'new_url' => sanitize_text_field($_POST['new_url']),
                'status_code' => intval($_POST['status_code']),
            ));
            echo '<div class="notice notice-success"><p>Redirect added!</p></div>';
        }
        
        $redirects = $wpdb->get_results("SELECT * FROM $table ORDER BY created_at DESC");
        ?>
        <div class="wrap">
            <h1>Redirects</h1>
            
            <div class="dstseo-panel">
                <h2>Add Redirect</h2>
                <form method="post">
                    <?php wp_nonce_field('dstseo_redirects'); ?>
                    <table class="form-table">
                        <tr>
                            <th>Old URL</th>
                            <td><input type="text" name="old_url" class="large-text" placeholder="/old-page"></td>
                        </tr>
                        <tr>
                            <th>New URL</th>
                            <td><input type="text" name="new_url" class="large-text" placeholder="https://example.com/new-page"></td>
                        </tr>
                        <tr>
                            <th>Type</th>
                            <td>
                                <select name="status_code">
                                    <option value="301">301 - Permanent</option>
                                    <option value="302">302 - Temporary</option>
                                </select>
                            </td>
                        </tr>
                    </table>
                    <p class="submit">
                        <input type="submit" name="dstseo_add_redirect" class="button button-primary" value="Add Redirect">
                    </p>
                </form>
            </div>
            
            <h2>Active Redirects</h2>
            <table class="wp-list-table widefat striped">
                <thead>
                    <tr>
                        <th>Old URL</th>
                        <th>New URL</th>
                        <th>Type</th>
                        <th>Hits</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($redirects)): ?>
                        <tr><td colspan="5">No redirects created yet.</td></tr>
                    <?php else: ?>
                        <?php foreach ($redirects as $r): ?>
                            <tr>
                                <td><code><?php echo esc_html($r->old_url); ?></code></td>
                                <td><?php echo esc_html($r->new_url); ?></td>
                                <td><?php echo $r->status_code; ?></td>
                                <td><?php echo number_format($r->hits); ?></td>
                                <td>
                                    <button class="button button-small dstseo-delete" data-id="<?php echo $r->id; ?>">Delete</button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
        
        <script>
        jQuery(document).ready(function($){
            $('.dstseo-delete').on('click', function(){
                if (!confirm('Delete this redirect?')) return;
                var id = $(this).data('id');
                $.post('<?php echo admin_url('admin-ajax.php'); ?>', {
                    action: 'dstseo_delete_redirect',
                    nonce: '<?php echo wp_create_nonce('dstseo_nonce'); ?>',
                    id: id
                }, function(){
                    location.reload();
                });
            });
        });
        </script>
        
        <style>
        .dstseo-panel{background:#fff;padding:20px;border-radius:8px;margin-bottom:20px;}
        .dstseo-panel h2{margin-top:0;}
        </style>
        <?php
    }
    
    public function render_404() {
        global $wpdb;
        $table = $wpdb->prefix . 'dstseo_404_log';
        
        $errors = $wpdb->get_results("SELECT url, COUNT(*) as cnt, MAX(created_at) as last FROM $table GROUP BY url ORDER BY last DESC LIMIT 100");
        ?>
        <div class="wrap">
            <h1>404 Error Log</h1>
            
            <?php if (empty($errors)): ?>
                <p>No 404 errors logged.</p>
            <?php else: ?>
                <table class="wp-list-table widefat striped">
                    <thead>
                        <tr>
                            <th>URL</th>
                            <th>Hits</th>
                            <th>Last Seen</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($errors as $e): ?>
                            <tr>
                                <td><code><?php echo esc_html($e->url); ?></code></td>
                                <td><?php echo number_format($e->cnt); ?></td>
                                <td><?php echo human_time_diff(strtotime($e->last)) . ' ago'; ?></td>
                                <td>
                                    <button class="button button-small dstseo-create-redirect" data-url="<?php echo esc_attr($e->url); ?>">Create Redirect</button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        
        <script>
        jQuery(document).ready(function($){
            $('.dstseo-create-redirect').on('click', function(){
                var url = $(this).data('url');
                var newUrl = prompt('Enter redirect URL:', '<?php echo home_url('/'); ?>');
                if (!newUrl) return;
                
                $.post('<?php echo admin_url('admin-ajax.php'); ?>', {
                    action: 'dstseo_save_redirect',
                    nonce: '<?php echo wp_create_nonce('dstseo_nonce'); ?>',
                    old_url: url,
                    new_url: newUrl,
                    status_code: 301
                }, function(){
                    alert('Redirect created!');
                    location.reload();
                });
            });
        });
        </script>
        <?php
    }
}

function Dastgeer_SEO_Premium() {
    return Dastgeer_SEO_Premium::get_instance();
}

Dastgeer_SEO_Premium();
