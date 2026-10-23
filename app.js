/* Standard Practice — Office for Exceptions
   State, routing guard, Defined Terms, the dossier, correspondence and the Record. */

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

  // Re-verification replaces the standing; the case file is retained.
  function begin(standing, extra) {
    var prev = state || {};
    var next = {
      standing: standing,
      since: new Date().toISOString(),
      seq: prev.seq || 0,
      serial: prev.serial || 400 + Math.floor(Math.random() * 500),
      calibration: prev.calibration || null,
      applications: prev.applications || [],
      record: prev.record || [],
      disclosure: prev.disclosure || null,
      drafts: prev.drafts || {}
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
    if (!state.record) state.record = [];
    if (!state.applications) state.applications = [];
    root.setAttribute('data-standing', state.standing);
  }

  function isRecognised() { return !!state && state.standing === 'recognised'; }

  /* ----------------------------------------------------------------
     The Charter (verbatim, where the site cites it)
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

  var CLAUSES = {
    '3.2': 'Work by a Practitioner of Standing is presumed to be a Continuation of Practice and requires no Permit.',
    '3.4': 'Work without a defined outcome is classified as Personal Activity, unless it is undertaken by a Practitioner of Standing, in which case it is classified as research.',
    '4.2': 'An Applicant must satisfy no fewer than three Grounds.',
    '5.3': 'A Deferral is not a refusal. An application may be deferred indefinitely.',
    '5.4': 'Work under Permit is reviewed at the following intervals: (a) Practitioners of Standing: on completion, at the discretion of the Office; (b) Applicants with a Sponsor: after each trial; (c) Applicants without a Sponsor: see 5.5.',
    '5.5': 'Applications without a Sponsor are received.',
    '6.1': 'Every application for a Permit requires Evidence of Prior Practice.',
    '6.3': 'The Office may accept the reputation of a Sponsor in place of evidence.',
    '7.2': 'A request which contends that this Charter is itself mistaken is not a request for review. It is an Observation.',
    '7.4': 'The lodging of an Observation does not affect any Determination, save that it is entered in the Record.',
    '8.2': 'Matters which are not in the Record cannot be verified.'
  };

  // Defined Terms used by the Office which carry no clause number in this Revision.
  var TERMS = {
    'Retrospective Regularisation': 'The recognition of previously undertaken Work as authorised, subject to evidence that authorisation existed at the time of making.',
    'Standing': 'The status by which the Office accepts a person’s eligibility to undertake Practice. Evidence requirements depend on the Standing already held.',
    'Attribution': 'The Office’s determination of the Practice to which Work belongs.',
    'Assistance': 'A contribution entered under another Practitioner’s recognised Practice. Assistance does not establish independent Standing.',
    'Public Record': 'The record of Practice admitted to public recognition. Receipt of correspondence does not constitute admission.'
  };

  /* ----------------------------------------------------------------
     Popovers: Defined Terms (.term) and asterisk qualifications (.ast).
     Numbered terms are links to the Charter; unnumbered terms are
     buttons. All open on hover, focus and tap. One shared element.
     ---------------------------------------------------------------- */

  var pop = null;
  var owner = null;
  var touchIntent = false;
  var downWasOpen = false;

  function triggerFrom(node) {
    return node && node.closest ? node.closest('.term, .ast') : null;
  }

  function contentFor(node) {
    var name = node.getAttribute('data-term');
    if (name) return { label: 'Defined Term', text: TERMS[name] };
    if (node.classList.contains('term')) {
      var m = /#c-(\d+)-(\d+)/.exec(node.getAttribute('href') || '');
      if (!m) return null;
      var n = m[1] + '.' + m[2];
      return { label: 'Defined Term ' + n, text: DEFINITIONS[n] };
    }
    return { label: 'Qualification', text: node.getAttribute('data-q') };
  }

  function place(node) {
    var r = node.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var vh = window.innerHeight;
    var edge = vw < 640 ? 16 : 24;
    var pw = pop.offsetWidth;
    var ph = pop.offsetHeight;
    var left = Math.max(edge, Math.min(r.left, vw - edge - pw));
    var top = r.bottom + 8;
    if (top + ph > vh - edge) {
      top = r.top - 8 - ph > edge ? r.top - 8 - ph : Math.max(edge, vh - edge - ph);
    }
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(top) + 'px';
  }

  function show(node) {
    var c = contentFor(node);
    if (!c || !c.text) return;
    if (owner && owner !== node) hide();
    pop.textContent = '';
    pop.appendChild(el('span', 'mono-s', c.label));
    pop.appendChild(el('p', null, c.text));
    owner = node;
    node.setAttribute('aria-describedby', 'popover');
    if (node.tagName === 'BUTTON') node.setAttribute('aria-expanded', 'true');
    pop.classList.add('is-open');
    place(node);
  }

  function hide() {
    if (!owner) return;
    owner.removeAttribute('aria-describedby');
    if (owner.tagName === 'BUTTON') owner.setAttribute('aria-expanded', 'false');
    owner = null;
    pop.classList.remove('is-open');
  }

  function initPopovers() {
    pop = document.createElement('div');
    pop.id = 'popover';
    pop.className = 'popover';
    pop.setAttribute('role', 'tooltip');
    document.body.appendChild(pop);

    document.querySelectorAll('.ast, button.term').forEach(function (b) {
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
      if (t.tagName === 'BUTTON') {
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
     Helpers
     ---------------------------------------------------------------- */

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function termButton(name, text) {
    var b = el('button', 'term', text || name);
    b.type = 'button';
    b.setAttribute('data-term', name);
    b.setAttribute('aria-expanded', 'false');
    return b;
  }

  // Shows or clears a form's validation message and marks the field concerned.
  function fieldError(out, field, message) {
    out.textContent = message || '';
    if (!field) return;
    if (message) {
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    } else {
      field.removeAttribute('aria-invalid');
    }
  }

  /* Drafts: unsent forms survive a visit to the Record or the Charter. */

  function draftKey(input) {
    return input.type === 'checkbox' || input.type === 'radio' ? input.name + '=' + input.value : input.name;
  }

  function saveDraft(form, id) {
    var d = {};
    Array.prototype.forEach.call(form.elements, function (i) {
      if (!i.name || i.type === 'submit' || i.type === 'button') return;
      d[draftKey(i)] = i.type === 'checkbox' || i.type === 'radio' ? i.checked : i.value;
    });
    state.drafts = state.drafts || {};
    state.drafts[id] = d;
    save(state);
  }

  // Restores a draft (firing change events so dependent fields reveal), then keeps it current.
  function keepDraft(form, id) {
    var d = state.drafts && state.drafts[id];
    if (d) {
      Array.prototype.forEach.call(form.elements, function (i) {
        var k = draftKey(i);
        if (!i.name || !(k in d)) return;
        if (i.type === 'checkbox' || i.type === 'radio') {
          if (i.checked !== d[k]) {
            i.checked = d[k];
            i.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } else {
          i.value = d[k];
        }
      });
    }
    var keep = function () { saveDraft(form, id); };
    form.addEventListener('input', keep);
    form.addEventListener('change', keep);
  }

  function dropDraft(id) {
    if (state.drafts && state.drafts[id]) {
      delete state.drafts[id];
      save(state);
    }
  }

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
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  }

  // What the Office currently holds about this person, from actual state.
  function facts() {
    var dets = (state.record || []).filter(function (r) { return r.kind === 'determination'; });
    var last = dets[dets.length - 1];
    return {
      permits: 0, // The Office has never issued one.
      entries: (state.record || []).length,
      recognition: isRecognised() ? 'Assumed' : (last ? last.status : 'Not assessed'),
      publicRecord: isRecognised() ? 'Eligible' : 'Withheld'
    };
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
    'Determination': '1.15',
    'Recognition': '1.5',
    'Applicant': '1.13',
    'Sponsor': '1.11',
    'Permit': '1.7'
  };

  // Longest first, so "Practitioner of Standing" is matched before "Standing".
  var TERM_NAMES = Object.keys(TERM_CLAUSES).concat(Object.keys(TERMS))
    .sort(function (a, b) { return b.length - a.length; });

  function termKey(name) { return TERM_CLAUSES[name] || name; }

  // Passed as `linked` where only cross-references should become links (letter titles).
  function allTermsLinked() {
    var o = {};
    TERM_NAMES.forEach(function (n) { o[termKey(n)] = true; });
    return o;
  }

  var PROSE = new RegExp(
    '\\((\\d+)\\.(\\d+)([a-z]?)\\)|\\(Part (\\d+)\\)|\\b(' +
    TERM_NAMES.join('|') + ')\\b', 'g');

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
        replacement = ['(', link('xref', anchorFor(m[1] + '.' + m[2]), m[1] + '.' + m[2] + m[3]), ')'];
      } else if (m[4]) {
        replacement = ['(', link('xref', 'charter.html#part-' + m[4], 'Part ' + m[4]), ')'];
      } else if (m[5] && !linked[termKey(m[5])]) {
        linked[termKey(m[5])] = true;
        replacement = [TERM_CLAUSES[m[5]]
          ? link('term', anchorFor(TERM_CLAUSES[m[5]]), m[5])
          : termButton(m[5])];
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

  // A disclosure listing the clauses a decision relied on, quoted from the Charter.
  function clauseDisclosure(numbers) {
    var d = el('details', 'disc');
    d.appendChild(el('summary', null, 'Clauses applied'));
    var body = el('div', 'disc__body');
    numbers.forEach(function (n) {
      var text = CLAUSES[n] || DEFINITIONS[n];
      if (!text) return;
      var row = el('p', 'clause');
      row.appendChild(link('xref mono-s', anchorFor(n), n));
      row.appendChild(el('span', null, text));
      body.appendChild(row);
    });
    d.appendChild(body);
    return d;
  }

  /* ----------------------------------------------------------------
     Letter on letterhead
     entry: { ref, date, status, letter: { day, re, title, paras: [{ t, q }], quote, quoteLabel, officer } }
     ---------------------------------------------------------------- */

  function renderLetter(entry) {
    var L = entry.letter;
    var linked = {};
    var art = el('article', 'letter');

    var head = el('header', 'letterhead');
    var office = el('p', 'letterhead__office', 'Standard Practice');
    office.appendChild(el('span', null, 'Office for Exceptions'));
    var meta = el('dl', 'letterhead__meta');
    [['Ref.', entry.ref], ['Date', formatDate(entry.date, L.day || 0)], ['Page', '1 of 1']]
      .forEach(function (pair) {
        meta.appendChild(el('dt', null, pair[0]));
        meta.appendChild(el('dd', null, pair[1]));
      });
    head.appendChild(office);
    head.appendChild(meta);
    art.appendChild(head);

    art.appendChild(el('p', 'letter__basis', 'Issued under the Practice Charter, Revision 03.'));
    if (L.re) art.appendChild(el('p', 'letter__re', L.re));

    var body = el('div', 'letter__body');
    if (entry.status) {
      var status = el('p', 'letter__status');
      status.appendChild(el('span', 'rev', entry.status));
      body.appendChild(status);
    }
    var title = appendProse(el('h2', 'letter__title'), L.title, allTermsLinked());
    if (L.titleRed) title.appendChild(document.createTextNode(L.titleRed)); // sessions from the previous build
    body.appendChild(title);
    if (L.quote) {
      // The person's own words: shown as lodged, never linked.
      body.appendChild(el('p', 'letter__quote-label', L.quoteLabel));
      body.appendChild(el('p', 'letter__quote', '“' + L.quote + '”'));
    }
    L.paras.forEach(function (p) {
      body.appendChild(appendProse(el('p', (p.q || p.red) ? 'is-qual' : null), p.t, linked));
    });
    art.appendChild(body);

    var sign = el('div', 'letter__sign');
    sign.appendChild(el('p', null, 'For the Office,'));
    sign.appendChild(el('span', 'letter__sign-line'));
    sign.appendChild(el('p', 'letter__officer', L.officer));
    art.appendChild(sign);

    var foot = el('footer', 'letter__foot');
    foot.appendChild(el('span', null, 'Standards in force. Exceptions by determination.'));
    foot.appendChild(el('span', null, '1'));
    art.appendChild(foot);

    return art;
  }

  /* ----------------------------------------------------------------
     Shared chrome
     ---------------------------------------------------------------- */

  function initChrome() {
    var label = isRecognised() ? 'Recognised' : 'Applicant';
    document.querySelectorAll('[data-standing-label]').forEach(function (n) { n.textContent = label; });

    var today = formatDate(new Date().toISOString(), 0);
    document.querySelectorAll('[data-today]').forEach(function (n) { n.textContent = today; });

    if (state && state.standing) {
      var f = facts();
      document.querySelectorAll('[data-fact]').forEach(function (n) {
        n.textContent = String(f[n.getAttribute('data-fact')]);
      });
    }

  }

  /* ----------------------------------------------------------------
     The gate
     ---------------------------------------------------------------- */

  function initGate() {
    var verify = document.getElementById('verify');
    var declared = document.getElementById('declared');
    var asApplicant = document.getElementById('as-applicant');
    var status = document.getElementById('gate-status');
    var assumed = document.getElementById('assumed');
    var calibration = document.getElementById('calibration');
    var receipt = document.getElementById('receipt');

    // An open case file is shown, and is closed only on confirmation.
    var file = document.getElementById('open-file');
    if (state && state.standing) {
      var n = (state.record || []).length;
      document.getElementById('file-standing').textContent = isRecognised() ? 'Recognised' : 'Applicant';
      document.getElementById('file-count').textContent = n + (n === 1 ? ' document' : ' documents');
      file.hidden = false;
      var closeBtn = document.getElementById('close-file');
      var confirmBox = document.getElementById('close-confirm');
      closeBtn.addEventListener('click', function () {
        confirmBox.hidden = false;
        closeBtn.setAttribute('aria-expanded', 'true');
        document.getElementById('close-confirmed').focus();
      });
      document.getElementById('close-cancel').addEventListener('click', function () {
        confirmBox.hidden = true;
        closeBtn.setAttribute('aria-expanded', 'false');
        closeBtn.focus();
      });
      document.getElementById('close-confirmed').addEventListener('click', function () {
        clear();
        state = null;
        file.hidden = true;
        status.textContent = 'Case file closed. Verifying your standing before you continue.';
        status.focus();
      });
    }

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
      begin('recognised');
      verify.hidden = true;
      asApplicant.hidden = true;
      status.hidden = true;
      assumed.hidden = false;
      assumed.focus();
    }

    function calibrate() {
      verify.hidden = true;
      asApplicant.hidden = true;
      status.textContent = 'Applicants complete one calibration.';
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
      status.hidden = true;
      receipt.hidden = false;
      receipt.focus();
    });
  }

  /* ----------------------------------------------------------------
     Form P-1: the dossier
     ---------------------------------------------------------------- */

  var SECTION_NAMES = {
    1: 'Proposed work',
    2: 'Prior practice',
    3: 'Evidence of standing',
    4: 'Sponsorship',
    5: 'Declaration'
  };

  function determine(app) {
    var re = 'Re: Application for a Permit to Make (Form P-1). ' +
      (app.title ? '“' + app.title + '”' : 'Title not stated.');

    if (app.standing === 'recognised') {
      return {
        status: 'Not Required',
        qualifies: false,
        summary: { submission: 'Complete', recognition: 'Assumed', publicRecord: 'Eligible' },
        clauses: ['3.2', '5.4'],
        letter: {
          re: re,
          title: 'Determination',
          paras: [
            { t: 'Your proposed Work is deemed a Continuation of Practice (3.2). No Permit is required.' },
            { t: 'Review will take place on completion, at the discretion of the Office (5.4a).' }
          ],
          officer: 'Deputy Registrar of Standing'
        }
      };
    }

    var paras = [
      { t: 'Your submission is complete. It has been found to require Evidence of Prior Practice (6.1), meaning Work made under a Permit (1.6).' },
      { t: 'This notice is not a refusal (5.3).', q: true }
    ];
    if (app.years >= 3) {
      paras.push({ t: 'Your declared years of Recognised Practice could not be verified. The Record holds no Permit in your name (8.2).' });
    }
    if (app.outcome === 'undetermined') {
      paras.push({ t: 'Your proposed Work has been classified as Personal Activity (3.4). Personal Activity is valued by the Office.' });
    }
    if (app.noSponsor) {
      paras.push({ t: 'Your application, made without a Sponsor, has been received (5.5).' });
    }
    paras.push({ t: 'Upon receipt of Evidence of Prior Practice, the Office will be pleased to reconsider your application.' });

    var clauses = ['6.1', '1.6', '5.3'];
    if (app.years >= 3) clauses.push('1.10', '8.2');
    if (app.outcome === 'undetermined') clauses.push('3.4', '1.12');
    if (app.noSponsor) clauses.push('5.5');

    return {
      status: 'Deferred',
      qualifies: true,
      summary: { submission: 'Complete', recognition: 'Deferred', publicRecord: 'Withheld' },
      clauses: clauses,
      letter: { re: re, title: 'Determination', paras: paras, officer: 'Deputy Registrar of Standing' }
    };
  }

  function initApply() {
    var form = document.getElementById('p1');
    var recognised = isRecognised();
    var noSponsor = document.getElementById('no-sponsor');
    var message = document.getElementById('submit-message');

    function val(name) {
      var e = form.elements[name];
      return e && e.value != null ? String(e.value).trim() : '';
    }

    function selectedGrounds() {
      return Array.prototype.slice.call(form.querySelectorAll('input[name="ground"]:checked'));
    }

    function groundComplete(box) {
      var inputs = document.getElementById('evidence-' + box.value).querySelectorAll('.input');
      return Array.prototype.every.call(inputs, function (i) { return i.value.trim() !== ''; });
    }

    // Each section: true (complete), false (outstanding) or 'waived'.
    function evaluate() {
      if (recognised) {
        return { 1: !!val('title'), 2: 'waived', 3: 'waived', 4: 'waived', 5: 'waived' };
      }
      var grounds = selectedGrounds();
      return {
        1: !!(val('title') && val('description') && form.elements.outcome.value),
        2: val('years') !== '' && !!val('prior'),
        3: grounds.length >= 3 && grounds.every(groundComplete),
        4: noSponsor.checked || !!(val('sponsor') && val('sponsorNo')),
        5: form.elements.notBegun.checked && form.elements.noStanding.checked
      };
    }

    function stateLabel(s) {
      if (s === 'waived') return ['Waived', 'state--waived'];
      return s ? ['Complete', 'state--complete'] : ['Outstanding', 'state--outstanding'];
    }

    function paint() {
      var s = evaluate();
      var required = 0;
      var done = 0;
      for (var i = 1; i <= 5; i++) {
        var lab = stateLabel(s[i]);
        document.querySelectorAll('[data-sec-state="' + i + '"]').forEach(function (n) {
          n.textContent = lab[0];
          n.className = 'state ' + lab[1];
        });
        if (s[i] !== 'waived') {
          required++;
          if (s[i]) done++;
        }
      }
      var complete = done === required;
      document.getElementById('st-submission').textContent =
        complete ? 'Complete' : 'Incomplete · ' + done + ' of ' + required;
      document.getElementById('st-submission').className =
        'rail-status' + (complete ? '' : ' blue');

      var count = selectedGrounds().length;
      var counter = document.getElementById('grounds-count');
      if (counter) counter.textContent = count + ' selected · minimum 3';
      if (complete) message.textContent = '';
      return { sections: s, complete: complete };
    }

    // Outcome: an undetermined outcome shows the 3.4 qualification beside it.
    var outcomeQual = document.getElementById('qual-outcome');
    form.querySelectorAll('input[name="outcome"]').forEach(function (r) {
      r.addEventListener('change', function () {
        outcomeQual.hidden = form.elements.outcome.value !== 'undetermined';
      });
    });

    // Grounds reveal their evidence fields.
    form.querySelectorAll('input[name="ground"]').forEach(function (box) {
      var fields = document.getElementById('evidence-' + box.value);
      box.addEventListener('change', function () { fields.hidden = !box.checked; });
    });

    // Sponsorship
    var sponsorQual = document.getElementById('qual-sponsor');
    noSponsor.addEventListener('change', function () {
      form.elements.sponsor.disabled = noSponsor.checked;
      form.elements.sponsorNo.disabled = noSponsor.checked;
      sponsorQual.hidden = !noSponsor.checked;
    });

    form.addEventListener('input', paint);
    form.addEventListener('change', paint);
    keepDraft(form, 'p1');
    paint();

    // A previous determination is cited, so a reapplication is made knowingly.
    var dets = state.record.filter(function (r) { return r.kind === 'determination'; });
    if (dets.length) {
      var last = dets[dets.length - 1];
      var priorLink = document.getElementById('prior-det-link');
      priorLink.textContent = last.ref;
      priorLink.href = 'determination.html?ref=' + encodeURIComponent(last.ref);
      document.getElementById('prior-det-status').textContent = last.status;
      document.getElementById('prior-det').hidden = false;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var result = paint();
      if (!result.complete) {
        var outstanding = [];
        for (var i = 1; i <= 5; i++) {
          if (result.sections[i] === false) outstanding.push('0' + i + ' ' + SECTION_NAMES[i]);
        }
        message.textContent = 'Submission incomplete. Outstanding: ' + outstanding.join(', ') + '.';
        var first = document.getElementById('sec-' + outstanding[0].charAt(1));
        var heading = first.querySelector('h2');
        first.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
        heading.focus({ preventScroll: true });
        return;
      }

      var grounds = selectedGrounds().map(function (box) {
        var evidence = {};
        document.getElementById('evidence-' + box.value).querySelectorAll('.input').forEach(function (i) {
          evidence[i.name] = i.value.trim();
        });
        return { ground: box.value, evidence: evidence };
      });

      var app = {
        submitted: new Date().toISOString(),
        standing: state.standing,
        title: val('title'),
        description: recognised ? '' : val('description'),
        outcome: recognised ? null : (form.elements.outcome.value || null),
        years: recognised ? null : (parseInt(val('years'), 10) || 0),
        prior: recognised ? '' : val('prior'),
        grounds: recognised ? [] : grounds,
        sponsor: recognised || noSponsor.checked ? null : val('sponsor'),
        sponsorNo: recognised || noSponsor.checked ? null : val('sponsorNo'),
        noSponsor: !recognised && noSponsor.checked
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
        summary: d.summary,
        clauses: d.clauses,
        letter: d.letter
      });
      dropDraft('p1');
      window.location.href = 'determination.html?ref=' + encodeURIComponent(ref);
    });
  }

  /* ----------------------------------------------------------------
     Determination and Form R-1
     ---------------------------------------------------------------- */

  var REVIEW_RESPONSE = 'Your request contends that the Charter is mistaken, rather than misapplied. It has been treated as an Observation (7.2). Your Determination is unaffected (7.4).';

  function initDetermination() {
    var slot = document.getElementById('letter-slot');
    var ref = null;
    try { ref = new URLSearchParams(window.location.search).get('ref'); } catch (e) {}
    var dets = (state.record || []).filter(function (r) { return r.kind === 'determination'; });
    var latest = dets[dets.length - 1] || null;
    var entry = ref ? findRecord(ref) : null;
    if (!entry || entry.kind !== 'determination') entry = latest;

    if (!entry) {
      document.getElementById('no-determination').hidden = false;
      document.querySelectorAll('[data-needs-determination]').forEach(function (n) { n.hidden = true; });
      return;
    }

    var deferred = entry.status === 'Deferred';
    var summary = entry.summary || {
      submission: 'Complete',
      recognition: deferred ? 'Deferred' : 'Assumed',
      publicRecord: deferred ? 'Withheld' : 'Eligible'
    };
    document.getElementById('det-ref').textContent = entry.ref;
    document.getElementById('det-status').textContent = entry.status;
    document.getElementById('det-submission').textContent = summary.submission;
    document.getElementById('det-recognition').textContent = summary.recognition;
    document.getElementById('det-public').textContent = summary.publicRecord;
    document.querySelectorAll('[data-det-view]').forEach(function (n) {
      n.hidden = n.getAttribute('data-det-view') !== (deferred ? 'deferred' : 'not-required');
    });

    // An earlier decision is shown as issued; the current position lives in the Record.
    if (entry !== latest) {
      var latestLink = document.getElementById('det-latest');
      latestLink.textContent = latest.ref;
      latestLink.href = 'determination.html?ref=' + encodeURIComponent(latest.ref);
      document.getElementById('det-superseded').hidden = false;
    }

    slot.appendChild(renderLetter(entry));
    document.getElementById('clauses-slot').appendChild(
      clauseDisclosure(entry.clauses || (deferred ? ['6.1', '1.6', '5.3'] : ['3.2', '5.4'])));

    document.querySelectorAll('[data-print]').forEach(function (b) {
      b.addEventListener('click', function () { window.print(); });
    });

    var toggle = document.getElementById('review-toggle');
    var review = document.getElementById('review');
    var reviewForm = document.getElementById('review-form');
    var reply = document.getElementById('review-reply');

    var reviewError = document.getElementById('review-error');
    var draftId = 'r1:' + entry.ref;

    function showReply(obsRef) {
      reviewForm.hidden = true;
      document.getElementById('review-ref').textContent = 'Ref. ' + obsRef;
      var text = document.getElementById('review-text');
      text.textContent = '';
      appendProse(text, REVIEW_RESPONSE, {});
      reply.hidden = false;
    }

    function openReview() {
      review.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', function () {
      var open = review.hidden;
      review.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) document.getElementById('review-title').focus();
    });

    // A request already lodged against this Determination is shown, not offered again.
    var lodged = (state.record || []).filter(function (r) {
      return r.kind === 'observation' && r.concerning === entry.ref;
    });
    if (lodged.length) {
      openReview();
      showReply(lodged[lodged.length - 1].ref);
    } else {
      keepDraft(reviewForm, draftId);
      if (state.drafts && state.drafts[draftId]) openReview();
    }

    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var grounds = reviewForm.elements.grounds.value.trim();
      if (!grounds) {
        fieldError(reviewError, reviewForm.elements.grounds, 'State the grounds on which the Charter was misapplied.');
        return;
      }
      fieldError(reviewError, reviewForm.elements.grounds, '');
      var obsRef = nextRef('OB');
      addRecord({
        ref: obsRef,
        date: new Date().toISOString(),
        kind: 'observation',
        document: 'Request for Review (Form R-1)',
        status: 'Treated as an Observation',
        qualifies: true,
        submitted: { clause: reviewForm.elements.clause.value.trim(), grounds: grounds },
        concerning: entry.ref,
        letter: {
          re: 'Re: Request for Review of Determination ' + entry.ref + ' (Form R-1).',
          title: 'Request for Review',
          quoteLabel: 'Grounds as lodged',
          quote: grounds,
          paras: [{ t: REVIEW_RESPONSE }],
          officer: 'Registrar of Observations'
        }
      });
      dropDraft(draftId);
      showReply(obsRef);
      reply.focus();
    });
  }

  /* ----------------------------------------------------------------
     Unregistered Practice: Form UM-1 and correspondence (9.1 → 9.4)
     ---------------------------------------------------------------- */

  var UM_LETTERS = [
    {
      day: 0,
      document: 'Notice of Receipt',
      status: 'Received',
      classification: 'Received',
      qualifies: false,
      title: 'Notice of Receipt (9.1)',
      officer: 'Receiving Officer, Unregistered Practice',
      paras: [
        { t: 'The Office acknowledges receipt of Work made without a current Permit.' },
        { t: 'This notice is not a penalty.', q: true }
      ]
    },
    {
      day: 14,
      document: 'Interim Classification',
      status: 'Personal Activity',
      classification: 'Personal Activity',
      qualifies: true,
      title: 'Interim Classification (9.2)',
      officer: 'Classification Officer',
      paras: [
        { t: 'Your Work has been classified as Personal Activity. Personal Activity is valued by the Office.' },
        { t: 'It may not be cited as experience, submitted for review, entered in your Record as Practice, or used as Evidence of Prior Practice.', q: true }
      ]
    },
    {
      day: 90,
      document: 'Adjustment of Standing',
      status: 'Recognised Practice: 0 years',
      classification: 'Personal Activity (preparatory)',
      qualifies: true,
      title: 'Adjustment of Standing (9.3)',
      officer: 'Deputy Registrar of Standing',
      paras: [
        { t: 'Recognised Practice is counted from the date of your first Permit. Work undertaken before that date is deemed preparatory.' }
      ]
    },
    {
      day: 90,
      document: 'Offer of Regularisation',
      status: 'Regularisation available on evidence',
      offer: true,
      qualifies: true,
      title: 'Offer of Regularisation (9.6)',
      officer: 'Clerk of Regularisation',
      paras: [
        { t: 'You may apply for Retrospective Regularisation.' },
        { t: 'Applications must include evidence that a Permit was held at the time of making.', q: true }
      ]
    },
    {
      day: 400,
      document: 'Notice of Recognition',
      status: 'Credited to Wren & Calloway',
      classification: 'Attributed to Wren & Calloway',
      qualifies: true,
      title: 'Notice of Recognition (9.4)',
      officer: 'Registrar of Attribution',
      paras: [
        { t: 'We are pleased to inform you that your Work has been recognised.' },
        { t: 'Having considered the Influences evident in the Work (1.14), the Office has determined that it constitutes a Continuation of the Practice of Wren & Calloway, Member Practice No. 0031. Attribution has been entered in the Record accordingly.' },
        { t: 'Your contribution has been recorded as Assistance.', q: true }
      ]
    }
  ];

  function initUnregistered() {
    var form = document.getElementById('um1');
    var disclosure = document.getElementById('disclosure');
    var correspondence = document.getElementById('correspondence');
    var letters = document.getElementById('letters');
    var end = document.getElementById('um-end');
    var stages = document.getElementById('case-stages');

    // Sessions from the previous build have no separate case reference.
    function caseRef() {
      var d = state.disclosure;
      return d.caseRef || d.refs[0] || '';
    }

    function workLine() {
      var what = state.disclosure.what;
      return what ? '“' + what + '”' : 'Description not stated.';
    }

    function entryFor(i) {
      var d = state.disclosure;
      if (d.refs[i]) return findRecord(d.refs[i]);
      var spec = UM_LETTERS[i];
      var entry = addRecord({
        ref: nextRef('UM'),
        date: d.date,
        kind: 'unregistered',
        document: spec.document,
        status: spec.status,
        qualifies: spec.qualifies,
        concerning: caseRef(),
        letter: {
          day: spec.day,
          re: 'Re: Voluntary Disclosure of Unregistered Practice (Form UM-1), Case ' + caseRef() + '. ' + workLine(),
          title: spec.title,
          paras: spec.paras,
          officer: spec.officer
        }
      });
      d.refs[i] = entry.ref;
      save(state);
      return entry;
    }

    // Case progress: only stages for which correspondence has been issued.
    function stageRow(day, documentName, status, ref, anchor) {
      var li = el('li');
      li.appendChild(el('span', null, day));
      li.appendChild(el('span', null, documentName));
      li.appendChild(el('span', 'case__status', status));
      var refCell = el('span');
      if (anchor) refCell.appendChild(link('xref', '#' + anchor, ref));
      li.appendChild(refCell);
      return li;
    }

    function renderStages() {
      var d = state.disclosure;
      var current = '';
      stages.textContent = '';
      for (var i = 0; i < d.shown; i++) {
        var spec = UM_LETTERS[i];
        var entry = findRecord(d.refs[i]);
        if (!entry) continue;
        stages.appendChild(stageRow('Day ' + String(spec.day).padStart(3, '0'), spec.document, entry.status, entry.ref, 'letter-' + i));
        if (spec.classification) current = spec.classification;
        if (spec.offer && d.regularisation) {
          var rr = findRecord(d.regularisation);
          if (rr) stages.appendChild(stageRow('Day ' + String(spec.day).padStart(3, '0'), 'Request for Regularisation', rr.status, rr.ref, 'rr-reply'));
        }
      }
      if (d.shown < UM_LETTERS.length) stages.appendChild(stageRow('—', 'Further correspondence', 'Pending', '', null));
      document.getElementById('case-current').textContent = current;
    }

    function rrResponse() {
      var entry = findRecord(state.disclosure.regularisation);
      var wrap = el('div', 'rr__reply');
      wrap.id = 'rr-reply';
      wrap.tabIndex = -1;
      wrap.appendChild(el('p', 'mono-s', 'Response to Form RR-1 · ' + entry.ref));
      wrap.appendChild(renderLetter(entry));
      return wrap;
    }

    // Form RR-1, attached to the Offer of Regularisation.
    function regularisation(offer) {
      var d = state.disclosure;
      var box = el('section', 'rr');
      box.setAttribute('aria-labelledby', 'rr-title');
      var head = el('div', 'rr__head');
      head.appendChild(el('p', 'mono-s', 'Form RR-1 · Attached to ' + offer.ref));
      var title = el('h3', 'mono', 'Request regularisation');
      title.id = 'rr-title';
      head.appendChild(title);
      box.appendChild(head);

      if (d.regularisation && findRecord(d.regularisation)) {
        box.appendChild(rrResponse());
        return box;
      }

      var meta = el('dl', 'rr__meta mono-s');
      [['Case', caseRef(), null], ['Work', workLine(), 'case__work']].forEach(function (row) {
        var div = el('div');
        div.appendChild(el('dt', null, row[0]));
        div.appendChild(el('dd', row[2], row[1]));
        meta.appendChild(div);
      });
      box.appendChild(meta);

      var f = el('form', 'rr__form no-print');
      f.noValidate = true;

      var field = el('div', 'field');
      var label = el('label', 'label', 'Permit reference held at the time of making');
      label.htmlFor = 'rr-permit';
      var input = el('input', 'input');
      input.type = 'text';
      input.id = 'rr-permit';
      input.name = 'permitRef';
      input.autocomplete = 'off';
      input.setAttribute('aria-describedby', 'rr-qual rr-error');
      field.appendChild(label);
      field.appendChild(input);
      f.appendChild(field);

      var choices = el('div', 'choices');
      var choice = el('label', 'choice');
      var none = el('input', 'box');
      none.type = 'checkbox';
      none.name = 'noPermit';
      choice.appendChild(none);
      choice.appendChild(el('span', null, 'No Permit was held at the time of making'));
      choices.appendChild(choice);
      f.appendChild(choices);

      var qual = appendProse(el('p', 'qual'), 'A reference is checked against the Record (8.2).', {});
      qual.id = 'rr-qual';
      f.appendChild(qual);
      var error = el('p', 'form-error');
      error.id = 'rr-error';
      error.setAttribute('role', 'status');
      f.appendChild(error);

      var submit = el('button', 'btn');
      submit.type = 'submit';
      submit.appendChild(document.createTextNode('Submit request '));
      var arrow = el('span', null, '→');
      arrow.setAttribute('aria-hidden', 'true');
      submit.appendChild(arrow);
      f.appendChild(submit);
      box.appendChild(f);

      none.addEventListener('change', function () {
        input.disabled = none.checked;
        fieldError(error, input, '');
      });
      keepDraft(f, 'rr1');

      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var given = input.value.trim();
        if (!given && !none.checked) {
          fieldError(error, input, 'State the Permit reference, or declare that none was held.');
          return;
        }
        fieldError(error, input, '');
        var declaredNone = none.checked;
        // A stated reference is checked against the Record, which holds no Permit.
        var paras = declaredNone ? [
          { t: 'You have declared that no Permit was held at the time of making.' },
          { t: 'Retrospective Regularisation is available only where authorisation existed at the time of making. Your Work remains Personal Activity (9.2).', q: true }
        ] : [
          { t: 'The reference stated does not correspond to a Permit in the Record. Matters which are not in the Record cannot be verified (8.2).' },
          { t: 'A reference is not evidence that a Permit was held. Evidence that a Permit was held is Evidence of Prior Practice: Work made under a Permit (1.6).', q: true },
          { t: 'On receipt of such evidence, the Office will be pleased to reconsider your request.' }
        ];
        var entry = addRecord({
          ref: nextRef('RR'),
          date: d.date,
          kind: 'regularisation',
          document: 'Request for Retrospective Regularisation (Form RR-1)',
          status: declaredNone ? 'Not eligible' : 'Permit not verified',
          qualifies: true,
          concerning: caseRef(),
          submitted: { permitRef: declaredNone ? null : given, noPermit: declaredNone, offer: offer.ref },
          letter: {
            day: UM_LETTERS[3].day,
            re: 'Re: Request for Retrospective Regularisation (Form RR-1), Case ' + caseRef() + '. ' + workLine(),
            title: 'Request for Regularisation',
            quoteLabel: declaredNone ? null : 'Permit reference as stated',
            quote: declaredNone ? null : given,
            paras: paras,
            officer: 'Clerk of Regularisation'
          }
        });
        d.regularisation = entry.ref;
        save(state);
        dropDraft('rr1');
        box.removeChild(meta);
        box.removeChild(f);
        var reply = rrResponse();
        box.appendChild(reply);
        renderStages();
        reply.focus();
      });

      return box;
    }

    function show(i, arriving) {
      var spec = UM_LETTERS[i];
      var entry = entryFor(i);
      var item = el('div', 'corr-item' + (arriving ? ' arrive' : ''));
      item.id = 'letter-' + i;
      item.tabIndex = -1;
      item.setAttribute('aria-label', 'Day ' + spec.day + ': ' + spec.document);

      var rail = el('div', 'corr-rail');
      rail.appendChild(el('p', 'mono-l', 'Day ' + String(spec.day).padStart(3, '0')));
      rail.appendChild(el('p', 'mono-s', entry.ref));
      rail.appendChild(el('p', 'mono-s', formatDate(entry.date, spec.day)));
      item.appendChild(rail);

      var main = el('div', 'corr-main');
      main.appendChild(renderLetter(entry));
      if (spec.offer) main.appendChild(regularisation(entry));
      item.appendChild(main);
      letters.appendChild(item);

      if (state.disclosure.shown < i + 1) {
        state.disclosure.shown = i + 1;
        save(state);
      }
      renderStages();

      var old = letters.parentNode.querySelector('.corr-next');
      if (old) old.remove();
      if (i < UM_LETTERS.length - 1) {
        var next = el('button', 'btn corr-next no-print');
        next.type = 'button';
        next.appendChild(document.createTextNode('Next correspondence '));
        var arrow = el('span', null, '↓');
        arrow.setAttribute('aria-hidden', 'true');
        next.appendChild(arrow);
        next.addEventListener('click', function () { show(i + 1, true); });
        letters.parentNode.insertBefore(next, end);
      } else {
        end.hidden = false;
      }

      if (arriving) {
        item.focus({ preventScroll: true });
        item.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
      }
    }

    function open() {
      disclosure.hidden = true;
      correspondence.hidden = false;
      document.getElementById('case-ref').textContent = caseRef();
      document.getElementById('case-work').textContent = workLine();
    }

    // Resume a disclosure already in progress.
    if (state.disclosure) {
      var shown = Math.max(1, state.disclosure.shown || 0);
      if (!state.disclosure.caseRef && !state.disclosure.refs.length) {
        state.disclosure.caseRef = nextRef('UC');
      }
      open();
      for (var i = 0; i < shown; i++) show(i, false);
      return;
    }

    var whatError = document.getElementById('what-error');
    var understood = document.getElementById('understood');
    var understoodError = document.getElementById('understood-error');
    keepDraft(form, 'um1');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var what = form.elements.what.value.trim();
      fieldError(whatError, form.elements.what, '');
      fieldError(understoodError, understood, '');
      if (!what) {
        fieldError(whatError, form.elements.what, 'Describe the Work being disclosed.');
        return;
      }
      if (!understood.checked) {
        fieldError(understoodError, understood, 'Confirm that disclosure is not an admission.');
        return;
      }
      state.disclosure = {
        what: what,
        understood: true,
        date: new Date().toISOString(),
        caseRef: nextRef('UC'),
        refs: [],
        shown: 0
      };
      save(state);
      dropDraft('um1');
      open();
      show(0, true);
    });
  }

  /* ----------------------------------------------------------------
     Your Record
     ---------------------------------------------------------------- */

  var DAY = 86400000;

  function effectiveTime(entry) {
    return new Date(entry.date).getTime() + ((entry.letter && entry.letter.day) || 0) * DAY;
  }

  function publicRow(work, enteredAs, ref) {
    var li = el('li');
    li.appendChild(el('span', 'public__work', work));
    var as = el('span');
    enteredAs.forEach(function (part) {
      as.appendChild(typeof part === 'string' ? document.createTextNode(part) : part);
    });
    li.appendChild(as);
    li.appendChild(el('span', 'nowrap', ref));
    return li;
  }

  // The Public Record admits Practice, not correspondence.
  function renderPublicRecord() {
    var rows = document.getElementById('public-rows');
    var admitted = (state.applications || []).filter(function (a) { return a.determination === 'Not Required'; });
    admitted.forEach(function (a) {
      rows.appendChild(publicRow(a.title ? '“' + a.title + '”' : 'Title not stated', ['Continuation of Practice'], a.ref));
    });
    document.getElementById('public-count').textContent = admitted.length;
    document.getElementById('public-empty').hidden = admitted.length > 0;

    // Disclosed Work attributed at Day 400 is public, under another name.
    var d = state.disclosure;
    if (d && d.shown >= UM_LETTERS.length && d.refs[UM_LETTERS.length - 1]) {
      document.getElementById('attributed-rows').appendChild(publicRow(
        d.what ? '“' + d.what + '”' : 'Description not stated',
        ['Practice of Wren & Calloway, Member Practice No. 0031. Your contribution: ', termButton('Assistance')],
        d.refs[UM_LETTERS.length - 1]));
      document.getElementById('attributed').hidden = false;
    }
  }

  function initRecord() {
    document.getElementById('standing-statement').textContent =
      isRecognised() ? 'Recognised (declared; assumed)' : 'Applicant (verified by calibration)';
    renderPublicRecord();

    var entries = (state.record || []).map(function (e, i) { return { e: e, i: i }; });
    entries.sort(function (a, b) {
      return (effectiveTime(a.e) - effectiveTime(b.e)) || (a.i - b.i);
    });

    if (!entries.length) {
      document.getElementById('record-empty').hidden = false;
      document.getElementById('record-table').hidden = true;
      return;
    }

    var tbody = document.getElementById('record-rows');
    entries.forEach(function (item, n) {
      var entry = item.e;
      var id = 'record-letter-' + n;

      var row = el('tr', 'record-row');
      var noCell = el('td', 'nowrap record-no', String(n + 1).padStart(2, '0'));
      noCell.setAttribute('data-label', 'No.');
      var refCell = el('td', 'nowrap', entry.ref);
      refCell.setAttribute('data-label', 'Ref.');
      var dateCell = el('td', 'nowrap', formatDate(entry.date, (entry.letter && entry.letter.day) || 0));
      dateCell.setAttribute('data-label', 'Date');

      var docCell = el('td');
      var toggle = el('button', 'record-open');
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', id);
      toggle.appendChild(document.createTextNode(entry.document + ' '));
      var arrow = el('span', null, '↓');
      arrow.setAttribute('aria-hidden', 'true');
      toggle.appendChild(arrow);
      docCell.appendChild(toggle);
      if (entry.concerning) docCell.appendChild(el('span', 'record-concerning', 'Concerning ' + entry.concerning));

      var statusCell = el('td', 'status' + (entry.qualifies ? ' is-qual' : ''), entry.status);
      statusCell.setAttribute('data-label', 'Status');

      [noCell, refCell, dateCell, docCell, statusCell].forEach(function (c) { row.appendChild(c); });

      var expansion = el('tr', 'record-letter');
      expansion.id = id;
      expansion.hidden = true;
      var cell = el('td');
      cell.colSpan = 5;
      var wrap = el('div', 'record-letter__inner');
      wrap.appendChild(renderLetter(entry));
      var tools = el('p', 'actions record-print no-print');
      if (entry.kind === 'determination') {
        tools.appendChild(link('link', 'determination.html?ref=' + encodeURIComponent(entry.ref), 'Open this Determination'));
      }
      var print = el('button', 'link', 'Print this letter');
      print.type = 'button';
      print.addEventListener('click', function () { printOne(expansion); });
      tools.appendChild(print);
      wrap.appendChild(tools);
      cell.appendChild(wrap);
      expansion.appendChild(cell);

      toggle.addEventListener('click', function () {
        var open = expansion.hidden;
        expansion.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        arrow.textContent = open ? '↑' : '↓';
      });

      tbody.appendChild(row);
      tbody.appendChild(expansion);
    });
  }

  function printOne(target) {
    document.body.classList.add('print-one');
    target.classList.add('print-target');
    var done = function () {
      document.body.classList.remove('print-one');
      target.classList.remove('print-target');
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
  }

  /* ----------------------------------------------------------------
     Form O-1
     ---------------------------------------------------------------- */

  var OBSERVATION_RECEIPT = 'Your observation concerns the Standard rather than your Determination. It has been filed with the Standard (7.3) and will be considered at the next Revision. Revisions are not scheduled. Your Determination is unaffected (7.4).';

  function initObservation() {
    var form = document.getElementById('o1');
    var receipt = document.getElementById('o1-receipt');
    var error = document.getElementById('o1-error');
    keepDraft(form, 'o1');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = form.elements.observation.value.trim();
      if (!text) {
        fieldError(error, form.elements.observation, 'An observation must state what it observes.');
        return;
      }
      fieldError(error, form.elements.observation, '');
      var ref = nextRef('OB');
      addRecord({
        ref: ref,
        date: new Date().toISOString(),
        kind: 'observation',
        document: 'Observation on the Standard (Form O-1)',
        status: 'Filed with the Standard',
        qualifies: true,
        submitted: { observation: text },
        letter: {
          re: 'Re: Observation on the Standard (Form O-1).',
          title: 'Observation on the Standard',
          quoteLabel: 'Observation as lodged',
          quote: text,
          paras: [{ t: 'Thank you. ' + OBSERVATION_RECEIPT }],
          officer: 'Registrar of Observations'
        }
      });
      dropDraft('o1');
      form.hidden = true;
      document.getElementById('o1-ref').textContent = 'Ref. ' + ref;
      appendProse(document.getElementById('o1-text'), OBSERVATION_RECEIPT, {});
      receipt.hidden = false;
      receipt.focus();
    });
  }

  function reducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
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
    if (page === 'unregistered') initUnregistered();
    if (page === 'record') initRecord();
    if (page === 'observation') initObservation();
  });
})();
