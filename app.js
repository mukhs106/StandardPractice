/* Standard Practice / Office for Exceptions
   Rendering, event binding, focus and processing presentation.
   Rendering never triggers a transition. */

import {
  OFFICE, LABELS, STANDING_NAMES, STAGE_NAMES, GATE, CALIBRATION, SPECIMENS, CLAIM, EVIDENCE,
  REGISTRATION, OPERATIONS, ACTIONS, CLEAR, RECORD, CASE_RECORD, EVENT_LABELS, PROVISIONS,
} from './copy.js';
import { initialState, transition, currentRole, COMPLETIONS } from './machine.js';
import { load, save, clear } from './store.js';

const PROCESSING_DELAY = 2000;

const regions = {
  header: document.getElementById('header'),
  caseInfo: document.getElementById('case-info'),
  active: document.getElementById('active'),
  caseIndex: document.getElementById('case-index'),
  panel: document.getElementById('panel'),
  margin: document.getElementById('margin'),
  status: document.getElementById('status'),
  printRecord: document.getElementById('print-record'),
};

let state = load();

// A pending operation found on load was interrupted, and waits for Resume processing.
let processingTimer = null;
let openPanelName = null;
let panelOpener = null;

/* ------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------ */

// Text always goes in through textContent, so visitor text is never parsed as HTML.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(className, text, onClick, type = 'button') {
  const node = el('button', className, text);
  node.type = type;
  if (onClick) node.addEventListener('click', onClick);
  return node;
}

function focusTarget(node) {
  node.tabIndex = -1;
  node.dataset.focus = '';
  return node;
}

function facts(rows) {
  const list = el('dl', 'facts');
  rows.forEach(([term, value, qualified]) => {
    const row = el('div');
    row.append(el('dt', '', term), el('dd', qualified ? 'is-qualified' : '', value));
    list.append(row);
  });
  return list;
}

function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, name) => values[name]);
}

// Actual date and time in the visitor's own time zone.
const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeStyle: 'long' });
const dateOnly = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' });

function formatMoment(iso) {
  return dateTime.format(new Date(iso));
}

function elapsedSince(iso) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

function newReference(taken) {
  const year = new Date().getFullYear();
  let reference;
  do {
    const digits = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    reference = `OE-${year}-${String(digits).padStart(6, '0')}`;
  } while (taken.has(reference));
  taken.add(reference);
  return reference;
}

function takenReferences() {
  const taken = new Set(state.documents.map((doc) => doc.reference));
  if (state.case) taken.add(state.case.reference);
  return taken;
}

function documentByKey(key) {
  return state.documents.find((doc) => doc.key === key);
}

/* ------------------------------------------------------------------
   Events
   ------------------------------------------------------------------ */

// Applies one event, or several as a single change, then saves once.
function send(events, payload) {
  const list = Array.isArray(events) ? events : [events];
  const context = {
    now: new Date().toISOString(),
    newReference: ((taken) => () => newReference(taken))(takenReferences()),
  };

  let next = state;
  for (const event of list) {
    next = transition(next, event, payload, context);
    if (!next) return;
  }

  const issuedBefore = state.documents.length;
  const wasPending = !!state.pending;
  state = next;
  save(state);
  if (state.pending && !wasPending) startProcessing();
  render();

  const issued = state.documents.slice(issuedBefore);
  announce(issued);
  if (!openPanelName) moveFocus(issued);
}

function announce(issued) {
  const parts = issued.map((doc) => doc.title);
  if (state.pending) parts.push(operationStatus());
  if (parts.length) regions.status.textContent = parts.join(' ');
}

// Focus goes to the newest notice. The view opens at the first one issued, so notices
// that arrive together are read in order.
function moveFocus(issued = []) {
  if (issued.length) {
    const find = (doc) => regions.active.querySelector(`[data-reference="${doc.reference}"]`);
    const first = find(issued[0]);
    const newest = find(issued[issued.length - 1]);
    if (newest) {
      newest.focus({ preventScroll: true });
      if (first.previousElementSibling) first.scrollIntoView();
      else window.scrollTo(0, 0);
      return;
    }
  }
  const target = regions.active.querySelector('[data-focus]');
  if (target) target.focus();
}

