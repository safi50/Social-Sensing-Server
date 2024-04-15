const SavedSearch = require('../models/SavedSearch');


// for a userId return all the corresponding saved searches
exports.getSearches = async (req, res) => {
  try {
    const { userId } = req.query; // Extract userId from request query

    // Find all SavedSearch documents for the user
    const searches = await SavedSearch.find({ userId: userId });

    return res.status(200).json({ searches });
  } catch (error) {
    console.error('Error getting searches:', error);
    return res.status(500).json({ message: 'An error occurred while getting the searches' });
  }
};


// save a search query for a userId
exports.saveSearch = async (req, res) => {
  try {
    const { userId, name, labels, hashtags, region } = req.body;

    // Create a new SavedSearch document
    const newSearch = new SavedSearch({
      name: name,
      userId: userId, 
      region: region,
      hashtags: hashtags,
      labels: labels,
    });

    await newSearch.save();

    return res.status(200).json({ message: 'Search saved successfully' });
  } catch (error) {
    console.error('Error saving search:', error);
    return res.status(500).json({ message: 'An error occurred while saving the search' });
  }
};


// delete one search with searchId of the user userId
exports.deleteSearch = async (req, res) => {
  try {
    const { userId, searchId } = req.body;

    // Delete the SavedSearch document
    await SavedSearch.findOneAndDelete({ _id: searchId, userId: userId });
    
        return res.status(200).json({ message: 'Search deleted successfully' });
    }
        catch (error) {
        console.error('Error deleting search:', error);
        return res.status(500).json({ message: 'An error occurred while deleting the search' });
    }
}


// update a savedSearch value of userId
exports.updateSearch = async (req, res) => {
  try {
    const { userId, searchId, name } = req.body;


    // Update the SavedSearch document
    await SavedSearch.findOneAndUpdate({ _id: searchId, userId: userId }, {
      name: name,
    });

    return res.status(200).json({ message: 'Search updated successfully' });
  } catch (error) {
    console.error('Error updating search:', error);
    return res.status(500).json({ message: 'An error occurred while updating the search' });
  }
};
