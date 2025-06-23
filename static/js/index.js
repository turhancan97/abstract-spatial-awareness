window.HELP_IMPROVE_VIDEOJS = false;

var INTERP_BASE = "./static/interpolation/stacked";
var NUM_INTERP_FRAMES = 240;

var interp_images = [];
function preloadInterpolationImages() {
  for (var i = 0; i < NUM_INTERP_FRAMES; i++) {
    var path = INTERP_BASE + '/' + String(i).padStart(6, '0') + '.jpg';
    interp_images[i] = new Image();
    interp_images[i].src = path;
  }
}

function setInterpolationImage(i) {
  var image = interp_images[i];
  image.ondragstart = function() { return false; };
  image.oncontextmenu = function() { return false; };
  $('#interpolation-image-wrapper').empty().append(image);
}


$(document).ready(function() {
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");

    });

    var options = {
			slidesToScroll: 1,
			slidesToShow: 3,
			loop: true,
			infinite: true,
			autoplay: false,
			autoplaySpeed: 3000,
    }

		// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);

    // Loop on each carousel initialized
    for(var i = 0; i < carousels.length; i++) {
    	// Add listener to  event
    	carousels[i].on('before:show', state => {
    		console.log(state);
    	});
    }

    // Access to bulmaCarousel instance of an element
    var element = document.querySelector('#my-element');
    if (element && element.bulmaCarousel) {
    	// bulmaCarousel instance is available as element.bulmaCarousel
    	element.bulmaCarousel.on('before-show', function(state) {
    		console.log(state);
    	});
    }

    /*var player = document.getElementById('interpolation-video');
    player.addEventListener('loadedmetadata', function() {
      $('#interpolation-slider').on('input', function(event) {
        console.log(this.value, player.duration);
        player.currentTime = player.duration / 100 * this.value;
      })
    }, false);*/
    preloadInterpolationImages();

    $('#interpolation-slider').on('input', function(event) {
      setInterpolationImage(this.value);
    });
    setInterpolationImage(0);
    $('#interpolation-slider').prop('max', NUM_INTERP_FRAMES - 1);

    bulmaSlider.attach();

})

