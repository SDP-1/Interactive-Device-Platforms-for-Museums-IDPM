"""
Vector Database for Video Matching using ChromaDB
Semantically matches questions to relevant videos about Sri Lankan history
"""

import chromadb
from chromadb.utils import embedding_functions
import os
import json

class VideoVectorDB:
    def __init__(self, persist_directory=None):
        """Initialize ChromaDB with sentence transformer embeddings"""
        
        if persist_directory is None:
            # Default to data/video_db in the project root
            persist_directory = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                'data', 'video_db'
            )
        
        # Ensure directory exists
        os.makedirs(persist_directory, exist_ok=True)
        
        # Use sentence-transformers for embeddings (same model used elsewhere in project)
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"  # Fast and accurate, good for semantic search
        )
        
        # Initialize ChromaDB with persistence
        self.client = chromadb.PersistentClient(path=persist_directory)
        
        # Create or get the videos collection
        self.collection = self.client.get_or_create_collection(
            name="historical_videos",
            embedding_function=self.embedding_fn,
            metadata={"description": "Sri Lankan historical event videos"}
        )
        
        print(f"✓ Video DB initialized with {self.collection.count()} videos")
    
    def add_video(self, video_id: str, video_path: str, 
                  description: str, topics: list, 
                  poster_path: str = None, era: str = None):
        """
        Add a video with its semantic description
        
        Args:
            video_id: Unique identifier for the video
            video_path: Path to video file (relative to public folder)
            description: Rich description for semantic matching
            topics: List of related topics/keywords
            poster_path: Optional path to poster/thumbnail image
            era: Optional historical era (e.g., "5th century AD")
        """
        
        # Check if already exists
        existing = self.collection.get(ids=[video_id])
        if existing['ids']:
            print(f"Video {video_id} already exists, updating...")
            self.collection.delete(ids=[video_id])
        
        # Combine topics and description for rich embedding
        full_text = f"{description} Topics: {', '.join(topics)}"
        if era:
            full_text += f" Era: {era}"
        
        self.collection.add(
            ids=[video_id],
            documents=[full_text],
            metadatas=[{
                "video_path": video_path,
                "poster_path": poster_path or "",
                "topics": json.dumps(topics),
                "description": description,
                "era": era or ""
            }]
        )
        print(f"✓ Added video: {video_id}")
    
    def find_video(self, question: str, answer: str = "", threshold: float = 0.75):
        """
        Find the best matching video for a question/answer
        
        Args:
            question: The user's question
            answer: The generated answer (optional, improves matching)
            threshold: Minimum similarity score (0-1, default 0.35)
            
        Returns:
            Video info dict or None if no good match
        """
        
        if self.collection.count() == 0:
            return None
        
        # Combine question and answer for better matching
        search_text = f"{question} {answer}"
        
        results = self.collection.query(
            query_texts=[search_text],
            n_results=1,
            include=["metadatas", "distances"]
        )
        
        if results and results['ids'] and results['ids'][0]:
            # ChromaDB returns L2 distance - lower is better
            # Convert to similarity score (0-1, higher is better)
            distance = results['distances'][0][0]
            similarity = 1 / (1 + distance)  # Normalize to 0-1 range
            
            print(f"  Video match: {results['ids'][0][0]} (similarity: {similarity:.3f})")
            
            if similarity >= threshold:
                metadata = results['metadatas'][0][0]
                return {
                    "video_id": results['ids'][0][0],
                    "video_path": metadata['video_path'],
                    "poster_path": metadata.get('poster_path') or None,
                    "description": metadata['description'],
                    "topics": json.loads(metadata['topics']),
                    "era": metadata.get('era') or None,
                    "similarity": round(similarity, 3)
                }
            else:
                print(f"  Similarity {similarity:.3f} below threshold {threshold}")
        
        return None
    
    def find_videos(self, question: str, answer: str = "", n_results: int = 3):
        """
        Find multiple matching videos for a question/answer
        
        Returns:
            List of video info dicts sorted by similarity
        """
        
        if self.collection.count() == 0:
            return []
        
        search_text = f"{question} {answer}"
        n = min(n_results, self.collection.count())
        
        results = self.collection.query(
            query_texts=[search_text],
            n_results=n,
            include=["metadatas", "distances"]
        )
        
        videos = []
        if results and results['ids'] and results['ids'][0]:
            for i, vid_id in enumerate(results['ids'][0]):
                distance = results['distances'][0][i]
                similarity = 1 / (1 + distance)
                metadata = results['metadatas'][0][i]
                
                videos.append({
                    "video_id": vid_id,
                    "video_path": metadata['video_path'],
                    "poster_path": metadata.get('poster_path') or None,
                    "description": metadata['description'],
                    "topics": json.loads(metadata['topics']),
                    "era": metadata.get('era') or None,
                    "similarity": round(similarity, 3)
                })
        
        return videos
    
    def list_all_videos(self):
        """List all videos in the database"""
        results = self.collection.get(include=["metadatas"])
        videos = []
        for i, vid_id in enumerate(results['ids']):
            metadata = results['metadatas'][i]
            videos.append({
                "id": vid_id,
                "video_path": metadata['video_path'],
                "poster_path": metadata.get('poster_path') or None,
                "description": metadata['description'],
                "topics": json.loads(metadata['topics']),
                "era": metadata.get('era') or None
            })
        return videos
    
    def delete_video(self, video_id: str):
        """Remove a video from the database"""
        self.collection.delete(ids=[video_id])
        print(f"✓ Deleted video: {video_id}")
    
    def clear_all(self):
        """Clear all videos from the database"""
        # Get all IDs and delete them
        all_ids = self.collection.get()['ids']
        if all_ids:
            self.collection.delete(ids=all_ids)
        print("✓ Cleared all videos from database")
    
    def seed_sample_videos(self):
        """
        Seed the database with sample video entries for Sri Lankan history.
        Call this to populate initial data. Videos should be placed in frontend/public/videos/
        """
        
        sample_videos = [
            {
                "id": "sigiriya",
                "path": "/videos/sigiriya.mp4",
                "poster": "/videos/posters/sigiriya.jpg",
                "era": "5th century AD",
                "description": "Sigiriya Lion Rock fortress built by King Kashyapa I. Features include the famous mirror wall with ancient graffiti, beautiful frescoes of celestial maidens, elaborate water gardens with fountains, and the massive lion's paw entrance. One of the best preserved examples of ancient urban planning and a UNESCO World Heritage Site.",
                "topics": ["Sigiriya", "Kashyapa", "Kassapa", "Lion Rock", "fortress", "frescoes", "mirror wall", "water gardens", "rock fortress", "Dhatusena", "ancient engineering"]
            },
            {
                "id": "anuradhapura",
                "path": "/videos/anuradhapura.mp4",
                "poster": "/videos/posters/anuradhapura.jpg",
                "era": "377 BC - 1017 AD",
                "description": "Ancient sacred city of Anuradhapura, the first and longest-lasting capital of Sri Lanka. Home to the sacred Sri Maha Bodhi tree, massive stupas like Ruwanwelisaya and Jetavanaramaya, Abhayagiriya monastery, and Isurumuniya with famous lover sculptures. Center of Theravada Buddhism for over a millennium.",
                "topics": ["Anuradhapura", "Ruwanwelisaya", "Bodhi Tree", "Sri Maha Bodhi", "stupa", "ancient capital", "Buddhism", "Jetavanaramaya", "Abhayagiriya", "Isurumuniya", "Pandukabhaya", "Devanampiyatissa"]
            },
            {
                "id": "dutugemunu",
                "path": "/videos/dutugemunu.mp4",
                "poster": "/videos/posters/dutugemunu.jpg",
                "era": "2nd century BC",
                "description": "King Dutugemunu, the legendary warrior king who unified Sri Lanka. Born in the Ruhuna kingdom, he led a heroic campaign with ten giant warriors to defeat King Elara and unite the island. He built the magnificent Ruwanwelisaya stupa and is remembered as one of the greatest Sinhalese kings.",
                "topics": ["Dutugemunu", "Dutugamunu", "Elara", "warrior king", "Ruhuna", "unification", "battle", "ten giants", "Ruwanwelisaya", "Viharamahadevi", "Kavantissa", "national hero"]
            },
            {
                "id": "polonnaruwa",
                "path": "/videos/polonnaruwa.mp4",
                "poster": "/videos/posters/polonnaruwa.jpg",
                "era": "1070 AD - 1310 AD",
                "description": "Medieval capital city of Polonnaruwa, featuring the magnificent Gal Viharaya with its stunning rock-carved Buddha statues, the massive Parakrama Samudraya reservoir built by King Parakramabahu I, the Vatadage circular relic house, and impressive irrigation systems that demonstrate advanced ancient engineering.",
                "topics": ["Polonnaruwa", "Parakramabahu", "Gal Viharaya", "reservoir", "medieval", "Buddha statues", "Parakrama Samudraya", "Vatadage", "Vijayabahu", "Nissanka Malla", "stone sculptures"]
            },
            {
                "id": "kandy",
                "path": "/videos/kandy.mp4",
                "poster": "/videos/posters/kandy.jpg",
                "era": "15th century - 1815 AD",
                "description": "Kandy, the last independent Sinhalese kingdom that resisted European colonizers for over 300 years. Home to the sacred Temple of the Tooth Relic (Dalada Maligawa), featuring traditional Kandyan architecture, the famous Esala Perahera festival, and the beautiful Kandy Lake.",
                "topics": ["Kandy", "Kandyan", "Tooth Relic", "Dalada", "Dalada Maligawa", "kingdom", "temple", "colonial resistance", "Perahera", "Sri Wickrama Rajasinghe", "British", "Portuguese", "Dutch"]
            },
            {
                "id": "dambulla",
                "path": "/videos/dambulla.mp4",
                "poster": "/videos/posters/dambulla.jpg",
                "era": "1st century BC onwards",
                "description": "Dambulla Cave Temple, also known as the Golden Temple of Dambulla. Features five caves with over 150 Buddha statues and elaborate ceiling paintings. King Valagamba sought refuge here during South Indian invasion and later converted the caves into a magnificent temple complex.",
                "topics": ["Dambulla", "cave temple", "Golden Temple", "Buddha statues", "cave paintings", "Valagamba", "rock temple", "Buddhist art", "murals", "UNESCO"]
            },
            {
                "id": "mihintale",
                "path": "/videos/mihintale.mp4",
                "poster": "/videos/posters/mihintale.jpg",
                "era": "247 BC",
                "description": "Mihintale, the cradle of Buddhism in Sri Lanka. This is where Arahat Mahinda, son of Emperor Ashoka, met King Devanampiyatissa and introduced Buddhism to the island. Features ancient stupas, the Aradhana Gala meditation rock, hospital ruins, and the famous 1,840 granite steps.",
                "topics": ["Mihintale", "Mahinda", "Buddhism", "Devanampiyatissa", "Arahat", "Ashoka", "introduction of Buddhism", "pilgrimage", "Poson", "ancient hospital"]
            },
            {
                "id": "temple_of_tooth",
                "path": "/videos/temple_of_tooth.mp4",
                "poster": "/videos/posters/temple_of_tooth.jpg",
                "era": "16th century onwards",
                "description": "Sri Dalada Maligawa, the Temple of the Sacred Tooth Relic in Kandy. Houses the sacred tooth relic of Lord Buddha, brought to Sri Lanka in the 4th century. The temple is the focal point of the annual Esala Perahera and represents the spiritual heart of Buddhist Sri Lanka.",
                "topics": ["Temple of Tooth", "Dalada Maligawa", "tooth relic", "Kandy", "sacred relic", "Buddha", "Esala Perahera", "Buddhist temple", "royal palace"]
            },
            {
                "id": "galle_fort",
                "path": "/videos/galle_fort.mp4",
                "poster": "/videos/posters/galle_fort.jpg",
                "era": "16th - 18th century",
                "description": "Galle Fort, a UNESCO World Heritage Site built by the Portuguese and extensively fortified by the Dutch. Features colonial architecture, ancient ramparts, the iconic lighthouse, Dutch Reformed Church, and a blend of European and South Asian architectural traditions.",
                "topics": ["Galle", "Galle Fort", "Dutch", "Portuguese", "colonial", "fortress", "lighthouse", "UNESCO", "ramparts", "trading port"]
            },
            {
                "id": "adam_peak",
                "path": "/videos/adam_peak.mp4",
                "poster": "/videos/posters/adam_peak.jpg",
                "era": "Ancient to present",
                "description": "Sri Pada or Adam's Peak, a sacred mountain revered by Buddhists, Hindus, Muslims, and Christians alike. Features the sacred footprint at the summit, breathtaking sunrise views, ancient pilgrim routes, and the famous shadow of the peak at dawn.",
                "topics": ["Adam's Peak", "Sri Pada", "sacred footprint", "pilgrimage", "mountain", "sunrise", "Buddhist", "Hindu", "sacred mountain", "Samanala"]
            }
        ]
        
        print("\n📹 Seeding video database...")
        added_count = 0
        
        for video in sample_videos:
            # Check if already exists
            existing = self.collection.get(ids=[video["id"]])
            if not existing['ids']:
                self.add_video(
                    video_id=video["id"],
                    video_path=video["path"],
                    description=video["description"],
                    topics=video["topics"],
                    poster_path=video.get("poster"),
                    era=video.get("era")
                )
                added_count += 1
        
        print(f"✓ Seeded {added_count} new videos (total: {self.collection.count()})\n")


# Singleton instance
_video_db = None

def get_video_db():
    """Get or create the video database instance"""
    global _video_db
    if _video_db is None:
        _video_db = VideoVectorDB()
        # Seed sample videos on first run
        if _video_db.collection.count() == 0:
            _video_db.seed_sample_videos()
    return _video_db