/* ------------------------------------------------------------------
   Processing
   ------------------------------------------------------------------ */

function operationStatus() {
  const { operation, cause } = state.pending;
  if (operation === 'classification') return OPERATIONS.classification;
  return cause === 'amended' ? OPERATIONS.attributionAmended : OPERATIONS.attributionAcknowledged;
}

function operationShort() {
  return state.pending.operation === 'classification'
    ? OPERATIONS.classificationShort
    : OPERATIONS.attributionShort;
}

function startProcessing() {
  window.clearTimeout(processingTimer);
  processingTimer = window.setTimeout(completeProcessing, PROCESSING_DELAY);
}

function completeProcessing() {
  window.clearTimeout(processingTimer);
  processingTimer = null;
  if (state.pending) send(COMPLETIONS[state.pending.operation]);
}

function processingNode() {
  const wrap = el('div', 'processing');
  wrap.append(focusTarget(el('p', 'processing__status', operationStatus())));

  const actions = el('div', 'actions');
  if (!processingTimer) {
    actions.append(button('button', OPERATIONS.resume, () => {
      startProcessing();
      render();
      moveFocus();
    }));
  }
  actions.append(button('link', OPERATIONS.issueNow, completeProcessing));
  wrap.append(actions);
  return wrap;
}

/* ------------------------------------------------------------------
   Persistent regions
   ------------------------------------------------------------------ */

function panelControl(name, text) {
  const control = button('link', text, (event) => togglePanel(name, event.currentTarget));
  control.dataset.panel = name;
  control.setAttribute('aria-controls', 'panel');
  control.setAttribute('aria-expanded', String(openPanelName === name));
  return control;
}

function renderHeader() {
  const office = el('p', 'header__office');
  office.append(el('span', 'header__name', OFFICE.name), el('span', '', OFFICE.division));

  const right = el('div', 'header__case');
  if (state.standing) {
    right.append(el('p', '', `${LABELS.standing}: ${STANDING_NAMES[state.standing]}`));
  }
  if (state.case) right.append(panelControl('record', ACTIONS.caseRecord));
  right.append(panelControl('provisions', ACTIONS.provisions));

  regions.header.replaceChildren(office, right);
}

function renderCaseInfo() {
  regions.caseInfo.setAttribute('aria-label', LABELS.caseInformation);
  const rows = [];
  if (state.case) rows.push([LABELS.case, state.case.reference]);
  if (state.standing) rows.push([LABELS.standing, STANDING_NAMES[state.standing]]);
  rows.push([LABELS.stage, STAGE_NAMES[state.stage], state.stage === 'deferred']);
  regions.caseInfo.replaceChildren(facts(rows));
}

function renderMargin() {
  regions.margin.setAttribute('aria-label', LABELS.processing);
  const rows = [[LABELS.processingDate, dateOnly.format(new Date())]];
  if (state.case) {
    rows.push([LABELS.caseElapsed, elapsedSince(state.case.openedAt)]);
    rows.push([LABELS.currentOperation, state.pending ? operationShort() : LABELS.noOperation]);
  }
  regions.margin.replaceChildren(facts(rows));
}

/* ------------------------------------------------------------------
   Shared letterhead
   ------------------------------------------------------------------ */

function citation(run) {
  const link = el('a', 'link', run.text);
  link.href = `#${run.cite}`;
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showPanel('provisions', link, run.cite);
  });
  return link;
}

function paragraph(runs) {
  const node = el('p');
  runs.forEach((run) => {
    const content = run.cite ? citation(run) : el('span', '', run.text);
    if (run.qualified) content.classList.add('is-qualified');
    node.append(content);
  });
  return node;
}

