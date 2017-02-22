/**
 * js-select
 */
(function ($) {
	/**
	 * js-select main class
	 */
	window.select = {
		/**
		 * Default settings
		 */
		settings: {
			// Max number of named options to show in label (if more options are select "X selected" will be shown)
			maxOptionsInLabel     : 3,
			// Modifier for container width (width will be multiplied by this number (2 equals double and 0.5 equals half size)
			containerWidthModifier: 1
		},

		/**
		 * Counter for selects
		 */
		counter: 1,

		/**
		 * Language translations
		 */
		ln: {
			'oneOptionSelected'      : 'selected',
			'multipleOptionsSelected': 'selected',
			'defaultPlaceholder'     : 'Click to choose'
		},

		/**
		 * Initialize js-select for the given element(s), with given settings
		 *
		 * @param settings
		 * @returns {*}
		 */
		init: function (settings) {
			// Loop through each matched element
			return this.each(function () {
				// Get select element
				var $select = $(this);

				// Merge default settings with provided settings, and save to element
				$select.data('js-select.settings', $.extend({}, select.settings, settings));

				// If element is not a select
				if ($select.prop('tagName') != 'SELECT') {
					// Return error
					return $.error('js-select only applies to <SELECT> elements not <' + $select.prop('tagName') + '>');
				}

				if (!$select.data('js-select.initialized')) {
					// Add class to select
					$select.addClass('js-select-original');

					// Save default selected value on the select
					$select.data('default-selected', $select.val());

					// Save number on select
					$select.data('js-select.no', select.counter);

					// Mark select as initialize
					$select.data('js-select.initialized', true);

					// Build select
					select._build($select);

					// Bind events
					select._bindEvents();

					// !!! Experimental !!!
					// Add mutation observer, for detecting DOM changes
					// @todo Need to detect value changes (without detecting itself changing value)
					var mutationObserver = window.MutationObserver || window.WebKitMutationObserver;
					if (mutationObserver) {
						new mutationObserver(function (mutations) {
							$(mutations[0].target).select('update');
						}).observe($select[0], {
							childList: true
						});
					}

					// Increment counter
					select.counter++;
				}
			});
		},

		/**
		 * Update js-select for the given element(s)
		 *
		 * @returns {*}
		 */
		update: function () {
			// Loop through each matched element
			return this.each(function () {
				// Get select element
				var $select = $(this);

				// Set default selected value
				// $select.val($select.data('default-selected'));

				// Build options
				select._buildOptions($select);

				// Update labels
				select._updateLabel($select);
			});
		},

		/**
		 * Open js-select for the given element(s)
		 *
		 * @returns {*}
		 */
		open: function () {
			// Loop through each matched element
			return this.each(function () {
				// Get select element
				var $select = $(this);

				// Get settings from select
				var settings = $select.data('js-select.settings');

				// Get trigger
				var $trigger = $select.data('js-select.trigger');

				// Get container
				var $container = $select.data('js-select.container');

				// Hide all other visible options
				$('.js-select-original').select('close');

				// If container is not visible
				if (!$container.is(':visible')) {
					// Show the container
					$container.show();

					// Add active class on the trigger
					$trigger.addClass('active');

					// Set focus to first element in the container
					$container.find('a').first().focus();

					// Resize the container
					var documentWidth = $(document).width();
					var triggerWidth  = $trigger.outerWidth(true);
					var triggerOffset = $trigger.offset();
					var width         = triggerWidth;
					if (settings.containerWidthModifier != 1) {
						if ((triggerOffset.left + (triggerWidth * settings.containerWidthModifier)) < documentWidth) {
							width = (triggerWidth * settings.containerWidthModifier);
						}
					}
					$container.css('width', width);

					// Trigger open event on the source element
					$trigger.data('js-select.source.element').trigger('open');
				}
			});
		},

		/**
		 * Close js-select for the given element(s)
		 *
		 * @returns {*}
		 */
		close: function () {
			// Loop through each matched element
			return this.each(function () {
				// Get select element
				var $select = $(this);

				// Get trigger
				var $trigger = $select.data('js-select.trigger');

				// Get container
				var $container = $select.data('js-select.container');

				// If container is visible
				if ($container.is(':visible')) {
					// Hide the container
					$container.hide();

					// Remove active class from trigger
					$trigger.removeClass('active');

					// Trigger close event on the select
					$select.trigger('close');
				}
			});
		},

		/**
		 * Toggle (open/close) js-select for the given element(s)
		 *
		 * @returns {*}
		 */
		toggle: function () {
			// Loop through each matched element
			return this.each(function () {
				// Get select element
				var $select = $(this);

				// Get container
				var $container = $select.data('js-select.container');

				// If container is visible
				if ($container.is(':visible')) {
					// Call close method
					$select.select('close');
				} else {
					// Call open method
					$select.select('open');
				}
			});
		},

		/**
		 * Build js-select for the given select
		 *
		 * @param $select
		 * @private
		 */
		_build: function ($select) {
			// Build trigger
			select._buildTrigger($select);

			// Build container
			select._buildContainer($select);

			// Build options
			select._buildOptions($select);

			// Update labels
			select._updateLabel($select);
		},

		/**
		 * Build trigger for js-select for the given select
		 *
		 * @param $select
		 * @private
		 */
		_buildTrigger: function ($select) {
			// Variable for trigger
			var $trigger;

			// If trigger has allready been created
			if ($select.data('js-select.trigger')) {
				// Get trigger
				$trigger = $select.data('js-select.trigger');
			} else {
				// Create trigger
				$trigger = $('<a>')
					.attr('href', 'javascript:void(0)')
					.attr('id', 'js-select-trigger-' + select.counter)
					.addClass('js-select-trigger')
					.css({
						width: $select.outerWidth(true)
					})
					.data('js-select.no', select.counter)
					.data('js-select.source.element', $select)
					.insertAfter($select);
			}

			// Create label
			var $triggerLabel = $('<span>')
				.addClass('js-select-trigger-label')
				.appendTo($trigger);

			// Create arrow
			var $triggerArrow = $('<span>')
				.addClass('js-select-trigger-arrow')
				.appendTo($trigger);

			// Create arrow inner
			var $triggerArrowInner = $('<span>')
				.addClass('js-select-trigger-arrow-inner')
				.appendTo($triggerArrow);

			// Check if element has a placeholder
			if ($select.data('placeholder')) {
				// Add placeholder and class to label
				$triggerLabel
					.html($select.data('placeholder'))
					.addClass('placeholder');
			} else {
				// Add default placeholder and class to label
				$triggerLabel
					.html(select.ln.defaultPlaceholder)
					.addClass('placeholder');
			}

			// Save trigger element on select
			$select.data('js-select.trigger', $trigger);
		},

		/**
		 * Build container for js-select for the given select
		 *
		 * @param $select
		 * @private
		 */
		_buildContainer: function ($select) {
			// Get trigger
			var $trigger = $select.data('js-select.trigger');

			// Variable for container
			var $container;

			// If container has allready been created
			if ($select.data('js-select.container')) {
				// Get container
				$container = $select.data('js-select.container');

				// Get inner container
				$container.children();
			} else {
				// Create container
				$container = $('<div>')
					.attr('id', 'js-select-container-' + select.counter)
					.addClass('js-select-container')
					.data('js-select.no', select.counter)
					.data('js-select.source.element', $select)
					.insertAfter($trigger);

				// Create inner container
				$('<div>')
					.addClass('js-select-container-inner')
					.appendTo($container);
			}

			// Save container element on select
			$select.data('js-select.container', $container);
		},

		/**
		 * Build options for js-select for the given select
		 *
		 * @param $select
		 * @private
		 */
		_buildOptions: function ($select) {
			// Get inner container
			var $containerInner = $select.data('js-select.container').find('.js-select-container-inner');

			// Make sure inner container is empty
			$containerInner.html('');

			// Loop through option groups and options
			$select.find('optgroup, option').each(function (index, element) {
				// Get element
				var $element = $(element);

				// If element is an <OPTGROUP>
				if ($element.prop('tagName') == 'OPTGROUP') {
					// Create and add group to container
					var $group = $('<a>')
						.attr('href', 'javascript:void(0)')
						.addClass('js-select-container-inner-group')
						.html($element.attr('label'))
						.appendTo($containerInner);

					if (!$select.attr('multiple')) {
						$group.on('click', function () {
							// Select/unselect all in group
						});
					}
				} else {
					// Create item and add to container
					var $item = $('<a>')
						.attr('href', 'javascript:void(0)')
						.addClass('js-select-container-inner-item')
						.html($element.text())
						.data('js-select.value', $element.val())
						.data('js-select.multiple', $select.attr('multiple'))
						.appendTo($containerInner);

					// If option is selected
					if ($element.prop('selected')) {
						// Add selected class to item
						$item.addClass('selected');
					}

					// If option is disabled
					if ($element.prop('disabled')) {
						// Add disabled class to item
						$item.addClass('disabled');
					}

					// If element has a title
					if ($element.attr('title') && $element.attr('title') != '') {
						// Append title to label as description
						$item.append('<span class="js-select-container-inner-item-description">' + $element.attr('title') + '</span>');
					}
				}
			});
		},

		/**
		 * Update js-select label for the given select
		 *
		 * @param $select
		 * @private
		 */
		_updateLabel: function ($select) {
			// Get settings from select
			var settings = $select.data('js-select.settings');

			// Get trigger element
			var $trigger = $select.data('js-select.trigger');

			// Get label
			var $label = $trigger.find('.js-select-trigger-label');

			// Get container
			var $container = $('#js-select-container-' + $trigger.data('js-select.no'));

			// Save original label, for later use
			if (typeof($label.data('js-select.original.label')) == 'undefined') {
				$label.data('js-select.original.label', $label.html());
			}

			// Get selected items
			var $selectedItems = $container.find('.selected');

			// Update label HTML and class
			if ($selectedItems.length > settings.maxOptionsInLabel) {
				$label.removeClass('placeholder').html($selectedItems.length + ' ' + ($selectedItems.length == 1 ? select.ln.oneOptionSelected : select.ln.multipleOptionsSelected));
			} else if ($selectedItems.length > 0 && $selectedItems.length <= settings.maxOptionsInLabel) {
				var html = '';
				$selectedItems.each(function (index, element) {
					if (html != '') {
						html += ', ';
					}
					html += $(element).clone().children().remove().end().text();
				});

				$label.removeClass('placeholder').html(html);
			} else {
				$label.addClass('placeholder').html($label.data('js-select.original.label'));
			}
		},

		/**
		 * Toggle a given item in js-select
		 *
		 * @param $item
		 * @private
		 */
		_toggleItem: function ($item) {
			// If item is disabled
			if ($item.hasClass('disabled')) {
				// Stop here
				return;
			}

			// Get container
			var $container = $item.parents('.js-select-container');

			// Get select
			var $select = $container.data('js-select.source.element');

			// If not multiple select
			if (!$select.attr('multiple')) {
				// Unselect all items
				$container.find('.selected').removeClass('selected');
			}

			// If item is selected
			if ($item.hasClass('selected')) {
				// Unselect
				$item.removeClass('selected');
			} else {
				// Select
				$item.addClass('selected');
			}

			// Update selected option on source element
			if ($select.attr('multiple')) {
				// Get selected items
				var $selectedItems = $container.find('.selected');

				// Get array with selected values
				var selectedValues = [];
				$selectedItems.each(function (index, element) {
					selectedValues.push($(element).data('js-select.value'));
				});

				// Variable to determine if selected index has been set
				var selectedIndex = false;

				// Loop through source elements options
				$select.find('option').each(function (index, element) {
					// If selected option value in is selected elements value
					if ($.inArray(element.value, selectedValues) !== -1) {
						// Set option to selected
						element.selected = true;

						// If selected index has not been set
						if (!selectedIndex) {
							// Set selected index on source element
							$select[0].selectedIndex = index;

							// Selected index has been set
							selectedIndex = true;
						}
					} else {
						// Set option to not selected
						element.selected = false;
					}
				});
			} else {
				// Get selected item
				var $selectedOption = $container.find('.selected');

				// Loop through source elements options
				$select.find('option').each(function (index, element) {
					// If selected option value equals option value
					if ($selectedOption.data('js-select.value') == element.value) {
						// Set option to selected
						element.selected = true;

						// Set selected index on source element
						$select[0].selectedIndex = index;
					} else {
						// Set option to not selected
						element.selected = false;
					}
				});
			}

			// Trigger change event on select element
			$select.trigger('change');

			// Update label
			select._updateLabel($select);

			// If not multiple select
			if (!$select.attr('multiple')) {
				// Hide options
				$select.select('close');
			}
		},

		/**
		 * Bind js-select events
		 *
		 * @private
		 */
		_bindEvents: function () {
			// Unbind events
			select._unbindEvents();

			// Bind all events to document
			$(document)
				.on('click.js-select', '.js-select-trigger', function () {
					// Trigger click
					$(this).data('js-select.source.element').select('toggle');

					return true;
				})
				.on('keypress.js-select', '.js-select-trigger', function (event) {
					// Trigger keypress
					if (event.keyCode == 0) {
						// Toggle select if space is pressed
						$(this).data('js-select.source.element').select('toggle');

						return true;
					}
				})
				.on('keypress.js-select', '.js-select-container-inner-group', function (event) {
					// "optgroup" keypress
					if (event.keyCode == 38) {
						// Arrow up
						event.preventDefault();
						event.stopPropagation();

						$(this).prev().focus();

						return true;
					}
					if (event.keyCode == 40) {
						// Arrow down
						event.preventDefault();
						event.stopPropagation();

						$(this).next().focus();

						return true;
					}
				})
				.on('keypress.js-select', '.js-select-container-inner-item', function (event) {
					// "option" keypress
					if (event.keyCode == 38) {
						// Arrow up
						event.preventDefault();
						event.stopPropagation();

						$(this).prev().focus();

						return true;
					}
					if (event.keyCode == 40) {
						// Arrow down
						event.preventDefault();
						event.stopPropagation();

						$(this).next().focus();

						return true;
					}
					if (event.keyCode == 0) {
						// Space
						event.preventDefault();
						event.stopPropagation();

						return select._toggleItem($(this));
					}
				})
				.on('click.js-select', '.js-select-container-inner-item', function (event) {
					// "option" click
					return select._toggleItem($(this));
				});
		},

		/**
		 * Unbind js-select event
		 *
		 * @private
		 */
		_unbindEvents: function () {
			// Unbind all events from document
			$(document).off('click.js-select').off('keypress.js-select');
		}
	};

	/**
	 * jquery plugin
	 *
	 * @param method
	 * @returns {*}
	 */
	$.fn.select = function (method) {
		if (select[method] && method.indexOf('_') === 0) {
			// If method exists, but is private
			return $.error('Method ' + method + ' in js-select is private');
		} else if (select[method]) {
			// If method exists, call method with arguments
			return select[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			// If object or no method is given, call initialize
			return select.init.apply(this, arguments);
		} else {
			// If method is not found
			return $.error('Method ' + method + ' does not exist on js-select');
		}
	};

	// Bind events to document
	$(document)
		.on('click touchstart', function (event) {
			// If we're not inside a trigger or option container
			if (!$(event.target).closest('.js-select-trigger').length && !$(event.target).closest('.js-select-container').length) {
				// Hide all visible options
				$('.js-select-container').each(function (index, element) {
					var $container = $(element);
					if ($container.is(':visible')) {
						$container.data('js-select.source.element').select('close');
					}
				});
			}
		})
		.on('keypress', function (event) {
			// If ESC key is pressed
			if (event.keyCode == 27) {
				// Hide all visible options
				$('.js-select-container').each(function (index, element) {
					var $container = $(element);
					if ($container.is(':visible')) {
						$container.data('js-select.source.element').select('close');
					}
				});
			}
		});
})(jQuery);
