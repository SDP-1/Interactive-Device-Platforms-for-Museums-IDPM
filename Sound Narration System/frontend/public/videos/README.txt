========================================
VIDEO FILES FOR HISTORICAL NARRATION
========================================

Place your video files in this folder.
The vector database will match questions to videos based on semantic similarity.

EXPECTED FILES:
--------------
sigiriya.mp4        - Sigiriya Lion Rock fortress
anuradhapura.mp4    - Ancient city of Anuradhapura
dutugemunu.mp4      - King Dutugemunu
polonnaruwa.mp4     - Medieval capital Polonnaruwa
kandy.mp4           - Kandy Kingdom and Temple of Tooth
dambulla.mp4        - Dambulla Cave Temple
mihintale.mp4       - Mihintale - Cradle of Buddhism
temple_of_tooth.mp4 - Sri Dalada Maligawa
galle_fort.mp4      - Galle Fort
adam_peak.mp4       - Adam's Peak / Sri Pada

POSTER IMAGES (Optional):
------------------------
Place thumbnail images in the 'posters' subfolder:
  posters/sigiriya.jpg
  posters/anuradhapura.jpg
  etc.

SUPPORTED FORMATS:
-----------------
- MP4 (recommended)
- WebM
- Ogg

ADDING NEW VIDEOS:
-----------------
Use the API to add new video entries:

POST /api/videos
{
  "id": "my_video",
  "path": "/videos/my_video.mp4",
  "description": "Description for semantic matching",
  "topics": ["topic1", "topic2", "keyword1"],
  "poster": "/videos/posters/my_video.jpg",
  "era": "5th century AD"
}

The description and topics are used by the vector database
to find the best matching video for each question.