// Draws an issued document from its stored, frozen text.
function documentNode(doc) {
  const letter = el('article', 'letter');
  letter.dataset.reference = doc.reference;
  letter.tabIndex = -1;
  letter.setAttribute('aria-label', doc.title);

  const head = el('header', 'letterhead');
  const meta = el('dl', 'letterhead__meta');
  [
    [LABELS.reference, doc.reference],
    [LABELS.case, doc.caseReference],
    [LABELS.issued, formatMoment(doc.issued)],
    [LABELS.concerning, doc.concerning],
  ].forEach(([term, value]) => meta.append(el('dt', '', term), el('dd', '', value)));
  const authority = el('dd');
  authority.append(citation(doc.authority));
  meta.append(el('dt', '', LABELS.authority), authority);
  head.append(el('p', 'letterhead__issuer', OFFICE.issuer), meta);

  const body = el('div', 'letter__body');
  if (doc.status) {
    const decision = el('div', 'letter__decision');
    decision.append(el('p', 'letter__status is-qualified', doc.status));
    if (doc.note) decision.append(el('p', 'letter__note is-qualified', doc.note));
    body.append(decision);
  }
  body.append(el('h2', 'letter__title', doc.title));
  doc.body.forEach((runs) => body.append(paragraph(runs)));
  const sign = el('div', 'letter__sign');
  sign.append(el('p', '', doc.signOff), el('p', '', doc.officer));
  body.append(sign);

  letter.append(head, body);
  return letter;
}

function documentStack(docs) {
  const stack = el('div', 'stack');
  docs.forEach((doc) => stack.append(documentNode(doc)));
  return stack;
}

/* ------------------------------------------------------------------
   Form fields
   ------------------------------------------------------------------ */

function field(id, labelText, control, hintText) {
  const wrap = el('div', 'field');
  const label = el('label', 'field__label', labelText);
  label.htmlFor = id;
  control.id = id;
  control.classList.add('input');
  wrap.append(label);
  if (hintText) {
    const hint = el('p', 'field__hint', hintText);
    hint.id = `${id}-hint`;
    control.setAttribute('aria-describedby', hint.id);
    wrap.append(hint);
  }
  wrap.append(control);
  return wrap;
}

function setFieldError(control, message, anchor = control) {
  const id = `${control.id}-error`;
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const described = (control.getAttribute('aria-describedby') || '')
    .split(' ').filter((token) => token && token !== id);

  if (message) {
    const error = el('p', 'field__error', message);
    error.id = id;
    anchor.after(error);
    control.setAttribute('aria-invalid', 'true');
    described.push(id);
  } else {
    control.removeAttribute('aria-invalid');
  }

  if (described.length) control.setAttribute('aria-describedby', described.join(' '));
  else control.removeAttribute('aria-describedby');
}

function submitActions(text) {
  const actions = el('div', 'form__actions');
  actions.append(button('button', text, null, 'submit'));
  return actions;
}

function plainForm() {
  const form = el('form');
  form.noValidate = true;
  return form;
}

/* ------------------------------------------------------------------
   Gate
   ------------------------------------------------------------------ */

function renderGate() {
  const form = plainForm();
  form.className = 'gate__declare';

  const label = el('label', 'check');
  const box = el('input');
  box.type = 'checkbox';
  box.setAttribute('aria-describedby', 'gate-qualification');
  label.append(box, el('span', '', GATE.declaration));

  const actions = el('div', 'actions');
  actions.append(
    button('button', GATE.continue, null, 'submit'),
    button('link', GATE.asApplicant, () => send('CONTINUE_AS_APPLICANT')),
  );
  form.append(label, actions);

  // An undeclared Continue is the Applicant route: only a declaration establishes recognition.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    send(box.checked ? 'DECLARE_RECOGNISED' : 'CONTINUE_AS_APPLICANT');
  });

  const qualification = el('p', 'qualification is-qualified', GATE.qualification);
  qualification.id = 'gate-qualification';

  regions.active.replaceChildren(
    el('p', 'eyebrow', GATE.eyebrow),
    focusTarget(el('h1', 'heading', GATE.heading)),
    form,
    qualification,
  );
}

