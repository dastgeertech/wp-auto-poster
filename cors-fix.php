<?php
/**
 * Plugin Name: CORS Fix & AI Proxy for WP Auto Poster
 * Description: Adds CORS headers and proxy endpoints for ALL AI APIs (Claude, Gemini, OpenAI, Groq, Mistral, Grok)
 * Version: 2.0
 */

// CORS Headers
add_filter('rest_pre_serve_request', function($response) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce, X-API-Key, X-Claude-Key, X-Gemini-Key, X-OpenAI-Key, X-Groq-Key, X-Mistral-Key, X-Grok-Key');
    header('Access-Control-Max-Age: 3600');
    return $response;
});

add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_api_cors_add_headers_to_preflight', 99);
}, 99);

// =====================
// CLAUDE (ANTHROPIC) PROXY - SECURE
// =====================
add_action('rest_api_init', function() {
    register_rest_route('wp-auto-poster/v1', '/proxy/claude', array(
        'methods' => 'POST',
        'callback' => 'wp_auto_poster_claude_proxy',
        'permission_callback' => '__return_true',
    ));
});

function wp_auto_poster_claude_proxy($request) {
    $api_key = $request->get_header('X-Claude-Key');
    
    if (empty($api_key)) {
        $settings = get_option('wp_auto_poster_settings', array());
        $api_key = isset($settings['claude_api_key']) ? $settings['claude_api_key'] : '';
    }
    
    if (empty($api_key)) {
        return new WP_Error('no_api_key', 'Claude API key not configured', array('status' => 400));
    }
    
    $body = $request->get_json_body();
    $model = isset($body['model']) ? $body['model'] : 'claude-sonnet-4-5-20251120';
    
    $api_url = 'https://api.anthropic.com/v1/messages';
    
    $response = wp_remote_post($api_url, array(
        'headers' => array(
            'Content-Type' => 'application/json',
            'x-api-key' => $api_key,
            'anthropic-version' => '2023-06-01',
        ),
        'body' => json_encode($body),
        'timeout' => 120,
    ));
    
    if (is_wp_error($response)) {
        return new WP_Error('api_error', $response->get_error_message(), array('status' => 500));
    }
    
    $response_code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    // Log errors but return the response
    if ($response_code >= 400) {
        error_log('Claude API Error: ' . json_encode($data));
    }
    
    return new WP_REST_Response($data, $response_code);
}

// =====================
// GEMINI PROXY
// =====================
add_action('rest_api_init', function() {
    register_rest_route('wp-auto-poster/v1', '/proxy/gemini', array(
        'methods' => 'POST',
        'callback' => 'wp_auto_poster_gemini_proxy',
        'permission_callback' => '__return_true',
    ));
});

