/* Standard Practice / Office for Exceptions
   Permitted stages, named events and transition rules. No rendering, no storage.

   Recognised:
   gate → claim → continuation → record

   Applicant:
   gate → calibration → claim → evidence → deferred
   → registration → receipt → classification
   → attribution review → amendment or acknowledgement
   → attribution → record */

import { DOCUMENTS, EVIDENCE, REGISTRATION, ROLES, OFFICIAL, AUTHORSHIP_STATEMENT } from './copy.js';

const claimTarget = (state) => (state.standing === 'recognised' ? 'continuation' : 'evidence');

const TRANSITIONS = {
  gate: {
    DECLARE_RECOGNISED: 'claim',
    CONTINUE_AS_APPLICANT: 'calibration',
  },
  calibration: {
    SUBMIT_CALIBRATION: 'claim',
  },
  claim: {
    SUBMIT_CLAIM: claimTarget,
  },
  continuation: {
    VIEW_CASE_RECORD: 'record',
  },
  evidence: {
    SUBMIT_EVIDENCE: 'deferred',
  },
  deferred: {
    OPEN_REGISTRATION: 'registration',
  },
  registration: {
    CLOSE_REGISTRATION: 'deferred',
    REGISTER_BEGUN_WORK: 'receipt',
  },
  receipt: {
    COMPLETE_CLASSIFICATION: 'classification',
  },
  classification: {
    ISSUE_PROPOSED_ATTRIBUTION: 'attribution_review',
  },
  attribution_review: {
    ASSERT_AUTHORSHIP: 'amendment',
    ACKNOWLEDGE_NOTICE: 'acknowledgement',
  },
  amendment: {
    VIEW_AMENDED_ENTRY: 'amendment',
    COMPLETE_ATTRIBUTION: 'attribution',
  },
  acknowledgement: {
    COMPLETE_ATTRIBUTION: 'attribution',
  },
  attribution: {
    ENTER_RECORD: 'record',
  },
  record: {},
};

export const STAGES = Object.keys(TRANSITIONS);

// What each pending operation does when it completes: applied together, as one change.
export const COMPLETIONS = {
  classification: ['COMPLETE_CLASSIFICATION', 'ISSUE_PROPOSED_ATTRIBUTION'],
  attribution: ['COMPLETE_ATTRIBUTION', 'ENTER_RECORD'],
};

export function initialState() {
  return {
    stage: 'gate',
    standing: null,
    calibration: null,
    case: null,
    claim: null,
    evidence: null,
    registration: null,
    statement: null,
    acknowledgement: null,
    classification: null,
    practice: null,
    contribution: [],
    events: [],
    documents: [],
    pending: null,
  };
}

// The role as it now stands. Earlier entries are kept beneath it.
export function currentRole(state) {
  const latest = state.contribution[state.contribution.length - 1];
  return latest ? latest.role : null;
}

// The stage an event leads to from the current state, or null if it is not permitted.
export function nextStage(state, event) {
  const target = TRANSITIONS[state.stage] && TRANSITIONS[state.stage][event];
  if (!target) return null;
  return typeof target === 'function' ? target(state) : target;
}

/* ------------------------------------------------------------------
   Issuing documents
   ------------------------------------------------------------------ */

const CITATION = /(\{workTitle\}|\{evidenceFinding\}|\{contributionRole\}|Section 4|Clause 9\.4)/;

function citationTarget(text) {
  return text.toLowerCase().replace(' ', '-').replace('.', '-');
}

// Splits the template, not the filled text, so a citation in a visitor's title is never linked.
function freezeParagraph(paragraph, values) {
  const runs = [];
  (Array.isArray(paragraph) ? paragraph : [paragraph]).forEach((item) => {
    const text = typeof item === 'string' ? item : item.text;
    const qualified = typeof item === 'string' ? false : !!item.qualified;
    text.split(CITATION).filter(Boolean).forEach((part) => {
      const name = part.startsWith('{') ? part.slice(1, -1) : null;
      if (name) runs.push({ text: values[name], qualified });
      else if (part === 'Section 4' || part === 'Clause 9.4') runs.push({ text: part, qualified, cite: citationTarget(part) });
      else runs.push({ text: part, qualified });
    });
  });
  return runs;
}

// The final text and its three timestamps are stored here and never produced again.
function issue(state, key, context, moments, values = {}) {
  const template = DOCUMENTS[key];
  const filled = { workTitle: state.claim.title, ...values };
  state.documents.push({
    key,
    reference: context.newReference(),
    caseReference: state.case.reference,
    concerning: state.claim.title,
    authority: { text: template.authority, cite: citationTarget(template.authority) },
    status: template.status || null,
    note: template.note || null,
    title: template.title,
    body: template.body.map((paragraph) => freezeParagraph(paragraph, filled)),
    signOff: template.signOff,
    officer: template.officer,
    received: moments.received,
    started: moments.started,
    issued: context.now,
  });
}

