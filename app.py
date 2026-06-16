import time
from flask import Flask, jsonify, render_template, request
import requests
from bs4 import BeautifulSoup
import threading

app = Flask(__name__)

# Cache structure to prevent excessive requests to Google's feeds
FEED_CACHE = {
    "data": None,
    "last_fetched": 0,
    "cache_duration": 600  # 10 minutes cache
}
cache_lock = threading.Lock()

def fetch_and_parse_feed():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    response = requests.get(url, headers=headers, timeout=15)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch BigQuery release notes. HTTP Status: {response.status_code}")
    
    # Parse Atom Feed using built-in HTML parser
    soup = BeautifulSoup(response.content, "html.parser")
    entries = soup.find_all("entry")
    
    updates = []
    
    for entry in entries:
        date = entry.find("title").text.strip() if entry.find("title") else "Unknown Date"
        updated_raw = entry.find("updated").text.strip() if entry.find("updated") else ""
        link_tag = entry.find("link", rel="alternate")
        link = link_tag["href"] if link_tag and link_tag.get("href") else "https://cloud.google.com/bigquery/docs/release-notes"
        
        content_tag = entry.find("content")
        if not content_tag:
            continue
            
        content_html = content_tag.text
        content_soup = BeautifulSoup(content_html, "html.parser")
        
        # Google release notes format is usually h3 for update type (Feature, Issue, Change, etc.)
        h3_tags = content_soup.find_all("h3")
        
        if not h3_tags:
            # Fallback if no h3 sections exist
            plain_text = content_soup.get_text().strip()
            updates.append({
                "id": entry.find("id").text.strip() if entry.find("id") else f"gen-{time.time()}",
                "date": date,
                "type": "General",
                "content_html": str(content_soup),
                "plain_text": plain_text,
                "link": link
            })
            continue
            
        for idx, h3 in enumerate(h3_tags):
            update_type = h3.text.strip()
            
            # Gather all siblings until the next h3 tag
            siblings = []
            next_sib = h3.next_sibling
            while next_sib and next_sib.name != "h3":
                siblings.append(next_sib)
                next_sib = next_sib.next_sibling
                
            # Render siblings back to HTML string
            sibling_html = "".join(str(s) for s in siblings).strip()
            if not sibling_html:
                continue
                
            # Extract plain text for tweet composer
            sibling_soup = BeautifulSoup(sibling_html, "html.parser")
            plain_text = sibling_soup.get_text().strip()
            
            # Clean up duplicate whitespace/newlines
            plain_text = " ".join(plain_text.split())
            
            # Form a unique ID for this update
            entry_id = entry.find("id").text.strip() if entry.find("id") else "id"
            update_id = f"{entry_id}#update-{idx}"
            
            updates.append({
                "id": update_id,
                "date": date,
                "type": update_type,
                "content_html": sibling_html,
                "plain_text": plain_text,
                "link": link
            })
            
    return updates

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/releases")
def get_releases():
    force_refresh = request.args.get("refresh", "false").lower() == "true"
    current_time = time.time()
    
    global FEED_CACHE
    
    # Check if cache is valid and refresh is not forced
    if not force_refresh and FEED_CACHE["data"] is not None:
        if current_time - FEED_CACHE["last_fetched"] < FEED_CACHE["cache_duration"]:
            return jsonify({
                "status": "success",
                "source": "cache",
                "last_fetched": FEED_CACHE["last_fetched"],
                "data": FEED_CACHE["data"]
            })
            
    # Fetch live data using lock to prevent multiple requests hitting the feed at once
    with cache_lock:
        # Double check after obtaining the lock
        if not force_refresh and FEED_CACHE["data"] is not None:
            if current_time - FEED_CACHE["last_fetched"] < FEED_CACHE["cache_duration"]:
                return jsonify({
                    "status": "success",
                    "source": "cache",
                    "last_fetched": FEED_CACHE["last_fetched"],
                    "data": FEED_CACHE["data"]
                })
                
        try:
            updates = fetch_and_parse_feed()
            FEED_CACHE["data"] = updates
            FEED_CACHE["last_fetched"] = current_time
            return jsonify({
                "status": "success",
                "source": "live",
                "last_fetched": current_time,
                "data": updates
            })
        except Exception as e:
            # If live fetch fails, fall back to cache if available
            if FEED_CACHE["data"] is not None:
                return jsonify({
                    "status": "partial_success",
                    "error": str(e),
                    "source": "cache_fallback",
                    "last_fetched": FEED_CACHE["last_fetched"],
                    "data": FEED_CACHE["data"]
                })
            else:
                return jsonify({
                    "status": "error",
                    "message": str(e)
                }), 500

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
