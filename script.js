document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('loader');
  document.body.classList.add('is-loading');

  // Handle Loader Fade Out
  const hideLoader = () => {
    if (loader && !loader.classList.contains('fade-out')) {
      loader.classList.add('fade-out');
      document.body.classList.remove('is-loading');
    }
  };

  // Failsafe: hide loader after 3.5 seconds even if everything hasn't loaded
  const loaderFailsafe = setTimeout(hideLoader, 3500);

  window.addEventListener('load', () => {
    clearTimeout(loaderFailsafe);
    // Small delay for smooth transition
    setTimeout(hideLoader, 500);
    
    // Preload other design images after main load to ensure smooth switching
    const dockItems = document.querySelectorAll('.nl-dock-item');
    dockItems.forEach(item => {
      const before = new Image();
      before.src = item.dataset.before;
      const after = new Image();
      after.src = item.dataset.after;
    });
  });

  const scrollLayer = document.getElementById('scroll-layer');
  const fixedLayer = document.getElementById('fixed-layer');
  const navLinks = document.querySelectorAll('.nav-link');

  // Page order and themes
  const pages = ['home', 'designs', 'contact'];
  const sectionThemes = {
    home: 'theme-blue',
    designs: 'theme-white',
    contact: 'theme-white',
  };

  let currentPageIndex = 0;
  let isTransitioning = false;

  // =============================================
  // BLUR SECTION TRANSITIONS
  // =============================================

  function setActivePage(index) {
    if (index < 0 || index >= pages.length) return;
    if (index === currentPageIndex && document.querySelector('.page-active')) return;
    if (isTransitioning) return;

    isTransitioning = true;

    const allPageEls = scrollLayer.querySelectorAll('main[id], section[id]');

    // Deactivate all pages and reset their reveals
    allPageEls.forEach(page => {
      page.classList.remove('page-active');
      page.querySelectorAll('.reveal').forEach(el => el.classList.remove('revealed'));
      // Reset any dynamic scroll styles
      page.style.filter = '';
      page.style.transform = '';
      page.style.opacity = '';
    });

    // Activate target page
    const targetPage = document.getElementById(pages[index]);
    targetPage.classList.add('page-active');

    currentPageIndex = index;

    // Update nav active state
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${pages[index]}`) {
        link.classList.add('active');
      }
    });

    // Update fixed-layer theme
    fixedLayer.className = `fixed-layer ${sectionThemes[pages[index]] || 'theme-blue'}`;

    // Trigger staggered reveals after blur-in begins
    setTimeout(() => {
      targetPage.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('revealed');
      });
    }, 250);

    // Allow next transition after animation completes
    setTimeout(() => {
      isTransitioning = false;
    }, 1200);
  }

  // Initialize — show page 1
  setActivePage(0);

  // =============================================
  // WHEEL EVENT — PAGE SWITCHING (SLOWER)
  // =============================================

  let wheelAccumulator = 0;
  const WHEEL_THRESHOLD = 300;
  let wheelTimeout = null;

  function updateScrollVisuals() {
    if (isTransitioning) return;
    const progress = Math.min(1, Math.abs(wheelAccumulator) / WHEEL_THRESHOLD);
    const currentPage = document.getElementById(pages[currentPageIndex]);
    if (currentPage) {
      // Map progress to blur (0-15px), scale (1-0.95), and slight opacity dip
      currentPage.style.filter = `blur(${progress * 15}px)`;
      currentPage.style.transform = `scale(${1 - (progress * 0.05)})`;
      currentPage.style.opacity = `${1 - (progress * 0.3)}`;
    }
  }

  function resetScrollVisuals() {
    const currentPage = document.getElementById(pages[currentPageIndex]);
    if (currentPage) {
      currentPage.style.filter = '';
      currentPage.style.transform = '';
      currentPage.style.opacity = '';
    }
  }

  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isTransitioning) return;

    wheelAccumulator += e.deltaY;

    // Update visuals based on current accumulation
    updateScrollVisuals();

    // Reset accumulator and visuals after inactivity
    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => {
      wheelAccumulator = 0;
      resetScrollVisuals();
    }, 200);

    if (wheelAccumulator > WHEEL_THRESHOLD) {
      wheelAccumulator = 0;
      setActivePage(currentPageIndex + 1);
    } else if (wheelAccumulator < -WHEEL_THRESHOLD) {
      wheelAccumulator = 0;
      setActivePage(currentPageIndex - 1);
    }
  }, { passive: false });

  // =============================================
  // NAV CLICK — PAGE SWITCHING
  // =============================================

  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetIndex = pages.indexOf(targetId);
      if (targetIndex !== -1) {
        setActivePage(targetIndex);
      }
    });
  });

  // =============================================
  // TOUCH SWIPE — PAGE SWITCHING (MOBILE)
  // =============================================

  let touchStartY = 0;
  const SWIPE_THRESHOLD = 50;

  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (isTransitioning) return;
    const deltaY = touchStartY - e.changedTouches[0].clientY;
    if (deltaY > SWIPE_THRESHOLD) {
      setActivePage(currentPageIndex + 1);
    } else if (deltaY < -SWIPE_THRESHOLD) {
      setActivePage(currentPageIndex - 1);
    }
  }, { passive: true });

  // =============================================
  // KEYBOARD — PAGE SWITCHING
  // =============================================

  window.addEventListener('keydown', (e) => {
    if (isTransitioning) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      setActivePage(currentPageIndex + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      setActivePage(currentPageIndex - 1);
    }
  });

  // =============================================
  // PAGE 2 — NEXT LEVEL SHOWCASE (BEFORE/AFTER)
  // =============================================

  const nlStageWrapper = document.getElementById('nl-stage-wrapper');
  const nlMainSlider = document.getElementById('nl-main-slider');
  const nlDockItems = document.querySelectorAll('.nl-dock-item');
  const nlBeforeImg = document.getElementById('nl-before-img');
  const nlAfterImg = document.getElementById('nl-after-img');
  const nlHandle = document.getElementById('nl-handle');
  const nlAfterOverlay = document.getElementById('nl-after-overlay');

  if (nlMainSlider && nlHandle && nlAfterOverlay) {
    let isDraggingHandle = false;

    // --- Dock Logic ---
    nlDockItems.forEach(item => {
      item.addEventListener('click', () => {
        // Remove active class from all
        nlDockItems.forEach(d => d.classList.remove('active'));
        item.classList.add('active');

        // Add animating class for effect
        nlMainSlider.classList.add('nl-animating');

        setTimeout(() => {
          // Swap images
          nlBeforeImg.src = item.dataset.before;
          nlAfterImg.src = item.dataset.after;
          // Reset handle position to middle
          nlAfterOverlay.style.clipPath = `inset(0 0 0 50%)`;
          nlHandle.style.left = `50%`;

          // Remove animating class
          setTimeout(() => {
            nlMainSlider.classList.remove('nl-animating');
          }, 50);
        }, 150); // Wait for transition
      });
    });

    // --- Parallax 3D Tilt Effect ---
    if (nlStageWrapper) {
      nlStageWrapper.addEventListener('mousemove', (e) => {
        if (isDraggingHandle) return; // Don't tilt while interacting

        const rect = nlStageWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5; // max 5 deg
        const rotateY = ((x - centerX) / centerX) * 5;

        nlMainSlider.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      nlStageWrapper.addEventListener('mouseleave', () => {
        if (isDraggingHandle) return;
        nlMainSlider.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      });
    }

    // --- Before/After Slider Logic ---
    function updateSlider(x) {
      const rect = nlMainSlider.getBoundingClientRect();
      let pos = ((x - rect.left) / rect.width) * 100;
      pos = Math.max(0, Math.min(100, pos));
      nlAfterOverlay.style.clipPath = `inset(0 0 0 ${pos}%)`;
      nlHandle.style.left = `${pos}%`;
    }

    nlHandle.addEventListener('mousedown', (e) => {
      isDraggingHandle = true;
      e.preventDefault();
      nlMainSlider.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`; // Reset tilt on interact
    });

    nlMainSlider.addEventListener('mousedown', (e) => {
      isDraggingHandle = true;
      nlMainSlider.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      updateSlider(e.clientX);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDraggingHandle) return;
      updateSlider(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      isDraggingHandle = false;
    });

    // Touch support
    nlHandle.addEventListener('touchstart', (e) => {
      isDraggingHandle = true;
      e.preventDefault();
      nlMainSlider.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    }, { passive: false });

    nlMainSlider.addEventListener('touchstart', (e) => {
      isDraggingHandle = true;
      nlMainSlider.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      updateSlider(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDraggingHandle) return;
      updateSlider(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDraggingHandle = false;
    });
  }

  // =============================================
  // CAROUSEL LOGIC + WATERMARK ROTATION SYNC
  // =============================================

  const track = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const dots = document.querySelectorAll('.dot-img');
  const rotateContactContainer = document.querySelector('.rotate-contact-container');

  if (track && prevBtn && nextBtn && dots.length > 0) {
    let carouselIndex = 0;
    const slideCount = dots.length;

    function updateCarousel() {
      track.style.transform = `translateX(-${carouselIndex * 100}%)`;

      dots.forEach((dot, index) => {
        if (index === carouselIndex) {
          dot.src = './public/contactCaroselDot2.png';
        } else {
          dot.src = './public/contactCaroselDot1.png';
        }
      });

      // Calculate angle based on index to avoid "empty space" at 270deg
      const currentAngle = carouselIndex * 90;

      // Rotate the single image
      if (rotateContactContainer) {
        rotateContactContainer.style.transform = `rotate(${currentAngle}deg)`;
      }
    }

    prevBtn.addEventListener('click', () => {
      carouselIndex = (carouselIndex > 0) ? carouselIndex - 1 : slideCount - 1;
      updateCarousel();
    });

    nextBtn.addEventListener('click', () => {
      carouselIndex = (carouselIndex < slideCount - 1) ? carouselIndex + 1 : 0;
      updateCarousel();
    });

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        carouselIndex = index;
        updateCarousel();
      });
    });
  }

  // =============================================
  // CUSTOM CURSOR WITH SPRING PHYSICS
  // =============================================
  const cursorEl = document.getElementById('custom-cursor');
  const cursorInner = cursorEl ? cursorEl.querySelector('.custom-cursor-inner') : null;

  if (cursorEl && cursorInner) {
    let isTouchDevice = false;

    function checkTouch() {
      isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
      if (isTouchDevice) {
        cursorEl.style.display = 'none';
      } else {
        cursorEl.style.display = 'block';
      }
    }

    checkTouch();
    window.addEventListener('resize', checkTouch);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    let currentX = mouseX;
    let currentY = mouseY;
    let velocityX = 0;
    let velocityY = 0;

    // Spring configuration
    const stiffness = 280;
    const damping = 22;
    const mass = 0.4;

    let lastTime = performance.now();

    function updateCursor(time) {
      if (!isTouchDevice) {
        // Cap dt to prevent massive jumps on lag/tab switch
        const dt = Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;

        if (dt > 0) {
          const springForceX = -stiffness * (currentX - mouseX);
          const damperForceX = -damping * velocityX;
          const accelerationX = (springForceX + damperForceX) / mass;

          const springForceY = -stiffness * (currentY - mouseY);
          const damperForceY = -damping * velocityY;
          const accelerationY = (springForceY + damperForceY) / mass;

          velocityX += accelerationX * dt;
          velocityY += accelerationY * dt;

          currentX += velocityX * dt;
          currentY += velocityY * dt;

          cursorEl.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
      } else {
        lastTime = time;
      }
      requestAnimationFrame(updateCursor);
    }

    requestAnimationFrame(updateCursor);

    window.addEventListener('mousemove', (e) => {
      if (isTouchDevice) return;
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    window.addEventListener('mousedown', () => {
      if (isTouchDevice) return;
      cursorInner.classList.add('clicked');
    });

    window.addEventListener('mouseup', () => {
      if (isTouchDevice) return;
      cursorInner.classList.remove('clicked');
    });

    const showcaseSlider = document.getElementById('nl-main-slider');
    if (showcaseSlider) {
      showcaseSlider.addEventListener('mouseenter', () => {
        if (!isTouchDevice) cursorEl.style.opacity = '0';
      });
      showcaseSlider.addEventListener('mouseleave', () => {
        if (!isTouchDevice) cursorEl.style.opacity = '1';
      });
    }
  }

  // Prevent image dragging globally
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  }, false);

});