/* ------------------------------------------------------------------
   What each event requires
   ------------------------------------------------------------------ */

const GUARDS = {
  SUBMIT_CLAIM: (state, payload) => !!payload.title && (state.standing === 'recognised' || !!payload.description),
  SUBMIT_EVIDENCE: (state, payload) => payload.choice === 'none'
    || ((payload.choice === 'permit' || payload.choice === 'independent') && !!payload.text),
  REGISTER_BEGUN_WORK: (state, payload) => payload.declared === true,
  VIEW_AMENDED_ENTRY: (state) => !state.pending,
  COMPLETE_CLASSIFICATION: (state) => !!state.pending && state.pending.operation === 'classification',
  COMPLETE_ATTRIBUTION: (state) => !!state.pending && state.pending.operation === 'attribution',
};

/* ------------------------------------------------------------------
   What each event records. Records are append-only: the visitor's submissions
   are written once here, and the Office's account is kept in separate fields.
   ------------------------------------------------------------------ */

const EFFECTS = {
  DECLARE_RECOGNISED(state) {
    state.standing = 'recognised';
  },

  SUBMIT_CALIBRATION(state, payload, context) {
    state.standing = 'applicant';
    state.calibration = { selections: [...payload.selections], submittedAt: context.now };
  },

  SUBMIT_CLAIM(state, payload, context) {
    state.case = { reference: context.newReference(), openedAt: context.now };
    state.claim = { title: payload.title, description: payload.description, submittedAt: context.now };
    if (state.standing === 'recognised') {
      state.classification = OFFICIAL.continuation;
      issue(state, 'continuation', context, { received: context.now, started: context.now });
    }
  },

  SUBMIT_EVIDENCE(state, payload, context) {
    const finding = EVIDENCE.findings[payload.choice];
    state.evidence = {
      choice: payload.choice,
      text: payload.choice === 'none' ? '' : payload.text,
      finding,
      submittedAt: context.now,
    };
    issue(state, 'determination', context, { received: context.now, started: context.now }, { evidenceFinding: finding });
  },

  REGISTER_BEGUN_WORK(state, payload, context) {
    state.registration = { declaration: REGISTRATION.declaration, submittedAt: context.now };
    issue(state, 'receipt', context, { received: context.now, started: context.now });
    state.pending = { operation: 'classification', cause: 'registered', received: context.now, started: context.now };
  },

  COMPLETE_CLASSIFICATION(state, payload, context) {
    state.classification = OFFICIAL.personalActivity;
    issue(state, 'classification', context, state.pending);
    state.pending = null;
  },

  ISSUE_PROPOSED_ATTRIBUTION(state, payload, context) {
    state.practice = OFFICIAL.practice;
    state.contribution.push({ role: ROLES.assistance, at: context.now });
    issue(state, 'proposedAttribution', context, { received: context.now, started: context.now });
  },

  ASSERT_AUTHORSHIP(state, payload, context) {
    state.statement = { text: AUTHORSHIP_STATEMENT, at: context.now };
    state.contribution.push({ role: ROLES.independent, at: context.now });
    issue(state, 'amendment', context, { received: context.now, started: context.now });
  },

  VIEW_AMENDED_ENTRY(state, payload, context) {
    const amendment = state.documents[state.documents.length - 1];
    state.pending = { operation: 'attribution', cause: 'amended', received: amendment.issued, started: context.now };
  },

  ACKNOWLEDGE_NOTICE(state, payload, context) {
    state.acknowledgement = { at: context.now };
    state.pending = { operation: 'attribution', cause: 'acknowledged', received: context.now, started: context.now };
  },

  COMPLETE_ATTRIBUTION(state, payload, context) {
    issue(state, 'attribution', context, state.pending, { contributionRole: currentRole(state) });
    state.pending = null;
  },
};

// Opening and closing the registration form are not events in the case.
const NOT_RECORDED = ['OPEN_REGISTRATION', 'CLOSE_REGISTRATION'];

// Returns the new state, or null if the event is not permitted. The given state is not changed.
// context supplies the time and new references, so nothing here depends on the clock.
export function transition(state, event, payload = {}, context = {}) {
  const stage = nextStage(state, event);
  if (!stage) return null;
  if (GUARDS[event] && !GUARDS[event](state, payload)) return null;

  const next = structuredClone(state);
  if (EFFECTS[event]) EFFECTS[event](next, payload, context);
  next.stage = stage;
  if (!NOT_RECORDED.includes(event)) next.events.push({ type: event, at: context.now });
  return next;
}