function wp_auto_poster_gemini_proxy($request) {
    $api_key = $request->get_header('X-Gemini-Key');
    
    if (empty($api_key)) {
        $settings = get_option('wp_auto_poster_settings', array());
        $api_key = isset($settings['gemini_api_key']) ? $settings['gemini_api_key'] : '';
    }
    
    if (empty($api_key)) {
        return new WP_Error('no_api_key', 'Gemini API key not configured', array('status' => 400));
    }
    
    $body = $request->get_json_body();
    $model = isset($body['model']) ? $body['model'] : 'gemini-2.5-flash';
    
    $api_url = "https://generativelanguage.googleapis.com/v1/models/{$model}:generateContent?key={$api_key}";
    
    $response = wp_remote_post($api_url, array(
        'headers' => array(
            'Content-Type' => 'application/json',
        ),
        'body' => json_encode($body),
        'timeout' => 60,
    ));
    
    if (is_wp_error($response)) {
        return new WP_Error('api_error', $response->get_error_message(), array('status' => 500));
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    return new WP_REST_Response($data, wp_remote_retrieve_response_code($response));
}

// =====================
// OPENAI PROXY
// =====================
add_action('rest_api_init', function() {
    register_rest_route('wp-auto-poster/v1', '/proxy/openai', array(
        'methods' => 'POST',
        'callback' => 'wp_auto_poster_openai_proxy',
        'permission_callback' => '__return_true',
    ));
});

function wp_auto_poster_openai_proxy($request) {
    $api_key = $request->get_header('X-OpenAI-Key');
    
    if (empty($api_key)) {
        $settings = get_option('wp_auto_poster_settings', array());
        $api_key = isset($settings['openai_api_key']) ? $settings['openai_api_key'] : '';
    }
    
    if (empty($api_key)) {
        return new WP_Error('no_api_key', 'OpenAI API key not configured', array('status' => 400));
    }
    
    $body = $request->get_json_body();
    
    $response = wp_remote_post('https://api.openai.com/v1/chat/completions', array(
        'headers' => array(
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $api_key,
        ),
        'body' => json_encode($body),
        'timeout' => 60,
    ));
    
    if (is_wp_error($response)) {
        return new WP_Error('api_error', $response->get_error_message(), array('status' => 500));
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    return new WP_REST_Response($data, wp_remote_retrieve_response_code($response));
}

// =====================
// GROQ PROXY
// =====================
add_action('rest_api_init', function() {
    register_rest_route('wp-auto-poster/v1', '/proxy/groq', array(
        'methods' => 'POST',
        'callback' => 'wp_auto_poster_groq_proxy',
        'permission_callback' => '__return_true',
    ));
});

function wp_auto_poster_groq_proxy($request) {
    $api_key = $request->get_header('X-Groq-Key');
    
    if (empty($api_key)) {
        $settings = get_option('wp_auto_poster_settings', array());
        $api_key = isset($settings['groq_api_key']) ? $settings['groq_api_key'] : '';
    }
    
    if (empty($api_key)) {
        return new WP_Error('no_api_key', 'Groq API key not configured', array('status' => 400));
    }
    
    $body = $request->get_json_body();
    
    $response = wp_remote_post('https://api.groq.com/openai/v1/chat/completions', array(
        'headers' => array(
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $api_key,
        ),
        'body' => json_encode($body),
        'timeout' => 60,
    ));
    
    if (is_wp_error($response)) {
        return new WP_Error('api_error', $response->get_error_message(), array('status' => 500));
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    return new WP_REST_Response($data, wp_remote_retrieve_response_code($response));
}

// =====================
// MISTRAL PROXY
// =====================
add_action('rest_api_init', function() {
    register_rest_route('wp-auto-poster/v1', '/proxy/mistral', array(
        'methods' => 'POST',
        'callback' => 'wp_auto_poster_mistral_proxy',
        'permission_callback' => '__return_true',
    ));
});

function wp_auto_poster_mistral_proxy($request) {
    $api_key = $request->get_header('X-Mistral-Key');
    
    if (empty($api_key)) {
        $settings = get_option('wp_auto_poster_settings', array());
        $api_key = isset($settings['mistral_api_key']) ? $settings['mistral_api_key'] : '';
    }
    
    if (empty($api_key)) {
        return new WP_Error('no_api_key', 'Mistral API key not configured', array('status' => 400));
    }
    
    $body = $request->get_json_body();
    
    $response = wp_remote_post('https://api.mistral.ai/v1/chat/completions', array(
        'headers' => array(
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $api_key,
        ),
        'body' => json_encode($body),
        'timeout' => 60,
    ));
    
    if (is_wp_error($response)) {
        return new WP_Error('api_error', $response->get_error_message(), array('status' => 500));
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    return new WP_REST_Response($data, wp_remote_retrieve_response_code($response));
}

// =====================
// GROK (xAI) PROXY
// =====================
add_action('rest_api_init', function() {
    register_rest_route('wp-auto-poster/v1', '/proxy/grok', array(
        'methods' => 'POST',
        'callback' => 'wp_auto_poster_grok_proxy',
        'permission_callback' => '__return_true',
    ));
});

function wp_auto_poster_grok_proxy($request) {
    $api_key = $request->get_header('X-Grok-Key');
    
    if (empty($api_key)) {
        $settings = get_option('wp_auto_poster_settings', array());
        $api_key = isset($settings['grok_api_key']) ? $settings['grok_api_key'] : '';
    }
    
    if (empty($api_key)) {
        return new WP_Error('no_api_key', 'Grok API key not configured', array('status' => 400));
    }
    
    $body = $request->get_json_body();
    
    $response = wp_remote_post('https://api.x.ai/v1/chat/completions', array(
        'headers' => array(
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $api_key,
        ),
        'body' => json_encode($body),
        'timeout' => 60,
    ));
    
    if (is_wp_error($response)) {
        return new WP_Error('api_error', $response->get_error_message(), array('status' => 500));
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    return new WP_REST_Response($data, wp_remote_retrieve_response_code($response));
}

// =====================
// SAVE/GET SETTINGS
// =====================
add_action('rest_api_init', function() {
    register_rest_route('wp-auto-poster/v1', '/settings', array(
        'methods' => 'POST',
        'callback' => 'wp_auto_poster_save_settings',
        'permission_callback' => '__return_true',
    ));
    
    register_rest_route('wp-auto-poster/v1', '/settings', array(
        'methods' => 'GET',
        'callback' => 'wp_auto_poster_get_settings',
        'permission_callback' => '__return_true',
    ));
});

function wp_auto_poster_save_settings($request) {
    $settings = $request->get_json_body();
    update_option('wp_auto_poster_settings', $settings, true);
    return new WP_REST_Response(array('success' => true), 200);
}

function wp_auto_poster_get_settings($request) {
    $settings = get_option('wp_auto_poster_settings', array());
    $safe_settings = array();
    foreach ($settings as $key => $value) {
        if (strpos($key, 'api_key') !== false && !empty($value)) {
            $safe_settings[$key] = substr($value, 0, 8) . '...' . substr($value, -4);
        } else {
            $safe_settings[$key] = $value;
        }
    }
    return new WP_REST_Response($safe_settings, 200);
}
