from gensim.models import Word2Vec
import os

def train_word2vec():
    # Sample sentences (you should replace this with your actual training data)
    sentences = [
        ["hello", "world", "computer", "programming", "artificial", "intelligence"],
        ["machine", "learning", "deep", "neural", "network", "artificial", "intelligence"],
        ["python", "programming", "code", "development", "software"],
        ["data", "science", "machine", "learning", "statistics"],
        ["web", "development", "server", "client", "network"],
        ["computer", "vision", "image", "processing", "deep", "learning"],
        ["natural", "language", "processing", "text", "speech"],
        ["database", "server", "data", "storage", "query"],
        ["algorithm", "computation", "mathematics", "logic"],
        ["security", "encryption", "network", "protection"]
    ]

    # Initialize and train the model
    print("Training Word2Vec model...")
    model = Word2Vec(
        sentences=sentences,
        vector_size=100,  # Dimension of word vectors
        window=5,         # Maximum distance between current and predicted word
        min_count=1,      # Ignore words that appear less than this
        workers=4         # Number of processor cores to use
    )

    # Create models directory if it doesn't exist
    models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    os.makedirs(models_dir, exist_ok=True)

    # Save the full model
    model_path = os.path.join(models_dir, 'word2vec.model')
    model.save(model_path)
    print(f"Full model saved to {model_path}")

    # Save just the KeyedVectors for faster loading
    vectors_path = os.path.join(models_dir, 'word2vec.wordvectors')
    model.wv.save(vectors_path)
    print(f"Word vectors saved to {vectors_path}")

    # Test the model
    print("\nTesting the model:")
    print("Most similar to 'computer':", model.wv.most_similar('computer', topn=3))
    print("Most similar to 'learning':", model.wv.most_similar('learning', topn=3))

if __name__ == "__main__":
    train_word2vec() 