import os
import time
import urllib.request
import xml.etree.ElementTree as ET
import re
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Cache configuration
FEED_URL = "https://docs.cloud.google.com/feeds/ai-hypercomputer-release-notes.xml"
CACHE_DURATION = 3600  # Cache for 1 hour
cache = {
    "data": None,
    "last_fetched": 0
}

def clean_and_parse_feed(force_refresh=False):
    global cache
    now = time.time()
    
    # Return cache if valid and force_refresh is False
    if cache["data"] and (now - cache["last_fetched"] < CACHE_DURATION) and not force_refresh:
        return cache["data"], True

    try:
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            xml_data = response.read()
        
        # Parse XML
        root = ET.fromstring(xml_data)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            title_el = entry.find('atom:title', ns)
            title = title_el.text if title_el is not None else ""
            
            id_el = entry.find('atom:id', ns)
            entry_id = id_el.text if id_el is not None else ""
            
            updated_el = entry.find('atom:updated', ns)
            updated = updated_el.text if updated_el is not None else ""
            
            link_href = ""
            for link in entry.findall('atom:link', ns):
                rel = link.attrib.get('rel')
                if rel == 'alternate' or not link_href:
                    link_href = link.attrib.get('href', '')
            
            content_el = entry.find('atom:content', ns)
            content = content_el.text if content_el is not None else ""
            
            # Simple heuristic to extract categories from <h3> tags in the HTML
            categories = []
            h3_matches = re.findall(r'<h3>(.*?)</h3>', content, re.IGNORECASE)
            for m in h3_matches:
                clean_cat = re.sub('<[^<]+?>', '', m).strip()
                if clean_cat and clean_cat not in categories:
                    categories.append(clean_cat)
                    
            # If no categories were found but we have some text, default to "General" or parse from strong tags
            if not categories:
                # Fallback to search for strong text in first paragraph as a category clue
                strong_matches = re.findall(r'<p><strong>(.*?)</strong>', content, re.IGNORECASE)
                if strong_matches:
                    clean_strong = re.sub('<[^<]+?>', '', strong_matches[0]).replace(':', '').strip()
                    if len(clean_strong) < 25:
                        categories.append(clean_strong)
                if not categories:
                    categories.append("Update")
            
            entries.append({
                'title': title,
                'id': entry_id,
                'updated': updated,
                'link': link_href,
                'content': content,
                'categories': categories
            })
            
        result = {
            'status': 'success',
            'updated_at': now,
            'notes': entries
        }
        
        cache["data"] = result
        cache["last_fetched"] = now
        return result, False
        
    except Exception as e:
        # If fetch fails but we have stale cache, return it with a warning
        if cache["data"]:
            stale_data = cache["data"].copy()
            stale_data['warning'] = f"Failed to refresh live feed: {str(e)}. Displaying cached data."
            return stale_data, True
        return {
            'status': 'error',
            'message': str(e)
        }, False

import json

# In-memory translation cache to avoid duplicate API calls
translation_cache = {}

def translate_html_content(html, target_lang='ru'):
    """
    Translates HTML content block-by-block using Google Translate single API.
    Splits by tag boundaries to stay within API length limits and protect tags.
    """
    import urllib.parse
    
    # Split by closing block tags to translate paragraph/heading by paragraph/heading
    blocks = re.split(r'(</p>|</h3>|</li>)', html)
    translated_blocks = []
    
    for block in blocks:
        if not block:
            continue
        if block in ['</p>', '</h3>', '</li>']:
            translated_blocks.append(block)
        elif not block.strip() or re.match(r'^<[^>]+>$', block.strip()):
            translated_blocks.append(block)
        else:
            try:
                # Call free Google Translate single API
                url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' + target_lang + '&dt=t&q=' + urllib.parse.quote(block)
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
                with urllib.request.urlopen(req, timeout=10) as response:
                    resp_data = json.loads(response.read().decode('utf-8'))
                val = ''.join([part[0] for part in resp_data[0] if part and part[0]])
                translated_blocks.append(val)
            except Exception as e:
                # Graceful fallback to original content on network/parsing error
                translated_blocks.append(block)
                
    return "".join(translated_blocks)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    force = request.args.get('force', 'false').lower() == 'true'
    data, is_cached = clean_and_parse_feed(force_refresh=force)
    
    response = jsonify(data)
    response.headers['X-Cache-Hit'] = 'true' if is_cached else 'false'
    return response

@app.route('/api/translate', methods=['POST'])
def translate():
    try:
        data = request.json or {}
        note_id = data.get('id')
        content = data.get('content')
        target_lang = data.get('target', 'ru')
        
        if not note_id or not content:
            return jsonify({'status': 'error', 'message': 'Missing note ID or content'}), 400
            
        cache_key = f"{note_id}:{target_lang}"
        if cache_key in translation_cache:
            return jsonify({
                'status': 'success',
                'translated_content': translation_cache[cache_key],
                'cached': True
            })
            
        translated_html = translate_html_content(content, target_lang)
        translation_cache[cache_key] = translated_html
        
        return jsonify({
            'status': 'success',
            'translated_content': translated_html,
            'cached': False
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
