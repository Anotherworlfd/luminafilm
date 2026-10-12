(function () {
  'use strict';

  var GRID_COUNT = 6;
  var LIST_STEP = 12;

  var grid = document.getElementById('filmsGrid');
  var listEl = document.getElementById('filmsList');
  var listSection = document.getElementById('filmsListSection');
  var showMoreBtn = document.getElementById('showMore');

  if (!window.FILMS || !grid || !listEl || !listSection || !showMoreBtn) return;

  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var sortMode = 'newest';
  var listCount = LIST_STEP;
  var currentCols = 0;

  function sortBy(mode) {
    var films = window.FILMS.slice();
    if (mode === 'newest') {
      films.sort(function (a, b) {
        if (b.year !== a.year) return b.year - a.year;
        return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
      });
    } else {
      films.sort(function (a, b) {
        var ta = a.title.toLowerCase();
        var tb = b.title.toLowerCase();
        return ta < tb ? -1 : ta > tb ? 1 : 0;
      });
    }
    return films;
  }

  function makeImgWrapper(film) {
    var wrap = document.createElement('div');
    wrap.className = 'grid-img-wrap';
    wrap.style.aspectRatio = film.ratio || '4/5';

    var img = document.createElement('img');
    img.className = 'grid-img';
    img.alt = film.title;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.srcset = 'images/films/' + film.id + '-480.webp 480w, images/films/' + film.id + '-960.webp 960w, images/films/' + film.id + '-1440.webp 1440w';
    img.sizes = '(max-width: 519px) 100vw, (max-width: 900px) 50vw, 33vw';
    img.src = 'images/films/' + film.id + '-960.webp';
    img.width = 960;
    img.height = film.ratio === '16/10' ? 600 : (film.ratio === '3/2' ? 640 : 1200);

    function onError() {
      img.removeEventListener('error', onError);
      wrap.classList.add('is-placeholder');
      img.remove();
    }
    if (film.image) {
      img.addEventListener('error', onError);
      wrap.appendChild(img);
    } else {
      wrap.classList.add('is-placeholder');
    }
    return wrap;
  }

  function makeCard(film) {
    var a = document.createElement('a');
    a.className = 'grid-card';
    a.href = 'films/' + film.id + '.html';
    a.appendChild(makeImgWrapper(film));

    var year = document.createElement('span');
    year.className = 'grid-year';
    year.textContent = film.year;

    var title = document.createElement('span');
    title.className = 'grid-title';
    title.textContent = film.title;

    a.appendChild(year);
    a.appendChild(title);
    return a;
  }

  function columnCount() {
    var w = window.innerWidth;
    if (w > 900) return 3;
    if (w >= 520) return 2;
    return 1;
  }

  function buildGrid(films, cols) {
    grid.innerHTML = '';
    var used = films.slice(0, GRID_COUNT);
    var fragment = document.createDocumentFragment();

    for (var c = 0; c < cols; c++) {
      var col = document.createElement('div');
      col.className = 'grid-col';
      for (var i = c; i < used.length; i += cols) {
        col.appendChild(makeCard(used[i]));
      }
      fragment.appendChild(col);
    }
    grid.appendChild(fragment);
  }

  function makeListRow(film) {
    var li = document.createElement('li');
    li.className = 'film-row';

    var a = document.createElement('a');
    a.className = 'film-link';
    a.href = 'films/' + film.id + '.html';
    a.textContent = film.title;

    var sup = document.createElement('sup');
    sup.className = 'film-year-sup';
    sup.textContent = film.year;
    a.appendChild(sup);

    li.appendChild(a);
    return li;
  }

  function buildList(films, count) {
    listEl.innerHTML = '';
    var remaining = films.slice(GRID_COUNT);
    var shown = remaining.slice(0, count);
    var fragment = document.createDocumentFragment();
    shown.forEach(function (film) {
      fragment.appendChild(makeListRow(film));
    });
    listEl.appendChild(fragment);

    var hasMore = remaining.length > count;
    listSection.hidden = remaining.length === 0;
    showMoreBtn.hidden = !hasMore;
    listCount = count;
  }

  function render(forceGridRebuild) {
    var films = sortBy(sortMode);
    var cols = columnCount();
    if (forceGridRebuild || cols !== currentCols || !grid.hasChildNodes()) {
      currentCols = cols;
      buildGrid(films, currentCols);
    }
    buildList(films, listCount);
  }

  // Hover dim: hovering one row keeps it at full opacity, dims the rest.
  if (!isTouch && !prefersReduced) {
    listEl.addEventListener('mouseover', function (e) {
      if (e.target.closest('.film-row')) listEl.classList.add('is-hovering');
    });
    listEl.addEventListener('mouseout', function (e) {
      if (!listEl.contains(e.relatedTarget)) listEl.classList.remove('is-hovering');
    });
  }

  var sortBtns = document.querySelectorAll('.sort-btn');
  sortBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.classList.contains('is-active')) return;
      sortBtns.forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      sortMode = btn.getAttribute('data-sort');
      listCount = LIST_STEP;
      render(true);
    });
  });

  showMoreBtn.addEventListener('click', function () {
    var films = sortBy(sortMode);
    buildList(films, listCount + LIST_STEP);
  });

  // Rebuild columns only when column count changes
  var mqWide = window.matchMedia('(min-width: 901px)');
  var mqMid = window.matchMedia('(min-width: 520px)');
  function checkCols() {
    var cols = columnCount();
    if (cols !== currentCols) {
      currentCols = cols;
      buildGrid(sortBy(sortMode), currentCols);
    }
  }
  if (mqWide.addEventListener) {
    mqWide.addEventListener('change', checkCols);
    mqMid.addEventListener('change', checkCols);
  } else if (mqWide.addListener) {
    mqWide.addListener(checkCols);
    mqMid.addListener(checkCols);
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(checkCols, 150);
  }, { passive: true });

  render(true);
})();