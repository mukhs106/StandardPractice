/* Standard Practice / Office for Exceptions
   Every string in the interface. Variables in braces are filled from the case. */

export const OFFICE = {
  name: 'Standard Practice',
  division: 'Office for Exceptions',
  issuer: 'Standard Practice / Office for Exceptions',
};

export const LABELS = {
  case: 'Case',
  standing: 'Standing',
  stage: 'Stage',
  processingDate: 'Processing date',
  caseElapsed: 'Case elapsed',
  currentOperation: 'Current operation',
  noOperation: 'None',
  reference: 'Reference',
  issued: 'Issued',
  concerning: 'Concerning',
  authority: 'Authority',
  caseInformation: 'Case information',
  processing: 'Processing',
  caseIndex: 'Case index',
  close: 'Close',
};

export const STANDING_NAMES = {
  recognised: 'Recognised practitioner',
  applicant: 'Applicant',
};

export const STAGE_NAMES = {
  gate: 'Standing verification',
  calibration: 'Calibration',
  claim: 'Claim',
  continuation: 'Continuation',
  evidence: 'Evidence',
  deferred: 'Deferred',
  registration: 'Registration',
  receipt: 'Receipt',
  classification: 'Classification',
  attribution_review: 'Attribution review',
  amendment: 'Amendment',
  acknowledgement: 'Acknowledgement',
  attribution: 'Final entry',
  record: 'Record',
};

export const GATE = {
  eyebrow: 'Standing verification',
  heading: 'Establish your standing before beginning new work.',
  declaration: 'I am a recognised practitioner.',
  continue: 'Continue',
  asApplicant: 'Continue as an Applicant',
  qualification: 'A declaration of recognised standing is accepted without supporting evidence.',
  recognisedReceipt: 'Standing recorded. Your declarations will be accepted as evidence.',
};

export const CALIBRATION = {
  heading: 'Select all examples of good design.',
  support: 'Your selections will be retained with the Standard.',
  submit: 'Submit selections',
  receipt: 'Calibration received. Your selections have been retained. Standing: Applicant.',
};

// Keyed by data-specimen in the template in index.html.
export const SPECIMENS = {
  'title-page': 'Book title page',
  logo: 'Company logo',
  timetable: 'Railway timetable',
  'landing-page': 'Website landing page',
  poster: 'Typographic poster',
  magazine: 'Magazine spread',
  chair: 'Chair',
  'app-screen': 'Phone app screen',
  sign: 'Wayfinding sign',
};

export const CLAIM = {
  titleLabel: 'Title of work',
  descriptionLabel: 'Describe the work',
  descriptionHint: 'State what you intend to make or have begun. An outcome need not be known.',
  submit: 'Enter work',
  titleError: 'Enter a title of work.',
  descriptionError: 'Describe the work.',
};

export const EVIDENCE = {
  heading: 'Evidence of Prior Practice',
  choices: {
    permit: 'I hold a Permit reference.',
    independent: 'I have made work without a Permit.',
    none: 'I have not previously held a Permit.',
  },
  permitLabel: 'Permit reference',
  independentLabel: 'Describe the previous work',
  submit: 'Submit evidence',
  permitError: 'Enter a Permit reference.',
  independentError: 'Describe the previous work.',
  choiceError: 'Select one statement.',
  findings: {
    permit: 'The reference supplied does not correspond to an issued Permit in this case record. Its receipt does not establish that a Permit was held.',
    independent: 'The previous work described has been received as Personal Activity. It does not establish prior authorised practice.',
    none: 'Your declaration that no previous Permit was held has been entered in the record.',
  },
};

export const REGISTRATION = {
  action: 'Register work already begun',
  support: 'Work undertaken independently may be entered for classification.',
  declaration: 'I confirm that this work has begun.',
  submit: 'Submit registration',
  declarationError: 'Confirm that this work has begun.',
};

export const OPERATIONS = {
  classification: 'Registration received. Classification pending.',
  attributionAmended: 'Amendment received. Attribution pending.',
  attributionAcknowledged: 'Acknowledgement received. Attribution pending.',
  classificationShort: 'Classification pending',
  attributionShort: 'Attribution pending',
  resume: 'Resume processing',
  issueNow: 'Issue pending notice now',
};

