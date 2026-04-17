<?php
/**
 * Plugin Name: Dastgeer Tech Booster
 * Plugin URI: https://dastgeertech.studio
 * Description: Beautiful website booster with social sharing, view tracking, SEO enhancements, reading features, and engagement tools
 * Version: 1.0.0
 * Author: Dastgeer Tech
 * Author URI: https://dastgeertech.studio
 */

if (!defined('ABSPATH')) exit;

define('DTB_VERSION', '1.0.0');

class Dastgeer_Tech_Booster {
    
    private $defaults = array(
        'dtb_view_count' => '1',
        'dtb_share_buttons' => '1',
        'dtb_floating_share' => '1',
        'dtb_scroll_top' => '1',
        'dtb_reading_time' => '1',
        'dtb_freshness_badge' => '1',
        'dtb_social_floating' => '1',
        'dtb_whatsapp_share' => '1',
        'dtb_print_button' => '1',
        'dtb_comment_count' => '1',
        'dtb_author_bio' => '0',
        'dtb_table_of_contents' => '0',
        'dtb_progress_bar' => '0',
        'dtb_newsletter_popup' => '0',
        'dtb_schema_markup' => '1',
        'dtb_twitter_card' => '@dastgeertech',
        'dtb_fb_app_id' => ''
    );
    