/* ------------------------------------------------------------------
   Calibration
   ------------------------------------------------------------------ */

function renderCalibration() {
  const form = plainForm();

  const grid = el('div', 'specimens');
  const template = document.getElementById('specimens');
  template.content.querySelectorAll('svg').forEach((svg) => {
    const id = svg.dataset.specimen;
    const tile = button('tile', undefined, () => {
      tile.setAttribute('aria-pressed', String(tile.getAttribute('aria-pressed') !== 'true'));
    });
    tile.dataset.specimen = id;
    tile.setAttribute('aria-pressed', 'false');
    tile.setAttribute('aria-label', SPECIMENS[id]);
    tile.append(svg.cloneNode(true));
    grid.append(tile);
  });

  form.append(grid, submitActions(CALIBRATION.submit));

  // Any submission completes calibration. Selections are retained and never scored.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const selections = [...grid.querySelectorAll('[aria-pressed="true"]')].map((tile) => tile.dataset.specimen);
    send('SUBMIT_CALIBRATION', { selections });
  });

  regions.active.replaceChildren(
    focusTarget(el('h1', 'heading', CALIBRATION.heading)),
    el('p', 'support', CALIBRATION.support),
    form,
  );
}

/* ------------------------------------------------------------------
   Claim
   ------------------------------------------------------------------ */

function renderClaim() {
  const receiptText = state.standing === 'recognised' ? GATE.recognisedReceipt : CALIBRATION.receipt;
  const form = plainForm();

  const title = el('input');
  title.type = 'text';
  title.autocomplete = 'off';
  title.required = true;
  const description = el('textarea');
  description.rows = 4;

  // The title alone is sufficient for a recognised practitioner.
  const descriptionRequired = state.standing !== 'recognised';
  description.required = descriptionRequired;

  form.append(
    field('claim-title', CLAIM.titleLabel, title),
    field('claim-description', CLAIM.descriptionLabel, description, CLAIM.descriptionHint),
    submitActions(CLAIM.submit),
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const titleText = title.value.trim();
    const descriptionText = description.value.trim();
    const titleError = titleText ? '' : CLAIM.titleError;
    const descriptionError = descriptionRequired && !descriptionText ? CLAIM.descriptionError : '';
    setFieldError(title, titleError);
    setFieldError(description, descriptionError);
    if (titleError) { title.focus(); return; }
    if (descriptionError) { description.focus(); return; }
    send('SUBMIT_CLAIM', { title: titleText, description: descriptionText });
  });

  regions.active.replaceChildren(
    el('h1', 'visually-hidden', STAGE_NAMES.claim),
    focusTarget(el('p', 'receipt', receiptText)),
    form,
  );
}

/* ------------------------------------------------------------------
   Evidence
   ------------------------------------------------------------------ */

