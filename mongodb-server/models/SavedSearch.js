const mongoose = require('mongoose');

const SavedSearchSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

  name: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  region: {
    type: String,
    default: 'none',
  },
  hashtags: [String],
  labels: [String],
});

const SavedSearch = mongoose.model('SavedSearch', SavedSearchSchema);

module.exports = SavedSearch;
