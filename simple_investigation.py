#!/usr/bin/env python3
"""
Simple investigation of CharacterCut live deployment using requests and basic analysis
"""

import requests
import json
import re
import os
from urllib.parse import urljoin, urlparse
import time

def investigate_deployment():
    """Investigate the live deployment without browser automation"""
    print("🔍 Starting simple CharacterCut deployment investigation...")
    
    base_url = 'https://background-remover-eight-alpha.vercel.app/'
    
    # Create results directory
    os.makedirs('investigation_results', exist_ok=True)
    
    results = {
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'base_url': base_url,
        'findings': {}
    }
    
    try:
        # 1. Fetch the main page
        print("📱 Fetching main page...")
        response = requests.get(base_url, timeout=30)
        
        results['findings']['main_page'] = {
            'status_code': response.status_code,
            'response_time': response.elapsed.total_seconds(),
            'content_length': len(response.content),
            'headers': dict(response.headers)
        }
        
        if response.status_code == 200:
            print(f"✓ Main page loaded (Status: {response.status_code})")
            print(f"✓ Response time: {response.elapsed.total_seconds():.2f}s")
            print(f"✓ Content length: {len(response.content)} bytes")
            
            html_content = response.text
            
            # Save HTML for analysis
            with open('investigation_results/main_page.html', 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            # 2. Analyze HTML structure
            print("🔍 Analyzing HTML structure...")
            
            # Look for key elements
            key_patterns = {
                'title': r'<title>(.*?)</title>',
                'upload_input': r'<input[^>]*type=["\']file["\'][^>]*>',
                'refine_button': r'<button[^>]*(?:refine|Refine)[^>]*>.*?</button>',
                'cancel_button': r'<button[^>]*(?:cancel|Cancel)[^>]*>.*?</button>',
                'apply_button': r'<button[^>]*(?:apply|Apply)[^>]*>.*?</button>',
                'erase_button': r'<button[^>]*(?:erase|Erase)[^>]*>.*?</button>',
                'restore_button': r'<button[^>]*(?:restore|Restore)[^>]*>.*?</button>',
                'canvas_element': r'<canvas[^>]*>',
                'magic_classes': r'class=["\'][^"\']*magic[^"\']*["\']',
                'dark_classes': r'class=["\'][^"\']*dark[^"\']*["\']',
                'btn_classes': r'class=["\'][^"\']*btn[^"\']*["\']'
            }
            
            html_findings = {}
            for pattern_name, pattern in key_patterns.items():
                matches = re.findall(pattern, html_content, re.IGNORECASE | re.DOTALL)
                html_findings[pattern_name] = {
                    'found': len(matches) > 0,
                    'count': len(matches),
                    'matches': matches[:5]  # First 5 matches
                }
                
                if matches:
                    print(f"✓ Found {pattern_name}: {len(matches)} occurrences")
                else:
                    print(f"❌ {pattern_name} not found")
            
            results['findings']['html_analysis'] = html_findings
            
            # 3. Extract and analyze linked resources
            print("🔗 Analyzing linked resources...")
            
            css_links = re.findall(r'<link[^>]*href=["\']([^"\']*\.css[^"\']*)["\'][^>]*>', html_content, re.IGNORECASE)
            js_links = re.findall(r'<script[^>]*src=["\']([^"\']*\.js[^"\']*)["\'][^>]*>', html_content, re.IGNORECASE)
            
            print(f"Found {len(css_links)} CSS files, {len(js_links)} JS files")
            
            resources_analysis = {
                'css_files': [],
                'js_files': []
            }
            
            # Check CSS files
            for css_url in css_links[:10]:  # Check first 10
                if css_url.startswith('http'):
                    full_url = css_url
                else:
                    full_url = urljoin(base_url, css_url)
                
                try:
                    css_response = requests.get(full_url, timeout=10)
                    css_info = {
                        'url': css_url,
                        'full_url': full_url,
                        'status': css_response.status_code,
                        'size': len(css_response.content),
                        'contains_dark_theme': 'dark' in css_response.text.lower(),
                        'contains_magic_classes': 'magic' in css_response.text.lower(),
                        'contains_btn_classes': 'btn' in css_response.text.lower()
                    }
                    
                    # Look for specific class patterns in CSS
                    if css_response.status_code == 200:
                        css_content = css_response.text
                        css_info['key_classes_found'] = {
                            'btn-magic': 'btn-magic' in css_content,
                            'btn-outline': 'btn-outline' in css_content,
                            'dark-border': 'dark-border' in css_content,
                            'dark-text-secondary': 'dark-text-secondary' in css_content
                        }
                    
                    resources_analysis['css_files'].append(css_info)
                    print(f"  CSS: {css_url} ({css_response.status_code}) - {len(css_response.content)} bytes")
                    
                except Exception as e:
                    print(f"  ❌ Failed to fetch CSS {css_url}: {e}")
            
            # Check JS files (first few)
            for js_url in js_links[:5]:
                if js_url.startswith('http'):
                    full_url = js_url
                else:
                    full_url = urljoin(base_url, js_url)
                
                try:
                    js_response = requests.get(full_url, timeout=10)
                    js_info = {
                        'url': js_url,
                        'full_url': full_url,
                        'status': js_response.status_code,
                        'size': len(js_response.content)
                    }
                    resources_analysis['js_files'].append(js_info)
                    print(f"  JS: {js_url} ({js_response.status_code}) - {len(js_response.content)} bytes")
                    
                except Exception as e:
                    print(f"  ❌ Failed to fetch JS {js_url}: {e}")
            
            results['findings']['resources'] = resources_analysis
            
            # 4. Check for inline styles and scripts
            print("📝 Checking inline content...")
            inline_styles = re.findall(r'<style[^>]*>(.*?)</style>', html_content, re.DOTALL | re.IGNORECASE)
            inline_scripts = re.findall(r'<script[^>]*(?:>(?![^<]*src=))(.*?)</script>', html_content, re.DOTALL | re.IGNORECASE)
            
            inline_analysis = {
                'inline_styles_count': len(inline_styles),
                'inline_scripts_count': len(inline_scripts),
                'has_dark_theme_variables': False,
                'has_magic_classes': False
            }
            
            # Check inline styles for our classes
            for style in inline_styles:
                if 'dark' in style.lower():
                    inline_analysis['has_dark_theme_variables'] = True
                if 'magic' in style.lower():
                    inline_analysis['has_magic_classes'] = True
            
            results['findings']['inline_content'] = inline_analysis
            
            print(f"✓ Found {len(inline_styles)} inline styles, {len(inline_scripts)} inline scripts")
            
            # 5. Check specific deployment indicators
            print("🚀 Checking deployment indicators...")
            
            deployment_indicators = {
                'vercel_headers': {},
                'build_id': None,
                'last_modified': response.headers.get('last-modified'),
                'cache_control': response.headers.get('cache-control'),
                'etag': response.headers.get('etag')
            }
            
            # Extract Vercel-specific headers
            for header, value in response.headers.items():
                if header.lower().startswith('x-vercel') or 'vercel' in header.lower():
                    deployment_indicators['vercel_headers'][header] = value
            
            # Look for build ID or version in content
            build_patterns = [
                r'buildId["\']?\s*:\s*["\']([^"\']+)["\']',
                r'version["\']?\s*:\s*["\']([^"\']+)["\']',
                r'_buildManifest',
                r'__NEXT_DATA__'
            ]
            
            for pattern in build_patterns:
                matches = re.findall(pattern, html_content, re.IGNORECASE)
                if matches:
                    deployment_indicators['build_id'] = matches[0] if isinstance(matches[0], str) else str(matches[0])
                    break
            
            results['findings']['deployment'] = deployment_indicators
            
            print("Deployment headers found:")
            for header, value in deployment_indicators['vercel_headers'].items():
                print(f"  {header}: {value}")
            
        else:
            print(f"❌ Failed to load main page (Status: {response.status_code})")
            
    except requests.RequestException as e:
        print(f"❌ Network error: {e}")
        results['findings']['error'] = str(e)
    
    # Save results
    with open('investigation_results/analysis.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\n" + "="*60)
    print("📊 INVESTIGATION SUMMARY")
    print("="*60)
    
    if 'main_page' in results['findings']:
        main_page = results['findings']['main_page']
        print(f"Main Page Status: {main_page['status_code']}")
        print(f"Response Time: {main_page['response_time']:.2f}s")
        print(f"Content Size: {main_page['content_length']:,} bytes")
    
    if 'html_analysis' in results['findings']:
        html_analysis = results['findings']['html_analysis']
        
        print(f"\nKey Elements Found:")
        for element, info in html_analysis.items():
            status = "✓" if info['found'] else "❌"
            print(f"  {status} {element}: {info['count']} occurrences")
    
    if 'resources' in results['findings']:
        resources = results['findings']['resources']
        
        print(f"\nResource Analysis:")
        print(f"  CSS Files: {len(resources['css_files'])}")
        print(f"  JS Files: {len(resources['js_files'])}")
        
        # Check for our specific classes
        magic_found = any(css.get('contains_magic_classes', False) for css in resources['css_files'])
        dark_found = any(css.get('contains_dark_theme', False) for css in resources['css_files'])
        
        print(f"  Magic Classes in CSS: {'✓' if magic_found else '❌'}")
        print(f"  Dark Theme in CSS: {'✓' if dark_found else '❌'}")
        
        # Show specific class findings
        for css in resources['css_files']:
            if 'key_classes_found' in css:
                classes = css['key_classes_found']
                found_classes = [k for k, v in classes.items() if v]
                if found_classes:
                    print(f"  Found in {css['url']}: {', '.join(found_classes)}")
    
    if 'deployment' in results['findings']:
        deployment = results['findings']['deployment']
        print(f"\nDeployment Info:")
        if deployment['build_id']:
            print(f"  Build ID: {deployment['build_id']}")
        if deployment['last_modified']:
            print(f"  Last Modified: {deployment['last_modified']}")
        if deployment['vercel_headers']:
            print(f"  Vercel Headers: {len(deployment['vercel_headers'])}")
    
    print(f"\n📁 Results saved to: investigation_results/")
    print("✅ Investigation complete!")

if __name__ == "__main__":
    investigate_deployment()