function renderEvidence() {
  const form = plainForm();
  const group = el('fieldset', 'choices');
  group.append(focusTarget(el('legend', 'choices__legend', EVIDENCE.heading)));

  const inputs = {};
  const reveal = {};

  ['permit', 'independent', 'none'].forEach((choice) => {
    const label = el('label', 'check');
    const radio = el('input');
    radio.type = 'radio';
    radio.name = 'evidence';
    radio.value = choice;
    radio.id = `evidence-${choice}`;
    label.append(radio, el('span', '', EVIDENCE.choices[choice]));
    group.append(label);

    if (choice === 'permit') {
      inputs.permit = el('input');
      inputs.permit.type = 'text';
      inputs.permit.autocomplete = 'off';
      reveal.permit = field('evidence-permit-text', EVIDENCE.permitLabel, inputs.permit);
    }
    if (choice === 'independent') {
      inputs.independent = el('textarea');
      inputs.independent.rows = 3;
      reveal.independent = field('evidence-independent-text', EVIDENCE.independentLabel, inputs.independent);
    }
    if (reveal[choice]) {
      reveal[choice].hidden = true;
      group.append(reveal[choice]);
    }
    radio.addEventListener('change', () => {
      Object.keys(reveal).forEach((key) => { reveal[key].hidden = key !== choice; });
    });
  });

  form.append(group, submitActions(EVIDENCE.submit));

  const firstRadio = () => group.querySelector('input[type="radio"]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const chosen = group.querySelector('input[type="radio"]:checked');

    setFieldError(firstRadio(), chosen ? '' : EVIDENCE.choiceError, group.lastElementChild);
    Object.values(inputs).forEach((input) => setFieldError(input, ''));
    if (!chosen) { firstRadio().focus(); return; }

    const choice = chosen.value;
    const text = inputs[choice] ? inputs[choice].value.trim() : '';
    if (inputs[choice] && !text) {
      setFieldError(inputs[choice], choice === 'permit' ? EVIDENCE.permitError : EVIDENCE.independentError);
      inputs[choice].focus();
      return;
    }
    send('SUBMIT_EVIDENCE', { choice, text });
  });

  regions.active.replaceChildren(el('h1', 'visually-hidden', STAGE_NAMES.evidence), form);
}

/* ------------------------------------------------------------------
   Registration
   ------------------------------------------------------------------ */

function registrationAction(open) {
  const wrap = el('div', 'following');
  const toggle = focusTarget(button(
    'button',
    REGISTRATION.action,
    () => send(open ? 'CLOSE_REGISTRATION' : 'OPEN_REGISTRATION'),
  ));
  toggle.tabIndex = 0;
  toggle.setAttribute('aria-expanded', String(open));
  wrap.append(toggle, el('p', 'support', REGISTRATION.support));
  return wrap;
}

function preservedClaim() {
  const list = el('dl', 'preserved');
  const add = (term, value) => {
    const row = el('div');
    row.append(el('dt', '', term), el('dd', 'visitor-text', value));
    list.append(row);
  };
  add(CLAIM.titleLabel, state.claim.title);
  if (state.claim.description) add(CLAIM.descriptionLabel, state.claim.description);
  return list;
}

function registrationForm() {
  const form = plainForm();
  form.className = 'following';

  const label = el('label', 'check');
  const box = el('input');
  box.type = 'checkbox';
  box.id = 'registration-declaration';
  label.append(box, el('span', '', REGISTRATION.declaration));
  label.classList.add('form__actions');
  form.append(preservedClaim(), label, submitActions(REGISTRATION.submit));

  // The visitor must make this declaration. An intention is not converted into work on their behalf.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    setFieldError(box, box.checked ? '' : REGISTRATION.declarationError, label);
    if (!box.checked) { box.focus(); return; }
    send('REGISTER_BEGUN_WORK', { declared: true });
  });
  return form;
}

/* ------------------------------------------------------------------
   Final record: two adjacent columns
   ------------------------------------------------------------------ */

function submissionCell() {
  const cell = el('td');
  cell.append(el('p', 'visitor-text', state.claim.title));
  if (state.claim.description) cell.append(el('p', 'visitor-text', state.claim.description));
  return cell;
}

function recordRows() {
  if (state.standing === 'recognised') {
    return [
      [RECORD.authorshipAsserted, RECORD.authorshipAccepted],
      [RECORD.declarationSubmitted, RECORD.entry],
      ['', RECORD.permit],
    ];
  }
  const correction = state.statement ? state.statement.text : RECORD.noCorrection;
  return [
    [RECORD.authorshipAsserted, fill(RECORD.practice, { practice: state.practice })],
    [fill(RECORD.yourCorrection, { correction }), fill(RECORD.role, { role: currentRole(state) })],
    [RECORD.applicationSubmitted, RECORD.applicationDeferred, true],
  ];
}

