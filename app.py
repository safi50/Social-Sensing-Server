from flask import Flask, jsonify, render_template
# from pymongo import MongoClient, PyMongo
from flask_pymongo import PyMongo
import re
from nltk.corpus import stopwords
from nltk.tokenize import RegexpTokenizer
from nltk.stem import WordNetLemmatizer
from langdetect import detect, LangDetectException
from gensim import corpora
from gensim.models.ldamodel import LdaModel
from flask_cors import CORS
import time
import nltk
import json
from datetime import datetime, timedelta
import emoji

### Uncomment the following lines if you are running the app for the first time
nltk.download('stopwords')
nltk.download('wordnet')

### Initializing the Flask app
app = Flask(__name__)
app.config['MONGO_URI'] = "mongodb+srv://safi:safi123@cluster0.1fxixvl.mongodb.net/Psl_data?retryWrites=true&w=majority"
mongo = PyMongo(app)
### Browse tweets collections from Psldata database
# mongo.db.tweets.create_index([("created_at", 1)])
docs = mongo.db.tweets.find().limit(250)
tweets = [doc['tweet'] for i, doc in enumerate(docs) if i < 250]
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

def lda_emojis(tweets, num_topics=1):
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

@app.route('/lda', methods=['GET'])
def generate_lda():
    lda_results = lda()
    return lda_results

@app.route('/lda/emoji', methods=['GET'])
def generate_lda_emojis():
    lda_results = lda_emojis(tweets)
    return (lda_results)

@app.route('/lda/<int:num_tweets>', methods=['GET'])
def generate_lda_variable(num_tweets):
    if num_tweets not in [i for i in range(1, 251)]:  # Only support 1-250 tweets for now
        return jsonify({"error": "Unsupported number of tweets"}), 400
    lda_results = lda(num_tweets=num_tweets)
    return jsonify(lda_results)


@app.route('/lda/time/<time_duration>', methods=['GET'])
def generate_lda_by_time(time_duration):
    base_date = datetime.strptime("30-03-2022", "%d-%m-%Y")  # Reference date

    if time_duration == '1d':
        start_date = base_date - timedelta(days=1)
    elif time_duration == '1w':
        start_date = base_date - timedelta(weeks=1)
    elif time_duration == '1m':
        start_date = base_date - timedelta(days=30)  
    else:
        return jsonify({"error": "Unsupported time duration"}), 400
    # Converting start_date to the format used in MongoDB collection
    start_date_str = start_date.strftime("%Y-%m-%d")
    
    start = time.time()

    docs = mongo.db.tweets.find({
        "created_at": {
            "$gte": start_date_str + " 00:00:00 Pakistan Standard Time",
            "$lte": base_date.strftime("%Y-%m-%d") + " 23:59:59 Pakistan Standard Time"
        }
    }).limit(250)

    filtered_tweets = [doc['tweet'] for doc in docs]
    print(len(filtered_tweets))

    if len(filtered_tweets) == 0:
        return jsonify({"error": "No tweets found for the specified time duration"}), 404
    
    # Now calling lda with the filtered_tweets
    lda_results = lda(tweets=filtered_tweets, num_tweets=len(filtered_tweets)) 
    end = time.time()
    print(f"Time taken: {end - start} seconds")

    return jsonify(lda_results)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
