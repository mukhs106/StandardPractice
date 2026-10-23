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
      serial: 400 + Math.floor(Math.random() * 500),
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
     Record helpers
     ---------------------------------------------------------------- */

  function nextRef(prefix) {
    state.seq = (state.seq || 0) + 1;
    if (!state.serial) state.serial = 400 + Math.floor(Math.random() * 500);
    save(state);
    return 'SP/' + prefix + '/' + String(state.serial + state.seq).padStart(4, '0');
  }

  function addRecord(entry) {
    state.record.push(entry);
    save(state);
    return entry;
  }

  function findRecord(ref) {
    var list = state.record || [];
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i].ref === ref) return list[i];
    }
    return null;
  }

  function formatDate(iso, offsetDays) {
    var d = new Date(iso);
    if (offsetDays) d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ----------------------------------------------------------------
     Office prose: clause references and Defined Terms become links.
     Only Office-authored text passes through here.
     ---------------------------------------------------------------- */

  var TERM_CLAUSES = {
    'Evidence of Prior Practice': '1.6',
    'Practitioner of Standing': '1.4',
    'Continuation of Practice': '1.9',
    'Recognised Practice': '1.10',
    'Personal Activity': '1.12',
    'New Practice': '1.8',
    'Influences': '1.14',
    'Influence': '1.14',
    'Applicant': '1.13',
    'Sponsor': '1.11',
    'Permit': '1.7'
  };

  var PROSE = new RegExp(
    '\\((\\d+)\\.(\\d+)([a-z]?)\\)|\\(Part (\\d+)\\)|\\b(' +
    Object.keys(TERM_CLAUSES).join('|') + ')\\b', 'g');

  function anchorFor(clause) {
    return 'charter.html#c-' + clause.replace('.', '-');
  }

  function link(cls, href, text) {
    var a = document.createElement('a');
    a.className = cls;
    a.href = href;
    a.textContent = text;
    return a;
  }

  // Appends text to node, linking cross-references and the first use of each Defined Term.
  function appendProse(node, text, linked) {
    var last = 0;
    var m;
    PROSE.lastIndex = 0;
    while ((m = PROSE.exec(text))) {
      var replacement = null;
      if (m[1]) {
        replacement = [
          '(', link('xref', anchorFor(m[1] + '.' + m[2]), m[1] + '.' + m[2] + m[3]), ')'
        ];
      } else if (m[4]) {
        replacement = ['(', link('xref', 'charter.html#part-' + m[4], 'Part ' + m[4]), ')'];
      } else if (m[5] && !linked[TERM_CLAUSES[m[5]]]) {
        linked[TERM_CLAUSES[m[5]]] = true;
        replacement = [link('term', anchorFor(TERM_CLAUSES[m[5]]), m[5])];
      }
      if (!replacement) continue;
      node.appendChild(document.createTextNode(text.slice(last, m.index)));
      replacement.forEach(function (part) {
        node.appendChild(typeof part === 'string' ? document.createTextNode(part) : part);
      });
      last = m.index + m[0].length;
    }
    node.appendChild(document.createTextNode(text.slice(last)));
    return node;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ----------------------------------------------------------------
     Letter on letterhead
     entry: { ref, date, letter: { day, re, title, titleRed, paras: [{ t, red }], officer } }
     ---------------------------------------------------------------- */

  function renderLetter(entry) {
    var L = entry.letter;
    var linked = {};
    var art = el('article', 'letter');

    var head = el('header', 'letterhead');
    var office = el('p', 'letterhead__office');
    office.appendChild(document.createTextNode('Standard Practice'));
    office.appendChild(document.createElement('br'));
    office.appendChild(document.createTextNode('Office for Exceptions'));
    var meta = el('dl', 'letterhead__meta');
    [['Ref.', entry.ref], ['Date', formatDate(entry.date, L.day || 0)], ['Page', '1 of 1']]
      .forEach(function (pair) {
        meta.appendChild(el('dt', null, pair[0]));
        meta.appendChild(el('dd', null, pair[1]));
      });
    head.appendChild(office);
    head.appendChild(meta);
    art.appendChild(head);

    art.appendChild(el('p', 'letter__basis ref', 'Issued under the Practice Charter, Revision 03.'));
    if (L.re) art.appendChild(el('p', 'letter__re ui', L.re));

    var body = el('div', 'letter__body');
    var h = el('h2', 'display-s', L.title);
    if (L.titleRed) h.appendChild(el('span', 'red', L.titleRed));
    body.appendChild(h);
    L.paras.forEach(function (p) {
      body.appendChild(appendProse(el('p', p.red ? 'red' : null), p.t, linked));
    });
    art.appendChild(body);

    var sign = el('div', 'letter__sign');
    sign.appendChild(el('p', null, 'For the Office,'));
    sign.appendChild(el('span', 'letter__sign-line'));
    sign.appendChild(el('p', 'letter__officer', L.officer));
    art.appendChild(sign);

    var foot = el('footer', 'letter__foot ref');
    foot.appendChild(el('span', null, 'Standards in force. Exceptions by determination.'));
    foot.appendChild(el('span', null, '1'));
    art.appendChild(foot);

    return art;
  }

  /* ----------------------------------------------------------------
     Form P-1
     ---------------------------------------------------------------- */

  function determine(app) {
    var re = 'Re: Application for a Permit to Make (Form P-1). ' +
      (app.title ? '“' + app.title + '”' : 'Title not stated.');

    if (state.standing === 'recognised') {
      return {
        status: 'Not Required',
        qualifies: false,
        letter: {
          re: re,
          title: 'Determination: ',
          titleRed: 'Not Required.',
          paras: [{
            t: 'Your proposed Work is deemed a Continuation of Practice (3.2). No Permit is required. Review will take place on completion, at the discretion of the Office (5.4a).'
          }],
          officer: 'Deputy Registrar of Standing'
        }
      };
    }

    var paras = [
      { t: 'This notice is not a refusal (5.3).', red: true },
      { t: 'Your application is complete and has been found to require Evidence of Prior Practice (6.1). Evidence of Prior Practice means Work made under a Permit (1.6). Upon receipt of such evidence, the Office will be pleased to reconsider your application.' }
    ];
    if (app.years >= 3) {
      paras.push({ t: 'Your declared years of Recognised Practice could not be verified, as no Permit is held in the Record (8.2).' });
    }
    if (app.outcome === 'undetermined') {
      paras.push({ t: 'Your proposed Work has been classified as Personal Activity (3.4). Personal Activity is valued by the Office.' });
    }
    paras.push({ t: 'Should a Permit be granted, your Work will be reviewed after each trial (5.4b).' });

    return {
      status: 'Deferred',
      qualifies: true,
      letter: {
        re: re,
        title: 'Determination: ',
        titleRed: 'Deferred.',
        paras: paras,
        officer: 'Deputy Registrar of Standing'
      }
    };
  }

  function initApply() {
    var form = document.getElementById('p1');
    var steps = Array.prototype.slice.call(form.querySelectorAll('[data-step]'));
    var indicator = document.getElementById('step-indicator');
    var markers = document.querySelectorAll('[data-step-marker]');
    var current = 1;

    function go(n) {
      current = n;
      steps.forEach(function (fs) { fs.hidden = Number(fs.getAttribute('data-step')) !== n; });
      indicator.textContent = 'Form P-1 · Step ' + n + ' of 3';
      markers.forEach(function (m) {
        if (Number(m.getAttribute('data-step-marker')) === n) m.setAttribute('aria-current', 'step');
        else m.removeAttribute('aria-current');
      });
      var heading = steps[n - 1].querySelector('h2');
      var top = form.getBoundingClientRect().top;
      if (top < 0) window.scrollBy(0, top - 24);
      heading.focus({ preventScroll: true });
    }

    function reveal(control, target) {
      target.hidden = !control.checked;
    }

    // Outcome: an undetermined outcome shows the 3.4 note.
    var undeterminedNote = document.getElementById('note-outcome');
    form.querySelectorAll('input[name="outcome"]').forEach(function (r) {
      r.addEventListener('change', function () {
        undeterminedNote.hidden = form.elements.outcome.value !== 'undetermined';
      });
    });

    // Grounds: each reveals its evidence field.
    form.querySelectorAll('input[name="ground"]').forEach(function (box) {
      var field = document.getElementById('evidence-' + box.value);
      box.addEventListener('change', function () { reveal(box, field); });
    });

    // Sponsor
    var sponsor = document.getElementById('sponsor');
    var noSponsor = document.getElementById('no-sponsor');
    var sponsorNote = document.getElementById('note-sponsor');
    noSponsor.addEventListener('change', function () {
      sponsor.disabled = noSponsor.checked;
      reveal(noSponsor, sponsorNote);
    });

    var declaration = document.getElementById('declaration');
    var declarationError = document.getElementById('declaration-error');
    declaration.addEventListener('change', function () {
      if (declaration.checked) declarationError.hidden = true;
    });

    form.addEventListener('click', function (e) {
      var t = e.target.closest('[data-next], [data-back]');
      if (!t) return;
      e.preventDefault();
      go(current + (t.hasAttribute('data-next') ? 1 : -1));
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (current < 3) { go(current + 1); return; }
      if (!declaration.checked) {
        declarationError.hidden = false;
        declaration.focus();
        return;
      }

      var grounds = [];
      form.querySelectorAll('input[name="ground"]:checked').forEach(function (box) {
        grounds.push({
          ground: box.value,
          evidence: document.getElementById('evidence-' + box.value + '-input').value.trim()
        });
      });

      var app = {
        submitted: new Date().toISOString(),
        title: form.elements.title.value.trim(),
        description: form.elements.description.value.trim(),
        outcome: form.elements.outcome.value || null,
        grounds: grounds,
        years: parseInt(form.elements.years.value, 10) || 0,
        sponsor: noSponsor.checked ? null : sponsor.value.trim(),
        noSponsor: noSponsor.checked,
        standing: state.standing
      };

      var d = determine(app);
      var ref = nextRef('DT');
      app.ref = ref;
      app.determination = d.status;
      state.applications.push(app);
      addRecord({
        ref: ref,
        date: app.submitted,
        kind: 'determination',
        document: 'Determination on Form P-1',
        status: d.status,
        qualifies: d.qualifies,
        letter: d.letter
      });
      window.location.href = 'determination.html?ref=' + encodeURIComponent(ref);
    });
  }

  /* ----------------------------------------------------------------
     Determination and Form R-1
     ---------------------------------------------------------------- */

  var REVIEW_RESPONSE = 'Your request contends that the Charter is mistaken, rather than misapplied. It has been treated as an Observation (7.2).';

  function initDetermination() {
    var slot = document.getElementById('letter-slot');
    var ref = null;
    try { ref = new URLSearchParams(window.location.search).get('ref'); } catch (e) {}
    var entry = ref ? findRecord(ref) : null;
    if (!entry) {
      var dets = (state.record || []).filter(function (r) { return r.kind === 'determination'; });
      entry = dets[dets.length - 1] || null;
    }

    if (!entry) {
      document.getElementById('no-determination').hidden = false;
      document.querySelectorAll('[data-needs-determination]').forEach(function (n) { n.hidden = true; });
      return;
    }
    slot.appendChild(renderLetter(entry));

    document.querySelectorAll('[data-print]').forEach(function (b) {
      b.addEventListener('click', function () { window.print(); });
    });

    var toggle = document.getElementById('review-toggle');
    var review = document.getElementById('review');
    var reviewForm = document.getElementById('review-form');
    var reply = document.getElementById('review-reply');

    toggle.addEventListener('click', function () {
      var open = review.hidden;
      review.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) document.getElementById('review-title').focus();
    });

    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var obsRef = nextRef('OB');
      addRecord({
        ref: obsRef,
        date: new Date().toISOString(),
        kind: 'observation',
        document: 'Request for Review (Form R-1)',
        status: 'Treated as an Observation',
        qualifies: true,
        submitted: {
          clause: reviewForm.elements.clause.value.trim(),
          grounds: reviewForm.elements.grounds.value.trim()
        },
        concerning: entry.ref,
        letter: {
          re: 'Re: Request for Review of Determination ' + entry.ref + ' (Form R-1).',
          title: 'Request for Review: ',
          titleRed: 'treated as an Observation.',
          paras: [{ t: REVIEW_RESPONSE }],
          officer: 'Registrar of Observations'
        }
      });
      reviewForm.hidden = true;
      document.getElementById('review-ref').textContent = 'Ref. ' + obsRef;
      appendProse(document.getElementById('review-text'), REVIEW_RESPONSE, {});
      reply.hidden = false;
      reply.focus();
    });
  }

  /* ----------------------------------------------------------------
     Start
     ---------------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    initChrome();
    initPopovers();
    if (page === 'gate') initGate();
    if (page === 'apply') initApply();
    if (page === 'determination') initDetermination();
  });
})();