function recordTable() {
  const table = el('table', 'record__table');
  const caption = el('caption', 'visually-hidden', ACTIONS.caseRecord);

  const head = el('thead');
  const headRow = el('tr');
  [RECORD.yourSubmission, RECORD.officialEntry].forEach((text) => {
    const th = el('th', '', text);
    th.scope = 'col';
    headRow.append(th);
  });
  head.append(headRow);

  const body = el('tbody');
  const first = el('tr');
  first.append(submissionCell(), submissionCell());
  body.append(first);
  recordRows().forEach(([submitted, official, qualified]) => {
    const row = el('tr');
    const entry = el('td');
    entry.append(qualified ? el('span', 'is-qualified', official) : official);
    row.append(el('td', '', submitted), entry);
    body.append(row);
  });

  table.append(caption, head, body);
  return table;
}

function recordSection() {
  const section = el('section', 'record');
  section.append(recordTable());
  const actions = el('div', 'actions');
  actions.append(
    button('button', ACTIONS.printCaseRecord, () => window.print()),
    button('link', ACTIONS.viewProvisions, (event) => showPanel('provisions', event.currentTarget)),
  );
  section.append(actions);
  return section;
}

/* ------------------------------------------------------------------
   Stages holding documents
   The notices shown in the active column at each stage; the rest are in the case index.
   ------------------------------------------------------------------ */

function activeDocumentKeys() {
  const recognised = state.standing === 'recognised';
  return {
    continuation: ['continuation'],
    deferred: ['determination'],
    registration: ['determination'],
    receipt: ['receipt'],
    classification: ['receipt', 'classification'],
    attribution_review: ['receipt', 'classification', 'proposedAttribution'],
    amendment: ['amendment'],
    acknowledgement: ['proposedAttribution'],
    attribution: ['attribution'],
    record: recognised ? [] : ['attribution'],
  }[state.stage] || [];
}

function stageControls() {
  const controls = [];
  const actions = el('div', 'actions');

  switch (state.stage) {
    case 'continuation':
      actions.append(focusTarget(button('button', ACTIONS.viewCaseRecord, () => send('VIEW_CASE_RECORD'))));
      actions.firstChild.tabIndex = 0;
      controls.push(actions);
      break;
    case 'deferred':
      controls.push(registrationAction(false));
      break;
    case 'registration':
      controls.push(registrationAction(true), registrationForm());
      break;
    case 'attribution_review':
      actions.append(
        button('button', ACTIONS.assertAuthorship, () => send('ASSERT_AUTHORSHIP')),
        button('button', ACTIONS.acknowledge, () => send('ACKNOWLEDGE_NOTICE')),
      );
      controls.push(actions);
      break;
    case 'amendment':
      if (!state.pending) {
        actions.append(button('button', ACTIONS.viewAmendedEntry, () => send('VIEW_AMENDED_ENTRY')));
        controls.push(actions);
      }
      break;
    case 'record': {
      const section = recordSection();
      if (state.standing === 'recognised') focusTarget(section);
      controls.push(section);
      break;
    }
    default:
      break;
  }

  if (state.pending) controls.push(processingNode());
  return controls;
}

function renderDocumentStage() {
  const docs = activeDocumentKeys().map(documentByKey).filter(Boolean);
  regions.active.replaceChildren(
    el('h1', 'visually-hidden', STAGE_NAMES[state.stage]),
    documentStack(docs),
    ...stageControls(),
  );
}

/* ------------------------------------------------------------------
   Case index: earlier documents, collapsed beneath the active task
   ------------------------------------------------------------------ */

