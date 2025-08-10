#!/usr/bin/env python3
"""
Investigate CharacterCut live deployment status and UI changes
"""

import time
import json
import base64
from io import BytesIO
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from PIL import Image, ImageDraw
import os

def create_test_image():
    """Create a simple test image for upload"""
    # Create a simple character-like image
    img = Image.new('RGB', (200, 200), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple character shape
    draw.rectangle([50, 50, 150, 180], fill='#4A90E2')  # Body
    draw.ellipse([75, 25, 125, 75], fill='#F5A623')     # Head
    
    # Save to bytes
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    # Save to file for upload
    test_image_path = 'test_character.png'
    img.save(test_image_path)
    
    return test_image_path

def investigate_live_deployment():
    """Main investigation function"""
    print("🔍 Starting CharacterCut live deployment investigation...")
    
    # Setup Chrome options
    chrome_options = Options()
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1920,1080')
    
    # Create screenshots directory
    os.makedirs('screenshots', exist_ok=True)
    
    driver = None
    try:
        # Setup Chrome driver with automatic driver management
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        wait = WebDriverWait(driver, 20)
        
        print("📱 Navigating to live site...")
        driver.get('https://background-remover-eight-alpha.vercel.app/')
        
        # Take initial screenshot
        driver.save_screenshot('screenshots/live-site-initial.png')
        print("✓ Initial screenshot saved")
        
        # Check page title and basic info
        title = driver.title
        print(f"Page title: {title}")
        
        # Check for deployment info in meta tags
        meta_tags = driver.find_elements(By.TAG_NAME, 'meta')
        print("Meta tags found:")
        for meta in meta_tags[:10]:  # Show first 10
            name = meta.get_attribute('name') or meta.get_attribute('property')
            content = meta.get_attribute('content')
            if name and content:
                print(f"  {name}: {content}")
        
        # Check loaded resources
        script_tags = driver.find_elements(By.TAG_NAME, 'script')
        link_tags = driver.find_elements(By.TAG_NAME, 'link')
        
        print(f"Scripts loaded: {len(script_tags)}")
        print(f"Stylesheets loaded: {len(link_tags)}")
        
        # Look for main upload area
        print("🔍 Looking for upload area...")
        upload_selectors = [
            'input[type="file"]',
            '[data-testid="upload-area"]',
            '.upload-area',
            '.dropzone',
            '.file-upload'
        ]
        
        upload_element = None
        for selector in upload_selectors:
            try:
                upload_element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
                print(f"✓ Found upload element with selector: {selector}")
                break
            except TimeoutException:
                continue
        
        if not upload_element:
            print("❌ Could not find upload area")
            driver.save_screenshot('screenshots/no-upload-area.png')
            return
        
        # Create and upload test image
        print("🖼️ Creating test image...")
        test_image_path = create_test_image()
        
        print("📤 Uploading test image...")
        try:
            # Find file input (might be hidden)
            file_inputs = driver.find_elements(By.CSS_SELECTOR, 'input[type="file"]')
            if file_inputs:
                file_input = file_inputs[0]
                absolute_path = os.path.abspath(test_image_path)
                file_input.send_keys(absolute_path)
                print("✓ Image uploaded successfully")
                
                # Wait for processing
                print("⏳ Waiting for image processing...")
                time.sleep(10)  # Give time for processing
                
                # Take screenshot after upload
                driver.save_screenshot('screenshots/after-upload.png')
                
                # Look for refine/refinement tools
                print("🔍 Looking for refinement tools...")
                refine_selectors = [
                    'button:contains("Refine")',
                    'button:contains("Refine Edge")',
                    '[data-testid="refine-button"]',
                    '.refine-btn',
                    '.refine-button'
                ]
                
                refine_button = None
                for selector in refine_selectors:
                    try:
                        if 'contains' in selector:
                            # Use XPath for text-based selectors
                            xpath = f"//button[contains(text(), 'Refine')]"
                            refine_button = driver.find_element(By.XPATH, xpath)
                        else:
                            refine_button = driver.find_element(By.CSS_SELECTOR, selector)
                        print(f"✓ Found refine button")
                        break
                    except NoSuchElementException:
                        continue
                
                if refine_button:
                    print("🖱️ Clicking refine button...")
                    driver.execute_script("arguments[0].click();", refine_button)
                    time.sleep(3)
                    
                    # Take screenshot of refinement interface
                    driver.save_screenshot('screenshots/refinement-interface.png')
                    
                    # Inspect Cancel and Apply buttons
                    print("🔍 Inspecting Cancel and Apply buttons...")
                    
                    # Look for Cancel button
                    try:
                        cancel_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Cancel')]")
                        cancel_classes = cancel_button.get_attribute('class')
                        print(f"Cancel Button Classes: {cancel_classes}")
                        
                        # Get computed styles
                        cancel_styles = driver.execute_script("""
                            var el = arguments[0];
                            var styles = window.getComputedStyle(el);
                            return {
                                backgroundColor: styles.backgroundColor,
                                color: styles.color,
                                border: styles.border,
                                borderColor: styles.borderColor,
                                padding: styles.padding,
                                borderRadius: styles.borderRadius,
                                fontSize: styles.fontSize,
                                fontWeight: styles.fontWeight
                            };
                        """, cancel_button)
                        
                        print("Cancel Button Computed Styles:")
                        for style, value in cancel_styles.items():
                            print(f"  {style}: {value}")
                            
                    except NoSuchElementException:
                        print("❌ Cancel button not found")
                    
                    # Look for Apply button
                    try:
                        apply_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Apply')]")
                        apply_classes = apply_button.get_attribute('class')
                        print(f"Apply Button Classes: {apply_classes}")
                        
                        # Get computed styles
                        apply_styles = driver.execute_script("""
                            var el = arguments[0];
                            var styles = window.getComputedStyle(el);
                            return {
                                backgroundColor: styles.backgroundColor,
                                color: styles.color,
                                border: styles.border,
                                borderColor: styles.borderColor,
                                padding: styles.padding,
                                borderRadius: styles.borderRadius,
                                fontSize: styles.fontSize,
                                fontWeight: styles.fontWeight
                            };
                        """, apply_button)
                        
                        print("Apply Button Computed Styles:")
                        for style, value in apply_styles.items():
                            print(f"  {style}: {value}")
                            
                    except NoSuchElementException:
                        print("❌ Apply button not found")
                    
                    # Test erase tool
                    print("🔍 Testing erase tool...")
                    try:
                        erase_selectors = [
                            "//button[contains(text(), 'Erase')]",
                            "[data-testid='erase-tool']",
                            ".erase-tool"
                        ]
                        
                        erase_button = None
                        for selector in erase_selectors:
                            try:
                                if selector.startswith('//'):
                                    erase_button = driver.find_element(By.XPATH, selector)
                                else:
                                    erase_button = driver.find_element(By.CSS_SELECTOR, selector)
                                break
                            except NoSuchElementException:
                                continue
                        
                        if erase_button:
                            print("✓ Found erase tool")
                            erase_classes = erase_button.get_attribute('class')
                            print(f"Erase Tool Classes: {erase_classes}")
                            
                            # Click erase tool
                            erase_button.click()
                            time.sleep(1)
                            
                            # Try to use it on canvas
                            canvas = driver.find_element(By.TAG_NAME, 'canvas')
                            if canvas:
                                driver.execute_script("arguments[0].click();", canvas)
                                print("✓ Clicked on canvas with erase tool")
                        else:
                            print("❌ Erase tool not found")
                            
                    except Exception as e:
                        print(f"❌ Error testing erase tool: {e}")
                    
                    # Test restore tool
                    print("🔍 Testing restore tool...")
                    try:
                        restore_selectors = [
                            "//button[contains(text(), 'Restore')]",
                            "[data-testid='restore-tool']",
                            ".restore-tool"
                        ]
                        
                        restore_button = None
                        for selector in restore_selectors:
                            try:
                                if selector.startswith('//'):
                                    restore_button = driver.find_element(By.XPATH, selector)
                                else:
                                    restore_button = driver.find_element(By.CSS_SELECTOR, selector)
                                break
                            except NoSuchElementException:
                                continue
                        
                        if restore_button:
                            print("✓ Found restore tool")
                            restore_classes = restore_button.get_attribute('class')
                            print(f"Restore Tool Classes: {restore_classes}")
                            
                            # Click restore tool
                            restore_button.click()
                            time.sleep(1)
                            
                            # Try to use it on canvas
                            canvas = driver.find_element(By.TAG_NAME, 'canvas')
                            if canvas:
                                driver.execute_script("arguments[0].click();", canvas)
                                print("✓ Clicked on canvas with restore tool")
                        else:
                            print("❌ Restore tool not found")
                            
                    except Exception as e:
                        print(f"❌ Error testing restore tool: {e}")
                    
                    # Final screenshot
                    driver.save_screenshot('screenshots/after-tool-testing.png')
                    
                else:
                    print("❌ Could not find refine button")
                    
                    # Check what buttons are available
                    all_buttons = driver.find_elements(By.TAG_NAME, 'button')
                    button_texts = [btn.get_attribute('textContent') or btn.get_attribute('innerText') for btn in all_buttons]
                    button_texts = [text.strip() for text in button_texts if text and text.strip()]
                    print(f"Available buttons: {button_texts}")
                    
                    driver.save_screenshot('screenshots/no-refine-button.png')
                
        except Exception as e:
            print(f"❌ Error during upload process: {e}")
            driver.save_screenshot('screenshots/upload-error.png')
        
        # Check CSS variables for theming
        print("🎨 Checking CSS variables...")
        css_variables = driver.execute_script("""
            var root = document.documentElement;
            var styles = window.getComputedStyle(root);
            var variables = {};
            
            for (var i = 0; i < styles.length; i++) {
                var property = styles[i];
                if (property.startsWith('--')) {
                    variables[property] = styles.getPropertyValue(property);
                }
            }
            
            return variables;
        """)
        
        print("CSS Variables found:")
        for prop, value in css_variables.items():
            if any(keyword in prop for keyword in ['dark', 'border', 'text', 'magic']):
                print(f"  {prop}: {value}")
        
        # Check loaded stylesheets
        print("📄 Checking stylesheets...")
        stylesheets = driver.execute_script("""
            var sheets = [];
            for (var i = 0; i < document.styleSheets.length; i++) {
                var sheet = document.styleSheets[i];
                try {
                    sheets.push({
                        href: sheet.href,
                        rules: sheet.cssRules ? sheet.cssRules.length : 'blocked'
                    });
                } catch (e) {
                    sheets.push({
                        href: sheet.href,
                        error: e.message
                    });
                }
            }
            return sheets;
        """)
        
        print("Loaded stylesheets:")
        for sheet in stylesheets:
            print(f"  {sheet.get('href', 'inline')}: {sheet.get('rules', sheet.get('error', 'unknown'))} rules")
        
        print("✅ Investigation complete!")
        
    except Exception as e:
        print(f"❌ Investigation failed: {e}")
        if driver:
            driver.save_screenshot('screenshots/error.png')
            
    finally:
        if driver:
            driver.quit()
        
        # Clean up test image
        if os.path.exists('test_character.png'):
            os.remove('test_character.png')

if __name__ == "__main__":
    investigate_live_deployment()