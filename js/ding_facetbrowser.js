/**
 * @file
 * Implementation of the facet browser front-end to make the facet collapsible.
 */
(function($) {

// Create facetbrowser widget
  $.widget( "ding.facetbrowser", {
    // default options
    options: {
      // callbacks
      change: null,
      random: null
    },
    
    // the constructor
    _create: function() {
      this.element
        // add a class for theming
        .addClass( "ding-facetbrowser" )
        // prevent double click to select text
        .disableSelection();
      
      this.FoldFacetGroup();
      // Wrap all facet fieldsets marked as hidden in a container so we can hide
      // em. The link text is show less and will be changed to show more if the
      // cookie is false.
      // Create show more link.
      this.showMoreBtn = $('<a />', {
        href: '#',
        text:  Drupal.t('Show less filters'),
        class: 'show-more expand expand-less'
      });
      // Create facet group wrapper.
      this.wrapper = $('<div />', {
        class: 'hidden-facets-group'
      });
      
      // Add the wrapper and link to the browser.
      var browser = $(this.element);
      browser.find('.js-hidden').wrapAll(this.wrapper);
      this.wrapper = browser.find('.hidden-facets-group');
      this.wrapper.after(this.showMoreBtn);
      
      // bind click events on the show more button to the random method
      this.showMoreBtn.click(this, this.showMore);
      
      // Check for click in checkbox, and execute search.
      $('.form-type-checkbox input', this.element).change(function(e) {
        Drupal.TingSearchOverlay();
        window.location = $(e.target).parent().find('a').attr('href');
      });
  
      // Check facet links for click events.
      $('.form-type-checkbox a', this.element).click(function(e) {
        Drupal.TingSearchOverlay();
      });
      
      // if the cookie plugin exists - Check the cookie.
      if ($.cookie && parseInt($.cookie('ding_factbrowers_groups_shown'), 10) === 1) {
        this.showMoreBtn.trigger('click');
      }
      
      this._refresh();
    },

    // called when created, and later when changing options
    _refresh: function() {
      // trigger a callback/event
      this._trigger( "change" );
    },
    showMore: function(evt) {
      evt.preventDefault();
      var $this = evt.data;
      
      // Toggle facts groups and update link/button text.
      $this.wrapper.toggle('fast', function () {
        var $cookieState = 0;
        // @todo: remove expand-less class since this is a default state and should be applied to the expand-facets class
        if($this.showMoreBtn.hasClass('expand-more')) {
          $this.showMoreBtn
            .text(Drupal.t('Show more filters'))
            .removeClass('expand-more')
            .addClass('expand-less');
          $cookieState = 1;
        } else {
          $this.showMoreBtn
            .text(Drupal.t('Show less filters'))
            .removeClass('expand-less')
            .addClass('expand-more');
        }
        if ($.cookie) {
          // Set cookie, so to remember if they where shown.
          $.cookie('ding_factbrowers_groups_shown', $cookieState);
        }
      });
    },
    FoldFacetGroup: function() {
      
      // Add show more button to each facet group and hide some terms.
      $('fieldset.form-wrapper', this.element).each(function() {
        var facetGroup = $(this),
          // Limit the number of visible terms in the group.
          number_of_terms = Drupal.settings.ding_facetbrowser.number_of_terms,
          terms_not_checked = $('.form-type-checkbox input:not(:checked)', facetGroup);
        
        if (terms_not_checked.size() > number_of_terms) {
          terms_not_checked.slice(number_of_terms).parent().hide();
        }
    
        // Add expand button, if there are more to show.
        if (terms_not_checked.length > number_of_terms) {
          facetGroup.append('<a href="javascript:void;" class="expand expand-more" id="expand_more">' + Drupal.t('Show more') + '</a>');
        }
    
        // Add some classes to checkbox wrappers.
        facetGroup.find('.form-type-checkbox input:checked').parent().addClass('selected-checkbox');
        facetGroup.find('.form-type-checkbox input:not(:checked)').parent().addClass('unselected-checkbox');
    
        // Add some div wrappers around selected and unselected checkboxes.
        facetGroup.find('.selected-checkbox').wrapAll('<div class="selected-checkbox-group" />');
        facetGroup.find('.unselected-checkbox').wrapAll('<div class="unselected-checkbox-group" />');
    
        // Add a unselect all link.
        if (facetGroup.find('.selected-checkbox-group').length) {
          facetGroup.find('.selected-checkbox-group').append('<a href="#" class="unselect">' + Drupal.t('Remove all selected') + '</a>');
        }
      });
    
      /**
      * Bind click function to show more and show less links.
      */
      $(this.element).delegate('.expand', 'click', function(evt) {
        evt.preventDefault();
    
        var clickedKey = this,
          facetGroup = $(clickedKey).parent(),
          number_of_terms = Drupal.settings.ding_facetbrowser.number_of_terms,
          unselectedSize = 0,
          checkboxSelector = '.form-type-checkbox.unselected-checkbox:' + (clickedKey.id == 'expand_more' ? 'hidden': 'visible');
    
        facetGroup.find(checkboxSelector).each(function(count, facetElement) {
          if (clickedKey.id == 'expand_more' && count < number_of_terms) {
            $(facetElement).slideDown('fast', function() {
              if (facetGroup.find('.form-type-checkbox.unselected-checkbox:visible').size() >= number_of_terms &&
                  facetGroup.find('#expand_less').size() === 0 &&
                  count % number_of_terms === 0) {
                facetGroup.append('<a href="javascript:void;" class="expand expand-less" id="expand_less">' + Drupal.t('Show less') + '</a>');
              }
            });
          }
          else if (clickedKey.id == 'expand_less' && count >= number_of_terms) {
            $(facetElement).slideUp('fast', function() {
              if (facetGroup.find('.form-type-checkbox.unselected-checkbox:visible').size() == number_of_terms &&
                  facetGroup.find('#expand_less:visible')) {
                facetGroup.find('#expand_less').fadeOut().remove();
              }
            });
          }
        });
        
        // Need to make sure we have the correct amount of unselected checkboxes to check against when wanting to remove the show more link.
        unselectedSize = facetGroup.attr('count')-facetGroup.find('.form-type-checkbox.selected-checkbox').size();
        if ((facetGroup.find('.form-type-checkbox.unselected-checkbox:visible').size() >= unselectedSize) && (clickedKey.id == 'expand_more')) {
          facetGroup.find('#expand_more').remove();
        }
        if (clickedKey.id == 'expand_less'){
          if (!(facetGroup.find('#expand_more').length)) {
            facetGroup.append('<a href="javascript:void;" class="expand expand-more" id="expand_more">' + Drupal.t('Show more') + '</a>');
          }
        }
      });
    
      /**
      * Bind click function to the unselect all selected checkboxes link.
      */
      $(this.element).delegate('.unselect', 'click', function(evt) {
        evt.preventDefault();
        
        var clickedKey = this,
          facetGroup = $(clickedKey).parent(),
          checkedFacets = '';
        $('.form-type-checkbox.selected-checkbox', facetGroup).each(function() {
          var element = $(this);
          // Un-check checkboxes (for the visual effect).
          element.find('input').click();
          
          // Find the facets to be deselected and generate new URL.
          var facetMatch = element.find('a').attr('href').match(/&facets\[\]=-facet.*/);
          checkedFacets += facetMatch[0];
          if (checkedFacets) {
            Drupal.TingSearchOverlay();
            window.location.href += checkedFacets;
          }
        });
      });
    },
    // events bound via _on are removed automatically
    // revert other modifications here
    _destroy: function() {
      // remove generated elements
      this.showMoreBtn.remove();
      $('fieldset.hidden', this.element).unwrap();
      this.element
        .removeClass('ding-facetbrowser')
        .enableSelection();
    },

    // _setOptions is called with a hash of all options that are changing
    // always refresh when changing options
    _setOptions: function() {
      // _super and _superApply handle keeping the right this-context
      this._superApply( arguments );
      this._refresh();
    },

    // _setOption is called for each individual option that is changing
    _setOption: function( key, value ) {
      this._super( key, value );
    }
  });
  
  Drupal.behaviors.ding_facetbrowser = {
    attach: function(context, settings) {
      $(Drupal.settings.ding_facetbrowser.selector, context).facetbrowser();
    }
  };
})(jQuery);