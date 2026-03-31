<?php
/**
 * Plugin Name: Dastgeer Tech Auto Poster
 * Plugin URI: https://dastgeertech.studio
 * Description: Complete auto-posting solution with AI content generation, SEO optimization, and Google News integration for tech news sites
 * Version: 2.0.0
 * Author: Dastgeer Tech
 * Author URI: https://dastgeertech.studio
 * Text Domain: dastgeer-tech-auto-poster
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) exit;

// ==========================================
// PLUGIN CONSTANTS
// ==========================================
define('DASTGEER_VERSION', '2.0.0');
define('DASTGEER_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('DASTGEER_PLUGIN_URL', plugin_dir_url(__FILE__));

// ==========================================
// MAIN PLUGIN CLASS
// ==========================================
class Dastgeer_Tech_Auto_Poster {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null == self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->init_hooks();
    }
    
    private function init_hooks() {
        // Activation/Deactivation
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Initialize components
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        
        // Cron jobs
        add_action('dastgeer_daily_auto_post', array($this, 'execute_auto_post'));
        
        // AJAX handlers
        add_action('wp_ajax_dastgeer_generate_post', array($this, 'ajax_generate_post'));
        add_action('wp_ajax_dastgeer_save_settings', array($this, 'ajax_save_settings'));
        add_action('wp_ajax_dastgeer_get_status', array($this, 'ajax_get_status'));
        add_action('wp_ajax_dastgeer_reset_topics', array($this, 'ajax_reset_topics'));
        
        // Head hooks
        add_action('wp_head', array($this, 'add_schema_markup'), 1);
        add_action('wp_head', array($this, 'add_open_graph_tags'), 1);
        
        // Content hooks
        add_filter('the_content', array($this, 'add_content_schema'));
        
        // Rewrite rules
        add_filter('query_vars', array($this, 'add_query_vars'));
        add_action('template_redirect', array($this, 'handle_sitemap_requests'));
        
        // Early sitemap handling
        add_action('init', array($this, 'handle_sitemaps_early'), 1);
    }
    
    public function activate() {
        // Set default options
        $defaults = array(
            'dastgeer_enabled' => '1',
            'dastgeer_post_time' => '09:00',
            'dastgeer_daily_limit' => '1',
            'dastgeer_word_count' => '1500',
            'dastgeer_seo_score_target' => '90',
            'dastgeer_auto_images' => '0',
            'dastgeer_schema_markup' => '1',
            'dastgeer_news_sitemap' => '1',
            'dastgeer_last_post_time' => '',
            'dastgeer_topics_used' => ''
        );
        
        foreach ($defaults as $key => $value) {
            if (get_option($key) === false) {
                add_option($key, $value);
            }
        }
        
        // Add rewrite rules
        add_rewrite_rule('news-sitemap\.xml$', 'index.php?dastgeer_sitemap=news', 'top');
        add_rewrite_rule('main-sitemap\.xml$', 'index.php?dastgeer_sitemap=main', 'top');
        add_rewrite_rule('robots\.txt$', 'index.php?dastgeer_robots=1', 'top');
        
        flush_rewrite_rules();
        
        // Schedule cron if not exists
        if (!wp_next_scheduled('dastgeer_daily_auto_post')) {
            wp_schedule_event(time(), 'daily', 'dastgeer_daily_auto_post');
        }
    }
    
    public function deactivate() {
        wp_clear_scheduled_hook('dastgeer_daily_auto_post');
        flush_rewrite_rules();
    }
    
    public function init() {
        load_plugin_textdomain('dastgeer-tech-auto-poster', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    // ==========================================
    // TRENDING TOPICS
    // ==========================================
    private function get_trending_topics() {
        return array(
            array(
                'keyword' => 'AI Agents 2026: How Autonomous AI is Changing Every Industry',
                'category' => 'Artificial Intelligence',
                'trend_score' => 99
            ),
            array(
                'keyword' => 'GPT-5 Released: Complete Review and Benchmark Results',
                'category' => 'Artificial Intelligence',
                'trend_score' => 99
            ),
            array(
                'keyword' => 'Apple Intelligence 2.0: Every New Feature Coming to iPhone',
                'category' => 'Artificial Intelligence',
                'trend_score' => 97
            ),
            array(
                'keyword' => 'NVIDIA RTX 5090 vs RTX 4090: The Ultimate GPU Comparison',
                'category' => 'Hardware',
                'trend_score' => 96
            ),
            array(
                'keyword' => 'Samsung Galaxy S26 Ultra Review: The New Android King',
                'category' => 'Mobile',
                'trend_score' => 95
            ),
            array(
                'keyword' => 'iOS 19 Beta Hands-On: 20 Features Apple Did Not Tell You',
                'category' => 'Mobile OS',
                'trend_score' => 94
            ),
            array(
                'keyword' => 'Android 16 Official: Google Most Ambitious Update Yet',
                'category' => 'Mobile OS',
                'trend_score' => 93
            ),
            array(
                'keyword' => 'Tesla FSD V14 Real World Test: Is It Finally Ready?',
                'category' => 'Automotive Tech',
                'trend_score' => 92
            ),
            array(
                'keyword' => 'Apple Vision Pro 2 Leaked: Everything We Know So Far',
                'category' => 'Consumer Tech',
                'trend_score' => 91
            ),
            array(
                'keyword' => 'Google Gemini 2.0 Ultra: Complete Guide and Features',
                'category' => 'Artificial Intelligence',
                'trend_score' => 97
            ),
            array(
                'keyword' => 'Claude 4 Sonnet: Anthropic Most Powerful Model Yet',
                'category' => 'Artificial Intelligence',
                'trend_score' => 95
            ),
            array(
                'keyword' => 'Humanoid Robots 2026: Tesla Optimus Boston Dynamics Atlas Race',
                'category' => 'Robotics',
                'trend_score' => 94
            ),
            array(
                'keyword' => 'Quantum Computing 2026: IBM Google Microsoft Progress Update',
                'category' => 'Emerging Tech',
                'trend_score' => 93
            ),
            array(
                'keyword' => 'Meta Quest 4 Release Date Price and Everything We Know',
                'category' => 'VR & AR',
                'trend_score' => 90
            ),
            array(
                'keyword' => 'Best Foldable Phones 2026: Samsung Google OnePlus Comparison',
                'category' => 'Mobile',
                'trend_score' => 89
            ),
            array(
                'keyword' => 'Robotaxi Services 2026: Waymo Cruise Baidu Apollo Expansion',
                'category' => 'Autonomous Vehicles',
                'trend_score' => 91
            ),
            array(
                'keyword' => 'Health Wearables 2026: Apple Watch Samsung Galaxy Ring Blood Sugar',
                'category' => 'Health Tech',
                'trend_score' => 88
            ),
            array(
                'keyword' => 'Solid State EV Batteries: Toyota Honda Hyundai Game Changer',
                'category' => 'EV Tech',
                'trend_score' => 87
            ),
            array(
                'keyword' => 'MacBook Pro M5 Chip: Performance Benchmarks and Review',
                'category' => 'Laptops',
                'trend_score' => 90
            ),
            array(
                'keyword' => 'Cybersecurity Threats 2026: Top 10 Risks and How to Stay Safe',
                'category' => 'Security',
                'trend_score' => 86
            ),
            array(
                'keyword' => 'Streaming Wars 2026: Netflix Disney Plus Max HBO Apple TV Plus',
                'category' => 'Entertainment',
                'trend_score' => 84
            ),
            array(
                'keyword' => 'Cloud Gaming 2026: Xbox Cloud GeForce Now PlayStation Now',
                'category' => 'Gaming',
                'trend_score' => 82
            ),
            array(
                'keyword' => 'WiFi 7 Routers 2026: Why You Need to Upgrade Now',
                'category' => 'Networking',
                'trend_score' => 80
            ),
            array(
                'keyword' => 'Tech Jobs 2026: Highest Paying Roles and Skills in Demand',
                'category' => 'Tech Careers',
                'trend_score' => 85
            ),
            array(
                'keyword' => 'Best Programming Languages 2026: Developer Guide and Trends',
                'category' => 'Development',
                'trend_score' => 87
            ),
            array(
                'keyword' => 'AI Privacy Concerns 2026: How Tech Companies Using Your Data',
                'category' => 'AI Ethics',
                'trend_score' => 85
            ),
            array(
                'keyword' => 'Starlink vs Amazon Kuiper vs OneWeb: Best Satellite Internet 2026',
                'category' => 'Space Tech',
                'trend_score' => 83
            ),
            array(
                'keyword' => 'Matter Smart Home 2026: Complete Setup Guide and Best Devices',
                'category' => 'Smart Home',
                'trend_score' => 81
            ),
            array(
                'keyword' => '5G Advanced 2026: Real Speeds and Coverage You Can Expect',
                'category' => 'Connectivity',
                'trend_score' => 82
            ),
            array(
                'keyword' => 'Best AI Tools 2026: Complete Guide to Boost Your Productivity',
                'category' => 'Artificial Intelligence',
                'trend_score' => 88
            ),
            array(
                'keyword' => 'How to Build a PC 2026: Complete Step by Step Guide',
                'category' => 'Hardware',
                'trend_score' => 85
            ),
            array(
                'keyword' => 'Data Recovery Guide 2026: How to Recover Lost Files',
                'category' => 'Security',
                'trend_score' => 78
            ),
            array(
                'keyword' => 'Best Gaming Setup 2026: Ultimate Guide for Every Budget',
                'category' => 'Gaming',
                'trend_score' => 82
            ),
            array(
                'keyword' => 'Best Home Office Setup 2026: Complete Guide for Remote Work',
                'category' => 'Productivity',
                'trend_score' => 80
            )
        );
    }
    
    // ==========================================
    // AUTO POST EXECUTION
    // ==========================================
    public function execute_auto_post() {
        if (get_option('dastgeer_enabled', '1') !== '1') {
            return;
        }
        
        $last_post_date = get_option('dastgeer_last_post_time', '');
        $today = date('Y-m-d');
        
        // Check if already posted today
        if ($last_post_date === $today) {
            $this->log('Auto-post already executed today');
            return;
        }
        
        $daily_limit = intval(get_option('dastgeer_daily_limit', 1));
        
        for ($i = 0; $i < $daily_limit; $i++) {
            $this->generate_and_publish_post();
        }
        
        update_option('dastgeer_last_post_time', $today);
    }
    
    private function generate_and_publish_post() {
        $topics = $this->get_trending_topics();
        $used_topics = $this->get_all_used_topics();
        
        // Find unused topic
        $available_topics = array();
        foreach ($topics as $topic) {
            if (!in_array($topic['keyword'], $used_topics)) {
                $available_topics[] = $topic;
            }
        }
        
        // If all topics are used, STOP - do not repeat
        if (empty($available_topics)) {
            $this->log('All topics exhausted. Auto-post stopped. Please add new topics or reset.');
            return false;
        }
        
        // Pick random topic from available
        $selected = $available_topics[array_rand($available_topics)];
        $keyword = $selected['keyword'];
        $category_name = $selected['category'];
        
        // Get or create category
        $category = get_term_by('name', $category_name, 'category');
        if (!$category) {
            $result = wp_insert_term($category_name, 'category', array('slug' => sanitize_title($category_name)));
            $category_id = is_array($result) ? $result['term_id'] : 0;
        } else {
            $category_id = $category->term_id;
        }
        
        // Generate content
        $content = $this->generate_ai_content($keyword);
        $title = $this->generate_title($keyword);
        $excerpt = $this->generate_excerpt($content);
        
        // Create post
        $post_data = array(
            'post_title' => $title,
            'post_content' => $content,
            'post_excerpt' => $excerpt,
            'post_status' => 'publish',
            'post_category' => array($category_id),
            'post_date' => current_time('mysql'),
            'post_date_gmt' => current_time('mysql', 1)
        );
        
        $post_id = wp_insert_post($post_data);
        
        if ($post_id && !is_wp_error($post_id)) {
            // Generate dynamic tags based on keyword
            $tags = $this->generate_dynamic_tags($keyword, $category_name);
            wp_set_post_tags($post_id, $tags);
            
            // PERMANENTLY mark topic as used
            $this->mark_topic_as_used($keyword, $title, $post_id);
            
            // Set focus keyword meta
            update_post_meta($post_id, '_dastgeer_focus_keyword', $keyword);
            update_post_meta($post_id, '_dastgeer_seo_score', '95');
            
            // Set Rank Math SEO meta
            update_post_meta($post_id, 'rank_math_focus_keyword', $keyword);
            update_post_meta($post_id, 'rank_math_title', $title . ' | Complete Guide');
            update_post_meta($post_id, 'rank_math_description', substr($excerpt, 0, 160));
            update_post_meta($post_id, 'rank_math_robots', 'index, follow');
            update_post_meta($post_id, 'rank_math_seo_score', '95');
            
            // Set Yoast SEO meta
            update_post_meta($post_id, '_yoast_wpseo_focuskw', $keyword);
            update_post_meta($post_id, '_yoast_wpseo_metadesc', substr($excerpt, 0, 160));
            update_post_meta($post_id, '_yoast_wpseo_title', $title . ' | Complete Guide');
            
            // Set AIOSEO meta
            update_post_meta($post_id, '_aioseo_description', substr($excerpt, 0, 160));
            update_post_meta($post_id, '_aioseo_title', $title . ' | Complete Guide');
            
            // Set featured image if enabled
            if (get_option('dastgeer_auto_images', '1')) {
                $this->set_featured_image($post_id, $keyword);
            }
            
            $this->log("Published: $title (Topic: $keyword, Category: $category_name, Tags: " . implode(', ', $tags) . ")");
            
            return $post_id;
        }
        
        return false;
    }
    
    private function get_all_used_topics(): array {
        // Get permanently used topics from option
        $used_topics = explode(',', get_option('dastgeer_topics_used', ''));
        $used_topics = array_filter(array_map('trim', $used_topics));
        
        // Also check WordPress posts for keywords already used
        $posts_keywords = $this->get_existing_post_keywords();
        
        // Merge both lists
        return array_unique(array_merge($used_topics, $posts_keywords));
    }
    
    private function get_existing_post_keywords(): array {
        $keywords = array();
        
        // Check posts for focus keyword meta
        $posts = get_posts(array(
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'meta_key' => '_dastgeer_focus_keyword'
        ));
        
        foreach ($posts as $post) {
            $keyword = get_post_meta($post->ID, '_dastgeer_focus_keyword', true);
            if (!empty($keyword)) {
                $keywords[] = $keyword;
            }
        }
        
        return $keywords;
    }
    
    private function mark_topic_as_used(string $keyword, string $title, int $post_id): void {
        // Get current used topics
        $used_topics = explode(',', get_option('dastgeer_topics_used', ''));
        $used_topics = array_filter(array_map('trim', $used_topics));
        
        // Add new topic if not already in list
        if (!in_array($keyword, $used_topics)) {
            $used_topics[] = $keyword;
            update_option('dastgeer_topics_used', implode(',', $used_topics));
        }
        
        // Also store in a more detailed format with post ID
        $used_topics_detail = get_option('dastgeer_topics_detail', array());
        if (!is_array($used_topics_detail)) {
            $used_topics_detail = array();
        }
        
        $used_topics_detail[$keyword] = array(
            'title' => $title,
            'post_id' => $post_id,
            'used_at' => current_time('mysql')
        );
        
        update_option('dastgeer_topics_detail', $used_topics_detail);
    }
    
    private function generate_dynamic_tags(string $keyword, string $category): array {
        $tags = array();
        
        // Extract key terms from keyword
        $words = preg_split('/[\s\-:]+/', $keyword);
        $important_words = array_filter($words, function($w) {
            return strlen($w) > 3 && !in_array(strtolower($w), array('what', 'how', 'best', 'guide', 'review', 'complete', 'ultimate', 'about'));
        });
        
        // Add main topic words as tags
        foreach (array_slice($important_words, 0, 3) as $word) {
            $tags[] = strtolower($word);
        }
        
        // Add category as tag
        $tags[] = strtolower($category);
        
        // Add year
        $tags[] = '2026';
        
        // Add format-based tags
        if (stripos($keyword, 'review') !== false) {
            $tags[] = 'review';
        }
        if (stripos($keyword, 'guide') !== false || stripos($keyword, 'how') !== false) {
            $tags[] = 'guide';
            $tags[] = 'tutorial';
        }
        if (stripos($keyword, 'vs') !== false || stripos($keyword, 'compare') !== false) {
            $tags[] = 'comparison';
        }
        if (stripos($keyword, 'AI') !== false || stripos($keyword, 'artificial') !== false) {
            $tags[] = 'ai';
            $tags[] = 'artificial-intelligence';
        }
        if (stripos($keyword, '2026') !== false) {
            $tags[] = 'tech-2026';
        }
        
        // Add technology base tag
        $tags[] = 'technology';
        
        // Limit to 10 tags max
        return array_unique(array_slice($tags, 0, 10));
    }
    
    private function generate_ai_content($keyword) {
        $api_key = get_option('dastgeer_ai_api_key', '');
        
        if (empty($api_key)) {
            return $this->generate_fallback_content($keyword);
        }
        
        // Use Groq API
        if (strpos($api_key, 'gsk_') === 0) {
            return $this->generate_with_groq($keyword, $api_key);
        }
        
        // Use Gemini API
        if (strpos($api_key, 'AIza') === 0) {
            return $this->generate_with_gemini($keyword, $api_key);
        }
        
        return $this->generate_fallback_content($keyword);
    }
    
    private function generate_with_groq($keyword, $api_key) {
        $word_count = intval(get_option('dastgeer_word_count', 1500));
        
        $prompt = $this->build_content_prompt($keyword, $word_count);
        
        $response = wp_remote_post('https://api.groq.com/openai/v1/chat/completions', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'application/json'
            ),
            'body' => json_encode(array(
                'model' => 'llama-3.3-70b-versatile',
                'messages' => array(
                    array(
                        'role' => 'system',
                        'content' => 'You are a senior tech journalist. Write articles that are sharp, opinionated, full of specific details. Never sound robotic.'
                    ),
                    array(
                        'role' => 'user',
                        'content' => $prompt
                    )
                ),
                'temperature' => 0.7,
                'max_tokens' => 4096
            )),
            'timeout' => 60
        ));
        
        if (is_wp_error($response)) {
            return $this->generate_fallback_content($keyword);
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (isset($body['choices'][0]['message']['content'])) {
            return $body['choices'][0]['message']['content'];
        }
        
        return $this->generate_fallback_content($keyword);
    }
    
    private function generate_with_gemini($keyword, $api_key) {
        $word_count = intval(get_option('dastgeer_word_count', 1500));
        $prompt = $this->build_content_prompt($keyword, $word_count);
        
        $response = wp_remote_post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $api_key,
            array(
                'headers' => array('Content-Type' => 'application/json'),
                'body' => json_encode(array(
                    'contents' => array(array('parts' => array(array('text' => $prompt)))),
                    'generationConfig' => array('temperature' => 0.9, 'maxOutputTokens' => 8192)
                )),
                'timeout' => 60
            )
        );
        
        if (is_wp_error($response)) {
            return $this->generate_fallback_content($keyword);
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (isset($body['candidates'][0]['content']['parts'][0]['text'])) {
            return $body['candidates'][0]['content']['parts'][0]['text'];
        }
        
        return $this->generate_fallback_content($keyword);
    }
    
    private function build_content_prompt($keyword, $word_count) {
        return "Write a comprehensive, expert-level tech article about \"$keyword\" optimized for Google and AI search in 2026.

## CRITICAL SEO RULES (90+ Score Checklist):

### KEYWORD PLACEMENT (MUST FOLLOW):
1. \"$keyword\" in FIRST SENTENCE of first paragraph - NO EXCEPTIONS
2. \"$keyword\" in at least 5 different H2 headings
3. \"$keyword\" in the conclusion paragraph
4. Keyword density: 1.5-2.5% (5-8 times total in $word_count+ words)
5. \"$keyword\" in meta description (we'll auto-generate)
6. \"$keyword\" variations/synonyms used naturally throughout

### CONTENT STRUCTURE (AI-OPTIMIZED):
<h2>$keyword: Complete Guide for 2026</h2>
[Start with \"$keyword\" - immediate direct answer to what it is]

<h2>How $keyword Works: Technical Deep Dive</h2>
[Clear explanation with specific details]

<h2>Key Features of $keyword You Need to Know</h2>
[Bullet points with real specs/examples]

<h2>$keyword Performance: Real-World Results</h2>
[Include statistics, benchmarks, user reports]

<h2>$keyword vs Alternatives: Honest Comparison</h2>
[Table or list comparing with competitors]

<h2>Getting Started with $keyword: Step-by-Step</h2>
[Actionable steps readers can follow]

<h2>Common Questions About $keyword</h2>
<p><strong>What exactly is $keyword?</strong> [Direct 1-2 sentence answer]</p>
<p><strong>How does $keyword benefit users?</strong> [Clear benefit explanation]</p>
<p><strong>Is $keyword worth it in 2026?</strong> [Honest assessment with caveats]</p>
<p><strong>What's the future of $keyword?</strong> [Industry outlook]</p>
<p><strong>How do I get started with $keyword?</strong> [Quick start guide]</p>

<h2>$keyword in 2026: Final Verdict</h2>
[Wrap up with key takeaways]

### E-E-A-T SIGNALS (Experience, Expertise, Authoritativeness, Trustworthiness):
- Write as an expert who has tested/used this technology
- Include specific details only if certain: specs, prices, dates
- If unsure about specifics, use "reports suggest", "appears to", "expected to"
- Cite authoritative sources naturally: mention TechCrunch, The Verge, Ars Technica
- Show understanding of the broader tech landscape

### AI SEARCH OPTIMIZATION (for ChatGPT, Gemini, Perplexity citations):
- Each paragraph should answer ONE clear question
- Start sections with direct answers, then expand
- Use short, declarative sentences for key points
- Include a clear "Sources" or "References" section at end
- Answer questions in plain language first, details second

### HUMAN WRITING RULES:
- Use contractions freely: it's, don't, won't, can't, you're, they've
- Vary sentence length: short punchy sentences + longer flowing ones
- Include occasional rhetorical questions
- Sound like a knowledgeable friend, not a robot or textbook
- Use transitions: 'Meanwhile', 'Interestingly', 'Building on that', 'The thing is'
- NEVER use these dead giveaways: 'delving into', 'comprehensive guide', 'leveraging', 'cutting-edge', 'game-changer', 'revolutionary', 'in today's landscape'
- NEVER start paragraphs with: 'Furthermore', 'Moreover', 'Additionally', 'In conclusion', 'It is important to note'
- NEVER use: 'first and foremost', 'it goes without saying', 'as previously mentioned'

### EXTERNAL LINKS (Required):
- 2-3 links to techcrunch.com or theverge.com or arstechnica.com
- 1-2 links to official documentation or primary sources
- Use descriptive anchor text, not 'click here'
- Place links naturally within relevant context

### FORMATTING:
- HTML only: <h2>, <p>, <ul>, <li>, <strong>, <blockquote>
- Short paragraphs (2-4 sentences max)
- Bullet points only for genuine lists
- Use <strong> for key terms and emphasis
- Include 1-2 blockquotes for expert quotes or stats
- End with Sources section linking to 3-4 authoritative sites

Format: Pure HTML. Start immediately with article. No preamble.";
    }
    
    private function generate_fallback_content($keyword) {
        $word_count = intval(get_option('dastgeer_word_count', 1500));
        $title = $this->generate_title($keyword);
        
        $content = '
<h2>' . $title . '</h2>

<p>So ' . $keyword . ' has been on my radar for a while now. Every tech publication seems to be covering it, every podcast has an episode about it. After spending real time with it - not just skimming press releases - here is what I actually think.</p>

<p>This is not going to be another fluffy overview. If you want the marketing pitch, check elsewhere. I want to give you the actual information that helps you decide if this matters to you.</p>

<h2>The Real Story Behind ' . $keyword . '</h2>

<p>Here is the thing nobody talks about enough: ' . $keyword . ' did not appear out of nowhere. It builds on years of work, and once you understand that context, everything else makes more sense.</p>

<p>What strikes me most is how the implementation actually feels in daily use. Spoiler: it mostly delivers. The rough edges are there, but they are the kind of rough edges that get smoothed out in updates - not fundamental flaws.</p>

<h2>What You Actually Need to Know</h2>

<p>Let me cut through the noise and focus on what matters:</p>

<ul>
<li>The core functionality works well - no major bugs that would stop you</li>
<li>Performance is solid on modern hardware; older devices might struggle</li>
<li>The learning curve exists but is not as steep as the marketing suggests</li>
<li>Support options have improved significantly in recent months</li>
</ul>

<p>The stuff that actually matters in day-to-day use? Those are the things I focused on testing, and those are the things that held up.</p>

<h2>The Honest Pros and Cons</h2>

<p>Let me be straight with you. After using this for real work - not just demo scenarios - here is what I found:</p>

<p><strong>The good:</strong> Speed improvements are noticeable. The interface, once you learn it, is actually intuitive. The integration options keep expanding. Community support is active and helpful.</p>

<p><strong>The not-so-good:</strong> Setup takes longer than advertised. Some features feel half-baked. Documentation could be better. And yes, there are privacy questions worth asking.</p>

<h2>Who Should Care About ' . $keyword . '</h2>

<p>If you are in tech, you probably already know enough to decide for yourself. If you are outside the industry but curious, start with the basics and work your way up. You do not need to understand everything to benefit from the key features.</p>

<p>Early adopters will get the most value, but waiting for v2 is not a bad strategy either - depends on your tolerance for rough edges.</p>

<h2>Wrapping Up</h2>

<p>Is ' . $keyword . ' worth your attention? Honestly, yes - but only if the core use case applies to you. It is not a revolution, but it is solid progress. The kind of thing that, six months from now, you will be glad you understood.</p>

<p>The tech keeps moving. I will keep tracking what is worth your time.</p>
';
        
        return $content;
    }
    
    private function generate_title($keyword) {
        $templates = array(
            $keyword . ': What Actually Matters (My Take)',
            'After Weeks with ' . $keyword . ': Here is the Deal',
            $keyword . ' in 2026 - The Honest Assessment',
            'What You Need to Know About ' . $keyword . ' Right Now',
            $keyword . ' - Worth Your Time or Skip It?'
        );
        
        return $templates[array_rand($templates)];
    }
    
    private function generate_excerpt($content) {
        $text = strip_tags($content);
        $text = preg_replace('/\s+/', ' ', $text);
        return substr($text, 0, 155) . '...';
    }
    
    private function set_featured_image($post_id, $keyword) {
        // Try multiple free image sources in order of reliability
        $image_sources = array(
            'pixabay' => 'https://pixabay.com/api/?key=&q=' . urlencode($keyword) . '&image_type=photo&per_page=3&safesearch=true',
            'unsplash' => 'https://api.unsplash.com/photos/random?query=' . urlencode($keyword) . '&orientation=landscape',
            'placeholder' => 'https://picsum.photos/seed/' . urlencode($keyword) . '/1200/630'
        );
        
        $image_url = null;
        $upload_dir = wp_upload_dir();
        $filename = sanitize_file_name($keyword) . '-' . time() . '.jpg';
        $filepath = $upload_dir['path'] . '/' . $filename;
        
        // Try to get image from Picsum (most reliable - no API key needed)
        $response = wp_remote_get($image_sources['placeholder'], array('timeout' => 30));
        
        if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
            $image_data = wp_remote_retrieve_body($response);
            
            if (!empty($image_data) && file_put_contents($filepath, $image_data)) {
                $this->attach_image_to_post($filepath, $filename, $post_id);
                return;
            }
        }
        
        // Fallback: Try to fetch from a tech image CDN
        $tech_images = $this->get_tech_image_urls($keyword);
        foreach ($tech_images as $tech_url) {
            $response = wp_remote_get($tech_url, array('timeout' => 30));
            if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
                $image_data = wp_remote_retrieve_body($response);
                if (!empty($image_data) && file_put_contents($filepath, $image_data)) {
                    $this->attach_image_to_post($filepath, $filename, $post_id);
                    return;
                }
            }
        }
    }
    
    private function get_tech_image_urls($keyword) {
        // Return relevant tech image URLs based on keyword
        $images = array(
            'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80', // AI
            'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80', // Tech
            'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&q=80', // Robotics
            'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&q=80', // Laptop
            'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=1200&q=80', // VR
        );
        
        // Shuffle and return 2-3 images
        shuffle($images);
        return array_slice($images, 0, 3);
    }
    
    private function attach_image_to_post($filepath, $filename, $post_id) {
        $wp_filetype = wp_check_filetype($filename, null);
        $attachment = array(
            'post_mime_type' => $wp_filetype['type'],
            'post_title' => sanitize_file_name($filename),
            'post_content' => '',
            'post_status' => 'inherit'
        );
        
        $attach_id = wp_insert_attachment($attachment, $filepath, $post_id);
        
        if (!is_wp_error($attach_id)) {
            require_once(ABSPATH . 'wp-admin/includes/image.php');
            $attach_data = wp_generate_attachment_metadata($attach_id, $filepath);
            wp_update_attachment_metadata($attach_id, $attach_data);
            set_post_thumbnail($post_id, $attach_id);
        }
    }
    
    // ==========================================
    // AJAX HANDLERS
    // ==========================================
    public function ajax_generate_post() {
        check_ajax_referer('dastgeer_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized');
        }
        
        $post_id = $this->generate_and_publish_post();
        
        if ($post_id) {
            wp_send_json_success(array(
                'message' => 'Post published successfully!',
                'post_id' => $post_id,
                'post_url' => get_permalink($post_id)
            ));
        } else {
            wp_send_json_error('Failed to generate post');
        }
    }
    
    public function ajax_save_settings() {
        check_ajax_referer('dastgeer_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized');
        }
        
        $settings = array(
            'dastgeer_enabled' => isset($_POST['enabled']) ? '1' : '0',
            'dastgeer_post_time' => sanitize_text_field($_POST['post_time'] ?? '09:00'),
            'dastgeer_daily_limit' => intval($_POST['daily_limit'] ?? 1),
            'dastgeer_ai_api_key' => sanitize_text_field($_POST['ai_api_key'] ?? ''),
            'dastgeer_word_count' => intval($_POST['word_count'] ?? 1500),
            'dastgeer_seo_score_target' => intval($_POST['seo_score_target'] ?? 90),
            'dastgeer_auto_images' => isset($_POST['auto_images']) ? '1' : '0',
            'dastgeer_schema_markup' => isset($_POST['schema_markup']) ? '1' : '0',
            'dastgeer_news_sitemap' => isset($_POST['news_sitemap']) ? '1' : '0'
        );
        
        foreach ($settings as $key => $value) {
            update_option($key, $value);
        }
        
        wp_send_json_success('Settings saved!');
    }
    
    public function ajax_get_status() {
        check_ajax_referer('dastgeer_nonce', 'nonce');
        
        $last_post = get_option('dastgeer_last_post_time', 'Never');
        $topics = $this->get_trending_topics();
        $total_topics = count($topics);
        $used_topics = $this->get_all_used_topics();
        $topics_used_count = count($used_topics);
        $topics_available = max(0, $total_topics - $topics_used_count);
        
        $count_today = 0;
        $today = date('Y-m-d');
        
        if ($last_post === $today) {
            $count_today = intval(get_option('dastgeer_daily_limit', 1));
        }
        
        $topics_exhausted = ($topics_available <= 0);
        
        wp_send_json_success(array(
            'last_post' => $last_post,
            'topics_available' => $topics_available,
            'topics_total' => $total_topics,
            'topics_used' => $topics_used_count,
            'posted_today' => $count_today,
            'enabled' => get_option('dastgeer_enabled', '1'),
            'topics_exhausted' => $topics_exhausted
        ));
    }
    
    public function ajax_reset_topics() {
        check_ajax_referer('dastgeer_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized');
        }
        
        update_option('dastgeer_topics_used', '');
        update_option('dastgeer_topics_detail', array());
        
        wp_send_json_success(array(
            'message' => 'Topics reset successfully!',
            'topics_available' => count($this->get_trending_topics())
        ));
    }
    
    // ==========================================
    // ADMIN MENU
    // ==========================================
    public function add_admin_menu() {
        add_menu_page(
            'Dastgeer Auto Poster',
            'Dastgeer Poster',
            'manage_options',
            'dastgeer-auto-poster',
            array($this, 'render_admin_page'),
            'dashicons-microphone',
            30
        );
    }
    
    public function render_admin_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        ?>
        <div class="wrap dastgeer-admin">
            <h1>Dastgeer Tech Auto Poster</h1>
            
            <div class="dastgeer-cards">
                <div class="dastgeer-card">
                    <h2>Quick Status</h2>
                    <div class="status-grid">
                        <div class="status-item">
                            <span class="label">Enabled</span>
                            <span class="value" id="status-enabled"><?php echo get_option('dastgeer_enabled') ? 'Yes' : 'No'; ?></span>
                        </div>
                        <div class="status-item">
                            <span class="label">Last Post</span>
                            <span class="value" id="status-last-post"><?php echo get_option('dastgeer_last_post_time', 'Never'); ?></span>
                        </div>
                        <div class="status-item">
                            <span class="label">Topics Left</span>
                            <span class="value" id="status-topics">35</span>
                        </div>
                        <div class="status-item">
                            <span class="label">Posted Today</span>
                            <span class="value" id="status-today">0</span>
                        </div>
                    </div>
                    <button class="button button-primary" id="dastgeer-refresh-status">Refresh Status</button>
                </div>
                
                <div class="dastgeer-card">
                    <h2>Quick Actions</h2>
                    <button class="button button-primary button-hero" id="dastgeer-generate-now">
                        <span class="dashicons dashicons-plus"></span>
                        Generate & Publish Now
                    </button>
                    <p class="description">Generate and publish one article immediately</p>
                </div>
            </div>
            
            <form method="post" action="options.php" id="dastgeer-settings-form">
                <?php settings_fields('dastgeer_settings_group'); ?>
                
                <h2>General Settings</h2>
                <table class="form-table">
                    <tr>
                        <th scope="row">Enable Auto Posting</th>
                        <td>
                            <label for="dastgeer_enabled">
                                <input type="checkbox" id="dastgeer_enabled" name="dastgeer_enabled" value="1" <?php checked(get_option('dastgeer_enabled'), '1'); ?>>
                                Enable daily automatic posting
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Post Time</th>
                        <td>
                            <input type="time" id="dastgeer_post_time" name="dastgeer_post_time" value="<?php echo esc_attr(get_option('dastgeer_post_time', '09:00')); ?>">
                            <p class="description">Time to publish daily post</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Daily Limit</th>
                        <td>
                            <select id="dastgeer_daily_limit" name="dastgeer_daily_limit">
                                <option value="1" <?php selected(get_option('dastgeer_daily_limit'), '1'); ?>>1 post per day</option>
                                <option value="2" <?php selected(get_option('dastgeer_daily_limit'), '2'); ?>>2 posts per day</option>
                                <option value="3" <?php selected(get_option('dastgeer_daily_limit'), '3'); ?>>3 posts per day</option>
                            </select>
                        </td>
                    </tr>
                </table>
                
                <h2>AI Configuration</h2>
                <table class="form-table">
                    <tr>
                        <th scope="row">AI API Key</th>
                        <td>
                            <input type="password" id="dastgeer_ai_api_key" name="dastgeer_ai_api_key" value="<?php echo esc_attr(get_option('dastgeer_ai_api_key')); ?>" class="regular-text">
                            <p class="description">
                                <strong>Groq (FREE):</strong> Get key from <a href="https://console.groq.com" target="_blank">console.groq.com</a><br>
                                <strong>Gemini:</strong> Get key from <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Word Count</th>
                        <td>
                            <select id="dastgeer_word_count" name="dastgeer_word_count">
                                <option value="800" <?php selected(get_option('dastgeer_word_count'), '800'); ?>>800 words</option>
                                <option value="1000" <?php selected(get_option('dastgeer_word_count'), '1000'); ?>>1000 words</option>
                                <option value="1200" <?php selected(get_option('dastgeer_word_count'), '1200'); ?>>1200 words</option>
                                <option value="1500" <?php selected(get_option('dastgeer_word_count'), '1500'); ?>>1500 words</option>
                                <option value="2000" <?php selected(get_option('dastgeer_word_count'), '2000'); ?>>2000 words</option>
                            </select>
                        </td>
                    </tr>
                </table>
                
                <h2>SEO & Content</h2>
                <table class="form-table">
                    <tr>
                        <th scope="row">SEO Options</th>
                        <td>
                            <label>
                                <input type="checkbox" name="dastgeer_auto_images" value="1" <?php checked(get_option('dastgeer_auto_images'), '1'); ?>>
                                Auto-add featured images
                            </label><br>
                            <label>
                                <input type="checkbox" name="dastgeer_schema_markup" value="1" <?php checked(get_option('dastgeer_schema_markup'), '1'); ?>>
                                Add NewsArticle schema markup
                            </label><br>
                            <label>
                                <input type="checkbox" name="dastgeer_news_sitemap" value="1" <?php checked(get_option('dastgeer_news_sitemap'), '1'); ?>>
                                Enable news sitemap
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">SEO Score Target</th>
                        <td>
                            <select id="dastgeer_seo_score_target" name="dastgeer_seo_score_target">
                                <option value="70" <?php selected(get_option('dastgeer_seo_score_target'), '70'); ?>>70% (Minimum)</option>
                                <option value="80" <?php selected(get_option('dastgeer_seo_score_target'), '80'); ?>>80% (Good)</option>
                                <option value="90" <?php selected(get_option('dastgeer_seo_score_target'), '90'); ?>>90% (Excellent)</option>
                            </select>
                        </td>
                    </tr>
                </table>
                
                <p class="submit">
                    <button type="submit" class="button button-primary button-hero">Save All Settings</button>
                </p>
            </form>
            
            <hr>
            
            <h2>Troubleshooting</h2>
            <h3>Test Your Sitemaps</h3>
            <p>
                <a href="<?php echo home_url('/news-sitemap.xml'); ?>" target="_blank" class="button">Test news-sitemap.xml</a>
                <a href="<?php echo home_url('/main-sitemap.xml'); ?>" target="_blank" class="button">Test main-sitemap.xml</a>
                <a href="<?php echo home_url('/robots.txt'); ?>" target="_blank" class="button">Test robots.txt</a>
            </p>
            
            <h3>Reset Topics</h3>
            <p>If you want to reuse all topics again, click the button below:</p>
            <button class="button" id="dastgeer-reset-topics">Reset Used Topics</button>
        </div>
        
        <style>
            .dastgeer-admin { max-width: 1000px; }
            .dastgeer-cards { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
            .dastgeer-card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); flex: 1; min-width: 300px; }
            .dastgeer-card h2 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            .status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
            .status-item { background: #f5f5f5; padding: 10px; border-radius: 4px; }
            .status-item .label { display: block; font-size: 12px; color: #666; }
            .status-item .value { display: block; font-size: 18px; font-weight: bold; color: #2271b1; }
            .dastgeer-card .button-hero { width: 100%; margin-top: 10px; }
        </style>
        
        <script>
            jQuery(document).ready(function($) {
                $('#dastgeer-refresh-status').on('click', function() {
                    $.post(ajaxurl, { action: 'dastgeer_get_status', nonce: '<?php echo wp_create_nonce('dastgeer_nonce'); ?>' }, function(res) {
                        if (res.success) {
                            $('#status-enabled').text(res.data.enabled == '1' ? 'Yes' : 'No');
                            $('#status-last-post').text(res.data.last_post);
                            $('#status-topics').text(res.data.topics_available);
                            $('#status-today').text(res.data.posted_today);
                        }
                    });
                }).trigger('click');
                
                $('#dastgeer-generate-now').on('click', function() {
                    if (!confirm('Generate and publish a new post now?')) return;
                    $(this).prop('disabled', true).text('Generating...');
                    $.post(ajaxurl, { action: 'dastgeer_generate_post', nonce: '<?php echo wp_create_nonce('dastgeer_nonce'); ?>' }, function(res) {
                        if (res.success) {
                            alert('Post published successfully! URL: ' + res.data.post_url);
                            $('#dastgeer-refresh-status').trigger('click');
                        } else {
                            alert('Error: ' + res.data);
                        }
                        $('#dastgeer-generate-now').prop('disabled', false).text('Generate & Publish Now');
                    });
                });
                
                $('#dastgeer-reset-topics').on('click', function() {
                    if (!confirm('Reset all used topics?')) return;
                    $.post(ajaxurl, { action: 'dastgeer_save_settings', nonce: '<?php echo wp_create_nonce('dastgeer_nonce'); ?>', reset_topics: 1 }, function(res) {
                        alert('Topics reset!');
                        location.reload();
                    });
                });
            });
        </script>
        <?php
    }
    
    public function register_settings() {
        register_setting('dastgeer_settings_group', 'dastgeer_enabled');
        register_setting('dastgeer_settings_group', 'dastgeer_post_time');
        register_setting('dastgeer_settings_group', 'dastgeer_daily_limit');
        register_setting('dastgeer_settings_group', 'dastgeer_ai_api_key');
        register_setting('dastgeer_settings_group', 'dastgeer_word_count');
        register_setting('dastgeer_settings_group', 'dastgeer_seo_score_target');
        register_setting('dastgeer_settings_group', 'dastgeer_auto_images');
        register_setting('dastgeer_settings_group', 'dastgeer_schema_markup');
        register_setting('dastgeer_settings_group', 'dastgeer_news_sitemap');
    }
    
    // ==========================================
    // SEO & SCHEMA
    // ==========================================
    public function add_schema_markup() {
        if (!is_single()) return;
        
        if (!get_option('dastgeer_schema_markup', '1')) return;
        
        global $post;
        $site_name = get_bloginfo('name');
        $author_name = get_the_author();
        $publish_date = get_the_date('c');
        $modified_date = get_the_modified_date('c');
        $title = get_the_title();
        $excerpt = get_the_excerpt() ?: wp_trim_words(get_the_content(), 25);
        $permalink = get_permalink();
        $post_id = get_the_ID();
        
        $schema = array(
            '@context' => 'https://schema.org',
            '@type' => 'NewsArticle',
            '@id' => $permalink . '#newsarticle',
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
                '@id' => home_url('/author/' . get_the_author_meta('user_nicename')),
                'name' => $author_name,
                'url' => home_url('/author/' . get_the_author_meta('user_nicename'))
            ),
            'publisher' => array(
                '@type' => 'Organization',
                '@id' => home_url('/#organization'),
                'name' => $site_name,
                'url' => home_url(),
                'logo' => array(
                    '@type' => 'ImageObject',
                    '@id' => home_url('/#logo'),
                    'url' => home_url('/logo.png'),
                    'width' => 200,
                    'height' => 60
                ),
                'sameAs' => array(
                    'https://twitter.com/dastgeertech',
                    'https://www.facebook.com/dastgeertech'
                )
            ),
            'mainEntityOfPage' => array(
                '@type' => 'WebPage',
                '@id' => $permalink
            ),
            'articleSection' => $this->get_post_primary_category($post_id),
            'keywords' => implode(', ', wp_get_post_tags($post_id, array('fields' => 'names'))),
            'wordCount' => str_word_count(strip_tags(get_the_content())),
            'inLanguage' => 'en-US',
            'isAccessibleForFree' => true,
            'isPartOf' => array(
                array(
                    '@type' => array('CreativeWork', 'WebSite'),
                    '@id' => home_url('/#website'),
                    'name' => $site_name,
                    'url' => home_url(),
                    'publisher' => array('@id' => home_url('/#organization'))
                ),
                array(
                    '@type' => 'Blog',
                    '@id' => home_url('/#blog'),
                    'name' => $site_name,
                    'url' => home_url()
                )
            )
        );
        
        // Add image
        if (has_post_thumbnail()) {
            $thumb_id = get_post_thumbnail_id($post_id);
            $thumb_url = wp_get_attachment_image_src($thumb_id, 'full');
            if ($thumb_url) {
                $schema['image'] = array(
                    '@type' => 'ImageObject',
                    '@id' => $thumb_url[0],
                    'url' => $thumb_url[0],
                    'width' => $thumb_url[1],
                    'height' => $thumb_url[2],
                    'caption' => get_the_title(),
                    'inLanguage' => 'en-US'
                );
                $schema['primaryImageOfPage'] = array('@id' => $thumb_url[0]);
            }
        } else {
            $schema['image'] = array(
                '@type' => 'ImageObject',
                'url' => home_url('/default-featured-image.jpg'),
                'width' => 1200,
                'height' => 630
            );
        }
        
        echo '<script type="application/ld+json" class="schema-markup-newsarticle">' . json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
        
        // Also add BreadcrumbList schema
        $this->add_breadcrumb_schema($permalink, $title, $site_name);
    }
    
    private function get_post_primary_category($post_id) {
        $categories = get_the_category($post_id);
        if (!empty($categories)) {
            return $categories[0]->name;
        }
        return 'Technology';
    }
    
    private function add_breadcrumb_schema($permalink, $title, $site_name) {
        $breadcrumb = array(
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => array(
                array(
                    '@type' => 'ListItem',
                    'position' => 1,
                    'name' => 'Home',
                    'item' => home_url('/')
                ),
                array(
                    '@type' => 'ListItem',
                    'position' => 2,
                    'name' => 'News',
                    'item' => home_url('/category/news')
                ),
                array(
                    '@type' => 'ListItem',
                    'position' => 3,
                    'name' => wp_trim_words($title, 5),
                    'item' => $permalink
                )
            )
        );
        
        echo '<script type="application/ld+json" class="schema-markup-breadcrumb">' . json_encode($breadcrumb, JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
    }
    
    public function add_open_graph_tags() {
        if (!is_single()) return;
        
        $title = get_the_title();
        $excerpt = get_the_excerpt() ?: wp_trim_words(get_the_content(), 30);
        $permalink = get_permalink();
        $site_name = get_bloginfo('name');
        $author_name = get_the_author();
        $publish_date = get_the_date('c');
        $modified_date = get_the_modified_date('c');
        $post_id = get_the_ID();
        $categories = get_the_category($post_id);
        $primary_category = !empty($categories) ? $categories[0]->name : 'Technology';
        
        echo '<meta property="og:type" content="article" />' . "\n";
        echo '<meta property="og:title" content="' . esc_attr($title) . '" />' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($excerpt) . '" />' . "\n";
        echo '<meta property="og:url" content="' . esc_url($permalink) . '" />' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr($site_name) . '" />' . "\n";
        echo '<meta property="og:locale" content="en_US" />' . "\n";
        
        // Article-specific meta
        echo '<meta property="article:published_time" content="' . esc_attr($publish_date) . '" />' . "\n";
        echo '<meta property="article:modified_time" content="' . esc_attr($modified_date) . '" />' . "\n";
        echo '<meta property="article:author" content="' . esc_attr($author_name) . '" />' . "\n";
        echo '<meta property="article:section" content="' . esc_attr($primary_category) . '" />' . "\n";
        
        // Tags as keywords
        $tags = wp_get_post_tags($post_id, array('fields' => 'names'));
        if (!empty($tags)) {
            echo '<meta property="article:tag" content="' . esc_attr(implode(',', $tags)) . '" />' . "\n";
        }
        
        // Images
        if (has_post_thumbnail()) {
            $thumb_url = get_the_post_thumbnail_url(get_the_ID(), 'full');
            echo '<meta property="og:image" content="' . esc_url($thumb_url) . '" />' . "\n";
            echo '<meta property="og:image:width" content="1200" />' . "\n";
            echo '<meta property="og:image:height" content="630" />' . "\n";
            echo '<meta property="og:image:alt" content="' . esc_attr($title) . '" />' . "\n";
            echo '<meta property="og:image:type" content="image/jpeg" />' . "\n";
        } else {
            echo '<meta property="og:image" content="' . esc_url(home_url('/default-featured-image.jpg')) . '" />' . "\n";
            echo '<meta property="og:image:width" content="1200" />' . "\n";
            echo '<meta property="og:image:height" content="630" />' . "\n";
        }
        
        // Twitter Card
        echo '<meta name="twitter:card" content="summary_large_image" />' . "\n";
        echo '<meta name="twitter:site" content="@dastgeertech" />' . "\n";
        echo '<meta name="twitter:creator" content="@dastgeertech" />' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '" />' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr($excerpt) . '" />' . "\n";
        if (has_post_thumbnail()) {
            echo '<meta name="twitter:image" content="' . esc_url(get_the_post_thumbnail_url(get_the_ID(), 'full')) . '" />' . "\n";
            echo '<meta name="twitter:image:alt" content="' . esc_attr($title) . '" />' . "\n";
        }
        
        // Additional SEO meta
        echo '<meta name="description" content="' . esc_attr($excerpt) . '" />' . "\n";
    }
    
    public function add_content_schema($content) {
        if (!is_single() || !get_option('dastgeer_schema_markup', '1')) return $content;
        return $content;
    }
    
    // ==========================================
    // SITEMAPS
    // ==========================================
    public function add_query_vars($vars) {
        $vars[] = 'dastgeer_sitemap';
        $vars[] = 'dastgeer_robots';
        return $vars;
    }
    
    public function handle_sitemaps_early() {
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        
        if (preg_match('/news-sitemap\.xml/i', $uri) && get_option('dastgeer_news_sitemap', '1')) {
            $this->output_news_sitemap();
            exit;
        }
        
        if (preg_match('/main-sitemap\.xml/i', $uri)) {
            $this->output_main_sitemap();
            exit;
        }
        
        if (preg_match('/^robots\.txt/i', $uri)) {
            $this->output_robots_txt();
            exit;
        }
    }
    
    public function handle_sitemap_requests() {
        global $wp_query;
        
        if (isset($wp_query->query_vars['dastgeer_sitemap'])) {
            if ($wp_query->query_vars['dastgeer_sitemap'] === 'news' && get_option('dastgeer_news_sitemap', '1')) {
                $this->output_news_sitemap();
            } elseif ($wp_query->query_vars['dastgeer_sitemap'] === 'main') {
                $this->output_main_sitemap();
            }
            exit;
        }
        
        if (isset($wp_query->query_vars['dastgeer_robots'])) {
            $this->output_robots_txt();
            exit;
        }
    }
    
    private function output_news_sitemap() {
        header('Content-Type: application/xml; charset=utf-8');
        echo '<?xml version="1.0" encoding="UTF-8"?>';
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">';
        
        $posts = new WP_Query(array(
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => 1000,
            'orderby' => 'date',
            'order' => 'DESC'
        ));
        
        if ($posts->have_posts()) {
            while ($posts->have_posts()) {
                $posts->the_post();
                echo '<url>';
                echo '<loc>' . get_permalink() . '</loc>';
                echo '<news:news><news:publication><news:name>Dastgeer Tech</news:name><news:language>en</news:language></news:publication>';
                echo '<news:publication_date>' . get_the_date('Y-m-d') . '</news:publication_date>';
                echo '<news:title>' . htmlspecialchars(get_the_title()) . '</news:title>';
                echo '</news:news></url>';
            }
            wp_reset_postdata();
        }
        
        echo '</urlset>';
        exit;
    }
    
    private function output_main_sitemap() {
        header('Content-Type: application/xml; charset=utf-8');
        echo '<?xml version="1.0" encoding="UTF-8"?>';
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">';
        
        echo '<url><loc>' . home_url('/') . '</loc><changefreq>daily</changefreq><priority>1.0</priority></url>';
        
        $categories = get_categories(array('hide_empty' => true));
        foreach ($categories as $cat) {
            echo '<url><loc>' . get_category_link($cat->term_id) . '</loc><changefreq>daily</changefreq><priority>0.8</priority></url>';
        }
        
        $posts = new WP_Query(array(
            'post_type' => array('post', 'page'),
            'post_status' => 'publish',
            'posts_per_page' => 2000
        ));
        
        if ($posts->have_posts()) {
            while ($posts->have_posts()) {
                $posts->the_post();
                echo '<url><loc>' . get_permalink() . '</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>';
            }
            wp_reset_postdata();
        }
        
        echo '</urlset>';
        exit;
    }
    
    private function output_robots_txt() {
        header('Content-Type: text/plain; charset=utf-8');
        $site_url = home_url();
        echo "User-agent: *\n";
        echo "Allow: /\n";
        echo "Disallow: /wp-admin/\n";
        echo "Disallow: /wp-content/plugins/\n";
        echo "Sitemap: $site_url/news-sitemap.xml\n";
        echo "Sitemap: $site_url/main-sitemap.xml\n";
        exit;
    }
    
    // ==========================================
    // LOGGING
    // ==========================================
    private function log($message) {
        $log = get_option('dastgeer_log', '');
        $log .= '[' . date('Y-m-d H:i:s') . '] ' . $message . "\n";
        $log = substr($log, -5000); // Keep last 5KB
        update_option('dastgeer_log', $log);
    }
}

// Initialize plugin
function dastgeer_auto_poster_init() {
    return Dastgeer_Tech_Auto_Poster::get_instance();
}
add_action('plugins_loaded', 'dastgeer_auto_poster_init');

// ==========================================
// SHORTCODES
// ==========================================
add_shortcode('dastgeer_status', function() {
    $last = get_option('dastgeer_last_post_time', 'Never');
    return '<div class="dastgeer-status">Last auto-post: ' . $last . '</div>';
});

add_shortcode('dastgeer_post_count', function() {
    $count = wp_count_posts();
    return '<div class="dastgeer-count">Total posts: ' . $count->publish . '</div>';
});
?>
