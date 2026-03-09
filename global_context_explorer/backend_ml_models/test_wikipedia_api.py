"""
Test script for enhanced Wikipedia API implementation.
Tests all the new features from the methodology.
"""

from layer1_knowledge_collection import KnowledgeCollector
import json

def test_wikipedia_apis():
    """Test all Wikipedia API methods."""
    print("=" * 80)
    print("Testing Enhanced Wikipedia API Implementation")
    print("=" * 80)
    
    collector = KnowledgeCollector(rate_limit=0.3, timeout=10)
    
    # Test 1: Wikipedia REST API (Summary)
    print("\n[Test 1] Wikipedia REST API - Page Summary")
    print("-" * 80)
    summary = collector._get_wikipedia_summary("Anuradhapura_Kingdom")
    if summary:
        print(f"✓ Title: {summary.get('title')}")
        print(f"✓ Extract length: {len(summary.get('extract', ''))} chars")
        print(f"✓ URL: {summary.get('url')}")
    else:
        print("✗ Failed to get summary")
    
    # Test 2: MediaWiki Search API
    print("\n[Test 2] MediaWiki API - Search")
    print("-" * 80)
    search_results = collector._search_wikipedia_mediawiki("Sigiriya drawings", limit=5)
    print(f"✓ Found {len(search_results)} results")
    for i, result in enumerate(search_results[:3], 1):
        print(f"  {i}. {result.get('title')} (ID: {result.get('pageid')})")
        print(f"     Snippet: {result.get('snippet', '')[:100]}...")
    
    # Test 3: Category Members
    print("\n[Test 3] MediaWiki API - Category Members")
    print("-" * 80)
    category_results = collector._get_category_members("Category:20th_century_in_Sri_Lanka", limit=10)
    print(f"✓ Found {len(category_results)} category members")
    for i, member in enumerate(category_results[:5], 1):
        print(f"  {i}. {member.get('title')}")
    
    # Test 4: Full Content Extraction
    print("\n[Test 4] MediaWiki API - Full Content Extraction")
    print("-" * 80)
    if search_results:
        page_id = search_results[0].get('pageid')
        if page_id:
            full_content = collector._get_wikipedia_full_content(page_id)
            if full_content:
                print(f"✓ Retrieved full content for: {full_content.get('title')}")
                print(f"✓ Content length: {full_content.get('content_length', 0)} chars")
                print(f"✓ Plain text length: {len(full_content.get('plain_text', ''))} chars")
            else:
                print("✗ Failed to get full content")
    
    # Test 5: Seshat DB API
    print("\n[Test 5] Seshat DB API")
    print("-" * 80)
    seshat_results = collector._search_seshat("Buddhism")
    print(f"✓ Seshat DB query completed")
    if seshat_results:
        print(f"✓ Found {len(seshat_results)} results")
    else:
        print("  (No results or API endpoint needs configuration)")
    
    # Test 6: Complete Collection Workflow
    print("\n[Test 6] Complete Knowledge Collection Workflow")
    print("-" * 80)
    query = {
        'local_event_text': 'Establishment of Tea Plantations in Sri Lanka',
        'entities': ['British', 'Sri Lanka'],
        'keywords': ['tea', 'plantation', 'colonial'],
        'date_range': {'year': 1867}
    }
    
    evidence = collector.collect(query)
    
    print(f"✓ Wikipedia snippets: {len(evidence['wikipedia_snippets'])}")
    print(f"✓ Wikipedia search results: {len(evidence['wikipedia_search_results'])}")
    print(f"✓ Wikipedia category results: {len(evidence['wikipedia_category_results'])}")
    print(f"✓ Wikipedia full content: {len(evidence['wikipedia_full_content'])}")
    print(f"✓ Entity mentions: {len(evidence['entity_mentions'])}")
    print(f"✓ Related commodities: {len(evidence['related_commodities'])}")
    print(f"✓ Context keywords: {len(evidence['context_keywords'])}")
    print(f"✓ UNESCO data: {len(evidence['unesco_data'])}")
    print(f"✓ Seshat data: {len(evidence['seshat_data'])}")
    print(f"✓ Total raw text evidence: {len(evidence['raw_text_evidence'])}")
    
    # Test 7: Cache Statistics
    print("\n[Test 7] Cache Statistics")
    print("-" * 80)
    stats = collector.get_cache_stats()
    print(f"✓ Cache size: {stats['cache_size']} entries")
    print(f"✓ Total requests: {stats['request_count']}")
    
    print("\n" + "=" * 80)
    print("All Tests Completed!")
    print("=" * 80)
    
    return evidence

if __name__ == "__main__":
    try:
        evidence = test_wikipedia_apis()
        
        # Optionally save results to file
        print("\nSaving sample results to test_results.json...")
        sample_results = {
            'wikipedia_snippets': evidence['wikipedia_snippets'][:2],
            'wikipedia_search_results': evidence['wikipedia_search_results'][:3],
            'total_evidence_count': len(evidence['raw_text_evidence'])
        }
        
        with open('test_results.json', 'w', encoding='utf-8') as f:
            json.dump(sample_results, f, indent=2, ensure_ascii=False)
        
        print("✓ Results saved to test_results.json")
        
    except Exception as e:
        print(f"\n✗ Error during testing: {e}")
        import traceback
        traceback.print_exc()

