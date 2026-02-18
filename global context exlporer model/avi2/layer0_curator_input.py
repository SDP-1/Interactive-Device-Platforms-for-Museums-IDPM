"""
Layer 0: Curator Input Parser
Parses curator input (local event text, optional date/location) into structured query object.
"""

import re
from typing import Dict, Optional, List
from datetime import datetime


class CuratorInputParser:
    """Parses curator input into structured query format."""
    
    def __init__(self):
        self.date_patterns = [
            r'\b(\d{4})\b',  # Year: 1867
            r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b',  # Date: 01/15/1867
            r'\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b',  # Date: 1867-01-15
        ]
    
    def parse(self, input_text: str, date: Optional[str] = None, location: Optional[str] = None) -> Dict:
        """
        Parse curator input into structured query.
        
        Args:
            input_text: Local event text (e.g., "Establishment of tea plantations in Sri Lanka")
            date: Optional date string
            location: Optional location string
        
        Returns:
            Structured query dictionary
        """
        query = {
            'local_event_text': input_text.strip(),
            'date_range': None,
            'location': None,
            'entities': [],
            'keywords': []
        }
        
        # Extract date if provided or found in text
        if date:
            query['date_range'] = self._parse_date(date)
        else:
            extracted_date = self._extract_date_from_text(input_text)
            if extracted_date:
                query['date_range'] = extracted_date
        
        # Extract location if provided or found in text
        if location:
            query['location'] = location.strip()
        else:
            extracted_location = self._extract_location_from_text(input_text)
            if extracted_location:
                query['location'] = extracted_location
        
        # Extract entities and keywords
        query['entities'] = self._extract_entities(input_text)
        query['keywords'] = self._extract_keywords(input_text)
        
        return query
    
    def _parse_date(self, date_str: str) -> Optional[Dict]:
        """Parse date string into date range."""
        try:
            # Try to parse as single date
            if len(date_str) == 4 and date_str.isdigit():
                year = int(date_str)
                return {
                    'start': f"{year}-01-01",
                    'end': f"{year}-12-31",
                    'year': year
                }
            
            # Try to parse as full date
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            date_str_formatted = date_obj.strftime("%Y-%m-%d")
            return {
                'start': date_str_formatted,
                'end': date_str_formatted,
                'year': date_obj.year
            }
        except:
            return None
    
    def _extract_date_from_text(self, text: str) -> Optional[Dict]:
        """Extract date from text using patterns."""
        for pattern in self.date_patterns:
            match = re.search(pattern, text)
            if match:
                if len(match.groups()) == 1:
                    year = int(match.group(1))
                    return {
                        'start': f"{year}-01-01",
                        'end': f"{year}-12-31",
                        'year': year
                    }
        return None
    
    def _extract_location_from_text(self, text: str) -> Optional[str]:
        """Extract location mentions from text."""
        # Common location indicators
        location_keywords = [
            'Sri Lanka', 'Ceylon', 'Colombo', 'Kandy', 'Central Highlands',
            'Hill Country', 'Plantation Regions', 'Central Province'
        ]
        
        text_lower = text.lower()
        for loc in location_keywords:
            if loc.lower() in text_lower:
                return loc
        
        return None
    
    def _extract_entities(self, text: str) -> List[str]:
        """Extract entity mentions (countries, organizations, etc.)."""
        entities = []
        
        # Common entities
        entity_patterns = [
            r'\b(British|Britain|UK|United Kingdom)\b',
            r'\b(Sri Lanka|Ceylon)\b',
            r'\b(India|Indian)\b',
            r'\b(China|Chinese)\b',
            r'\b(America|American|USA|United States)\b',
            r'\b(Europe|European)\b',
        ]
        
        for pattern in entity_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            entities.extend([m[0] if isinstance(m, tuple) else m for m in matches])
        
        return list(set(entities))
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from text."""
        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        
        # Split and filter
        words = re.findall(r'\b\w+\b', text.lower())
        keywords = [w for w in words if w not in stop_words and len(w) > 3]
        
        return keywords[:10]  # Top 10 keywords

