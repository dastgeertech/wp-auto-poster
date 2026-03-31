/**
 * Dastgeer SEO Premium Admin JavaScript
 */

(function ($) {
  'use strict';

  const DstSEO = {
    init: function () {
      this.bindEvents();
      this.initScoreCircle();
      this.updateCharCounts();
    },

    bindEvents: function () {
      // Character count updates
      $(document).on('input', '#dstseo_meta_title', this.updateTitleCount.bind(this));
      $(document).on('input', '#dstseo_meta_description', this.updateDescCount.bind(this));

      // AI Tools
      $(document).on('click', '#dstseo_analyze_btn', this.analyzeContent.bind(this));
      $(document).on('click', '#dstseo_generate_title_btn', this.generateTitle.bind(this));
      $(document).on('click', '#dstseo_generate_desc_btn', this.generateDescription.bind(this));
      $(document).on('click', '#dstseo_optimize_btn', this.autoOptimize.bind(this));

      // Create redirect from 404
      $(document).on('click', '.dstseo-create-redirect', this.openRedirectModal.bind(this));
      $(document).on('click', '.dstseo-delete-redirect', this.deleteRedirect.bind(this));
      $(document).on('click', '.dstseo-clear-404', this.clear404Log.bind(this));

      // Export settings
      $(document).on('click', '#dstseo_export_settings', this.exportSettings.bind(this));

      // Live preview updates
      $(document).on('input', '#dstseo_meta_title', this.updateGooglePreview.bind(this));
      $(document).on('input', '#dstseo_meta_description', this.updateGooglePreview.bind(this));
    },

    updateCharCounts: function () {
      this.updateTitleCount();
      this.updateDescCount();
    },

    updateTitleCount: function () {
      var count = $('#dstseo_meta_title').val().length;
      $('#title_count').text(count);
      if (count > 60) {
        $('#title_count').css('color', '#d9534f');
      } else if (count < 40) {
        $('#title_count').css('color', '#f0ad4e');
      } else {
        $('#title_count').css('color', '#28a745');
      }
    },

    updateDescCount: function () {
      var count = $('#dstseo_meta_description').val().length;
      $('#desc_count').text(count);
      if (count > 160) {
        $('#desc_count').css('color', '#d9534f');
      } else if (count < 100) {
        $('#desc_count').css('color', '#f0ad4e');
      } else {
        $('#desc_count').css('color', '#28a745');
      }
    },

    updateGooglePreview: function () {
      var title =
        $('#dstseo_meta_title').val() || $('#dstseo_meta_title').attr('placeholder') || '';
      var desc = $('#dstseo_meta_description').val() || 'Add a meta description to see preview...';
      var url = $('#dstseo_canonical_url').val() || dstseo_ajax.home_url;

      $('.preview-title').text(title);
      $('.preview-description').text(desc);
    },

    initScoreCircle: function () {
      var score = $('.dstseo-score-circle').data('score') || 0;
      var percentage = score;
      $('.dstseo-score-circle').css('--score', percentage + '%');

      if (score >= 80) {
        $('.dstseo-score-circle').css(
          'background',
          'conic-gradient(#1e7e34 ' + percentage + '%, #e2e4e7 ' + percentage + '%)',
        );
      } else if (score >= 60) {
        $('.dstseo-score-circle').css(
          'background',
          'conic-gradient(#f0ad4e ' + percentage + '%, #e2e4e7 ' + percentage + '%)',
        );
      } else {
        $('.dstseo-score-circle').css(
          'background',
          'conic-gradient(#d9534f ' + percentage + '%, #e2e4e7 ' + percentage + '%)',
        );
      }
    },

    analyzeContent: function (e) {
      e.preventDefault();
      var $btn = $(e.currentTarget);
      var $loading = $btn.siblings('.dstseo-ai-loading');

      $btn.prop('disabled', true);
      $loading.show();

      var postId = $('#post_ID').val() || 0;

      $.ajax({
        url: dstseo_ajax.ajax_url,
        type: 'POST',
        data: {
          action: 'dstseo_analyze_content',
          nonce: dstseo_ajax.nonce,
          post_id: postId,
        },
        success: function (response) {
          if (response.success) {
            var data = response.data;

            // Update scores
            $('.dstseo-score-circle').attr('data-score', data.total_score);
            $('.dstseo-score-circle .score-value').text(data.total_score);
            DstSEO.initScoreCircle();

            // Update breakdown
            $('.score-item')
              .eq(0)
              .find('.item-score')
              .text(data.title_score + '/10');
            $('.score-item')
              .eq(1)
              .find('.item-score')
              .text(data.desc_score + '/10');
            $('.score-item')
              .eq(2)
              .find('.item-score')
              .text(data.content_score + '/10');
            $('.score-item')
              .eq(3)
              .find('.item-score')
              .text(data.headings_score + '/10');
            $('.score-item')
              .eq(4)
              .find('.item-score')
              .text(data.images_score + '/10');
            $('.score-item')
              .eq(5)
              .find('.item-score')
              .text(data.links_score + '/10');

            // Update checklist
            var checklist = [
              { has: data.has_title, text: 'SEO Title (50-60 characters)' },
              { has: data.has_meta_desc, text: 'Meta Description (120-160 characters)' },
              { has: data.has_focus_keyword, text: 'Focus Keyword' },
              { has: data.has_h1, text: 'H1 Tag Present' },
              { has: data.has_images, text: 'Images with Alt Text' },
              { has: data.has_internal_links, text: 'Internal Links' },
              { has: data.has_external_links, text: 'External Links' },
              { has: data.has_schema, text: 'Schema Markup' },
            ];

            $('.dstseo-checklist li').each(function (i) {
              if (checklist[i]) {
                var $li = $(this);
                $li.removeClass('pass fail').addClass(checklist[i].has ? 'pass' : 'fail');
                $li.find('.icon').text(checklist[i].has ? '✓' : '✗');
              }
            });

            alert(
              'Analysis Complete! Score: ' +
                data.total_score +
                '/100\n\n' +
                'Word Count: ' +
                data.word_count +
                '\n' +
                'Images: ' +
                data.image_count +
                '\n' +
                'Internal Links: ' +
                data.internal_link_count +
                '\n' +
                'External Links: ' +
                data.external_link_count,
            );
          }
        },
        error: function () {
          alert('Analysis failed. Please try again.');
        },
        complete: function () {
          $btn.prop('disabled', false);
          $loading.hide();
        },
      });
    },

    generateTitle: function (e) {
      e.preventDefault();
      var $btn = $(e.currentTarget);
      var postId = $('#post_ID').val() || 0;

      $btn.prop('disabled', true);

      $.ajax({
        url: dstseo_ajax.ajax_url,
        type: 'POST',
        data: {
          action: 'dstseo_generate_meta',
          nonce: dstseo_ajax.nonce,
          post_id: postId,
          type: 'title',
        },
        success: function (response) {
          if (response.success && response.data.meta_title) {
            $('#dstseo_meta_title').val(response.data.meta_title).trigger('input');
            alert('SEO Title Generated!\n\n' + response.data.meta_title);
          }
        },
        complete: function () {
          $btn.prop('disabled', false);
        },
      });
    },

    generateDescription: function (e) {
      e.preventDefault();
      var $btn = $(e.currentTarget);
      var postId = $('#post_ID').val() || 0;

      $btn.prop('disabled', true);

      $.ajax({
        url: dstseo_ajax.ajax_url,
        type: 'POST',
        data: {
          action: 'dstseo_generate_meta',
          nonce: dstseo_ajax.nonce,
          post_id: postId,
          type: 'description',
        },
        success: function (response) {
          if (response.success && response.data.meta_description) {
            $('#dstseo_meta_description').val(response.data.meta_description).trigger('input');
            alert('Meta Description Generated!\n\n' + response.data.meta_description);
          }
        },
        complete: function () {
          $btn.prop('disabled', false);
        },
      });
    },

    autoOptimize: function (e) {
      e.preventDefault();
      var $btn = $(e.currentTarget);
      var $loading = $btn.siblings('.dstseo-ai-loading');

      $btn.prop('disabled', true);
      $loading.show();

      // First analyze, then generate title and description
      var postId = $('#post_ID').val() || 0;

      $.ajax({
        url: dstseo_ajax.ajax_url,
        type: 'POST',
        data: {
          action: 'dstseo_generate_meta',
          nonce: dstseo_ajax.nonce,
          post_id: postId,
          type: 'title',
        },
        success: function (response) {
          if (response.success && response.data.meta_title) {
            $('#dstseo_meta_title').val(response.data.meta_title);
          }
        },
      })
        .then(function () {
          return $.ajax({
            url: dstseo_ajax.ajax_url,
            type: 'POST',
            data: {
              action: 'dstseo_generate_meta',
              nonce: dstseo_ajax.nonce,
              post_id: postId,
              type: 'description',
            },
          });
        })
        .then(function (response) {
          if (response.success && response.data.meta_description) {
            $('#dstseo_meta_description').val(response.data.meta_description);
          }
          DstSEO.updateCharCounts();
          alert(
            'Auto-Optimization Complete!\n\nPlease review the generated title and description.',
          );
        })
        .always(function () {
          $btn.prop('disabled', false);
          $loading.hide();
        });
    },

    openRedirectModal: function (e) {
      e.preventDefault();
      var url = $(e.currentTarget).data('url');
      var promptText = 'Create redirect for:\n' + url + '\n\nEnter the destination URL:';
      var newUrl = prompt(promptText, dstseo_ajax.home_url);

      if (newUrl) {
        DstSEO.saveRedirect(url, newUrl, 301);
      }
    },

    saveRedirect: function (oldUrl, newUrl, statusCode) {
      $.ajax({
        url: dstseo_ajax.ajax_url,
        type: 'POST',
        data: {
          action: 'dstseo_save_redirect',
          nonce: dstseo_ajax.nonce,
          old_url: oldUrl,
          new_url: newUrl,
          status_code: statusCode,
        },
        success: function (response) {
          if (response.success) {
            alert('Redirect created successfully!');
            location.reload();
          } else {
            alert('Error: ' + (response.data.message || 'Failed to create redirect'));
          }
        },
      });
    },

    deleteRedirect: function (e) {
      e.preventDefault();
      if (!confirm('Are you sure you want to delete this redirect?')) {
        return;
      }

      var $btn = $(e.currentTarget);
      var id = $btn.data('id');

      $.ajax({
        url: dstseo_ajax.ajax_url,
        type: 'POST',
        data: {
          action: 'dstseo_delete_redirect',
          nonce: dstseo_ajax.nonce,
          id: id,
        },
        success: function (response) {
          if (response.success) {
            $btn.closest('tr').fadeOut(300, function () {
              $(this).remove();
            });
          } else {
            alert('Error deleting redirect');
          }
        },
      });
    },

    clear404Log: function (e) {
      e.preventDefault();
      if (!confirm('Are you sure you want to clear all 404 logs?')) {
        return;
      }

      $.ajax({
        url: dstseo_ajax.ajax_url,
        type: 'POST',
        data: {
          action: 'dstseo_clear_404_log',
          nonce: dstseo_ajax.nonce,
        },
        success: function (response) {
          if (response.success) {
            alert('404 logs cleared!');
            location.reload();
          } else {
            alert('Error clearing 404 logs');
          }
        },
      });
    },

    exportSettings: function (e) {
      e.preventDefault();

      var $btn = $(e.currentTarget);
      $btn.prop('disabled', true).text('Exporting...');

      window.location.href =
        dstseo_ajax.ajax_url + '?action=dstseo_export_settings&nonce=' + dstseo_ajax.nonce;

      setTimeout(function () {
        $btn.prop('disabled', false).text('Export Settings');
      }, 2000);
    },
  };

  // Initialize on document ready
  $(document).ready(function () {
    DstSEO.init();
  });

  // Expose to global scope
  window.DstSEO = DstSEO;
})(jQuery);