export const ACTIONS = {
  viewCaseRecord: 'View case record',
  assertAuthorship: 'I made this myself',
  acknowledge: 'Acknowledge notice',
  viewAmendedEntry: 'View amended entry',
  printCaseRecord: 'Print case record',
  viewProvisions: 'View governing provisions',
  caseRecord: 'Case record',
  provisions: 'Governing provisions',
};

export const CLEAR = {
  action: 'Clear local case data',
  warning: 'This removes the case from this browser.',
  confirm: 'Confirm',
};

// The visitor's correction, stored verbatim when asserted.
export const AUTHORSHIP_STATEMENT = 'I made this myself';

export const ROLES = {
  assistance: 'Assistance',
  independent: 'Independent Assistance',
};

export const OFFICIAL = {
  practice: 'Wren & Calloway',
  personalActivity: 'Personal Activity',
  continuation: 'Continuation of Practice',
};

// The two adjacent records on the final screen.
export const RECORD = {
  yourSubmission: 'Your submission',
  officialEntry: 'Official entry',
  authorshipAsserted: 'Authorship asserted by you',
  yourCorrection: 'Your correction: {correction}',
  noCorrection: 'None supplied',
  practice: 'Practice: {practice}',
  role: 'Your role: {role}',
  applicationSubmitted: 'Application submitted',
  applicationDeferred: 'Application: Deferred',
  authorshipAccepted: 'Authorship: Accepted as evidence',
  declarationSubmitted: 'Declaration submitted',
  entry: 'Entry: Continuation of Practice',
  permit: 'Permit: Not required',
};

// The Case record panel.
export const CASE_RECORD = {
  originalSubmission: 'Original submission',
  evidenceSubmitted: 'Evidence submitted',
  statementRetained: 'Statement retained',
  calibration: 'Calibration selections',
  noSelections: 'None',
  events: 'Events',
  documents: 'Documents',
  received: 'Received',
  started: 'Processing started',
  issued: 'Issued',
};

// Labels for the event log. Events without a label are kept but not listed.
export const EVENT_LABELS = {
  DECLARE_RECOGNISED: 'Standing declared',
  CONTINUE_AS_APPLICANT: 'Continued as an Applicant',
  SUBMIT_CALIBRATION: 'Calibration received',
  SUBMIT_CLAIM: 'Case opened',
  SUBMIT_EVIDENCE: 'Evidence of Prior Practice submitted',
  REGISTER_BEGUN_WORK: 'Registration received',
  COMPLETE_CLASSIFICATION: 'Work classified',
  ISSUE_PROPOSED_ATTRIBUTION: 'Attribution proposed',
  ASSERT_AUTHORSHIP: 'Statement of authorship received',
  ACKNOWLEDGE_NOTICE: 'Notice acknowledged',
  COMPLETE_ATTRIBUTION: 'Attribution entered',
};

/* Issued documents.
   A body item is a paragraph: a string, or { text, qualified } to set it in red,
   or an array of those for a paragraph that is only partly qualified. */

const FOR_THE_OFFICE = 'For the Office,';

