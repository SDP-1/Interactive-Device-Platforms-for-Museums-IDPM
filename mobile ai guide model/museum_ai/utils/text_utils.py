import re
from langchain_text_splitters import RecursiveCharacterTextSplitter


# ----------------------------
# Clean and normalize text
# ----------------------------
def clean_text(text: str) -> str:
    """
    Clean text by removing extra whitespace and normalizing.
    
    Args:
        text: Raw text string
    
    Returns:
        Cleaned text string
    """
    if not text:
        return ""
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Strip leading/trailing whitespace
    text = text.strip()
    return text


# ----------------------------
# Split text into chunks
# ----------------------------
def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 100) -> list[str]:
    """
    Split text into smaller chunks for embedding.
    
    Args:
        text: Text to chunk
        chunk_size: Maximum size of each chunk
        chunk_overlap: Overlap between chunks
    
    Returns:
        List of text chunks
    """
    if not text:
        return []
    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    return splitter.split_text(text)


# ----------------------------
# Combine multiple text fields
# ----------------------------
def combine_text_fields(*fields: str, separator: str = "\n") -> str:
    """
    Combine multiple text fields into a single string.
    
    Args:
        *fields: Variable number of text fields to combine
        separator: Separator between fields
    
    Returns:
        Combined text string
    """
    # Filter out empty fields
    non_empty = [field.strip() for field in fields if field and field.strip()]
    return separator.join(non_empty)


# ----------------------------
# Detect language (basic heuristic)
# ----------------------------
def detect_language(text: str) -> str:
    """
    Basic language detection for Sinhala vs English.
    Uses Unicode range detection for Sinhala script.
    
    Args:
        text: Text to analyze
    
    Returns:
        "si" for Sinhala, "en" for English, "mixed" for mixed content
    """
    if not text:
        return "en"
    
    # Sinhala Unicode range: U+0D80 to U+0DFF
    sinhala_pattern = re.compile(r'[\u0D80-\u0DFF]')
    has_sinhala = bool(sinhala_pattern.search(text))
    
    # Check for English (Latin characters)
    english_pattern = re.compile(r'[a-zA-Z]')
    has_english = bool(english_pattern.search(text))
    
    if has_sinhala and has_english:
        return "mixed"
    elif has_sinhala:
        return "si"
    else:
        return "en"

