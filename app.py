import collections
from flask import Flask, jsonify, render_template, request
import re
from nltk.corpus import stopwords
from nltk.tokenize import RegexpTokenizer
from nltk.stem import WordNetLemmatizer
from langdetect import detect, LangDetectException
from gensim import corpora
from gensim.models.ldamodel import LdaModel
from flask_cors import CORS
import nltk
import emoji
import random
from pymongo import MongoClient

### Uncomment the following lines if you are running the app for the first time
nltk.download('stopwords')
nltk.download('wordnet')

### Initializing the Flask app
app = Flask(__name__)

client = MongoClient("mongodb+srv://safi:safi123@cluster0.1fxixvl.mongodb.net/?retryWrites=true&w=majority")  # Replace 'mongodb_connection_string' with your MongoDB connection string
db = client['Psl_data']  # Replace 'your_database_name' with the name of your database
collections = db['tweets']

CORS(app)

### Initializing the preprocessing tools
tokenizer = RegexpTokenizer(r'\w+')
en_stopwords = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()


def processTweet(tweet):
    try:
        # Check if the tweet is in English
        if detect(tweet) != 'en':
            return []  
    except LangDetectException:
        return [] 
    # Lowercase, remove URLs, user mentions, and numbers (punctuations are handled in tokenization)
    tweet = re.sub(r"http\S+|www\S+|https\S+|@\w+|\d+", '', tweet.lower())
    tokens = tokenizer.tokenize(tweet)
    cleaned_tokens = [lemmatizer.lemmatize(token) for token in tokens if token not in en_stopwords]

    return cleaned_tokens


def lda(num_tweets=50, num_topics=1, tweets=None):
    # If no specific tweets are provided, use the global tweets
    if tweets is None:
        global_tweets = globals().get('tweets', []) 
        extracted_tweets = global_tweets[:num_tweets]
    else:
        extracted_tweets = tweets[:num_tweets]

    # Preprocessing
    processed_tweets = [processTweet(tweet) for tweet in extracted_tweets]
    dictionary = corpora.Dictionary(processed_tweets)
    doc_term_matrix = [dictionary.doc2bow(tweet) for tweet in processed_tweets]

    # Creating the LDA model
    lda_model = LdaModel(doc_term_matrix, num_topics=num_topics, id2word=dictionary, passes=2)
    lda_data = []
    for word, weight in lda_model.show_topic(0, 50):
        lda_data.append({"text": word, "value": (round(float(weight), 4) * 3000) + 100})

    return lda_data


def extract_emojis(text):
    return [char for char in text if emoji.is_emoji(char)]

def lda_emojis(num_tweets=50, num_topics=1, tweets=None):
    # Extract emojis from all tweets
    all_emojis = [extract_emojis(tweet) for tweet in tweets]
    # Flatten the list of lists into a single list of emojis
    all_emojis = [emoji for sublist in all_emojis for emoji in sublist]
    dictionary = corpora.Dictionary([all_emojis])
    corpus = [dictionary.doc2bow([emoji]) for emoji in all_emojis]
    # LDA model
    lda_model = LdaModel(corpus, num_topics=num_topics, id2word=dictionary, passes=5)
    lda_data = []
    for emoji, weight in lda_model.show_topic(topicid=0, topn=50):
        lda_data.append({"emoji": emoji, "value": (round(float(weight), 4) * 3000) + 100})
    return lda_data


@app.route('/')
def home():
    return render_template('index.html', wordcloud_path=None)  

@app.route('/lda', methods=['POST'])
def generate_lda():
    data = request.get_json()  # Get data sent to the endpoint
    tweets = data.get('tweets', [])  # Extract tweets from data
    if not tweets:
        return jsonify({"error": "No tweets provided"}), 400
    lda_results = lda(tweets=tweets)  
    return jsonify(lda_results)

@app.route('/lda/emojis', methods=['POST'])
def generate_lda_emojis():
    data = request.get_json()  
    tweets = data.get('tweets', []) 
    if not tweets:
        return jsonify({"error": "No tweets provided"}), 400
    lda_results = lda_emojis(tweets=tweets) 
    return jsonify(lda_results)

@app.route('/get_random_tweets', methods=['GET'])
def getRandomTweets():
    # Generate a random number for the number of tweets to fetch
    random_number = random.randint(10, 100)  # You can adjust the upper limit based on your requirement

    # Use aggregation with $sample to get random documents
    random_tweets = list(collections.aggregate([{'$sample': {'size': random_number}}]))

    # Convert the ObjectId to string to make it JSON serializable
    for tweet in random_tweets:
        tweet['_id'] = str(tweet['_id'])

    return jsonify(random_tweets)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
