(function () {
  'use strict';

  // Mobile navigation toggle
  var navToggle = document.querySelector('[data-nav-toggle]');
  var menu = document.querySelector('[data-menu]');
  if (navToggle && menu) {
    navToggle.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    // Close menu on link click (mobile)
    menu.addEventListener('click', function (e) {
      var target = e.target;
      if (target && target.tagName === 'A' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Smooth scroll for internal anchors
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href');
    if (!id || id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Smart header: show on scroll up, hide on scroll down
  var header = document.querySelector('[data-header]');
  var lastScrollY = 0;
  var isScrollingUp = false;
  var scrollThreshold = 100; // Show header after scrolling this much
  
  var onScroll = function () {
    var currentScrollY = window.scrollY || window.pageYOffset;
    
    if (!header) return;
    
    // Determine scroll direction
    isScrollingUp = currentScrollY < lastScrollY;
    
    // Show header if:
    // 1. Scrolling up and past threshold, OR
    // 2. At the very top of the page
    var shouldShow = (isScrollingUp && currentScrollY > scrollThreshold) || currentScrollY <= 10;
    
    if (shouldShow) {
      header.classList.add('visible');
    } else {
      header.classList.remove('visible');
    }
    
    // Add shadow when header is visible and scrolled
    header.style.boxShadow = (header.classList.contains('visible') && currentScrollY > 2) 
      ? '0 6px 20px rgba(0,0,0,0.35)' 
      : 'none';
    
    lastScrollY = currentScrollY;
  };
  
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Initial call

  // Accordion progressive enhancement (ensures only one open at a time)
  var accordion = document.querySelector('[data-accordion]');
  if (accordion) {
    accordion.addEventListener('toggle', function (e) {
      var target = e.target;
      if (target.tagName !== 'DETAILS' || !target.open) return;
      accordion.querySelectorAll('details[open]').forEach(function (el) {
        if (el !== target) el.open = false;
      });
    }, true);
  }

  // Current year in footer
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // Benefits section intersection observer for animations
  var benefitsSection = document.querySelector('#benefits');
  if (benefitsSection) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, { threshold: 0.2 });
    
    observer.observe(benefitsSection);
  }

  // Add click interactions to benefits for extra engagement
  var benefits = document.querySelectorAll('.benefit');
  benefits.forEach(function(benefit) {
    benefit.addEventListener('click', function() {
      // Add a subtle pulse effect on click
      this.style.transform = 'translateY(-4px) scale(1.05)';
      setTimeout(function() {
        benefit.style.transform = '';
      }, 150);
    });
  });

  // Create floating particles around benefits section
  function createParticles() {
    var benefitsSection = document.querySelector('#benefits');
    if (!benefitsSection) return;
    
    var particleContainer = document.createElement('div');
    particleContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 1;
    `;
    benefitsSection.style.position = 'relative';
    benefitsSection.appendChild(particleContainer);
    
    // Create particles
    for (var i = 0; i < 15; i++) {
      var particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: radial-gradient(circle, rgba(255,107,53,0.8), transparent);
        border-radius: 50%;
        animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
        animation-delay: ${Math.random() * 2}s;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
      `;
      particleContainer.appendChild(particle);
    }
    
    // Add floating animation
    var style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
        25% { transform: translateY(-20px) rotate(90deg); opacity: 0.8; }
        50% { transform: translateY(-10px) rotate(180deg); opacity: 0.6; }
        75% { transform: translateY(-30px) rotate(270deg); opacity: 0.9; }
      }
    `;
    document.head.appendChild(style);
  }

  // Magnetic hover effect for benefits
  function addMagneticEffect() {
    var benefits = document.querySelectorAll('.benefit');
    benefits.forEach(function(benefit) {
      benefit.addEventListener('mousemove', function(e) {
        var rect = this.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        
        var distance = Math.sqrt(x * x + y * y);
        var maxDistance = 50;
        
        if (distance < maxDistance) {
          var force = (maxDistance - distance) / maxDistance;
          var moveX = (x / distance) * force * 10;
          var moveY = (y / distance) * force * 10;
          
          this.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;
        }
      });
      
      benefit.addEventListener('mouseleave', function() {
        this.style.transform = '';
      });
    });
  }

  // Planet UI logic
  (function initPlanet() {
    var wrap = document.querySelector('[data-planet]');
    if (!wrap) return;

    // Disable previous particles/magnet for this section
    // but leave harmless if CSS still present

    var labels = Array.from(wrap.querySelectorAll('.benefit-label'));
    var center = { x: 0, y: 0 };
    var radius = 0;
    var rotation = 0; // degrees
    var dragging = false;
    var lastX = 0;
    var velocity = 0;
    var rafId = 0;

    function updateCenter() {
      var rect = wrap.getBoundingClientRect();
      center.x = rect.left + rect.width / 2;
      center.y = rect.top + rect.height / 2;
      radius = Math.min(rect.width, rect.height) * 0.42; // orbit radius
    }

    function positionLabels() {
      labels.forEach(function(label) {
        var baseAngle = parseFloat(label.getAttribute('data-angle')) || 0;
        var a = (baseAngle + rotation) * Math.PI / 180;
        var x = Math.cos(a) * radius;
        var y = Math.sin(a) * radius;
        label.style.transform = 'translate(calc(-50% + ' + x.toFixed(1) + 'px), calc(-50% + ' + y.toFixed(1) + 'px))';

        // Depth cue: scale and opacity based on vertical position
        var depth = (y / radius + 1) / 2; // 0..1
        var scale = 0.9 + depth * 0.3; // 0.9 - 1.2
        var opacity = 0.55 + depth * 0.45; // 0.55 - 1
        label.style.opacity = String(opacity.toFixed(2));
        label.style.zIndex = String(100 + Math.round(depth * 100));
        label.style.filter = 'drop-shadow(0 2px 10px rgba(255,107,53,' + (0.15 + depth * 0.25).toFixed(2) + '))';
        label.style.transform += ' scale(' + scale.toFixed(2) + ')';

        // Active when closest to rightmost side
        var angleNorm = (baseAngle + rotation) % 360; if (angleNorm < 0) angleNorm += 360;
        var isActive = angleNorm > 315 || angleNorm < 45; // within ±45° of 0°
        label.classList.toggle('active', isActive);
      });
    }

    function onPointerDown(e) {
      dragging = true;
      wrap.classList.add('grabbing');
      lastX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    }
    function onPointerMove(e) {
      if (!dragging) return;
      var x = e.clientX || (e.touches && e.touches[0].clientX) || lastX;
      var dx = x - lastX;
      lastX = x;
      rotation += dx * 0.4; // sensitivity
      velocity = dx; // for inertia
      positionLabels();
    }
    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      wrap.classList.remove('grabbing');
      // Inertia spin
      var decay = 0.95;
      cancelAnimationFrame(rafId);
      function spin() {
        velocity *= decay;
        if (Math.abs(velocity) < 0.05) return;
        rotation += velocity * 0.4;
        positionLabels();
        rafId = requestAnimationFrame(spin);
      }
      rafId = requestAnimationFrame(spin);
    }

    // Resize recalculation
    var ro = new ResizeObserver(function() { updateCenter(); positionLabels(); });
    ro.observe(wrap);
    window.addEventListener('scroll', function() { updateCenter(); }, { passive: true });

    // Pointer events
    // Improve touch behavior: prevent scroll while dragging
    wrap.style.touchAction = 'none';
    wrap.addEventListener('mousedown', onPointerDown);
    wrap.addEventListener('touchstart', function(e){ onPointerDown(e.touches ? e.touches[0] : e); }, { passive: false });
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', function(e){ if (dragging) e.preventDefault(); onPointerMove(e.touches ? e.touches[0] : e); }, { passive: false });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);

    // Keyboard accessibility: left/right to rotate
    wrap.setAttribute('tabindex', '0');
    wrap.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') { rotation -= 10; positionLabels(); }
      if (e.key === 'ArrowRight') { rotation += 10; positionLabels(); }
    });

    updateCenter();
    positionLabels();
  })();
})();