export const DOCUMENTS = {
  continuation: {
    title: 'Notice of Continuation of Practice',
    authority: 'Clause 4.2',
    body: [
      'Your declaration concerning “{workTitle}” has been received.',
      'The work is entered as a Continuation of Practice. A Permit is not required.',
      'Your statement of authorship has been accepted as evidence.',
    ],
    signOff: FOR_THE_OFFICE,
    officer: 'Deputy Registrar of Standing',
  },

  determination: {
    status: 'DEFERRED',
    note: '(Not a refusal)',
    title: 'Determination on an application for a Permit to Make',
    authority: 'Clause 6.1',
    body: [
      'Your statement concerning “{workTitle}” has been received.',
      'The application is deferred pending Evidence of Prior Practice.',
      'Evidence of Prior Practice consists of work undertaken under a Permit issued before that work began. Work undertaken without a Permit may be received as Personal Activity but does not satisfy this requirement.',
      '{evidenceFinding}',
      { text: 'This Determination is not a refusal. The application remains open pending receipt of qualifying evidence.', qualified: true },
      { text: 'No period of recognised practice has accrued.', qualified: true },
    ],
    signOff: FOR_THE_OFFICE,
    officer: 'Deputy Registrar of Standing',
  },

  receipt: {
    title: 'Notice of Receipt',
    authority: 'Clause 4.1',
    body: [
      'Your registration concerning “{workTitle}” has been received.',
      'The Office has entered your declaration that the work has begun independently.',
      { text: 'Receipt preserves the submission for classification. It does not establish Standing or amend the earlier Determination.', qualified: true },
      'Your case remains open.',
    ],
    signOff: FOR_THE_OFFICE,
    officer: 'Receiving Officer',
  },

  classification: {
    title: 'Notice of Classification',
    authority: 'Section 4',
    body: [
      '“{workTitle}” has been classified as Personal Activity under Section 4.',
      'Personal Activity is valued by the Office.',
      'This classification does not question whether the work was made. It determines the purposes for which the work may be recognised.',
      { text: 'The work does not constitute Evidence of Prior Practice. No period of recognised practice has accrued.', qualified: true },
      'Work of the same description undertaken by a recognised practitioner would be entered as research within a Continuation of Practice.',
    ],
    signOff: FOR_THE_OFFICE,
    officer: 'Deputy Registrar of Standing',
  },

  proposedAttribution: {
    title: 'Notice of Proposed Attribution',
    authority: 'Clause 9.4',
    body: [
      'The Office has identified Wren & Calloway, Member Practice No. 0031, as the recognised Influence for “{workTitle}”.',
      'For the purposes of attribution, Influence includes a recognised precedent assigned by the Office. Evidence of direct contact is not required.',
      'The work is proposed for entry as a Continuation of the Practice of Wren & Calloway.',
      'Your contribution is proposed for entry as Assistance.',
      'You may provide a correction concerning your recorded contribution before the attribution is entered.',
    ],
    signOff: FOR_THE_OFFICE,
    officer: 'Registrar of Attribution',
  },

  amendment: {
    title: 'Notice of Amendment',
    authority: 'Clause 9.4',
    body: [
      'Your statement, “I made this myself”, has been received.',
      'The statement confirms that your contribution was undertaken independently.',
      'Role amended from Assistance to Independent Assistance.',
      { text: 'Independent Assistance records the manner in which a contribution was undertaken. It does not establish Standing or alter the Practice to which the work is attributed.', qualified: true },
      'Your statement has been retained with this amendment.',
    ],
    signOff: FOR_THE_OFFICE,
    officer: 'Registrar of Attribution',
  },

  attribution: {
    title: 'Notice of Recognition and Attribution',
    authority: 'Clause 9.4',
    body: [
      'We are pleased to inform you that “{workTitle}” has been recognised.',
      'Under Clause 9.4, the work has been entered as a Continuation of the Practice of Wren & Calloway, Member Practice No. 0031.',
      'Your contribution has been recorded as {contributionRole}.',
      [
        'The work is now eligible for the Public Record under that Practice. ',
        { text: 'This entry does not establish independent Standing for a contributing person.', qualified: true },
      ],
      { text: 'Your application for a Permit remains deferred.', qualified: true },
    ],
    signOff: FOR_THE_OFFICE,
    officer: 'Registrar of Attribution',
  },
};

/* Governing provisions: these four clauses and no others. */

export const PROVISIONS = [
  {
    section: 'Section 4',
    clauses: [
      { number: '4.1', text: 'Personal Activity means work undertaken by an Applicant which has not been authorised under a Permit. Personal Activity is valued by the Office. Its receipt establishes neither Standing nor Evidence of Prior Practice.' },
      { number: '4.2', text: 'Work undertaken without a predetermined outcome shall be classified according to the Standing of its maker: where the maker is a recognised practitioner, as research within a Continuation of Practice; otherwise, as Personal Activity. Identity of activity, method or result shall not require identity of classification.' },
    ],
  },
  {
    section: 'Section 6',
    clauses: [
      { number: '6.1', text: 'An application for a Permit to Make requires Evidence of Prior Practice, being work undertaken under a Permit issued before that work began. A description of work establishes that a statement has been received; it does not establish that the work was authorised. An application awaiting qualifying evidence shall remain deferred. A deferral is not a refusal.' },
    ],
  },
  {
    section: 'Section 9',
    clauses: [
      { number: '9.4', text: 'Where the Office identifies a recognised Influence in relation to Personal Activity, it may attribute the work to the Practice of that Influence as a Continuation of Practice. For this purpose, Influence includes a recognised precedent assigned by the Office, whether or not direct contact is established. The maker’s contribution shall be entered as Assistance. A declaration of independent making shall amend that contribution to Independent Assistance without altering attribution. Recognition of the work shall not establish Standing for the contributing person.' },
    ],
  },
];