// === Unreal Engine Video Demo Section (Progressive Preload) ===
$(document).ready(function() {
  // Paths and frame counts (update these if your frame counts change)
  const OBSTACLE_PATH = './static/images/Occlusion/SM_vehCar_vehicle06_LOD_Original/';
  const OBSTACLE_PREFIX = 'objectcentric_orbit_';
  const OBSTACLE_DIGITS = 3;
  const OBSTACLE_EXT = '.jpg';
  const OBSTACLE_FRAME_COUNT = 59; // Update if more frames are added

  const BG_BASE = './static/images/Background Complexity/';
  const BG_TYPES = [
    { key: 'Frames_Orbit', label: 'Frames Orbit', prefix: 'objectcentric_orbit_', digits: 3, ext: '.jpg', frameCount: 539 },
    { key: 'Frames_Line', label: 'Frames Line', prefix: 'egocentric_fly_', digits: 3, ext: '.jpg', frameCount: 539 }
  ];
  const BG_LEVELS = [0, 1, 2, 3];
  const BG_MODEL = 'SM_vehCar_vehicle06_LOD_Original';

  // Spinner HTML
  const SPINNER_HTML = '<span class="icon is-large"><i class="fas fa-spinner fa-pulse fa-2x"></i></span>';

  // For progressive loading
  let currentFrames = [];
  let currentLoading = null;
  let currentFrameCount = 0;

  function cancelCurrentLoading() {
    if (currentLoading && typeof currentLoading.cancel === 'function') {
      currentLoading.cancel();
    }
    currentFrames = [];
    currentLoading = null;
    currentFrameCount = 0;
  }

  function progressivePreloadFrames(basePath, prefix, digits, ext, frameCount, imgId, sliderId, labelId, containerId) {
    cancelCurrentLoading();
    currentFrames = new Array(frameCount);
    currentFrameCount = frameCount;
    let cancelled = false;
    currentLoading = { cancel: () => { cancelled = true; } };

    // Show spinner for first frame
    $(`#${imgId}`).parent().html(`<div id="${imgId}-wrapper">${SPINNER_HTML}</div>`);
    $(`#${labelId}`).text(`Frame 1 / ${frameCount}`);

    function loadFrame(idx) {
      if (cancelled) return;
      const frameStr = String(idx).padStart(digits, '0');
      const img = new Image();
      img.onload = function() {
        currentFrames[idx] = img;
        // If this is the currently displayed frame, update it
        const sliderVal = parseInt($(`#${sliderId}`).val());
        if (sliderVal === idx) {
          $(`#${imgId}-wrapper`).empty().append(img);
        }
      };
      img.onerror = function() {
        // Optionally handle error
      };
      img.src = `${basePath}${prefix}${frameStr}${ext}`;
    }

    // Preload all frames progressively
    for (let i = 0; i < frameCount; i++) {
      loadFrame(i);
    }

    // Slider handler
    $(`#${sliderId}`).off('input').on('input', function() {
      const idx = parseInt(this.value);
      $(`#${labelId}`).text(`Frame ${idx+1} / ${frameCount}`);
      if (currentFrames[idx]) {
        $(`#${imgId}-wrapper`).empty().append(currentFrames[idx]);
      } else {
        $(`#${imgId}-wrapper`).html(SPINNER_HTML);
      }
    });

    // Show first frame as soon as it's loaded
    let checkFirstLoaded = setInterval(() => {
      if (cancelled) { clearInterval(checkFirstLoaded); return; }
      if (currentFrames[0]) {
        $(`#${imgId}-wrapper`).empty().append(currentFrames[0]);
        clearInterval(checkFirstLoaded);
      }
    }, 50);
  }

  function renderObstacleSlider() {
    cancelCurrentLoading();
    let html = `
      <div class="box">
        <h3 class="title is-5">Obstacle (Occlusion)</h3>
        <div class="has-text-centered mb-3"><div id="obstacle-frame-img-wrapper">${SPINNER_HTML}</div></div>
        <input id="obstacle-slider" class="slider is-fullwidth is-info" step="1" min="0" max="${OBSTACLE_FRAME_COUNT-1}" value="0" type="range">
        <div class="has-text-centered mt-2">
          <span id="obstacle-frame-label">Frame 1 / ${OBSTACLE_FRAME_COUNT}</span>
        </div>
      </div>
    `;
    $('#ue-video-dynamic-content').html(html);
    progressivePreloadFrames(
      OBSTACLE_PATH, OBSTACLE_PREFIX, OBSTACLE_DIGITS, OBSTACLE_EXT, OBSTACLE_FRAME_COUNT,
      'obstacle-frame-img', 'obstacle-slider', 'obstacle-frame-label', 'obstacle-frame-img-wrapper'
    );
  }

  function renderBgTypeSelector() {
    cancelCurrentLoading();
    let html = '<div class="box"><h3 class="title is-5">Background Complexity</h3>';
    html += '<div class="buttons is-centered mb-3">';
    BG_TYPES.forEach((type, i) => {
      html += `<button class="button is-link bg-type-btn" data-type="${type.key}">${type.label}</button>`;
    });
    html += '</div><div id="bg-level-selector"></div><div id="bg-slider-container"></div></div>';
    $('#ue-video-dynamic-content').html(html);
  }

  function renderBgLevelSelector(selectedTypeKey) {
    let html = '<div class="buttons is-centered mb-3">';
    BG_LEVELS.forEach(level => {
      html += `<button class="button is-info bg-level-btn" data-level="${level}">Level ${level}</button>`;
    });
    html += '</div>';
    $('#bg-level-selector').html(html);
    $('#bg-slider-container').empty();
  }

  function renderBgSlider(typeKey, level) {
    cancelCurrentLoading();
    const type = BG_TYPES.find(t => t.key === typeKey);
    const path = `${BG_BASE}${type.key}/level-${level}/${BG_MODEL}/`;
    let html = `
      <div class="has-text-centered mb-3"><div id="bg-frame-img-wrapper">${SPINNER_HTML}</div></div>
      <input id="bg-slider" class="slider is-fullwidth is-link" step="1" min="0" max="${type.frameCount-1}" value="0" type="range">
      <div class="has-text-centered mt-2">
        <span id="bg-frame-label">Frame 1 / ${type.frameCount}</span>
      </div>
    `;
    $('#bg-slider-container').html(html);
    progressivePreloadFrames(
      path, type.prefix, type.digits, type.ext, type.frameCount,
      'bg-frame-img', 'bg-slider', 'bg-frame-label', 'bg-frame-img-wrapper'
    );
  }

  // Main button handlers
  $('#btn-obstacle').on('click', function() {
    renderObstacleSlider();
  });
  $('#btn-bg-complexity').on('click', function() {
    renderBgTypeSelector();
  });

  // Delegate for dynamic content
  $('#ue-video-dynamic-content').on('click', '.bg-type-btn', function() {
    const typeKey = $(this).data('type');
    renderBgLevelSelector(typeKey);
    $('#bg-level-selector').data('selected-type', typeKey);
  });
  $('#ue-video-dynamic-content').on('click', '.bg-level-btn', function() {
    const level = $(this).data('level');
    const typeKey = $('#bg-level-selector').data('selected-type');
    renderBgSlider(typeKey, level);
  });
});
// === End Unreal Engine Video Demo Section (Progressive Preload) ===