function renderCaseIndex() {
  const active = activeDocumentKeys();
  const earlier = state.documents.filter((doc) => !active.includes(doc.key));
  regions.caseIndex.hidden = !!openPanelName || !earlier.length;
  if (!earlier.length) { regions.caseIndex.replaceChildren(); return; }

  const open = new Set([...regions.caseIndex.querySelectorAll('details[open]')].map((item) => item.dataset.reference));
  const items = earlier.map((doc) => {
    const item = el('details', 'case-index__item');
    item.dataset.reference = doc.reference;
    item.open = open.has(doc.reference);
    const summary = el('summary');
    summary.append(el('span', '', doc.title), el('span', '', doc.reference));
    item.append(summary, documentNode(doc));
    return item;
  });
  regions.caseIndex.replaceChildren(el('h2', 'case-index__heading', LABELS.caseIndex), ...items);
}

/* ------------------------------------------------------------------
   Secondary panels: open over the active column, which is kept as it was
   ------------------------------------------------------------------ */

function panelFrame(title) {
  const head = el('div', 'panel__head');
  const heading = el('h2', 'panel__title', title);
  heading.tabIndex = -1;
  heading.dataset.panelHeading = '';
  head.append(heading, button('link', LABELS.close, closePanel));
  return head;
}

function provisionsContent() {
  const content = el('div', 'provisions');
  PROVISIONS.forEach(({ section, clauses }) => {
    const heading = el('h3', 'provisions__section', section);
    heading.id = section.toLowerCase().replace(' ', '-');
    heading.tabIndex = -1;
    content.append(heading);
    clauses.forEach(({ number, text }) => {
      const clause = el('div', 'clause');
      clause.id = `clause-${number.replace('.', '-')}`;
      clause.tabIndex = -1;
      clause.append(el('span', '', number), el('p', '', text));
      content.append(clause);
    });
  });
  return content;
}

function panelSection(title, ...content) {
  const section = el('section', 'panel__section');
  section.append(el('h3', 'panel__section-title', title), ...content);
  return section;
}

function caseRecordContent() {
  const content = [];

  const submission = el('div', 'panel__list');
  submission.append(el('p', 'visitor-text', state.claim.title));
  if (state.claim.description) submission.append(el('p', 'visitor-text', state.claim.description));
  content.push(panelSection(CASE_RECORD.originalSubmission, submission));

  if (state.calibration) {
    const names = state.calibration.selections.map((id) => SPECIMENS[id]).join(', ');
    content.push(panelSection(CASE_RECORD.calibration, el('p', 'panel__list', names || CASE_RECORD.noSelections)));
  }

  if (state.evidence) {
    const evidence = el('div', 'panel__list');
    evidence.append(el('p', '', EVIDENCE.choices[state.evidence.choice]));
    if (state.evidence.text) evidence.append(el('p', 'visitor-text', state.evidence.text));
    content.push(panelSection(CASE_RECORD.evidenceSubmitted, evidence));
  }

  if (state.statement) {
    content.push(panelSection(CASE_RECORD.statementRetained, el('p', 'panel__list', state.statement.text)));
  }

  const events = el('ol', 'panel__list');
  state.events.filter((entry) => EVENT_LABELS[entry.type]).forEach((entry) => {
    const row = el('li', 'panel__row');
    row.append(el('span', '', EVENT_LABELS[entry.type]), el('span', '', formatMoment(entry.at)));
    events.append(row);
  });
  content.push(panelSection(CASE_RECORD.events, events));

  if (state.documents.length) {
    const documents = el('div');
    state.documents.forEach((doc) => {
      const item = el('div', 'panel__document panel__list');
      item.append(el('p', 'panel__document-title', `${doc.title} ${doc.reference}`));
      [
        [CASE_RECORD.received, doc.received],
        [CASE_RECORD.started, doc.started],
        [CASE_RECORD.issued, doc.issued],
      ].forEach(([label, moment]) => {
        const row = el('p', 'panel__row');
        row.append(el('span', '', label), el('span', '', formatMoment(moment)));
        item.append(row);
      });
      documents.append(item);
    });
    content.push(panelSection(CASE_RECORD.documents, documents));
  }

  const clearSection = el('section', 'panel__section');
  clearSection.append(clearControl());
  content.push(clearSection);
  return content;
}