    public function __construct() {
        register_activation_hook(__FILE__, array($this, 'activate'));
        add_action('admin_menu', array($this, 'admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('wp_head', array($this, 'head_features'), 1);
        add_filter('the_content', array($this, 'content_features'), 15);
        add_action('wp_footer', array($this, 'footer_features'));
    }
    
    public function activate() {
        foreach ($this->defaults as $key => $val) {
            if (get_option($key) === false) add_option($key, $val);
        }
    }
    
    public function admin_menu() {
        add_menu_page('Tech Booster', 'Tech Booster', 'manage_options', 'dastgeer-booster', array($this, 'admin_page'), 'dashicons-superhero', 99);
    }
    
    public function register_settings() {
        foreach ($this->defaults as $key => $val) {
            register_setting('dtb_settings', $key);
        }
    }
    
    public function get_opt($key) {
        return get_option($key, $this->defaults[$key]);
    }
    
    public function admin_page() {
        ?>
        <div class="wrap dtb-admin">
            <div class="dtb-header">
                <h1>🚀 Dastgeer Tech Booster</h1>
                <p>Supercharge your website with powerful features</p>
            </div>
            
            <form method="post" action="options.php">
                <?php settings_fields('dtb_settings'); ?>
                
                <div class="dtb-grid">
                    <div class="dtb-card dtb-card-primary">
                        <h2>📊 Engagement</h2>
                        <label class="dtb-toggle">
                            <input type="checkbox" name="dtb_view_count" value="1" <?php checked($this->get_opt('dtb_view_count'), '1'); ?>>
                            <span>View Count</span>
                        </label>
                        <label class="dtb-toggle">
                            <input type="checkbox" name="dtb_comment_count" value="1" <?php checked($this->get_opt('dtb_comment_count'), '1'); ?>>
                            <span>Comment Count</span>
                        </label>
                        <label class="dtb-toggle">
                            <input type="checkbox" name="dtb_reading_time" value="1" <?php checked($this->get_opt('dtb_reading_time'), '1'); ?>>
                            <span>Reading Time</span>
                        </label>
                        <label class="dtb-toggle">
                            <input type="checkbox" name="dtb_freshness_badge" value="1" <?php checked($this->get_opt('dtb_freshness_badge'), '1'); ?>>
                            <span>Freshness Badge</span>
                        </label>
                        <label class="dtb-toggle">
                            <input type="checkbox" name="dtb_author_bio" value="1" <?php checked($this->get_opt('dtb_author_bio'), '1'); ?>>
                            <span>Author Bio Box</span>
                        </label>
                    </div>
                    
                    <div class="dtb-card dtb-card-primary">
                        <h2>📤 Sharing</h2>
                        <label class="dtb-toggle">
                            <input type="checkbox" name="dtb_share_buttons" value="1" <?php checked($this->get_opt('dtb_share_buttons'), '1'); ?>>
                            <span>Share Buttons</span>
                        </label>
                        <label class="dtb-toggle">
                            <input type="checkbox" name="dtb_floating_share" value="1" <?php checked($this->get_opt('dtb_floating_share'), '1'); ?>>
                            <span>Floating Share</span>
                        </label>
                        <label class="dtb-toggle">
                            <input type="checkbox" name="dtb_whatsapp_share" value="1" <?php checked($this->get_opt('dtb_whatsapp_share'), '1'); ?>>
                            <span>WhatsApp Share</span>
                        </label>
                        <label class="dtb-toggle">
                            <input type="checkbox" name="dtb_print_button" value="1" <?php checked($this->get_opt('dtb_print_button'), '1'); ?>>
                            <span>Print Button</span>
                        </label>
                    </div>
                    
                    <div class="dtb-card dtb-card-primary">
                        <h2>🎨 UI Features</h2>
                        <label class="dtb-toggle">
                            <input type="checkbox" name="dtb_scroll_top" value="1" <?php checked($this->get_opt('dtb_scroll_top'), '1'); ?>>
                            <span>Scroll to Top</span>
                        </label>
                        <label class="dtb-toggle">
                            <input type="checkbox" name="dtb_progress_bar" value="1" <?php checked($this->get_opt('dtb_progress_bar'), '1'); ?>>
                            <span>Reading Progress Bar</span>
                        </label>
                        <label class="dtb-toggle">
                            <input type="checkbox" name="dtb_table_of_contents" value="1" <?php checked($this->get_opt('dtb_table_of_contents'), '1'); ?>>
                            <span>Table of Contents</span>
                        </label>
                        <label class="dtb-toggle">
                            <input type="checkbox" name="dtb_newsletter_popup" value="1" <?php checked($this->get_opt('dtb_newsletter_popup'), '1'); ?>>
                            <span>Newsletter Popup</span>
                        </label>
                    </div>
                    
                    <div class="dtb-card dtb-card-primary">
                        <h2>🔍 SEO</h2>
                        <label class="dtb-toggle">
                            <input type="checkbox" name="dtb_schema_markup" value="1" <?php checked($this->get_opt('dtb_schema_markup'), '1'); ?>>
                            <span>JSON-LD Schema</span>
                        </label>
                        <div class="dtb-field">
                            <label>Twitter @username</label>
                            <input type="text" name="dtb_twitter_card" value="<?php echo esc_attr($this->get_opt('dtb_twitter_card')); ?>" placeholder="@username">
                        </div>
                        <div class="dtb-field">
                            <label>Facebook App ID</label>
                            <input type="text" name="dtb_fb_app_id" value="<?php echo esc_attr($this->get_opt('dtb_fb_app_id')); ?>" placeholder="123456789">
                        </div>
                    </div>
                </div>
                
                <p class="dtb-submit">
                    <button type="submit" class="button button-primary button-large">Save All Settings</button>
                </p>
            </form>
        </div>
        
        <style>
            .dtb-admin { max-width: 1200px; margin: 20px 20px 0 0; font-family: -apple-system, sans-serif; }
            .dtb-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
            .dtb-header h1 { margin: 0; font-size: 28px; }
            .dtb-header p { margin: 5px 0 0 0; opacity: 0.9; }
            .dtb-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
            .dtb-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .dtb-card h2 { margin: 0 0 20px 0; font-size: 18px; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
            .dtb-card-primary { border-left: 4px solid #667eea; }
            .dtb-toggle { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
            .dtb-toggle:last-child { border-bottom: none; }
            .dtb-toggle input { margin-right: 12px; width: 20px; height: 20px; }
            .dtb-toggle span { font-size: 14px; }
            .dtb-field { margin: 15px 0; }
            .dtb-field label { display: block; font-size: 13px; margin-bottom: 5px; color: #666; }
            .dtb-field input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
            .dtb-submit { margin-top: 30px; }
            .button-large { padding: 12px 30px !important; font-size: 16px !important; }
        </style>
        <?php
    }
    
    public function head_features() {
        if (!is_single()) return;
        
        $post_id = get_the_ID();
        
        // View tracking
        if ($this->get_opt('dtb_view_count') === '1') {
            $views = get_post_meta($post_id, 'dtb_views', true) ?: 0;
            update_post_meta($post_id, 'dtb_views', $views + 1);
        }
        
        // JSON-LD Schema
        if ($this->get_opt('dtb_schema_markup') === '1') {
            $schema = array(
                '@context' => 'https://schema.org',
                '@type' => 'Article',
                'headline' => get_the_title(),
                'image' => get_the_post_thumbnail_url($post_id, 'full'),
                'datePublished' => get_the_date('c'),
                'author' => array('@type' => 'Person', 'name' => get_the_author())
            );
            echo '<script type="application/ld+json">' . json_encode($schema) . '</script>' . "\n";
        }
        
        // Twitter Card
        $twitter_user = $this->get_opt('dtb_twitter_card');
        if ($twitter_user) {
            echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
            echo '<meta name="twitter:site" content="' . esc_attr($twitter_user) . '">' . "\n";
        }
        
        // Facebook App ID
        $fb_app = $this->get_opt('dtb_fb_app_id');
        if ($fb_app) {
            echo '<meta property="fb:app_id" content="' . esc_attr($fb_app) . '">' . "\n";
        }
    }
    
    public function content_features($content) {
        if (!is_single()) return $content;
        
        $post_id = get_the_ID();
        
        // View Count
        if ($this->get_opt('dtb_view_count') === '1') {
            $views = get_post_meta($post_id, 'dtb_views', true) ?: 0;
            $content = '<div class="dtb-views" style="margin-bottom:12px;color:#666;font-size:14px;">📺 ' . number_format($views) . ' views</div>' . $content;
        }
        
        // Reading Time
        if ($this->get_opt('dtb_reading_time') === '1') {
            $words = str_word_count(strip_tags($content));
            $mins = ceil($words / 200);
            $content = '<div class="dtb-reading" style="margin-bottom:12px;color:#666;font-size:14px;">📖 ' . $mins . ' min read</div>' . $content;
        }
        
        // Freshness Badge
        if ($this->get_opt('dtb_freshness_badge') === '1') {
            $days = floor((current_time('timestamp') - get_the_date('U')) / 86400);
            $badge = '';
            if ($days == 0) $badge = ' <span style="background:#10b981;color:white;padding:2px 8px;border-radius:4px;font-size:11px;">🆕 New</span>';
            elseif ($days < 7) $badge = ' <span style="background:#f59e0b;color:white;padding:2px 8px;border-radius:4px;font-size:11px;">' . $days . ' days ago</span>';
            if ($badge) {
                $content = str_replace(get_the_title(), get_the_title() . $badge, $content);
            }
        }
        
        // Table of Contents
        if ($this->get_opt('dtb_table_of_contents') === '1') {
            if (preg_match_all('/<h2>(.*?)<\/h2>/i', $content, $m) && count($m[0]) >= 3) {
                $toc = '<div class="dtb-toc" style="margin:20px 0;padding:15px;background:#f8f9fa;border-radius:8px;border-left:4px solid #667eea;">';
                $toc .= '<strong style="display:block;margin-bottom:10px;">📑 Table of Contents</strong><ul style="margin:0;padding-left:20px;">';
                foreach ($m[1] as $i => $h) {
                    $toc .= '<li style="margin:5px 0;"><a href="#toc-' . $i . '" style="color:#666;">' . strip_tags($h) . '</a></li>';
                }
                $toc .= '</ul></div>';
                $content = $toc . $content;
            }
        }
        
        // Share Buttons
        if ($this->get_opt('dtb_share_buttons') === '1') {
            $url = urlencode(get_permalink());
            $title = urlencode(get_the_title());
            $content .= '<div class="dtb-share" style="margin:30px 0;padding:20px;background:#f8f9fa;border-radius:8px;text-align:center;">';
            $content .= '<strong style="display:block;margin-bottom:10px;">📤 Share this article</strong>';
            $content .= '<a href="https://twitter.com/intent/tweet?url=' . $url . '&text=' . $title . '" target="_blank" style="margin:0 8px;color:#1da1f2;">Twitter</a>';
            $content .= '<a href="https://www.facebook.com/sharer/sharer.php?u=' . $url . '" target="_blank" style="margin:0 8px;color:#1877f2;">Facebook</a>';
            $content .= '<a href="https://www.linkedin.com/shareArticle?url=' . $url . '" target="_blank" style="margin:0 8px;color:#0a66c2;">LinkedIn</a>';
            if ($this->get_opt('dtb_whatsapp_share') === '1') {
                $content .= '<a href="https://wa.me/?text=' . $title . '%20' . $url . '" target="_blank" style="margin:0 8px;color:#25d366;">WhatsApp</a>';
            }
            if ($this->get_opt('dtb_print_button') === '1') {
                $content .= '<a href="javascript:window.print()" style="margin:0 8px;color:#666;">Print</a>';
            }
            $content .= '</div>';
        }
        
        // Comment Count
        if ($this->get_opt('dtb_comment_count') === '1') {
            $comments = get_comments_number($post_id);
            $content .= '<div class="dtb-comments" style="margin-top:20px;font-size:14px;color:#666;">💬 ' . $comments . ' comments</div>';
        }
        
        // Author Bio
        if ($this->get_opt('dtb_author_bio') === '1') {
            $bio = get_the_author_meta('description');
            if ($bio) {
                $content .= '<div class="dtb-author" style="margin:30px 0;padding:20px;background:#f8f9fa;border-radius:8px;">';
                $content .= '<strong>About ' . get_the_author() . '</strong>';
                $content .= '<p style="margin:10px 0 0 0;">' . esc_html($bio) . '</p>';
                $content .= '</div>';
            }
        }
        
        return $content;
    }
    
    public function footer_features() {
        if (!is_single()) return;
        
        $url = get_permalink();
        
        // Scroll to Top
        if ($this->get_opt('dtb_scroll_top') === '1') {
            ?>
            <button onclick="window.scrollTo({top:0,behavior:'smooth'})" id="dtb-scroll" style="position:fixed;bottom:20px;right:20px;width:45px;height:45px;background:#667eea;color:white;border:none;border-radius:50%;font-size:20px;cursor:pointer;z-index:9998;display:none;">↑</button>
            <script>window.onscroll=function(){var b=document.getElementById('dtb-scroll');if(document.body.scrollTop>300||document.documentElement.scrollTop>300){b.style.display='flex'}else{b.style.display='none'}}</script>
            <?php
        }
        
        // Progress Bar
        if ($this->get_opt('dtb_progress_bar') === '1') {
            ?>
            <div id="dtb-progress" style="position:fixed;top:0;left:0;height:4px;background:linear-gradient(90deg,#667eea,#764ba2);z-index:99999;width:0%;transition:width 0.1s;"></div>
            <script>window.onscroll=function(){var s=document.body.scrollTop,h=document.documentElement.scrollHeight-document.documentElement.clientHeight,p=(s/h)*100;document.getElementById('dtb-progress').style.width=p+'%'}</script>
            <?php
        }
        
        // Floating Share Buttons
        if ($this->get_opt('dtb_floating_share') === '1') {
            ?>
            <div id="dtb-float" style="position:fixed;bottom:80px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;">
                <a href="https://twitter.com/intent/tweet?url=<?php echo urlencode($url); ?>" target="_blank" style="width:40px;height:40px;background:#1da1f2;color:white;text-decoration:none;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;">X</a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo urlencode($url); ?>" target="_blank" style="width:40px;height:40px;background:#1877f2;color:white;text-decoration:none;border-radius:50%;display:flex;align-items:center;justify-content:center;">f</a>
                <a href="https://www.linkedin.com/shareArticle?url=<?php echo urlencode($url); ?>" target="_blank" style="width:40px;height:40px;background:#0a66c2;color:white;text-decoration:none;border-radius:50%;display:flex;align-items:center;justify-content:center;">in</a>
                <?php if ($this->get_opt('dtb_whatsapp_share') === '1'): ?>
                <a href="https://wa.me/?text=<?php echo urlencode($url); ?>" target="_blank" style="width:40px;height:40px;background:#25d366;color:white;text-decoration:none;border-radius:50%;display:flex;align-items:center;justify-content:center;">W</a>
                <?php endif; ?>
            </div>
            <?php
        }
        
        // Newsletter Popup (after 10 seconds)
        if ($this->get_opt('dtb_newsletter_popup') === '1' && !isset($_COOKIE['dtb_newsletter'])) {
            ?>
            <div id="dtb-popup" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:99999;align-items:center;justify-content:center;">
                <div style="background:white;padding:40px;border-radius:16px;max-width:400px;text-align:center;position:relative;">
                    <button onclick="document.getElementById('dtb-popup').style.display='none'" style="position:absolute;top:10px;right:15px;border:none;background:none;font-size:24px;cursor:pointer;">×</button>
                    <h2 style="margin:0 0 15px;">📧 Stay Updated!</h2>
                    <p style="color:#666;margin:0 0 20px;">Get the latest tech news in your inbox.</p>
                    <form onsubmit="document.cookie='dtb_newsletter=1;path=/';document.getElementById('dtb-popup').style.display='none';alert('Thanks!');return false">
                        <input type="email" required placeholder="Your email" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;margin-bottom:15px;">
                        <button type="submit" style="width:100%;padding:12px;background:#667eea;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">Subscribe</button>
                    </form>
                </div>
            </div>
            <script>setTimeout(function(){document.getElementById('dtb-popup').style.display='flex'},10000)</script>
            <?php
        }
    }
}

new Dastgeer_Tech_Booster();