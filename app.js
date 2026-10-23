/* Standard Practice — Office for Exceptions
   State, routing guard, Defined Terms and qualifications, forms. */

(function () {
  'use strict';

  /* ----------------------------------------------------------------
     State
     sessionStorage first; window.name keeps state across pages if
     storage is blocked; memory is the last resort.
     ---------------------------------------------------------------- */

  var KEY = 'standard-practice';
  var NAME_PREFIX = 'standard-practice:';
  var memory = null;

  function load() {
    try {
      var raw = window.sessionStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    try {
      if (window.name.indexOf(NAME_PREFIX) === 0) {
        return JSON.parse(window.name.slice(NAME_PREFIX.length));
      }
    } catch (e) {}
    return memory;
  }

  function save(next) {
    memory = next;
    var raw = JSON.stringify(next);
    try {
      window.sessionStorage.setItem(KEY, raw);
      return;
    } catch (e) {}
    try { window.name = NAME_PREFIX + raw; } catch (e) {}
  }

  function clear() {
    memory = null;
    try { window.sessionStorage.removeItem(KEY); } catch (e) {}
    try {
      if (window.name.indexOf(NAME_PREFIX) === 0) window.name = '';
    } catch (e) {}
  }

  function begin(standing, extra) {
    var next = {
      standing: standing,
      since: new Date().toISOString(),
      seq: 0,
      calibration: null,
      applications: [],
      record: []
    };
    if (extra) {
      Object.keys(extra).forEach(function (k) { next[k] = extra[k]; });
    }
    save(next);
    state = next;
    return next;
  }

  /* ----------------------------------------------------------------
     Routing guard: every page except the gate requires a standing.
     ---------------------------------------------------------------- */

  var root = document.documentElement;
  var page = root.getAttribute('data-page');
  var state = load();

  if (page !== 'gate') {
    if (!state || !state.standing) {
      window.location.replace('index.html');
      return;
    }
    root.setAttribute('data-standing', state.standing);
  }

  /* ----------------------------------------------------------------
     Part 1 — Definitions (verbatim)
     ---------------------------------------------------------------- */

  var DEFINITIONS = {
    '1.1': '“Office” means Standard Practice, Office for Exceptions, and any person acting under its authority.',
    '1.2': '“Work” means any thing made, drafted, tested, generated, rehearsed or begun.',
    '1.3': '“Practice” means Work undertaken by a Practitioner of Standing.',
    '1.4': '“Practitioner of Standing” means a person whose Practice has been recognised by the Office.',
    '1.5': '“Recognition” means the determination by the Office that Work constitutes Practice.',
    '1.6': '“Evidence of Prior Practice” means Work made under a Permit.',
    '1.7': '“Permit” means a Permit to Make issued under Part 5.',
    '1.8': '“New Practice” means Work undertaken by any person other than a Practitioner of Standing, and any Work by a Practitioner of Standing which the Office does not deem a Continuation of Practice.',
    '1.9': '“Continuation of Practice” means Work by a Practitioner of Standing, however new, which the Office deems consistent with their Practice.',
    '1.10': '“Recognised Practice”, when counted in years, means the period beginning on the date of a person’s first Permit.',
    '1.11': '“Sponsor” means a Practitioner of Standing who accepts responsibility for the Work of an Applicant.',
    '1.12': '“Personal Activity” means Work which is not Practice. Personal Activity is valued by the Office.',
    '1.13': '“Applicant” means any person who is not a Practitioner of Standing.',
    '1.14': '“Influence” means any Work, teaching, review, publication or platform of a Practitioner of Standing which a person has encountered, or may reasonably be presumed to have encountered.',
    '1.15': '“Determination” means any decision of the Office, including a decision not to decide.',
    '1.16': '“Standard” means the Standard published at Schedule B, as interpreted by the Office.'
  };

  /* ----------------------------------------------------------------
     Popovers: Defined Terms (.term) and asterisk qualifications (.ast).
     Open on hover, focus and tap. One shared element.
     ---------------------------------------------------------------- */

  var pop = null;
  var owner = null;
  var touchIntent = false;
  var downWasOpen = false;

  function triggerFrom(node) {
    return node && node.closest ? node.closest('.term, .ast') : null;
  }

  function contentFor(el) {
    if (el.classList.contains('term')) {
      var m = /#c-(\d+)-(\d+)/.exec(el.getAttribute('href') || '');
      if (!m) return null;
      var n = m[1] + '.' + m[2];
      return { label: 'Defined Term · ' + n, text: DEFINITIONS[n] };
    }
    return { label: 'Qualification', text: el.getAttribute('data-q') };
  }

  function place(el) {
    var r = el.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var vh = window.innerHeight;
    var edge = vw < 640 ? 16 : 32;
    var pw = pop.offsetWidth;
    var ph = pop.offsetHeight;
    var left = Math.max(edge, Math.min(r.left, vw - edge - pw));
    var top = r.bottom + 8;
    if (top + ph > vh - edge && r.top - 8 - ph > edge) top = r.top - 8 - ph;
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(top) + 'px';
  }

  function show(el) {
    var c = contentFor(el);
    if (!c || !c.text) return;
    if (owner && owner !== el) hide();
    pop.textContent = '';
    var label = document.createElement('span');
    label.className = 'ref';
    label.textContent = c.label;
    var text = document.createElement('p');
    text.textContent = c.text;
    pop.appendChild(label);
    pop.appendChild(text);
    owner = el;
    el.setAttribute('aria-describedby', 'popover');
    if (el.classList.contains('ast')) el.setAttribute('aria-expanded', 'true');
    pop.classList.add('is-open');
    place(el);
  }

  function hide() {
    if (!owner) return;
    owner.removeAttribute('aria-describedby');
    if (owner.classList.contains('ast')) owner.setAttribute('aria-expanded', 'false');
    owner = null;
    pop.classList.remove('is-open');
  }

  function initPopovers() {
    pop = document.createElement('div');
    pop.id = 'popover';
    pop.className = 'popover';
    pop.setAttribute('role', 'tooltip');
    document.body.appendChild(pop);

    document.querySelectorAll('.ast').forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
    });

    document.addEventListener('pointerdown', function (e) {
      touchIntent = e.pointerType === 'touch' || e.pointerType === 'pen';
      var t = triggerFrom(e.target);
      downWasOpen = !!t && owner === t;
    }, true);

    document.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse') touchIntent = false;
    }, true);

    document.addEventListener('mouseover', function (e) {
      if (touchIntent) return;
      var t = triggerFrom(e.target);
      if (t) show(t);
    });

    document.addEventListener('mouseout', function (e) {
      var t = triggerFrom(e.target);
      if (t && t === owner && !t.contains(e.relatedTarget) && document.activeElement !== t) hide();
    });

    document.addEventListener('focusin', function (e) {
      var t = triggerFrom(e.target);
      if (t) show(t);
    });

    document.addEventListener('focusout', function (e) {
      if (triggerFrom(e.target) === owner) hide();
    });

    document.addEventListener('click', function (e) {
      var t = triggerFrom(e.target);
      if (!t) { hide(); return; }
      if (t.classList.contains('ast')) {
        e.preventDefault();
        if (touchIntent && downWasOpen) hide();
        else show(t);
        return;
      }
      // A first tap on a Defined Term shows the definition; a second follows the link.
      if (touchIntent && !downWasOpen) {
        e.preventDefault();
        show(t);
      }
    });

    document.addEventListener('keydown', function (e) {
      touchIntent = false;
      if (e.key === 'Escape') hide();
    });

    window.addEventListener('scroll', function () { if (owner) place(owner); }, { passive: true });
    window.addEventListener('resize', function () { if (owner) place(owner); });
  }

  /* ----------------------------------------------------------------
     Shared chrome
     ---------------------------------------------------------------- */

  function initChrome() {
    var label = state && state.standing === 'recognised' ? 'Recognised' : 'Applicant';
    document.querySelectorAll('[data-standing-label]').forEach(function (el) {
      el.textContent = label;
    });

    // Re-verify standing: clear the state; the link itself returns to the gate.
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-reverify]')) clear();
    });
  }

  /* ----------------------------------------------------------------
     The gate
     ---------------------------------------------------------------- */

  var HOME = 'home.html';

  function initGate() {
    var verify = document.getElementById('verify');
    var widget = document.getElementById('widget');
    var declared = document.getElementById('declared');
    var asApplicant = document.getElementById('as-applicant');
    var status = document.getElementById('gate-status');
    var calibration = document.getElementById('calibration');
    var receipt = document.getElementById('receipt');
    var spinnerTemplate = document.getElementById('spinner-template');

    verify.addEventListener('submit', function (e) {
      e.preventDefault();
      if (declared.checked) assume();
      else calibrate();
    });

    asApplicant.addEventListener('click', function (e) {
      e.preventDefault();
      calibrate();
    });

    function assume() {
      widget.textContent = '';
      widget.appendChild(spinnerTemplate.content.cloneNode(true));
      window.setTimeout(function () {
        widget.textContent = '';
        var p = document.createElement('p');
        p.textContent = 'Standing assumed.';
        widget.appendChild(p);
        begin('recognised');
        window.setTimeout(function () { window.location.href = HOME; }, 900);
      }, 1200);
    }

    function calibrate() {
      verify.hidden = true;
      asApplicant.hidden = true;
      status.textContent = 'Applicants are asked to complete one calibration.';
      calibration.hidden = false;
      calibration.querySelector('.calibration__head').focus();
    }

    calibration.querySelectorAll('.tile').forEach(function (tile) {
      tile.addEventListener('click', function () {
        var on = tile.getAttribute('aria-pressed') === 'true';
        tile.setAttribute('aria-pressed', on ? 'false' : 'true');
      });
    });

    calibration.addEventListener('submit', function (e) {
      e.preventDefault();
      var selected = [];
      calibration.querySelectorAll('.tile').forEach(function (tile, i) {
        if (tile.getAttribute('aria-pressed') === 'true') selected.push(i + 1);
      });
      begin('applicant', { calibration: selected });
      calibration.hidden = true;
      receipt.hidden = false;
      receipt.focus();
      window.setTimeout(function () { window.location.href = HOME; }, 2200);
    });
  }

  /* ----------------------------------------------------------------
     Start
     ---------------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    initChrome();
    initPopovers();
    if (page === 'gate') initGate();
  });
})();