function renderPanel() {
  regions.panel.hidden = !openPanelName;
  regions.active.hidden = !!openPanelName;
  if (!openPanelName) { regions.panel.replaceChildren(); return; }

  // The provisions never change, so processing behind the panel does not redraw them.
  if (regions.panel.dataset.name === openPanelName && openPanelName === 'provisions') return;
  regions.panel.dataset.name = openPanelName;

  if (openPanelName === 'provisions') {
    regions.panel.replaceChildren(panelFrame(ACTIONS.provisions), provisionsContent());
  } else {
    regions.panel.replaceChildren(panelFrame(ACTIONS.caseRecord), ...caseRecordContent());
  }
}

// Opening or closing a panel leaves the active column in place, so nothing typed there is lost.
function renderPanelState() {
  renderPanel();
  regions.caseIndex.hidden = !!openPanelName || !regions.caseIndex.hasChildNodes();
  regions.header.querySelectorAll('[data-panel]').forEach((control) => {
    control.setAttribute('aria-expanded', String(control.dataset.panel === openPanelName));
  });
}

function showPanel(name, opener, targetId) {
  // Returning from a clause goes back to the correspondence that cited it.
  if (!openPanelName) panelOpener = opener;
  openPanelName = name;
  regions.panel.dataset.name = '';
  renderPanelState();
  const target = targetId ? document.getElementById(targetId) : regions.panel.querySelector('[data-panel-heading]');
  target.focus({ preventScroll: true });
  if (targetId) target.scrollIntoView();
  else window.scrollTo(0, 0);
}

function closePanel() {
  const name = openPanelName;
  openPanelName = null;
  regions.panel.dataset.name = '';
  renderPanelState();
  const opener = panelOpener && panelOpener.isConnected
    ? panelOpener
    : regions.header.querySelector(`[data-panel="${name}"]`);
  panelOpener = null;
  opener.focus();
}

function togglePanel(name, opener) {
  if (openPanelName === name) closePanel();
  else showPanel(name, opener);
}

/* ------------------------------------------------------------------
   Clear local case data
   ------------------------------------------------------------------ */

function clearControl() {
  const wrap = el('div', 'actions');
  const start = button('link', CLEAR.action, () => {
    const confirm = button('button', CLEAR.confirm, () => {
      window.clearTimeout(processingTimer);
      processingTimer = null;
      clear();
      state = initialState();
      openPanelName = null;
      panelOpener = null;
      regions.status.textContent = '';
      regions.panel.dataset.name = '';
      render();
      moveFocus();
      window.scrollTo(0, 0);
    });
    wrap.replaceChildren(el('p', '', CLEAR.warning), confirm);
    confirm.focus();
  });
  wrap.append(start);
  return wrap;
}

/* ------------------------------------------------------------------
   Print: every issued document, and the final record once entered
   ------------------------------------------------------------------ */

function renderPrintRecord() {
  const nodes = state.documents.map(documentNode);
  if (state.stage === 'record') {
    const record = el('section', 'record');
    record.append(recordTable());
    nodes.push(record);
  }
  regions.printRecord.replaceChildren(...nodes);
}

/* ------------------------------------------------------------------
   Start
   ------------------------------------------------------------------ */

const STAGE_VIEWS = {
  gate: renderGate,
  calibration: renderCalibration,
  claim: renderClaim,
  evidence: renderEvidence,
};

function render() {
  renderHeader();
  renderCaseInfo();
  renderMargin();
  (STAGE_VIEWS[state.stage] || renderDocumentStage)();
  renderCaseIndex();
  renderPanel();
  renderPrintRecord();
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && openPanelName) closePanel();
});

// Another tab changed the case: show what is now stored, and leave its processing to that tab.
window.addEventListener('storage', () => {
  window.clearTimeout(processingTimer);
  processingTimer = null;
  state = load();
  if (!state.case && openPanelName === 'record') openPanelName = null;
  render();
});

render();
setInterval(renderMargin, 1000);
