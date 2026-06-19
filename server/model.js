const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  stmt:  { type: String },
  key:   { type: String },
  label: { type: String },
}, { _id: false });

const SurveyResponseSchema = new mongoose.Schema({
  // About You
  dept:     { type: String, default: '' },
  role:     { type: String, default: '' },
  tenure:   { type: String, default: '' },
  location: { type: String, default: '' },

  // Section 1
  q1:       [String],          // current update channels (multi)
  q2:       { type: String },  // frequency of difficulty
  q3:       { type: String },  // hardest info to find (open text)
  q4:       { type: String },  // wasted time yes/no
  q4detail: { type: String },  // q4 follow-up

  // Section 2
  ratings:  [RatingSchema],    // agreement ratings
  q6:       { type: String },  // most important reason (open text)
  q7:       [String],          // business problems (multi, max 3)

  // Section 3
  ranking:  [String],          // ordered feature list
  q9:       { type: String },  // specific documents (open text)

  // Section 4
  q10:      [String],          // concerns (multi)
  q11:      { type: String },  // what would increase usage (open text)

  // Section 5
  q12:      { type: String },  // overall verdict
  q13:      { type: String },  // additional comments (open text)

  submitted_at: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SurveyResponse', SurveyResponseSchema);
